import { Worker, type Job } from 'bullmq';

import { createRedisConnection } from '../redis.ts';
import { EXPORTS_QUEUE, isFinalAttempt, type ExportJobData } from '../queues/exports.queue.ts';
import { ExportsService } from '../services/exports.service.ts';
import { ExpensesService } from '../services/expenses.service.ts';

/**
 * Stands in for work that is genuinely slow.
 *
 * Be honest with yourself about this line: building a CSV from a few hundred
 * rows takes milliseconds, so on its own this feature would not need a queue
 * at all. Real report jobs are slow for reasons we are not going to build
 * today — rendering a PDF, calling a currency API once per row, scanning two
 * years of history. The sleep buys you those seconds so you can *see* the
 * queue working, and so the progress events have something to report.
 *
 * It is the one fake thing in this exercise. Everything around it is real.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The consumer side: the function that actually does the work.
 *
 * Three things to notice.
 *
 * First, it takes a `Job`, not an HTTP request. There is no `res` to write to
 * and nobody waiting on the other end of a socket — the user got their answer
 * seconds ago. That is the entire point of a queue.
 *
 * Second, it reads the expenses itself rather than receiving them in the job
 * payload, so the report reflects the database now, not whenever the button
 * was clicked.
 *
 * Third, it reports progress. `job.updateProgress()` writes to Redis, and
 * every `QueueEvents` listener in every process hears it. That is what makes
 * the progress bar in the browser possible.
 */
async function processExportJob(job: Job<ExportJobData>): Promise<{ rowCount: number }> {
  const { exportId, requesterId } = job.data;

  await ExportsService.setStatus(exportId, 'running');

  // A beat before the first progress event, so a browser that opens the event
  // stream a few milliseconds after clicking the button still sees it. Without
  // it the first update is already in the past by the time anyone is listening.
  await sleep(800);
  await job.updateProgress({ step: 'reading expenses', percent: 10 });

  const expenses = await ExpensesService.getExpensesOfUser(requesterId);
  await sleep(1500); // see the note on `sleep` above

  await job.updateProgress({ step: 'building the file', percent: 60 });
  const csv = ExportsService.buildCsv(expenses);
  await sleep(1500);

  await job.updateProgress({ step: 'storing the file', percent: 90 });
  await ExportsService.storeCsv(exportId, csv);

  await ExportsService.setStatus(exportId, 'completed', { rowCount: expenses.length });

  // Whatever this returns becomes `returnvalue` on the `completed` event, so
  // a listener learns the outcome without going back to the database.
  return { rowCount: expenses.length };
}

/**
 * The worker itself.
 *
 * `concurrency: 2` means this process will run two export jobs at once and no
 * more. That number is a promise to the rest of your system: however long the
 * queue gets, this worker will never open a third database connection for
 * exports or claim a third slice of CPU. A queue without a concurrency limit
 * is just a slower way to fall over.
 *
 * In production this file would be its own process — `node worker.ts` beside
 * `node app.ts` — so that a long job cannot slow down HTTP requests, and so
 * you can run five workers and one API. We start it inside the API process
 * here because Render's free tier has no separate worker instance type. The
 * code does not change: a worker finds its jobs through Redis, and does not
 * care which process it lives in.
 */
export const exportsWorker = new Worker<ExportJobData>(EXPORTS_QUEUE, processExportJob, {
  connection: createRedisConnection(),
  concurrency: 2,
});

/**
 * Fires after every attempt -- including the ones BullMQ is about to retry.
 *
 * The guard is the whole point. Without it, the first throw would write
 * `failed` to the export row and the user would be told the job died while
 * BullMQ was quietly about to run it again and succeed. Without the listener
 * at all, a genuinely dead job would leave the row on `running` forever and
 * the user would watch a spinner that never stops.
 */
exportsWorker.on('failed', async (job, error) => {
  console.error(`Export job ${job?.id} failed (attempt ${job?.attemptsMade}):`, error.message);
  if (!job || !isFinalAttempt(job)) return;

  await ExportsService.setStatus(job.data.exportId, 'failed', {
    failedReason: error.message,
  });
});

/**
 * An `error` listener is not optional.
 *
 * An EventEmitter with no `error` listener rethrows, and in Node that takes
 * the whole process down. A blip in the Redis connection should not kill your
 * API server.
 */
exportsWorker.on('error', (error) => {
  console.error('Export worker error:', error.message);
});
