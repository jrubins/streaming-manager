import { HealthSchema, ItemSchema, type CreateItem } from '@app/shared';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export const healthQueryOptions = queryOptions({
  queryKey: ['health'],
  queryFn: () => apiRequest('/health', HealthSchema),
  retry: false,
});

export const itemsQueryOptions = queryOptions({
  queryKey: ['items'],
  queryFn: () => apiRequest('/items', ItemSchema.array()),
});

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItem) =>
      apiRequest('/items', ItemSchema, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsQueryOptions.queryKey }),
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiRequest(`/items/${id}`, null, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsQueryOptions.queryKey }),
  });
}
