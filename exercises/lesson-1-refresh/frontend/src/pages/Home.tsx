import type { Expense } from "../types/Expense";
import ExpenseItem from "../components/ExpenseItem";
import { useState, useEffect } from "react";
import ExpenseAdd from "../components/ExpenseAdd";
import useExpenses from "../hooks/useExpenses";
import ExpenseReset from "../components/ExpenseReset";
import ExpenseSorter from "../components/ExpenseSorter";

// const expenses: Expense[] = [
//   { id: "1", date: "2026-09-15", description: "Restaurant", payer: "John Doe", amount: 50 },
//   { id: "2", date: "2026-09-16", description: "Groceries", payer: "Abdallah Doe", amount: 10.123 },
//   { id: "3", date: "2026-09-17", description: "Coffee", payer: "Andrea Doe", amount: 5.5 },
// ];

function Home() {
  const { expenses, loading, error, addExpense, resetExpenses } = useExpenses();
  const [sortingAlgo, setSortingAlgo] = useState<(a: Expense, b: Expense) => number>(() => () => 1);

  const handleAlgoChange = (algo: (a: Expense, b: Expense) => number) => {
    setSortingAlgo(() => algo); // We're wrapping algo in a function because useState setter accept either a value or a function returning a value.
  };

  const sortedExpenses = [...expenses].sort(sortingAlgo);

  return <div>
    <h1>Manage your expenses</h1>
    <ExpenseAdd addExpense={addExpense} />
    <ExpenseReset resetExpenses={resetExpenses}/>
    <h2>Your expenses</h2>
    {sortedExpenses.length > 0 && <ExpenseSorter setSortingAlgo={handleAlgoChange} />}
    <ul>
      {sortedExpenses.map((expense) => (
        <li key={expense.id}>
          <ExpenseItem expense={expense} />
        </li>
      ))}
    </ul>
  </div>;
}

export default Home;
