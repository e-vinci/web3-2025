import { useLoaderData, useNavigation } from "react-router";
import type { ExpenseListItem } from "../../types/Expense";
import ExpenseSearch from "../../components/ExpenseSearch";
import ExpenseItem from "../../components/ExpenseItem";

function ExpenseList() {
  // No useState, no useEffect, no loading flag: the router already ran the
  // loader and the data is here on the very first render.
  const expenses = useLoaderData() as ExpenseListItem[];

  // useNavigation tells us when the router is busy re-running a loader, which
  // is how we show feedback while a filter is being applied.
  const navigation = useNavigation();
  const isFiltering = navigation.state === "loading";

  return (
    <div>
      <h2>Your expenses</h2>

      <ExpenseSearch />

      {isFiltering && <p>Updating…</p>}

      {expenses.length === 0 ? (
        <p>No expense matches this filter.</p>
      ) : (
        <ul className="expense-list">
          {expenses.map((expense) => (
            <li key={expense.id}>
              <ExpenseItem expense={expense} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExpenseList;
