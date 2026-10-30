/**
 * A simple component to display an expense item
 */

import type { Expense } from "../types/Expense";

interface ExpenseItemProps {
  expense: Expense;
}

function ExpenseItem({ expense }: ExpenseItemProps) {
  return <div style={{border: '1px solid black', padding: '10px', marginBottom: '10px'}}>
    <h3>Expense {expense.id}</h3>
    <p>Date: {new Date(expense.date).toLocaleDateString()}</p>
    <p>Description: {expense.description}</p>
    {/* amount must be restricted to 2 decimal places */}
    <p>Amount: {expense.amount.toFixed(2)}</p>
    <p>Payer: {expense.payer.name}</p>
    <p>Participants: {expense.participants.map(p => p.name).join(', ')}</p>
    {expense.category && <p style={{ color: expense.category.colour }}>Category: {expense.category.name}</p>}
  </div>;
}

export default ExpenseItem;