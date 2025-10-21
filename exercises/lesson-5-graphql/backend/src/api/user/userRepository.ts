import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function getAllUsers() {
  return prisma.user.findMany({
    include: {
      paidExpenses: true,
    },
  });
}
