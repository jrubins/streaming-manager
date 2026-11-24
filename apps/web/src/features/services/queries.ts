import { CatalogProviderSchema, ServiceSchema, type UpdateService } from '@app/shared';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...changes }: UpdateService & { id: number }) =>
      apiRequest(`/services/${id}`, ServiceSchema, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: servicesQueryOptions.queryKey }),
        queryClient.invalidateQueries({ queryKey: ['rotation'] }),
      ]);
    },
  });
}
