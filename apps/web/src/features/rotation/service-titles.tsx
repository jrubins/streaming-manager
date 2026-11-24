import type { WatchlistShow } from '@app/shared';
import { cn } from 'cn';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatList } from '@/lib/format';
import { Poster } from './poster-strip';

interface ServiceTitlesProps {
  serviceName: string;
  /** The services it includes, left out of each title's "also on" list. */
  includes: readonly string[];
  shows: readonly WatchlistShow[];
  /** Provider key → display name, for where else each title streams. */
  providerName: (key: string) => string;
  /** Posters shown before the rest collapse into "+N". */
  max?: number;
}

const describe = (show: WatchlistShow) =>
  [show.mediaType === 'tv' ? 'Series' : 'Movie', show.year].filter(Boolean).join(' · ');

/**
 * Overlapping posters of the titles on a service. Hovering (or focusing) one names it;
 * clicking any of them, or "+N", lists every title in a dialog.
 */
export function ServiceTitles({
  serviceName,
  includes,
  shows,
  providerName,
  max = 4,
}: ServiceTitlesProps) {
  const [open, setOpen] = useState(false);
  if (shows.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
  const hidden = shows.length - max;

  return (
    <>
      <ul className="flex items-center" aria-label={`Titles on ${serviceName}`}>
        {shows.slice(0, max).map((show, index) => (
          <li key={show.id} className={cn('w-9 shrink-0', index > 0 && '-ml-3')}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="block w-full rounded-md transition-transform hover:z-10 hover:-translate-y-0.5 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Poster show={show} className="rounded-md ring-2 ring-card" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <span className="font-semibold">{show.title}</span>
                <span className="opacity-80"> · {describe(show)}</span>
              </TooltipContent>
            </Tooltip>
          </li>
        ))}
        {hidden > 0 ? (
          <li className="-ml-3 w-9 shrink-0">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex aspect-[2/3] w-full items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-card transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring focus-visible:outline-none"
            >
              +{hidden}
              <span className="sr-only">
                {' '}
                more: show all {shows.length} titles on {serviceName}
              </span>
            </button>
          </li>
        ) : null}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Titles on {serviceName}</DialogTitle>
            <DialogDescription>
              {shows.length === 1
                ? '1 unwatched title on your list streams here.'
                : `${shows.length} unwatched titles on your list stream here.`}
            </DialogDescription>
          </DialogHeader>
          <ul className="-mx-2 max-h-[60vh] divide-y overflow-y-auto" aria-label="Titles">
            {shows.map((show) => {
              const elsewhere = show.providerKeys.filter((key) => !includes.includes(key));
              return (
                <li key={show.id} className="flex items-center gap-3 px-2 py-2.5">
                  <Poster show={show} decorative className="w-10 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{show.title}</p>
                    <p className="text-xs text-muted-foreground">{describe(show)}</p>
                    {elsewhere.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Also on {formatList(elsewhere.map(providerName))}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
