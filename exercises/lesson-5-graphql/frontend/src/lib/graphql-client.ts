import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

const API_HOST = import.meta.env.VITE_GRAPHQL_URL;

const client = new ApolloClient({
  link: new HttpLink({ uri: API_HOST }),
  cache: new InMemoryCache(),
});

export default client;
