import type { Request, Response } from 'express';
import * as transferRepository from './transferRepository';
import { StatusCodes } from 'http-status-codes';

export async function listTransfers(req: Request, res: Response) {
  const transfers = await transferRepository.getAllTransfers();
  res.status(StatusCodes.OK).json(transfers);
}

export async function getTransferDetail(req: Request, res: Response) {
  const id = Number(req.params.id);
  const transfer = await transferRepository.getTransferById(id);
  if (!transfer) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'transfer not found' });
  }
  res.status(StatusCodes.OK).json(transfer);
}

export async function createTransfer(req: Request, res: Response) {
  const { amount, date, sourceId, targetId } = req.body;

  const newTransfer = await transferRepository.createTransfer({
    amount: parseFloat(amount),
    date: date ? new Date(date) : new Date(),
    sourceId: Number(sourceId),
    targetId: Number(targetId),
  });
  res.status(StatusCodes.CREATED).json(newTransfer);
}
