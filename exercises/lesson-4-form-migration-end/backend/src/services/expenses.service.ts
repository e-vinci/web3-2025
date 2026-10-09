import fs from "fs";
import { Temporal } from "temporal-polyfill";
import type { Expense, NewExpense, ExpenseFilter } from "../types/expense.ts";
import { db } from "../prisma/db.ts";

export class ExpensesService {

  private static dataPath = "./data/expenses.json";
  private static resetPath = "./data/expenses.init.json";
  
  public static async getExpenses(filter?: ExpenseFilter): Promise<Expense[]> {
    try {
      let query = db.orm.public.Expense
        .include('participants', (p) => p.include('user'))
        .include('payer')
        .include('category');
      if (filter) {
        query = query.where(filter);
      }
      const rows = await query.all();
      const expenses = rows.map((row) => ({
        id: row.id,
        date: row.date,
        amount: row.amount,
        description: row.description,
        payerId: row.payerId,
        payer: row.payer,
        participants: row.participants.map((p) => p.user),
        categoryId: row.categoryId ?? undefined,
        category: row.category ?? undefined,
      }));
      return expenses;
    } catch (error) {
      console.error("Error getting expenses:", error);
      throw error;
    }
  }
  
  public static async addExpense(newExpense: NewExpense): Promise<Expense> {  
    try {
      const created = await db.orm.public.Expense.create({
        description: newExpense.description,
        amount: newExpense.amount,
        date: Temporal.Instant.from(`${newExpense.date}T00:00:00Z`),
        payerId: newExpense.payerId,
        ...(newExpense.categoryId ? { categoryId: newExpense.categoryId } : undefined),
        participants: (mutator) =>
          mutator.create(newExpense.participants.map((userId) => ({ userId }))),
        categoryId: newExpense.categoryId ?? undefined,
      });
      if (!created) {
        throw new Error("Failed to create expense");
      }
      const expense = await db.orm.public.Expense
        .where({ id: created.id })
        .include('participants', (p) => p.include('user'))
        .include('payer')
        .include('category')
        .first();
      return {
        id: expense!.id,
        date: expense!.date,
        amount: expense!.amount,
        description: expense!.description,
        payerId: expense!.payerId,
        payer: expense!.payer,
        participants: expense!.participants.map((p) => p.user),
        categoryId: expense!.categoryId ?? undefined,
        category: expense!.category ?? undefined,
      };
    } catch (error) {
      console.error("Error adding expense:", error);
      throw error;
    }
  }

  public static async resetExpenses(): Promise<Expense[]> {
    try {
      await db.orm.public.Expense.where({}).deleteAll();
      const defaultExpenses: Expense[] = JSON.parse(fs.readFileSync(this.resetPath, "utf-8"));
      const created = await db.orm.public.Expense.createAll(defaultExpenses.map((expense) => ({
        date: expense.date,
        amount: expense.amount,
        description: expense.description,
        payerId: expense.payerId,
      })));
      if (!created) {
        throw new Error("Failed to reset expenses");
      }
      return this.getExpenses();
    } catch (error) {
      console.error("Error resetting expenses:", error);
      throw error;
    }
  }
}
