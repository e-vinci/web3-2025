import { type Transaction } from '@/lib/api';
import { NavLink } from 'react-router-dom';

interface ExpenseTransactionItemProps {
  transaction: Transaction;
}

const ExpenseTransactionItem = ({ transaction }: ExpenseTransactionItemProps) => (
  <p className="expense-transaction-item p-4 border border-gray-200 rounded-lg mb-2">
    {transaction.payer.name} paid ${transaction.amount.toFixed(2)} for {transaction.participants.length} people on{' '}
    {new Date(transaction.date).toLocaleDateString()} : {transaction.description}{' '}
    <NavLink
      to={`/expenses/${transaction.id.split('-').pop()}`}
      className="text-blue-600 hover:text-blue-800 underline"
    >
      details
    </NavLink>
  </p>
);

export default ExpenseTransactionItem;
