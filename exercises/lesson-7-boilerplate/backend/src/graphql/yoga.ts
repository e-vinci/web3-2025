import { createYoga } from 'graphql-yoga';

import { schema } from './schema.ts';
import { maskError } from './errorFormatter.ts';
import { AuthService } from '../services/auth.service.ts';
import type { GraphQLContext } from '../types/GraphQLContext.ts';

/**
 * Turns one incoming request into the context its resolvers will see.
 *
 * This is the border of the application. Above it a token is an untrusted
 * string a stranger sent us; below it `ctx.userJWT` is a claim the server
 * signed itself. There is exactly one place where that changes, and this is it.
 */
function graphQLContextFromRequest(request: Request): GraphQLContext {
  // Yoga speaks the Web `Request` API, so headers are read with
  // `request.headers.get(...)` — not Node's `req.headers` object.
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

  if (!token) {
    return {};
  }

  try {
    return { userJWT: AuthService.verifyToken(token) };
  } catch {
    // A bad or expired token is not a crash. The request carries on as
    // anonymous, and the resolvers refuse it a moment later.
    return {};
  }
}

/**
 * The GraphQL server, configured once.
 *
 * It lives in its own file for the same reason the routers do: `app.ts` should
 * read as a list of what this server exposes, not as the settings of any one
 * part of it.
 */
export const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',

  // Yoga ships its own CORS handling, separate from the `cors()` middleware in
  // app.ts — and its default reflects back whatever Origin it is sent. Turn it
  // off so /graphql respects the same allowlist as the REST routes.
  cors: false,

  // By default Yoga replaces every resolver error with "Unexpected error." so a
  // production server never leaks internals. We keep that, but teach it to let
  // our own deliberate errors through with their code intact.
  maskedErrors: {
    maskError,
    isDev: process.env.NODE_ENV !== 'production',
  },

  context: ({ request }): GraphQLContext => graphQLContextFromRequest(request),
});
