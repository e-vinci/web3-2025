import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { unwrapResolverError } from '@apollo/server/errors';
import { AppError } from '@/errors/appErrors';

export function formatError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
  // Log error for debugging (in production, use proper logging service)
  console.error('GraphQL Error:', error);

  if (!(error instanceof GraphQLError)) {
    return formattedError;
  }

  // Extract original error
  const originalError = unwrapResolverError(error) as Error;

  // Handle our custom AppErrors
  if (originalError instanceof AppError) {
    return {
      message: originalError.message,
      extensions: {
        code: originalError.code,
        statusCode: originalError.statusCode,
      },
      locations: error.locations,
      path: error.path,
    };
  }

  // Handle Prisma errors
  if (originalError?.name === 'PrismaClientKnownRequestError') {
    const prismaError = originalError as any;

    if (prismaError.code === 'P2002') {
      return {
        message: 'A record with this unique field already exists',
        extensions: { code: 'CONFLICT', statusCode: 409 },
      };
    }

    if (prismaError.code === 'P2025') {
      return {
        message: 'Record not found',
        extensions: { code: 'NOT_FOUND', statusCode: 404 },
      };
    }
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'An unexpected error occurred',
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    };
  }

  // In development, return full error details
  return {
    message: error.message,
    extensions: {
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
    locations: error.locations,
    path: error.path,
  };
}