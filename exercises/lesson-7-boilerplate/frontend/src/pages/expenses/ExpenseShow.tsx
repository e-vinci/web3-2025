import { Link, useLoaderData } from "react-router";
import type { Expense } from "../../types/Expense";

function ExpenseShow() {
  const expense = useLoaderData() as Expense;

  return (
    <div className="space-y-6">
      <Link to="/expenses" className="text-sm text-indigo-600 hover:underline">
        &larr; Back to the list
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{expense.description}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(expense.date).toLocaleDateString()}
            </p>
          </div>
          <span className="text-2xl font-semibold tabular-nums text-slate-900">
            {expense.amount.toFixed(2)} €
          </span>
        </div>

        {expense.category && (
          <span
            className="mt-4 inline-block rounded-full px-2.5 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: expense.category.colour }}
          >
            {expense.category.name}
          </span>
        )}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900">Paid by</h3>
        <dl className="mt-3 space-y-1 text-sm text-slate-600">
          <div>{expense.payer.name}</div>
          <div>{expense.payer.email}</div>
          {/* This field was added to the screen without touching the backend. */}
          <div>Bank account: {expense.payer.bankAccount ?? "not provided"}</div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900">Shared between</h3>
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {expense.participants.map((participant) => (
            <li key={participant.id}>
              {participant.name} ({participant.email})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ExpenseShow;
