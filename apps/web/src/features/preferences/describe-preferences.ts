import type { Preferences } from '@app/shared';

/** "No ads · 2 screens · HD · new services", for the plan page. */
export function describePreferences(p: Preferences): string {
  return [
    p.allowAds ? 'Ads OK' : 'No ads',
    p.minStreams === 1 ? '1 screen' : `${p.minStreams} screens`,
    p.require4k ? '4K' : 'HD',
    ...(p.requireDownloads ? ['downloads'] : []),
    p.suggestNewServices ? 'new services suggested' : 'only your services',
  ].join(' · ');
}
