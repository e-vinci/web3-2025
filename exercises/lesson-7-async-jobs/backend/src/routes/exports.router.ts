import { Router, type Request, type Response } from 'express';

import { currentUser, requireAuth, requireAuthQuery } from '../middleware/requireAuth.ts';
import { ExportsService } from '../services/exports.service.ts';
import { exportsQueue, exportsQueueEvents } from '../queues/exports.queue.ts';

const router = Router();

/**
 * Two routes the *browser* requests directly, and their guard, come first.
 *
 * The order is the point: `router.use(requireAuth)` below applies only to
 * routes declared after it, so these two opt out of the header-based guard and
 * take `requireAuthQuery` instead.
 *
 * They have the same problem for the same reason. Everywhere else in this app,
 * your own JavaScript makes the request with `fetch`, and `fetch` can set any
 * header it likes. These two are different: the *browser* makes the request.
 * `new EventSource(url)` takes a URL and nothing else, and a download has to
 * be a real navigation or the file never reaches the Downloads folder. Neither
 * gives you anywhere to put a header, so the token goes in the URL.
 *
 * Worth remembering as a rule rather than two special cases: the moment the
 * browser is the one calling, your headers are gone. See the long note in
 * `middleware/requireAuth.ts` for what that costs.
 */
router.get('/:id/events', requireAuthQuery, streamExportEvents);
router.get('/:id/download', requireAuthQuery, downloadExport);

/** Everything below this line takes its token from the Authorization header. */
router.use(requireAuth);

/**
 * Ask for an export.
 *
 * Read the two lines that matter and then read the status code. We write one
 * row, we add one job, and we answer **202 Accepted** — not 200 OK. 200 means
 * "here is what you asked for". 202 means "I have taken this on, it is not
 * done, here is where to watch it". Using the right one is not pedantry: it is
 * the only thing in the response that tells a client the work is still moving.
 */
router.post('/', async (_req, res) => {
  const { userId } = currentUser(res);

  try {
    const record = await ExportsService.create(userId);

    await exportsQueue.add(
      'export-expenses',
      { exportId: record.id, requesterId: userId },
      // Name the job after the row it works on. There is one queue and one
      // event stream for everybody, so when the stream below hears "job
      // finished" it needs a way to know whether that was *this* export or one
      // of the forty other students'. A predictable id is that way.
      { jobId: jobIdForExport(record.id) }
    );

    res.status(202).json(record);
  } catch (error) {
    console.error('Error requesting an export:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** Every export this user has asked for, newest first. */
router.get('/', async (_req, res) => {
  const { userId } = currentUser(res);

  try {
    res.json(await ExportsService.listForUser(userId));
  } catch (error) {
    console.error('Error listing exports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * One export's current state.
 *
 * The event stream below is how a client learns about changes, but a client
 * that has just loaded the page needs to know where things stand *now* —
 * events only tell you what happened while you were listening.
 */
router.get('/:id', async (req, res) => {
  const { userId } = currentUser(res);
  const record = await ExportsService.getById(Number(req.params.id));

  // Note the single `404` for both "no such export" and "not yours". Telling a
  // stranger that export #12 exists but belongs to someone else is still
  // telling them something.
  if (!record || record.requesterId !== userId) {
    return res.status(404).json({ error: 'Export not found' });
  }

  return res.json(record);
});

/**
 * The finished file.
 *
 * Three different answers, and the difference between the last two is the
 * lesson: `failed` means the work went wrong, `410 Gone` means the work went
 * fine but the hour is up and Redis has dropped the key. The `export` row in
 * PostgreSQL still says `completed`, truthfully — it records that this
 * happened, not that the bytes are still around.
 */
async function downloadExport(req: Request, res: Response) {
  const { userId } = currentUser(res);
  const id = Number(req.params.id);
  const record = await ExportsService.getById(id);

  if (!record || record.requesterId !== userId) {
    return res.status(404).json({ error: 'Export not found' });
  }
  if (record.status !== 'completed') {
    return res.status(409).json({ error: `Export is ${record.status}` });
  }

  const csv = await ExportsService.readCsv(id);
  if (csv === undefined) {
    return res.status(410).json({ error: 'This export has expired. Ask for a new one.' });
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="expenses-${id}.csv"`);
  return res.send(csv);
}

/**
 * The BullMQ job id for one export row.
 *
 * Written once, used by the route that creates the job and by the stream that
 * filters events for it. If these two ever disagreed, the progress bar would
 * simply never move and nothing would look broken.
 */
function jobIdForExport(exportId: number): string {
  return `export-${exportId}`;
}

/** Writes one SSE message. Two newlines end it — one is not enough. */
function sendEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * The event stream: Server-Sent Events.
 *
 * This is an ordinary GET that never ends. The response says
 * `Content-Type: text/event-stream`, the connection stays open, and the server
 * writes a line whenever it has something to say. The browser's `EventSource`
 * understands that format natively — no library on either side.
 *
 * Why this instead of asking "is it done?" every second? Because polling is
 * either slow or wasteful and usually both: poll every 5s and the user waits
 * up to 5s after the work finished; poll every 200ms and 40 students hammer
 * your server with 200 requests a second to say "no" to all of them. Here the
 * server speaks exactly once, at the moment there is news.
 *
 * Note where the news comes from: `exportsQueueEvents`, which is reading a
 * Redis stream. The worker that finished the job never spoke to this request.
 * It wrote to Redis; Redis told this process; this process told the browser.
 * That indirection is what lets the worker live in another process later
 * without a single line of this file changing.
 */
async function streamExportEvents(req: Request, res: Response) {
  const { userId } = currentUser(res);
  const id = Number(req.params.id);
  const record = await ExportsService.getById(id);

  if (!record || record.requesterId !== userId) {
    return res.status(404).json({ error: 'Export not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // Without this, Express buffers the headers until the first flush and the
  // browser sits waiting for a response that has technically already started.
  res.flushHeaders();

  // Tell the client where things stand before streaming changes, so a page
  // that loads after the job finished still gets the answer.
  sendEvent(res, 'status', record);
  if (record.status === 'completed' || record.status === 'failed') {
    return res.end();
  }

  // `exportsQueueEvents` reports on *every* job in this queue -- yours, and
  // everyone else's. There is one stream, not one per request, so the first
  // thing each listener does is ask "is this mine?". Forget that check and
  // every user watches every other user's progress bar.
  const mine = jobIdForExport(id);

  const onProgress = ({ jobId, data }: { jobId: string; data: unknown }) => {
    if (jobId !== mine) return;
    sendEvent(res, 'progress', data);
  };

  const onCompleted = async ({ jobId }: { jobId: string }) => {
    if (jobId !== mine) return;
    // Safe to re-read the row here: the processor writes `completed` to
    // PostgreSQL *before* it returns, and BullMQ only emits once it has
    // returned. The row is therefore already up to date, and it carries
    // `rowCount`, which the event does not.
    sendEvent(res, 'completed', await ExportsService.getById(id));
    cleanup();
    res.end();
  };

  const onFailed = async ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    if (jobId !== mine) return;

    // Reaching here at all means the job is out of attempts: unlike the
    // worker's own `failed` listener, this one fires once, at the end. The
    // retries happened quietly in between.
    //
    // Do *not* re-read the row here, and this is the interesting difference
    // from `completed` above. On failure the row is written by the worker's
    // `failed` listener, which is reacting to the same event as this one with
    // nothing ordering the two. Re-reading would usually find the row still on
    // `running`, drop the event, and leave the browser watching a spinner that
    // never stops. The event already carries what the client needs.
    sendEvent(res, 'failed', { id, status: 'failed', failedReason });
    cleanup();
    res.end();
  };

  exportsQueueEvents.on('progress', onProgress);
  exportsQueueEvents.on('completed', onCompleted);
  exportsQueueEvents.on('failed', onFailed);

  // A heartbeat. Proxies — including Render's — close a connection that has
  // been silent too long, and a comment line (`:` then a newline) is a legal
  // SSE message that means nothing, which is exactly what we want.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 20_000);

  function cleanup() {
    clearInterval(heartbeat);
    exportsQueueEvents.off('progress', onProgress);
    exportsQueueEvents.off('completed', onCompleted);
    exportsQueueEvents.off('failed', onFailed);
  }

  // The listeners above are registered on a long-lived emitter. If we did not
  // remove them when the browser goes away — tab closed, laptop shut — they
  // would pile up on every request until the process ran out of memory. This
  // is the leak that makes streaming endpoints different from normal ones.
  req.on('close', cleanup);

  return undefined;
}

export default router;
