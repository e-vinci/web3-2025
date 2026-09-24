import { useCallback, useEffect, useState } from 'react';
import type { Expense } from '../types/Expense';

const API_BASE_URL = 'http://localhost:3000/api';

interface UseExpensesResult {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  addExpense: (expense: Expense) => Promise<void>;
  resetExpenses: () => Promise<void>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function useExpenses(): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/expenses`);
      if (!response.ok) {
        throw new Error(`Failed to fetch expenses (${response.status})`);
      }
      const data = (await response.json()) as Expense[];
      setExpenses(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Runs once on mount to load the initial expense list.
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(
    async (expense: Expense) => {
      try {
        setError(null);
        const response = await fetch(`${API_BASE_URL}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expense),
        });
        if (!response.ok) {
          throw new Error(`Failed to add expense (${response.status})`);
        }
        await fetchExpenses();
      } catch (err) {
        setError(errorMessage(err));
      }
    },
    [fetchExpenses],
  );

  const resetExpenses = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/expenses/reset`, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Failed to reset expenses (${response.status})`);
      }
      await fetchExpenses();
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [fetchExpenses]);

  return { expenses, loading, error, addExpense, resetExpenses };
}

export default useExpenses;