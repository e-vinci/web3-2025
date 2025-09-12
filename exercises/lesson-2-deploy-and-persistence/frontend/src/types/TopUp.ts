export interface TopUpInput {
  user: string;
  amount: string; // Faulty: should be number, but matches backend bad practice
}

export interface TopUp extends TopUpInput {
  id: string;
  date: string;
}
