import { Link, useLoaderData } from "react-router";
import type { Expense } from "../../types/Expense";

function ExpenseShow() {
  const expense = useLoaderData() as Expense;

  return (
    <div>
      <p>
        <Link to="/expenses">&larr; Back to the list</Link>
      </p>

      <h2>{expense.description}</h2>
      <p>{expense.amount.toFixed(2)} €</p>
      <p>on {new Date(expense.date).toLocaleDateString()}</p>

      {expense.category && (
        <p style={{ color: expense.category.colour }}>Category: {expense.category.name}</p>
      )}

      <h3>Paid by</h3>
      <ul>
        <li>{expense.payer.name}</li>
        <li>{expense.payer.email}</li>
        {/* This field was added to the screen without touching the backend. */}
        <li>Bank account: {expense.payer.bankAccount ?? "not provided"}</li>
      </ul>

      <h3>Shared between</h3>
      <ul>
        {expense.participants.map((participant) => (
          <li key={participant.id}>
            {participant.name} ({participant.email})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExpenseShow;
