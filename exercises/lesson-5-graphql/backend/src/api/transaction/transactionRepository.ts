import { PrismaClient } from '@/generated/prisma/client';
import { Transaction, fromExpense, fromTransfer } from './transactionModel';

const prisma = new PrismaClient();

export async function getAllTransactions(): Promise<Transaction[]> {
  const expensesPromise = prisma.expense.findMany({
    include: {
      payer: true,
      participants: true,
    },
  });

  const transfersPromise = prisma.transfer.findMany({
    include: {
      source: true,
      target: true,
    },
  });
  const [expenses, transfers] = await Promise.all([expensesPromise, transfersPromise]);

  const normalizedExpenses = expenses.map((expense) => fromExpense(expense));
  const normalizedTransfers = transfers.map((transfer) => fromTransfer(transfer));

  return [...normalizedExpenses, ...normalizedTransfers].sort((a, b) => b.date.getTime() - a.date.getTime());
}
