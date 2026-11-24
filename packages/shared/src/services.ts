import { z } from 'zod';
import { ServicePerkSchema } from './perks.ts';

export const ServiceStatusSchema = z.enum(['active', 'paused']);
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;

/** Where a service's price came from: the built-in catalog, typed by a member, or an invoice. */
export const PriceSourceSchema = z.enum(['catalog', 'manual', 'invoice']);
export type PriceSource = z.infer<typeof PriceSourceSchema>;

/**
 * Stable key for a streaming service, independent of TMDB's many provider variants
 * ("Netflix", "Netflix Standard with Ads" and "Netflix Kids" are all `netflix`).
 */
export const ProviderKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'Invalid provider key');

const PriceCentsSchema = z.number().int().min(0).max(100_000);

/** A streaming service, or bundle of services, the household subscribes to (or has paused). */
export const ServiceSchema = z.object({
  id: z.number().int(),
  /** The service or bundle subscribed to (a catalog key). */
  providerKey: z.string(),
  name: z.string(),
  /** The services it unlocks: itself, or each service of a bundle. */
  includes: z.string().array(),
  logoUrl: z.string().nullable(),
  planName: z.string().nullable(),
  monthlyPriceCents: z.number().int().nullable(),
  priceSource: PriceSourceSchema.nullable(),
  status: ServiceStatusSchema,
  /** Set when it comes free or discounted with something else (an internet plan, say).
   * `monthlyPriceCents` stays the regular price, paid once the perk ends. */
  perk: ServicePerkSchema.nullable(),
  /** The service's own page for pausing, cancelling or resuming, when known. */
  manageUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type Service = z.infer<typeof ServiceSchema>;

export const CreateServiceSchema = z.object({
  providerKey: ProviderKeySchema,
  status: ServiceStatusSchema.default('active'),
  /** A plan from the catalog; its price is used unless `monthlyPriceCents` is given. */
  planName: z.string().trim().min(1).max(100).optional(),
  monthlyPriceCents: PriceCentsSchema.optional(),
  perk: ServicePerkSchema.optional(),
});
export type CreateService = z.input<typeof CreateServiceSchema>;

export const UpdateServiceSchema = z
  .object({
    status: ServiceStatusSchema,
    planName: z.string().trim().min(1).max(100).nullable(),
    monthlyPriceCents: PriceCentsSchema.nullable(),
    perk: ServicePerkSchema.nullable(),
  })
  .partial();
export type UpdateService = z.infer<typeof UpdateServiceSchema>;

export const ServiceIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
