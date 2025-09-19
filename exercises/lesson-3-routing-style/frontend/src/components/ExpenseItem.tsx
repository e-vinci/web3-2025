import type { Expense } from '../types/Expense';
import { TableCell, TableRow } from '@/components/ui/table';

interface ExpenseItemProps {
  expense: Expense;
}

export default function ExpenseItem({ expense }: ExpenseItemProps) {
  return (
    <TableRow>
      <TableCell className="text-left">#{expense.id}</TableCell>
      <TableCell className="text-left">{expense.date.split('T')[0]}</TableCell>
      <TableCell className="text-left">{expense.description}</TableCell>
      <TableCell className="text-left">
        Paid by <span>{expense.payer}</span>
      </TableCell>
      <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
    </TableRow>
  );
}
