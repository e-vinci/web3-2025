import { GraphQLError } from 'graphql';
import { AppError } from '../errors/app.error.ts';

/**
 * Decides what a thrown error looks like by the time it reaches the client.
 *
 * Yoga masks every resolver error by default, so a production server never
 * leaks a stack trace or a database message. That default is right, and it is
 * also why an `AppError` would otherwise arrive as "Unexpected error." — the
 * masking cannot tell a deliberate 403 from an accidental crash.
 *
 * So we tell it: an AppError is a message we *chose*, and it keeps its own
 * `code`. Anything else is a bug, and a bug says nothing in production.
 */
export function maskError(error: unknown, message: string, isDev?: boolean): Error {
  // Yoga wraps a thrown value in a GraphQLError; the thing we threw is on
  // `originalError`. On a plain throw there is no wrapper, hence the `?? error`.
  const originalError = (error as { originalError?: unknown })?.originalError ?? error;

  if (originalError instanceof AppError) {
    return new GraphQLError(originalError.message, {
      extensions: {
        code: originalError.code,
        statusCode: originalError.statusCode,
      },
    });
  }

  if (isDev) {
    return error as Error;
  }

  return new Error(message);
}
