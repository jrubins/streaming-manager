import {
  TitleSearchResultSchema,
  WatchlistShowSchema,
  type AddToWatchlist,
  type UpdateWatchlistShow,
} from '@app/shared';
import { queryOptions, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export const watchlistQueryOptions = queryOptions({
  queryKey: ['watchlist'],
  queryFn: () => apiRequest('/watchlist', WatchlistShowSchema.array()),
});

export const titleSearchQueryOptions = (q: string) =>
  queryOptions({
    queryKey: ['catalog', 'search', q],
    queryFn: () =>
      apiRequest(`/catalog/search?${new URLSearchParams({ q })}`, TitleSearchResultSchema.array()),
    enabled: q.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

/** The watchlist feeds the plan, so both refresh after a change. */
function invalidate(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: watchlistQueryOptions.queryKey }),
    queryClient.invalidateQueries({ queryKey: ['rotation'] }),
  ]);
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddToWatchlist) =>
      apiRequest('/watchlist', WatchlistShowSchema, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useUpdateWatchlistShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...changes }: UpdateWatchlistShow & { id: number }) =>
      apiRequest(`/watchlist/${id}`, WatchlistShowSchema, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      }),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiRequest(`/watchlist/${id}`, null, { method: 'DELETE' }),
    onSuccess: () => invalidate(queryClient),
  });
}
