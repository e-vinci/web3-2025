import type { ExpenseInput } from '../types/Expense';
import { useForm } from 'react-hook-form';

interface ExpenseAddProps {
  addExpense: (expense: ExpenseInput) => void;
}

interface FormData {
  description: string;
  payer: string;
  amount: string;
}

export default function ExpenseAdd({ addExpense }: ExpenseAddProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = ({ description, payer, amount }: FormData) => {
    addExpense({
      description,
      payer,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <input type="text" placeholder="Description" {...register('description', { required: true })} />
      {errors.description && <span>Description field is required</span>}

      <select {...register('payer')}>
        <option value="Alice">Alice</option>
        <option value="Bob">Bob</option>
      </select>

      <input type="number" {...register('amount', { required: true })} placeholder="Enter amount" min={0} step={0.01} />
      {errors.amount && <span>Amount field is required</span>}
      <button type="submit">Add</button>
    </form>
  );
}
