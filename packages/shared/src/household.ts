import { z } from 'zod';

/** ISO 3166-1 alpha-2 country code: TMDB's `watch_region`. */
export const RegionCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, 'Use a two-letter country code');

export const HouseholdMemberSchema = z.object({
  userId: z.string(),
  displayName: z.string().nullable(),
  joinedAt: z.iso.datetime(),
  isYou: z.boolean(),
});
export type HouseholdMember = z.infer<typeof HouseholdMemberSchema>;

/**
 * The unit that owns all data: every member signs in separately and sees the same services
 * and watchlist. A user belongs to exactly one household (created on first use).
 */
export const HouseholdSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  region: z.string(),
  inviteCode: z.string(),
  members: HouseholdMemberSchema.array(),
});
export type Household = z.infer<typeof HouseholdSchema>;

export const UpdateHouseholdSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    region: RegionCodeSchema,
  })
  .partial();
export type UpdateHousehold = z.infer<typeof UpdateHouseholdSchema>;

export const JoinHouseholdSchema = z.object({
  inviteCode: z.string().trim().min(1, 'Invite code is required').max(64),
});
export type JoinHousehold = z.infer<typeof JoinHouseholdSchema>;
