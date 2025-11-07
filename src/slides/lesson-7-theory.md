# Lesson 7: Async Processing & Pub/Sub Patterns
## Slide Content Outline

---

## Slide 1: Title Slide
**Lesson 7: Asynchronous Processing & Pub/Sub**
- Background jobs and real-time updates
- Building scalable, responsive applications

---

## Slide 2: The Problem with Synchronous Processing
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

**Problems:**
- User waits 5+ seconds for response
- Server thread blocked
- Poor user experience
- Timeouts on slow operations
- Wasted resources

---

## Slide 3: Asynchronous Processing Solution
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

**Benefits:**
- Fast API responses
- Better resource utilization
- Horizontal scalability (add more workers)
- Retry failed operations
- Handle spikes in traffic

---

## Slide 4: Common Use Cases for Async Processing
**When to Use Background Jobs**

1. **Email Sending**
   - Newsletters, notifications, reports
   - SMTP can be slow/unreliable

2. **File Processing**
   - PDF generation, image resizing
   - Video transcoding, file compression

3. **External API Calls**
   - Payment processing, webhooks
   - Third-party integrations

4. **Data Processing**
   - Analytics, reports, aggregations
   - Batch operations, imports/exports

5. **Scheduled Tasks**
   - Cleanup jobs, reminders
   - Daily/weekly reports

---

## Slide 5: Job Queue Architecture
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

**Components:**
- **Producer**: Creates jobs (your API server)
- **Queue**: Stores pending jobs (Redis, database)
- **Worker**: Processes jobs (separate process)
- **Job**: Unit of work with data and status

---

## Slide 6: BullMQ - Job Queue for Node.js
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

**Why Redis?**
- In-memory = fast
- Persistence available
- Atomic operations
- Pub/Sub built-in

---

## Slide 7: BullMQ Job Lifecycle
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

**States:**
- **waiting**: In queue, ready to process
- **delayed**: Scheduled for future
- **active**: Currently being processed
- **completed**: Successfully finished
- **failed**: Error occurred (retries possible)

---

## Slide 8: Bull Board - Queue Monitoring
**Visual Dashboard for Your Queues**

**Features:**
- 📊 View all queues and job counts
- 🔍 Inspect job details and data
- ⚠️ Monitor failed jobs
- 🔄 Retry failed jobs manually
- 🗑️ Clean completed/failed jobs
- 📈 Real-time updates

**Why Monitor?**
- Debug production issues
- Track job performance
- Identify bottlenecks
- Alert on failures

---

## Slide 9: Pub/Sub Pattern
**Broadcasting Events to Multiple Listeners**

**Traditional Request/Response:**
```
Client ──request──▶ Server
Client ◀─response── Server
```

**Pub/Sub:**
```
                    ┌─────────┐
         subscribe  │Publisher│  publish
        ┌───────────│ (Event) │───────────┐
        ▼           └─────────┘           ▼
   Subscriber 1                      Subscriber 2
   (Browser)                         (Mobile App)
```

**Key Concepts:**
- **Publisher**: Emits events (doesn't know who's listening)
- **Subscriber**: Listens for events (doesn't know who published)
- **Topic/Channel**: Named event stream
- **Decoupling**: Publishers and subscribers are independent

---

## Slide 10: Real-time Updates - HTTP Polling vs WebSocket
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

## Slide 11: WebSocket Connection Lifecycle
**Persistent Bidirectional Connection**

```
1. HTTP Handshake
   GET /socket.io/?transport=websocket
   Upgrade: websocket

2. Connection Established
   Client ◀──────▶ Server
   (persistent connection)

3. Bidirectional Events
   Server ──▶ Client: 'expense-created'
   Client ──▶ Server: 'join-room'

4. Disconnect
   Connection closed (client leaves, timeout, error)
```

**Advantages:**
- Low latency (no HTTP overhead)
- Full duplex (both directions)
- Real-time updates
- Efficient for high-frequency data

---

## Slide 12: Socket.io - WebSocket Made Easy
**WebSocket Library with Fallbacks**

**Features:**
- ✅ Automatic reconnection
- ✅ Rooms and namespaces
- ✅ Broadcasting to groups
- ✅ Fallback to HTTP long-polling
- ✅ Binary data support
- ✅ Acknowledgments
- ✅ Middleware support

**Why Socket.io?**
- Handles edge cases
- Cross-browser support
- Built-in heartbeat/ping
- Easy integration with Express

---

## Slide 13: Socket.io Rooms
**Organizing Connections**

```
Room: "user-123"
  ├─ Connection 1 (Browser)
  ├─ Connection 2 (Mobile)
  └─ Connection 3 (Tablet)

Room: "expense-45"
  ├─ Connection A
  └─ Connection B

// Broadcast to specific room
io.to("user-123").emit("notification", data)
```

**Use Cases:**
- User-specific notifications
- Group/team channels
- Document collaboration
- Game lobbies

---

## Slide 14: Combining Queues & Real-time
**Complete Async Architecture**

```
1. User creates expense
   Client ──POST /expenses──▶ API Server

2. API responds immediately
   API Server: Save to DB ✓
   API Server: Queue PDF job ✓
   API Server ──response──▶ Client (200ms)

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

## Slide 15: Error Handling in Async Systems
**Things Will Fail**

**Strategies:**

1. **Retries with Exponential Backoff**
   - Attempt 1: immediate
   - Attempt 2: after 1s
   - Attempt 3: after 4s
   - Attempt 4: after 16s

2. **Dead Letter Queue (DLQ)**
   - Jobs that failed max retries
   - Manual review and retry
   - Alert developers

3. **Timeouts**
   - Don't let jobs run forever
   - Kill and retry on timeout

4. **Idempotency**
   - Safe to retry same job
   - Use unique job IDs
   - Check if work already done

5. **Circuit Breaker**
   - Stop calling failing service
   - Fail fast during outages

---

## Slide 16: Monitoring & Observability
**You Can't Fix What You Can't See**

**Key Metrics:**
- Queue depth (jobs waiting)
- Processing time (p50, p95, p99)
- Failure rate
- Retry rate
- Worker utilization

**Tools:**
- **Bull Board**: Queue dashboard
- **Logs**: Structured logging (JSON)
- **Metrics**: Prometheus, Grafana
- **Alerts**: Slack, PagerDuty
- **Tracing**: OpenTelemetry

**What to Monitor:**
- Job delays (queue backed up?)
- Failed jobs (integration down?)
- Worker crashes (memory leak?)
- Redis connection (network issue?)

---

## Slide 17: Best Practices
**Building Reliable Async Systems**

**Do:**
- ✅ Make jobs idempotent
- ✅ Set reasonable timeouts
- ✅ Log job start/end/errors
- ✅ Monitor queue depth
- ✅ Use job priorities wisely
- ✅ Keep job data small
- ✅ Validate job data
- ✅ Handle worker crashes gracefully

**Don't:**
- ❌ Store large files in job data
- ❌ Assume jobs run immediately
- ❌ Ignore failed jobs
- ❌ Create infinite loops
- ❌ Block workers with sync code
- ❌ Share state between jobs

---

## Slide 18: Scaling Considerations
**From 1 Worker to 100**

**Horizontal Scaling:**
```
1 Worker:  10 jobs/sec
5 Workers: 50 jobs/sec
10 Workers: 100 jobs/sec
```

**Strategies:**
- Add more workers (easy)
- Partition queues by type
- Use multiple Redis instances
- Rate limit per API
- Cache expensive operations

**Watch Out For:**
- Race conditions (multiple workers)
- Resource limits (DB connections)
- Redis memory usage
- Network bandwidth

---

## Slide 19: Security Considerations
**Async Systems Security**

**Job Data:**
- Don't store passwords/secrets in jobs
- Sanitize user input in job data
- Validate job payload on worker

**Authentication:**
- WebSocket auth during handshake
- Verify user can join room
- Rate limit events per connection

**Authorization:**
- Check permissions before emitting events
- Don't leak data to wrong rooms
- Validate who can create jobs

**Denial of Service:**
- Rate limit job creation
- Set max queue size
- Timeout long-running jobs
- Limit WebSocket connections per user

---

## Slide 20: When NOT to Use Async
**Right Tool for the Job**

**Stick with Synchronous If:**
- Operation is very fast (<100ms)
- User needs immediate result
- Operation must complete before response
- Simple CRUD operations
- Atomic transactions required

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

**Rule of Thumb:**
- Sync: Fast, blocking is acceptable
- Async: Slow, background work, can fail and retry

---

## Slide 21: Our Implementation
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

**Tech Stack:**
- BullMQ + Redis (jobs)
- Socket.io (real-time)
- Bull Board (monitoring)
- PDFKit (PDF generation)

---

## Slide 22: Architecture Diagram
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

## Slide 23: Demo Time!
**See It In Action**

1. **Create an expense**
   - Watch it appear in real-time for all users

2. **Request PDF report**
   - Job added to queue (Bull Board)
   - Worker processes (watch progress)
   - Notification when complete

3. **Simulate failure**
   - Kill worker mid-job
   - Watch automatic retry
   - Job completes eventually

4. **Monitor dashboard**
   - Queue metrics
   - Job history
   - Failed jobs

---

## Slide 24: Summary
**Key Takeaways**

**Async Processing:**
- Improves response times
- Better resource utilization
- Enables horizontal scaling
- BullMQ for job queues

**Pub/Sub:**
- Decouples components
- Enables real-time features
- WebSocket for low latency
- Socket.io for ease of use

**Best Practices:**
- Monitor your queues
- Handle failures gracefully
- Make jobs idempotent
- Secure WebSocket connections

---

## Slide 25: Further Learning
**Resources**

**Documentation:**
- BullMQ: https://docs.bullmq.io/
- Socket.io: https://socket.io/docs/
- Bull Board: https://github.com/felixmosh/bull-board

**Concepts:**
- Message Queues (RabbitMQ, Kafka)
- Event-Driven Architecture
- CQRS (Command Query Responsibility Segregation)
- Event Sourcing

**Alternatives:**
- Agenda (MongoDB-based jobs)
- pg-boss (PostgreSQL-based jobs)
- AWS SQS (managed queue)
- Redis Pub/Sub (simpler than BullMQ)

---

## Slide 26: Exercise Overview
**What You'll Build**

1. Set up Redis and BullMQ
2. Create PDF generation queue
3. Add Bull Board monitoring
4. Integrate with GraphQL API
5. Set up Socket.io server
6. Connect React client to WebSocket
7. Broadcast expense events
8. Show real-time notifications
9. (Bonus) Schedule monthly reports

**Time:** ~2-3 hours

**Starting Point:** Your Lesson 6 code (secure GraphQL API)

---

## Slide 27: Questions?
**Let's Build Something Async!**

Questions to consider:
- When should you use async vs sync?
- How do you handle job failures?
- What's the difference between queues and pub/sub?
- How do you scale workers?
- How do you secure WebSocket connections?
