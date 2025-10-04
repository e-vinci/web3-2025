import ApiClient from '@/lib/api';
import type { Expense } from '@/types/Expense';
import type { LoaderFunctionArgs } from 'react-router';

export interface LoaderData {
  expense: Expense;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const expense = await ApiClient.getExpenseById(Number(id));
  return { expense };
}
