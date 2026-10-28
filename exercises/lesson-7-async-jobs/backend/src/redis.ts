import 'dotenv/config';
import IORedis from 'ioredis';

/**
 * The second database.
 *
 * Until now this application had one place to put things: PostgreSQL. It is
 * the right place for expenses, users and exports — rows you must never lose,
 * that you query by their relationships, and that outlive the server that
 * wrote them.
 *
 * Redis is not a faster Postgres, and using it as one is a mistake. It holds a
 * different kind of thing: state that coordinates *processes*, and that nobody
 * needs once the work is done. Here it does exactly two jobs:
 *
 *   1. It **is** the queue — the list of pending work, written by the API and
 *      popped by the worker.
 *   2. It carries the **events** between them: when the worker reports
 *      progress, that has to cross a process boundary to reach the WebSocket
 *      the API is holding open. BullMQ writes those to a Redis stream, and
 *      every listening process reads them.
 *
 * Both are about two programs agreeing on something while neither can see the
 * other's memory. Neither is about storing facts — the facts, including the
 * finished file, stay in PostgreSQL.
 */
const REDIS_URL = process.env['REDIS_URL'] || 'redis://localhost:6379';

/**
 * Builds a new Redis connection.
 *
 * Why a factory and not one shared client? Because BullMQ's Worker and
 * QueueEvents spend their lives inside *blocking* commands — they ask Redis
 * "give me the next job, and do not answer until there is one". A connection
 * parked on a blocking command cannot run anything else, so each needs its
 * own.
 *
 * Hand BullMQ a single shared client and it will quietly duplicate it for you
 * rather than break, so this is about being explicit about how many
 * connections you are opening, not about avoiding a crash.
 *
 * `maxRetriesPerRequest: null` is not optional, though. ioredis otherwise
 * gives up on a command after 20 retries, which is exactly wrong for a
 * blocking read that is *supposed* to wait — and BullMQ refuses to start
 * without it, throwing at construction rather than misbehaving later.
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
