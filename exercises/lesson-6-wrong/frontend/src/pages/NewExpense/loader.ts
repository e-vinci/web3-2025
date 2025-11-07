import ApiClient from '@/lib/api';
import type { Expense } from '@/types/Expense';
import type { User } from '@/types/User';

export interface LoaderData {
  users: User[];
  shareSuggestions: Promise<Expense> | null;
}

export async function loader() {
  const users = await ApiClient.getUsers();
  const shareSuggestions = ApiClient.getExpenseById(1);
  return { users, shareSuggestions };
}
