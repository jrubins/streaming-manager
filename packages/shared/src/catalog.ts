import { z } from 'zod';
import { MediaTypeSchema } from './watchlist.ts';

export const ProviderPlanSchema = z.object({
  name: z.string(),
  monthlyPriceCents: z.number().int(),
});
export type ProviderPlan = z.infer<typeof ProviderPlanSchema>;

/** A streaming service available in the household's region, with known plan prices. */
export const CatalogProviderSchema = z.object({
  key: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable(),
  plans: ProviderPlanSchema.array(),
  /** When the plan prices were last checked (YYYY-MM-DD), or null without known prices. */
  pricesAsOf: z.string().nullable(),
  /** The service's own page for pausing, cancelling or resuming, when known. */
  manageUrl: z.string().nullable(),
});
export type CatalogProvider = z.infer<typeof CatalogProviderSchema>;

export const RegionSchema = z.object({ code: z.string(), name: z.string() });
export type Region = z.infer<typeof RegionSchema>;

export const TitleSearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Type a title to search').max(100),
});

export const TitleSearchResultSchema = z.object({
  tmdbId: z.number().int(),
  mediaType: MediaTypeSchema,
  title: z.string(),
  year: z.number().int().nullable(),
  posterUrl: z.string().nullable(),
  overview: z.string(),
});
export type TitleSearchResult = z.infer<typeof TitleSearchResultSchema>;
