import type { Expense, ExpenseShare, NewExpensePayload } from '@/types/Expense';
import type { Transaction } from '@/types/Transaction';
import type { NewTransferPayload, Transfer } from '@/types/Transfer';
import type { User } from '@/types/User';

const API_HOST = import.meta.env.VITE_API_URL;

const sendApiRequest = async (method: string = 'GET', path: string, body?: unknown) => {
  try {
    const response = await fetch(`${API_HOST}/api/${path}`, {
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
  }
};

const getTransactions = () => sendApiRequest('GET', 'transactions') as Promise<Transaction[]>;

const getUsers = () => sendApiRequest('GET', 'users') as Promise<User[]>;

const getExpenseById = (id: number) => sendApiRequest('GET', `expenses/${id}`) as Promise<Expense>;

const createTransfer = (payload: NewTransferPayload) =>
  sendApiRequest('POST', 'transfers', payload) as Promise<Transfer>;

const createExpense = (payload: NewExpensePayload) => sendApiRequest('POST', 'expenses', payload) as Promise<Expense>;

const saveExpenseShare = (expenseId: number, share: ExpenseShare) =>
  sendApiRequest('POST', `expenses/${expenseId}/shares`, share);

export const ApiClient = {
  getUsers,
  getTransactions,
  getExpenseById,
  createTransfer,
  createExpense,
  saveExpenseShare,
};

export default ApiClient;
