import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NewExpense } from "../types/Expense";

/** Everything the form knows. The payer is added by the page, from the token. */
export type NewExpenseFormOutput = Omit<NewExpense, "payerId">;
import { ExpenseFormSchema, type ExpenseFormValues } from "../types/Expense";
import useCategories from "../hooks/useCategories";

interface ExpenseAddProps {
  expenseAdd: (expense: NewExpenseFormOutput) => Promise<void>;
}

function ExpenseAdd({ expenseAdd }: ExpenseAddProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseFormSchema),
  });
  const { categories, loading: categoriesLoading } = useCategories();

  const onSubmit = async (data: ExpenseFormValues) => {
    const newExpense: NewExpenseFormOutput = {
      description: data.description,
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

  const fieldClass =
    "mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
  const errorClass = "mt-1 block text-sm text-red-600";

  return (
    <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold text-slate-900">Add expense</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        <div>
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Description
          </label>
          <input id="description" type="text" className={fieldClass} {...register("description")} />
          {errors.description && <span className={errorClass}>{errors.description.message}</span>}
        </div>

        <div>
          <label htmlFor="amount" className="text-sm font-medium text-slate-700">
            Amount (€)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            className={fieldClass}
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && <span className={errorClass}>{errors.amount.message}</span>}
        </div>

        <div>
          <label htmlFor="date" className="text-sm font-medium text-slate-700">
            Date
          </label>
          <input id="date" type="date" className={fieldClass} {...register("date")} />
          {errors.date && <span className={errorClass}>{errors.date.message}</span>}
        </div>

        <div>
          <label htmlFor="participantsRaw" className="text-sm font-medium text-slate-700">
            Participant ids
          </label>
          <input
            id="participantsRaw"
            type="text"
            placeholder="e.g. 1, 2"
            className={fieldClass}
            {...register("participantsRaw")}
          />
          {errors.participantsRaw && (
            <span className={errorClass}>{errors.participantsRaw.message}</span>
          )}
        </div>

        <div>
          <label htmlFor="categoryId" className="text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id="categoryId"
            className={fieldClass}
            {...register("categoryId", {
              setValueAs: (v) => (v === "" ? undefined : parseInt(v, 10)),
            })}
          >
            <option value="">No category</option>
            {!categoriesLoading &&
              categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
          {errors.categoryId && <span className={errorClass}>{errors.categoryId.message}</span>}
        </div>

        <button
          type="submit"
          className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add
        </button>
      </form>
    </div>
  );
}

export default ExpenseAdd;