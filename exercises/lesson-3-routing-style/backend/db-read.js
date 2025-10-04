const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.expense.findMany();
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
