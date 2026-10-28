import { useForm } from "react-hook-form";
import type { NewExpense } from "../types/Expense";

interface ExpenseAddProps {
    expenseAdd: (expense: NewExpense) => Promise<void>;
}

function ExpenseAdd({ expenseAdd }: ExpenseAddProps) {
  const onSubmit = async (e: NewExpense) => {
  //   const description = (e.target as HTMLFormElement).elements.namedItem("description") as HTMLInputElement;
  //   const payer = (e.target as HTMLFormElement).elements.namedItem("payer") as HTMLInputElement;
  //   const amount = (e.target as HTMLFormElement).elements.namedItem("amount") as HTMLInputElement;
  //   const date = (e.target as HTMLFormElement).elements.namedItem("date") as HTMLInputElement;
  //   const newExpense: NewExpense = {
  //       description: description.value,
  //       payer: payer.value,
  //       amount: parseFloat(amount.value),
  //       date: date.value,
  //   };
    await expenseAdd(e);
    reset(); // clear the form
  };

  const { register, handleSubmit, reset } = useForm<NewExpense>();


  return <div>
    <h2>Add expense</h2>
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="text" {...register("description")} placeholder="Description" />
      <input type="text" {...register("payer")} placeholder="Payer" />
      <input type="number" {...register("amount")} placeholder="Amount" />
      <input type="date" {...register("date")} placeholder="Date" />
      <button type="submit" className="btn btn-primary">Add</button>
    </form>
  </div>;
}

export default ExpenseAdd;