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

  // TODO 2 — the work itself, in order. Every method you need already
  // exists on `ExportsService` or `ExpensesService`; this is about the
  // sequence, not about inventing anything.
  //
  //  1. Mark the export `running`.
  //  2. `await sleep(800)`, then report your first progress — something like
  //     `{ step: 'reading expenses', percent: 10 }`. The sleep is there so a
  //     browser that connects a few milliseconds after the button was
  //     clicked still sees this first update.
  //  3. Read the expenses of `requesterId` from the database.
  //
  //     Read them HERE, not from `job.data`. A job can sit in the queue for
  //     a while, and a copy taken when the button was clicked would be stale
  //     by the time this runs.
  //  4. `await sleep(1500)`, report progress again, and build the CSV.
  //  5. `await sleep(1500)`, report progress once more.
  //  6. Save the result. Write the row count and the file together with the
  //     `completed` status, in ONE call — otherwise there is a moment where
  //     the row says `completed` and the file is not there yet.
  //  7. Return the row count. Whatever you return here becomes the job's
  //     result, which is what the worker logs on success.
  //
  // Do NOT catch errors in here. If something throws, BullMQ has to see it —
  // that is what triggers the retries you configured in TODO 1.
  throw new Error('TODO 2: not implemented');
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
 * Locally this runs as its own process — `node worker.ts` beside
 * `node app.ts` — so that a long job cannot slow down HTTP requests, and so
 * you could run five workers and one API. On Render it is folded into the API
 * process instead, because the free tier has no separate worker instance type.
 * The code does not change either way: a worker finds its jobs through Redis,
 * and does not care which process it lives in.
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

  // TODO 3 — write `failed` to the export row, but only when the job is
  // really finished.
  //
  // The trap: this listener fires after EVERY attempt, not just the last one.
  // With `attempts: 3`, a job that always throws calls it three times, and
  // the first two mean "retrying shortly", not "this did not work".
  //
  // Mark the row failed only on the final attempt — there is a helper for
  // that question in `../queues/exports.queue.ts`:
  //
  //     await ExportsService.setStatus(job.data.exportId, 'failed', {
  //       failedReason: error.message,
  //     });
  //
  // Get this wrong and the user is told their export died while BullMQ is
  // quietly about to run it again and succeed.
  //
  // `job` can be undefined here, so guard for that too.
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
