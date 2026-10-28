import 'dotenv/config';
import IORedis from 'ioredis';

/**
 * The second database.
 *
 * Until now this application had one place to put things: PostgreSQL. It is
 * the right place for expenses, users and transfers — rows you must never
 * lose, that you query by their relationships, and that outlive the server
 * that wrote them.
 *
 * Redis is not a replacement for that, and using it as one would be a mistake.
 * It holds a different kind of data: small, hot, and *disposable*. In this
 * lesson it does three jobs PostgreSQL would do badly:
 *
 *   1. It is the job queue (lists of pending work, popped by workers).
 *   2. It carries the "this job finished" events between processes.
 *   3. It stores finished CSV files under a key that deletes itself.
 *
 * The third one is the clearest illustration. `SET key value EX 3600` means
 * "keep this for an hour, then forget it". There is no `DELETE FROM` to run
 * and no cron job to write — expiry is a property of the key. Postgres has no
 * cheap equivalent, and that is the whole reason both databases are here.
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
