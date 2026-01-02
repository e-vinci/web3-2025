import {
  ApolloClient,
  ApolloLink,
  CombinedGraphQLErrors,
  CombinedProtocolErrors,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';

const API_HOST = import.meta.env.VITE_GRAPHQL_URL;
const TOKEN_KEY = 'auth_token';

// HTTP connection to the API
const httpLink = new HttpLink({
  uri: API_HOST,
});

// Middleware to add auth token to requests
const authLink = new SetContextLink(({ headers }) => {
  const token = localStorage.getItem(TOKEN_KEY);

  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
    },
  };
});

// Error handling link
const errorLink = new ErrorLink(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message, extensions, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Code: ${extensions?.code}, Path: ${path}`
      );

      // Handle authentication errors
      if (extensions?.code === 'UNAUTHENTICATED') {
        // Clear token and redirect to login
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
    });
  } else if (CombinedProtocolErrors.is(error)) {
    error.errors.forEach(({ message, extensions }) =>
      console.log(`[Protocol error]: Message: ${message}, Extensions: ${JSON.stringify(extensions)}`)
    );
  } else {
    console.error(`[Network error]: ${error}`);
  }
});

const client = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
