import { QueryClient } from "@tanstack/react-query"

/**
 * App-wide TanStack Query client. Sets the defaults consumer apps will want:
 * a short stale window (data considered fresh for 30s), one retry on failure,
 * and no refetch on window focus (noisy against a mock backend).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
