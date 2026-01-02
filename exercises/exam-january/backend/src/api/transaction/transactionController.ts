import type { Request, Response } from 'express';
import * as transactionRepository from './transactionRepository';
import { StatusCodes } from 'http-status-codes';

export async function listTransactions(req: Request, res: Response) {
  const transactions = await transactionRepository.getAllTransactions();
  res.status(StatusCodes.OK).json(transactions);
}
