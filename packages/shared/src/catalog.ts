import { z } from 'zod';
import { MediaTypeSchema } from './watchlist.ts';

/** A plan of a service or bundle: its price and what it allows. */
export const ProviderPlanSchema = z.object({
  name: z.string(),
  monthlyPriceCents: z.number().int(),
  /** Whether it shows ads (on a bundle: on any of its services). */
  ads: z.boolean(),
  /** How many screens can stream at once. */
  streams: z.number().int(),
  /** 4K / UHD picture. */
  uhd: z.boolean(),
  /** Downloads for offline viewing. */
  downloads: z.boolean(),
  /** Set on a plan offered through a membership the household has (free or discounted). */
  perk: z
    .object({
      offerId: z.string(),
      via: z.string(),
      url: z.string(),
      /** The service's own plan the perk gives. */
      planName: z.string(),
    })
    .nullable()
    .optional(),
});
export type ProviderPlan = z.infer<typeof ProviderPlanSchema>;

export const OfferingKindSchema = z.enum(['service', 'bundle']);
export type OfferingKind = z.infer<typeof OfferingKindSchema>;

/**
 * Something a household can subscribe to in its region: one service, or a bundle of several,
 * with known plans and prices.
 */
export const CatalogProviderSchema = z.object({
  key: z.string(),
  name: z.string(),
  kind: OfferingKindSchema,
  /** The services (provider keys) it unlocks: itself, or each service of a bundle. */
  includes: z.string().array(),
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
