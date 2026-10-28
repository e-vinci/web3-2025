import { db } from "../prisma/db.ts";
import { Temporal } from 'temporal-polyfill';

const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    bankAccount: "BE12 3456 7890 1234",
  },
  {
    id: 2,
    name: "Jane Doe",
    email: "jane.doe@example.com",
    bankAccount: "BE13 3456 7890 1234",
  },
  {
    id: 3,
    name: "Abdallah Doe",
    email: "abdallah.doe@example.com",
    bankAccount: "BE14 3456 7890 1234",
  },
  {
    id: 4,
    name: "Soufiane Doe",
    email: "soufiane.doe@example.com",
    bankAccount: "BE15 3456 7890 1234",
  },
];

const expensesSeed = [
  {
    description: "Coffee",
    amount: 3.50,
    payerId: 1, // John pays
    date: Temporal.Instant.from("2026-10-15T00:00:00Z"),
    participants: [1, 2],
  },
  {
    description: 'Groceries',
    amount: 45.0,
    date: Temporal.Instant.from("2026-10-16T00:00:00Z"),
    payerId: 2, // Jane pays
    participants: [1, 2, 3],
  },
  {
    description: 'Internet Bill',
    amount: 60.0,
    date: Temporal.Instant.from("2026-10-17T00:00:00Z"),
    payerId: 3, // Abdallah pays
    participants: [2, 3],
  },
];

const transfers = [
  {
    id: 1,
    amount: 1.75, // Jane owes John half of the coffee cost
    sourceId: 2, // From Jane
    targetId: 1, // To John
    date: Temporal.Instant.from("2026-10-15T10:05:00Z"),
  },
  {
    id: 2,
    amount: 15.0, // John owes Jane her share of groceries
    sourceId: 1, // From John
    targetId: 2, // To Jane
    date: Temporal.Instant.from("2026-10-17T09:00:00Z"),
  },
  {
    id: 3,
    amount: 15.0, // Abdallah owes Jane his share of groceries
    sourceId: 3, // From Abdallah
    targetId: 2, // To Jane
    date: Temporal.Instant.from("2026-10-17T09:03:00Z"),
  },
  {
    id: 4,
    amount: 30.0, // Jane owes Abdallah half of internet bill
    sourceId: 2, // From Jane
    targetId: 3, // To Abdallah
    date: Temporal.Instant.from("2026-10-20T22:30:00Z"),
  },
];

async function seed() {
  console.log("Deleting all data...");
  await db.orm.public.Transfer.where({}).deleteAll();
  await db.orm.public.Expense.where({}).deleteAll();
  await db.orm.public.User.where({}).deleteAll();
  console.log("...Done!");

  console.log("populating users...");
  await Promise.all(
    users.map(async (user) => {
      await db.orm.public.User.create(user);
    })
  );
  console.log("...Done!");

  console.log("populating expenses...");
  await Promise.all(
    expensesSeed.map(async ({ participants, ...fields }) => {
      await db.orm.public.Expense.create({
        ...fields,
        participants: (mutator) =>
          mutator.create(participants.map((userId: number) => ({ userId }))),
      });
    })
  );
  console.log("...Done!");

  console.log("populating transfers...");
  await Promise.all(
    transfers.map(async (transfer) => {
      await db.orm.public.Transfer.create(transfer);
    })
  );
  console.log("...Done!");

}

seed()
  .then(() => db.close())
  .catch(async (e) => {
    console.error(e);
    await db.close();
    process.exit(1);
  });