import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client.ts";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.transfer.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing data.");

  // Create users first
  const passwordHash = await bcrypt.hash("topsecret", 10);
  const users = await prisma.user.createManyAndReturn({
    data: [
      {
        name: "Alice",
        email: "alice@expenso.dev",
        bankAccount: "1234567890",
        password: passwordHash,
      },
      {
        name: "Bob",
        email: "bob@expenso.dev",
        bankAccount: "0987654321",
        password: passwordHash,
      },
      {
        name: "Charlie",
        email: "charlie@expenso.dev",
        password: passwordHash,
      },
    ],
    skipDuplicates: true,
  });
  console.log("Created users:", users);
  const [alice, bob, charlie] = users;

  // Create expenses with participants
  const expense1 = await prisma.expense.create({
    data: {
      description: "Coffee",
      amount: 3.5,
      payerId: alice.id,
      participants: {
        connect: [{ id: alice.id }, { id: bob.id }],
      },
    },
  });

  const expense2 = await prisma.expense.create({
    data: {
      description: "Groceries",
      amount: 45.0,
      payerId: bob.id, // Bob pays
      participants: {
        connect: [{ id: alice.id }, { id: bob.id }, { id: charlie.id }],
      },
    },
  });

  const expense3 = await prisma.expense.create({
    data: {
      description: "Internet Bill",
      amount: 60.0,
      payerId: charlie.id, // Charlie pays
      participants: {
        connect: [{ id: bob.id }, { id: charlie.id }],
      },
    },
  });

  console.log("Created expenses:", { expense1, expense2, expense3 });

  // Create transfers
  const transfers = await prisma.transfer.createMany({
    data: [
      {
        amount: 1.75, // Bob owes Alice half of coffee
        sourceId: bob.id,
        targetId: alice.id,
      },
      {
        amount: 15.0, // Alice owes Bob her share of groceries
        sourceId: alice.id,
        targetId: bob.id,
      },
      {
        amount: 30.0, // Bob owes Charlie half of internet bill
        sourceId: bob.id,
        targetId: alice.id,
      },
    ],
    skipDuplicates: true,
  });
  console.log("Created transfers:", transfers);

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

  console.log(
    "All expenses with relations:",
    JSON.stringify(allExpenses, null, 2)
  );
  console.log(
    "All transfers with relations:",
    JSON.stringify(allTransfers, null, 2)
  );
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  });
