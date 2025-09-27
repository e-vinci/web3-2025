import type { Expense } from '../types/Expense';

interface ExpenseItemProps {
  expense: Expense;
  onDelete?: (id: string) => void;
}

export default function ExpenseItem({ expense, onDelete }: ExpenseItemProps) {
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
      {onDelete && (
        <button onClick={() => onDelete(expense.id)} style={{ marginTop: '0.5em', color: 'red' }}>
          Delete
        </button>
      )}
    </div>
  );
}
