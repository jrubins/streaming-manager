import type { CatalogProvider, WatchlistShow } from '@app/shared';
import { cn } from 'cn';
import { Check, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Poster } from '@/features/rotation/poster-strip';
import { formatList } from '@/lib/format';

interface WatchlistCardProps {
  show: WatchlistShow;
  /** Providers by key, for logos and names. */
  providers: ReadonlyMap<string, Pick<CatalogProvider, 'name' | 'logoUrl'>>;
  /** Provider keys the household has (active or paused). */
  householdKeys: ReadonlySet<string>;
  onToggleWatched: () => void;
  onRemove: () => void;
  pending?: boolean;
}

/** A title on the watchlist: its poster, where it streams, and its actions. */
export function WatchlistCard({
  show,
  providers,
  householdKeys,
  onToggleWatched,
  onRemove,
  pending = false,
}: WatchlistCardProps) {
  const names = show.providerKeys.map((key) => providers.get(key)?.name ?? key);
  const ours = show.providerKeys.filter((key) => householdKeys.has(key));
  return (
    <article aria-label={show.title} className="group flex flex-col">
      <div className="relative">
        <Poster show={show} className={cn('rounded-xl', show.watched && 'opacity-50 grayscale')} />
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="secondary"
            size="icon-sm"
            className="rounded-full bg-background/85 shadow-sm backdrop-blur hover:bg-background"
            disabled={pending}
            onClick={onToggleWatched}
            aria-label={
              show.watched ? `Mark ${show.title} unwatched` : `Mark ${show.title} watched`
            }
            title={show.watched ? 'Mark unwatched' : 'Mark watched'}
          >
            {show.watched ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            className="rounded-full bg-background/85 shadow-sm backdrop-blur hover:bg-background"
            disabled={pending}
            onClick={onRemove}
            aria-label={`Remove ${show.title}`}
            title="Remove"
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
        {show.watched ? (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold">
            <Check className="size-3" aria-hidden /> Watched
          </span>
        ) : null}
        {show.providerKeys.length > 0 ? (
          <ul
            aria-label="Streams on"
            className="absolute right-2 bottom-2 left-2 flex flex-wrap gap-1"
          >
            {show.providerKeys.slice(0, 4).map((key) => {
              const provider = providers.get(key);
              return (
                <li key={key} title={provider?.name ?? key}>
                  {provider?.logoUrl ? (
                    <img
                      src={provider.logoUrl}
                      alt={provider.name}
                      className={cn(
                        'size-7 rounded-md shadow ring-2 ring-background',
                        !householdKeys.has(key) && 'opacity-60',
                      )}
                    />
                  ) : (
                    <span className="rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                      {provider?.name ?? key}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      <div className="mt-2.5">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{show.title}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {[show.mediaType === 'tv' ? 'Series' : 'Movie', show.year].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {names.length === 0
              ? 'Not streaming'
              : ours.length === 0
                ? `Only on ${formatList(names)}`
                : `On ${formatList(ours.map((key) => providers.get(key)?.name ?? key))}`}
          </p>
        </div>
      </div>
    </article>
  );
}
