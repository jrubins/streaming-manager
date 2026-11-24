import { PreferencesSchema, type UpdatePreferences } from '@app/shared';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export const preferencesQueryOptions = queryOptions({
  queryKey: ['preferences'],
  queryFn: () => apiRequest('/household/preferences', PreferencesSchema),
});

/** Preferences decide the plan, so both refresh after a change. */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: UpdatePreferences) =>
      apiRequest('/household/preferences', PreferencesSchema, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      }),
    onSuccess: async (preferences) => {
      queryClient.setQueryData(preferencesQueryOptions.queryKey, preferences);
      await queryClient.invalidateQueries({ queryKey: ['rotation'] });
    },
  });
}
