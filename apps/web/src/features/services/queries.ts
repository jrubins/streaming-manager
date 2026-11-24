import {
  CatalogProviderSchema,
  ServiceSchema,
  type CreateService,
  type UpdateService,
} from '@app/shared';
import { queryOptions, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export const servicesQueryOptions = queryOptions({
  queryKey: ['services'],
  queryFn: () => apiRequest('/services', ServiceSchema.array()),
});

/** Streaming services available in the household's region. */
export const providersQueryOptions = queryOptions({
  queryKey: ['catalog', 'providers'],
  queryFn: () => apiRequest('/catalog/providers', CatalogProviderSchema.array()),
  staleTime: 60 * 60 * 1000,
});

/** Services feed the plan, so both refresh after a change. */
function invalidate(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: servicesQueryOptions.queryKey }),
    queryClient.invalidateQueries({ queryKey: ['rotation'] }),
  ]);
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateService) =>
      apiRequest('/services', ServiceSchema, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...changes }: UpdateService & { id: number }) =>
      apiRequest(`/services/${id}`, ServiceSchema, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      }),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiRequest(`/services/${id}`, null, { method: 'DELETE' }),
    onSuccess: () => invalidate(queryClient),
  });
}
