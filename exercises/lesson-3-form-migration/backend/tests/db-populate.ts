import { db } from '../src/prisma/db.ts';

async function main() {
  const user = await db.orm.public.User.create({
    name: 'Alice',
    email: 'alice@example.com',
  });

  const expense = await db.orm.public.Expense.create({
    amount: 100,
    date: new Date(),
    description: 'Restaurant',
    payerId: user.id,
    participants: (mutator) => mutator.create([{ userId: user.id }]),
  });
  console.log(expense);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });