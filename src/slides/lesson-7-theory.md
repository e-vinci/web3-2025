# Lesson 7: Async Processing & Pub/Sub Patterns

---

## Lesson 7: Asynchronous Processing & Pub/Sub

- Background jobs and real-time updates
- Building scalable, responsive applications

---

## The Problem with Synchronous Processing

**When Everything Waits...**

Example: User creates expense → Generate PDF → Send email → Return response

```
POST /expenses
  ↓ (waiting...)
  Create DB record (100ms)
  ↓ (waiting...)
  Generate PDF (3000ms) ⏱️
  ↓ (waiting...)
  Send email (2000ms) ⏱️
  ↓
  Response: 5100ms total!
```

---

**Problems:**

- User waits 5+ seconds for response
- Server thread blocked
- Poor user experience
- Timeouts on slow operations
- Wasted resources

---

## Asynchronous at my Supermarket

Colruyt butchery service is asynchronous:

- You fill a form (prefilled with a number) with the meat pieces you want and drop it on a pile
- The butchers work through the pile one by one ("FIFO")
- Once your meat is ready, they call your number so you know its ready

---

## Asynchronous Processing Solution

**Do It Later, Respond Now**

```
POST /expenses
  ↓
  Create DB record (100ms)
  ↓
  Queue PDF generation job ⚡ (instant)
  ↓
  Queue email job ⚡ (instant)
  ↓
  Response: 100ms!

Meanwhile, in the background...
Worker 1: Generates PDF (3s)
Worker 2: Sends email (2s)
```

---

**Benefits:**

- Fast API responses
- Better resource utilization
- Horizontal scalability (add more workers)
- Retry failed operations
- Handle spikes in traffic

---

## Common Use Cases for Async Processing

1. **Email Sending**
2. **File Processing**
3. **External API Calls**
4. **Data Processing**
5. **Scheduled Tasks**

---

## Job Queue Architecture

**How It Works**

```
┌──────────┐      ┌───────────┐      ┌─────────┐
│ Producer │─────▶│   Queue   │◀─────│ Worker  │
│  (API)   │ add  │  (Redis)  │ poll │(Process)│
└──────────┘      └───────────┘      └─────────┘
                        │
                        ▼
                   [Job Data]
                   - ID: 12345
                   - Type: pdf
                   - Data: {...}
                   - Status: waiting
```

---

**Components:**

- **Producer**: Creates jobs (your API server)
- **Queue**: Stores pending jobs (Redis, database)
- **Worker**: Processes jobs (separate process)
- **Job**: Unit of work with data and status

---

### What & Why Redis

A job queue need storage for the tasks in the queues. While we could in theory use a DBMS for that (ie PG here), it's unusual. Job tasks tend to follow a get/set kind of requirements (save an object, retrieve by id).

Something that Redis is quite efficient at.

> A lot of different storages are possible - while RDBMS are the most common, it's important to understand what kind of data are a good fit for each of them.

---

## BullMQ - Job Queue for Node.js

**Modern, Redis-backed Queue**

**Features:**

- ✅ Written in TypeScript
- ✅ Rate limiting
- ✅ Job priorities
- ✅ Delayed/scheduled jobs
- ✅ Automatic retries
- ✅ Job progress tracking
- ✅ Parent-child jobs
- ✅ Events and hooks

---

## BullMQ Job Lifecycle

**From Creation to Completion**

```
  [waiting] ──▶ [active] ──▶ [completed] ✓
      │            │
      │            └──▶ [failed] ──▶ [waiting] (retry)
      │                    │
      │                    └──▶ [failed] (max retries) ✗
      ▼
  [delayed] ──(timer)──▶ [waiting]
```

More than just running - can declaratively decide how much to retry, when etc (very useful for services that can fail - typically external APIs).

---

## Bull Board - Queue Monitoring

**Visual Dashboard for Your Queues**

We want to be able to see how many jobs are in queues, how many are successful or failures, etc.

**Features:**

- 📊 View all queues and job counts
- 🔍 Inspect job details and data
- ⚠️ Monitor failed jobs
- 🔄 Retry failed jobs manually
- 🗑️ Clean completed/failed jobs
- 📈 Real-time updates

---

**Why Monitor?**

- Debug production issues
- Track job performance
- Identify bottlenecks
- Alert on failures

---

## Pub/Sub Pattern

**Broadcasting Events to Multiple Listeners**

**Traditional Request/Response:**

```
Client ──request──▶ Server
Client ◀─response── Server
```

---

**Pub/Sub:**

```
                    ┌─────────┐
         subscribe  │Publisher│  publish
        ┌───────────│ (Event) │───────────┐
        ▼           └─────────┘           ▼
   Subscriber 1                      Subscriber 2
   (Browser)                         (Mobile App)
```

---

**Key Concepts:**

- **Publisher**: Emits events (doesn't know who's listening)
- **Subscriber**: Listens for events (doesn't know who published)
- **Topic/Channel**: Named event stream

---

## Real-time Updates - HTTP Polling vs WebSocket

**How to Get Live Data?**

**HTTP Polling (Old Way):**

```
Every 5 seconds:
Client ──GET /api/updates──▶ Server
Client ◀─────response────── Server
Client ──GET /api/updates──▶ Server
Client ◀─────response────── Server
```

❌ Wasteful, latency, server load

---

**WebSocket (Modern Way):**

```
Client ──[upgrade to ws]──▶ Server
Client ◀────connected────── Server

// Then, bidirectional:
Client ◀────event 1────────
Client ◀────event 2────────
Client ─────message────────▶
```

✅ Real-time, efficient, bidirectional

---

## WebSocket Connection Lifecycle

**Persistent Bidirectional Connection**

```
1. HTTP Handshake
   GET /socket.io/?transport=websocket
   Upgrade: websocket

2. Connection Established
   Client ◀──────▶ Server
   (persistent connection)

---

3. Bidirectional Events
   Server ──▶ Client: 'expense-created'
   Client ──▶ Server: 'join-room'

4. Disconnect
   Connection closed (client leaves, timeout, error)
```

---

**Advantages:**

- Low latency (no HTTP overhead)
- Full duplex (both directions)
- Real-time updates
- Efficient for high-frequency data

---

## Socket.io - WebSocket Made Easy

**WebSocket Library with Fallbacks**

**Features:**

- ✅ Automatic reconnection
- ✅ Rooms and namespaces
- ✅ Broadcasting to groups
- ✅ Fallback to HTTP long-polling
- ✅ Binary data support
- ✅ Acknowledgments
- ✅ Middleware support

---

**Why Socket.io?**

- Handles edge cases
- Cross-browser support
- Built-in heartbeat/ping
- Easy integration with Express

---

**Use Cases:**

- User-specific notifications
- Group/team channels
- Document collaboration
- Game lobbies

---

## Combining Queues & Real-time

**Complete Async Architecture**

```
1. User creates expense
   Client ──POST /expenses──▶ API Server

2. API responds immediately
   API Server: Save to DB ✓
   API Server: Queue PDF job ✓
   API Server ──response──▶ Client (200ms)

```

---

```
3. Background worker processes job
   Worker: Generate PDF (3s)
   Worker: Save to storage ✓

4. Notify all connected clients
   Worker ──publish event──▶ Socket.io
   Socket.io ──broadcast──▶ All Clients

5. Client shows notification
   Client: "Your PDF is ready!" 🎉
```

---

## When NOT to Use Async

**Right Tool for the Job**

**Stick with Synchronous If:**

- Operation is very fast (<100ms)
- User needs immediate result
- Operation must complete before response
- Simple CRUD operations
- Atomic transactions required

---

**Example:**

```
// Good: Synchronous
GET /user/123
  ↓
  Query database (50ms)
  ↓
  Return user data

// Bad: Asynchronous
GET /user/123
  ↓
  Queue job to fetch user
  ↓
  Return "check back later"
  ❌ Unnecessarily complex!
```

---

**Rule of Thumb:**

- Sync: Fast, blocking is acceptable
- Async: Slow, background work, can fail and retry

---

## Our Implementation

**What We're Building**

**Feature 1: PDF Expense Reports**

- User requests expense summary
- Queue PDF generation job
- Worker generates PDF using PDFKit
- Notify user via WebSocket when ready
- Download from storage

**Feature 2: Real-time Expense Notifications**

- User creates/updates expense
- Broadcast to all participants
- Show toast notification
- Update UI without refresh

---

**Tech Stack:**

- BullMQ + Redis (jobs)
- Socket.io (real-time)
- Bull Board (monitoring)
- PDFKit (PDF generation)

---

## Architecture Diagram

**Complete System Overview**

```
┌─────────────┐
│   React     │
│   Client    │
└──┬──────┬───┘
   │      │
   │      └─────────(WebSocket)────────┐
   │                                   │
   │(HTTP)                             ▼
   │                         ┌──────────────────┐
   ▼                         │   Socket.io      │
┌────────────────┐           │     Server       │
│  Express API   │           └──────────────────┘
│   + GraphQL    │                    ▲
└────┬───────────┘                    │
     │                                │
     │                         (emit events)
     │                                │
     ▼                                │
┌────────────────┐           ┌───────┴──────────┐
│  PostgreSQL    │           │   BullMQ Worker  │
│   Database     │           │  (PDF Generator) │
└────────────────┘           └──────────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │  Redis Queue  │
                              └───────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │  Bull Board   │
                              │  (Dashboard)  │
                              └───────────────┘
```

---

## Infrastructure update

We had three pieces of infra:

- Backend (Express)
- Frontend (React/Vite)
- Database (PG)

---

We just added two more:

- Worker (Express)
- Storage (Redis)

--

> When adding new "features", it's important to understand the impact on the infrastructure

---

## Resources

**Documentation:**

- BullMQ: https://docs.bullmq.io/
- Socket.io: https://socket.io/docs/
- Bull Board: https://github.com/felixmosh/bull-board

