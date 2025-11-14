import type { Transaction } from "@/types/Transaction";
import { NavLink } from "react-router";
import { Receipt, Users, Calendar, ArrowRight } from "lucide-react";

interface ExpenseTransactionItemProps {
  transaction: Transaction;
}

const ExpenseTransactionItem = ({
  transaction,
}: ExpenseTransactionItemProps) => {
  const formattedDate = new Date(transaction.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="bg-chart-1/10 p-2 rounded-lg">
            <Receipt className="w-5 h-5 text-chart-1" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate">
                {transaction.description || "Expense"}
              </h3>
              <span className="bg-chart-1/10 text-chart-1 text-xs px-2 py-1 rounded-full font-medium">
                Expense
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">
                  {transaction.payer.name}
                </span>
                <span>paid</span>
              </div>

              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{transaction.participants.length} people</span>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold text-foreground mb-2">
            €{transaction.amount.toFixed(2)}
          </div>

          <NavLink
            to={`/expenses/${transaction.id.split("-").pop()}`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors group"
          >
            <span>View details</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTransactionItem;
