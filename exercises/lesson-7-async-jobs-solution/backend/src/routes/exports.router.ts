import { Router, type Request, type Response } from 'express';

import { currentUser, requireAuth, requireAuthQuery } from '../middleware/requireAuth.ts';
import { ExportsService } from '../services/exports.service.ts';
import { exportsQueue } from '../queues/exports.queue.ts';

const router = Router();

/**
 * The download route, and its guard, come first: `router.use(requireAuth)`
 * below applies only to routes declared after it, so this one opts out and
 * takes `requireAuthQuery` instead. Same reason as the WebSocket upgrade in
 * `exportSocket.ts` — see exercise 5's "headers are gone" note.
 */
router.get('/:id/download', requireAuthQuery, downloadExport);

/** Everything below this line takes its token from the Authorization header. */
router.use(requireAuth);

/** Ask for an export: write the receipt row, queue the job, answer 202 (see exercise 4). */
router.post('/', async (_req, res) => {
  const { userId } = currentUser(res);

  try {
    const record = await ExportsService.create(userId);

    await exportsQueue.add(
      'export-expenses',
      { exportId: record.id, requesterId: userId },
      { jobId: jobIdForExport(record.id) }  // see jobIdForExport below
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

/** One export's current state — the WebSocket only tells you what happens next, not what already happened. */
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
 * The socket server derives the export id back out of this (see
 * `realtime/exportSocket.ts`). If the two ever disagreed about the format, the
 * progress bar would simply never move and nothing would look broken.
 */
function jobIdForExport(exportId: number): string {
  return `export-${exportId}`;
}


export default router;
