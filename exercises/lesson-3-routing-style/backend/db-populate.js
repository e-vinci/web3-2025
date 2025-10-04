const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.expense.createMany({
    data: [
      { id: 1, description: 'Coffee', amount: 3.5, payer: 'Alice' },
      { id: 2, description: 'Groceries', amount: 45.0, payer: 'Bob' },
      { id: 3, description: 'Internet Bill', amount: 60.0, payer: 'Charlie' },
    ],
    skipDuplicates: true, // Skip duplicates based on unique constraints
  });
  console.log(expenses);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  });
