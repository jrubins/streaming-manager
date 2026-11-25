import type { Membership, PerkOffer } from '@app/shared';

/**
 * Streaming perks that come with other memberships, in the US. Offers change often, and
 * many depend on the exact plan, so each links to its terms. Prices are what the household
 * pays for the service with the perk; null is a statement credit that varies.
 * Re-check, and update PERKS_AS_OF, every few months.
 */
export const PERKS_AS_OF = '2026-11-24';

export const MEMBERSHIPS: readonly Membership[] = [
  { key: 'xfinity', name: 'Xfinity', category: 'internet' },
  { key: 'spectrum', name: 'Spectrum TV', category: 'internet' },
  { key: 't-mobile', name: 'T-Mobile', category: 'mobile' },
  { key: 'verizon', name: 'Verizon', category: 'mobile' },
  { key: 'walmart-plus', name: 'Walmart+', category: 'shopping' },
  { key: 'instacart-plus', name: 'Instacart+', category: 'shopping' },
  { key: 'dashpass', name: 'DoorDash DashPass', category: 'shopping' },
  { key: 'amazon-prime', name: 'Amazon Prime', category: 'shopping' },
  { key: 'amex-platinum', name: 'Amex Platinum', category: 'card' },
  { key: 'chase-sapphire-preferred', name: 'Chase Sapphire Preferred', category: 'card' },
  { key: 'chase-sapphire-reserve', name: 'Chase Sapphire Reserve', category: 'card' },
];

type OfferDef = Omit<PerkOffer, 'membershipName' | 'providerName'>;

const OFFERS: readonly OfferDef[] = [
  {
    id: 'xfinity-peacock',
    membershipKey: 'xfinity',
    providerKey: 'peacock',
    planName: 'Premium',
    monthlyPriceCents: 0,
    summary:
      'Peacock Premium is free for up to 2 years with Xfinity Gigabit Internet or faster. ' +
      'StreamSaver (Netflix, Apple TV and Peacock, with ads) is a separate add-on.',
    url: 'https://www.xfinity.com/learn/digital-cable-tv/peacock',
  },
  {
    id: 'spectrum-disney-hulu-espn',
    membershipKey: 'spectrum',
    providerKey: 'disney-hulu-espn-select',
    planName: 'With ads',
    monthlyPriceCents: 0,
    summary: 'Spectrum TV Select includes Disney+, Hulu and ESPN Select with ads.',
    url: 'https://www.spectrum.com/cable-tv/streaming-apps',
  },
  {
    id: 'spectrum-hbo-max',
    membershipKey: 'spectrum',
    providerKey: 'hbo-max',
    planName: 'Basic with ads',
    monthlyPriceCents: 0,
    summary: 'Spectrum TV Select includes HBO Max Basic with ads.',
    url: 'https://www.spectrum.com/cable-tv/streaming-apps',
  },
  {
    id: 'spectrum-peacock',
    membershipKey: 'spectrum',
    providerKey: 'peacock',
    planName: 'Premium',
    monthlyPriceCents: 0,
    summary: 'Spectrum TV Select includes Peacock Premium.',
    url: 'https://www.spectrum.com/cable-tv/streaming-apps',
  },
  {
    id: 'spectrum-paramount-plus',
    membershipKey: 'spectrum',
    providerKey: 'paramount-plus',
    planName: 'Essential',
    monthlyPriceCents: 0,
    summary: 'Spectrum TV Select includes Paramount+ Essential.',
    url: 'https://www.spectrum.com/cable-tv/streaming-apps',
  },
  {
    id: 't-mobile-netflix',
    membershipKey: 't-mobile',
    providerKey: 'netflix',
    planName: 'Standard with ads',
    monthlyPriceCents: 0,
    summary:
      'Netflix Standard with ads is included with many higher-tier unlimited plans. Check ' +
      'your plan.',
    url: 'https://www.t-mobile.com/tv-streaming/netflix-on-us',
  },
  {
    id: 't-mobile-apple-tv',
    membershipKey: 't-mobile',
    providerKey: 'apple-tv-plus',
    planName: 'Monthly',
    monthlyPriceCents: 0,
    summary: 'Apple TV is included with Experience Beyond and Go5G Next.',
    url: 'https://www.t-mobile.com/tv-streaming/apple-tv-plus',
  },
  {
    id: 't-mobile-hulu',
    membershipKey: 't-mobile',
    providerKey: 'hulu',
    planName: 'With ads',
    monthlyPriceCents: 0,
    summary: 'Hulu with ads is included with Experience Beyond and Go5G Next.',
    url: 'https://www.t-mobile.com/tv-streaming/hulu-on-us',
  },
  {
    id: 'verizon-disney-hulu-espn',
    membershipKey: 'verizon',
    providerKey: 'disney-hulu-espn-select',
    planName: 'With ads',
    monthlyPriceCents: 1000,
    summary: 'A myPlan perk: Disney+, Hulu and ESPN Select with ads for $10 a month.',
    url: 'https://www.verizon.com/plans/perks/',
  },
  {
    id: 'verizon-netflix-max',
    membershipKey: 'verizon',
    providerKey: 'hbo-max',
    planName: 'Basic with ads',
    monthlyPriceCents: 1300,
    summary: 'A myPlan perk: Netflix and HBO Max with ads together for $13 a month.',
    url: 'https://www.verizon.com/plans/perks/',
  },
  {
    id: 'walmart-plus-paramount',
    membershipKey: 'walmart-plus',
    providerKey: 'paramount-plus',
    planName: 'Essential',
    monthlyPriceCents: 0,
    summary:
      'Walmart+ includes Paramount+ Essential or Peacock Premium (your choice, switchable ' +
      'every 90 days).',
    url: 'https://www.walmart.com/plus/benefits',
  },
  {
    id: 'walmart-plus-peacock',
    membershipKey: 'walmart-plus',
    providerKey: 'peacock',
    planName: 'Premium',
    monthlyPriceCents: 0,
    summary:
      'Walmart+ includes Peacock Premium or Paramount+ Essential (your choice, switchable ' +
      'every 90 days).',
    url: 'https://www.walmart.com/plus/benefits',
  },
  {
    id: 'instacart-plus-peacock',
    membershipKey: 'instacart-plus',
    providerKey: 'peacock',
    planName: 'Premium',
    monthlyPriceCents: 0,
    summary: 'Instacart+ includes Peacock Premium for members not already subscribed to Peacock.',
    url: 'https://www.instacart.com/instacart-plus',
  },
  {
    id: 'dashpass-hbo-max',
    membershipKey: 'dashpass',
    providerKey: 'hbo-max',
    planName: 'Basic with ads',
    monthlyPriceCents: 0,
    summary: 'Annual DashPass includes HBO Max Basic with ads.',
    url: 'https://www.doordash.com/dashpass/',
  },
  {
    id: 'amazon-prime-video',
    membershipKey: 'amazon-prime',
    providerKey: 'amazon-prime-video',
    planName: 'Prime Video (with ads)',
    monthlyPriceCents: 0,
    summary: 'Prime Video with ads comes with an Amazon Prime membership.',
    url: 'https://www.amazon.com/amazonprime',
  },
  {
    id: 'amex-platinum-disney',
    membershipKey: 'amex-platinum',
    providerKey: 'disney-plus',
    planName: null,
    monthlyPriceCents: null,
    summary: 'A monthly digital entertainment credit covers Disney+, Hulu, ESPN, Peacock and more.',
    url: 'https://www.americanexpress.com/us/credit-cards/card/platinum/',
  },
  {
    id: 'amex-platinum-peacock',
    membershipKey: 'amex-platinum',
    providerKey: 'peacock',
    planName: null,
    monthlyPriceCents: null,
    summary: 'The monthly digital entertainment credit also covers Peacock.',
    url: 'https://www.americanexpress.com/us/credit-cards/card/platinum/',
  },
  {
    id: 'chase-sapphire-preferred-apple-tv',
    membershipKey: 'chase-sapphire-preferred',
    providerKey: 'apple-tv-plus',
    planName: 'Monthly',
    monthlyPriceCents: 0,
    summary:
      'A free year of Apple TV when activated by Dec 31, 2026 (or $7.50/mo off Apple One). ' +
      'Set the end date on the service.',
    url: 'https://media.chase.com/news/Meet-the-New-Chase-Sapphire-Preferred',
  },
  {
    id: 'chase-sapphire-reserve-apple-tv',
    membershipKey: 'chase-sapphire-reserve',
    providerKey: 'apple-tv-plus',
    planName: 'Monthly',
    monthlyPriceCents: 0,
    summary:
      'Sapphire Reserve cardholders get Apple TV and Apple Music at no cost (or $15/mo off ' +
      'Apple One).',
    url: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve',
  },
];

const PROVIDER_NAMES: Record<string, string> = {
  netflix: 'Netflix',
  hulu: 'Hulu',
  'disney-plus': 'Disney+',
  'hbo-max': 'HBO Max',
  peacock: 'Peacock',
  'paramount-plus': 'Paramount+',
  'amazon-prime-video': 'Prime Video',
  'apple-tv-plus': 'Apple TV',
  'disney-hulu-espn-select': 'Disney+, Hulu & ESPN Select',
};

/** The perks offered in a region (only the US so far), with display names filled in. */
export function offersFor(region: string): { memberships: Membership[]; offers: PerkOffer[] } {
  if (region !== 'US') return { memberships: [], offers: [] };
  const names = new Map(MEMBERSHIPS.map((m) => [m.key, m.name]));
  return {
    memberships: [...MEMBERSHIPS],
    offers: OFFERS.map((offer) => ({
      ...offer,
      membershipName: names.get(offer.membershipKey) ?? offer.membershipKey,
      providerName: PROVIDER_NAMES[offer.providerKey] ?? offer.providerKey,
    })),
  };
}
