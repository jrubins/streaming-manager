import type { TitleSearchResult } from '@app/shared';
import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { titleKey } from './title-key';

interface SearchResultsProps {
  results: readonly TitleSearchResult[];
  /** `${mediaType}:${tmdbId}` of titles already on the list. */
  added: ReadonlySet<string>;
  onAdd: (result: TitleSearchResult) => void;
  /** The title being added right now, if any. */
  adding?: string | null;
}

/** TMDB search results, each addable to the watchlist. */
export function SearchResults({ results, added, onAdd, adding = null }: SearchResultsProps) {
  if (results.length === 0) {
    return <p className="px-1 py-4 text-sm text-muted-foreground">No titles found.</p>;
  }
  return (
    <>
      <p className="px-1 pb-2 text-xs text-muted-foreground">
        {results.length === 1 ? '1 title' : `${results.length} titles`}, most popular first
      </p>
      {/* Scrolls on its own, so a long list doesn't push the watchlist down the page. */}
      <ul
        className="-mx-1 grid max-h-[min(22rem,50vh)] gap-2 overflow-y-auto overscroll-contain px-1 pb-1 sm:grid-cols-2"
        aria-label="Search results"
      >
        {results.map((result) => {
          const key = titleKey(result);
          const isAdded = added.has(key);
          return (
            <li
              key={key}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-2.5"
            >
              {result.posterUrl ? (
                <img
                  src={result.posterUrl}
                  alt=""
                  className="aspect-[2/3] w-11 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span aria-hidden className="aspect-[2/3] w-11 shrink-0 rounded-md bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{result.title}</p>
                <p className="text-xs text-muted-foreground">
                  {result.mediaType === 'tv' ? 'TV series' : 'Movie'}
                  {result.year ? ` · ${result.year}` : ''}
                </p>
              </div>
              <Button
                size="sm"
                variant={isAdded ? 'ghost' : 'secondary'}
                disabled={isAdded || adding === key}
                onClick={() => onAdd(result)}
                aria-label={isAdded ? `Added ${result.title}` : `Add ${result.title}`}
              >
                {isAdded ? <Check aria-hidden /> : <Plus aria-hidden />}
                {isAdded ? 'Added' : 'Add'}
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
