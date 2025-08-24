const { PrismaClient } = require('../generated/prisma/client');

const prisma = new PrismaClient();

const queryDatabaseAndDisconnect = (operation) => {
  return operation().finally(() => {
    prisma.$disconnect();
  });
};

function getAllExpenses() {
  const operation = () => prisma.expense.findMany();
  const expenses = queryDatabaseAndDisconnect(operation);
  console.log(expenses);
  return expenses;
}

function addExpense(expense) {
  const operation = () => prisma.expense.create({ data: expense });
  return queryDatabaseAndDisconnect(operation);
}

const INITIAL_DATA = [
  { date: '2025-01-16T00:00:00Z', description: 'Example expense #1 from Alice', payer: 'Alice', amount: 25.5 },
  { date: '2025-01-15T00:00:00Z', description: 'Example expense #2 from Bob', payer: 'Bob', amount: 35 },
  { date: '2025-01-15T00:00:00Z', description: 'Example expense #3 from Alice', payer: 'Alice', amount: 2 },
];

function resetExpenses() {
  const operation = async () => {
    await prisma.expense.deleteMany({});
    await prisma.expense.createMany({ data: INITIAL_DATA });
    return prisma.expense.findMany();
  };
  return queryDatabaseAndDisconnect(operation);
}

module.exports = {
  getAllExpenses,
  addExpense,
  resetExpenses,
};
