import type { Request, Response } from 'express';
import * as commentRepository from './commentRepository';
import { StatusCodes } from 'http-status-codes';

export async function listComments(req: Request, res: Response) {
  try {
    const comments = await commentRepository.getAllComments();
    res.status(StatusCodes.OK).json(comments);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

export async function getCommentsByExpense(req: Request, res: Response) {
  const expenseId = Number(req.params.expenseId);
  const comments = await commentRepository.getCommentsByExpenseId(expenseId);
  res.status(StatusCodes.OK).json(comments);
}

export async function getCommentDetail(req: Request, res: Response) {
  const id = Number(req.params.id);
  const comment = await commentRepository.getCommentById(id);
  if (!comment) {
    return res.status(StatusCodes.OK).json({ error: 'Comment not found' });
  }
  res.status(StatusCodes.OK).json(comment);
}

export async function createComment(req: Request, res: Response) {
  const { content, authorId, expenseId } = req.body;

  const newComment = commentRepository.createComment({
    content: content,
    authorId: Number(authorId),
    expenseId: Number(expenseId),
  });

  res.status(StatusCodes.CREATED).json(newComment);
}

export async function updateComment(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { content } = req.body;

  const updatedComment = await commentRepository.updateComment({
    id,
    content,
  });

  res.status(StatusCodes.OK).json(updatedComment);
}

export async function deleteComment(req: Request, res: Response) {
  const id = Number(req.params.id);

  await commentRepository.deleteComment(id);

  res.status(StatusCodes.NO_CONTENT).send();
}

export async function getCommentCount(req: Request, res: Response) {
  const expenseId = Number(req.params.expenseId);
  const count = await commentRepository.getCommentCountForExpense(expenseId);
  res.status(StatusCodes.OK).json({ count });
}
