# Lesson 7 boilerplate — background jobs

This is the starting point for Lesson 7. It is the finished Lesson 6 application
(Express + GraphQL + JWT backend, React frontend) with everything for background
jobs already wired up **except the six decisions you are going to make**.

Students download it as `boilerplate.zip`; this folder is the source it is built
from.

## What is already done for you

- `docker-compose.yml` runs PostgreSQL **and** Valkey (a Redis-compatible server).
- `backend/src/redis.ts` — the Redis connection factory.
- `bullmq` and `ioredis` are already in `package.json`.
- The `Export` model, its migration, and `backend/src/types/export.ts`.
- `backend/src/services/exports.service.ts` — including `buildCsv`.
- `backend/worker.ts` — the worker process entry point, with graceful shutdown.
- `backend/src/realtime/exportSocket.ts` — the WebSocket server and its upgrade
  handshake.
- The whole frontend page, `frontend/src/pages/exports/ExportPage.tsx`, and its
  route.

None of that is the lesson. It is wiring, type modules and Tailwind.

## What you write

Six numbered gaps. Each one is a decision you could get wrong in an interesting
way, and each `// TODO n:` comment says what the code receives, what it must do,
and what it must not do.

| # | File | What |
|---|------|------|
| 1 | `backend/src/queues/exports.queue.ts` | the options that make it a queue |
| 2 | `backend/src/workers/exports.worker.ts` | the work itself |
| 3 | `backend/src/workers/exports.worker.ts` | retry vs. real failure |
| 4 | `backend/src/routes/exports.router.ts` | answer before the work is done |
| 5 | `backend/src/realtime/exportSocket.ts` | send to the right user only |
| 6 | `frontend/src/hooks/useExportSocket.ts` | act on one message |

Find them all with:

```bash
grep -rn "TODO [0-9]" backend/src frontend/src
```

## Checking your work

`backend/scripts/checks/step_<n>.js` scripts verify a gap for you where the
result isn't something you can see in a browser or check with one curl
command — the lesson tells you when to run one (`node scripts/checks/step_<n>.js`).
They print what they checked, and exit non-zero with a clear reason if
something is still missing.

## Getting started

```bash
# from backend/
cp .env.example .env
# change your JWT_SECRET value
docker compose up -d
npm install
npx prisma db migrate
node scripts/db-populate.ts

npm run dev            # terminal 1 — the API
npm run worker         # terminal 2 — the worker
```

```bash
# from frontend/, terminal 3
npm install
npm run dev
```

Every demo user's password is `topsecret`.

The app runs as-is: you can log in, list expenses, and use everything from
Lesson 6. Only the export feature is unfinished — asking for one returns a 500
until you have done TODO 4.

## Maintainers

This folder and `exercises/lesson-7-async-jobs-solution/` must stay in sync: the latter is
this boilerplate with every gap filled. After changing anything here, rebuild the
zip in the same commit:

```bash
# from exercises/lesson-7-async-jobs-boilerplate/
zip -r boilerplate.zip frontend backend README.md \
  -x '*/node_modules/*' '*/dist/*' '*/data/*' '*.env' \
     '*/.claude/*' '*/.cursor/*' '*/.devin/*' '*/.agents/*'
```
