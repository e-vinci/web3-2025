import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NewExpense } from "../types/Expense";
import { ExpenseFormSchema, type ExpenseFormValues } from "../types/Expense";

interface ExpenseAddProps {
    expenseAdd: (expense: NewExpense) => Promise<void>;
}

function ExpenseAdd({ expenseAdd }: ExpenseAddProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseFormSchema),
  });

  const onSubmit = async (data: ExpenseFormValues) => {
    const newExpense: NewExpense = {
      description: data.description,
      payerId: data.payerId,
      amount: data.amount,
      date: data.date,
      participants: data.participantsRaw
        ? data.participantsRaw.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
        : [],
    };
    await expenseAdd(newExpense);
    reset(); // clear the form
  };

  return <div>
    <h2>Add expense</h2>
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="text" {...register("description")} placeholder="Description" />
      {errors.description && <span>{errors.description.message}</span>}
      <input type="number" {...register("payerId", { valueAsNumber: true })} placeholder="Payer ID" />
      {errors.payerId && <span>{errors.payerId.message}</span>}
      <input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} placeholder="Amount" />
      {errors.amount && <span>{errors.amount.message}</span>}
      <input type="date" {...register("date")} placeholder="Date" />
      {errors.date && <span>{errors.date.message}</span>}
      <input type="text" {...register("participantsRaw")} placeholder="Participant IDs (comma-separated)" />
      {errors.participantsRaw && <span>{errors.participantsRaw.message}</span>}
      <button type="submit" className="btn btn-primary">Add</button>
    </form>
  </div>;
}

export default ExpenseAdd;