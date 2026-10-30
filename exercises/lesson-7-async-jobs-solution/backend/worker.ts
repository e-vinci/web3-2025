/**
 * The worker, as its own process. Run it beside the API, in a second terminal:
 *
 *     npm run dev      # terminal 1 — the API
 *     npm run worker   # terminal 2 — this
 *
 * Shares nothing with the API but Redis — see exercise 4 for what that buys you.
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
