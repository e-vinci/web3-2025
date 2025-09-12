const fs = require('fs');
const path = require('path');

const EXPENSES_FILE_PATH = path.join(__dirname, '../data/expenses.json');
const EXPENSES_INIT_FILE_PATH = path.join(__dirname, '../data/expenses.init.json');

function getAllExpenses() {
  const data = fs.readFileSync(EXPENSES_FILE_PATH, 'utf8');
  return JSON.parse(data);
}

function addExpense(expense) {
  const expenses = getAllExpenses();
  expenses.push(expense);

  const updatedExpenses = JSON.stringify(expenses, null, 2);
  fs.writeFileSync(EXPENSES_FILE_PATH, updatedExpenses);
  return expense;
}

function resetExpenses() {
  const initData = fs.readFileSync(EXPENSES_INIT_FILE_PATH, 'utf8');
  fs.writeFileSync(EXPENSES_FILE_PATH, initData);
  return JSON.parse(initData);
}

function deleteExpense(id) {
  const expenses = getAllExpenses();
  const index = expenses.findIndex((e) => e.id === id);
  if (index !== -1) {
    expenses.splice(index, 1);
    fs.writeFileSync(EXPENSES_FILE_PATH, JSON.stringify(expenses, null, 2));
    return true;
  } else {
    return false;
  }
}

module.exports = {
  getAllExpenses,
  addExpense,
  resetExpenses,
  deleteExpense,
};
