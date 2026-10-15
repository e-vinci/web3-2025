import type { LoaderFunctionArgs } from "react-router";
import type { ExpenseListItem } from "../../types/Expense";
import { graphqlRequest } from "../../lib/graphql";

/**
 * Exactly the fields the list screen renders — nothing more.
 * Compare with ExpenseShow.loader.ts: same schema, different selection.
 */
const EXPENSES_QUERY = /* GraphQL */ `
  query Expenses($filter: ExpenseFilter) {
    expenses(filter: $filter) {
      id
      description
      amount
      date
      payer {
        name
      }
      category {
        name
        colour
      }
    }
  }
`;

export async function expenseListLoader({ request }: LoaderFunctionArgs): Promise<ExpenseListItem[]> {
  const params = new URL(request.url).searchParams;

  // The filter lives in the URL, so the loader re-runs on every filter change
  // and the user gets a bookmarkable, shareable, back-button-able list.
  const filter = {
    amount: params.get("amount") ? Number(params.get("amount")) : undefined,
    payerId: params.get("payerId") ? Number(params.get("payerId")) : undefined,
    categoryId: params.get("categoryId") ? Number(params.get("categoryId")) : undefined,
  };

  const data = await graphqlRequest<{ expenses: ExpenseListItem[] }>(EXPENSES_QUERY, { filter });
  return data.expenses;
}
