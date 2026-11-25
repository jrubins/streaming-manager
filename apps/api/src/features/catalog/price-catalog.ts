import type { ProviderPlan } from '@app/shared';

/**
 * Published monthly prices (USD) and features of the most common US streaming plans, keyed by
 * provider key, and the bundles that combine services. Prices and limits change often: update
 * them and `PRICES_AS_OF` together. Members can always override a subscription's price.
 *
 * Sources (checked 2026-11-24): the services' plan and bundle pages (hulu.com, disneyplus.com)
 * and cloudwards.net, smarttvs.org, comparesubscriptions.com, applescoop.org and
 * dealnews.com comparisons. Least certain, where sources disagreed: Disney+ ad tier screens,
 * Prime Video ad-free screens, Paramount+ Premium screens, and the Disney+/Hulu/HBO Max
 * bundle (only its ad-supported price was found).
 */
export const PRICES_AS_OF = '2026-11-24';

const plan = (
  name: string,
  dollars: number,
  features: Pick<ProviderPlan, 'ads' | 'streams' | 'uhd' | 'downloads'>,
): ProviderPlan => ({ name, monthlyPriceCents: Math.round(dollars * 100), ...features });

const US_PLANS: Readonly<Record<string, readonly ProviderPlan[]>> = {
  netflix: [
    plan('Standard with ads', 8.99, { ads: true, streams: 2, uhd: false, downloads: true }),
    plan('Standard', 19.99, { ads: false, streams: 2, uhd: false, downloads: true }),
    plan('Premium', 26.99, { ads: false, streams: 4, uhd: true, downloads: true }),
  ],
  hulu: [
    plan('With ads', 12.49, { ads: true, streams: 2, uhd: false, downloads: false }),
    plan('No ads', 21.49, { ads: false, streams: 2, uhd: false, downloads: true }),
  ],
  'disney-plus': [
    plan('Basic (with ads)', 12.49, { ads: true, streams: 2, uhd: false, downloads: false }),
    plan('Premium', 21.49, { ads: false, streams: 4, uhd: true, downloads: true }),
  ],
  'hbo-max': [
    plan('Basic with ads', 10.99, { ads: true, streams: 2, uhd: false, downloads: false }),
    plan('Standard', 18.49, { ads: false, streams: 2, uhd: false, downloads: true }),
    plan('Premium', 22.99, { ads: false, streams: 4, uhd: true, downloads: true }),
  ],
  peacock: [
    plan('Select', 8.99, { ads: true, streams: 3, uhd: false, downloads: false }),
    plan('Premium', 12.99, { ads: true, streams: 3, uhd: false, downloads: false }),
    plan('Premium Plus', 19.99, { ads: false, streams: 3, uhd: false, downloads: true }),
  ],
  'paramount-plus': [
    plan('Essential', 8.99, { ads: true, streams: 3, uhd: false, downloads: false }),
    plan('Premium', 13.99, { ads: false, streams: 3, uhd: true, downloads: true }),
  ],
  'amazon-prime-video': [
    plan('Prime Video (with ads)', 8.99, { ads: true, streams: 3, uhd: true, downloads: true }),
    plan('Prime Video ad-free', 13.98, { ads: false, streams: 5, uhd: true, downloads: true }),
  ],
  'apple-tv-plus': [plan('Monthly', 14.99, { ads: false, streams: 6, uhd: true, downloads: true })],
  // YouTube Premium (TMDB's "YouTube Premium" normalizes to `youtube`).
  youtube: [
    plan('Individual', 15.99, { ads: false, streams: 1, uhd: true, downloads: true }),
    plan('Family', 26.99, { ads: false, streams: 6, uhd: true, downloads: true }),
  ],
  starz: [plan('Monthly', 11.99, { ads: false, streams: 4, uhd: true, downloads: true })],
  crunchyroll: [
    plan('Fan', 9.99, { ads: false, streams: 1, uhd: false, downloads: false }),
    plan('Mega Fan', 13.99, { ads: false, streams: 4, uhd: false, downloads: true }),
  ],
  'mgm-plus': [plan('Monthly', 7.99, { ads: false, streams: 4, uhd: false, downloads: true })],
  'amc-plus': [
    plan('With ads', 7.99, { ads: true, streams: 4, uhd: false, downloads: false }),
    plan('Premium', 10.99, { ads: false, streams: 4, uhd: true, downloads: true }),
  ],
  'espn-plus': [plan('Select', 13.99, { ads: true, streams: 3, uhd: false, downloads: false })],
};

export interface BundleDefinition {
  key: string;
  name: string;
  /** Provider keys of the services it includes. */
  includes: readonly string[];
  plans: readonly ProviderPlan[];
  /** Where it is managed (paused, cancelled), when known. */
  manageUrl: string | null;
  /** A single service rather than a bundle (default: bundle). */
  kind?: 'service' | 'bundle';
  /** Offered in the region whether or not TMDB lists it: live TV packages and league passes,
   * which TMDB doesn't track. Their `includes` may name keys TMDB doesn't know. */
  standalone?: boolean;
}

/**
 * Bundles: on a bundle, "ads" means any of its services shows ads, and screens, 4K and
 * downloads are what every one of its services allows (the weakest).
 */
const US_BUNDLES: readonly BundleDefinition[] = [
  // Live TV. Chosen by their channels (see channel-catalog.ts) more than by titles.
  {
    key: 'youtube-tv',
    name: 'YouTube TV',
    kind: 'service',
    standalone: true,
    includes: ['youtube-tv'],
    plans: [
      plan('Base plan', 82.99, { ads: true, streams: 3, uhd: false, downloads: false }),
      // The 4K Plus add-on ($9.99): 4K, unlimited streams at home, offline DVR downloads.
      plan('Base plan + 4K Plus', 92.98, { ads: true, streams: 3, uhd: true, downloads: true }),
    ],
    manageUrl: 'https://tv.youtube.com/settings/membership',
  },
  {
    key: 'hulu-live-tv',
    name: 'Hulu + Live TV',
    standalone: true,
    // Includes Disney+ and ESPN Select, so it covers their titles too.
    includes: ['hulu-live-tv', 'hulu', 'disney-plus', 'espn-plus'],
    plans: [
      plan('With ads', 99.99, { ads: true, streams: 2, uhd: false, downloads: false }),
      plan('No ads (on demand)', 109.99, { ads: false, streams: 2, uhd: false, downloads: true }),
    ],
    manageUrl: 'https://secure.hulu.com/account',
  },
  {
    key: 'sling-orange',
    name: 'Sling Orange',
    kind: 'service',
    standalone: true,
    includes: ['sling-orange', 'sling-tv'],
    plans: [plan('Orange', 45.99, { ads: true, streams: 1, uhd: false, downloads: false })],
    manageUrl: 'https://www.sling.com/account',
  },
  {
    key: 'sling-blue',
    name: 'Sling Blue',
    kind: 'service',
    standalone: true,
    includes: ['sling-blue', 'sling-tv'],
    plans: [plan('Blue', 45.99, { ads: true, streams: 3, uhd: false, downloads: false })],
    manageUrl: 'https://www.sling.com/account',
  },
  {
    key: 'sling-orange-blue',
    name: 'Sling Orange & Blue',
    standalone: true,
    includes: ['sling-orange', 'sling-blue', 'sling-tv'],
    plans: [plan('Orange & Blue', 60.99, { ads: true, streams: 4, uhd: false, downloads: false })],
    manageUrl: 'https://www.sling.com/account',
  },
  {
    key: 'fubotv',
    name: 'Fubo',
    kind: 'service',
    standalone: true,
    includes: ['fubotv'],
    plans: [plan('Pro', 88.99, { ads: true, streams: 10, uhd: true, downloads: false })],
    manageUrl: 'https://www.fubo.tv/account',
  },
  {
    key: 'directv-stream',
    name: 'DirecTV Stream',
    kind: 'service',
    standalone: true,
    includes: ['directv-stream'],
    plans: [plan('Entertainment', 94.99, { ads: true, streams: 20, uhd: false, downloads: false })],
    manageUrl: 'https://www.directv.com/stream',
  },
  {
    key: 'philo',
    name: 'Philo',
    kind: 'service',
    standalone: true,
    includes: ['philo'],
    plans: [plan('Philo', 33, { ads: true, streams: 3, uhd: false, downloads: false })],
    manageUrl: 'https://www.philo.com/account',
  },
  // League passes: out-of-market games.
  {
    key: 'nfl-sunday-ticket',
    name: 'NFL Sunday Ticket',
    kind: 'service',
    standalone: true,
    includes: ['nfl-sunday-ticket'],
    // Sold by the season ($480 on YouTube, $378 with YouTube TV): spread over its 5 months.
    plans: [plan('Season, per month', 96, { ads: true, streams: 2, uhd: true, downloads: false })],
    manageUrl: 'https://tv.youtube.com/nfl',
  },
  {
    key: 'nba-league-pass',
    name: 'NBA League Pass',
    kind: 'service',
    standalone: true,
    includes: ['nba-league-pass'],
    plans: [
      plan('Standard', 16.99, { ads: true, streams: 1, uhd: false, downloads: false }),
      plan('Premium', 24.99, { ads: false, streams: 3, uhd: false, downloads: true }),
    ],
    manageUrl: 'https://www.nba.com/watch/league-pass-stream',
  },
  {
    key: 'mlb-tv',
    name: 'MLB.TV',
    kind: 'service',
    standalone: true,
    includes: ['mlb-tv'],
    plans: [plan('Monthly', 29.99, { ads: true, streams: 1, uhd: false, downloads: false })],
    manageUrl: 'https://www.mlb.com/live-stream-games/subscribe',
  },
  {
    key: 'disney-hulu',
    name: 'Disney+ & Hulu',
    includes: ['disney-plus', 'hulu'],
    plans: [
      plan('Basic (with ads)', 12.99, { ads: true, streams: 2, uhd: false, downloads: false }),
      plan('Premium', 21.99, { ads: false, streams: 2, uhd: false, downloads: true }),
    ],
    manageUrl: 'https://www.disneyplus.com/account',
  },
  {
    key: 'disney-hulu-espn-select',
    name: 'Disney+, Hulu & ESPN Select',
    includes: ['disney-plus', 'hulu', 'espn-plus'],
    plans: [
      plan('With ads', 21.99, { ads: true, streams: 2, uhd: false, downloads: false }),
      // Disney+ and Hulu without ads; ESPN Select itself always has ads.
      plan('Premium', 32.99, { ads: true, streams: 2, uhd: false, downloads: true }),
    ],
    manageUrl: 'https://www.disneyplus.com/account',
  },
  {
    key: 'disney-hulu-espn-unlimited',
    name: 'Disney+, Hulu & ESPN Unlimited',
    includes: ['disney-plus', 'hulu', 'espn-plus'],
    plans: [
      plan('With ads', 35.99, { ads: true, streams: 2, uhd: false, downloads: false }),
      plan('Premium', 44.99, { ads: true, streams: 2, uhd: false, downloads: true }),
    ],
    manageUrl: 'https://www.disneyplus.com/account',
  },
  {
    key: 'disney-hulu-max',
    name: 'Disney+, Hulu & HBO Max',
    includes: ['disney-plus', 'hulu', 'hbo-max'],
    plans: [
      plan('With ads', 21.99, { ads: true, streams: 2, uhd: false, downloads: false }),
      plan('No ads', 34.99, { ads: false, streams: 2, uhd: false, downloads: true }),
    ],
    manageUrl: 'https://www.disneyplus.com/account',
  },
];

/** Known plans for a service or bundle in a region, cheapest first. Only US is known today. */
export function plansFor(region: string, key: string): readonly ProviderPlan[] {
  if (region !== 'US') return [];
  const plans = US_PLANS[key] ?? US_BUNDLES.find((bundle) => bundle.key === key)?.plans ?? [];
  return [...plans].sort((a, b) => a.monthlyPriceCents - b.monthlyPriceCents);
}

/** Bundles offered in a region. */
export function bundlesFor(region: string): readonly BundleDefinition[] {
  return region === 'US' ? US_BUNDLES : [];
}

/** A bundle by key (in any region), for subscriptions to it. */
export function bundleByKey(key: string): BundleDefinition | undefined {
  return US_BUNDLES.find((bundle) => bundle.key === key);
}

/** The services a subscription unlocks: a bundle's services, or the service itself. */
export function includedServices(key: string): string[] {
  return [...(bundleByKey(key)?.includes ?? [key])];
}
