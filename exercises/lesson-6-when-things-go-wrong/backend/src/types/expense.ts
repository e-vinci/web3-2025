import { z } from "zod";
import { userSchema, userFromDBO, type UserDBO } from "./user.ts";
import { categorySchema, categoryFromDBO, type CategoryDBO } from "./category.ts";

/**
 * An expense as the rest of the application understands it.
 *
 * Note `date` is a real `Date` here, not a string. Deciding that once, in one
 * place, is what stops "is this a string or a Date?" questions spreading
 * through the services and the routers.
 */
export const expenseSchema = z.object({
  id: z.number().int().positive(),
  date: z.coerce.date(),
  description: z.string().min(1).max(200),
  amount: z.number().nonnegative(),
  payerId: z.number().int().positive(),
  payer: userSchema.optional(),
  participants: z.array(userSchema).default([]),
  categoryId: z.number().int().positive().optional(),
  category: categorySchema.optional(),
});

/**
 * What a client is allowed to POST. It is the expense schema minus the fields
 * the server owns (`id`) and minus the resolved relations — a client sends
 * participant *ids*, not whole users.
 */
export const newExpenseSchema = expenseSchema
  .omit({ id: true, payer: true, participants: true, category: true })
  .extend({
    participants: z.array(z.number().int().positive()).default([]),
  });

/**
 * Query-string filters. `z.coerce` matters here: everything arriving in a URL
 * is a string, and we want real numbers. `.optional()` lets a filter be absent.
 */
const expenseFilterSchema = z.object({
  amount: z.coerce.number().nonnegative().optional(),
  payerId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export type Expense = z.infer<typeof expenseSchema>;
export type NewExpense = z.infer<typeof newExpenseSchema>;
export type ExpenseFilter = z.infer<typeof expenseFilterSchema>;

function parseWithSchema<T>(schema: z.ZodType<T>, data: unknown): T | false {
  const result = schema.safeParse(data);
  return result.success ? result.data : false;
}

export function parseExpenseFilter(data: unknown): ExpenseFilter | false {
  return parseWithSchema(expenseFilterSchema, data);
}

export function parseNewExpense(data: unknown): NewExpense | false {
  return parseWithSchema(newExpenseSchema, data);
}

/**
 * PostgreSQL hands back its own timestamp text, e.g. "2026-10-15 00:00:00+00".
 * That is *not* ISO 8601: a space instead of the "T", and a two-digit offset
 * instead of "Z". Normalising it here means every other file gets a plain Date.
 */
function dateFromDBO(value: string): Date {
  const isoish = value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
  return new Date(isoish);
}

/** The shape Prisma gives us for an `expense` row, with its relations included. */
export interface ExpenseDBO {
  id: number;
  date: string;
  description: string;
  amount: number;
  payerId: number;
  payer?: UserDBO;
  participants?: UserDBO[];
  categoryId: number | null;
  category?: CategoryDBO | null;
}

export function expenseFromDBO(dbo: ExpenseDBO): Expense {
  return {
    id: dbo.id,
    date: dateFromDBO(dbo.date),
    description: dbo.description,
    amount: dbo.amount,
    payerId: dbo.payerId,
    payer: dbo.payer ? userFromDBO(dbo.payer) : undefined,
    participants: (dbo.participants ?? []).map(userFromDBO),
    categoryId: dbo.categoryId ?? undefined,
    category: dbo.category ? categoryFromDBO(dbo.category) : undefined,
  };
}

/** The inverse direction: a Date the database will accept. */
export function dateToDBO(date: Date): string {
  return date.toISOString();
}
