import type { Server } from 'node:http';

import { WebSocketServer, type WebSocket } from 'ws';

import { AuthService } from '../services/auth.service.ts';
import { exportsQueueEvents } from '../queues/exports.queue.ts';

/**
 * Pushes export progress to the browser over a WebSocket.
 *
 * Notice where the news comes from: `exportsQueueEvents`, which is reading a
 * Redis stream. The worker that reported the progress is a different process
 * and never spoke to this one. It wrote to Redis; Redis told this process;
 * this process tells the browser.
 *
 * That indirection is the whole point. The queue and the worker do not know
 * this file exists, so the last hop to the browser could be swapped for
 * something else entirely without touching either of them.
 */
export function attachExportSocket(server: Server): WebSocketServer {
  // `noServer: true` means "do not open a port of your own". Express keeps the
  // HTTP server and we borrow its upgrade requests, so the socket answers on
  // the same port as the API.
  //
  // Note what that does NOT give you: the `cors()` middleware in app.ts never
  // runs here. CORS is enforced by the browser on HTTP requests, and a
  // WebSocket upgrade is not one — `ws` will happily accept a connection from
  // any origin unless you check `request.headers.origin` yourself. The token
  // below is what actually protects this endpoint.
  const wss = new WebSocketServer({ noServer: true });

  // Who is connected, and who are they? An HTTP route gets this for free: each
  // request has its own handler, with `userId` sitting in scope. A socket
  // outlives any one request, so the identity has to be remembered somewhere.
  const viewers = new Map<WebSocket, number>();

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (url.pathname !== '/ws/exports') return;

    // Third time this lesson: the browser is making the request, so there is
    // nowhere to put an Authorization header. Same compromise, same reasons.
    const token = url.searchParams.get('token') ?? '';

    let userId: number;
    try {
      userId = AuthService.verifyToken(token).userId;
    } catch {
      // A rejected upgrade is a raw HTTP response written to the socket. There
      // is no `res` here yet — the connection has not become a WebSocket.
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (client) => {
      viewers.set(client, userId);
      client.on('close', () => viewers.delete(client));
      wss.emit('connection', client, request);
    });
  });

  /** Sends one message to one user's open sockets — see `viewers` above. */
  function sendToUser(userId: number, payload: unknown): void {
    const text = JSON.stringify(payload);
    for (const [client, viewerId] of viewers) {
      if (viewerId === userId && client.readyState === client.OPEN) {
        client.send(text);
      }
    }
  }

  // The job id carries the export id (`export-12`), and the export id is all
  // we need to find out who owns it.
  const exportIdFromJobId = (jobId: string): number => Number(jobId.replace('export-', ''));

  async function ownerOf(jobId: string): Promise<number | undefined> {
    const { ExportsService } = await import('../services/exports.service.ts');
    const record = await ExportsService.getById(exportIdFromJobId(jobId));
    return record?.requesterId;
  }

  exportsQueueEvents.on('progress', async ({ jobId, data }) => {
    const userId = await ownerOf(jobId);
    if (userId !== undefined) {
      sendToUser(userId, { type: 'progress', exportId: exportIdFromJobId(jobId), data });
    }
  });

  exportsQueueEvents.on('completed', async ({ jobId }) => {
    const userId = await ownerOf(jobId);
    if (userId !== undefined) {
      sendToUser(userId, { type: 'completed', exportId: exportIdFromJobId(jobId) });
    }
  });

  exportsQueueEvents.on('failed', async ({ jobId, failedReason }) => {
    const userId = await ownerOf(jobId);
    if (userId !== undefined) {
      sendToUser(userId, {
        type: 'failed',
        exportId: exportIdFromJobId(jobId),
        failedReason,
      });
    }
  });

  return wss;
}
