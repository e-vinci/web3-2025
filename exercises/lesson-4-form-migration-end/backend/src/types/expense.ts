import { User } from "./user";
import { Category } from "./category";


export interface Expense {
  id: number;
  date: string;
  description: string;
  payerId: number;
  payer: User;
  amount: number;
  participants: User[];
  categoryId?: number;
  category?: Category;
}

export type NewExpense = Omit<Expense, 'id'>;

export type ExpenseFilter = {
  amount?: number;
  payerId?: number;
  categoryId?: number;
};
