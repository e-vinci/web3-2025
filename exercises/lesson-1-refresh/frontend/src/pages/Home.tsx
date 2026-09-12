import { useState } from 'react';
import ExpenseAdd from '../components/ExpenseAdd';
import ExpenseItem from '../components/ExpenseItem';
import ExpenseSorter from '../components/ExpenseSorter';
import useExpenses from '../hooks/useExpenses';
import type { ExpenseComparator } from '../utils/expenseComparators';
import { byDateNewestFirst } from '../utils/expenseComparators';

function Home() {
  const { expenses, loading, error, addExpense, resetExpenses } = useExpenses();

  // The comparator is a function, and useState special-cases function arguments/updates
  // (it calls them to compute state instead of storing them) - see useState's docs. Wrapping
  // it in an object sidesteps that trap entirely.
  const [sort, setSort] = useState<{ compare: ExpenseComparator }>({
    compare: byDateNewestFirst,
  });
  const [resetMessage, setResetMessage] = useState('');

  const sortedExpenses = [...expenses].sort(sort.compare);

  function handleSortChange(compare: ExpenseComparator) {
    setSort({ compare });
  }

  async function handleResetClick() {
    setResetMessage('');
    await resetExpenses();
    setResetMessage('Expenses have been reset to their initial state.');
  }

  return (
    <main>
      <h1>Expenses</h1>

      {error && (
        <p className="feedback feedback--error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading expenses...</p>
      ) : (
        <>
          <ExpenseSorter onSortChange={handleSortChange} />
          <ul className="expense-list">
            {sortedExpenses.map((expense) => (
              <ExpenseItem key={expense.id} expense={expense} />
            ))}
          </ul>
        </>
      )}

      <div className="actions">
        <ExpenseAdd addExpense={addExpense} />
        <button type="button" onClick={handleResetClick}>
          Reset Data
        </button>
      </div>

      {resetMessage && <p className="feedback">{resetMessage}</p>}
    </main>
  );
}

export default Home;
