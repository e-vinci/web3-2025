import { useState, useEffect } from 'react';
import ExpenseItem from '../components/ExpenseItem';
import ExpenseAdd from '../components/ExpenseAdd';
import ExpenseSorter from '../components/ExpenseSorter';
import TopUpAdd from '../components/TopUpAdd';
import type { Expense, ExpenseInput } from '../types/Expense';
import type { TopUp, TopUpInput } from '../types/TopUp';

const host = import.meta.env.VITE_API_URL;

export default function Home() {
  const [sortingAlgo, setSortingAlgo] = useState<(_a: Expense, _b: Expense) => number>(() => () => 0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topups, setTopups] = useState<TopUp[]>([]);

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

  const fetchTopUps = async () => {
    const data = await sendApiRequestandHandleError('GET', 'topup/list');
    setTopups(data);
  };

  useEffect(() => {
    fetchExpenses();
    fetchTopUps();
  }, []);

  const handleAddTopUp = async (newTopUpForm: TopUpInput) => {
    const newTopUpOptimistic = { id: 'optimistic', date: new Date().toISOString(), ...newTopUpForm } as TopUp;
    setTopups([newTopUpOptimistic, ...topups]);
    await sendApiRequestandHandleError('POST', 'topup/add', newTopUpForm);
  };

  const handleAddExpense = async (newExpenseForm: ExpenseInput) => {
    const newExpenseOptimistic = { id: 'optimistic', ...newExpenseForm } as Expense; // We add a temporary id -1 for React key, it will be replaced when we get the real added expense from backend
    const newExpensesOptimistic = [newExpenseOptimistic, ...expenses]; // Optimistically update the state, whatever the sort method, add on top
    setExpenses(newExpensesOptimistic);
    const addedExpense = await sendApiRequestandHandleError('POST', 'expenses', newExpenseForm);
    const newExpensesActual = [addedExpense, ...expenses]; // Now that we have the actual added expense with id from backend, let's use it instead of the optimistically added one
    setExpenses(newExpensesActual);
  };

  const handleResetData = async () => {
    setExpenses([]); // Clear current expenses optimistically
    setLoading(true);

    const resetData = await sendApiRequestandHandleError('POST', 'expenses/reset');
    setExpenses(resetData.data);
    setLoading(false);
  };

  const handleAlgoChange = (algo: (a: Expense, b: Expense) => number) => {
    setSortingAlgo(() => algo); // Pay attention here, we're wrapping algo in a function because useState setter accept either a value or a function returning a value.
  };

  const sortedExpenses = expenses.sort(sortingAlgo);

  if (loading) {
    return <div>Loading expenses...</div>;
  }

  return (
    <div>
      <h1>Expense Sharing App</h1>

      {error && <div>Error: {error}</div>}

      <div>
        <ExpenseAdd addExpense={handleAddExpense} />
        <button onClick={handleResetData}>Reset Data</button>
      </div>

      <h2>Expenses ({expenses.length})</h2>

      {expenses.length > 0 && <ExpenseSorter setSortingAlgo={handleAlgoChange} />}

      <div>
        {sortedExpenses.length === 0 ? (
          <p>No expenses found.</p>
        ) : (
          <table>
            <tbody>
              {sortedExpenses.map((expense) => (
                <ExpenseItem key={expense.id} expense={expense} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2>Top Ups ({topups.length})</h2>
      <TopUpAdd addTopUp={handleAddTopUp} />
      <div>
        {topups.length === 0 ? (
          <p>No top ups found.</p>
        ) : (
          <table>
            <tbody>
              {topups.map((topup) => (
                <tr key={topup.id}>
                  <td>#{topup.id}</td>
                  <td>{topup.date}</td>
                  <td>User: {topup.user}</td>
                  <td>Amount: {topup.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
