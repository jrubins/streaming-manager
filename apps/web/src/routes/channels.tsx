import { createFileRoute } from '@tanstack/react-router';
import {
  channelCatalogQueryOptions,
  householdChannelsQueryOptions,
} from '@/features/channels/queries';
import { ChannelsPage } from '@/pages/channels-page';

export const Route = createFileRoute('/channels')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(channelCatalogQueryOptions),
      context.queryClient.ensureQueryData(householdChannelsQueryOptions),
    ]),
  component: ChannelsPage,
});
