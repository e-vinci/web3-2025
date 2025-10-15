import type { User } from './User';

export interface ExpenseInput {
  description: string;
  payer: string;
  amount: number;
  date: string; // ISO string
}

export interface Expense {
  id: string;
  description: string;
  payer: User;
  amount: number;
  date: string; // ISO string
  participants: User[];
}

export interface NewExpensePayload {
  description: string;
  amount: number;
  date?: string; // ISO string
  payerId: number;
  participantIds: number[];
}
