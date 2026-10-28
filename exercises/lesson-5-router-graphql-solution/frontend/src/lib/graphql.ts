const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Sends a GraphQL request.
 *
 * A GraphQL call is nothing more than an HTTP POST whose JSON body is
 * `{ query, variables }`. That is the whole protocol, which is why we do not
 * need a client library here: React Router's loaders already decide when to
 * fetch and what to do with the result.
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const { data, errors } = await response.json();

  if (errors?.length) {
    // GraphQL answers 200 OK even when it failed, so the errors array — not the
    // HTTP status — is what tells us something went wrong.
    throw new Response(errors[0].message, { status: 500 });
  }

  return data as T;
}
