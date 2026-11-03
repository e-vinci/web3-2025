import { AuthenticationError, AuthorizationError } from '../errors/app.error.ts';
import type { UserJWT } from '../types/auth.ts';
import type { GraphQLContext } from '../types/GraphQLContext.ts';

/**
 * "Who is calling?" — and refuse the request if the answer is "nobody".
 *
 * Returning the claims rather than a boolean is deliberate: the caller almost
 * always needs the id straight afterwards, and this way it cannot forget to
 * check first.
 */
export function requireAuth(context: GraphQLContext): UserJWT {
  if (!context.userJWT) {
    throw new AuthenticationError('You must be logged in to perform this action');
  }
  return context.userJWT;
}

/** "May you act on this thing?" — the other half, and a different question. */
export function requireOwnership(userId: number, resourceOwnerId: number, resourceName = 'resource'): void {
  if (userId !== resourceOwnerId) {
    throw new AuthorizationError(`You don't have permission to access this ${resourceName}`);
  }
}
