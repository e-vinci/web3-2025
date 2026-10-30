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

  // TODO 2 — the sequence (every method already exists on `ExportsService`
  // or `ExpensesService`; this is about order, not invention):
  //
  //  1. Mark the export `running`.
  //  2. `await sleep(800)`, report `{ step: 'reading expenses', percent: 10 }`.
  //  3. Read the expenses of `requesterId` from the database (not `job.data`
  //     — see the docblock above).
  //  4. `await sleep(1500)`, report `{ step: 'building the file', percent: 60 }`,
  //     build the CSV.
  //  5. `await sleep(1500)`, report `{ step: 'storing the file', percent: 90 }`.
  //  6. Save rowCount + csv together with status `completed`, in ONE call.
  //  7. Return `{ rowCount }`.
  //
  // Do NOT catch errors here — BullMQ must see the throw to retry (TODO 1).
  throw new Error('TODO 2: not implemented');
}

/**
 * The worker itself. `concurrency: 2` — never more than two exports at once
 * (see exercise 3 for why that number matters).
 *
 * Locally this runs as its own process, `node worker.ts` beside `node app.ts`.
 * On Render it is folded into the API process instead (see exercise 6). The
 * code does not change either way: a worker finds its jobs through Redis, and
 * does not care which process it lives in.
 */
export const exportsWorker = new Worker<ExportJobData>(EXPORTS_QUEUE, processExportJob, {
  connection: createRedisConnection(),
  concurrency: 2,
});

/** Fires after every attempt, including ones about to be retried (see TODO 3 / exercise 3). */
exportsWorker.on('failed', async (job, error) => {
  console.error(`Export job ${job?.id} failed (attempt ${job?.attemptsMade}):`, error.message);

  // TODO 3 — mark the row failed, but only on the final attempt.
  // Use `isFinalAttempt` from `../queues/exports.queue.ts`; `job` can be
  // undefined, guard for that too:
  //
  //     await ExportsService.setStatus(job.data.exportId, 'failed', {
  //       failedReason: error.message,
  //     });
});

/**
 * Say something on success, so the terminal running this worker shows its
 * work. Without it a healthy worker prints nothing at all after startup,
 * which looks exactly like a broken one.
 */
exportsWorker.on('completed', (job, result) => {
  console.log(`Export job ${job.id} completed:`, result);
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
