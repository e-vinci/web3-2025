import * as z from "zod";

import { type User } from "./User";
import { type Category } from "./Category";

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

export const ExpenseFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  payerId: z.number().int().positive("Payer ID must be a positive integer"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  participantsRaw: z.string(),
  categoryId: z.number().int().optional(),
});

export type ExpenseFormValues = z.infer<typeof ExpenseFormSchema>;

// NewExpense is used when submitting a form: participants are IDs, payer/category are resolved server-side
export type NewExpense = Omit<Expense, 'id' | 'payer' | 'participants' | 'category'> & {
  participants: number[];
};