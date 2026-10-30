#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/001a3b33f87264341a6e61912c7005a4cd93c7b10822c62c1d77b9f71401227b/contract';
import startContract from '../../snapshots/001a3b33f87264341a6e61912c7005a4cd93c7b10822c62c1d77b9f71401227b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/2483c3013b69cfbb38e177fe7fbd69c241055c4da0b57e1327182a21af426ef4/contract';
import endContract from '../../snapshots/2483c3013b69cfbb38e177fe7fbd69c241055c4da0b57e1327182a21af426ef4/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'export',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('failedReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('requesterId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('rowCount', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('queued'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'export',
        index: 'export_requesterId_idx_a5f4af92',
        columns: ['requesterId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'export',
        foreignKey: {
          name: 'export_requesterId_fkey',
          columns: ['requesterId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
