import type { Expense } from "../types/Expense";

interface ExpenseAddProps {
  expenseAdd: (expense: Expense) => void;
}

function generateRandomExpense(): Expense {
  return {
    id: Math.round(Math.random()*100).toString(),
    date: "2026-09-18",
    description: "New random Expense",
    payer: "New random Payer",
    amount: Math.random() * 100
  };
}

function ExpenseAdd({ expenseAdd }: ExpenseAddProps) {
  return <div>
    <h2>Add a new random Expense</h2>
    <button onClick={() => expenseAdd(generateRandomExpense())}>Add</button>
  </div>;
}

export default ExpenseAdd;
