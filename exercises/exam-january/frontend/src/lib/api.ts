import type { Expense, NewExpensePayload } from '@/types/Expense';
import type { Transaction } from '@/types/Transaction';
import type { NewTransferPayload, Transfer } from '@/types/Transfer';
import type { User } from '@/types/User';
import type { Comment, NewCommentPayload, UpdateCommentPayload } from '@/types/Comment';

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

const getTransactions: () => Promise<Transaction[]> = () =>
  sendApiRequest('GET', 'transactions') as Promise<Transaction[]>;
const getUsers: () => Promise<User[]> = () => sendApiRequest('GET', 'users') as Promise<User[]>;
const getExpenseById: (id: number) => Promise<Expense> = (id) =>
  sendApiRequest('GET', `expenses/${id}`) as Promise<Expense>;
const createTransfer: (payload: NewTransferPayload) => Promise<Transfer> = (payload) =>
  sendApiRequest('POST', 'transfers', payload) as Promise<Transfer>;
const createExpense: (payload: NewExpensePayload) => Promise<Expense> = (payload) =>
  sendApiRequest('POST', 'expenses', payload) as Promise<Expense>;

const getAllComments: () => Promise<Comment[]> = () => sendApiRequest('GET', 'comments') as Promise<Comment[]>;
const getCommentsByExpense: (expenseId: number) => Promise<Comment[]> = (expenseId) =>
  sendApiRequest('GET', `comments/expense/${expenseId}`) as Promise<Comment[]>;
const createComment: (payload: NewCommentPayload) => Promise<Comment> = (payload) =>
  sendApiRequest('POST', 'comments', payload) as Promise<Comment>;
const updateComment: (payload: UpdateCommentPayload) => Promise<Comment> = (payload) =>
  sendApiRequest('PUT', `comments/${payload.id}`, { content: payload.content }) as Promise<Comment>;
const deleteComment: (id: number) => Promise<void> = (id) =>
  sendApiRequest('DELETE', `comments/${id}`) as Promise<void>;
const getCommentCount: (expenseId: number) => Promise<{ count: number }> = (expenseId) =>
  sendApiRequest('GET', `comments/expense/${expenseId}/count`) as Promise<{ count: number }>;

export const ApiClient = {
  getUsers,
  getTransactions,
  getExpenseById,
  createTransfer,
  createExpense,
  getAllComments,
  getCommentsByExpense,
  createComment,
  updateComment,
  deleteComment,
  getCommentCount,
};

export default ApiClient;
