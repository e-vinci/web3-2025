import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.transfer.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data.');

  // Create users first
  const users = await prisma.user.createMany({
    data: [
      {
        id: 1,
        name: 'Alice',
        email: 'alice@expenso.dev',
        bankAccount: '1234567890',
      },
      {
        id: 2,
        name: 'Bob',
        email: 'bob@expenso.dev',
        bankAccount: '0987654321',
      },
      {
        id: 3,
        name: 'Charlie',
        email: 'charlie@expenso.dev',
      },
    ],
    skipDuplicates: true,
  });
  console.log('Created users:', users);

  // Create expenses with participants
  const expense1 = await prisma.expense.create({
    data: {
      id: 1,
      description: 'Coffee',
      amount: 3.5,
      payerId: 1, // Alice pays
      participants: {
        connect: [{ id: 1 }, { id: 2 }], // Alice and Bob participate
      },
    },
  });

  const expense2 = await prisma.expense.create({
    data: {
      id: 2,
      description: 'Groceries',
      amount: 45.0,
      payerId: 2, // Bob pays
      participants: {
        connect: [{ id: 1 }, { id: 2 }, { id: 3 }], // All three participate
      },
    },
  });

  const expense3 = await prisma.expense.create({
    data: {
      id: 3,
      description: 'Internet Bill',
      amount: 60.0,
      payerId: 3, // Charlie pays
      participants: {
        connect: [{ id: 2 }, { id: 3 }], // Bob and Charlie participate
      },
    },
  });

  console.log('Created expenses:', { expense1, expense2, expense3 });

  // Create transfers
  const transfers = await prisma.transfer.createMany({
    data: [
      {
        id: 1,
        amount: 1.75, // Bob owes Alice half of coffee
        sourceId: 2, // From Bob
        targetId: 1, // To Alice
      },
      {
        id: 2,
        amount: 15.0, // Alice owes Bob her share of groceries
        sourceId: 1, // From Alice
        targetId: 2, // To Bob
      },
      {
        id: 3,
        amount: 30.0, // Bob owes Charlie half of internet bill
        sourceId: 2, // From Bob
        targetId: 3, // To Charlie
      },
    ],
    skipDuplicates: true,
  });
  console.log('Created transfers:', transfers);

  // Query and display the created data with relations
  const allExpenses = await prisma.expense.findMany({
    include: {
      payer: true,
      participants: true,
    },
  });

  const allTransfers = await prisma.transfer.findMany({
    include: {
      source: true,
      target: true,
    },
  });

  console.log('All expenses with relations:', JSON.stringify(allExpenses, null, 2));
  console.log('All transfers with relations:', JSON.stringify(allTransfers, null, 2));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  });
