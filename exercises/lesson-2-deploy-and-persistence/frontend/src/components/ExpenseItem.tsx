import type { Expense } from '../types/Expense';

interface ExpenseItemProps {
  expense: Expense;
}

export default function ExpenseItem({ expense }: ExpenseItemProps) {
  return (
    <tr>
      <td>#{expense.id}</td>
      <td>{expense.date}</td>
      <td>{expense.description}</td>
      <td>
        Paid by <span>{expense.payer}</span>
      </td>
      <td>${expense.amount.toFixed(2)}</td>
    </tr>
  );
}
