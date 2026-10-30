# Prisma 8 Migration Troubleshooting Guide

## The Problem

Running `npx prisma db migrate --advance-ref db` failed with two distinct errors in sequence.

### Error 1 — `MIGRATION.RUNNER_FAILED`

```
✘ [MIGRATION.RUNNER_FAILED] Database schema does not satisfy contract (26 failures)
  why: The resulting database schema does not satisfy the destination contract.
```

The on-disk migration had been planned from an empty baseline and tried to apply to a database
that already had tables from a previous schema. The migration's prechecks rejected the apply
because the tables it was supposed to create already existed (in an older, partial form).

### Error 2 — `MIGRATION.MARKER_MISMATCH`

After re-running `npx prisma contract emit` and `npx prisma migration plan`, the migrate
command still failed:

```
✘ [MIGRATION.MARKER_MISMATCH] Database marker is not reachable in the on-disk migration graph
  why: DB marker is 346cd1699be21aee7e35bf9249e08f4ac21fecf0a8024ee1fcc41db9630b7065,
       but the on-disk migration graph reaches:
       9c83073fb5d8e345ab9ab1cdf00e72ef1ce4f6df0491d71e50bfbb705521c5f2, empty.
```

---

## Context

### How Prisma 8 tracks database state

Prisma 8 tracks each database's schema state with a **marker** — a hash stored inside the
database (in `prisma_contract.marker`) that records which contract hash the database was last
migrated to.

The on-disk migration graph lives under `migrations/app/`. Each migration file records a `from`
hash and a `to` hash. When you run `db migrate`, Prisma reads the DB's marker, finds the
migration whose `from` matches it, and applies it. If the marker hash is not a node in the
on-disk graph, `db migrate` stops with `MIGRATION.MARKER_MISMATCH` before touching anything.

Separately, the **`db` ref** (`migrations/app/refs/db.json`) is a local file that records
where the dev database currently is, so that `migration plan` can chain correctly without
opening a database connection.

### The two schema versions

The project had evolved through two schema phases.

**Phase 1 — Old schema** (DB marker `346cd1699...`):
- `user` table with `username`, `createdAt`, `updatedAt`; `name` was nullable; no `bankAccount`
- `expense` table with a `payer` text column; no `payerId` FK
- `post` table
- No `transfer` or `_ParticipantExpenses` tables

**Phase 2 — New schema** (contract hash `9c83073f...`, defined in `contract.prisma`):
- `user` with `name NOT NULL`, `bankAccount`, no `username/createdAt/updatedAt`
- `expense` with `payerId` (FK to `user`), no `payer` text column
- `transfer` table
- `_ParticipantExpenses` join table
- `post` table removed

The database was still at Phase 1. When `migration plan` ran without a `db` ref set, it
defaulted to an **empty baseline** and produced a migration `null → 9c83073f...` — a
full create-from-scratch plan. That migration's prechecks block applying to a non-empty
database (tables already exist), causing `MIGRATION.RUNNER_FAILED`.

After re-planning, the `MIGRATION.MARKER_MISMATCH` persisted: the on-disk graph had nodes
`{ null, 9c83073f... }`, but the DB's marker was `346cd1699...` — a hash not present in
the graph at all.

### Why `db sign` also failed

`db sign` verifies that the live schema fully satisfies the contract before updating the
marker. Here it surfaced the 26 underlying failures:

```
CONTRACT.SCHEMA_VERIFICATION_FAILED: Database schema does not satisfy contract (26 failures)
  missing: _ParticipantExpenses, transfer, expense.payerId, user.bankAccount
  mismatch: user.name (nullable in DB, NOT NULL in contract)
```

The DB schema genuinely did not match the new contract. `db sign` refused to sign it.

### Why matching `profileHash` was misleading

`db verify` reported the same `profileHash` for both the contract and the DB marker. The
`profileHash` captures the logical structure of the contract definition itself (model
declarations, field names, types as authored). The `storageHash` — which diverged — encodes
the physical storage representation including codec details. The matching `profileHash` did
not mean the DB tables were up to date; `db sign`'s live schema verification confirmed the
discrepancy.

---

## How It Was Solved

### Step 1 — Diagnose with `db sign`

```bash
npx prisma db sign
```

Running `db sign` triggered a full schema verification pass before attempting to update the
marker. The 26 failures it reported showed exactly which tables and columns were missing or
mismatched between the live DB and the new contract.

### Step 2 — Inspect with `db update --dry-run`

```bash
npx prisma db update --dry-run
```

`db update` is the dev quick-path: it diffs the **live DB schema** (not the marker) against
the contract. The dry run revealed the exact set of operations needed:

| Operation | Class |
|---|---|
| Drop column `expense.payer` | destructive |
| Drop table `post` | destructive |
| Drop columns `user.createdAt`, `user.updatedAt`, `user.username` | destructive |
| Set NOT NULL on `user.name` | destructive |
| Create table `_ParticipantExpenses` | additive |
| Create table `transfer` | additive |
| Add column `user.bankAccount` | additive |
| Add column `expense.payerId` | additive |
| Create indexes and foreign keys | additive |

### Step 3 — Clear blocking data

The first attempt at `db update --confirm expenso` failed:

```
MIGRATION.RUNNER_FAILED: ensure table "expense" is empty before
adding NOT NULL column without default
```

The `expense` table had 6 rows. Adding `payerId NOT NULL` without a default to a non-empty
table is a data migration — `db update` does not handle data operations and its precheck
blocked the apply.

Since this is a dev database with repopulatable test data (`tests/db-populate.ts`), the rows
were truncated:

```bash
# via psql or any Postgres client
TRUNCATE TABLE expense CASCADE;
```

### Step 4 — Apply with `db update`

```bash
npx prisma db update --confirm expenso
```

All 20 operations applied cleanly. On success, `db update` automatically:
- Updated the DB marker to `9c83073f...`
- Advanced the `db` ref (`migrations/app/refs/db.json`) to `9c83073f...`

### Step 5 — Verify

```bash
npx prisma db verify
# "Database marker and schema match contract"

npx prisma migration list
# 1 migration on disk: null → 9c83073f... [db]
```

---

## Final State

| Item | Value |
|---|---|
| DB marker | `9c83073f...` |
| Contract `storageHash` | `9c83073f...` |
| `db` ref (`migrations/app/refs/db.json`) | `9c83073f...` |
| On-disk migration | `null → 9c83073f...` (valid baseline for fresh deploys) |

---

## Key Takeaways

### `migration plan` does not chain from the newest migration on disk

Its origin resolves in this order:

1. Explicit `--from <hash-or-ref>`
2. The `db` ref (`migrations/app/refs/db.json`)
3. Empty database (greenfield fallback — the trap)

If neither `--from` nor a `db` ref exists, every plan starts from scratch. On a non-empty
graph the CLI blocks this with `MIGRATION.PLAN_ORIGIN_UNKNOWN`. If you see `from: (baseline)`
in plan output while migrations already exist on disk — stop. Do not apply or commit it. Pick
the right exit:

- Set the `db` ref: `npx prisma migration ref set db <to-hash-of-last-migration>`, then re-plan.
- Or pass an explicit origin: `npx prisma migration plan --from <hash-or-ref> --name <slug>`.
- Or say you mean it: `npx prisma migration plan --from @empty --name <slug>` (rare).

### `db migrate` checks the marker; `db update` checks the live schema

| Command | Checks | Advances DB marker | Advances `db` ref | Writes migration files |
|---|---|---|---|---|
| `db migrate` | DB marker (must be in graph) | Yes | Only with `--advance-ref db` | No |
| `db update` | Live DB schema (introspection) | Yes | Yes (implicitly) | No |
| `migration plan` | `db` ref or `--from` (offline, no DB) | No | No | Yes |

When the DB marker is stale or the schema has drifted significantly during development,
`db update` is the right tool to realign the dev database. It does not need the marker to
be a graph node.

### `db sign` is not a shortcut around schema drift

`db sign` only succeeds if the live schema **fully satisfies** the contract. It will not sign
a database that is missing tables or columns. Use `db update` first to bring the DB to the
contract, then verify with `db verify`.

### The `db` ref must be current before planning incremental migrations

After `db update`, the `db` ref is automatically advanced. Future calls to `migration plan`
will chain from the correct origin without needing `--from`.

---

## Quick Recovery Reference

| Symptom | Likely Cause | Fix |
|---|---|---|
| `MIGRATION.MARKER_MISMATCH` | DB marker hash is not a node in the on-disk migration graph | Dev DB: `db update --confirm <name>`. Prod: plan a delta migration from the current graph tip. |
| `MIGRATION.RUNNER_FAILED` "schema does not satisfy contract" | Migration prechecks failed because objects already exist or are missing | Run `db verify` to inspect drift; use `db update` on dev or plan a targeted migration on prod. |
| `MIGRATION.PLAN_ORIGIN_UNKNOWN` | `migration plan` has no `--from` and no `db` ref, but migrations exist | `npx prisma migration ref set db <to-hash>`, then re-plan. |
| `MIGRATION.RUNNER_FAILED` "ensure table is empty before adding NOT NULL column" | Existing rows block a NOT NULL addition without default | Truncate or backfill the table, then re-run. For prod: use `dataTransform` in `migration.ts`. |
| `CONTRACT.SCHEMA_VERIFICATION_FAILED` on `db sign` | Live schema does not satisfy the contract | Run `db update` to bring the schema in line, then re-verify. |
