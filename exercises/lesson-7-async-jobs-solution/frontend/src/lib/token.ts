/**
 * Where the token lives, and the only name anybody uses for it.
 *
 * This is a two-line module for one reason: `lib/` must not import from
 * `contexts/`. The API clients need the token, but they are plain TypeScript
 * with no React in them, and keeping it that way is what lets them be used
 * from a loader, a test, or a Node script.
 */
const TOKEN_KEY = "auth_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
