import { z } from 'zod';

/**
 * Live channels and league passes a household needs. Live TV services are chosen by the
 * channels they carry, not by titles, so each needed channel counts like a title on the
 * watchlist: the plan covers it with the cheapest service that carries it.
 */

export const ChannelCategorySchema = z.enum([
  'local',
  'sports',
  'leagues',
  'news',
  'entertainment',
  'kids',
]);
export type ChannelCategory = z.infer<typeof ChannelCategorySchema>;

export const ChannelSchema = z.object({
  key: z.string(),
  name: z.string(),
  category: ChannelCategorySchema,
  /** A local broadcast channel: carried in most areas, but it depends on the ZIP code. */
  local: z.boolean(),
  /** Part of the usual set for its category (a starting point to adjust). */
  starter: z.boolean(),
  /** Keys of the services (or bundles) that carry it. */
  carriers: z.string().array(),
});
export type Channel = z.infer<typeof ChannelSchema>;

export const ChannelLookupSchema = z.object({ name: z.string(), url: z.string() });

export const ChannelCatalogSchema = z.object({
  channels: ChannelSchema.array(),
  /** Each live TV service's own page for checking channels by ZIP code. */
  lookups: ChannelLookupSchema.array(),
  /** When the lineups were last checked (YYYY-MM-DD). */
  asOf: z.string(),
});
export type ChannelCatalog = z.infer<typeof ChannelCatalogSchema>;

/** The channels a household needs, by key. */
export const HouseholdChannelsSchema = z.object({
  channels: z.string().trim().min(1).max(64).array().max(200),
});
export type HouseholdChannels = z.infer<typeof HouseholdChannelsSchema>;
