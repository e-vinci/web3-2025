import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.expense.findMany();
  console.log(expenses);
}

await main();
