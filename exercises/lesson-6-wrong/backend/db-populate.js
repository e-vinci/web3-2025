import { PrismaClient } from './generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  // Clear existing data
  await prisma.transfer.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data.');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);

  // Create users first (without specifying IDs - let Prisma auto-generate them)
  const alice = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@expenso.dev',
      password: hashedPassword,
      bankAccount: '1234567890',
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob',
      email: 'bob@expenso.dev',
      password: hashedPassword,
      bankAccount: '0987654321',
    },
  });

  const charlie = await prisma.user.create({
    data: {
      name: 'Charlie',
      email: 'charlie@expenso.dev',
      password: hashedPassword,
    },
  });

  console.log('Created users:', { alice, bob, charlie });

  // Create expenses with participants (without specifying IDs)
  const expense1 = await prisma.expense.create({
    data: {
      description: 'Coffee',
      amount: 3.5,
      payerId: alice.id, // Alice pays
      participants: {
        connect: [{ id: alice.id }, { id: bob.id }], // Alice and Bob participate
      },
    },
  });

  const expense2 = await prisma.expense.create({
    data: {
      description: 'Groceries',
      amount: 45.0,
      payerId: bob.id, // Bob pays
      participants: {
        connect: [{ id: alice.id }, { id: bob.id }, { id: charlie.id }], // All three participate
      },
    },
  });

  const expense3 = await prisma.expense.create({
    data: {
      description: 'Internet Bill',
      amount: 60.0,
      payerId: charlie.id, // Charlie pays
      participants: {
        connect: [{ id: bob.id }, { id: charlie.id }], // Bob and Charlie participate
      },
    },
  });

  console.log('Created expenses:', { expense1, expense2, expense3 });

  // Create transfers (without specifying IDs)
  const transfer1 = await prisma.transfer.create({
    data: {
      amount: 1.75, // Bob owes Alice half of coffee
      sourceId: bob.id, // From Bob
      targetId: alice.id, // To Alice
    },
  });

  const transfer2 = await prisma.transfer.create({
    data: {
      amount: 15.0, // Alice owes Bob her share of groceries
      sourceId: alice.id, // From Alice
      targetId: bob.id, // To Bob
    },
  });

  const transfer3 = await prisma.transfer.create({
    data: {
      amount: 30.0, // Bob owes Charlie half of internet bill
      sourceId: bob.id, // From Bob
      targetId: charlie.id, // To Charlie
    },
  });

  console.log('Created transfers:', { transfer1, transfer2, transfer3 });

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
