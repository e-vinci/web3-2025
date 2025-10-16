import { useContext, useEffect, useState } from 'react';
import { PageContext } from '../App';
import type { Expense } from '../types/Expense';
import React from 'react';
import ExpenseSorter from '../components/ExpenseSorter';
import ExpenseItem from '../components/ExpenseItem';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultAlgo = (_a: Expense, _b: Expense) => 0; // Default no sorting

const List = () => {
  const { error, sendApiRequestandHandleError } = useContext(PageContext);
  const [sortingAlgo, setSortingAlgo] = React.useState<typeof defaultAlgo>(() => defaultAlgo);

  const [loading, setLoading] = useState<boolean>(false);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);

  // Fetch expenses from backend
  const fetchExpenses = async () => {
    setLoading(true);
    const data = ((await sendApiRequestandHandleError('GET', 'expenses')) as Expense[]) || [];
    setExpenses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAlgoChange = (algo: (a: Expense, b: Expense) => number) => {
    setSortingAlgo(() => algo); // Pay attention here, we're wrapping algo in a function because useState setter accept either a value or a function returning a value.
  };

  const sortedExpenses = expenses.sort(sortingAlgo);

  if (loading) {
    return <div>Loading expenses...</div>;
  }

  return (
    <div className="w-full">
      <h1 className="text-5xl text-center">Expense List</h1>

      <div className="w-5/6 mx-auto">
        {error && <div>Error: {error}</div>}

        <h2>Expenses ({expenses.length})</h2>

        {expenses.length > 0 && <ExpenseSorter setSortingAlgo={handleAlgoChange} />}

        <div>
          {sortedExpenses.length === 0 ? (
            <p>No expenses found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Id</th>
                  <th className="text-left">Date</th>
                  <th className="text-left">Description</th>
                  <th className="text-left">Payer</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map((expense) => (
                  <ExpenseItem key={expense.id} expense={expense} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default List;
