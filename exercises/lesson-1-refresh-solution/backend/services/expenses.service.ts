import fs from "fs";
import type { Expense, NewExpense } from "../types/expense.ts";

export class ExpensesService {

  private static dataPath = "./data/expenses.json";
  private static resetPath = "./data/expenses.init.json";
  
  public static getExpenses(): Expense[] {
    return this.readExpenses();
  }
  
  public static addExpense(newExpense: NewExpense): Expense[] {
    const expenses = this.readExpenses();
    const expense: Expense = {
      ...newExpense,
      id: (expenses.length + 1).toString()
    };
    expenses.push(expense);
    this.saveExpenses(expenses);
    return expenses;
  }
  
  public static resetExpenses(): Expense[] {
    this._resetExpenses();
    return this.readExpenses();
  }
  
  private static readExpenses(): Expense[] {
    try {
      const data = JSON.parse(fs.readFileSync(this.dataPath, "utf-8"));
      return data;
    } catch (error) {
      console.error("Error reading expenses file:", error);
      throw error;
    }
  }
  
  private static saveExpenses(expenses: Expense[]): void {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(expenses, null, 2));
    } catch (error) {
      console.error("Error saving expenses file:", error);
      throw error;
    }
  }

  private static _resetExpenses(): void {
    try {
      const defaultExpenses: Expense[] = JSON.parse(fs.readFileSync(this.resetPath, "utf-8"));
      fs.writeFileSync(this.dataPath, JSON.stringify(defaultExpenses, null, 2));
    } catch (error) {
      console.error("Error resetting expenses file:", error);
      throw error;
    }
  }
  
}