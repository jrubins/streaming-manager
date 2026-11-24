import type { CatalogProvider, HouseholdMember, Service, WatchlistShow } from '@app/shared';

/** Sample data for stories. Fictional titles; no images, so stories need no network. */

const created = '2026-11-01T12:00:00.000Z';

export function storyService(overrides: Partial<Service> & Pick<Service, 'id' | 'name'>): Service {
  return {
    providerKey: overrides.name.toLowerCase().replace(/\W+/g, '-'),
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

export const PROVIDERS: CatalogProvider[] = [
  {
    key: 'netflix',
    name: 'Netflix',
    logoUrl: null,
    plans: [
      { name: 'Standard with ads', monthlyPriceCents: 899 },
      { name: 'Standard', monthlyPriceCents: 1999 },
      { name: 'Premium', monthlyPriceCents: 2699 },
    ],
    pricesAsOf: '2026-11-24',
    manageUrl: 'https://www.netflix.com/account',
  },
  {
    key: 'hulu',
    name: 'Hulu',
    logoUrl: null,
    plans: [
      { name: 'With ads', monthlyPriceCents: 1249 },
      { name: 'No ads', monthlyPriceCents: 2149 },
    ],
    pricesAsOf: '2026-11-24',
    manageUrl: 'https://www.hulu.com/account',
  },
  {
    key: 'starz',
    name: 'Starz',
    logoUrl: null,
    plans: [],
    pricesAsOf: null,
    manageUrl: null,
  },
];

export const MEMBERS: HouseholdMember[] = [
  { userId: 'user_1', displayName: 'Alex Lee', joinedAt: created, isYou: true },
  {
    userId: 'user_2',
    displayName: 'Sam Rivera',
    joinedAt: '2026-11-03T09:00:00.000Z',
    isYou: false,
  },
];
