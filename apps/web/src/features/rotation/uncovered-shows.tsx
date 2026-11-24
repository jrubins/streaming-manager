import type { WatchlistShow } from '@app/shared';
import { formatList } from '@/lib/format';
import { Poster } from './poster-strip';

interface UncoveredShowsProps {
  shows: readonly WatchlistShow[];
  /** Provider key → display name. */
  providerName: (key: string) => string;
}

/** Titles on the list that none of the household's services carry. */
export function UncoveredShows({ shows, providerName }: UncoveredShowsProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {shows.map((show) => (
        <li
          key={show.id}
          className="flex items-center gap-4 rounded-2xl border border-dashed bg-card/60 p-3"
        >
          <Poster show={show} className="w-14" />
          <div className="min-w-0">
            <p className="truncate font-medium">{show.title}</p>
            <p className="text-sm text-muted-foreground">
              {show.providerKeys.length === 0
                ? 'Not streaming anywhere right now'
                : `Streams on ${formatList(show.providerKeys.map(providerName))}`}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
