import { useLoaderData } from "react-router";
import ExpenseTransactionItem from "@/components/ExpenseTransactionItem";
import TransferTransactionItem from "@/components/TransferTransactionItem";
import type { LoaderData } from "./loader";

export default function Transactions() {
  const { transactions } = useLoaderData<LoaderData>();

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <p className="text-muted-foreground">Recent transaction activity</p>
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={`${tx.id}`}
              className="transition-all duration-200 hover:scale-[1.01]"
            >
              {tx.kind === "expense" ? (
                <ExpenseTransactionItem transaction={tx} />
              ) : (
                <TransferTransactionItem transaction={tx} />
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
