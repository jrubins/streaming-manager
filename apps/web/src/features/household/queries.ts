import {
  HouseholdSchema,
  RegionSchema,
  type JoinHousehold,
  type UpdateHousehold,
} from '@app/shared';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export const householdQueryOptions = queryOptions({
  queryKey: ['household'],
  queryFn: () => apiRequest('/household', HouseholdSchema),
});

export const regionsQueryOptions = queryOptions({
  queryKey: ['catalog', 'regions'],
  queryFn: () => apiRequest('/catalog/regions', RegionSchema.array()),
  staleTime: 24 * 60 * 60 * 1000,
});

/** After the household itself changes, everything it owns may have changed too. */
function useHouseholdMutation<T>(request: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useUpdateHousehold() {
  return useHouseholdMutation((input: UpdateHousehold) =>
    apiRequest('/household', HouseholdSchema, { method: 'PATCH', body: JSON.stringify(input) }),
  );
}

export function useJoinHousehold() {
  return useHouseholdMutation((input: JoinHousehold) =>
    apiRequest('/household/join', HouseholdSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}

export function useLeaveHousehold() {
  return useHouseholdMutation(() =>
    apiRequest('/household/leave', HouseholdSchema, { method: 'POST' }),
  );
}

export function useNewInviteCode() {
  return useHouseholdMutation(() =>
    apiRequest('/household/invite-code', HouseholdSchema, { method: 'POST' }),
  );
}
