interface ExpenseResetProps {
  resetExpenses: () => Promise<void>;
}

function ExpenseReset({ resetExpenses }: ExpenseResetProps) {
  return (
    <div>
      <h2>Reset expenses</h2>
      <button
        onClick={resetExpenses}
      >
        Reset
      </button>
    </div>
  );
}

export default ExpenseReset;