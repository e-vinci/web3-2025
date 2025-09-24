import { type Transaction } from '@/lib/api';

interface TransferTransactionItemProps {
  transaction: Transaction;
}

const TransferTransactionItem = ({ transaction }: TransferTransactionItemProps) => {
  const from = transaction.payer.name;
  const to = transaction.participants[0].name;
  const amount = transaction.amount.toFixed(2);
  const date = new Date(transaction.date).toLocaleDateString();

  return (
    <div className="transaction-item">
      <p>
        {from} transferred {amount}€ to {to} on {date}.
      </p>
    </div>
  );
};

export default TransferTransactionItem;
