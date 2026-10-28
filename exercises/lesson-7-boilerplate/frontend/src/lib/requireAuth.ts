import { redirect, type MiddlewareFunction } from "react-router";

import { getToken } from "./token";

/**
 * Refuses a navigation when nobody is logged in.
 *
 * This is **route middleware**: React Router runs it on the way *down* to a
 * route, before that route's loader and before its component renders. That
 * ordering is the whole reason it lives here rather than in a component — a
 * component guard runs after the loader has already fetched and been refused.
 *
 * `throw redirect(...)` abandons the navigation and starts a new one, the same
 * way `throw new Response(...)` abandoned one in lesson 5. Middleware on a
 * parent route covers every route nested under it.
 */
export const requireAuth: MiddlewareFunction = ({ request }) => {
  if (!getToken()) {
    // Remember where they were going, so login can send them back there.
    const from = new URL(request.url).pathname;
    throw redirect(`/login?from=${encodeURIComponent(from)}`);
  }
};
