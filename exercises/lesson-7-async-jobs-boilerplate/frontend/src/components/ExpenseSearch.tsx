import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import useUsers from "../hooks/useUsers";
import useCategories from "../hooks/useCategories";

const fieldClass =
  "mt-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

interface SearchFormValues {
  amount?: number;
  payerId?: string;
  categoryId?: string;
}

/**
 * The search form does not fetch anything and does not own the filter.
 * It only writes the filter into the URL; the route's loader reads it back and
 * React Router re-runs the loader automatically.
 */
function ExpenseSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { users } = useUsers();
  const { categories } = useCategories();

  const { register, handleSubmit, reset } = useForm<SearchFormValues>({
    // Opening /expenses?payerId=2 directly must show the form already filled in.
    defaultValues: {
      amount: searchParams.get("amount") ? Number(searchParams.get("amount")) : undefined,
      payerId: searchParams.get("payerId") ?? "",
      categoryId: searchParams.get("categoryId") ?? "",
    },
  });

  const onSubmit = (data: SearchFormValues) => {
    // Only the filters the user actually filled in go into the URL.
    // An empty <select> gives "" and an empty number input gives NaN, and both
    // are falsy — so one `if` per filter is all we need.
    const filter: Record<string, string> = {};
    if (data.amount) filter.amount = String(data.amount);
    if (data.payerId) filter.payerId = data.payerId;
    if (data.categoryId) filter.categoryId = data.categoryId;

    setSearchParams(filter);
  };

  const onClear = () => {
    reset({ amount: undefined, payerId: "", categoryId: "" });
    setSearchParams({});
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Search expenses</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="amount" className="block text-xs font-medium text-slate-600">
            Minimum amount
          </label>
          <input
            type="number"
            step="0.01"
            id="amount"
            placeholder="Any"
            className={fieldClass}
            {...register("amount", { valueAsNumber: true })}
          />
        </div>

        <div>
          <label htmlFor="payerId" className="block text-xs font-medium text-slate-600">
            Payer
          </label>
          <select id="payerId" className={fieldClass} {...register("payerId")}>
            <option value="">All payers</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="categoryId" className="block text-xs font-medium text-slate-600">
            Category
          </label>
          <select id="categoryId" className={fieldClass} {...register("categoryId")}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Search
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Clear
        </button>
      </form>
    </div>
  );
}

export default ExpenseSearch;
