import fs from 'node:fs';
import path from 'node:path';
import type { Expense } from '../types/Expense.ts';

const DATA_FILE = path.join(import.meta.dirname, '../data/expenses.json');
const INIT_DATA_FILE = path.join(import.meta.dirname, '../data/expenses.init.json');

export function getAllExpenses(): Expense[] {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as Expense[];
}

export function addExpense(expense: Expense): Expense {
  const expenses = getAllExpenses();
  expenses.push(expense);
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
  return expense;
}

export function resetExpenses(): Expense[] {
  const initialData = fs.readFileSync(INIT_DATA_FILE, 'utf-8');
  fs.writeFileSync(DATA_FILE, initialData);
  return JSON.parse(initialData) as Expense[];
}
