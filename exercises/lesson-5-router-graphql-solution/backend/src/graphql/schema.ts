import { createSchema } from "graphql-yoga";
import { GraphQLError } from "graphql";
import { ExpensesService } from "../services/expenses.service.ts";
import { UsersService } from "../services/users.service.ts";
import { CategoriesService } from "../services/categories.service.ts";
import { parseNewExpense, type Expense } from "../types/expense.ts";

/**
 * The whole API surface, declared once.
 *
 * Compare this with the REST side: there, every screen that needs a different
 * shape needs its own route and its own mapping. Here the schema says what
 * *can* be asked, and each client picks the fields it wants.
 */
export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type User {
      id: Int!
      name: String!
      email: String!
      # Nullable on purpose: not every user has given us a bank account.
      bankAccount: String
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
    Query: {
      expenses: (_parent, args) => ExpensesService.getExpenses(args.filter ?? {}),
      expense: (_parent, args) => ExpensesService.getExpenseById(args.id),
      users: () => UsersService.getUsers(),
      categories: () => CategoriesService.getCategories(),
    },
    Mutation: {
      createExpense: (_parent, args) => {
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
