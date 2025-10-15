import ApiClient from '@/lib/api';
import type { Transaction } from '@/types/Transaction';

export interface LoaderData {
  transactions: Transaction[];
}

export async function loader() {
  const transactions = await ApiClient.getTransactions();
  return { transactions };
}
