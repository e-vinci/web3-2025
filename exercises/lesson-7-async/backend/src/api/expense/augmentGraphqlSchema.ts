import { Expense } from "@/generated/prisma/client";
import SchemaBuilder from "@/graphql/builder";
import { requireAuth } from "@/graphql/authHelpers";
import { GraphQLError } from "graphql";
import * as expenseRepository from "./expenseRepository";
import { emitExpenseCreated } from "@/socket/events";

const augmentSchema = (builder: typeof SchemaBuilder) => {
  const ExpenseRef = builder.prismaObject("Expense", {
    fields: (t) => ({
      id: t.exposeID("id"),
      description: t.exposeString("description"),
      amount: t.exposeFloat("amount"),
      date: t.string({
        resolve: (parent: Expense) => parent.date.toISOString(),
      }),
      payer: t.relation("payer"),
      participants: t.relation("participants"),
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
          const user = requireAuth(ctx);
          const expense = await expenseRepository.getExpenseById(
            args.id as number
          );
          if (!expense) {
            throw new GraphQLError("Expense not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }
          // Check if user is involved in this expense (as payer or participant)
          const isInvolved =
            expense.payer.id === user.userId ||
            expense.participants.some((p) => p.id === user.userId);

          if (!isInvolved) {
            throw new GraphQLError(
              "You don't have permission to view this expense",
              {
                extensions: { code: "FORBIDDEN" },
              }
            );
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
          date: t.arg({ type: "String", required: true }),
          payerId: t.arg.int({ required: true }),
          participantIds: t.arg({ type: ["Int"], required: true }),
        },
        resolve: async (_parent, args, ctx, _info) => {
          const user = requireAuth(ctx);

          // User can only create expenses where they are the payer
          if (user.userId !== args.payerId) {
            throw new GraphQLError(
              "You can only create expenses that you paid for",
              {
                extensions: { code: "FORBIDDEN" },
              }
            );
          }

          const { description, amount, date, payerId, participantIds } = args;
          const parsedDate = new Date(date);
          const expense = await expenseRepository.createExpense({
            description,
            amount,
            date: parsedDate,
            payerId,
            participantIds,
          });
          emitExpenseCreated({
            expenseId: expense.id,
            description: expense.description,
            amount: expense.amount,
            payerId: payerId,
            payerName: payerId.toString(),
            participantIds: participantIds,
          });

          return expense;
        },
      }),
    }),
  });
};

export default augmentSchema;
