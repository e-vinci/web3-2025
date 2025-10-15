import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '@/types/GraphQLContext';
import { AuthenticationError, AuthorizationError } from '@/errors/AppError';

export function requireAuth(context: GraphQLContext): { userId: number; email: string } {
  if (!context.user) {
    throw new AuthenticationError('You must be logged in to perform this action');
  }
  return context.user;
}

export function requireOwnership(userId: number, resourceOwnerId: number, resourceName: string = 'resource'): void {
  if (userId !== resourceOwnerId) {
    throw new AuthorizationError(`You don't have permission to access this ${resourceName}`);
  }
}
