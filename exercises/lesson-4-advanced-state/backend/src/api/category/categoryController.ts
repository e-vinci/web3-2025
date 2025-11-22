import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes/build/cjs/status-codes';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

export async function listCategories(req: Request, res: Response) {
  res.status(StatusCodes.OK).json(CATEGORIES);
}

export async function getExpensesByCategory(req: Request, res: Response) {
  const category = req.params.category;

  const expenses = await prisma.expense.findMany({
    where: { category },
    include: {
      payer: true,
      participants: true,
    },
  });

  res.status(StatusCodes.OK).json(expenses);
}
