import { db } from '../src/prisma/db.ts';

async function main() {
  const expense = await db.orm.public.Expense.create({
    amount: 100,
    date: new Date().toISOString(),
    description: 'Restaurant',
    payer: 'Alice',
  });
  console.log(expense);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });