import type { Expense } from '../types/Expense';

interface ExpenseItemProps {
  expense: Expense;
}

function ExpenseItem({ expense }: ExpenseItemProps) {
  const formattedDate = new Date(expense.date).toLocaleDateString();

  return (
    <li className="expense-item">
      <span className="expense-item__date">{formattedDate}</span>
      <span className="expense-item__description">{expense.description}</span>
      <span className="expense-item__payer">{expense.payer}</span>
      <span className="expense-item__amount">${expense.amount.toFixed(2)}</span>
    </li>
  );
}

export default ExpenseItem;
