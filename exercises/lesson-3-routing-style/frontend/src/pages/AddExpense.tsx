import { useNavigate } from 'react-router';
import ExpenseAdd from '../components/ExpenseAdd';
import type { ExpenseInput } from '../types/Expense';
import { useState } from 'react';

const host = import.meta.env.VITE_API_URL;

export default function AddExpense() {
  const [_error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const sendApiRequestandHandleError = async (method: string = 'GET', path: string, body?: unknown) => {
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
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };
  const handleAddExpense = async (newExpenseForm: ExpenseInput) => {
    await sendApiRequestandHandleError('POST', 'expenses', newExpenseForm);
    navigate('/list');
  };
  return (
    <>
      <div>
        <ExpenseAdd addExpense={handleAddExpense} />
      </div>
    </>
  );
}
