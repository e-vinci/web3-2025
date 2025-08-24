import type { Identifiable } from './Core';

export interface ExpenseInput {
  date: string;
  description: string;
  payer: string;
  amount: number;
}

export interface Expense extends ExpenseInput, Identifiable {}
