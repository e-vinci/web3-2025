#!/usr/bin/env bash
# Checks TODO 1 (backend/src/queues/exports.queue.ts).
set -euo pipefail
cd "$(dirname "$0")/.."
node checks/step_2.mjs
