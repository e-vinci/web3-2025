const express = require('express');
const router = express.Router();
const expensesService = require('../services/expenses.js');

router.get('/', async (req, res) => {
  try {
    const expenses = await expensesService.getAllExpenses();
    res.json(expenses);
  } catch (error) {
    console.error('Error retrieving expenses:', error);
    res.status(500).json({ error: 'Failed to retrieve expenses' });
  }
});

router.post('/', async (req, res) => {
  try {
    const newExpense = {
      date: req.body.date,
      description: req.body.description,
      payer: req.body.payer,
      amount: parseFloat(req.body.amount),
    };

    const addedExpense = await expensesService.addExpense(newExpense);
    res.status(201).json(addedExpense);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const resetData = await expensesService.resetExpenses();
    res.json({
      message: 'Expenses reset successfully',
      data: resetData,
    });
  } catch (error) {
    console.error('Error resetting expenses:', error);
    res.status(500).json({ error: 'Failed to reset expenses' });
  }
});

module.exports = router;
