import type {
  CatalogProvider,
  OfferingKind,
  ProviderPlan,
  Region,
  TitleSearchResult,
} from '@app/shared';
import type { HouseholdService } from '../household/household.service.ts';
import { manageUrl } from './manage-links.ts';
import { bundleByKey, bundlesFor, plansFor, PRICES_AS_OF } from './price-catalog.ts';
import type { TmdbClient, TmdbTitle } from './tmdb.client.ts';

/** A service or bundle with its plans, as the catalog and the plan use it. */
export interface Offering {
  key: string;
  name: string;
  kind: OfferingKind;
  includes: string[];
  logoPath: string | null;
  plans: ProviderPlan[];
  manageUrl: string | null;
}

/** What can be subscribed to and watched: TMDB's catalog with our price data merged in. */
export function createCatalogService(tmdb: TmdbClient, households: HouseholdService) {
  /**
   * Services and bundles in the household's region; ones with known prices first. A bundle is
   * offered when each of its services streams in the region.
   */
  async function offerings(userId: string): Promise<Offering[]> {
    const { region } = await households.context(userId);
    const providers = await tmdb.providers(region);
    const services: Offering[] = providers.map((provider) => ({
      key: provider.key,
      name: provider.name,
      kind: 'service',
      includes: [provider.key],
      logoPath: provider.logoPath,
      plans: [...plansFor(region, provider.key)],
      manageUrl: manageUrl(provider.key),
    }));
    const available = new Set(services.map((service) => service.key));
    const bundles: Offering[] = bundlesFor(region)
      .filter((bundle) => bundle.includes.every((key) => available.has(key)))
      .map((bundle) => ({
        key: bundle.key,
        name: bundle.name,
        kind: 'bundle',
        includes: [...bundle.includes],
        logoPath: services.find((s) => s.key === bundle.includes[0])?.logoPath ?? null,
        plans: [...plansFor(region, bundle.key)],
        manageUrl: bundle.manageUrl,
      }));
    const all = [...services, ...bundles];
    return [
      ...all.filter((offering) => offering.plans.length > 0),
      ...all.filter((offering) => offering.plans.length === 0),
    ];
  }

  const toCatalogProvider = (offering: Offering): CatalogProvider => ({
    key: offering.key,
    name: offering.name,
    kind: offering.kind,
    includes: offering.includes,
    logoUrl: tmdb.imageUrl(offering.logoPath, 'w92'),
    plans: offering.plans,
    pricesAsOf: offering.plans.length > 0 ? PRICES_AS_OF : null,
    manageUrl: offering.manageUrl,
  });

  return {
    offerings,
    toCatalogProvider,

    async providers(userId: string): Promise<CatalogProvider[]> {
      return (await offerings(userId)).map(toCatalogProvider);
    },

    async provider(userId: string, key: string): Promise<Offering | undefined> {
      return (await offerings(userId)).find((offering) => offering.key === key);
    },

    /**
     * An offering for a subscription even when TMDB can't be reached or no longer lists it:
     * from the bundle definitions and price catalog, named as the subscription is.
     */
    fallbackOffering(
      region: string,
      subscription: { providerKey: string; name: string; logoUrl: string | null },
    ): CatalogProvider {
      const bundle = bundleByKey(subscription.providerKey);
      const plans = [...plansFor(region, subscription.providerKey)];
      return {
        key: subscription.providerKey,
        name: bundle?.name ?? subscription.name,
        kind: bundle ? 'bundle' : 'service',
        includes: [...(bundle?.includes ?? [subscription.providerKey])],
        logoUrl: subscription.logoUrl,
        plans,
        pricesAsOf: plans.length > 0 ? PRICES_AS_OF : null,
        manageUrl: bundle?.manageUrl ?? manageUrl(subscription.providerKey),
      };
    },

    regions(): Promise<Region[]> {
      return tmdb.regions();
    },

    async search(query: string): Promise<TitleSearchResult[]> {
      const titles = rankSearchResults(query, await tmdb.search(query));
      return titles.slice(0, 20).map((title) => ({
        tmdbId: title.tmdbId,
        mediaType: title.mediaType,
        title: title.title,
        year: title.year,
        posterUrl: tmdb.imageUrl(title.posterPath, 'w342'),
        overview: title.overview,
      }));
    },
  };
}

/**
 * TMDB orders search results by text relevance, which often puts obscure titles first. Put
 * exact title matches first, then the most popular, then the newest, so what people are
 * looking for is usually near the top.
 */
function rankSearchResults(query: string, titles: readonly TmdbTitle[]): TmdbTitle[] {
  const wanted = normalizeTitle(query);
  const exact = (title: TmdbTitle) => (normalizeTitle(title.title) === wanted ? 0 : 1);
  return [...titles].sort(
    (a, b) =>
      exact(a) - exact(b) ||
      b.popularity - a.popularity ||
      (b.year ?? 0) - (a.year ?? 0) ||
      a.tmdbId - b.tmdbId,
  );
}

function normalizeTitle(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export type CatalogService = ReturnType<typeof createCatalogService>;
