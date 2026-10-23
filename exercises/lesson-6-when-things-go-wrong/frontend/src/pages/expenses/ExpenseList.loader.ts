import { redirect, type LoaderFunctionArgs } from "react-router";
import type { ExpenseListItem } from "../../types/Expense";
import { graphqlRequest } from "../../lib/graphql";
import { clearToken } from "../../lib/token";

/**
 * Exactly the fields the list screen renders — nothing more.
 *
 * Note the shape: we ask through `me`, not through the top-level `expenses`.
 * `expenses` means *every* expense in the system; `me { expenses }` means the
 * ones this user is involved in. The page is titled "Your expenses", so `me` is
 * the query that matches it.
 */
const MY_EXPENSES_QUERY = /* GraphQL */ `
  query MyExpenses($filter: ExpenseFilter) {
    me {
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

  const data = await graphqlRequest<{ me: { expenses: ExpenseListItem[] } | null }>(
    MY_EXPENSES_QUERY,
    { filter }
  );

  // `me` answers null for an anonymous caller — and a caller whose token no
  // longer verifies *is* anonymous, as far as the server is concerned. The
  // route middleware only checked that a token existed; this is where we learn
  // it was not a good one.
  if (!data.me) {
    clearToken();
    throw redirect("/login");
  }

  return data.me.expenses;
}
