/**
 * Where a subscriber manages (pauses, cancels or resumes) each service, for direct
 * subscribers. Someone billed through Apple, Google Play, Roku or Amazon changes it there
 * instead. Checked 2026-11-24; the web app falls back to a search for other services.
 */
const MANAGE_URLS: Readonly<Record<string, string>> = {
  netflix: 'https://www.netflix.com/account',
  hulu: 'https://www.hulu.com/account',
  'disney-plus': 'https://www.disneyplus.com/account',
  'hbo-max': 'https://www.hbomax.com/subscription',
  peacock: 'https://www.peacocktv.com/account',
  'paramount-plus': 'https://www.paramountplus.com/account/',
  'amazon-prime-video': 'https://www.amazon.com/yourmemberships',
  'apple-tv-plus': 'https://apps.apple.com/account/subscriptions',
  crunchyroll: 'https://www.crunchyroll.com/account/membership',
};

export function manageUrl(providerKey: string): string | null {
  return MANAGE_URLS[providerKey] ?? null;
}
