const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Our REST API client: the single place in the frontend that knows how to talk
 * to the backend over HTTP.
 *
 * It owns three decisions so that no caller has to repeat them:
 *   - where the API lives (`API_BASE_URL`)
 *   - that a non-2xx response is a failure, not data
 *   - that a successful response is JSON
 *
 * Having one function in the middle is what makes it cheap to add things later
 * that every request needs: an auth header, a request id for tracing, a retry,
 * a timeout, logging. Without it, you would be editing every `fetch` call.
 */
export async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    // `Response` is a web standard, not a React Router type — which is why this
    // file imports nothing from react-router and would work in a Node script.
    throw new Response(`Request to ${path} failed`, { status: response.status });
  }

  return response.json() as Promise<T>;
}
