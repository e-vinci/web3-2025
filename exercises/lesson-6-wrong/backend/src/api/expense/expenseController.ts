import type { Request, Response } from 'express';
import * as expenseRepository from './expenseRepository';
import { StatusCodes } from 'http-status-codes';

export async function listExpenses(req: Request, res: Response) {
  const expenses = await expenseRepository.getAllExpenses();
  res.status(StatusCodes.OK).json(expenses);
}

export async function getExpenseDetail(req: Request, res: Response) {
  const id = Number(req.params.id);
  const expense = await expenseRepository.getExpenseById(id);
  if (!expense) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Expense not found' });
  }
  res.status(StatusCodes.OK).json(expense);
}

export async function createExpense(req: Request, res: Response) {
  const { description, amount, date, payerId, participantIds } = req.body;

  const newExpense = await expenseRepository.createExpense({
    description,
    amount: parseFloat(amount),
    date: date ? new Date(date) : new Date(),
    payerId: Number(payerId),
    participantIds: participantIds,
  });
  res.status(StatusCodes.CREATED).json(newExpense);
}
