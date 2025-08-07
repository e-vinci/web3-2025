import type { Expense } from '../types/Expense';

interface ExpenseItemProps {
  expense: Expense;
}

export default function ExpenseItem({ expense }: ExpenseItemProps) {
  return (
    <div>
      <div>
        <strong>Date:</strong> {expense.date}
      </div>
      <div>
        <strong>Description:</strong> {expense.description}
      </div>
      <div>
        <strong>Payer:</strong> {expense.payer}
      </div>
      <div>
        <strong>Amount:</strong> ${expense.amount.toFixed(2)}
      </div>
    </div>
  );
}
