import { createSchema } from "graphql-yoga";
import { GraphQLError } from "graphql";
import { ExpensesService } from "../services/expenses.service.ts";
import { UsersService } from "../services/users.service.ts";
import { CategoriesService } from "../services/categories.service.ts";
import { parseNewExpense, type Expense } from "../types/expense.ts";
import type { GraphQLContext } from "../types/GraphQLContext.ts";
import { requireAuth } from "./authHelpers.ts";
import { AuthorizationError, NotFoundError } from "../errors/app.error.ts";

/**
 * The whole API surface, declared once.
 *
 * Compare this with the REST side: there, every screen that needs a different
 * shape needs its own route and its own mapping. Here the schema says what
 * *can* be asked, and each client picks the fields it wants.
 */
export const schema = createSchema<GraphQLContext>({
  typeDefs: /* GraphQL */ `
    type User {
      id: Int!
      name: String!
      email: String!
      # Nullable on purpose: not every user has given us a bank account.
      bankAccount: String

      # The expenses this user paid for or took part in.
      # Reachable through "me", which is how a client asks for its own data.
      expenses(filter: ExpenseFilter): [Expense!]!
    }

    type Category {
      id: Int!
      name: String!
      colour: String!
    }

    type Expense {
      id: Int!
      description: String!
      amount: Float!
      date: String!
      payer: User!
      participants: [User!]!
      category: Category
    }

    input ExpenseFilter {
      amount: Float
      payerId: Int
      categoryId: Int
    }

    type Query {
      # The signed-in user. Every field below it is scoped to that person, which
      # is why the list screen asks for: me { expenses { ... } }
      me: User

      # EVERY expense in the system, belonging to anybody. The name says so.
      # A real product would put a permission behind this; deciding who may ask
      # it is beyond this lesson, so for now any signed-in user can.
      expenses(filter: ExpenseFilter): [Expense!]!

      expense(id: Int!): Expense
      users: [User!]!
      categories: [Category!]!
    }

    # One input type per mutation, named <MutationName>Input. Adding a field
    # later changes this block only, never the mutation's signature.
    input CreateExpenseInput {
      description: String!
      amount: Float!
      date: String!
      payerId: Int!
      participants: [Int!]!
      categoryId: Int
    }

    type Mutation {
      createExpense(input: CreateExpenseInput!): Expense!
    }
  `,
  resolvers: {
    Expense: {
      // Our business object carries a real Date. GraphQL's String scalar does
      // not know what to do with one, so we choose the wire format explicitly.
      date: (expense: Expense) => expense.date.toISOString(),
    },

    User: {
      // A field can carry its own permission check. `me` is not the only way to
      // reach a User — `expense.payer` is one too — so without this guard,
      // `{ expenses { payer { expenses { ... } } } }` would hand you everybody
      // else's expenses through the back door. The check lives on the field
      // because that is where the question "may you read this?" is asked.
      expenses: (user: { id: number }, args, ctx) => {
        const current = requireAuth(ctx);
        if (user.id !== current.userId) {
          throw new AuthorizationError("You can only read your own expenses");
        }
        return ExpensesService.getExpensesOfUser(user.id, args.filter ?? {});
      },
    },
    Query: {
      // `me` has no arguments and no database filter: everything it answers
      // comes out of the context. If this returns null while you are sending a
      // token, the problem is in the context function, not in a resolver.
      me: (_parent, _args, ctx) =>
        ctx.userJWT ? UsersService.getById(ctx.userJWT.userId) : null,

      expenses: (_parent, args, ctx) => {
        requireAuth(ctx);
        return ExpensesService.getExpenses(args.filter ?? {});
      },

      expense: async (_parent, args, ctx) => {
        const user = requireAuth(ctx);

        const expense = await ExpensesService.getExpenseById(args.id);
        if (!expense) {
          throw new NotFoundError("Expense not found");
        }

        // Knowing who you are is not the same as being allowed. This is the
        // second question, and it has to be asked per expense.
        const isInvolved =
          expense.payer?.id === user.userId ||
          expense.participants.some((participant) => participant.id === user.userId);

        if (!isInvolved) {
          // 403, not 404: we know who you are, and you may not have this one.
          // The alternative is to answer 404 and refuse to confirm the expense
          // exists at all — see the slide. Both are defensible; this one is
          // clearer to the person on the other end.
          throw new AuthorizationError("You don't have permission to view this expense");
        }

        return expense;
      },

      users: (_parent, _args, ctx) => {
        requireAuth(ctx);
        return UsersService.getUsers();
      },

      categories: (_parent, _args, ctx) => {
        requireAuth(ctx);
        return CategoriesService.getCategories();
      },
    },
    Mutation: {
      createExpense: (_parent, args, ctx) => {
        const user = requireAuth(ctx);

        // The browser sends `payerId`. The browser belongs to the user, so the
        // only thing that number proves is what they typed. The token is the
        // only claim here the server signed itself.
        if (user.userId !== args.input.payerId) {
          throw new AuthorizationError("You can only create expenses that you paid for");
        }

        // GraphQL checked the *shape* of the arguments: `date` is a String.
        // It did not check that the string is a date, that the amount is
        // positive, or that the description fits in 200 characters — those are
        // business rules, and they live in the same Zod schema the REST route
        // uses. Parsing here also turns `date` into a real Date, which is what
        // the service expects.
        const newExpense = parseNewExpense(args.input);
        if (newExpense === false) {
          throw new GraphQLError("Invalid expense");
        }
        return ExpensesService.addExpense(newExpense);
      },
    },
  },
});
