import { createFileRoute } from '@tanstack/react-router';
import { preferencesQueryOptions } from '@/features/preferences/queries';
import { PreferencesPage } from '@/pages/preferences-page';

export const Route = createFileRoute('/preferences')({
  loader: ({ context }) => context.queryClient.ensureQueryData(preferencesQueryOptions),
  component: PreferencesPage,
});
