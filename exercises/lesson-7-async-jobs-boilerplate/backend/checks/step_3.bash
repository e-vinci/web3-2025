#!/usr/bin/env bash
# Checks TODO 2 (backend/src/workers/exports.worker.ts). Needs Postgres and
# Redis running, and the database seeded (exercise 1).
set -euo pipefail
cd "$(dirname "$0")/.."
node checks/step_3.mjs
