import { createFileRoute } from '@tanstack/react-router';
import { itemsQueryOptions } from '@/features/items/queries';
import { ItemsPage } from '@/pages/items-page';

export const Route = createFileRoute('/items')({
  // Starts fetching before the page renders (and on link hover, via preloading).
  loader: ({ context }) => context.queryClient.ensureQueryData(itemsQueryOptions),
  component: ItemsPage,
});
