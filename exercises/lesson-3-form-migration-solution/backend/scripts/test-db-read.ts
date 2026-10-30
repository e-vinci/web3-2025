import { db } from '../src/prisma/db.ts';

async function main() {
  const expenses = await db.orm.public.Expense.all();
  console.log(expenses);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });