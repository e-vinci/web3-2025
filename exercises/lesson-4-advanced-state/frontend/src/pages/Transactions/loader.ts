import ApiClient, { type Transaction } from '@/lib/api';

export interface LoaderData {
  transactions: Transaction[];
}

export async function loader() {
  const transactions = await ApiClient.getTransactions();
  return { transactions };
}
