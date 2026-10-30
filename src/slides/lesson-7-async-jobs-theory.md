---
marp: true
theme: default
paginate: true
header: 'Web 3 2026 - Work That Takes Too Long'
footer: 'Web 3 2026 - Vinci'
---

# Lesson 7: Work That Takes Too Long

## Queues, a second database, and telling instead of asking

<!--
Speaker notes:
• The live demo on slide 4 is the whole lesson. Run it, do not describe it.
• Have the backend running BEFORE the room fills up, with two terminals open
  side by side and the font already large enough to read from the back.
• Today has one big idea (two stores, two promises) and one small one (push
  beats poll). If they leave with only the first, the day worked.
-->

---

## Where we left off

**Laptops closed.**

Last week you guarded whole routers in `app.ts` with `requireAuth`, instead of
writing a check inside every route handler.

1. **Why guard the router** instead of each handler?
2. What did that buy you for routes you **had not written yet**?

*60 seconds. Talk to the person next to you.*

<!--
Speaker notes — RETRIEVAL, not revision. Do not answer for them.
Answers: (1) one decision, one file, no drift between handlers.
(2) a route added next month is guarded the day it is added.

Why open here: today they edit that same file again, and for a reason that
is new — the middleware will start *remembering who* the caller is, not just
*whether* there is a token. The contrast lands better if the old version is
fresh in their heads.
-->

---

## Every route you have written makes one promise

**"Wait, and I will give you the answer."**

- Browser asks
- Server works
- Browser gets the result

One request. One answer.

**That promise breaks the moment the work takes real time.**

<!--
Speaker notes:
• Say this slowly. It is the framing for everything after it.
• Ask: "how long is too long?" Let them argue. There is no number — the point
  is that the *shape* is wrong, not the duration.
-->

---

## Let us break it, live

```ts
app.get('/slow', (_req, res) => {
  const stop = Date.now() + 15_000;
  while (Date.now() < stop) {
    // busy: this is what real CPU work looks like to Node
  }
  res.json({ done: true });
});
```

**Terminal 1:** `curl localhost:3000/slow`
**Terminal 2:** `curl localhost:3000/ping`

### Hands up: does `/ping` answer now, or in 15 seconds?

<!--
Speaker notes — HINGE QUESTION. Take the vote before running it.
Most will say "immediately, Node is async". Let them commit out loud.

Then run it. /ping hangs. The room should be surprised.

Then show the OTHER version (await setTimeout) where /ping IS immediate, and
draw the distinction: waiting is cheap, WORK is not. Node has one thread for
your JavaScript.

Do not rush past the surprise. The confusion is doing the teaching.
-->

---

## Four problems, not one

A fifteen-second request:

1. **Blocks** other users (if it is real work)
2. **Holds a socket** open the whole time
3. **Is lost** if the server restarts
4. Leaves the user **staring at a spinner**

Making the code faster fixes *none* of these properly.

<!--
Speaker notes:
• Point at 3 especially. Students consistently under-rate it. A deploy in the
  middle of a 30s job silently loses a user's work, and nothing logs an error.
• The fix is not optimisation. The fix is changing what you promise.
-->

---

## Stop making the promise

> *"I have written this down. Go away. I will tell you when it is done."*

Answers in **20 milliseconds**.

This is not a trick. It is how every
*"we will email you when your report is ready"*
you have ever received actually works.

<!--
Speaker notes:
• Ask for examples they have seen: bank statement exports, Spotify Wrapped,
  "your data archive is ready" from any big platform, CI pipelines.
• Normalising it matters. This is not an advanced pattern, it is the default
  one for anything slow.
-->

---

## That costs you three new things

1. The work must be **written down** where another process can take it
   → **a job queue**

2. That place is **not PostgreSQL**
   → **Redis**

3. The browser must be **told**, not made to ask
   → **a WebSocket**

<!--
Speaker notes:
• This is the map of the day. Put it back up whenever they look lost.
• Item 2 is the one they will resist. Spend the time.
-->

---

## The part nobody expects: a second database

You have had **one** place to put things since lesson 2.

Today you add another.

### Not because it is faster.

<!--
Speaker notes:
• Pause on that last line. "Redis is fast" is the answer they will give, and
  it is the wrong model — it leads to "so should I put everything in Redis?"
• Let the question hang before the next slide.
-->

---

## Two stores, two jobs

|              | **PostgreSQL**        | **Redis**              |
|--------------|-----------------------|------------------------|
| Holds        | facts                 | work in progress       |
| Lives        | forever               | until the work is done |
| Losing it is | a disaster            | survivable             |
| Example      | this expense happened | job 12 is waiting      |

**Redis is not a faster Postgres.**

<!--
Speaker notes:
• Have them read the "Losing it is" row out loud. That row is the model.
• Do NOT say "Redis is the fast one". It leads straight to "so should I put
  everything in Redis?", and the answer is no.
• Someone will now ask the good question: "but Postgres could hold a queue
  too, couldn't it?" The next two slides are that question. If nobody asks
  it, ask it yourself.
-->

---

## Durability is a cost, not a gift

Every row Postgres stores also gets:

- a line in the write-ahead log
- a copy on every replica
- a place in tonight's backup
- a dead row left behind for autovacuum

For an expense, you want all four.

### A job lives ten seconds. Do you?

<!--
Speaker notes:
• This is the slide that answers "why not Postgres", and it is NOT about
  speed. Say that out loud.
• The dead-row point needs one sentence of MVCC: in Postgres an UPDATE does
  not edit a row, it writes a NEW version and leaves the old one to be
  cleaned up later. A queue row is INSERT, UPDATE (claimed), UPDATE
  (progress), DELETE -- four versions for one job. Multiply by your job rate
  and autovacuum is permanently chasing that one table.
• The vivid one is the backup. Ask: "what is in your 3am backup?" Answer: a
  snapshot of which jobs happened to be pending at 3am. Useless. You paid
  fsync for it.
-->
---

## "Could we just use Postgres?"

**Yes. And plenty of teams should.**

```sql
SELECT * FROM job
  WHERE status = 'queued'
  ORDER BY id
  FOR UPDATE SKIP LOCKED
  LIMIT 1;
```

That is a real queue. `pg-boss` ships it, and it is
downloaded millions of times a week.

<!--
Speaker notes:
• Be genuinely honest here. For a normal CRUD app with modest throughput,
  Postgres-as-queue is a good decision and one less thing to operate.
• SKIP LOCKED is the trick: two workers running this at the same time get
  two DIFFERENT rows instead of blocking on each other.
• What you give up: Postgres has no "wait until a job appears". pg-boss
  polls on a timer, with LISTEN/NOTIFY to wake it early -- and NOTIFY is
  fire-and-forget, so the poll stays as a backstop. Redis workers genuinely
  block; an idle worker costs nothing and picks up in under a millisecond.
• So the rule is not "Redis wins". It is: do you want blocking workers and
  job churn kept out of your main database? Then Redis. Otherwise Postgres
  is fine.
-->

---

## And the thing Postgres does better

```sql
BEGIN;
  INSERT INTO expense ...;
  INSERT INTO job    ...;   -- same transaction
COMMIT;
```

Both, or neither. **Redis cannot do that.**

In TODO 4 you write a row, *then* queue a job.
Two steps. Two chances to fail.

<!--
Speaker notes:
• This is the strongest argument against the choice we made, so make it
  yourself before a student does.
• Walk the failure: the API writes the export row, the process dies, the job
  was never queued. The row sits on `queued` forever and nothing retries it.
  That is a DUAL WRITE, and it is the price of putting the queue in another
  system.
• Ask: "how bad is it here?" Answer: survivable. The row exists, so the user
  can see a stuck export and ask again. Compare with queueing FIRST -- then
  a job would reference a row that does not exist. Order matters, and that
  is why the route writes the row first.
• The real-world fix is the outbox pattern -- write the job into Postgres in
  the same transaction, and ship it to Redis separately. Name it, do not
  teach it.
-->

---

## So how do you choose?

One question, every time:

### "If I lost this, would a user notice?"

|                  | Lose it and... | Goes in      |
|------------------|----------------|--------------|
| The expense      | a fact is gone | **Postgres** |
| The export row   | a fact is gone | **Postgres** |
| The CSV file     | a fact is gone | **Postgres** |
| A pending job    | it runs late   | **Redis**    |
| A progress event | a bar jumps    | **Redis**    |

<!--
Speaker notes:
• Walk the table. Make them answer the question for each row BEFORE you
  reveal the right column.
• Then: the free Render Key Value instance is NOT persistent -- it loses
  everything on restart. Ask "is our app broken?" Answer: no. Look at the
  table. Only the bottom two rows live there, and both are survivable.
• The real question: "when would it NOT be survivable?" Answer: if the queue
  were the only record that someone asked. It is not -- that is the export
  row, in Postgres. Which is exactly why the route writes the row FIRST and
  queues the job SECOND.
-->
---

## Redis does two jobs today

1. **The queue** — the list of pending work
2. **The event stream** — "job 12 is 60% done", across processes

Both are **coordination between two programs**.
Neither one is storing a fact.

### The CSV is a fact. It goes in PostgreSQL.

<!--
Speaker notes:
• That last line is what stops "Redis = fast Postgres" from sticking.
• Ask: "why not keep the file in Redis too?" Answers you want: it has to
  survive a restart; it is read alongside its row; it is a record of what
  happened, not a message between two programs.
• Honest aside, say it: in production that file goes to object storage
  (S3, R2), not a text column -- a database is an expensive place to keep
  bytes nobody queries. They will meet this at their first internship.
-->
---

## A queue, in one picture

```
POST /api/exports
      |
      |--> write a row in Postgres  (the receipt)
      |--> push a job into Redis    (the work)
      |
      +--> 202 Accepted             (20 ms later)

         ... meanwhile, elsewhere ...

   Worker  <-- pops the job from Redis
           --> reads expenses from Postgres
           --> builds the CSV
           --> saves the CSV on the row, completed
```

<!--
Speaker notes:
• Walk the arrows with a finger. Slowly.
• The key visual: the request handler and the worker NEVER touch each other.
  Redis sits between them. That is what lets the worker move to another
  machine later without changing a line.
-->

---

## Two processes, sharing nothing

```bash
npm run dev      # terminal 1 — the API
npm run worker   # terminal 2 — the worker
```

**Kill the worker. Ask for five exports.**

```
14:queued  15:queued  16:queued  17:queued  18:queued
```

Nothing failed. Nothing is lost. The API never slowed down.

<!--
Speaker notes:
• Do this live if you can. It takes 40 seconds and it is the most convincing
  thing in the deck.
• They do not import each other. They do not know each other's port. They do
  not share a variable. Redis is the whole interface.
• Ask: "where is the work right now?" Answer: in Redis, as a list. Then ask
  "what happens if I deploy the API now?" Answer: nothing, the jobs are fine.
  That is item 3 from the "four problems" slide, solved.
-->

---

## ...and now start it again

```
t+3s    14:running    15:running    16:queued     17:queued     18:queued
t+7s    14:completed  15:completed  16:running    17:running    18:queued
t+11s   14:completed  15:completed  16:completed  17:completed  18:running
```

### Two at a time. Why?

<!--
Speaker notes — ask, wait, then point at the slide from earlier.
Answer: concurrency: 2.

This is the payoff for that slide. It was an assertion when they wrote it;
here it is a thing they watched. Invite them to set it to 5 and re-run.

Real output from a real run — this table is not invented.
-->

---

## 202, not 200

```ts
res.status(202).json(record);
```

| | means |
|---|---|
| **200 OK** | here is what you asked for |
| **202 Accepted** | I have taken this on, it is not done |

**It is the only thing in the response that says the work is still moving.**

<!--
Speaker notes:
• Small slide, real point. A client that sees 200 is ENTITLED to think it has
  the finished thing.
• Ask: "what does the body contain then?" Answer: the receipt — an id and a
  status — which is the thing they can come back with.
-->

---

## A job is a note, not a payload

```ts
await exportsQueue.add('export-expenses', {
  exportId: record.id,
  requesterId: userId,
});
```

Two numbers. **Not** the user's expenses.

### Why not?

<!--
Speaker notes — ask, do not tell. Wait for it.

Answer: a job can sit in the queue for a while. Data copied at click time is
stale by the time anyone reads it. The job says WHAT TO DO; the worker reads
the data fresh.

Second answer, if someone gets the first: payload size. Redis is memory, and
a queue of fat jobs fills it.
-->

---

## What a queue gives you that a function call cannot

```ts
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { age: 3600 },
}
```

- **`attempts`** — a network blip becomes a 1-second delay, not a lost request
- **`backoff`** — 1s, then 2s, then 4s. Do not stampede a service that is down
- **`removeOnComplete`** — Redis is memory. Finished jobs are not free

<!--
Speaker notes:
• "Write retry-with-exponential-backoff yourself, correctly, including the
  case where the process dies mid-retry." That is the sell.
• removeOnComplete is the one they will skip and regret. 25 MB free tier.
-->

---

## And one promise you make back

```ts
new Worker(EXPORTS_QUEUE, processExportJob, {
  concurrency: 2,
});
```

However long the queue gets, this worker runs **two** at a time.

**A queue with no concurrency limit is just a slower way to fall over.**

<!--
Speaker notes:
• Ask: "what breaks without this?" Answers: database connection pool
  exhausted, memory, CPU starvation of the API.
• This is a promise to the REST of the system, not to the user.
-->

---

## Two events with the same name

```ts
worker.on('failed', ...)        // fires after EVERY attempt
queueEvents.on('failed', ...)   // fires ONCE, at the end
```

With `attempts: 3` and a job that always throws:

- `worker.on('failed')` → **3 times**
- `queueEvents.on('failed')` → **1 time**

<!--
Speaker notes:
• This is the trap of the lesson. They WILL get it wrong.
• Between attempts the job moves to `delayed`, which is not a failure.
• Consequence: only the worker listener needs an isFinalAttempt() guard.
  Without it, the first throw marks the export failed — and then attempt two
  succeeds, and the user has been told their export died when it did not.
• Measured, not guessed: attemptsMade was 1, 2, 3 on the worker; one event
  with attemptsMade 3 on queueEvents.
-->

---

## Now: how does the browser find out?

The server knows **exactly** when the job finished.

The browser does not.

### Obvious answer: ask every few seconds.

<!--
Speaker notes:
• Let them propose polling. They will. It is the natural answer.
• Do not call it wrong yet. Make them cost it on the next slide.
-->

---

## Pick a polling interval. Out loud.

| Every... | Cost |
|---|---|
| **5 seconds** | user waits up to 5s after it is already done |
| **1 second** | 40 students = 40 req/s, answer is "no" every time |
| **200 ms** | 200 req/s, answer is "no" every time |

### There is no good number.

<!--
Speaker notes — HINGE. Take an actual vote on an interval first, then show
this table.

The punchline: the badness is not in the number, it is in the SHAPE. The
server already knows. Asking it repeatedly is the wrong question.
-->

---

## So let the server speak

A **WebSocket**: one connection, stays open, messages both ways.

```
browser  --- GET /ws/exports?token=...  --->  server
         <-- 101 Switching Protocols -------
         <-- {"type":"progress","percent":60}
         <-- {"type":"progress","percent":90}
         <-- {"type":"completed","exportId":12}
```

Built into the browser. `ws` on the server.

<!--
Speaker notes:
• The upgrade is an ordinary HTTP request that stops being HTTP halfway
  through. That is why a rejected one is answered by writing a raw
  "HTTP/1.1 401 Unauthorized" to the socket -- at that instant there is no
  `res` object yet.
• Point at ?token= and park it. Two slides from now it gets its own.
• They do NOT write the handshake; it is in the boilerplate. They write who
  receives each message.
-->
---

## One socket server, forty students

```ts
// an HTTP route — userId is right there
router.get('/:id', (req, res) => {
  const { userId } = currentUser(res);
  ...
});

// a socket server — who is this?
wss.on('connection', (client) => { ... });
```

A request has one handler and one user.
A socket server holds **everybody**, at once.

### So who receives this message?

<!--
Speaker notes:
• Do NOT answer it. This is TODO 5, and working out that you need a
  user -> socket map is the exercise.
• Ask instead: "what happens if you skip the question and send to every
  client?" Answer: every student watches every other student's progress
  bar. Funny in a classroom; a data breach at work.
• The client has the mirror-image problem (TODO 6): one socket carries every
  export this user owns, so the hook filters on exportId too. Two filters,
  one at each end, same reason.
-->
---

## A socket is not a mailbox

It tells you what happens **next**.
Not what already happened.

```ts
// before opening the socket
const current = await apiRequest(`/api/exports/${id}`);
```

If the job finished while the page was loading,
**no event is ever coming**.

<!--
Speaker notes:
• This catches people. They open the socket, see nothing, and assume the
  socket is broken. It is working perfectly -- there is simply no news.
• Same class of bug as a chat app that shows no history: a stream carries
  the future, a GET carries the present.
• It is one line in the boilerplate and the lesson points at it, but ask
  them WHY it is there rather than telling them.
-->
---


## The other half of the family: SSE

| | **WebSocket** | **Server-Sent Events** |
|---|---|---|
| Direction | both ways | server → browser |
| Server library | `ws` | none |
| Reconnects | **you write it** | automatically |
| Protocol | upgrade | plain HTTP |

**One direction only? SSE is less to get wrong.**

<!--
Speaker notes:
• Be honest: for THIS feature SSE would have been enough, and would have
  given them reconnection for free. We built WebSockets because they are the
  general tool and the one they will be asked about in interviews.
• Reach for WebSockets when the BROWSER also has something to say: chat,
  cursors, collaborative editing, games. A job notification is one-way.
• Optional exercise A makes them write reconnection by hand. That is the
  concrete way to feel what the SSE column hands you.
• No exercise on SSE this week. This slide is the whole coverage.
-->

---

## When the browser calls, your headers are gone

```ts
new WebSocket(url)                    // URL only
<a href="/download">                  // a real navigation
```

Neither can send `Authorization: Bearer ...`.

So the token goes in the **query string**.

<!--
Speaker notes:
• Make them feel the compromise, do not wave it away:
  URLs reach access logs, browser history, and the Referer header.
  You would never put a password there.
• Ask: "why is this fine for fetch()?" Because YOUR JavaScript makes that
  call. The moment the BROWSER makes it, headers are not yours.
• That is the rule worth keeping. Two instances today, same cause.
-->

---

## The two real answers

Neither is built today — both are worth knowing:

1. **A cookie**
   the browser attaches them to both, automatically

2. **A single-use ticket**
   Mint a token valid for *this one stream*, expiring in 30 seconds

<!--
Speaker notes:
• If anyone asks "so was lesson 6 wrong to use localStorage?" — good question,
  honest answer: it is a trade-off, and cookies bring CSRF with them. Not a
  today problem, but do not pretend localStorage is strictly worse.
-->

---


## Where this runs in production

```
Render free tier
├── Web service   (API + worker, because...)
├── PostgreSQL    (the facts)
└── Key Value     (25 MB, Valkey, NOT persistent)
```

- **No free background worker** → `RUN_WORKER_IN_API=true` folds it in
- **Sleeps after 15 min** idle
- **Key Value is not persistent** → and that is survivable, by design

<!--
Speaker notes:
• "By design" matters: the export ROWS are in Postgres. Losing Redis loses
  pending jobs and cached files, not the record that someone asked.
• On a paid plan: a Background Worker service, same repo, `npm run worker`
  as its start command, same REDIS_URL, and you never set that variable.
  Their worker.ts runs there unchanged — because it already does, on their
  laptop, in terminal 2. That is why the two-process exercise matters: the
  free-tier shape is the compromise, not the normal one.
• Valkey vs Redis: Redis changed its licence in 2024, the maintainers forked
  it, the fork is what most managed "Redis" runs now. Same protocol.
-->

---

## Today, in one slide

- A long request is a **broken promise** — answer `202` instead
- **Two stores, two jobs**: facts vs. coordination between processes
- **Durability is a cost** — WAL, replicas, backups, vacuum. Worth it for an
  expense, wasted on a job that lives ten seconds
- *"If I lost this, would a user notice?"* — that is the whole decision
- A job is a **note**, not a payload
- **Retries** and a **concurrency limit** are why a queue beats a function call
- **The API and the worker share nothing but Redis** — you watched it
- **Push beats poll** — and filtering is now your job, at both ends
- When the **browser** calls, your headers are gone

<!--
Speaker notes:
• Read the second and third bullets last if you only have time for two.
• If one student remembers one thing, make it this: we did not pick Redis
  because it is fast. We picked it because we did not want this data in the
  backups.
• Then send them to the exercises. Exercise 0 repeats the live demo from
  slide 4 on their own machines — that is deliberate, they need to feel it,
  not just have watched it.
-->

---

## Exercises

**`/exports`** — a button that answers immediately, a worker that builds the
file, and a progress bar that moves because the server is **pushing** to it.

### Then deploy it.

<!--
Speaker notes:
• THEY DOWNLOAD A BOILERPLATE this week, not last week's solution. Put the
  link on the board. It is the finished lesson 6 with six gaps in it.
• `grep -rn "TODO [0-9]" backend/src frontend/src` finds all six. Everything
  else -- Tailwind, type modules, migrations, the WebSocket handshake -- is
  written for them, on purpose. None of it is the lesson.
• Time shape: ex 0-3 (queue + worker) about 63 min, ex 4 (the route) 15,
  ex 5 (the socket) 30, ex 6 (deploy) 12.
• The two-terminal demo in exercise 4 is the one everybody must actually
  run -- stop the worker, queue five, start it, watch them drain in pairs.
  Walk the room during it.
• Optional at the end: make the socket reconnect, mint single-use tickets,
  or build the history list.
-->
