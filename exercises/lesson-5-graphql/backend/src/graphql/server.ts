import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import schema from './schema';

const server = new ApolloServer({ schema: schema });
await server.start();

const graphqlMiddleware = expressMiddleware(server);

export default graphqlMiddleware;
