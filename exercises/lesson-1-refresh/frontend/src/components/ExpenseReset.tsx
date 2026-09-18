import { resetExpenses } from "../hooks/useExpenses";
import type { Expense } from "../types/Expense";

interface ExpenseResetProps {
  setExpenses: (expenses: Expense[]) => void;
}

function ExpenseReset({ setExpenses }: ExpenseResetProps) {
  return (
    <div>
      <h2>Reset expenses</h2>
      <button
        onClick={() =>
          resetExpenses().then((expenses) => setExpenses(expenses)).catch((error) => console.error(error))
        }
      >
        Reset
      </button>
    </div>
  );
}

export default ExpenseReset;