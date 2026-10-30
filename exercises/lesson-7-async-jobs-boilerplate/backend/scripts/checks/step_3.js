// Checks TODO 2: does the worker actually process a job end to end?
//
// This enqueues one real job and starts a throwaway worker to process it —
// the same `exportsQueue`/`exportsWorker` your app uses, just run here for a
// few seconds instead of in a second terminal. Needs Postgres and Redis up
// (exercise 1) and the database seeded (`node scripts/db-populate.ts`).
//
// It does NOT check TODO 3 (the retry/failure guard) — "break it on purpose"
// later in exercise 5 is where you see that one happen.
import { ExportsService } from '../../src/services/exports.service.ts';
import { exportsQueue } from '../../src/queues/exports.queue.ts';
import { exportsWorker } from '../../src/workers/exports.worker.ts';

const REQUESTER_ID = 1; // john.doe@example.com, from db-populate.ts

function fail(message) {
  console.error(`✗ ${message}`);
  console.error('\nTODO 2 is not finished yet.');
  process.exit(1);
}

const record = await ExportsService.create(REQUESTER_ID);
await exportsQueue.add('export-expenses', { exportId: record.id, requesterId: REQUESTER_ID });
console.log(`Queued export #${record.id}. Waiting for the worker to process it...`);

const deadline = Date.now() + 15_000;
let final;
while (Date.now() < deadline) {
  final = await ExportsService.getById(record.id);
  if (final?.status === 'completed' || final?.status === 'failed') break;
  await new Promise((resolve) => setTimeout(resolve, 500));
}

await exportsWorker.close();
await exportsQueue.close();

if (!final || (final.status !== 'completed' && final.status !== 'failed')) {
  fail(`export #${record.id} is still "${final?.status}" after 15s. Check the output above for an error, and make sure no other worker process is already running against this queue.`);
}
if (final.status === 'failed') {
  fail(`export #${record.id} failed: ${final.failedReason}`);
}
if (typeof final.rowCount !== 'number') fail('rowCount was not set');
if (!final.csv || !final.csv.startsWith('"id","date"')) fail('csv was not built correctly');

console.log('  ✓ status became "completed"');
console.log(`  ✓ rowCount is set (${final.rowCount})`);
console.log('  ✓ csv looks like a real CSV');
console.log('\nTODO 2 looks correct.');
process.exit(0);
