---
title: 'Lesson 7: Work That Takes Too Long'
description: 'Move slow work out of the request with a Redis-backed job queue, and push the result to the browser the moment it is ready.'
publishDate: 2026-10-30T00:00:00Z
excerpt: 'Learn why one database is not enough, how a job queue changes what an HTTP request promises, and how Server-Sent Events replace polling.'
tags:
  - async
  - background-jobs
  - bullmq
  - redis
  - valkey
  - queues
  - server-sent-events
  - express
  - react
  - typescript
  - course
  - web3-2025

category: 'course-lesson'
---

## Course material

- [Presentation Slides](https://raw.githubusercontent.com/e-vinci/web3-2025/refs/heads/main/src/slides/lesson-7-theory.pptx)

## Introduction

Every route you have written so far makes the same promise: *wait, and I will
give you the answer*. The browser asks, the server works, the browser gets the
result. One request, one answer.

That promise breaks the moment the work takes real time.

Think about what your server does today when a request takes thirty seconds.
It holds a socket open for thirty seconds. The browser shows a spinner for
thirty seconds. If the user closes the tab, the work is lost. If the server
restarts, the work is lost. If two hundred people click at once, you have two
hundred of these at the same time, and the rest of your app — the pages that
*are* fast — slows to a crawl behind them.

The fix is not to make the work faster. Sometimes you cannot. The fix is to
**stop making that promise**. The server says "I have written this down, go
away, I will tell you when it is done" and answers in twenty milliseconds.

That changes three things, and each one is a part of today's lesson:

1. The work has to be **written down somewhere** a different process can pick
   it up. That is a **job queue**.
2. That somewhere is not your PostgreSQL database. It is **Redis**, and the
   reason why is the most useful idea in this lesson.
3. The browser now needs to be **told** when the work finishes, instead of
   asking over and over. That is **Server-Sent Events**.

By the end you will have an "Export my expenses" button that answers
immediately, a worker that builds the file in the background, and a progress
bar that moves because the server is pushing to it — not because the browser is
asking.

## Objectives

By the end of this lesson you should be able to:

- Explain why a long task does not belong inside an HTTP request.
- Say what Redis is for, and what it is **not** for, in one sentence each.
- Put a job on a queue and process it in a worker, with retries and a
  concurrency limit, running as a separate process.
- Tell the difference between "this failed" and "this is about to be retried".
- Stream events to a browser with Server-Sent Events, and clean up after them.
- Deploy all of it to Render.

## If you fall behind

These exercises build on Lesson 6. You should have a working backend with
GraphQL and JWT authentication, and a React frontend with a login page.

If you do not, start from `exercises/lesson-6-when-things-go-wrong/` in the
course repository. It is the finished Lesson 6, and everything below assumes
exactly that starting point.

## Recommended Reading

Read the first two before the exercises. The rest are there for when you get
stuck on that specific thing.

1. [BullMQ — What is BullMQ, Queues, and Workers](https://docs.bullmq.io/) —
   the three guide pages "Queues", "Workers" and "Events". About 15 minutes,
   and it covers most of what you will write today.
2. [MDN — Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) —
   both halves, the server format and the `EventSource` API.
3. [Redis — an introduction to data types](https://redis.io/docs/latest/develop/data-types/) —
   skim it. You only need strings and expiry today, but seeing the list of what
   else is there is what makes Redis stop feeling like "a cache".
4. [MDN — 202 Accepted](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/202) —
   one short page about one status code. This whole lesson depends on it.
5. [Render — Key Value](https://render.com/docs/key-value) — for the deployment
   exercise at the end.

## Exercises

> **Starting Point:** these exercises build on the code from Lesson 6. If you
> have not finished it, use `exercises/lesson-6-when-things-go-wrong/` as your
> starting point.

### 0. Feel the problem first (~10 min)

Before building anything, make your own server do the bad thing. In
`backend/app.ts`, next to the `/ping` route, add this:

```ts
app.get('/slow', async (_req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 15_000));
  res.json({ done: true });
});
```

Restart the backend. Now open **two** terminals.

In the first:

```bash
curl http://localhost:3000/slow
```

While that one is hanging, in the second:

```bash
curl http://localhost:3000/ping
```

> **&#10067; Predict first.** Before you run the second command, write down one
> word: does `/ping` answer **immediately**, or does it wait for `/slow` to
> finish?

Now run it.

It answers immediately — Node handles other requests while one is waiting on a
timer. So far, so good. Now change the slow route to be slow in the other way:

```ts
app.get('/slow', (_req, res) => {
  const stop = Date.now() + 15_000;
  while (Date.now() < stop) {
    // busy: this is what real CPU work looks like to Node
  }
  res.json({ done: true });
});
```

Restart, and run the same two commands again.

This time `/ping` waits. **Your whole server is frozen for fifteen seconds**,
for every user, because one request is doing real work on the single thread
that serves all of them.

> **&#9888; This is the lesson in one experiment.** Waiting on a timer or a
> database is cheap — Node is good at that. Doing *work* is not. And even the
> cheap kind still holds a socket open, still dies if the server restarts, and
> still leaves the user staring at a spinner. A queue fixes all four problems
> at once.

Delete the `/slow` route before you move on. It has done its job.

### 1. A second database (~15 min)

Open `backend/docker-compose.yml`. It has one service: PostgreSQL. Add a
second one:

```yaml
  # The second database, and the reason this lesson exists.
  #
  # Version 8 rather than the newest one, on purpose: it is what Render's Key
  # Value service runs, and a local setup that matches production is worth
  # more than a local setup that is current.
  valkey:
    image: valkey/valkey:8-alpine
    restart: always
    ports:
      - '6379:6379'
```

Then start it and check it answers before you write any code against it:

```bash
# from backend/
docker compose up -d
docker compose exec valkey valkey-cli ping
```

You should see `PONG`.

Add the connection string to `backend/.env` and to `backend/.env.example`:

```bash
REDIS_URL="redis://localhost:6379"
```

Install the two libraries you will need:

```bash
# from backend/
npm install bullmq ioredis
```

You will see a warning about `msgpackr-extract` and install scripts. It is an
optional native speed-up for one of BullMQ's dependencies. Everything works
without it, and you can ignore it.

> **&#10067; Why is this called Valkey and not Redis?** Redis changed its
> licence in 2024. The people who had been maintaining it forked the last
> open-source version and called it Valkey. That fork is what most managed
> "Redis" services now actually run, including Render's. It speaks the same
> protocol, so every command and every client in this lesson is identical
> either way. When this lesson says "Redis" it means the protocol, not the
> company.

Now create `backend/src/redis.ts`:

```ts
import 'dotenv/config';
import IORedis from 'ioredis';

const REDIS_URL = process.env['REDIS_URL'] || 'redis://localhost:6379';

/**
 * Builds a new Redis connection.
 */
export function createRedisConnection(): IORedis {
  return new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
}

/** The one ordinary (non-blocking) client, for plain GET/SET/EXPIRE work. */
export const redis = createRedisConnection();
```

Two details in that file are not decoration.

**`maxRetriesPerRequest: null` is required by BullMQ.** By default `ioredis`
gives up on a command after 20 retries. A worker asking Redis "give me the next
job, and do not answer until there is one" is *supposed* to wait, possibly for
hours.

Leave the line out and BullMQ refuses to start at all:

```
BullMQ: Your redis options maxRetriesPerRequest must be null.
```

That is good behaviour. It crashes loudly at startup instead of running for a
week and then quietly stalling.

**It is a factory, not one shared client.** A connection parked on a blocking
command cannot run anything else, and `Worker` and `QueueEvents` both live
inside blocking reads. If you hand BullMQ one shared client it will duplicate
it for you rather than break — so this is about being explicit about how many
connections you open, not about avoiding a crash.

> **&#9888; Stop and name what you just added.** You now have two databases.
> Before you write another line, write down what goes in each one. On paper. If your answer is "Postgres for important things, Redis for fast
> things", that is the wrong model and the next exercise will not make sense.
>
> The real split is **how long the data must live**. PostgreSQL holds facts
> that must survive forever: this expense happened, this user exists. Redis
> holds things that are *meant* to disappear: work that is pending right now,
> an event that was interesting for one second, a file nobody will want in an
> hour. Redis is not a faster Postgres. It is a different promise.

### 2. Write down that someone asked (~15 min)

A user clicks "export". The work has not happened yet. But something must exist
immediately, or there is nothing to show them and nothing to come back to.

That something is a row. Add it to `backend/src/prisma/contract.prisma`:

```prisma
model Export {
  id           Int               @id @default(autoincrement())
  requester    User              @relation(fields: [requesterId], references: [id])
  requesterId  Int
  status       String            @default("queued")
  rowCount     Int?
  failedReason String?
  createdAt    TimestamptzString @default(now())

  @@map("export")
}
```

And give `User` the other side of the relation, next to `transfersIn`:

```prisma
  exports              Export[]
```

> **&#10067; Look at what this table does not have.** There is no column for
> the CSV. This row is the **receipt**, not the goods — it records that someone
> asked and how it turned out. The file itself will live somewhere else, and
> deciding that now is what the rest of the lesson hangs on.

Generate and apply the migration:

```bash
# from backend/
npx prisma contract emit
npx prisma migration plan --name add_export_table
npx prisma db migrate
```

Check the table exists before you carry on. Then create
`backend/src/types/export.ts` — same shape as every other module in that
folder: the schema, the type, the mapper.

```ts
import { z } from 'zod';

export const exportStatusSchema = z.enum(['queued', 'running', 'completed', 'failed']);

export const exportSchema = z.object({
  id: z.number().int().positive(),
  requesterId: z.number().int().positive(),
  status: exportStatusSchema,
  rowCount: z.number().int().nonnegative().optional(),
  failedReason: z.string().optional(),
  createdAt: z.coerce.date(),
});

export type ExportStatus = z.infer<typeof exportStatusSchema>;
export type Export = z.infer<typeof exportSchema>;

function dateFromDBO(value: string): Date {
  const isoish = value.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  return new Date(isoish);
}

export interface ExportDBO {
  id: number;
  requesterId: number;
  status: string;
  rowCount: number | null;
  failedReason: string | null;
  createdAt: string;
}

export function exportFromDBO(dbo: ExportDBO): Export {
  return {
    id: dbo.id,
    requesterId: dbo.requesterId,
    status: exportStatusSchema.parse(dbo.status),
    rowCount: dbo.rowCount ?? undefined,
    failedReason: dbo.failedReason ?? undefined,
    createdAt: dateFromDBO(dbo.createdAt),
  };
}
```

> **&#10067; Why `exportStatusSchema.parse()` in the mapper?** The column is a
> plain `text`. PostgreSQL will hand back whatever is in it, including a typo
> somebody wrote in a migration two years ago. Parsing here is what turns
> `Export["status"]` from a hope into something the rest of your code can trust.

### 3. The queue (~10 min)

Create `backend/src/queues/exports.queue.ts`:

```ts
import { Queue, QueueEvents, type Job } from 'bullmq';

import { createRedisConnection } from '../redis.ts';

export const EXPORTS_QUEUE = 'exports';

export interface ExportJobData {
  exportId: number;
  requesterId: number;
}

export const exportsQueue = new Queue<ExportJobData>(EXPORTS_QUEUE, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { count: 100 },
  },
});

export const exportsQueueEvents = new QueueEvents(EXPORTS_QUEUE, {
  connection: createRedisConnection(),
});

export function isFinalAttempt(job: Job): boolean {
  return job.attemptsMade >= (job.opts.attempts ?? 1);
}
```

Before reading another word, check it loads. The queue connects to Redis the
moment this file is imported, so a typo in `REDIS_URL` shows up here:

```bash
# from backend/, in a third terminal
node --input-type=module -e "await import('./src/queues/exports.queue.ts'); console.log('queue ok'); process.exit(0)"
```

Four things worth stopping on.

**The queue is a string.** `'exports'` is the only thing connecting the code
that adds jobs to the code that runs them. Change one character and you create a
second queue. Nobody reads it. Nothing reports an error.

**`attempts: 3` with exponential backoff** is the single most valuable line
here. A transient failure — the database blinked, a network call timed out —
stops being a lost request and becomes a one-second delay. You get that for
free, and writing it yourself correctly is genuinely hard.

**`removeOnComplete` and `removeOnFail` are not tidiness.** Redis is memory.
Without these, every finished job stays in it forever, and a 25 MB free
instance fills up fast.

**`QueueEvents` is the pub/sub half of this lesson.** It reads a Redis *stream*
that every worker writes to. That is how one process learns about work that
happened in another — possibly on another machine. Keep that in mind: the
request handler and the worker will never speak to each other directly.

> **&#10067; What is `ExportJobData` missing?** It carries two numbers. It does
> not carry the user's expenses. Why not? Because a job can sit in a queue for
> a while, and a copy of the data taken at click time would be stale by the
> time anyone looked at it. The job is a note saying *what to do*, not the data
> to do it with. The worker reads that fresh.

### 4. The worker (~35 min)

First, the service that does the actual work. Create
`backend/src/services/exports.service.ts`:

```ts
import { db } from '../prisma/db.ts';
import { redis } from '../redis.ts';
import { exportFromDBO, type Export, type ExportStatus } from '../types/export.ts';
import type { Expense } from '../types/expense.ts';

const CSV_TTL_SECONDS = 3600;

function csvKey(exportId: number): string {
  return `export:${exportId}:csv`;
}

/** Escapes one CSV field: wrap in quotes, and double any quote inside it. */
function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export class ExportsService {
  public static async create(requesterId: number): Promise<Export> {
    const row = await db.orm.public.Export.create({ requesterId, status: 'queued' });
    return exportFromDBO(row);
  }

  public static async getById(id: number): Promise<Export | undefined> {
    const row = await db.orm.public.Export.where({ id }).first();
    return row ? exportFromDBO(row) : undefined;
  }

  public static async listForUser(requesterId: number): Promise<Export[]> {
    const rows = await db.orm.public.Export.where({ requesterId }).all();
    return rows.map(exportFromDBO).sort((a, b) => b.id - a.id);
  }

  public static async setStatus(
    id: number,
    status: ExportStatus,
    extra: { rowCount?: number; failedReason?: string } = {}
  ): Promise<void> {
    await db.orm.public.Export.where({ id }).update({
      status,
      ...(extra.rowCount !== undefined ? { rowCount: extra.rowCount } : {}),
      ...(extra.failedReason !== undefined ? { failedReason: extra.failedReason } : {}),
    });
  }

  public static buildCsv(expenses: Expense[]): string {
    const header = ['id', 'date', 'description', 'amount', 'payer', 'category'];
    const lines = [header.map(csvCell).join(',')];

    for (const expense of expenses) {
      lines.push(
        [
          csvCell(expense.id),
          csvCell(expense.date.toISOString().slice(0, 10)),
          csvCell(expense.description),
          csvCell(expense.amount.toFixed(2)),
          csvCell(expense.payer?.name ?? ''),
          csvCell(expense.category?.name ?? ''),
        ].join(',')
      );
    }

    return lines.join('\n');
  }

  public static async storeCsv(exportId: number, csv: string): Promise<void> {
    await redis.set(csvKey(exportId), csv, 'EX', CSV_TTL_SECONDS);
  }

  public static async readCsv(exportId: number): Promise<string | undefined> {
    const csv = await redis.get(csvKey(exportId));
    return csv ?? undefined;
  }
}
```

> **&#9888; `storeCsv` is the sentence to remember from this lesson.**
> `redis.set(key, value, 'EX', 3600)` means *keep this for an hour, then forget
> it*. There is no `DELETE FROM` to run. There is no cron job to write, deploy
> and monitor. Expiry is a property of the key.
>
> Now cost the same feature in PostgreSQL: a `text` column that grows forever,
> plus a scheduled job you have to write, deploy and monitor. And then the day
> you notice it stopped running three months ago. **That** is why there are two databases in this
> application, and it is a better reason than "Redis is fast".
>
> In a real product this file would go to object storage (S3) rather than
> Redis, because real reports are megabytes and Redis is memory. The TTL idea
> is the same; only the shelf changes.

Now the worker. Create `backend/src/workers/exports.worker.ts`:

```ts
import { Worker, type Job } from 'bullmq';

import { createRedisConnection } from '../redis.ts';
import { EXPORTS_QUEUE, isFinalAttempt, type ExportJobData } from '../queues/exports.queue.ts';
import { ExportsService } from '../services/exports.service.ts';
import { ExpensesService } from '../services/expenses.service.ts';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processExportJob(job: Job<ExportJobData>): Promise<{ rowCount: number }> {
  const { exportId, requesterId } = job.data;

  await ExportsService.setStatus(exportId, 'running');

  await sleep(800);
  await job.updateProgress({ step: 'reading expenses', percent: 10 });

  const expenses = await ExpensesService.getExpensesOfUser(requesterId);
  await sleep(1500);

  await job.updateProgress({ step: 'building the file', percent: 60 });
  const csv = ExportsService.buildCsv(expenses);
  await sleep(1500);

  await job.updateProgress({ step: 'storing the file', percent: 90 });
  await ExportsService.storeCsv(exportId, csv);

  await ExportsService.setStatus(exportId, 'completed', { rowCount: expenses.length });

  return { rowCount: expenses.length };
}

export const exportsWorker = new Worker<ExportJobData>(EXPORTS_QUEUE, processExportJob, {
  connection: createRedisConnection(),
  concurrency: 2,
});

exportsWorker.on('failed', async (job, error) => {
  console.error(`Export job ${job?.id} failed (attempt ${job?.attemptsMade}):`, error.message);
  if (!job || !isFinalAttempt(job)) return;

  await ExportsService.setStatus(job.data.exportId, 'failed', {
    failedReason: error.message,
  });
});

exportsWorker.on('error', (error) => {
  console.error('Export worker error:', error.message);
});
```

> **&#9888; Be honest about those `sleep` calls.** Building a CSV from a few
> hundred rows takes milliseconds. On its own, this feature would not need a
> queue at all. Real report jobs are slow for reasons we are not building
> today: rendering a PDF, calling a currency API once per row, scanning two
> years of history. The sleeps buy you those seconds so you can *see* the queue
> work and so the progress bar has something to report. It is the one fake
> thing in this exercise. Everything around it is real.

Three things to notice in `processExportJob`.

**It takes a `Job`, not a `Request`.** There is no `res` to write to and nobody
on the other end of a socket. The user got their answer seconds ago. That is
the whole point.

**It reads the expenses itself.** Fresh from PostgreSQL, at the moment it runs.

**It reports progress.** `job.updateProgress()` writes to Redis, and every
`QueueEvents` listener in every process hears it.

Then `concurrency: 2`. That number is a promise to the rest of your system:
however long the queue gets, this worker will never run a third export at once.
A queue with no concurrency limit is just a slower way to crash.

> **&#10067; Why does the `failed` listener need `isFinalAttempt`?** Because it
> fires after **every** attempt, including the ones BullMQ is about to retry.
> Without the guard, the first throw writes `failed` to the row — and then the
> second attempt succeeds, and your user has been told their export died when
> it did not.
>
> Keep this one in your head, because the next exercise contains an event with
> the same name that behaves differently.

#### Run it as its own process

Nothing has started the worker yet. You could import it into `app.ts` — but
then it would share a process with your API, and the whole claim of this
lesson is that it does not have to.

Create `backend/worker.ts`, beside `app.ts`:

```ts
import { exportsWorker } from './src/workers/exports.worker.ts';

console.log('Export worker started. Waiting for jobs...');

/**
 * Stop politely when the platform asks. SIGTERM is what Render, Docker and
 * Kubernetes send before a shutdown; `close()` stops taking new jobs and
 * waits for the running ones.
 */
async function shutdown(signal: string) {
  console.log(`${signal} received, finishing current jobs...`);
  await exportsWorker.close();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
```

Add a script to `backend/package.json`, next to `dev`:

```json
"worker": "node --watch worker.ts",
```

Now you need **two terminals**, both in `backend/`:

```bash
npm run dev      # terminal 1 — the API
npm run worker   # terminal 2 — the worker
```

#### Prove they are really separate

This is the part worth doing slowly, because it is the whole lesson in one
experiment. You cannot run it yet — the HTTP route comes in exercise 5 — so
come back here once it does, or read it now and run it then.

**Stop the worker** (Ctrl-C in terminal 2), leave the API running, and ask for
five exports. Then look at the list. Every one says `queued`. Nothing failed,
nothing is lost, and the API never slowed down — the work is sitting in Redis
waiting for somebody to come and do it.

**Start the worker again.** Watch them drain:

```
t+3s    14:running    15:running    16:queued     17:queued     18:queued
t+7s    14:completed  15:completed  16:running    17:running    18:queued
t+11s   14:completed  15:completed  16:completed  17:completed  18:running
```

> **&#10067; Look at that table again. Why two at a time?** Because of
> `concurrency: 2`. You wrote that number earlier and it was an assertion;
> this is it being true. Change it to 5, restart the worker, and all five run
> at once.

> **&#9888; Two processes, sharing nothing.** The API and the worker do not
> import each other. They do not know each other's port. They do not share a
> variable. The only thing between them is Redis — and that is exactly why the
> worker could move to another machine tomorrow, and why you can run five of
> them and one API. Everything this lesson claims about queues, you just
> watched happen.

### 5. Ask for an export over HTTP (~20 min)

The export routes need to know **who** is asking — not just that the token is
valid. Right now `requireAuth` verifies the token and throws the answer away.
Open `backend/src/middleware/requireAuth.ts` and rewrite it:

```ts
import type { NextFunction, Request, Response } from 'express';

import { AuthService } from '../services/auth.service.ts';
import type { UserJWT } from '../types/auth.ts';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

  return verifyAndContinue(token, res, next);
}

/** The same check, but reading the token from `?token=`. Exercise 6 explains why. */
export function requireAuthQuery(req: Request, res: Response, next: NextFunction) {
  const token = typeof req.query['token'] === 'string' ? req.query['token'] : '';

  return verifyAndContinue(token, res, next);
}

function verifyAndContinue(token: string, res: Response, next: NextFunction) {
  if (!token) {
    return res.status(401).json({ error: 'You must be logged in' });
  }

  try {
    res.locals['userJWT'] = AuthService.verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function currentUser(res: Response): UserJWT {
  const userJWT = res.locals['userJWT'] as UserJWT | undefined;
  if (!userJWT) {
    throw new Error('currentUser() called on a route that is not behind requireAuth');
  }
  return userJWT;
}
```

> **&#10067; Why does `currentUser` throw instead of returning `undefined`?**
> Because calling it on an unguarded route is a **programming** mistake, not a
> runtime condition a user can cause. A loud crash the first time you run it
> beats a silent `undefined` that reaches production and reads somebody else's
> expenses.

Now create `backend/src/routes/exports.router.ts`. Start with the three
ordinary routes; the event stream comes in the next exercise.

```ts
import { Router, type Request, type Response } from 'express';

import { currentUser, requireAuth, requireAuthQuery } from '../middleware/requireAuth.ts';
import { ExportsService } from '../services/exports.service.ts';
import { exportsQueue, exportsQueueEvents } from '../queues/exports.queue.ts';

const router = Router();

router.get('/:id/download', requireAuthQuery, downloadExport);

router.use(requireAuth);

router.post('/', async (_req, res) => {
  const { userId } = currentUser(res);

  try {
    const record = await ExportsService.create(userId);

    await exportsQueue.add(
      'export-expenses',
      { exportId: record.id, requesterId: userId },
      { jobId: jobIdForExport(record.id) }
    );

    res.status(202).json(record);
  } catch (error) {
    console.error('Error requesting an export:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (_req, res) => {
  const { userId } = currentUser(res);
  res.json(await ExportsService.listForUser(userId));
});

router.get('/:id', async (req, res) => {
  const { userId } = currentUser(res);
  const record = await ExportsService.getById(Number(req.params.id));

  if (!record || record.requesterId !== userId) {
    return res.status(404).json({ error: 'Export not found' });
  }

  return res.json(record);
});

function jobIdForExport(exportId: number): string {
  return `export-${exportId}`;
}

async function downloadExport(req: Request, res: Response) {
  const { userId } = currentUser(res);
  const id = Number(req.params.id);
  const record = await ExportsService.getById(id);

  if (!record || record.requesterId !== userId) {
    return res.status(404).json({ error: 'Export not found' });
  }
  if (record.status !== 'completed') {
    return res.status(409).json({ error: `Export is ${record.status}` });
  }

  const csv = await ExportsService.readCsv(id);
  if (csv === undefined) {
    return res.status(410).json({ error: 'This export has expired. Ask for a new one.' });
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="expenses-${id}.csv"`);
  return res.send(csv);
}

export default router;
```

Mount it in `backend/app.ts`. Add the import beside the other router imports:

```ts
import exportsRouter from './src/routes/exports.router.ts';
```

and the mount beside the other mounts:

```ts
app.use('/api/exports', exportsRouter);
```

> **&#9888; There is no `requireAuth` on that line.** Every router above it has
> one — `app.use('/api/expenses', requireAuth, expensesRouter)` — so copying
> the neighbours is the natural thing to do. Do not. This router guards itself,
> because two of its routes need the query-string check instead. Add
> `requireAuth` here and those two routes answer `401`: the button still works,
> the progress bar never moves, and the only clue is a `401` in the network
> tab.

> **&#10067; Why REST? We have GraphQL.** Lesson 5 moved reads to GraphQL and
> `graphql-yoga` is still mounted. But look at what these two routes return: an
> endless stream of events, and a file. GraphQL answers a question with a JSON
> object shaped like your query. Neither of those is that shape.
>
> To be fair to GraphQL: Yoga *does* support subscriptions, and it delivers
> them over Server-Sent Events — the very thing you are about to build. So the
> progress half could have been a subscription. The download could not, so you
> would still need a REST route, and you would have paid for a second way of
> doing the same thing. Choosing the transport that fits the payload is the
> point, not using one tool for everything.

Now read the `POST` handler again and count what it does: one row, one job, one
response. Then look at the status code.

> **&#9888; `202 Accepted`, not `200 OK`.** `200` means "here is what you asked
> for". `202` means "I have taken this on, it is not done yet". This is not
> pedantry — it is the only thing in the response that tells a client the work
> is still moving. A client that sees `200` will assume the work is done.

> **&#10067; What is `jobId: jobIdForExport(record.id)` for?** There is one
> queue and one event stream for everybody. When the stream in the next
> exercise hears "a job finished", it needs a way to know whether that was
> *this* export or one of the forty other students'. A predictable id is that
> way.
>
> It has a cost worth knowing. BullMQ refuses to add a job with an id it
> already holds, and `removeOnComplete: { age: 3600 }` keeps finished jobs for
> an hour. So if you re-run `node scripts/db-populate.ts`, export ids restart
> at 1 while `bull:exports:export-1` is still in Redis — and your next export
> is silently dropped with no error anywhere. If an export stays on `queued`
> forever after a reseed, that is why. `docker compose exec valkey valkey-cli
> DEL bull:exports:export-1` clears it.

> **&#10067; Why does `/:id/download` sit above `router.use(requireAuth)`?**
> Because `router.use` only applies to routes declared **after** it. That line
> is how `download` opts out of the header guard and takes the query-string one
> instead. You will see why it needs to in the next exercise.

> **&#10067; And why is there one `404` for both "no such export" and "not
> yours"?** A `403` would confirm that export #12 exists. A `404` tells a stranger
> nothing at all.

Test it with curl. First get a token — the seed script gives every demo user
the password `topsecret`:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"john.doe@example.com","password":"topsecret"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")
```

Then ask for an export:

```bash
curl -i -X POST http://localhost:3000/api/exports \
  -H "Authorization: Bearer $TOKEN"
```

You should get `202` straight away. Wait five seconds, then fetch it:

```bash
curl http://localhost:3000/api/exports/1 -H "Authorization: Bearer $TOKEN"
curl "http://localhost:3000/api/exports/1/download?token=$TOKEN"
```

> **&#10067; Before you move on, look inside Redis.** Run
> `docker compose exec valkey valkey-cli KEYS '*'`. You will see your CSV key
> and a set of `bull:exports:*` keys. Then run
> `docker compose exec valkey valkey-cli TTL export:1:csv` and watch the number
> count down. Nothing you wrote will delete that key. It deletes itself.

### 6. Watch it happen: Server-Sent Events (~35 min)

Right now the only way for the browser to learn that an export finished is to
ask. Over and over.

> **&#10067; Pick a polling interval, and say what it costs.** Every five
> seconds? Then a user waits up to five seconds after the work is already done.
> Every 200ms? Then forty students in this room generate two hundred requests a
> second, and the honest answer to almost all of them is "no".
>
> There is no good number. That is the point. The server knows exactly when the
> job finished — so let the server be the one to speak.

**Server-Sent Events** is the smallest way to do that. It is an ordinary `GET`
that never ends. The response says `Content-Type: text/event-stream`, the
connection stays open, and the server writes a line whenever it has something
to say. Browsers understand the format natively.

Add this to `backend/src/routes/exports.router.ts`. One new registration line,
**above** `router.use(requireAuth)` and beside the download route you already
have:

```ts
router.get('/:id/events', requireAuthQuery, streamExportEvents);
```

And the handler, at the bottom of the file:

```ts
/** Writes one SSE message. Two newlines end it — one is not enough. */
function sendEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function streamExportEvents(req: Request, res: Response) {
  const { userId } = currentUser(res);
  const id = Number(req.params.id);
  const record = await ExportsService.getById(id);

  if (!record || record.requesterId !== userId) {
    return res.status(404).json({ error: 'Export not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Say where things stand before streaming changes, so a page that loads
  // after the job finished still gets an answer.
  sendEvent(res, 'status', record);
  if (record.status === 'completed' || record.status === 'failed') {
    return res.end();
  }

  const mine = jobIdForExport(id);

  const onProgress = ({ jobId, data }: { jobId: string; data: unknown }) => {
    if (jobId !== mine) return;
    sendEvent(res, 'progress', data);
  };

  const onCompleted = async ({ jobId }: { jobId: string }) => {
    if (jobId !== mine) return;
    sendEvent(res, 'completed', await ExportsService.getById(id));
    cleanup();
    res.end();
  };

  const onFailed = async ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    // YOU WRITE THIS ONE. Read "Your turn" below before you do.
  };

  exportsQueueEvents.on('progress', onProgress);
  exportsQueueEvents.on('completed', onCompleted);
  exportsQueueEvents.on('failed', onFailed);

  // Proxies close connections that go quiet. A comment line is a legal SSE
  // message that means nothing, which is exactly what we want.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 20_000);

  function cleanup() {
    clearInterval(heartbeat);
    exportsQueueEvents.off('progress', onProgress);
    exportsQueueEvents.off('completed', onCompleted);
    exportsQueueEvents.off('failed', onFailed);
  }

  req.on('close', cleanup);

  return undefined;
}
```

Now the four things in that handler that are easy to get wrong.

**`if (jobId !== mine) return;`** — there is **one** event stream for the whole
queue, not one per request. `exportsQueueEvents` reports every job, including
other users'. Forget this check and every user watches every other user's
progress bar.

**`req.on('close', cleanup)`** — these listeners are registered on a long-lived
emitter. If you do not remove them when the browser goes away, they pile up on
every single request until the process runs out of memory. This is the leak
that makes streaming endpoints different from normal ones, and nothing will
warn you about it.

**`res.flushHeaders()`** — without it Express waits before sending the headers,
and the browser sits there waiting for a response that has technically already
started.

#### Your turn: write `onFailed`

Every other line in this lesson is given to you. This one is not, because it
is the one place where the obvious answer is wrong.

The obvious answer is to copy `onCompleted`: check the id, re-read the row,
send it. That will even look like it works — until a job actually fails.

> **&#9888; Read this before you write it.** On success, re-reading the row is
> safe. The worker writes `completed` to PostgreSQL *before* its processor
> returns, and BullMQ only emits `completed` after the processor has returned.
> The write has definitely landed.
>
> On failure there is no such guarantee. The row is written by the worker's own
> `failed` listener — which is reacting to **the same event as this handler**,
> with nothing ordering the two. Re-read the row here and you will usually win
> the race and send the user a row that has not caught up: still `queued` or
> `running`, with no `failedReason` in it.
>
> The user is then told "the export failed" with no reason why, while the
> reason sits in the database.

So write `onFailed` so that it **never reads the database**. Everything the
client needs is already in the two arguments the event handed you. Remember to
`cleanup()` and `res.end()` — a stream nobody closes is a stream that stays
open.

#### Test it by breaking the worker on purpose

Add one line to the top of `processExportJob` in
`backend/src/workers/exports.worker.ts`:

```ts
throw new Error('Simulated flakiness');
```

Restart the worker, ask for an export, and watch its stream. In the worker's
terminal you should see **three** attempts, about one and two seconds apart:

```
Export job export-21 failed (attempt 1): Simulated flakiness
Export job export-21 failed (attempt 2): Simulated flakiness
Export job export-21 failed (attempt 3): Simulated flakiness
```

and in the stream, **one** `failed` event carrying the reason:

```
event: failed
data: {"id":21,"status":"failed","failedReason":"Simulated flakiness"}
```

> **&#10067; Two numbers, and they should not match.** Three lines in the
> worker's log, one event on the wire. If you get three events, you put the
> `isFinalAttempt` guard in the wrong place. If you get an event with no
> `failedReason`, you read the database — go back and read the warning above.

Now try the wrong version on purpose: change your `onFailed` to
`sendEvent(res, 'failed', await ExportsService.getById(id))` and run it again.
The event still arrives, but look at what is in it — a row that has not caught
up, and no reason for the failure. That is the race, and it is why this
handler is the one you had to write yourself.

Delete the `throw` when you are done.

<details>
<summary>The answer, once you have tried it</summary>

```ts
const onFailed = async ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
  if (jobId !== mine) return;

  // Reaching here at all means the job is out of attempts: unlike the
  // worker's `failed` listener, this one fires once, at the end.
  sendEvent(res, 'failed', { id, status: 'failed', failedReason });
  cleanup();
  res.end();
};
```

</details>

> **&#10067; One more, and it catches people out.** You wrote
> `worker.on('failed')` in exercise 4 and it fired after every attempt. This
> `queueEvents.on('failed')` fires **once**, when the job runs out of attempts.
> Between attempts the job moves to `delayed`, which is not a failure. Same
> name, two different events, and only one of them needs an `isFinalAttempt`
> guard.

Test it from the terminal. `curl -N` keeps the connection open instead of
waiting for the response to end.

**Order matters here.** Ask for the export *first*, note the id it gives you,
then watch that same id — you have about four seconds before the job finishes:

```bash
# 1. ask for an export, and read the "id" in the reply
curl -s -X POST http://localhost:3000/api/exports -H "Authorization: Bearer $TOKEN"

# 2. straight away, watch that id (replace 3 with the id you just got)
curl -N "http://localhost:3000/api/exports/3/events?token=$TOKEN"
```

You should see `status`, three `progress` events, then `completed`, and the
command exits on its own.

> **&#10067; Why not open the stream first and then `POST` from another
> terminal?** Because a `POST` creates a **new** export with a **new** id, and
> the `jobId !== mine` filter you just wrote will correctly ignore every one of
> its events. A stream only ever reports on the one export it was opened for.
> If you try it, you will see a single `status` line and nothing else — which
> is the filter working, not a bug.

### 7. The browser side (~20 min)

Create `frontend/src/types/Export.ts`:

```ts
export type ExportStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface Export {
  id: number;
  requesterId: number;
  status: ExportStatus;
  rowCount?: number;
  failedReason?: string;
  createdAt: string;
}

export interface ExportProgress {
  step: string;
  percent: number;
}
```

Then the hook, `frontend/src/hooks/useExportStream.ts`:

```ts
import { useEffect, useState } from 'react';

import { getToken } from '../lib/token';
import type { Export, ExportProgress } from '../types/Export';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ExportStream {
  record: Export | null;
  progress: ExportProgress | null;
  error: string | null;
}

export function useExportStream(exportId: number | null): ExportStream {
  const [record, setRecord] = useState<Export | null>(null);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resetting during render rather than inside the effect: a new export id
  // means the old progress and the old error belong to a different job. React
  // documents this pattern for "adjust state when a prop changes", and it is
  // why there is no `setState` at the top of the effect below -- doing it
  // there would queue a second render every time.
  const [watchedId, setWatchedId] = useState(exportId);
  if (exportId !== watchedId) {
    setWatchedId(exportId);
    setProgress(null);
    setError(null);
  }

  useEffect(() => {
    if (exportId === null) return;

    const token = getToken();
    const source = new EventSource(
      `${API_BASE_URL}/api/exports/${exportId}/events?token=${token}`
    );

    source.addEventListener('status', (event) => {
      const current = JSON.parse(event.data) as Export;
      setRecord(current);
      if (current.status === 'completed' || current.status === 'failed') {
        source.close();
      }
    });

    source.addEventListener('progress', (event) => {
      setProgress(JSON.parse(event.data) as ExportProgress);
    });

    source.addEventListener('completed', (event) => {
      setRecord(JSON.parse(event.data) as Export);
      setProgress(null);
      source.close();
    });

    source.addEventListener('failed', (event) => {
      // A narrow type, not `as Export`: the failure event carries only what
      // the server knew without re-reading the database.
      const failed = JSON.parse(event.data) as Pick<Export, 'id' | 'status'> & {
        failedReason?: string;
      };
      setRecord((previous) => (previous ? { ...previous, ...failed } : null));
      setError(failed.failedReason ?? 'The export failed');
      setProgress(null);
      source.close();
    });

    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        setError('Lost the connection to the server');
      }
    };

    return () => source.close();
  }, [exportId]);

  return { record, progress, error };
}
```

> **&#9888; Count the libraries you installed for this.** Zero. `EventSource`
> is part of every browser. It even reconnects on its own when the connection
> drops — that reconnection is part of the standard. It is not a package you have
> to choose, update and trust.

> **&#10067; Why `addEventListener('progress', ...)` and not `onmessage`?**
> Because the server wrote `event: progress`. Named events do not arrive as
> `message` events, so `onmessage` would never fire. The names on both sides
> have to match exactly.

> **&#9888; The `return () => source.close()` is not optional.** Navigate away
> without it and the request stays open: the server keeps a dead listener, the
> browser keeps a socket. An effect that opens something must close it.

> **&#9888; Neither is the `source.close()` inside the `status` listener.** The
> server sends `status` and hangs up when the job is already finished.
> `EventSource` cannot tell a finished stream from a dropped one — it treats
> both as "reconnect" — so if you do not close it yourself, the browser reopens
> that request every few seconds, forever. Each reopen costs a database read.
>
> Nothing in the UI shows it, and `onerror` stays quiet because `readyState`
> never reaches `CLOSED`. You can only see it in the network tab or in your
> backend logs. **Automatic reconnection is a feature right up to the moment
> there is nothing left to reconnect to.**

Now the page, `frontend/src/pages/exports/ExportPage.tsx`:

```tsx
import { useState } from 'react';

import { apiRequest } from '../../lib/rest';
import { getToken } from '../../lib/token';
import { useExportStream } from '../../hooks/useExportStream';
import type { Export } from '../../types/Export';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function ExportPage() {
  const [exportId, setExportId] = useState<number | null>(null);
  const [requesting, setRequesting] = useState(false);
  const { record, progress, error } = useExportStream(exportId);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      const created = await apiRequest<Export>('/api/exports', { method: 'POST' });
      setExportId(created.id);
    } finally {
      setRequesting(false);
    }
  };

  const isWorking =
    record !== null && (record.status === 'queued' || record.status === 'running');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Export your expenses</h2>

      <p className="text-slate-600">
        We will build a CSV of every expense you paid or took part in. It runs in the
        background, so you can keep using the app while it works.
      </p>

      <button
        type="button"
        onClick={handleRequest}
        disabled={requesting || isWorking}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-300"
      >
        {isWorking ? 'Working…' : 'Export my expenses'}
      </button>

      {progress && (
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded bg-slate-200">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-sm text-slate-500">{progress.step}…</p>
        </div>
      )}

      {record?.status === 'completed' && (
        <div className="rounded border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            Done — {record.rowCount} expense{record.rowCount === 1 ? '' : 's'}.
          </p>
          <a
            className="text-sm font-semibold text-indigo-700 underline"
            href={`${API_BASE_URL}/api/exports/${record.id}/download?token=${getToken()}`}
          >
            Download the CSV
          </a>
          <p className="mt-2 text-xs text-green-700">
            This link works for one hour. After that the file is gone and you can ask
            for a new one.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

export default ExportPage;
```

Add the route in `frontend/src/main.tsx`. The import goes beside the other
page imports:

```tsx
import ExportPage from "./pages/exports/ExportPage.tsx";
```

and the route inside the guarded `children` array:

```tsx
{ path: "exports", Component: ExportPage },
```

And a link in `frontend/src/pages/Layout.tsx`, next to "Add an expense":

```tsx
<NavLink to="/exports" className={linkClass}>
  Export
</NavLink>
```

Run it. Click the button. The progress bar should move in three steps and then
offer you a file.

> **&#9888; Now look at that download link, and at the `?token=` in the hook.**
> Both of them put your JWT in a URL, and that is a real compromise, not a
> neutral choice. URLs end up in server access logs, in browser history, and in
> the `Referer` header of whatever the page loads next. You would never put a
> password there.
>
> So why here? Because **the moment the browser is the one making the request,
> your headers are gone.** `new EventSource(url)` takes a URL and nothing else.
> A download has to be a real navigation or the file never reaches the
> Downloads folder. Neither gives you anywhere to put an `Authorization`
> header.
>
> It is worth learning as a rule rather than as two special cases. Everywhere
> else in this app your own JavaScript calls `fetch`, and `fetch` can set any
> header it likes.
>
> **Now look at your backend terminal.** `morgan` has been logging every
> request since lesson 1, and your token is sitting in those lines in plain
> text. That is not a hypothetical — it is the access-log problem, on your own
> machine, caused by the code you just wrote.
>
> The two production answers, neither of which we are building today: put the
> session in a **cookie** (`EventSource` sends those, with
> `withCredentials: true`), or mint a **single-use ticket** that is valid for
> this one stream and expires in thirty seconds.

### 8. Ship it (~20 min)

Everything so far runs on your laptop. Your deployed app still has no queue.

1. On Render, create a **Key Value** instance. The free tier is 25 MB, and you
   get one per workspace.
2. Copy its **internal** connection string. Internal, not external: it keeps
   the traffic inside Render's network and it is faster.
3. In your **backend** service, add an environment variable `REDIS_URL` with
   that value.
4. Add a second environment variable, `RUN_WORKER_IN_API`, set to `true`.
5. Push. Render redeploys.

That fourth step needs explaining, and it needs one small change in
`backend/app.ts`:

```ts
// Locally: not set, so the worker is the separate process you ran in
// terminal 2. On Render: set to true, because the free tier has no
// background-worker instance type, so the API has to do the work too.
if (process.env['RUN_WORKER_IN_API'] === 'true') {
  console.log('Running the export worker inside the API process.');
  await import('./src/workers/exports.worker.ts');
}
```

> **&#9888; This is a deployment compromise, and it is written down as one.**
> On a paid plan you would create a **Background Worker** service pointing at
> the same repository, with `npm run worker` as its start command and the same
> `REDIS_URL`, and never set this variable. Your `worker.ts` would run there
> unchanged — because it already does, on your laptop, in terminal 2.
>
> Notice what did *not* have to change to support both shapes: the queue, the
> worker, the service, the routes. One `if`, in the file that decides what
> this process is.

Then test it in production, not just locally. Concretely:

1. Open your deployed frontend and log in.
2. Click **Export my expenses**. The button should answer at once.
3. Watch the progress bar move. If it never moves, open the network tab and
   look at the `/events` request. A `401` points at the guard. A request that
   stays pending and receives nothing points at the worker.
4. Download the file and open it.
5. In the Render dashboard, open your Key Value instance and confirm it is
   holding keys.

> **&#9888; Three things about the free tier that will confuse you later.**
>
> **The Key Value instance is not persistent.** A restart, a maintenance event
> or an upgrade loses everything in it. For this app that means pending jobs
> and finished CSVs can vanish. That is survivable here precisely because of
> the split you built: the `export` rows are in PostgreSQL and they are fine.
> It would not be survivable if the queue were your source of truth.
>
> **A free web service sleeps after 15 minutes with no traffic**, and takes
> about a minute to wake up. A job queued just before it sleeps will run when
> it wakes.
>
> **There is no free background worker**, which is why the worker lives inside
> the API process. On a paid plan you would create a Background Worker service
> running the same repository with a different start command, pointed at the
> same `REDIS_URL`, and delete that one import from `app.ts`. Nothing else
> changes.

## Summary

- **A long request is a broken promise.** Holding a socket open for thirty
  seconds costs you a frozen server, a lost result if anything restarts, and a
  user staring at a spinner. Answer `202 Accepted` instead and do the work
  somewhere else.
- **Two databases, two different promises.** PostgreSQL holds facts that must
  outlive everything. Redis holds things that are *meant* to disappear: pending
  work, events worth one second, files worth one hour. `SET key value EX 3600`
  is a feature you would otherwise have to build, deploy and monitor.
- **A job is a note, not a payload.** It says what to do. The worker reads the
  data fresh, so nothing is ever stale.
- **The API and the worker share nothing but Redis.** You ran them as two
  processes and killed one while the other kept serving. That is why a worker
  can move to another machine, and why you can run five of them and one API.
- **Retries and a concurrency limit are the two things a queue gives you that a
  function call cannot.** `attempts: 3` turns a network blip into a one-second
  delay. `concurrency: 2` is a promise that this work will never swamp the rest
  of your system.
- **`worker.on('failed')` and `queueEvents.on('failed')` are different events.**
  The first fires after every attempt and needs a guard. The second fires once,
  at the end.
- **Server-Sent Events replace polling with being told.** One `GET` that never
  ends, zero libraries on either side, automatic reconnection. Filter events by
  job id, and clean up on `close` or you leak a listener per request.
- **When the browser makes the request, your headers are gone.** `EventSource`
  and real downloads both take a URL and nothing else. Know what putting a
  token there costs, and know that cookies and single-use tickets are the ways
  out.

You started this lesson with a server that could be frozen by one slow click.
You now have one that takes the work, answers in milliseconds, survives its own
restart, retries when the world misbehaves, and tells the browser the moment
there is news. That is the same architecture that sits behind every "we will
email you when your report is ready" you have ever received.

## Going further

Optional. Pick one if you have time — the lesson is complete without them.

### A. Swap Server-Sent Events for WebSockets

> A finished version of this one ships in the reference solution:
> `backend/src/realtime/exportSocket.ts` and
> `frontend/src/hooks/useExportSocket.ts`. Try it yourself first — then read
> that and compare. The two hooks take the same argument and return the same
> shape, so switching is one import in `ExportPage.tsx`.

SSE only goes one way: server to browser. That is all this feature needs, which
is why we used it. **WebSockets** go both ways, and they are the right tool the
moment the browser also has something to say — a chat, a cursor position, a
collaborative editor.

Swapping the transport is a good exercise because almost nothing else changes.
The queue, the worker and `QueueEvents` stay exactly as they are; only the last
hop to the browser is different.

```bash
# from backend/
npm install ws
npm install -D @types/ws
```

In `backend/app.ts`, keep the Express `app` but take hold of the HTTP server it
returns, so the socket and your API share one port and one origin:

```ts
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { exportsQueueEvents } from './src/queues/exports.queue.ts';
import { JWT_SECRET } from './src/types/auth.ts';

const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

// `noServer: true` means: do not open a port of your own, I will hand you
// connections from the HTTP server above.
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url!, 'http://localhost');
  const token = url.searchParams.get('token') ?? '';

  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (client) => {
    wss.emit('connection', client, req);
  });
});

function broadcast(payload: unknown) {
  const text = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(text);
  }
}

exportsQueueEvents.on('progress', ({ jobId, data }) =>
  broadcast({ type: 'progress', jobId, data })
);
exportsQueueEvents.on('completed', ({ jobId }) => broadcast({ type: 'completed', jobId }));
```

On the browser side there is still no library — `WebSocket` is built in, like
`EventSource` was:

```ts
const ws = new WebSocket(`${WS_BASE_URL}/ws?token=${getToken()}`);
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // ...same handling as the SSE hook
};
```

Three things to notice while you do it:

- **The token is in the query string again.** Browser `WebSocket` cannot set
  headers either. Same rule, second proof.
- **`broadcast` sends to everybody.** Unlike the SSE version, there is no
  per-request handler to filter in. Giving each user only their own events
  means keeping a `Map<userId, WebSocket>` — try it.
- **You lose automatic reconnection.** `EventSource` had it for free;
  `WebSocket` does not. You now have to write that yourself, and it is the main
  reason not to reach for WebSockets when one direction would do.


### B. Stop putting the token in the URL

Exercise 7 put your JWT in two URLs and explained why there was nowhere else
to put it. There is a way out, and it is not much code: stop sending the
*session* token, and send a ticket that is worth almost nothing instead.

Add one route, behind the normal header guard:

```ts
// POST /api/exports/:id/ticket
// Returns a token that is good for one stream, for thirty seconds.
router.post('/:id/ticket', async (req, res) => {
  const { userId } = currentUser(res);
  const id = Number(req.params.id);
  const record = await ExportsService.getById(id);

  if (!record || record.requesterId !== userId) {
    return res.status(404).json({ error: 'Export not found' });
  }

  const ticket = jwt.sign({ userId, exportId: id, kind: 'export-stream' }, JWT_SECRET, {
    expiresIn: '30s',
  });

  return res.json({ ticket });
});
```

Then make `requireAuthQuery` accept **only** that kind of token, and have the
frontend ask for a ticket just before it opens the stream.

Three things to think about while you do it:

- **What did you actually gain?** The URL still contains a token. But one that
  expires in thirty seconds, works for one export, and cannot create expenses
  or read your profile. A leaked access log is now worth nothing.
- **`kind: 'export-stream'` is doing real work.** Without it the server cannot
  tell a ticket from a session token, and you are back where you started.
- **The download link has the same problem** and the same fix. Does one ticket
  cover both, or does each get its own?

### C. Give the user their history

The `GET /api/exports` route already returns every export this user has
requested, and nothing in the frontend calls it. Add a list to the export page:
date, status, row count, and a download link for the ones still within their
hour.

The interesting part is what to show for a `completed` export whose Redis key
has expired. The row says it succeeded. The file is gone. Your API already
answers `410 Gone` for that case — decide what the user should see.
