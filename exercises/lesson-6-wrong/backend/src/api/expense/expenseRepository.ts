import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function getAllExpenses() {
  const expenses = await prisma.expense.findMany({
    include: {
      payer: true,
      participants: true,
    },
  });

  return Promise.all(
    expenses.map(async (expense) => {
      const rawShares = await prisma.share.findMany();
      (expense as Record<string, unknown>).shares = rawShares.filter((share) => share.expenseId === expense.id);
      return expense;
    })
  );
}

export async function getExpenseById(id: number) {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      payer: true,
      participants: true,
    },
  });

  if (!expense) {
    return null;
  }

  const shares = await prisma.share.findMany();
  (expense as Record<string, unknown>).shares = shares.filter((share) => share.expenseId === id);

  return expense;
}

export async function createExpense({
  description,
  amount,
  date,
  payerId,
  participantIds,
  shares,
}: {
  description: string;
  amount: number;
  date: Date;
  payerId: number;
  participantIds: number[];
  shares?: Array<{
    participantId: number;
    mode: string;
    value: number;
  }>;
}) {
  const expense = await prisma.expense.create({
    data: {
      description,
      amount,
      date,
      payer: { connect: { id: payerId } },
      participants: { connect: participantIds.map((id) => ({ id })) },
    },
  });

  shares?.forEach(async (share) => {
    prisma.share.create({
      data: {
        expenseId: expense.id,
        participantId: share.participantId,
        mode: share.mode,
        value: share.value,
      },
    });
  });

  return expense;
}

export function getAllShares() {
  return prisma.share.findMany();
}
