import ExpenseSorter from '../components/ExpenseSorter';
import type { Expense } from '../types/Expense';
import ExpenseItem from '../components/ExpenseItem';
import { useEffect, useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const host = import.meta.env.VITE_API_URL;

export default function ExpensesList() {
  const [sortingAlgo, setSortingAlgo] = useState<(_a: Expense, _b: Expense) => number>(() => () => 0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch expenses from backend
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await sendApiRequestandHandleError('GET', 'expenses');
      setExpenses(data);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAlgoChange = (algo: (a: Expense, b: Expense) => number) => {
    setSortingAlgo(() => algo); // Pay attention here, we're wrapping algo in a function because useState setter accept either a value or a function returning a value.
  };

  const sortedExpenses = expenses.sort(sortingAlgo);

  if (loading) {
    return (
      <div>
        <h1 className="text-5xl text-center mb-8">Expense List</h1>
        <div className="mx-auto w-30">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-5xl text-center">Expense List</h1>

      <div className="w-5/6 mx-auto">
        {error && <div>Error: {error}</div>}

        <h2>Expenses ({expenses.length})</h2>

        {expenses.length > 0 && <ExpenseSorter setSortingAlgo={handleAlgoChange} />}

        {sortedExpenses.length === 0 ? (
          <p>No expenses found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Id</TableHead>
                <TableHead className="text-left">Date</TableHead>
                <TableHead className="text-left">Description</TableHead>
                <TableHead className="text-left">Payer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExpenses.map((expense: Expense) => (
                <ExpenseItem key={expense.id} expense={expense} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
