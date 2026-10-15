import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NewExpense } from "../types/Expense";
import { ExpenseFormSchema, type ExpenseFormValues } from "../types/Expense";
import useCategories from "../hooks/useCategories";
import useUsers from "../hooks/useUsers";

interface ExpenseAddProps {
    expenseAdd: (expense: NewExpense) => Promise<void>;
}

function ExpenseAdd({ expenseAdd }: ExpenseAddProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseFormSchema),
  });
  const { categories, loading: categoriesLoading } = useCategories();
  const { users, loading: usersLoading } = useUsers();

  const onSubmit = async (data: ExpenseFormValues) => {
    const newExpense: NewExpense = {
      description: data.description,
      payerId: data.payerId,
      amount: data.amount,
      date: data.date,
      participants: data.participantsRaw
        ? data.participantsRaw.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
        : [],
      categoryId: data.categoryId,
    };
    await expenseAdd(newExpense);
    reset(); // clear the form
  };

  return <div>
    <h2>Add expense</h2>
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="text" {...register("description")} placeholder="Description" />
      {errors.description && <span>{errors.description.message}</span>}
      <select {...register("payerId", { valueAsNumber: true })}>
        <option value="">Select payer</option>
        {!usersLoading && users.map((user) => (
          <option key={user.id} value={user.id}>{user.name}</option>
        ))}
      </select>
      {errors.payerId && <span>{errors.payerId.message}</span>}
      <input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} placeholder="Amount" />
      {errors.amount && <span>{errors.amount.message}</span>}
      <input type="date" {...register("date")} placeholder="Date" />
      {errors.date && <span>{errors.date.message}</span>}
      <input type="text" {...register("participantsRaw")} placeholder="Participant IDs (comma-separated)" />
      {errors.participantsRaw && <span>{errors.participantsRaw.message}</span>}
      <select {...register("categoryId", { setValueAs: (v) => v === "" ? undefined : parseInt(v, 10) })}>
        <option value="">No category</option>
        {!categoriesLoading && categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      {errors.categoryId && <span>{errors.categoryId.message}</span>}
      <button type="submit" className="btn btn-primary">Add</button>
    </form>
  </div>;
}

export default ExpenseAdd;