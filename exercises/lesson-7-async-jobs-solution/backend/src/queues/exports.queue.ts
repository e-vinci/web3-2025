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
    // Try three times before giving up, waiting longer after each failure
    // (1s, then 2s, then 4s). This is the single most valuable thing a queue
    // gives you over calling the function directly: a transient failure — the
    // database blinked, the network dropped — stops being a lost request.
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },

    // Redis is memory. Left alone, every finished job stays in it forever and
    // the instance slowly fills up. Keep the last hour of successes so you can
    // inspect them, and the last 100 failures so you can debug them.
    removeOnComplete: { age: 3600 },
    removeOnFail: { count: 100 },
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
 * The *worker* needs this and the event stream does not, which is worth
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
