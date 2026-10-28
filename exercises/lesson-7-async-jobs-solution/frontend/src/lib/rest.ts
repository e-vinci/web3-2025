import { getToken } from "./token";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Our REST API client: the single place in the frontend that knows how to talk
 * to the backend over HTTP.
 *
 * Lesson 5 said this file was "where you will later add an Authorization
 * header". This is later. Adding it here means every caller got it, and not
 * one of them had to be told.
 */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // Only when there is one. A header reading "Bearer null" is worse than no
      // header at all: the server will try to verify it and fail.
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    // `Response` is a web standard, not a React Router type — which is why this
    // file imports nothing from react-router and would work in a Node script.
    throw new Response(`Request to ${path} failed`, { status: response.status });
  }

  return response.json() as Promise<T>;
}
