import { Expense, Share } from '@/generated/prisma/client';
import SchemaBuilder from '@/graphql/builder';
import { GraphQLError } from 'graphql';
import * as expenseRepository from './expenseRepository';

const augmentSchema = (builder: typeof SchemaBuilder) => {
  const ShareRef = builder.objectRef<Share>('Share').implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      mode: t.exposeString('mode'),
      value: t.exposeFloat('value'),
      participantId: t.int({
        resolve: (share) => share.participantId ?? 0,
      }),
      memo: t.exposeString('memo', { nullable: true }),
    }),
  });

  const ExpenseRef = builder.prismaObject('Expense', {
    fields: (t) => ({
      id: t.exposeID('id'),
      description: t.exposeString('description'),
      amount: t.exposeFloat('amount'),
      date: t.string({
        resolve: (parent: Expense) => parent.date.toISOString(),
      }),
      payer: t.relation('payer'),
      participants: t.relation('participants'),
      shares: t.relation('shares'),
    }),
  });

  builder.queryType({
    fields: (t) => ({
      expense: t.field({
        type: ExpenseRef,
        args: {
          id: t.arg.int({ required: true }),
        },
        resolve: async (_root, args, ctx, _info) => {
          const expense = await expenseRepository.getExpenseById(args.id as number);
          if (!expense) {
            throw new GraphQLError('Expense not found', {
              extensions: { code: 'NOT_FOUND' },
            });
          }

          return expense;
        },
      }),
    }),
  });

  builder.mutationType({
    fields: (t) => ({
      createExpense: t.field({
        type: ExpenseRef,
        args: {
          description: t.arg.string({ required: true }),
          amount: t.arg.float({ required: true }),
          date: t.arg({ type: 'String', required: true }),
          payerId: t.arg.int({ required: true }),
          participantIds: t.arg({ type: ['Int'], required: true }),
          sharePayload: t.arg({ type: ['String'], required: false }),
        },
        resolve: async (_parent, args, ctx, _info) => {
          const { description, amount, date, payerId, participantIds } = args;
          const parsedDate = new Date(date);
          const shares = args.sharePayload?.map((encoded) => {
            const [userId, mode, value] = encoded.split(':');
            return {
              participantId: Number(userId),
              mode: mode ?? 'percentage',
              value: Number(value ?? amount),
            };
          });
          return expenseRepository.createExpense({
            description,
            amount,
            date: parsedDate,
            payerId,
            participantIds,
            shares,
          });
        },
      }),
    }),
  });
};

export default augmentSchema;
