import * as Sentry from '@sentry/node';
import type { Db } from '@app/db';
import type { AddToWatchlist, MediaType, UpdateWatchlistShow, WatchlistShow } from '@app/shared';
import { isUniqueViolation } from '../../lib/db-errors.ts';
import { HttpError, notFound } from '../../lib/http-error.ts';
import type { TmdbClient } from '../catalog/tmdb.client.ts';
import type { HouseholdContext, HouseholdService } from '../household/household.service.ts';

interface ShowRow {
  id: number;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  watched: boolean;
  providerKeys: readonly string[];
  providersRegion: string;
  providersRefreshedAt: Date;
  createdAt: Date;
}

/** Streaming availability changes as catalogs rotate; older data is fetched again. */
export const PROVIDERS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** At most this many titles are refreshed while answering one request. */
const REFRESH_BATCH = 25;
const REFRESH_CONCURRENCY = 5;

/** The household's shared watchlist and where each title streams. */
export function createWatchlistService(db: Db, households: HouseholdService, tmdb: TmdbClient) {
  const Rows = db.orm.public.WatchlistShow;

  const toShow = (row: ShowRow): WatchlistShow => ({
    id: row.id,
    tmdbId: row.tmdbId,
    mediaType: row.mediaType,
    title: row.title,
    year: row.year,
    posterUrl: tmdb.imageUrl(row.posterPath, 'w342'),
    watched: row.watched,
    providerKeys: [...row.providerKeys],
    providersRefreshedAt: row.providersRefreshedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  });

  async function refreshRow(household: HouseholdContext, row: ShowRow): Promise<ShowRow> {
    const title = await tmdb.title(row.mediaType, row.tmdbId, household.region);
    const updated = await Rows.where({ id: row.id, householdId: household.id }).update({
      title: title.title,
      year: title.year,
      posterPath: title.posterPath,
      providerKeys: title.providerKeys,
      providersRegion: household.region,
      providersRefreshedAt: new Date(),
    });
    return updated ?? row;
  }

  /** Refreshes rows a few at a time; a title TMDB can't answer for keeps its old data. */
  async function refreshRows(household: HouseholdContext, rows: ShowRow[]): Promise<void> {
    const queue = [...rows];
    const worker = async () => {
      for (let row = queue.shift(); row; row = queue.shift()) {
        try {
          await refreshRow(household, row);
        } catch (error) {
          Sentry.captureException(error);
        }
      }
    };
    await Promise.all(Array.from({ length: REFRESH_CONCURRENCY }, worker));
  }

  async function rows(householdId: number): Promise<ShowRow[]> {
    return Rows.where({ householdId })
      .orderBy([(s) => s.createdAt.desc(), (s) => s.id.desc()])
      .limit(500)
      .all();
  }

  return {
    async list(userId: string): Promise<WatchlistShow[]> {
      const { id } = await households.context(userId);
      return (await rows(id)).map(toShow);
    },

    async add(userId: string, input: AddToWatchlist): Promise<WatchlistShow> {
      const household = await households.context(userId);
      const title = await tmdb.title(input.mediaType, input.tmdbId, household.region);
      try {
        const row = await Rows.create({
          householdId: household.id,
          tmdbId: title.tmdbId,
          mediaType: title.mediaType,
          title: title.title,
          year: title.year,
          posterPath: title.posterPath,
          watched: false,
          providerKeys: title.providerKeys,
          providersRegion: household.region,
          providersRefreshedAt: new Date(),
          addedByUserId: userId,
        });
        return toShow(row);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new HttpError(409, 'already_added', `${title.title} is already on your watchlist`);
        }
        throw error;
      }
    },

    async update(userId: string, id: number, input: UpdateWatchlistShow): Promise<WatchlistShow> {
      const { id: householdId } = await households.context(userId);
      const row = await Rows.where({ id, householdId }).update({ watched: input.watched });
      if (!row) throw notFound(`Watchlist entry ${id} not found`);
      return toShow(row);
    },

    async remove(userId: string, id: number): Promise<void> {
      const { id: householdId } = await households.context(userId);
      const deleted = await Rows.where({ id, householdId }).delete();
      if (!deleted) throw notFound(`Watchlist entry ${id} not found`);
    },

    /** Fetches where one title streams now. */
    async refresh(userId: string, id: number): Promise<WatchlistShow> {
      const household = await households.context(userId);
      const row = await Rows.where({ id, householdId: household.id }).first();
      if (!row) throw notFound(`Watchlist entry ${id} not found`);
      return toShow(await refreshRow(household, row));
    },

    /** Refreshes every title, e.g. after the household's region changed. */
    async refreshAll(userId: string): Promise<void> {
      const household = await households.context(userId);
      await refreshRows(household, await rows(household.id));
    },

    /**
     * Refreshes unwatched titles whose data is old or for another region (a batch per call),
     * so the plan reflects what streams where today.
     */
    async refreshStale(userId: string, now = Date.now()): Promise<void> {
      const household = await households.context(userId);
      const stale = (await rows(household.id)).filter(
        (row) =>
          !row.watched &&
          (row.providersRegion !== household.region ||
            now - row.providersRefreshedAt.getTime() > PROVIDERS_MAX_AGE_MS),
      );
      await refreshRows(household, stale.slice(0, REFRESH_BATCH));
    },
  };
}

export type WatchlistService = ReturnType<typeof createWatchlistService>;
