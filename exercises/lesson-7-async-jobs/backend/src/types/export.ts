import { z } from 'zod';

/**
 * An export request, as the rest of the application understands it.
 *
 * Same shape as every other module in this folder: the zod schema, the
 * inferred type, and the `...FromDBO()` mapper. One boundary between what the
 * database returns and what the app sees.
 *
 * Read the fields and notice what is *not* here: the CSV itself. This row is
 * the receipt, not the goods. The bytes live in Redis under a key that expires
 * (see `src/redis.ts`); this row is the durable record that someone asked, and
 * how it turned out.
 */
export const exportStatusSchema = z.enum(['queued', 'running', 'completed', 'failed']);

export const exportSchema = z.object({
  id: z.number().int().positive(),
  requesterId: z.number().int().positive(),
  status: exportStatusSchema,
  rowCount: z.number().int().nonnegative().optional(),
  failedReason: z.string().optional(),
  createdAt: z.coerce.date(),
});

export type ExportStatus = z.infer<typeof exportStatusSchema>;
export type Export = z.infer<typeof exportSchema>;

/**
 * PostgreSQL hands back its own timestamp text, e.g. "2026-10-15 00:00:00+00".
 * That is *not* ISO 8601 — a space instead of the "T", a two-digit offset
 * instead of "Z". Same helper as `types/expense.ts`, same reason.
 */
function dateFromDBO(value: string): Date {
  const isoish = value.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  return new Date(isoish);
}

/** The shape Prisma gives us for an `export` row. */
export interface ExportDBO {
  id: number;
  requesterId: number;
  status: string;
  rowCount: number | null;
  failedReason: string | null;
  createdAt: string;
}

export function exportFromDBO(dbo: ExportDBO): Export {
  return {
    id: dbo.id,
    requesterId: dbo.requesterId,
    // The column is a plain `text`, so the database will happily hand back
    // anything. Parsing it here is what makes `Export["status"]` a promise the
    // rest of the code can rely on instead of a hope.
    status: exportStatusSchema.parse(dbo.status),
    rowCount: dbo.rowCount ?? undefined,
    failedReason: dbo.failedReason ?? undefined,
    createdAt: dateFromDBO(dbo.createdAt),
  };
}
