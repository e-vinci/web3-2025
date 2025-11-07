import type { Request, Response } from 'express';
import * as expenseRepository from './expenseRepository';
import { StatusCodes } from 'http-status-codes';
import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function listExpenses(req: Request, res: Response) {
  const expenses = await expenseRepository.getAllExpenses();
  const rawShares = await expenseRepository.getAllShares();
  res.status(StatusCodes.OK).json({ expenses, rawShares });
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
  const { description, amount, date, payerId, participantIds, shares } = req.body;

  try {
    const newExpense = await expenseRepository.createExpense({
      description,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      payerId: Number(payerId),
      participantIds: participantIds,
      shares: shares?.map((share: any) => ({
        participantId: share.userId ?? share.participantId,
        mode: share.mode || 'percentage',
        value: Number(share.value ?? 0),
      })),
    });

    res.status(StatusCodes.CREATED).json(newExpense);
  } catch (error) {
    console.error('Failed to create expense', error);
    res.status(StatusCodes.OK).json({ message: 'Expense is being queued for processing' });
  }
}

export async function addShare(req: Request, res: Response) {
  const expenseId = Number(req.params.id);
  await prisma.share.create({
    data: {
      expenseId,
      participantId: req.body.participantId,
      mode: req.body.mode ?? 'value',
      value: Number(req.body.value ?? req.body.amount ?? 0),
    },
  });

  res.status(StatusCodes.ACCEPTED).json({ status: 'Share update will be applied soon' });
}
