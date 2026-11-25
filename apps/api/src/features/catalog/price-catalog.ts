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
  'youtube-tv': [plan('Base plan', 82.99, { ads: true, streams: 3, uhd: false, downloads: false })],
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
  'sling-tv': [
    plan('Orange', 45.99, { ads: true, streams: 1, uhd: false, downloads: false }),
    plan('Blue', 45.99, { ads: true, streams: 3, uhd: false, downloads: false }),
    plan('Orange & Blue', 60.99, { ads: true, streams: 4, uhd: false, downloads: false }),
  ],
  philo: [plan('Philo', 33, { ads: true, streams: 3, uhd: false, downloads: false })],
};

export interface BundleDefinition {
  key: string;
  name: string;
  /** Provider keys of the services it includes. */
  includes: readonly string[];
  plans: readonly ProviderPlan[];
  /** Where it is managed (paused, cancelled), when known. */
  manageUrl: string | null;
}

/**
 * Bundles: on a bundle, "ads" means any of its services shows ads, and screens, 4K and
 * downloads are what every one of its services allows (the weakest).
 */
const US_BUNDLES: readonly BundleDefinition[] = [
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
