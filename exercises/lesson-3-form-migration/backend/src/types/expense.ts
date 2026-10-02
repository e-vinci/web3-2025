import { User } from "./user";

export interface Expense {
  id: number;
  date: string;
  description: string;
  payerId: number;
  payer: User;
  amount: number;
  participants: User[];
}

export type NewExpense = Omit<Expense, 'id'>;
