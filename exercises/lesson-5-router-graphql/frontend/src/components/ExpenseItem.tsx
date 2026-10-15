/**
 * One row of the expense list.
 *
 * Note what this component does NOT show any more: participants, emails and
 * bank accounts. The list query does not ask for them, so they are not in the
 * type either — the compiler now enforces the boundary between what the list
 * screen needs and what the detail screen needs.
 */

import { Link } from "react-router";
import type { ExpenseListItem } from "../types/Expense";

interface ExpenseItemProps {
  expense: ExpenseListItem;
}

function ExpenseItem({ expense }: ExpenseItemProps) {
  return (
    <div style={{ border: "1px solid black", padding: "10px", marginBottom: "10px" }}>
      <h3>
        <Link to={`/expenses/${expense.id}`}>{expense.description}</Link>
      </h3>
      <p>Date: {new Date(expense.date).toLocaleDateString()}</p>
      <p>Amount: {expense.amount.toFixed(2)} €</p>
      <p>Payer: {expense.payer.name}</p>
      {expense.category && (
        <p style={{ color: expense.category.colour }}>Category: {expense.category.name}</p>
      )}
    </div>
  );
}

export default ExpenseItem;
