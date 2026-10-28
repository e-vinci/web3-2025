import { db } from '../prisma/db.ts';
import { exportFromDBO, type Export, type ExportStatus } from '../types/export.ts';
import type { Expense } from '../types/expense.ts';

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
    extra: { rowCount?: number; failedReason?: string; csv?: string } = {}
  ): Promise<void> {
    await db.orm.public.Export.where({ id }).update({
      status,
      ...(extra.rowCount !== undefined ? { rowCount: extra.rowCount } : {}),
      ...(extra.failedReason !== undefined ? { failedReason: extra.failedReason } : {}),
      ...(extra.csv !== undefined ? { csv: extra.csv } : {}),
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


}
