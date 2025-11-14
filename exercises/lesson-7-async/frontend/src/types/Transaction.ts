import type { User } from "./User";

export interface Transaction {
  id: string;
  kind: "expense" | "transfer";
  amount: number;
  date: string; // ISO string
  description?: string;
  payer: User;
  participants: User[]; // Only for transfers
}
