import type { MediaType } from '@app/shared';
import { z } from 'zod';
import { HttpError } from '../../lib/http-error.ts';
import { providerDisplayName, providerKey } from './provider-keys.ts';

/**
 * TMDB API v3 client (https://developer.themoviedb.org). Watch-provider data is supplied to
 * TMDB by JustWatch, and must be attributed in the UI.
 */

export interface TmdbProvider {
  key: string;
  name: string;
  logoPath: string | null;
  /** TMDB's display order in the region (lower is more prominent). */
  priority: number;
}

export interface TmdbTitle {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
  /** TMDB's popularity score (recent views, votes and watchlist adds); higher is more popular. */
  popularity: number;
}

export interface TmdbTitleWithProviders extends TmdbTitle {
  /** Provider keys that stream it by subscription, with ads, or free in the region. */
  providerKeys: string[];
}

export interface TmdbClient {
  search(query: string): Promise<TmdbTitle[]>;
  title(mediaType: MediaType, tmdbId: number, region: string): Promise<TmdbTitleWithProviders>;
  /** Streaming services in a region, one per provider key, most prominent first. */
  providers(region: string): Promise<TmdbProvider[]>;
  regions(): Promise<{ code: string; name: string }[]>;
  imageUrl(path: string | null, size: 'w92' | 'w342'): string | null;
}

const ProviderRow = z.object({
  provider_id: z.number(),
  provider_name: z.string(),
  logo_path: z.string().nullable().optional(),
  display_priority: z.number().optional(),
  display_priorities: z.record(z.string(), z.number()).optional(),
});

const SearchResult = z.object({
  id: z.number(),
  media_type: z.string(),
  title: z.string().optional(),
  name: z.string().optional(),
  release_date: z.string().optional(),
  first_air_date: z.string().optional(),
  poster_path: z.string().nullable().optional(),
  overview: z.string().optional(),
  popularity: z.number().optional(),
});

const Offers = z.object({
  flatrate: ProviderRow.array().optional(),
  ads: ProviderRow.array().optional(),
  free: ProviderRow.array().optional(),
});

const TitleDetails = SearchResult.omit({ media_type: true, id: true }).extend({
  id: z.number(),
  'watch/providers': z.object({ results: z.record(z.string(), Offers) }).optional(),
});

function toTitle(row: z.infer<typeof SearchResult>, mediaType: MediaType): TmdbTitle {
  const date = row.release_date || row.first_air_date || '';
  const year = /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : null;
  return {
    tmdbId: row.id,
    mediaType,
    title: row.title ?? row.name ?? 'Untitled',
    year,
    posterPath: row.poster_path ?? null,
    overview: row.overview ?? '',
    popularity: row.popularity ?? 0,
  };
}

const PROVIDER_CACHE_MS = 6 * 60 * 60 * 1000;

export interface TmdbClientOptions {
  token: string | undefined;
  apiUrl: string;
  imageUrl: string;
  /** Replace the network (tests). */
  fetch?: typeof fetch;
}

export function createTmdbClient(options: TmdbClientOptions): TmdbClient {
  const doFetch = options.fetch ?? fetch;
  const apiUrl = options.apiUrl.replace(/\/$/, '');
  const imageBase = options.imageUrl.replace(/\/$/, '');
  const providerCache = new Map<string, { at: number; providers: Promise<TmdbProvider[]> }>();

  async function get<T extends z.ZodType>(
    path: string,
    params: Record<string, string>,
    schema: T,
  ): Promise<z.infer<T>> {
    if (!options.token) {
      throw new HttpError(503, 'tmdb_unavailable', 'Title search is not configured');
    }
    const url = new URL(`${apiUrl}/3${path}`);
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
    const res = await doFetch(url, {
      headers: { Authorization: `Bearer ${options.token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) throw new HttpError(404, 'not_found', 'Title not found on TMDB');
    if (!res.ok) {
      throw new HttpError(502, 'tmdb_error', `TMDB answered ${res.status}`);
    }
    return schema.parse(await res.json());
  }

  async function loadProviders(region: string): Promise<TmdbProvider[]> {
    const List = z.object({ results: ProviderRow.array() });
    const [tv, movie] = await Promise.all([
      get('/watch/providers/tv', { watch_region: region }, List),
      get('/watch/providers/movie', { watch_region: region }, List),
    ]);
    const byKey = new Map<string, TmdbProvider>();
    for (const row of [...tv.results, ...movie.results]) {
      const key = providerKey(row.provider_name);
      const priority = row.display_priorities?.[region] ?? row.display_priority ?? 999;
      const existing = byKey.get(key);
      // The most prominent variant names the service (usually the plain "Netflix").
      if (!existing || priority < existing.priority) {
        byKey.set(key, {
          key,
          name: providerDisplayName(key, row.provider_name),
          logoPath: row.logo_path ?? existing?.logoPath ?? null,
          priority,
        });
      }
    }
    return [...byKey.values()].sort(
      (a, b) => a.priority - b.priority || a.key.localeCompare(b.key),
    );
  }

  return {
    async search(query) {
      const page = await get(
        '/search/multi',
        { query, include_adult: 'false', language: 'en-US', page: '1' },
        z.object({ results: SearchResult.array() }),
      );
      return page.results.flatMap((row) =>
        row.media_type === 'tv' || row.media_type === 'movie' ? [toTitle(row, row.media_type)] : [],
      );
    },

    async title(mediaType, tmdbId, region) {
      const details = await get(
        `/${mediaType}/${tmdbId}`,
        { append_to_response: 'watch/providers', language: 'en-US' },
        TitleDetails,
      );
      const offers = details['watch/providers']?.results[region];
      const rows = [...(offers?.flatrate ?? []), ...(offers?.ads ?? []), ...(offers?.free ?? [])];
      return {
        ...toTitle({ ...details, media_type: mediaType }, mediaType),
        providerKeys: [...new Set(rows.map((row) => providerKey(row.provider_name)))].sort(),
      };
    },

    providers(region) {
      const cached = providerCache.get(region);
      if (cached && Date.now() - cached.at < PROVIDER_CACHE_MS) return cached.providers;
      const providers = loadProviders(region);
      providerCache.set(region, { at: Date.now(), providers });
      // A failed load must not be cached.
      providers.catch(() => providerCache.delete(region));
      return providers;
    },

    async regions() {
      const list = await get(
        '/watch/providers/regions',
        { language: 'en-US' },
        z.object({
          results: z.object({ iso_3166_1: z.string(), english_name: z.string() }).array(),
        }),
      );
      return list.results
        .map((row) => ({ code: row.iso_3166_1, name: row.english_name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    imageUrl(path, size) {
      return path ? `${imageBase}/${size}${path}` : null;
    },
  };
}
