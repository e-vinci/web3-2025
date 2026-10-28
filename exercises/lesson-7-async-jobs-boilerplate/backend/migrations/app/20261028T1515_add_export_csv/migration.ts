#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2483c3013b69cfbb38e177fe7fbd69c241055c4da0b57e1327182a21af426ef4/contract';
import startContract from '../../snapshots/2483c3013b69cfbb38e177fe7fbd69c241055c4da0b57e1327182a21af426ef4/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b3388a903340d43da555b0e661552cc9225bc8c4afb870e6528747c615538c9b/contract';
import endContract from '../../snapshots/b3388a903340d43da555b0e661552cc9225bc8c4afb870e6528747c615538c9b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'export',
        column: col('csv', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
