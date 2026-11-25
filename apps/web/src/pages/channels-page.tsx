import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/page-header';
import { ChannelPicker } from '@/features/channels/channel-picker';
import {
  channelCatalogQueryOptions,
  householdChannelsQueryOptions,
  useSetChannels,
} from '@/features/channels/queries';

export function ChannelsPage() {
  const { data: catalog } = useSuspenseQuery(channelCatalogQueryOptions);
  const { data: household } = useSuspenseQuery(householdChannelsQueryOptions);
  const setChannels = useSetChannels();
  const selected = new Set(household.channels);

  return (
    <>
      <PageHeader
        title="Channels"
        description="Live channels and league passes your household watches. The plan covers each with the cheapest live TV service that carries it."
      />
      {catalog.channels.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          Channel lineups aren't known in your region yet.
        </p>
      ) : (
        <>
          <p className="mb-6 text-sm text-muted-foreground" role="status">
            {selected.size === 0
              ? 'No channels yet. Pick the ones you watch, or start from the usual set.'
              : `${selected.size} ${selected.size === 1 ? 'channel' : 'channels'} needed. `}
            {selected.size > 0 ? (
              <Link to="/" className="font-medium text-primary hover:underline">
                See the plan
              </Link>
            ) : null}
          </p>
          <ChannelPicker
            channels={catalog.channels}
            selected={selected}
            pending={setChannels.isPending}
            onChange={(channels) => setChannels.mutate(channels)}
          />
          <p className="mt-6 max-w-3xl text-xs text-muted-foreground">
            Lineups as of {catalog.asOf}. Local channels depend on your ZIP code; check yours on{' '}
            {catalog.lookups.map((lookup, index) => (
              <span key={lookup.name}>
                {index > 0 ? (index === catalog.lookups.length - 1 ? ' or ' : ', ') : null}
                <a
                  href={lookup.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {lookup.name}
                </a>
              </span>
            ))}
            .
          </p>
        </>
      )}
    </>
  );
}
