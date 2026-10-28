---
title: 'Lesson 7: Work That Takes Too Long'
description: 'Move slow work out of the request with a Redis-backed job queue, and push the result to the browser over a WebSocket.'
publishDate: 2026-10-30T00:00:00Z
excerpt: 'Learn why a long request is a broken promise, what a second database is actually for, and how a worker in another process tells your browser it is done.'
tags:
  - async
  - background-jobs
  - bullmq
  - redis
  - valkey
  - queues
  - websockets
  - express
  - react
  - typescript
  - course
  - web3-2025

category: 'course-lesson'
---

## Course material

- [Presentation Slides](https://raw.githubusercontent.com/e-vinci/web3-2025/refs/heads/main/src/slides/lesson-7-async-jobs-theory.pptx)
- [Boilerplate](https://raw.githubusercontent.com/e-vinci/web3-2025/refs/heads/main/exercises/lesson-7-async-jobs-boilerplate/boilerplate.zip)

## Introduction

Every route you have written so far makes the same promise: *wait, and I will
give you the answer*. The browser asks, the server works, the browser gets the
result. One request, one answer.

That promise breaks the moment the work takes real time.

Think about what your server does when a request takes thirty seconds. It holds
a socket open for thirty seconds. The browser shows a spinner for thirty
seconds. If the user closes the tab, the work is lost. If the server restarts,
the work is lost. And if the work is real computation, every other user waits
too.

The fix is not to make the work faster. Sometimes you cannot. The fix is to
**stop making that promise**. The server says "I have written this down, go
away, I will tell you when it is done" and answers in twenty milliseconds.

That costs you three new things, and each one is part of today's lesson:

1. The work has to be **written down** where another process can pick it up.
   That is a **job queue**.
2. That place is **not PostgreSQL**. It is **Redis**, and the reason why is the
   most useful idea in this lesson.
3. The browser has to be **told** when the work finishes. That is a
   **WebSocket**.

By the end you will have an "Export my expenses" button that answers
immediately, a worker running in its own process that builds the file, and a
progress bar that moves because the server is pushing to it.

## Objectives

By the end of this lesson you should be able to:

- Explain why a long task does not belong inside an HTTP request.
- Say what Redis is for, and what it is **not** for, in one sentence each.
- Put a job on a queue and run it in a worker process, with retries and a
  concurrency limit.
- Tell the difference between "this failed" and "this is about to be retried".
- Push events to a browser over a WebSocket, and send them to the right user.
- Deploy all of it to Render.

## Starting point

**This lesson uses a boilerplate.** Download and unzip it:

```bash
curl -LO https://raw.githubusercontent.com/e-vinci/web3-2025/refs/heads/main/exercises/lesson-7-async-jobs-boilerplate/boilerplate.zip
unzip boilerplate.zip
rm boilerplate.zip
```

It is the finished Lesson 6 application with everything for background jobs
already wired up **except six decisions**, marked `// TODO 1` to `// TODO 6`.
Find them any time with:

```bash
grep -rn "TODO [0-9]" backend/src frontend/src
```

You are not starting from your own Lesson 6 code this week. Copying 500 lines
of Tailwind and type modules teaches nothing; the six gaps are the lesson.

### Set it up now, before exercise 0

From `backend/`:

```bash
cp .env.example .env
docker compose up -d
npm install
npm run build                  # Prisma client + migrations
node scripts/db-populate.ts
```

And from `frontend/`, in another terminal:

```bash
npm install
```

Check the backend starts before going on — the first exercise needs it
running:

```bash
# from backend/
npm run dev
```

Every demo user's password is `topsecret`.

## Recommended Reading

Read the first two before the exercises. The rest are for when you are stuck on
that specific thing.

1. [BullMQ — Queues, Workers and Events](https://docs.bullmq.io/) — those three
   guide pages, about 15 minutes. It covers most of what you will write today.
2. [MDN — Writing WebSocket client applications](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications) —
   the browser half. The server half is the `ws` library.
3. [Redis — an introduction to data types](https://redis.io/docs/latest/develop/data-types/) —
   skim it. You barely need it today, but seeing the list is what stops Redis
   feeling like "just a cache".
4. [MDN — 202 Accepted](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/202) —
   one short page about one status code. This lesson depends on it.
5. [Render — Key Value](https://render.com/docs/key-value) — for the last
   exercise.

## Exercises

### 0. Feel the problem first (~5 min)

Before building anything, make your own server do the bad thing. Your backend
is running from the setup above. In `backend/app.ts`, next to the `/ping`
route, add this:

```ts
app.get('/slow', (_req, res) => {
  const stop = Date.now() + 15_000;
  while (Date.now() < stop) {
    // busy: this is what real CPU work looks like to Node
  }
  res.json({ done: true });
});
```

`npm run dev` reloads on save. Now open **two** more terminals.

```bash
# terminal 1
curl http://localhost:3000/slow
```

```bash
# terminal 2, while the first is still hanging
curl http://localhost:3000/ping
```

> **&#10067; Predict first.** Write down one word before you run the second
> command: does `/ping` answer **immediately**, or does it wait?

It waits. **Your whole server is frozen for fifteen seconds**, for every user,
because one request is doing real work on the single thread that serves all of
them.

> **&#9888; This is the lesson in one experiment.** And the problem is bigger
> than the freeze. Even if this work were cheap for Node — waiting on a
> database, say — the request would still hold a socket open, still lose
> everything if the server restarts, and still leave the user watching a
> spinner. A queue fixes all four at once.

Delete the `/slow` route before moving on. It has done its job.

### 1. Two databases (~15 min)

Open `docker-compose.yml` and look at what you started a moment ago. There are **two**
services now: `postgres`, which you have had since lesson 2, and `valkey`.

```bash
docker compose exec valkey valkey-cli ping
```

You should see `PONG`.

> **&#10067; Why Valkey and not Redis?** Redis changed its licence in 2024. The
> people who had been maintaining it forked the last open-source version and
> called it Valkey. That fork is what most managed "Redis" services now run,
> including Render's. Same protocol, same commands, same clients. When this
> lesson says "Redis" it means the protocol.

Now open `backend/src/redis.ts` and read it. Two details are not decoration.

**`maxRetriesPerRequest: null` is required by BullMQ.** By default `ioredis`
gives up on a command after 20 retries. A worker asking Redis "give me the next
job, and do not answer until there is one" is *supposed* to wait, possibly for
hours. Leave the line out and BullMQ refuses to start at all:

```
BullMQ: Your redis options maxRetriesPerRequest must be null.
```

Which is good behaviour — it crashes at startup rather than stalling next week.

**It is a factory, not one shared client.** A connection parked on a blocking
command cannot run anything else, and the worker lives inside blocking reads.

> **&#9888; Stop and name what you just added.** You now have two databases.
> Before going further, write down what goes in each. On paper. If your answer
> is "Postgres for important things, Redis for fast things", that is the wrong
> model and the rest of this lesson will not make sense.
>
> The real split is **what the data is for**. PostgreSQL holds **facts** that
> must outlive everything: this expense happened, this user exists, this export
> was requested. Redis holds **coordination between processes**: what work is
> pending, and what just happened to it. Nobody needs that once the work is
> done.
>
> Redis is not a faster Postgres. It is a different job.

### 2. What makes it a queue (~10 min)

Open `backend/src/queues/exports.queue.ts`. Most of it is written. Read it
first, then do **TODO 1**.

Three things to notice while you read.

**The queue is a string.** `'exports'` is the only thing connecting the code
that adds jobs to the code that runs them. Change one character and you create
a second queue. Nobody reads it. Nothing reports an error.

**`ExportJobData` carries two numbers**, not the user's expenses. A job is a
note saying *what to do*, not a copy of the data. A job can sit in a queue for
a while, and data copied at click time would be stale by the time anyone read
it.

**`QueueEvents` is the second half of Redis's job here.** It reads a Redis
*stream* that every worker writes to. That is how one process learns what
happened in another — and in a few minutes, the worker really will be another
process.

> **&#10067; TODO 1 asks for four options.** Two of them (`attempts`,
> `backoff`) are the reason to use a queue instead of just calling the
> function: a network blip becomes a one-second delay instead of a lost
> request, and writing that correctly yourself is genuinely hard.
>
> The other two (`removeOnComplete`, `removeOnFail`) are not housekeeping.
> Redis is memory. Without them every job you ever ran stays in it forever, and
> the free instance you deploy to at the end of this lesson is 25 MB.

Check your options actually landed before moving on. This imports the file and
reads back what you configured — it fails loudly if `attempts` is still unset:

```bash
# from backend/
node --input-type=module -e "
  const { exportsQueue } = await import('./src/queues/exports.queue.ts');
  const o = exportsQueue.defaultJobOptions ?? {};
  console.log(o);
  if (o.attempts !== 3) throw new Error('TODO 1: attempts is not 3');
  console.log('queue ok'); process.exit(0);
"
```

### 3. The worker (~20 min)

This is the heart of the lesson. Open `backend/src/workers/exports.worker.ts`.

#### TODO 2 — the work itself

The processor function is where the export actually happens. Three things to
notice about its shape before you fill it in:

**It takes a `Job`, not a `Request`.** There is no `res` to write to and nobody
on the other end of a socket. The user got their answer seconds ago. That is
the entire point.

**It reads the expenses itself**, fresh from PostgreSQL, at the moment it runs.

**It reports progress.** `job.updateProgress()` writes to Redis, and every
listener in every process hears it. That is what will move the progress bar.

> **&#9888; Be honest about the `sleep` calls.** Building a CSV from a few
> hundred rows takes milliseconds. On its own this feature would not need a
> queue at all. Real report jobs are slow for reasons we are not building
> today: rendering a PDF, calling a currency API once per row, scanning two
> years of history. The sleeps buy you those seconds so you can *see* the queue
> work. It is the one fake thing in this exercise. Everything around it is
> real.

#### TODO 3 — retry, or real failure?

A few lines down, `concurrency: 2`. That number is a promise to the rest of
your system: however long the queue gets, this worker will never run a third
export at once. A queue with no concurrency limit is just a slower way to
crash.

> **&#10067; Why does TODO 3 need a guard at all?** Because the `failed`
> listener fires after **every** attempt, including the ones BullMQ is about to
> retry. Without the guard, the first throw writes `failed` to the row — and
> then the second attempt succeeds, and your user has been told their export
> died when it did not.

#### Run it as its own process

Nothing has started the worker yet. It could be imported into `app.ts`, but
then it would share a process with your API, and the whole claim of this lesson
is that it does not have to.

Open `backend/worker.ts` — written for you, including a `SIGTERM` handler so a
deploy does not kill a job halfway. You need **two terminals**, both in
`backend/`:

```bash
npm run dev      # terminal 1 — the API
npm run worker   # terminal 2 — the worker
```

You cannot try it yet; the route comes next.

### 4. Answer before the work is done (~15 min)

Open `backend/src/routes/exports.router.ts` and do **TODO 4**.

Then get a token and try it. Every demo user's password is `topsecret`:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"john.doe@example.com","password":"topsecret"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

curl -i -X POST http://localhost:3000/api/exports -H "Authorization: Bearer $TOKEN"
```

> **&#9888; `202 Accepted`, not `200 OK`.** `200` means "here is what you asked
> for". `202` means "I have taken this on, it is not done yet". This is not
> pedantry — it is the only thing in the response that tells a client the work
> is still moving. A client that sees `200` will assume the work is done.

Watch terminal 2. The worker picks the job up, and a few seconds later the row
is `completed`:

```bash
# use the id the POST above returned
curl -s http://localhost:3000/api/exports/1 -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:3000/api/exports/1/download?token=$TOKEN"
```

#### Now prove the two processes are really separate

This is the part worth doing slowly.

**Stop the worker** (Ctrl-C in terminal 2), leave the API running, and ask for
five exports:

```bash
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -X POST http://localhost:3000/api/exports -H "Authorization: Bearer $TOKEN"
done
curl -s http://localhost:3000/api/exports -H "Authorization: Bearer $TOKEN"
```

Every one says `queued`. Nothing failed. Nothing is lost. The API never slowed
down — the work is sitting in Redis, waiting for someone to come and do it.

**Start the worker again** and watch them drain:

```
t+3s    14:running    15:running    16:queued     17:queued     18:queued
t+7s    14:completed  15:completed  16:running    17:running    18:queued
t+11s   14:completed  15:completed  16:completed  17:completed  18:running
```

> **&#10067; Two at a time. Why?** `concurrency: 2`. You read that number in
> exercise 3 and it was an assertion; this is it being true. Set it to 5,
> restart the worker, and all five run at once.

> **&#9888; Two processes, sharing nothing.** The API and the worker do not
> import each other. They do not know each other's port. They do not share a
> variable. The only thing between them is Redis — which is why the worker
> could move to another machine tomorrow, and why you can run five of them and
> one API.

Look at what Redis is holding while they wait:

```bash
docker compose exec valkey valkey-cli KEYS 'bull:exports:*'
docker compose exec valkey valkey-cli LLEN bull:exports:wait
```

### 5. Tell the browser (~30 min)

The export works, but the only way to know is to ask. Over and over.

> **&#10067; Pick a polling interval, and say what it costs.** Every five
> seconds? Then a user waits up to five seconds after the work is already done.
> Every 200ms? Then forty students in this room generate two hundred requests a
> second, and the honest answer to almost all of them is "no".
>
> There is no good number. The server already knows exactly when the job
> finished — so let the server be the one to speak.

A **WebSocket** is a connection that stays open and carries messages both ways.
The browser has `WebSocket` built in; the server uses the `ws` library.

#### TODO 5 — the server side

Open `backend/src/realtime/exportSocket.ts`. The upgrade handshake is written
for you. Read it, then do **TODO 5**.

> **&#9888; Notice where the token is.** `new WebSocket(url)` takes a URL and
> nothing else — there is nowhere to put an `Authorization` header. So the
> token goes in the query string, and a rejected connection is a raw
> `HTTP/1.1 401` written straight to the socket, because at that moment it is
> still an HTTP request.
>
> The download link has the same problem for the same reason. Learn it as a
> rule rather than two special cases: **the moment the browser is the one
> making the request, your headers are gone.** Everywhere else in this app your
> own JavaScript calls `fetch`, and `fetch` can set any header it likes.
>
> The cost is real: URLs reach access logs, browser history, and the `Referer`
> header. The two production answers are a cookie, or a single-use ticket that
> expires in seconds. Optional exercise B builds the second one.

> **&#10067; Why does TODO 5 exist at all?** An HTTP route got this for free:
> each request had its own handler, with its own `userId` in scope. One socket
> server holds every connection at once, so "who should see this?" becomes a
> question you answer by hand — and forgetting to is how one student watches
> another student's export.

#### TODO 6 — the browser side

Open `frontend/src/hooks/useExportSocket.ts` and do **TODO 6**. Then start the
frontend (you installed it during setup) and click the button:

```bash
# from frontend/, in a third terminal
npm run dev
```

> **&#10067; Why does the hook do one `GET` before opening the socket?** A
> socket tells you what happens **next**, not what already happened. If the job
> finished while the page was loading, no event is ever coming — and without
> that `GET` the page would wait forever for news that is already in the past.

> **&#9888; A WebSocket does not reconnect by itself.** If the connection
> drops, it stays dropped until you write the retry loop. Server-Sent Events —
> the one-way alternative covered in the slides — reconnect for free, which is
> the main reason to prefer them when the browser has nothing to say back.

#### Break it on purpose

A job that always fails is the easy case. The interesting one is a job that
fails **and then succeeds** — because that is where a missing TODO 3 guard
does its damage.

Add one line to the top of `processExportJob`:

```ts
if (job.attemptsMade < 2) throw new Error('Simulated flakiness');
```

That throws on the first two attempts and succeeds on the third. Restart the
worker, ask for an export, and **watch the row**, not the browser:

```bash
# every second, until it settles
curl -s http://localhost:3000/api/exports/<id> -H "Authorization: Bearer $TOKEN"
```

With your guard in place, the status goes:

```
queued -> running -> completed
```

Now delete the guard from TODO 3 — just the `isFinalAttempt` check, so the
listener always writes — and run it again:

```
queued -> failed -> running -> completed
```

> **&#9888; Look at that first word.** The export was marked **failed** while
> BullMQ was quietly about to retry it and succeed. Any user watching that row
> was told their export died. That is what the guard prevents, and it is why
> `worker.on('failed')` firing per attempt matters.

Put the guard back, and delete the `throw` when you are done.

> **&#10067; Why did the browser not show an error either way?** Because the
> message the browser gets comes from `QueueEvents`, not from the worker's own
> listener — and that one fires **once**, when the job finally gives up. The
> two listeners share a name and do different jobs. The row is the only place
> the bug is visible.

### 6. Ship it (~25 min)

Everything so far runs on your laptop. Your deployed app still has no queue.

1. On Render, create a **Key Value** instance. The free tier is 25 MB, one per
   workspace.
2. Copy its **internal** connection string — internal, not external: it keeps
   the traffic inside Render's network and it is faster.
3. In your **backend** service, add `REDIS_URL` with that value.
4. Add a second variable, `RUN_WORKER_IN_API`, set to `true`.
5. Push.

That fourth step is in `backend/app.ts` already:

```ts
if (process.env['RUN_WORKER_IN_API'] === 'true') {
  await import('./src/workers/exports.worker.ts');
}
```

> **&#9888; That `if` is a deployment compromise, written down as one.** Render
> has no free background-worker instance type, so on the free tier the API has
> to do the work too. On a paid plan you would create a **Background Worker**
> service pointing at the same repository, with `npm run worker` as its start
> command and the same `REDIS_URL`, and never set this variable. Your
> `worker.ts` would run there unchanged — because it already does, on your
> laptop, in terminal 2.
>
> Notice what did *not* change to support both shapes: the queue, the worker,
> the service, the routes. One `if`, in the file that decides what this process
> is.

Then test it in production:

1. Open your deployed frontend and log in.
2. Click **Export my expenses**. The button should answer at once.
3. Watch the progress bar. If it never moves, open the network tab and look at
   the WebSocket connection — a `401` points at the token, a connection that
   opens and receives nothing points at the worker.
4. Download the file and open it.

> **&#9888; Two free-tier facts that will confuse you later.** A free web
> service **sleeps after 15 minutes** with no traffic and takes about a minute
> to wake — WebSocket messages count as traffic, so an open page keeps it
> alive. And the Key Value instance is **not persistent**: a restart loses
> everything in it. That is survivable here precisely because of the split you
> built — the export rows and the files are in PostgreSQL, and only pending
> jobs would be lost. It would not be survivable if the queue were your source
> of truth.

## Summary

- **A long request is a broken promise.** It freezes your server, holds a
  socket, loses everything on restart, and leaves the user watching a spinner.
  Answer `202 Accepted` and do the work somewhere else.
- **Two databases, two different jobs.** PostgreSQL holds facts that must
  outlive everything — including, here, the finished file. Redis holds
  coordination between processes: the pending work, and the events about it.
- **A job is a note, not a payload.** It says what to do. The worker reads the
  data fresh, so nothing is ever stale.
- **The API and the worker share nothing but Redis.** You ran them as two
  processes and killed one while the other kept serving.
- **Retries and a concurrency limit are what a queue gives you that a function
  call cannot.** `attempts: 3` turns a network blip into a one-second delay;
  `concurrency: 2` is a promise this work will never swamp the rest of your
  system.
- **`worker.on('failed')` fires after every attempt. Guard it.** Only the last
  one is a real failure.
- **Push beats poll**, and one socket serves everybody — so filtering by user
  is now your job, on both ends.
- **When the browser makes the request, your headers are gone.** A WebSocket
  URL and a download link both take a URL and nothing else.

You started this lesson with a server that one slow click could freeze. You now
have one that takes the work, answers in milliseconds, survives its own
restart, retries when the world misbehaves, and tells the browser the moment
there is news. That is the architecture behind every "we will email you when
your report is ready" you have ever received.

## Going further

Optional. The lesson is complete without them.

### A. Make the WebSocket reconnect

Server-Sent Events — the one-way alternative from the slides — reconnect on
their own when a connection drops. Your WebSocket does not. Prove it: start an
export, kill the API mid-job, restart it. The progress bar stops forever.

Add reconnection to `useExportSocket`: on `onclose`, if the export is not
finished, wait and open a new socket. Then answer two questions.

- **How long do you wait?** Reconnecting instantly, from every open tab, the
  moment a server comes back up is how you keep it down. Look up "exponential
  backoff with jitter" and apply what you already configured on the queue.
- **What did you miss while you were away?** The job may have finished during
  the gap. Your reconnect needs the same `GET` the hook already does on mount —
  which is why that line is there.

### B. Stop putting the token in the URL

Add one route, behind the normal header guard, that mints a short-lived ticket:

```ts
// POST /api/exports/:id/ticket
const ticket = jwt.sign({ userId, exportId: id, kind: 'export-stream' }, JWT_SECRET, {
  expiresIn: '30s',
});
```

Then make the socket's upgrade handler accept **only** that kind of token, and
have the frontend ask for a ticket just before it connects.

- **What did you gain?** The URL still holds a token — but one that expires in
  thirty seconds, works for one export, and cannot create expenses or read a
  profile. A leaked access log is now worth nothing.
- **`kind: 'export-stream'` is doing real work.** Without it the server cannot
  tell a ticket from a session token, and you are back where you started.
- The download link has the same problem. One ticket for both, or one each?

### C. Give the user their history

`GET /api/exports` already returns every export this user has requested, and
nothing in the frontend calls it. Add a list to the export page: date, status,
row count, and a download link for the completed ones.

The interesting part is the empty state and the failed ones. What should a user
see for an export that failed three attempts last Tuesday?
