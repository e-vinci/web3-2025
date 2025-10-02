import type { ExpenseInput } from '../types/Expense';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface ExpenseAddProps {
  addExpense: (expense: ExpenseInput) => void;
}

const expenseSchema = z.object({
  description: z
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .min(3, 'Description must be at least 3 characters long')
    .or(z.literal('')),
  payer: z.enum(['Alice', 'Bob'], {
    error: 'Payer must be either Alice or Bob',
  }),
  amount: z.coerce.number<number>().gt(0, 'Amount must be a positive number'),
});

type FormData = z.infer<typeof expenseSchema>;

export default function ExpenseAdd({ addExpense }: ExpenseAddProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(expenseSchema),
  });

  const onSubmit = ({ description, payer, amount }: FormData) => {
    addExpense({
      description,
      payer,
      amount,
      date: new Date().toISOString(),
    });
  };

  const isSubmitDisabled = isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <input type="text" placeholder="Description" {...register('description')} />
      {errors.description && <span> {errors.description.message}</span>}

      <select {...register('payer')}>
        <option value="Alice">Alice</option>
        <option value="Bob">Bob</option>
      </select>
      {errors.payer && <span>{errors.payer.message}</span>}

      <input type="number" {...register('amount')} placeholder="Enter amount" step={0.01} />
      {errors.amount && <span>{errors.amount.message}</span>}

      <button type="submit" disabled={isSubmitDisabled}>
        {isSubmitting ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
}
