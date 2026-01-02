import { Comment } from '@/generated/prisma/client';
import SchemaBuilder from '@/graphql/builder';
import { requireAuth } from '@/graphql/authHelpers';
import { GraphQLError } from 'graphql';
import * as commentRepository from './commentRepository';
import * as expenseRepository from '../expense/expenseRepository';

const augmentSchema = (builder: typeof SchemaBuilder) => {
  const CommentRef = builder.prismaObject('Comment', {
    fields: (t) => ({
      id: t.exposeID('id'),
      content: t.exposeString('content'),
      createdAt: t.string({
        resolve: (parent: Comment) => parent.createdAt.toISOString(),
      }),
      updatedAt: t.string({
        resolve: (parent: Comment) => parent.updatedAt.toISOString(),
      }),
      author: t.relation('author'),
      expense: t.relation('expense'),
    }),
  });

  builder.queryType({
    fields: (t) => ({
      comments: t.field({
        type: [CommentRef],
        resolve: async (_root, _args, ctx, _info) => {
          requireAuth(ctx);
          return commentRepository.getAllComments();
        },
      }),

      commentsByExpense: t.field({
        type: [CommentRef],
        args: {
          expenseId: t.arg.int({ required: true }),
        },
        resolve: async (_root, args, ctx, _info) => {
          const user = requireAuth(ctx);
          const expense = await expenseRepository.getExpenseById(args.expenseId as number);
          if (!expense) {
            throw new GraphQLError('Expense not found', {
              extensions: { code: 'NOT_FOUND' },
            });
          }
          return commentRepository.getCommentsByExpenseId(args.expenseId as number);
        },
      }),
    }),
  });

  builder.mutationType({
    fields: (t) => ({
      createComment: t.field({
        type: CommentRef,
        args: {
          content: t.arg.string({ required: true }),
          expenseId: t.arg.int({ required: true }),
        },
        resolve: async (_root, args, ctx, _info) => {
          const user = requireAuth(ctx);

          return commentRepository.createComment({
            content: args.content,
            authorId: user.userId,
            expenseId: args.expenseId as number,
          });
        },
      }),

      updateComment: t.field({
        type: CommentRef,
        args: {
          id: t.arg.int({ required: true }),
          content: t.arg.string({ required: true }),
        },
        resolve: async (_root, args, ctx, _info) => {
          const user = requireAuth(ctx);

          const comment = await commentRepository.getCommentById(args.id as number);
          if (!comment) {
            throw new GraphQLError('Comment not found', {
              extensions: { code: 'NOT_FOUND' },
            });
          }

          return commentRepository.updateComment({
            id: args.id as number,
            content: args.content,
          });
        },
      }),

      deleteComment: t.field({
        type: 'Boolean',
        args: {
          id: t.arg.int({ required: true }),
        },
        resolve: async (_root, args, ctx, _info) => {
          requireAuth(ctx);
          commentRepository.deleteComment(args.id as number);

          return true;
        },
      }),
    }),
  });
};

export default augmentSchema;
