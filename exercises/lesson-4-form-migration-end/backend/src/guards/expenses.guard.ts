import type { Expense } from "../types/expense.ts";

export function isValidNewExpense(data: any): data is Expense {
   if (typeof data !== 'object' || data === null) {
    return false;
  }
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.date === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.payerId === 'number' &&
    typeof candidate.amount === 'number' &&
    Array.isArray(candidate.participants) &&
    candidate.participants.every((p) => typeof p === 'number')
  );
}