import type { CatalogProvider } from '@app/shared';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { LoaderCircle, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { providersQueryOptions, servicesQueryOptions } from '@/features/services/queries';
import {
  titleSearchQueryOptions,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useUpdateWatchlistShow,
  watchlistQueryOptions,
} from '@/features/watchlist/queries';
import { SearchResults } from '@/features/watchlist/search-results';
import { titleKey } from '@/features/watchlist/title-key';
import { WatchlistCard } from '@/features/watchlist/watchlist-card';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ApiRequestError } from '@/lib/api';

export function WatchlistPage() {
  const { data: shows } = useSuspenseQuery(watchlistQueryOptions);
  const providers = useQuery(providersQueryOptions);
  const services = useQuery(servicesQueryOptions);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(query.trim());
  const search = useQuery(titleSearchQueryOptions(debounced));
  const add = useAddToWatchlist();
  const showPanel = open && query.trim().length > 0;
  const searchBox = useRef<HTMLDivElement>(null);

  // A click anywhere outside the search box closes the results.
  useEffect(() => {
    if (!showPanel) return;
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !searchBox.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [showPanel]);
  const update = useUpdateWatchlistShow();
  const remove = useRemoveFromWatchlist();

  const providerMap = useMemo(
    () =>
      new Map<string, Pick<CatalogProvider, 'name' | 'logoUrl'>>(
        (providers.data ?? []).map((p) => [p.key, p]),
      ),
    [providers.data],
  );
  const householdKeys = useMemo(
    () => new Set((services.data ?? []).flatMap((s) => s.includes)),
    [services.data],
  );
  const added = useMemo(() => new Set(shows.map(titleKey)), [shows]);
  const toWatch = shows.filter((show) => !show.watched);
  const watched = shows.filter((show) => show.watched);

  const grid = (list: typeof shows, empty: string) =>
    list.length === 0 ? (
      <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
        {empty}
      </p>
    ) : (
      <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((show) => (
          <WatchlistCard
            key={show.id}
            show={show}
            providers={providerMap}
            householdKeys={householdKeys}
            pending={update.isPending || remove.isPending}
            onToggleWatched={() => update.mutate({ id: show.id, watched: !show.watched })}
            onRemove={() => remove.mutate(show.id)}
          />
        ))}
      </div>
    );

  return (
    <>
      <PageHeader
        title="Watchlist"
        description="Everything your household wants to watch. The plan keeps a service for each of these."
      />

      <section aria-label="Find titles" className="surface relative z-20 mb-10 p-4">
        <div
          ref={searchBox}
          className="relative"
          onBlur={(event) => {
            // Focus moved somewhere else on the page (a button that disables itself while it
            // works leaves no related target, and must not close the panel).
            if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
              setOpen(false);
            }
          }}
        >
          <Search
            className="pointer-events-none absolute top-[1.375rem] left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Search for a show or movie"
            aria-controls={showPanel ? 'title-search-results' : undefined}
            aria-expanded={showPanel}
            placeholder="Search for a show or movie…"
            className="h-11 pr-16 pl-9 text-base [&::-webkit-search-cancel-button]:hidden"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                if (open && query) setOpen(false);
                else setQuery('');
              }
            }}
          />
          <div className="absolute top-[1.375rem] right-1.5 flex -translate-y-1/2 items-center gap-1">
            {search.isFetching ? (
              <LoaderCircle
                className="size-4 animate-spin text-muted-foreground"
                aria-label="Searching"
              />
            ) : null}
            {query ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Clear search"
                onClick={() => {
                  setQuery('');
                  setOpen(false);
                }}
              >
                <X aria-hidden />
              </Button>
            ) : null}
          </div>
          {showPanel ? (
            // Floats over the page, so typing never moves the content below.
            <div
              id="title-search-results"
              tabIndex={-1}
              className="absolute inset-x-0 top-full z-30 mt-2 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg outline-none"
            >
              {search.data ? (
                <SearchResults
                  results={search.data}
                  added={added}
                  adding={add.isPending && add.variables ? titleKey(add.variables) : null}
                  onAdd={(result) =>
                    add.mutate({ tmdbId: result.tmdbId, mediaType: result.mediaType })
                  }
                />
              ) : search.isError ? (
                <p className="px-1 py-4 text-sm text-destructive">
                  {search.error instanceof ApiRequestError &&
                  search.error.code === 'tmdb_unavailable'
                    ? 'Title search is not set up yet.'
                    : 'Search failed. Try again.'}
                </p>
              ) : (
                <p className="px-1 py-4 text-sm text-muted-foreground">Searching…</p>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <Tabs defaultValue="to-watch">
        <TabsList className="mb-6">
          <TabsTrigger value="to-watch">To watch ({toWatch.length})</TabsTrigger>
          <TabsTrigger value="watched">Watched ({watched.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="to-watch">
          {grid(toWatch, 'Nothing to watch yet. Search above to add shows and movies.')}
        </TabsContent>
        <TabsContent value="watched">
          {grid(watched, 'Titles you mark watched show up here.')}
        </TabsContent>
      </Tabs>
    </>
  );
}
