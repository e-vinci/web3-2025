import { ApolloClient, HttpLink, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const API_HOST = import.meta.env.VITE_GRAPHQL_URL;
const TOKEN_KEY = 'auth_token';

// HTTP connection to the API
const httpLink = new HttpLink({
  uri: API_HOST,
});

// Middleware to add auth token to requests
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(TOKEN_KEY);

  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
    },
  };
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      console.error(`[GraphQL error]: Message: ${message}, Code: ${extensions?.code}`);

      // Handle authentication errors
      if (extensions?.code === 'UNAUTHENTICATED') {
        // Clear token and redirect to login
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
