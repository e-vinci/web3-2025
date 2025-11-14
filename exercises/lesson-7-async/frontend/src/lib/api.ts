import type { Expense, NewExpensePayload } from "@/types/Expense";
import type { Transaction } from "@/types/Transaction";
import type { NewTransferPayload, Transfer } from "@/types/Transfer";
import type { User } from "@/types/User";

const API_HOST = import.meta.env.VITE_API_URL;

const sendApiRequest = async (
  method: string = "GET",
  path: string,
  body?: unknown,
) => {
  try {
    const response = await fetch(`${API_HOST}/api/${path}`, {
      method: method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
  }
};

const getTransactions: () => Promise<Transaction[]> = () =>
  sendApiRequest("GET", "transactions") as Promise<Transaction[]>;
const getUsers: () => Promise<User[]> = () =>
  sendApiRequest("GET", "users") as Promise<User[]>;
const getExpenseById: (id: number) => Promise<Expense> = (id) =>
  sendApiRequest("GET", `expenses/${id}`) as Promise<Expense>;
const createTransfer: (payload: NewTransferPayload) => Promise<Transfer> = (
  payload,
) => sendApiRequest("POST", "transfers", payload) as Promise<Transfer>;
const createExpense: (payload: NewExpensePayload) => Promise<Expense> = (
  payload,
) => sendApiRequest("POST", "expenses", payload) as Promise<Expense>;

export const ApiClient = {
  getUsers,
  getTransactions,
  getExpenseById,
  createTransfer,
  createExpense,
};

export default ApiClient;
