import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function getAllUsers() {
  return prisma.user.findMany({
    include: {
      paidExpenses: true,
    },
  });
}
