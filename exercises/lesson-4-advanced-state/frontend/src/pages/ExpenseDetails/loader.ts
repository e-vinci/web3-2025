import ApiClient, { type Expense } from '@/lib/api';
import type { LoaderFunctionArgs } from 'react-router';

export interface LoaderData {
  expense: Expense;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const expense = await ApiClient.getExpenseById(Number(id));
  return { expense };
}
