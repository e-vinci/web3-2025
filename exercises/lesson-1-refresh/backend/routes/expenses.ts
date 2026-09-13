import { Router, type Request, type Response } from 'express';
import { addExpense, getAllExpenses, resetExpenses } from '../services/expenses.ts';
import type { Expense } from '../types/Expense.ts';

const router = Router();

function isValidExpense(value: unknown): value is Expense {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.payer === 'string' &&
    typeof candidate.amount === 'number'
  );
}

router.get('/expenses', (req: Request, res: Response) => {
  try {
    res.json(getAllExpenses());
  } catch (error) {
    console.error('Failed to read expenses:', error);
    res.sendStatus(500);
  }
});

router.post('/expenses', (req: Request, res: Response) => {
  if (!isValidExpense(req.body)) {
    res.status(400).json({ error: 'Invalid expense payload' });
    return;
  }

  try {
    res.status(201).json(addExpense(req.body));
  } catch (error) {
    console.error('Failed to add expense:', error);
    res.sendStatus(500);
  }
});

router.post('/expenses/reset', (req: Request, res: Response) => {
  try {
    const expenses = resetExpenses();
    res.json({ message: 'Expenses reset to their initial state', expenses });
  } catch (error) {
    console.error('Failed to reset expenses:', error);
    res.sendStatus(500);
  }
});

export default router;
