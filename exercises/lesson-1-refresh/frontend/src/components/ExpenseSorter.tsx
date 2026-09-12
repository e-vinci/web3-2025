import type { ChangeEvent } from 'react';
import type { ExpenseComparator } from '../utils/expenseComparators';
import {
  byAmountHighestFirst,
  byAmountLowestFirst,
  byDateNewestFirst,
  byDateOldestFirst,
} from '../utils/expenseComparators';

interface ExpenseSorterProps {
  onSortChange: (comparator: ExpenseComparator) => void;
}

const SORT_OPTIONS = {
  'date-newest': { label: 'Date (newest first)', comparator: byDateNewestFirst },
  'date-oldest': { label: 'Date (oldest first)', comparator: byDateOldestFirst },
  'amount-highest': { label: 'Amount (highest first)', comparator: byAmountHighestFirst },
  'amount-lowest': { label: 'Amount (lowest first)', comparator: byAmountLowestFirst },
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

function ExpenseSorter({ onSortChange }: ExpenseSorterProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const key = event.target.value as SortKey;
    onSortChange(SORT_OPTIONS[key].comparator);
  }

  return (
    <label className="expense-sorter">
      Sort by:{' '}
      <select defaultValue="date-newest" onChange={handleChange}>
        {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default ExpenseSorter;
