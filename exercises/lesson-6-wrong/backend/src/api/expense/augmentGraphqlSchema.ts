import type SchemaBuilder from "../../graphql/builder";
import * as expenseRepository from "./expenseRepository";

const augmentSchema = (builder: typeof SchemaBuilder) => {
  // Define Expense type
  const ExpenseRef = builder.prismaObject('Expense', {
    fields: (t) => ({
      id: t.exposeID('id'),
      description: t.exposeString('description'),
      amount: t.exposeFloat('amount'),
      date: t.expose('date', { type: 'DateTime' }),
      payer: t.relation('payer'),
      participants: t.relation('participants')
    }),
  });

  // Add query for getting expense by id
  builder.queryType({
    fields: (t) => ({
      expense: t.field({
        type: ExpenseRef,
        args: {
          id: t.arg.int({ required: true })
        },
        resolve: async (_root, args, _ctx, _info) => {
          return expenseRepository.getExpenseById(args.id as number)
        }
      }),
    }),
  });

  // Add mutation for creating expense
  builder.mutationType({
    fields: (t) => ({
      createExpense: t.field({
        type: ExpenseRef,
        args: {
          description: t.arg.string({ required: true }),
          amount: t.arg.float({ required: true }),
          date: t.arg({ type: 'DateTime', required: true }),
          payerId: t.arg.int({ required: true }),
          participantIds: t.arg({ type: ['Int'], required: true }),
        },
        resolve: async (_parent, args, _context, _info) => {
          const { description, amount, date, payerId, participantIds } = args;
          return expenseRepository.createExpense({ description, amount, date, payerId, participantIds })
        }
      }),
    }),
  });
}

export default augmentSchema;
