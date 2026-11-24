import type { CatalogProvider } from '@app/shared';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
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
  const debounced = useDebouncedValue(query.trim());
  const search = useQuery(titleSearchQueryOptions(debounced));
  const add = useAddToWatchlist();
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
    () => new Set((services.data ?? []).map((s) => s.providerKey)),
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

      <section aria-label="Find titles" className="surface mb-10 p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Search for a show or movie"
            placeholder="Search for a show or movie…"
            className="h-11 pr-10 pl-9 text-base"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('');
            }}
          />
          {query ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1.5 -translate-y-1/2"
              aria-label="Clear search"
              onClick={() => setQuery('')}
            >
              <X aria-hidden />
            </Button>
          ) : null}
        </div>
        {debounced ? (
          <div className="mt-3">
            {search.isPending ? (
              <p className="px-1 py-4 text-sm text-muted-foreground">Searching…</p>
            ) : search.isError ? (
              <p className="px-1 py-4 text-sm text-destructive">
                {search.error instanceof ApiRequestError && search.error.code === 'tmdb_unavailable'
                  ? 'Title search is not set up yet.'
                  : 'Search failed. Try again.'}
              </p>
            ) : (
              <SearchResults
                results={search.data}
                added={added}
                adding={add.isPending && add.variables ? titleKey(add.variables) : null}
                onAdd={(result) =>
                  add.mutate({ tmdbId: result.tmdbId, mediaType: result.mediaType })
                }
              />
            )}
          </div>
        ) : null}
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
