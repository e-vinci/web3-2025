export interface Expense {
  id: number;
  date: string;
  description: string;
  payerId: number;
  amount: number;
  participants: number[];
}

export type NewExpense = Omit<Expense, 'id'>;
