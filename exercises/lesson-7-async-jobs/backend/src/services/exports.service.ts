import { db } from '../prisma/db.ts';
import { redis } from '../redis.ts';
import { exportFromDBO, type Export, type ExportStatus } from '../types/export.ts';
import type { Expense } from '../types/expense.ts';

/**
 * How long a finished CSV stays downloadable, in seconds.
 *
 * One hour is a product decision, not a technical one: long enough that a user
 * who wandered off for coffee still gets their file, short enough that a free
 * 25 MB Redis instance does not fill up with yesterday's reports.
 */
const CSV_TTL_SECONDS = 3600;

/** Where one export's bytes live in Redis. */
function csvKey(exportId: number): string {
  return `export:${exportId}:csv`;
}

/** Escapes one CSV field: wrap in quotes, and double any quote inside it. */
function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export class ExportsService {
  /**
   * Records that someone asked for an export, and returns the receipt.
   *
   * This is deliberately the *only* thing that happens before the HTTP
   * response goes out. The row exists, so the user has something to poll and
   * something to show in a list; the work has not started.
   */
  public static async create(requesterId: number): Promise<Export> {
    const row = await db.orm.public.Export.create({
      requesterId,
      status: 'queued',
    });
    return exportFromDBO(row);
  }

  public static async getById(id: number): Promise<Export | undefined> {
    const row = await db.orm.public.Export.where({ id }).first();
    return row ? exportFromDBO(row) : undefined;
  }

  public static async listForUser(requesterId: number): Promise<Export[]> {
    const rows = await db.orm.public.Export.where({ requesterId }).all();
    return rows.map(exportFromDBO).sort((a, b) => b.id - a.id);
  }

  /**
   * Moves an export to a new state.
   *
   * The worker calls this three times over a job's life: `running` when it
   * picks the job up, then `completed` or `failed`. Keeping it in the service
   * rather than in the worker means the status strings are written in one file
   * instead of scattered through a processor function.
   */
  public static async setStatus(
    id: number,
    status: ExportStatus,
    extra: { rowCount?: number; failedReason?: string } = {}
  ): Promise<void> {
    await db.orm.public.Export.where({ id }).update({
      status,
      ...(extra.rowCount !== undefined ? { rowCount: extra.rowCount } : {}),
      ...(extra.failedReason !== undefined ? { failedReason: extra.failedReason } : {}),
    });
  }

  /** Turns a list of expenses into CSV text. */
  public static buildCsv(expenses: Expense[]): string {
    const header = ['id', 'date', 'description', 'amount', 'payer', 'category'];
    const lines = [header.map(csvCell).join(',')];

    for (const expense of expenses) {
      lines.push(
        [
          csvCell(expense.id),
          csvCell(expense.date.toISOString().slice(0, 10)),
          csvCell(expense.description),
          csvCell(expense.amount.toFixed(2)),
          csvCell(expense.payer?.name ?? ''),
          csvCell(expense.category?.name ?? ''),
        ].join(',')
      );
    }

    return lines.join('\n');
  }

  /**
   * Puts the finished file in Redis, with an expiry.
   *
   * `EX` is the whole argument for Redis being here. The key deletes itself
   * after an hour — no cleanup job, no `deletedAt` column, no cron. Compare
   * that to what the same feature costs in PostgreSQL: a `bytea` column that
   * grows forever and a scheduled job you have to write, deploy and monitor.
   */
  public static async storeCsv(exportId: number, csv: string): Promise<void> {
    await redis.set(csvKey(exportId), csv, 'EX', CSV_TTL_SECONDS);
  }

  /**
   * Reads the file back, if it is still there.
   *
   * `undefined` here is a normal answer, not a failure: it means the hour is
   * up. The `export` row in PostgreSQL still says `completed`, because that is
   * a permanent fact; the bytes are gone, because those were always temporary.
   * Two stores, two different lifetimes, and the route has to tell the user
   * the difference.
   */
  public static async readCsv(exportId: number): Promise<string | undefined> {
    const csv = await redis.get(csvKey(exportId));
    return csv ?? undefined;
  }
}
