import { Router, type Request, type Response } from 'express';

import { currentUser, requireAuth, requireAuthQuery } from '../middleware/requireAuth.ts';
import { ExportsService } from '../services/exports.service.ts';
import { exportsQueue } from '../queues/exports.queue.ts';

const router = Router();

/**
 * The download route, and its guard, come first.
 *
 * The order is the point: `router.use(requireAuth)` below applies only to
 * routes declared after it, so this one opts out of the header-based guard and
 * takes `requireAuthQuery` instead.
 *
 * Why it has to: everywhere else in this app your own JavaScript makes the
 * request with `fetch`, and `fetch` can set any header it likes. A download is
 * different — it has to be a real browser navigation or the file never reaches
 * the Downloads folder, and a navigation has nowhere to put an `Authorization`
 * header. So the token goes in the URL.
 *
 * The WebSocket in `src/realtime/exportSocket.ts` has the same problem for the
 * same reason. Worth remembering as a rule rather than two special cases: the
 * moment the browser is the one calling, your headers are gone. See the note
 * in `middleware/requireAuth.ts` for what that costs.
 */
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
 * Note the `409` when the export is not finished yet. A client that asks for
 * the file of a job that is still running has not made an error exactly — it
 * has asked too early, and the status code says which.
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

  const csv = record.csv ?? '';

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


export default router;
