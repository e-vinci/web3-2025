# Common Issues to Look For in Code Reviews

> This memo summarizes recurring problems introduced by junior developers. During the exam, focus on spotting these patterns and explaining why they are problematic.

## Architecture & Design

- **A1. Leaky abstractions** – Modules expose internal details or require callers to know too much about implementation, creating tight coupling and brittle code.
- **A2. Missing domain invariants** – Business rules (e.g. totals that must balance) are not enforced, allowing invalid data into the system.
- **A3. Over-fetching/under-fetching data** – Inefficient queries (such as N+1 patterns) or missing eager loading degrade performance and correctness.
- **A4. Poor separation of concerns** – UI components performing data access or repositories handling HTTP requests make maintenance harder.
- **A5. Improper state management** – Shared mutable state without synchronization, or relying on global singletons, leads to race conditions and unpredictable behavior.
- **A6. Conflicting data sources** – Multiple layers recomputing or duplicating the same information drift out of sync, leaving reviewers unsure which representation is authoritative.

## Data & Persistence

- **B1. Incorrect data types** – Choosing lossy types (like floating point for money) or nullable fields that should be required causes rounding errors and null crashes.
- **B2. Lack of constraints** – Missing unique keys, foreign keys, or validation hooks allows duplicate or orphan records.
- **B3. Unbounded growth** – No archiving, pagination, or retention strategy for ever-growing tables or logs harms scalability.
- **B4. Inefficient queries** – Full table scans, lack of indexes, or filtering in memory increase latency and cost.

## API & Backend

- **C1. Inadequate error handling** – Swallowing exceptions, returning generic 200 responses, or exposing stack traces confuses clients and hides bugs.
- **C2. Missing authorization** – Sensitive endpoints without role checks or ownership validation expose data to unauthorized users.
- **C3. Improper use of async** – Forgetting to await promises or mixing callbacks can lead to race conditions and partially applied updates.
- **C5. Inconsistent API contracts** – Endpoints that violate HTTP semantics or expose mismatched shapes break clients and make debugging harder.
- **C6. Incorrect status codes** – Returning 200/201 for failures or authorization errors misleads clients and breaks automated handling.

## Frontend & Client

- **D1. Tight coupling to API contracts** – Components that assume specific response shapes break easily when the backend evolves.
- **D2. Derived data bugs** – Calculations done client-side instead of using authoritative values cause drift and rounding discrepancies.
- **D3. Unvalidated user input** – Accepting raw form values without sanitizing or normalizing leads to incorrect API calls.
- **D4. Inefficient re-renders** – Passing unstable props or mutating state directly can trigger unnecessary renders and bugs.
- **D5. Async data handling mistakes** – Failing to await loaders or ignoring request outcomes leaves the UI in inconsistent states.
- **D6. Rendering unresolved data** – Treating pending promises or loaders as if they are ready objects leads to blank or crash-prone UI states.

## Security & Privacy

- **E1. Overly permissive defaults** – Allowing anonymous access or skipping ownership checks invites data leaks and privilege escalation.
