import { createFileRoute } from '@tanstack/react-router';
import { householdQueryOptions } from '@/features/household/queries';
import { HouseholdPage } from '@/pages/household-page';

export const Route = createFileRoute('/household')({
  loader: ({ context }) => context.queryClient.ensureQueryData(householdQueryOptions),
  component: HouseholdPage,
});
