import { z } from 'zod';

/**
 * Perks: streaming services that come free or discounted with something else the household
 * pays for (internet, a phone plan, a shopping membership, a credit card).
 */

export const MembershipCategorySchema = z.enum(['internet', 'mobile', 'shopping', 'card']);
export type MembershipCategory = z.infer<typeof MembershipCategorySchema>;

/** Something a household may already pay for that comes with streaming perks. */
export const MembershipSchema = z.object({
  key: z.string(),
  name: z.string(),
  category: MembershipCategorySchema,
});
export type Membership = z.infer<typeof MembershipSchema>;

/** A streaming service (or bundle) offered free or discounted with a membership. */
export const PerkOfferSchema = z.object({
  id: z.string(),
  membershipKey: z.string(),
  membershipName: z.string(),
  /** The catalog key of the service or bundle it gives. */
  providerKey: z.string(),
  providerName: z.string(),
  /** The catalog plan it gives (features), or null when it varies. */
  planName: z.string().nullable(),
  /** What the household pays for the service with the perk: 0 is free. Null when it varies
   * (a statement credit), so the plan can't count on it. */
  monthlyPriceCents: z.number().int().nullable(),
  /** One line on what you get and who qualifies. */
  summary: z.string(),
  /** Where to read the offer's terms and claim it. */
  url: z.string(),
});
export type PerkOffer = z.infer<typeof PerkOfferSchema>;

export const OffersSchema = z.object({
  memberships: MembershipSchema.array(),
  offers: PerkOfferSchema.array(),
  /** When the offers were last checked (YYYY-MM-DD). */
  asOf: z.string(),
});
export type Offers = z.infer<typeof OffersSchema>;

/** The memberships a household has, by key. */
export const HouseholdMembershipsSchema = z.object({
  memberships: z.string().trim().min(1).max(64).array().max(50),
});
export type HouseholdMemberships = z.infer<typeof HouseholdMembershipsSchema>;

/** A service the household gets free or discounted through something else. */
export const ServicePerkSchema = z.object({
  /** What provides it ("Xfinity"). */
  via: z.string().trim().min(1).max(100),
  /** What the household pays while the perk lasts: 0 is free. */
  monthlyPriceCents: z.number().int().min(0).max(100_000),
  /** The last day of the perk (YYYY-MM-DD), or null when it doesn't end. */
  endsOn: z.iso.date().nullable(),
});
export type ServicePerk = z.infer<typeof ServicePerkSchema>;

/** How many days ahead the plan warns that a perk is ending. */
export const PERK_ENDING_WARNING_DAYS = 14;

/** Today as YYYY-MM-DD (UTC). */
export function isoToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Whether a perk still applies on `today` (its end date is the last day it applies). */
export function perkActive(perk: ServicePerk | null, today: string): perk is ServicePerk {
  return perk !== null && (perk.endsOn === null || perk.endsOn >= today);
}

/** Days from `today` until the perk's last day, or null when it doesn't end. */
export function daysUntil(endsOn: string | null, today: string): number | null {
  if (endsOn === null) return null;
  return Math.round((Date.parse(endsOn) - Date.parse(today)) / 86_400_000);
}
