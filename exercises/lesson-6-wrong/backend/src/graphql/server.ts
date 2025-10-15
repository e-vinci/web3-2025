import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import schema from './schema';
import { verifyToken } from '@/api/auth/authService';
import { GraphQLContext } from '@/types/GraphQLContext';
import { formatError } from './errorFormatter';

const server = new ApolloServer({ schema: schema, formatError });
await server.start();

const graphqlMiddleware = expressMiddleware(server, {
  context: async ({ req }): Promise<GraphQLContext> => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    // Verify token and add user to context
    if (token) {
      try {
        const user = verifyToken(token);
        return { user };
      } catch (error) {
        // Invalid token - continue with empty context
        return {};
      }
    }

    return {};
  },
});

export default graphqlMiddleware;
