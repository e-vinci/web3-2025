#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/001a3b33f87264341a6e61912c7005a4cd93c7b10822c62c1d77b9f71401227b/contract';
import endContract from '../../snapshots/001a3b33f87264341a6e61912c7005a4cd93c7b10822c62c1d77b9f71401227b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ac3b1fe37bfa54a1b5702cdd58643cda41378a2b5b1afe19e8932136ccc8a43d/contract';
import startContract from '../../snapshots/ac3b1fe37bfa54a1b5702cdd58643cda41378a2b5b1afe19e8932136ccc8a43d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [];
  }
}

MigrationCLI.run(import.meta.url, M);
