import { ChannelCatalogSchema, HouseholdChannelsSchema } from '@app/shared';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

/** Live channels and league passes, with the services that carry each. */
export const channelCatalogQueryOptions = queryOptions({
  queryKey: ['catalog', 'channels'],
  queryFn: () => apiRequest('/catalog/channels', ChannelCatalogSchema),
  staleTime: 60 * 60 * 1000,
});

export const householdChannelsQueryOptions = queryOptions({
  queryKey: ['household', 'channels'],
  queryFn: () => apiRequest('/household/channels', HouseholdChannelsSchema),
});

/** Needed channels feed the plan, so it refreshes after a change. */
export function useSetChannels() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channels: string[]) =>
      apiRequest('/household/channels', HouseholdChannelsSchema, {
        method: 'PUT',
        body: JSON.stringify({ channels }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(householdChannelsQueryOptions.queryKey, data);
      return queryClient.invalidateQueries({ queryKey: ['rotation'] });
    },
  });
}
