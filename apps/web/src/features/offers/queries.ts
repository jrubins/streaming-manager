import { HouseholdMembershipsSchema, OffersSchema } from '@app/shared';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

/** Streaming perks of other memberships in the household's region. */
export const offersQueryOptions = queryOptions({
  queryKey: ['catalog', 'offers'],
  queryFn: () => apiRequest('/catalog/offers', OffersSchema),
  staleTime: 60 * 60 * 1000,
});

export const membershipsQueryOptions = queryOptions({
  queryKey: ['household', 'memberships'],
  queryFn: () => apiRequest('/household/memberships', HouseholdMembershipsSchema),
});

/** Memberships feed the plan (their perks), so both refresh after a change. */
export function useSetMemberships() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberships: string[]) =>
      apiRequest('/household/memberships', HouseholdMembershipsSchema, {
        method: 'PUT',
        body: JSON.stringify({ memberships }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(membershipsQueryOptions.queryKey, data);
      return queryClient.invalidateQueries({ queryKey: ['rotation'] });
    },
  });
}
