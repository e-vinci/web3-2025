import * as z from "zod";

import { type User } from "./User";
import { type Category } from "./Category";

/** The full expense, as the detail page asks for it. */
export interface Expense {
  id: number;
  date: string;
  description: string;
  amount: number;
  payer: User;
  participants: User[];
  category?: Category;
}

/**
 * What the list page asks for. It is a strict subset of `Expense` — the list
 * query simply does not select the other fields, so the types say so too.
 */
export interface ExpenseListItem {
  id: number;
  date: string;
  description: string;
  amount: number;
  payer: Pick<User, "name">;
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

// What we send to the API: participants are IDs, payer/category are resolved server-side.
export interface NewExpense {
  description: string;
  amount: number;
  date: string;
  payerId: number;
  participants: number[];
  categoryId?: number;
}
