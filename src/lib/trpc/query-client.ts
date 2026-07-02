import {
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryClient,
} from "@tanstack/react-query";
import superjson from "superjson";

export function makeQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    // Any successful mutation refreshes all active queries, so the UI stays
    // up to date without manual page refreshes.
    mutationCache: new MutationCache({
      onSuccess: () => {
        void queryClient.invalidateQueries();
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });

  return queryClient;
}
