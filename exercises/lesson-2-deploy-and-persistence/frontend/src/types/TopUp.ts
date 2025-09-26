export interface TopUpInput {
  user: string;
  amount: string;
}

export interface TopUp extends TopUpInput {
  id: string;
  date: string;
}
