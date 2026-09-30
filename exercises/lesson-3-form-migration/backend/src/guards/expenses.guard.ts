import type { Expense } from "../types/expense.ts";

export function isValidNewExpense(data: any): data is Expense {
   if (typeof data !== 'object' || data === null) {
    return false;
  }
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.date === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.payer === 'string' &&
    typeof candidate.amount === 'number'
  );
}