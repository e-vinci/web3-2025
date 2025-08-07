import type { Expense } from '../types/Expense';

interface ExpenseAddProps {
  addExpense: (expense: Expense) => void;
}

export default function ExpenseAdd({ addExpense }: ExpenseAddProps) {
  const onAdd = () => {
    const id = Date.now().toString();
    const date = new Date().toISOString();
    const description = `Random Expense ${id}`;
    const payer = Math.random() < 0.5 ? 'Alice' : 'Bob';
    const amount = parseFloat((Math.random() * 100).toFixed(2));

    addExpense({
      id,
      date,
      description,
      payer,
      amount,
    });
  };

  return (
    <div>
      <button onClick={onAdd}>Add</button>
    </div>
  );
}
