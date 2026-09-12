import type { Expense } from '../types/Expense';

export type ExpenseComparator = (a: Expense, b: Expense) => number;

export const byDateNewestFirst: ExpenseComparator = (a, b) =>
  new Date(b.date).getTime() - new Date(a.date).getTime();

export const byDateOldestFirst: ExpenseComparator = (a, b) =>
  new Date(a.date).getTime() - new Date(b.date).getTime();

export const byAmountHighestFirst: ExpenseComparator = (a, b) => b.amount - a.amount;

export const byAmountLowestFirst: ExpenseComparator = (a, b) => a.amount - b.amount;
