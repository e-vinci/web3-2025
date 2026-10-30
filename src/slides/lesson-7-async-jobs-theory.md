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

|              | **PostgreSQL**        | **Redis**              |
|--------------|-----------------------|------------------------|
| Holds        | facts                 | work in progress       |
| Lives        | forever               | until the work is done |
| Losing it is | a disaster            | survivable             |
| Example      | this expense happened | job 12 is waiting      |

### Not because it is faster.

<!--
Speaker notes:
• Have them read the "Losing it is" row out loud. That row is the model.
• Do NOT say "Redis is the fast one". It leads straight to "so should I put
  everything in Redis?", and the answer is no.
• Redis is the new thing today. Postgres they know. Spend the time on what
  Redis is FOR, not on comparing query languages.
-->

---

## Durability is a cost, not a gift

Every row Postgres stores also gets:

- a line in the write-ahead log
- a copy on every replica
- a place in tonight's backup
- a dead row left behind for autovacuum

For an expense, you want all four.
A job lives ten seconds.

### "If I lost this, would a user notice?"

<!--
Speaker notes:
• THIS is why we are not using Postgres for the queue, and it is not about
  speed. Say that out loud.
• One sentence of MVCC if they want it: an UPDATE in Postgres does not edit
  a row, it writes a new version and leaves the old one for autovacuum. One
  job is four versions -- insert, claimed, progress, delete.
• The vivid one is the backup. Ask "what is in your 3am backup?" Answer: a
  snapshot of which jobs happened to be pending at 3am. Useless, and you
  paid fsync for it.
• Then the closing question, applied: the expense, the export row and the
  CSV all go in Postgres. A pending job and a progress event go in Redis.
  Make them answer each one before you say it.
• The free Render Key Value instance is NOT persistent. Ask "is our app
  broken?" No -- only the two survivable things live there.

IF SOMEONE ASKS "but Postgres could do this, couldn't it?" -- good question,
answer it honestly, no slide needed:
  - Yes. SELECT ... FOR UPDATE SKIP LOCKED is a real queue, and pg-boss
    ships exactly that. For modest throughput it is a fine choice and one
    less thing to run.
  - What it gives up: Postgres has no "wait until a job appears". pg-boss
    polls on a timer and uses LISTEN/NOTIFY to wake early -- but NOTIFY is
    fire-and-forget, so the poll stays as a backstop. Redis workers truly
    block: an idle worker costs nothing and picks up in under a millisecond.
  - What Postgres does BETTER: you can enqueue inside the same transaction
    as the write that caused it. Redis cannot. In TODO 4 they write the row
    and THEN queue the job -- two steps, two chances to fail. If the process
    dies between, the row sits on `queued` forever. That is a dual write,
    and it is the price of a second system. It is survivable here precisely
    because the row is written FIRST. The real fix is the outbox pattern;
    name it, do not teach it.
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

## What a queue gives you

```ts
{ attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
```

- a network blip becomes a **1-second delay**, not a lost request
- `removeOnComplete` — Redis is memory, and finished jobs are not free

```ts
new Worker(QUEUE, processExportJob, { concurrency: 2 });
```

### However long the queue gets: **two at a time.**

<!--
Speaker notes:
• "Write retry-with-exponential-backoff yourself, correctly, including the
  case where the process dies mid-retry." That is the sell for a queue over
  a plain function call.
• concurrency is a promise to the REST of the system, not to the user. Ask
  "what breaks without it?" -- connection pool exhausted, memory, the API
  starved of CPU. A queue with no limit is a slower way to fall over.
• Hold the number 2. The next two slides are them watching it be true.
• removeOnComplete they will skip and regret: the free instance is 25 MB.
• NOT on a slide, say it if asked: worker.on('failed') fires after EVERY
  attempt, queueEvents.on('failed') fires once at the end. That trap is
  TODO 3, and the exercise makes them measure it -- three log lines, one
  browser message. Do not pre-empt it here.
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
Speaker notes — ask, wait, then page back two slides.
Answer: concurrency: 2, which they saw on "What a queue gives you".

That was an assertion. This is them watching it be true. Invite them to set
it to 5 and re-run — the exercise tells them how.

Real output from a real run; this table is not invented.
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
| **1 second** | 40 students = 40 req/s, can the server handle it? |
| **200 ms** | 200 req/s, the server cannot handle it. |

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
• If they ask "so what DO you do?" -- two real answers, neither built today:
  a cookie (the browser attaches those to both automatically), or a
  single-use ticket valid for one connection and expiring in seconds.
  Optional exercise B builds the ticket. Name them and move on.
-->

---

## Today, in one slide

- A long request is a **broken promise** — answer `202` instead
- **Durability is a cost.** Worth it for an expense. Wasted on a job that
  lives ten seconds
- *"If I lost this, would a user notice?"* — that is the whole decision
- **Retries** and a **concurrency limit** are why a queue beats a function call
- **The API and the worker share nothing but Redis** — you watched it
- **Push beats poll.** And when the browser calls, your headers are gone

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
• Time shape: ex 0-3 (queue + worker) 50 min, ex 4 (the route) 15,
  ex 5 (the socket) 30, ex 6 (deploy) 25.
• The two-terminal demo in exercise 4 is the one everybody must actually
  run -- stop the worker, queue five, start it, watch them drain in pairs.
  Walk the room during it.
• Optional at the end: make the socket reconnect, mint single-use tickets,
  or build the history list.

THE RENDER BITS (exercise 6 walks them through it; flag these three so
nobody loses twenty minutes to them):
  • No free background-worker instance type -- so RUN_WORKER_IN_API=true
    folds the worker into the API there. One `if` in app.ts. On a paid plan
    it is a Background Worker service running `npm run worker`, and their
    worker.ts runs there unchanged.
  • A free web service SLEEPS after 15 min idle and takes ~1 min to wake.
    WebSocket messages count as traffic, so an open page keeps it alive.
  • The Key Value instance is NOT persistent. Ask them: is our app broken?
    No -- the rows and the CSV are in Postgres. Only pending jobs are lost.
    That is the decision rule from earlier, paying off in production.
-->
