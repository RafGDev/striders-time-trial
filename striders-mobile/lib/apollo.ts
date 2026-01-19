import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { useAuthStore } from "@/stores/auth-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const httpLink = createHttpLink({
  uri: `${API_URL}/graphql`,
});

// Auth link - adds token to every request
const authLink = setContext(async (_, { headers }) => {
  const token = await useAuthStore.getState().getValidToken();

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Error link - handles auth errors and triggers token refresh
const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      const message = err.message.toLowerCase();
      if (
        message.includes("unauthorized") ||
        message.includes("jwt expired") ||
        message.includes("invalid token")
      ) {
        // Token might be expired, try to refresh and retry
        return forward(operation);
      }
    }
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
    },
  },
});
