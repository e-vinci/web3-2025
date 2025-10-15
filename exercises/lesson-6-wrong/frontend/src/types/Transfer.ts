import type { User } from './User';

export interface Transfer {
  id: string;
  amount: number;
  date: string; // ISO string
  source: User;
  target: User;
}

export interface NewTransferPayload {
  amount: number;
  date?: string; // ISO string
  sourceId: number;
  targetId: number;
}
