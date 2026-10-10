import type { LoaderFunctionArgs } from "react-router";
import type { Expense } from "../../types/Expense";
import { graphqlRequest } from "../../lib/graphql";

/**
 * The same `expense` data as the list, asking for much more.
 * Adding `bankAccount` here cost zero lines of backend code: it was already in
 * the schema, it was simply never requested.
 */
const EXPENSE_QUERY = /* GraphQL */ `
  query Expense($id: Int!) {
    expense(id: $id) {
      id
      description
      amount
      date
      payer {
        id
        name
        email
        bankAccount
      }
      participants {
        id
        name
        email
      }
      category {
        name
        colour
      }
    }
  }
`;

export async function expenseShowLoader({ params }: LoaderFunctionArgs): Promise<Expense> {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    throw new Response("Invalid expense id", { status: 400 });
  }

  const data = await graphqlRequest<{ expense: Expense | null }>(EXPENSE_QUERY, { id });

  if (!data.expense) {
    throw new Response("Expense not found", { status: 404 });
  }
  return data.expense;
}
