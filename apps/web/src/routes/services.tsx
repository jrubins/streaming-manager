import { createFileRoute } from '@tanstack/react-router';
import { servicesQueryOptions } from '@/features/services/queries';
import { ServicesPage } from '@/pages/services-page';

export const Route = createFileRoute('/services')({
  loader: ({ context }) => context.queryClient.ensureQueryData(servicesQueryOptions),
  component: ServicesPage,
});
