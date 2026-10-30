import 'dotenv/config';
import IORedis from 'ioredis';

/**
 * The second database (see exercise 1 for why it exists at all). Here it does
 * two jobs:
 *
 *   1. It **is** the queue — pending work, written by the API, popped by the
 *      worker.
 *   2. It carries **events** between them — the worker reports progress,
 *      BullMQ writes that to a Redis stream, this process reads it to reach
 *      the WebSocket.
 *
 * The facts — including the finished file — stay in PostgreSQL.
 */
const REDIS_URL = process.env['REDIS_URL'] || 'redis://localhost:6379';

/**
 * Builds a new Redis connection — one per blocking consumer (Worker,
 * QueueEvents), see exercise 1 for why. `maxRetriesPerRequest: null` is
 * required by BullMQ; without it this throws at construction.
 */
export function createRedisConnection(): IORedis {
  return new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
}

/**
 * The one ordinary (non-blocking) client, for plain GET/SET/EXPIRE work.
 *
 * This one is shared, because normal commands return immediately and queue up
 * behind each other happily.
 */
export const redis = createRedisConnection();
