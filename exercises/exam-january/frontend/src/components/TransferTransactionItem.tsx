import type { Transaction } from '@/types/Transaction';
import { ArrowRightLeft, Calendar } from 'lucide-react';

interface TransferTransactionItemProps {
  transaction: Transaction;
}

const TransferTransactionItem = ({ transaction }: TransferTransactionItemProps) => {
  const from = transaction.payer.name;
  const to = transaction.participants[0]?.name || 'Unknown';
  const amount = transaction.amount.toFixed(2);
  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="bg-chart-2/10 p-2 rounded-lg">
            <ArrowRightLeft className="w-5 h-5 text-chart-2" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">Transfer</h3>
              <span className="bg-chart-2/10 text-chart-2 text-xs px-2 py-1 rounded-full font-medium">Transfer</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{from}</span>
              <ArrowRightLeft className="w-3 h-3" />
              <span className="font-medium text-foreground">{to}</span>

              <div className="flex items-center gap-1 ml-4">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold text-foreground">€{amount}</div>
        </div>
      </div>
    </div>
  );
};

export default TransferTransactionItem;
