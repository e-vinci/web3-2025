import type { Expense } from "../types/Expense";

interface ExpenseItemProps {
  expense: Expense;
}

export default function ExpenseItem({ expense }: ExpenseItemProps) {
  return (
    <tr>
      <td className="text-left">#{expense.id}</td>
      <td className="text-left">{expense.date}</td>
      <td className="text-left">{expense.description}</td>
      <td className="text-left">
        Paid by <span>{expense.payer.name}</span>
      </td>
      <td className="text-right">${expense.amount.toFixed(2)}</td>
    </tr>
  );
}
