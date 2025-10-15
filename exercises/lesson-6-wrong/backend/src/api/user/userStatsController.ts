import type { Request, Response } from 'express';
import * as userStatsRepository from './userStatsRepository';
import { StatusCodes } from 'http-status-codes';

export async function getUserStats(req: Request, res: Response) {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid user ID' });
    }

    const stats = await userStatsRepository.getStatsForUser(userId);

    if (!stats) {
      throw new Error('User not found');
    }

    res.status(StatusCodes.OK).json(stats);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Something went wrong'
    });
  }
}
