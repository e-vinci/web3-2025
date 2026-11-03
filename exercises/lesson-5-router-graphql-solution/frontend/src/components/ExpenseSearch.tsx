import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import useUsers from "../hooks/useUsers";
import useCategories from "../hooks/useCategories";

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
    <div>
      <h3>Search expenses</h3>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="amount">Minimum amount</label>
        <input
          type="number"
          step="0.01"
          id="amount"
          placeholder="Filter by amount"
          {...register("amount", { valueAsNumber: true })}
        />

        <label htmlFor="payerId">Payer</label>
        <select id="payerId" {...register("payerId")}>
          <option value="">All payers</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <label htmlFor="categoryId">Category</label>
        <select id="categoryId" {...register("categoryId")}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <button type="submit">Search</button>
        <button type="button" onClick={onClear}>
          Clear
        </button>
      </form>
    </div>
  );
}

export default ExpenseSearch;
