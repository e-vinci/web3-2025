import { Router } from 'express';

import * as ExpenseController from './expenseController';
const router = Router();
router.get('/', ExpenseController.listExpenses);
router.post('/', ExpenseController.createExpense);
router.get('/:id', ExpenseController.getExpenseDetail);
router.post('/:id/shares', ExpenseController.addShare);

export default router;
