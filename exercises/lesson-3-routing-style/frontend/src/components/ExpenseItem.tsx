import type { Expense } from '../types/Expense';

interface ExpenseItemProps {
  expense: Expense;
}

export default function ExpenseItem({ expense }: ExpenseItemProps) {
  return (
    <tr className="hover:bg-gray-100 ">
      <td className="px-4 text-left">#{expense.id}</td>
      <td className="px-4 text-left">{expense.date.split('T')[0]}</td>
      <td className="px-4 text-left">{expense.description}</td>
      <td className="px-4 text-left">
        Paid by <span>{expense.payer}</span>
      </td>
      <td className="px-4 text-right">${expense.amount.toFixed(2)}</td>
    </tr>
  );
}
