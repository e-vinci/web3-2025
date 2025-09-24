const host = import.meta.env.VITE_API_URL;
const sendApiRequest = async (method: string = 'GET', path: string, body?: unknown) => {
  try {
    const response = await fetch(`${host}/api/${path}`, {
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

export interface Transaction {
  id: string;
  kind: 'expense' | 'transfer';
  description: string;
  amount: number;
  date: string;
  payer: {
    id: number;
    name: string;
  };
  participants: {
    id: number;
    name: string;
  }[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  bankAccount: string | null;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  payer: User;
  participants: User[];
}

export interface Transfer {
  id: number;
  amount: number;
  date: string;
  source: User;
  target: User;
}

const getTransactions: () => Promise<Transaction[]> = () =>
  sendApiRequest('GET', 'transactions') as Promise<Transaction[]>;
const getUsers: () => Promise<User[]> = () => sendApiRequest('GET', 'users') as Promise<User[]>;
const getExpenseById: (id: number) => Promise<Expense | null> = (id) => sendApiRequest('GET', `expenses/${id}`);

interface NewTransferPayload {
  amount: number;
  date?: string;
  sourceId: number;
  targetId: number;
}
const createTransfer: (payload: NewTransferPayload) => Promise<Transfer> = (payload) =>
  sendApiRequest('POST', 'transfers', payload);

export const ApiClient = {
  getUsers,
  getTransactions,
  getExpenseById,
  createTransfer,
};

export default ApiClient;
