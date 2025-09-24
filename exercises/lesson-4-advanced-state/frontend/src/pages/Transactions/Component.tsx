import { useLoaderData } from 'react-router-dom';
import ExpenseTransactionItem from '@/components/ExpenseTransactionItem';
import TransferTransactionItem from '@/components/TransferTransactionItem';
import type { LoaderData } from './loader';

export default function Transactions() {
  const { transactions } = useLoaderData<LoaderData>();
  return (
    <section>
      <ul>
        {transactions.map((tx) => (
          <li key={`${tx.id}`}>
            {tx.kind === 'expense' ? (
              <ExpenseTransactionItem transaction={tx} />
            ) : (
              <TransferTransactionItem transaction={tx} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
