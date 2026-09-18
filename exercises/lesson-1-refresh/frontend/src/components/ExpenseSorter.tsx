import { useState } from 'react';
import type { Expense } from '../types/Expense';

type SortOption = 'date-newest' | 'date-oldest';
type SortingAlgo = (a: Expense, b: Expense) => number;

interface ExpenseSorterProps {
  setSortingAlgo: (algo: SortingAlgo) => void;
}

const dateNewestAlgo: SortingAlgo = (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime();
const dateOldestAlgo: SortingAlgo = (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime();

export default function ExpenseSorter({ setSortingAlgo }: ExpenseSorterProps) {
  const [sortBy, setSortBy] = useState<SortOption>('date-newest');

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOption = event.target.value as SortOption;
    setSortBy(newSortOption);

    switch (newSortOption) {
      case 'date-newest':
        setSortingAlgo(dateNewestAlgo);
        break;
      case 'date-oldest':
        setSortingAlgo(dateOldestAlgo);
        break;
      default:
        setSortingAlgo(dateNewestAlgo);
        break;
    }
  };

  return (
    <div>
      <label htmlFor="sort-select">Sort:</label>
      <select id="sort-select" value={sortBy} onChange={handleSortChange}>
        <option value="date-newest">Chronological</option>
        <option value="date-oldest">Reverse chronological</option>
      </select>
    </div>
  );
}
