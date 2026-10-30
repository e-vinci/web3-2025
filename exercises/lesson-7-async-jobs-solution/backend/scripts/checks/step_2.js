// Checks TODO 1: are the queue's defaultJobOptions actually set?
//
// This only inspects the Queue instance's configuration — it does not need
// Redis to be reachable, so it works the moment you save the file.
const { exportsQueue } = await import('../../src/queues/exports.queue.ts');
const o = exportsQueue.defaultJobOptions ?? {};

const checks = [
  ['attempts is 3', o.attempts === 3],
  ['backoff is exponential', o.backoff?.type === 'exponential'],
  ['backoff has a delay', typeof o.backoff?.delay === 'number'],
  ['removeOnComplete is set', o.removeOnComplete !== undefined],
  ['removeOnFail is set', o.removeOnFail !== undefined],
];

console.log('defaultJobOptions:', JSON.stringify(o));
let ok = true;
for (const [label, pass] of checks) {
  console.log(pass ? '  ✓' : '  ✗', label);
  if (!pass) ok = false;
}

if (!ok) {
  console.error('\nTODO 1 is not finished yet.');
  process.exit(1);
}
console.log('\nTODO 1 looks correct.');
process.exit(0);
