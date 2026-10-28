/**
 * The worker, as its own process.
 *
 * Run it beside the API, in a second terminal:
 *
 *     npm run dev      # terminal 1 — the API
 *     npm run worker   # terminal 2 — this
 *
 * These two processes share no memory, no variables and no imports at runtime.
 * They do not know each other's port. The only thing between them is Redis,
 * and that is enough: the API pushes a job, this process pops it, and the
 * events it emits find their way back to whichever API process is listening.
 *
 * Try killing this one while the API keeps running. Click export a few times.
 * Nothing breaks and nothing is lost — the jobs pile up in Redis, the export
 * rows sit on `queued`, and the moment you start this process again they all
 * drain. That is the property you bought by writing the work down instead of
 * doing it inside the request.
 */
import { exportsWorker } from './src/workers/exports.worker.ts';

console.log('Export worker started. Waiting for jobs...');

/**
 * Stop politely when the platform asks.
 *
 * `SIGTERM` is what Render, Docker and Kubernetes send before they shut a
 * process down; they follow it with `SIGKILL` a few seconds later whether you
 * are ready or not. `worker.close()` tells BullMQ to stop taking new jobs and
 * to wait for the ones already running.
 *
 * Without this, a deploy in the middle of an export kills the job halfway.
 * BullMQ would eventually notice the job stalled and retry it, so nothing is
 * lost — but the user waits a lot longer than they needed to, for no reason.
 */
async function shutdown(signal: string) {
  console.log(`${signal} received, finishing current jobs...`);
  await exportsWorker.close();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
