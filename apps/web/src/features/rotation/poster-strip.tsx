import type { WatchlistShow } from '@app/shared';
import { cn } from 'cn';

interface PosterStripProps {
  shows: readonly WatchlistShow[];
  /** Posters shown before the rest collapse into "+N". */
  max?: number;
  /** Dim the posters (titles that don't need this service). */
  muted?: boolean;
}

/** A row of posters with their titles, for the shows behind a service's state. */
export function PosterStrip({ shows, max = 5, muted = false }: PosterStripProps) {
  if (shows.length === 0) return null;
  const visible = shows.slice(0, max);
  const hidden = shows.length - visible.length;
  return (
    <ul className="flex gap-3" aria-label="Titles">
      {visible.map((show) => (
        <li key={show.id} className="w-[84px] shrink-0">
          <Poster show={show} className={cn(muted && 'grayscale')} />
          <p className="mt-1.5 line-clamp-2 text-xs leading-tight text-muted-foreground">
            {show.title}
          </p>
        </li>
      ))}
      {hidden > 0 ? (
        <li className="flex aspect-[2/3] w-[84px] shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
          +{hidden}
          <span className="sr-only"> more</span>
        </li>
      ) : null}
    </ul>
  );
}

export function Poster({ show, className }: { show: WatchlistShow; className?: string }) {
  return show.posterUrl ? (
    <img
      src={show.posterUrl}
      alt={show.title}
      loading="lazy"
      className={cn(
        'aspect-[2/3] w-full rounded-lg bg-muted object-cover shadow-sm ring-1 ring-black/5',
        className,
      )}
    />
  ) : (
    <div
      role="img"
      aria-label={show.title}
      className={cn(
        'flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-muted p-1 text-center text-[10px] text-muted-foreground',
        className,
      )}
    >
      {show.title}
    </div>
  );
}
