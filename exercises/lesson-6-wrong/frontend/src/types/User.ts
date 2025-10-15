import type { Expense } from './Expense';
import type { Transfer } from './Transfer';

export interface User {
  id: number;
  name: string;
  email: string;
  bankAccount?: string;
  paidExpenses: Expense[];
  transfersOut: Transfer[];
  transfersIn: Transfer[];
  participatedExpenses: Expense[];
}
