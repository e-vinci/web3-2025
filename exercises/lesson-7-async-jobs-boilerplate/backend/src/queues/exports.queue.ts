import { Queue, QueueEvents, type Job } from 'bullmq';

import { createRedisConnection } from '../redis.ts';

/**
 * The queue is just a name.
 *
 * `EXPORTS_QUEUE` is a string, and everything that wants to talk about this
 * work — the route that adds jobs, the worker that runs them, the events
 * stream the API listens to — agrees on that one string. Get it wrong by a
 * character and you have two queues, one of which nobody is watching. So it is
 * written down once, here, and imported everywhere else.
 */
export const EXPORTS_QUEUE = 'exports';

/** What a job in this queue carries. Deliberately tiny — see the note below. */
export interface ExportJobData {
  exportId: number;
  requesterId: number;
}

/**
 * The producer side: what the HTTP route uses to add work.
 *
 * Note what a job payload does *not* contain: the user's expenses. A job is a
 * note saying "export #12 needs doing", not a copy of the data. The worker
 * reads the data fresh from PostgreSQL when it gets there. That matters,
 * because a job can sit in the queue for a while, and a stale copy of the
 * expenses would be a bug that only shows up under load.
 */
export const exportsQueue = new Queue<ExportJobData>(EXPORTS_QUEUE, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    // TODO 1 — the options that make this a queue rather than a to-do list.
    //
    // Add four, all documented at https://docs.bullmq.io/guide/jobs :
    //
    //   attempts         how many times to run a job that throws, before
    //                    giving up. Use 3.
    //   backoff          how long to wait between those attempts. Use an
    //                    exponential backoff starting at 1000 ms, so the
    //                    gaps are roughly 1s, 2s, 4s rather than three
    //                    retries in the same half-second.
    //   removeOnComplete keep finished jobs for 3600 seconds, then drop them.
    //   removeOnFail     keep the last 100 failed jobs, and drop older ones.
    //
    // Why the last two are not housekeeping: Redis is memory. Without them
    // every job you ever ran stays in it forever, and the free Render
    // instance you deploy to at the end of this lesson is 25 MB.
    //
    // Do NOT set a `delay` here — jobs should start as soon as a worker is
    // free.
  },
});

/**
 * The listening side.
 *
 * `QueueEvents` is how one process hears about work that happened in another.
 * It reads a Redis *stream* that every worker writes to, which means the API
 * process learns that export #12 finished even though it was a different
 * process — possibly on a different machine — that actually did the work.
 *
 * This is the "pub/sub" half of the lesson, and it is why the browser can be
 * told the moment a job ends instead of asking "are you done yet?" every
 * second. It needs its own connection: it sits inside a blocking read.
 */
export const exportsQueueEvents = new QueueEvents(EXPORTS_QUEUE, {
  connection: createRedisConnection(),
});

/**
 * Has this job run out of attempts?
 *
 * The *worker* needs this and the socket server does not, which is worth
 * understanding because the two look like the same event and are not:
 *
 *   - `worker.on('failed')` fires after **every** attempt. A job with
 *     `attempts: 3` that throws three times calls it three times, and the
 *     first two mean "retrying shortly", not "this did not work".
 *   - `queueEvents.on('failed')` fires **once**, when the job runs out of
 *     attempts and lands in the failed set. Between attempts the job moves to
 *     `delayed`, which is not a failure anyone needs to hear about.
 *
 * So the guard belongs in the worker. Writing the export row on the first
 * attempt would mark a job failed that is about to succeed on its second try.
 */
export function isFinalAttempt(job: Job): boolean {
  return job.attemptsMade >= (job.opts.attempts ?? 1);
}
