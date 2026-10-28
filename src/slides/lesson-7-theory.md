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
   → **Server-Sent Events**

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

## Two stores, two promises

| | **PostgreSQL** | **Redis** |
|---|---|---|
| Holds | facts | work in progress |
| Lives | forever | minutes or hours |
| Losing it is | a disaster | fine |
| Example | this expense happened | this file, for one hour |

**Redis is not a faster Postgres. It is a different promise.**

<!--
Speaker notes:
• Have them read the "Losing it is" row out loud. That row is the model.
• Concrete check: "Our Render free Key Value loses everything on restart. Is
  our app broken?" Answer: no — the export ROWS are in Postgres. Only pending
  jobs and cached files go. That is survivable BY DESIGN.
• Follow up: "when would it not be survivable?" Answer: if the queue were the
  only record that someone asked.
-->

---

## The line that justifies the whole thing

```ts
await redis.set(key, csv, 'EX', 3600);
```

**"Keep this for an hour, then forget it."**

- No `DELETE FROM`
- No cron job to write
- No cron job to deploy
- No cron job that silently stopped running three months ago

Expiry is a **property of the key**.

<!--
Speaker notes:
• This is the single most persuasive slide in the deck. Do not hurry it.
• Ask them to cost the same feature in Postgres out loud. Someone will say
  "a deletedAt column and a scheduled job". Agree, then ask who monitors it.
• Honesty note, say it: in production the FILE would go to S3, not Redis.
  Real reports are megabytes, Redis is memory. The TTL idea is identical;
  only the shelf changes.
-->

---

## Redis does three different jobs today

In one lesson, the same store is:

1. **The queue** — the list of pending work
2. **The event bus** — "job 12 finished", across processes
3. **The shelf** — finished CSVs, expiring by themselves

Three jobs PostgreSQL would do **badly**.

<!--
Speaker notes:
• Worth saying explicitly: this is unusual density on purpose. Most apps use
  Redis for one of these. Seeing three at once is what stops "Redis = cache"
  from sticking.
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
           --> stores it in Redis with a TTL
           --> marks the row completed
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

**Server-Sent Events**: an ordinary `GET` that never ends.

```
Content-Type: text/event-stream

event: progress
data: {"step":"building the file","percent":60}

event: completed
data: {"id":12,"status":"completed","rowCount":42}
```

That is the entire protocol. Text, with blank lines between messages.

<!--
Speaker notes:
• Show this live, and MIND THE ORDER -- POST first, then watch the id it
  returns:
      curl -s -X POST localhost:3000/api/exports -H "Authorization: Bearer $T"
      curl -N "localhost:3000/api/exports/<that id>/events?token=$T"
  You have about 4s before the job finishes. Opening the stream first and
  POSTing after does NOT work: the POST creates a new id, and the handler's
  own jobId filter correctly ignores it. Do not demo it that way.
• Note the TWO newlines ending a message. One is not enough. They will hit it.
-->

---

## Zero libraries. Both sides.

```ts
const source = new EventSource(url);

source.addEventListener('progress', (event) => {
  setProgress(JSON.parse(event.data));
});
```

- Built into every browser
- **Reconnects by itself** when the connection drops
- Nothing to install, update, or trust

<!--
Speaker notes:
• Ask: "why addEventListener('progress') and not onmessage?" Because the
  server wrote `event: progress`. Named events never fire onmessage. The
  names must match on both sides — a classic silent failure.
• The free reconnection is the main reason to prefer SSE over WebSockets when
  the traffic only goes one way.
-->

---

## Three ways to get the server side wrong

```ts
if (jobId !== mine) return;              // 1
req.on('close', cleanup);                // 2
res.flushHeaders();                      // 3
```

1. **One** event stream serves the whole queue — filter, or every user
   watches every other user's progress bar
2. Listeners on a long-lived emitter **pile up per request** until the
   process dies
3. Without it Express buffers, and the browser waits for a response that
   has already started

<!--
Speaker notes:
• Number 2 is the one that reaches production. Nothing warns you. It looks
  fine for a week and then the pod OOMs.
• Frame it: streaming endpoints are different from normal ones because they
  OUTLIVE the handler. Anything you open, you must close.
-->

---

## A subtle one: success and failure are not symmetric

```ts
onCompleted: re-read the row    ✅ safe
onFailed:    re-read the row    ❌ race
```

- **Success:** the worker writes the row *before* its processor returns.
  BullMQ emits *after*. The write already landed.

- **Failure:** the row is written by the worker's **own** `failed` listener,
  reacting to the **same event**. Nothing orders the two.

<!--
Speaker notes:
• This bug was real — it was written, shipped into a draft, and caught by
  forcing the worker to throw.
• Symptom (measured, do not overstate it): the client is sent a row that has
  not caught up -- still `queued` or `running`, with no failedReason -- so the
  user sees the generic "the export failed" and never the real reason. The
  browser does NOT hang; it shows the wrong message.
• Worth saying: "I got this wrong first" is more useful to them than a
  slide that pretends the correct version was obvious.
• Fix: the failure path uses the event's own data and never reads the DB.
-->

---

## When the browser calls, your headers are gone

```ts
new EventSource(url)                  // URL only
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
   `EventSource` sends them, with `withCredentials: true`

2. **A single-use ticket**
   Mint a token valid for *this one stream*, expiring in 30 seconds

<!--
Speaker notes:
• If anyone asks "so was lesson 6 wrong to use localStorage?" — good question,
  honest answer: it is a trade-off, and cookies bring CSRF with them. Not a
  today problem, but do not pretend localStorage is strictly worse.
-->

---

## SSE or WebSockets?

| | **SSE** | **WebSockets** |
|---|---|---|
| Direction | server → browser | both ways |
| Library | none | `ws` on the server |
| Reconnects | automatically | you write it |
| Protocol | plain HTTP | upgrade |

**One direction? Use SSE.** It is less to get wrong.

<!--
Speaker notes:
• Reach for WebSockets when the BROWSER also has something to say: chat,
  cursors, collaborative editing, games.
• A job notification is one-way. Using WebSockets here would be a choice to
  write reconnection logic for nothing.
• The optional exercise swaps the transport — the queue, worker and
  QueueEvents do not change at all. That is the payoff: the last hop is
  replaceable.
-->

---

## Where this runs in production

```
Render free tier
├── Web service   (API + worker, because...)
├── PostgreSQL    (the facts)
└── Key Value     (25 MB, Valkey, NOT persistent)
```

- **No free background worker** → worker runs inside the API
- **Sleeps after 15 min** idle
- **Key Value is not persistent** → and that is survivable, by design

<!--
Speaker notes:
• "By design" matters: the export ROWS are in Postgres. Losing Redis loses
  pending jobs and cached files, not the record that someone asked.
• On a paid plan: a Background Worker service, same repo, different start
  command, same REDIS_URL, and you delete one import from app.ts.
  Nothing else changes. Say that — it makes the free-tier compromise feel
  like a deployment detail rather than a lie.
• Valkey vs Redis: Redis changed its licence in 2024, the maintainers forked
  it, the fork is what most managed "Redis" runs now. Same protocol.
-->

---

## Today, in one slide

- A long request is a **broken promise** — answer `202` instead
- **Two stores, two promises**: facts forever vs. work in progress
- `EX 3600` is a feature you would otherwise **build, deploy and monitor**
- A job is a **note**, not a payload
- **Retries** and a **concurrency limit** are why a queue beats a function call
- **Push beats poll** — and clean up your listeners
- When the **browser** calls, your headers are gone

<!--
Speaker notes:
• Read the second bullet last if you only have time for one.
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
• Flag the time shape: exercises 0-5 are the queue (about 110 min), 6-7 are
  the streaming (about 55 min), 8 is the deploy (15 min).
• Tell them exercise 0 is ten minutes and they should not skip it.
• Optional exercises at the end: swap to WebSockets, force random failures,
  or build the history list. All genuinely optional.
-->
