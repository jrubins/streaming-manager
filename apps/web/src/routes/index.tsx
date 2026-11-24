import { createFileRoute } from '@tanstack/react-router';
import { rotationQueryOptions } from '@/features/rotation/queries';
import { PlanPage } from '@/pages/plan-page';

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(rotationQueryOptions),
  component: PlanPage,
});
