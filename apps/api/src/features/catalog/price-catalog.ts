import type { ProviderPlan } from '@app/shared';

/**
 * Published monthly prices (USD) of the most common US streaming plans, keyed by provider
 * key. Prices change often: update them and `PRICES_AS_OF` together. Members can always
 * override a service's price, and forwarded invoices take precedence.
 *
 * Sources (checked 2026-11-24): the services' plan pages via cloudwards.net,
 * smarttvs.org, comparesubscriptions.com and applescoop.org price comparisons.
 */
export const PRICES_AS_OF = '2026-11-24';

export const US_PRICE_CATALOG: Readonly<Record<string, readonly ProviderPlan[]>> = {
  netflix: [
    { name: 'Standard with ads', monthlyPriceCents: 899 },
    { name: 'Standard', monthlyPriceCents: 1999 },
    { name: 'Premium', monthlyPriceCents: 2699 },
  ],
  hulu: [
    { name: 'With ads', monthlyPriceCents: 1249 },
    { name: 'No ads', monthlyPriceCents: 2149 },
  ],
  'disney-plus': [
    { name: 'Basic (with ads)', monthlyPriceCents: 1249 },
    { name: 'Premium', monthlyPriceCents: 2149 },
  ],
  'hbo-max': [
    { name: 'Basic with ads', monthlyPriceCents: 1099 },
    { name: 'Standard', monthlyPriceCents: 1849 },
    { name: 'Premium', monthlyPriceCents: 2299 },
  ],
  peacock: [
    { name: 'Select', monthlyPriceCents: 899 },
    { name: 'Premium', monthlyPriceCents: 1299 },
    { name: 'Premium Plus', monthlyPriceCents: 1999 },
  ],
  'paramount-plus': [
    { name: 'Essential', monthlyPriceCents: 899 },
    { name: 'Premium', monthlyPriceCents: 1399 },
  ],
  'amazon-prime-video': [
    { name: 'Prime Video (with ads)', monthlyPriceCents: 899 },
    { name: 'Prime Video ad-free', monthlyPriceCents: 1398 },
  ],
  'apple-tv-plus': [{ name: 'Monthly', monthlyPriceCents: 1499 }],
};

/** Known plans for a provider in a region, cheapest first. Only US prices are known today. */
export function plansFor(region: string, key: string): readonly ProviderPlan[] {
  if (region !== 'US') return [];
  return [...(US_PRICE_CATALOG[key] ?? [])].sort(
    (a, b) => a.monthlyPriceCents - b.monthlyPriceCents,
  );
}
