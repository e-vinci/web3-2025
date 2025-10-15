import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export interface UserStats {
  totalExpensesPaid: number;
  totalExpensesCount: number;
  totalTransfersReceived: number;
  totalTransfersSent: number;
  netBalance: number;
}

export async function getStatsForUser(userId: number): Promise<UserStats | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      paidExpenses: true,
      transfersIn: true,
      transfersOut: true,
    },
  });

  if (!user) {
    return null;
  }

  const totalExpensesPaid = user.paidExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalExpensesCount = user.paidExpenses.length;
  const totalTransfersReceived = user.transfersIn.reduce((sum, transfer) => sum + transfer.amount, 0);
  const totalTransfersSent = user.transfersOut.reduce((sum, transfer) => sum + transfer.amount, 0);
  const netBalance = totalTransfersReceived - totalTransfersSent - totalExpensesPaid;

  return {
    totalExpensesPaid,
    totalExpensesCount,
    totalTransfersReceived,
    totalTransfersSent,
    netBalance,
  };
}
