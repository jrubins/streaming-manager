import { createFileRoute } from '@tanstack/react-router';
import { watchlistQueryOptions } from '@/features/watchlist/queries';
import { WatchlistPage } from '@/pages/watchlist-page';

export const Route = createFileRoute('/watchlist')({
  loader: ({ context }) => context.queryClient.ensureQueryData(watchlistQueryOptions),
  component: WatchlistPage,
});
