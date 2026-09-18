/**
 * Hide the backend logic for adding an expense
 */
import type { Expense } from "../types/Expense";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function getExpenses(): Promise<Expense[]> {
  return await fetch(`${API_BASE_URL}/api/expenses`)
    .then((res) => res.json())
    .then((data) => data as Expense[])
    .catch((error) => {
      console.error("Error getting expenses:", error);
      return [] as Expense[];
    });
}

async function addExpense(newExpense: Expense): Promise<Expense[]> {
  return await fetch(`${API_BASE_URL}/api/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newExpense),
  })
    .then((res) => res.json())
    .then((data) => data as Expense[])
    .catch((error) => {
      console.error("Error adding expense:", error);
      return [] as Expense[];
    });
}

async function resetExpenses(): Promise<Expense[]> {
  return await fetch(`${API_BASE_URL}/api/expenses/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: "{}",
  })
    .then((res) => res.json())
    .then((data) => data as Expense[])
    .catch((error) => {
      console.error("Error resetting expenses:", error);
      return [] as Expense[];
    });
}

export { getExpenses, addExpense, resetExpenses };