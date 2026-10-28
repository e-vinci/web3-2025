import type { Server } from 'node:http';

import { WebSocketServer, type WebSocket } from 'ws';

import { AuthService } from '../services/auth.service.ts';
import { exportsQueueEvents } from '../queues/exports.queue.ts';

/**
 * The same notifications as the SSE route, over a WebSocket instead.
 *
 * This is the finished state of the optional "swap SSE for WebSockets"
 * exercise. Both transports run side by side here so you can compare them;
 * a real application would pick one.
 *
 * Read it next to `routes/exports.router.ts` and notice how little differs.
 * The queue, the worker and `QueueEvents` are untouched — only the last hop
 * to the browser changed. That is the payoff of putting Redis between the
 * producer and the consumer: the transport is replaceable.
 */
export function attachExportSocket(server: Server): WebSocketServer {
  // `noServer: true` means "do not open a port of your own". Express keeps the
  // HTTP server; we borrow its upgrade requests. One port, one origin, and the
  // same CORS story as the rest of the API.
  const wss = new WebSocketServer({ noServer: true });

  // Who is connected, and who are they? A WebSocket has no per-request handler
  // to close over, so the identity has to be remembered somewhere — unlike the
  // SSE route, where `userId` is just a local variable.
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

  /**
   * Sends one message to one user's open sockets.
   *
   * The SSE version never needed this: each request was its own stream, so
   * filtering happened naturally. Here there is one server and many sockets,
   * so "who should see this?" becomes something you have to answer by hand —
   * and forgetting to is how one user ends up watching another user's work.
   */
  function sendToUser(userId: number, payload: unknown): void {
    // TODO 5 — send `payload` to this user's sockets, and to nobody else's.
    //
    // `viewers` is a `Map<WebSocket, number>`: every open socket, and the id
    // of the user behind it. Walk it, and for each entry send the payload
    // only when BOTH are true:
    //
    //   - the socket belongs to `userId`
    //   - the socket is still open (`client.readyState === client.OPEN`) —
    //     sending to a closing socket throws
    //
    // Send `JSON.stringify(payload)`; a WebSocket frame is text, not objects.
    //
    // This is the filtering an HTTP route got for free. There, each request
    // had its own handler and its own `userId` in scope. Here one server
    // holds every socket, so "who should see this?" is a question you have to
    // answer by hand — and forgetting to is how one student ends up watching
    // another student's export.
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
