import { z } from 'zod';

export const MediaTypeSchema = z.enum(['tv', 'movie']);
export type MediaType = z.infer<typeof MediaTypeSchema>;

/** A show or movie on the household's watchlist, with where it streams in their region. */
export const WatchlistShowSchema = z.object({
  id: z.number().int(),
  tmdbId: z.number().int(),
  mediaType: MediaTypeSchema,
  title: z.string(),
  year: z.number().int().nullable(),
  posterUrl: z.string().nullable(),
  watched: z.boolean(),
  /** Services it streams on by subscription (not rent or buy), as provider keys. */
  providerKeys: z.string().array(),
  providersRefreshedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});
export type WatchlistShow = z.infer<typeof WatchlistShowSchema>;

export const AddToWatchlistSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: MediaTypeSchema,
});
export type AddToWatchlist = z.infer<typeof AddToWatchlistSchema>;

export const UpdateWatchlistShowSchema = z.object({ watched: z.boolean() });
export type UpdateWatchlistShow = z.infer<typeof UpdateWatchlistShowSchema>;

export const WatchlistShowIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
