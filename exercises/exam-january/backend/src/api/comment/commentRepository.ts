import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

export async function getAllComments() {
  return prisma.comment.findMany({
    include: {
      author: true,
      expense: true,
    },
  });
}

export async function getCommentsByExpenseId(expenseId: number) {
  return prisma.comment.findMany({
    where: { expenseId },
  });
}

export async function getCommentById(id: number) {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      author: true,
      expense: {
        include: {
          payer: true,
          participants: true,
        },
      },
    },
  });
}

export async function createComment({
  content,
  authorId,
  expenseId,
}: {
  content: string;
  authorId: number;
  expenseId: number;
}) {
  return prisma.comment.create({
    data: {
      content,
      author: { connect: { id: authorId } },
      expense: { connect: { id: expenseId } },
    },
  });
}

export async function updateComment({ id, content }: { id: number; content: string }) {
  return prisma.comment.update({
    where: { id },
    data: { content },
  });
}

export async function deleteComment(id: number) {
  return prisma.comment.delete({
    where: { id },
  });
}

export async function getCommentCountForExpense(expenseId: number) {
  return prisma.comment.count({
    where: { expenseId },
  });
}
