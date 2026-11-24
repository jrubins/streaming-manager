import type {
  CatalogProvider,
  HouseholdMember,
  ProviderPlan,
  RotationEntry,
  Service,
  WatchlistShow,
} from '@app/shared';

/** Sample data for stories. Fictional titles; no images, so stories need no network. */

const created = '2026-11-01T12:00:00.000Z';

export function storyService(overrides: Partial<Service> & Pick<Service, 'id' | 'name'>): Service {
  const providerKey = overrides.providerKey ?? overrides.name.toLowerCase().replace(/\W+/g, '-');
  return {
    providerKey,
    includes: [providerKey],
    logoUrl: null,
    planName: 'Standard',
    monthlyPriceCents: 1299,
    priceSource: 'catalog',
    status: 'active',
    manageUrl: null,
    createdAt: created,
    ...overrides,
  };
}

export function storyShow(
  overrides: Partial<WatchlistShow> & Pick<WatchlistShow, 'id' | 'title'>,
): WatchlistShow {
  return {
    tmdbId: 1000 + overrides.id,
    mediaType: 'tv',
    year: 2025,
    posterUrl: null,
    watched: false,
    providerKeys: ['netflix'],
    providersRefreshedAt: created,
    createdAt: created,
    ...overrides,
  };
}

export const SHOWS = {
  harbor: storyShow({ id: 1, title: 'The Long Harbor', providerKeys: ['netflix'] }),
  signal: storyShow({ id: 2, title: 'Signal Fires', providerKeys: ['hbo-max'] }),
  lights: storyShow({ id: 3, title: 'Harbor Lights', providerKeys: ['netflix', 'hulu'] }),
  northbound: storyShow({
    id: 4,
    title: 'Northbound',
    mediaType: 'movie',
    providerKeys: ['netflix', 'peacock'],
  }),
  meridian: storyShow({
    id: 5,
    title: 'The Quiet Meridian',
    mediaType: 'movie',
    providerKeys: ['starz'],
  }),
};

export const SERVICES = {
  netflix: storyService({
    id: 1,
    name: 'Netflix',
    providerKey: 'netflix',
    monthlyPriceCents: 1999,
    manageUrl: 'https://www.netflix.com/account',
  }),
  hulu: storyService({
    id: 2,
    name: 'Hulu',
    providerKey: 'hulu',
    planName: 'With ads',
    monthlyPriceCents: 1249,
    manageUrl: 'https://www.hulu.com/account',
  }),
  max: storyService({
    id: 3,
    name: 'HBO Max',
    providerKey: 'hbo-max',
    planName: 'Basic with ads',
    monthlyPriceCents: 1099,
    status: 'paused',
    manageUrl: 'https://www.hbomax.com/subscription',
  }),
  starz: storyService({
    id: 4,
    name: 'Starz',
    providerKey: 'starz',
    planName: null,
    monthlyPriceCents: null,
    priceSource: null,
    status: 'paused',
  }),
};

const plan = (
  name: string,
  dollars: number,
  features: Partial<Pick<ProviderPlan, 'ads' | 'streams' | 'uhd' | 'downloads'>> = {},
): ProviderPlan => ({
  name,
  monthlyPriceCents: Math.round(dollars * 100),
  ads: false,
  streams: 2,
  uhd: false,
  downloads: false,
  ...features,
});

export const PROVIDERS: CatalogProvider[] = [
  {
    key: 'netflix',
    name: 'Netflix',
    kind: 'service',
    includes: ['netflix'],
    logoUrl: null,
    plans: [
      plan('Standard with ads', 8.99, { ads: true, downloads: true }),
      plan('Standard', 19.99, { downloads: true }),
      plan('Premium', 26.99, { streams: 4, uhd: true, downloads: true }),
    ],
    pricesAsOf: '2026-11-24',
    manageUrl: 'https://www.netflix.com/account',
  },
  {
    key: 'hulu',
    name: 'Hulu',
    kind: 'service',
    includes: ['hulu'],
    logoUrl: null,
    plans: [plan('With ads', 12.49, { ads: true }), plan('No ads', 21.49, { downloads: true })],
    pricesAsOf: '2026-11-24',
    manageUrl: 'https://www.hulu.com/account',
  },
  {
    key: 'disney-hulu-espn-select',
    name: 'Disney+, Hulu & ESPN Select',
    kind: 'bundle',
    includes: ['disney-plus', 'hulu', 'espn-plus'],
    logoUrl: null,
    plans: [
      plan('With ads', 21.99, { ads: true }),
      plan('Premium', 32.99, { ads: true, downloads: true }),
    ],
    pricesAsOf: '2026-11-24',
    manageUrl: 'https://www.disneyplus.com/account',
  },
  {
    key: 'starz',
    name: 'Starz',
    kind: 'service',
    includes: ['starz'],
    logoUrl: null,
    plans: [],
    pricesAsOf: null,
    manageUrl: null,
  },
];

const offeringOf = (key: string) => {
  const provider = PROVIDERS.find((p) => p.key === key);
  if (!provider) throw new Error(`No story provider ${key}`);
  return {
    key: provider.key,
    name: provider.name,
    kind: provider.kind,
    includes: provider.includes,
    logoUrl: provider.logoUrl,
    manageUrl: provider.manageUrl,
  };
};

/** A plan row: an entry of GET /rotation, with sensible defaults. */
export function storyEntry(
  overrides: Partial<RotationEntry> & Pick<RotationEntry, 'state'> & { key: string },
): RotationEntry {
  const { key, ...rest } = overrides;
  return {
    offering: offeringOf(key),
    service: null,
    plan: null,
    planChange: false,
    plannedCostCents: null,
    shows: [],
    ...rest,
  };
}

export const MEMBERS: HouseholdMember[] = [
  { userId: 'user_1', displayName: 'Alex Lee', joinedAt: created, isYou: true },
  {
    userId: 'user_2',
    displayName: 'Sam Rivera',
    joinedAt: '2026-11-03T09:00:00.000Z',
    isYou: false,
  },
];
