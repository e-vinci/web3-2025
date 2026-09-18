import type { Expense } from '../types/Expense';

interface ExpenseAddProps {
  addExpense: (expense: Expense) => void;
}

const PAYERS = ['Alice', 'Bob'];

function randomPayer(): string {
  return PAYERS[Math.floor(Math.random() * PAYERS.length)];
}

function randomAmount(): number {
  // Round to cents so we never end up with more than 2 decimal digits.
  return Math.round(Math.random() * 100 * 100) / 100;
}

function ExpenseAdd({ addExpense }: ExpenseAddProps) {
  function handleAddClick() {
    const id = Date.now().toString();
    const newExpense: Expense = {
      id,
      date: new Date().toISOString(),
      description: `New expense ${id}`,
      payer: randomPayer(),
      amount: randomAmount(),
    };
    addExpense(newExpense);
  }

  return (
    <button type="button" onClick={handleAddClick}>
      Add
    </button>
  );
}

export default ExpenseAdd;
