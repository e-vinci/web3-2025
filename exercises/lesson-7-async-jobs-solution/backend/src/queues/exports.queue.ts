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
    // See exercise 2 for why these four matter, not just what they do.
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
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
 * `worker.on('failed')` fires after every attempt; `queueEvents.on('failed')`
 * fires once, at the end. This answers the first — see the worker's own
 * `on('failed')` handler for why that distinction matters.
 */
export function isFinalAttempt(job: Job): boolean {
  return job.attemptsMade >= (job.opts.attempts ?? 1);
}
