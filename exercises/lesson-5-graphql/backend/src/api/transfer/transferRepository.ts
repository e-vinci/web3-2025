import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function getAllTransfers() {
  return prisma.transfer.findMany({
    include: {
      source: true,
      target: true,
    },
  });
}

export async function getTransferById(id: number) {
  return prisma.transfer.findUnique({
    where: { id },
    include: {
      source: true,
      target: true,
    },
  });
}

export async function createTransfer({
  amount,
  date,
  sourceId,
  targetId,
}: {
  amount: number;
  date: Date;
  sourceId: number;
  targetId: number;
}) {
  return prisma.transfer.create({
    data: {
      amount,
      date,
      source: { connect: { id: sourceId } },
      target: { connect: { id: targetId } },
    },
  });
}
