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
    // TODO 1 — four options, all in the BullMQ "Jobs" guide:
    // https://docs.bullmq.io/guide/jobs
    //
    //   1. attempts: retry a throwing job, 3 total.
    //   2. backoff: wait longer each time, starting ~1s (exponential).
    //   3. removeOnComplete: drop finished jobs after an hour (see exercise 2
    //      for why this one is not optional).
    //   4. removeOnFail: keep only the last 100 failed jobs.
    //
    // Do NOT set a `delay` — jobs should start as soon as a worker is free.
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
 * `worker.on('failed')` fires after every attempt; `queueEvents.on('failed')`
 * fires once, at the end. This answers the first — see the worker's own
 * `on('failed')` handler for why that distinction matters.
 */
export function isFinalAttempt(job: Job): boolean {
  return job.attemptsMade >= (job.opts.attempts ?? 1);
}
