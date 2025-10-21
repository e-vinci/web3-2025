import type { Request, Response } from 'express';
import * as userRepository from './userRepository';
import { StatusCodes } from 'http-status-codes';

export async function listUsers(req: Request, res: Response) {
  const users = await userRepository.getAllUsers();
  res.status(StatusCodes.OK).json(users);
}
