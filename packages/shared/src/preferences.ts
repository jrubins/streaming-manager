import { z } from 'zod';
import type { ProviderPlan } from './catalog.ts';

/** What a household needs from its plans. The plan is the cheapest set that meets these. */
export const PreferencesSchema = z.object({
  /** Ad-supported plans are acceptable. */
  allowAds: z.boolean(),
  /** Screens that must be able to stream at the same time. */
  minStreams: z.number().int().min(1).max(6),
  /** Only plans with 4K picture. */
  require4k: z.boolean(),
  /** Only plans that allow downloads. */
  requireDownloads: z.boolean(),
  /** Consider services (and bundles) the household doesn't have yet. */
  suggestNewServices: z.boolean(),
});
export type Preferences = z.infer<typeof PreferencesSchema>;

export const UpdatePreferencesSchema = PreferencesSchema.partial();
export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  allowAds: true,
  minStreams: 1,
  require4k: false,
  requireDownloads: false,
  suggestNewServices: true,
};

/** Whether a plan meets the household's preferences. */
export function planMeets(
  plan: Pick<ProviderPlan, 'ads' | 'streams' | 'uhd' | 'downloads'>,
  preferences: Preferences,
): boolean {
  return (
    (preferences.allowAds || !plan.ads) &&
    plan.streams >= preferences.minStreams &&
    (!preferences.require4k || plan.uhd) &&
    (!preferences.requireDownloads || plan.downloads)
  );
}
