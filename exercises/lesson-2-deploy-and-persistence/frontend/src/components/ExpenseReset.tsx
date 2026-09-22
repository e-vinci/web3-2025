interface ExpenseResetProps {
  onReset: () => Promise<void>;
}

function ExpenseReset({ onReset }: ExpenseResetProps) {
  return (
    <div>
      <h2>Reset expenses</h2>
      <button onClick={() => onReset().catch((error) => console.error(error))}>
        Reset
      </button>
    </div>
  );
}

export default ExpenseReset;
