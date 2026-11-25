import type {
  CatalogProvider,
  ChannelCatalog,
  OfferingKind,
  Offers,
  ProviderPlan,
  Region,
  TitleSearchResult,
} from '@app/shared';
import type { HouseholdService } from '../household/household.service.ts';
import { CHANNEL_LOOKUPS, CHANNELS_AS_OF, channelsFor } from './channel-catalog.ts';
import { manageUrl } from './manage-links.ts';
import { offersFor, PERKS_AS_OF } from './perk-catalog.ts';
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
    const definitions = bundlesFor(region);
    // A standalone offering replaces TMDB's entry of the same key (keeping its logo), and
    // Sling's packages replace TMDB's single "Sling TV".
    const replaced = new Set([
      'sling-tv',
      ...definitions.filter((d) => d.standalone).map((d) => d.key),
    ]);
    const logoOf = (key: string) => services.find((s) => s.key === key)?.logoPath ?? null;
    const bundles: Offering[] = definitions
      .filter((bundle) => bundle.standalone || bundle.includes.every((key) => available.has(key)))
      .map((bundle) => ({
        key: bundle.key,
        name: bundle.name,
        kind: bundle.kind ?? 'bundle',
        includes: [...bundle.includes],
        logoPath:
          [bundle.key, ...bundle.includes].map(logoOf).find((path) => path !== null) ?? null,
        plans: [...plansFor(region, bundle.key)],
        manageUrl: bundle.manageUrl,
      }));
    const kept = services.filter((service) => !replaced.has(service.key));
    const all = [...kept, ...bundles];
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

    /** Live channels and league passes, with the services that carry each. */
    async channels(userId: string): Promise<ChannelCatalog> {
      const { region } = await households.context(userId);
      return {
        channels: [...channelsFor(region)],
        lookups: region === 'US' ? CHANNEL_LOOKUPS : [],
        asOf: CHANNELS_AS_OF,
      };
    },

    /** Streaming perks of other memberships in the household's region. */
    async offers(userId: string): Promise<Offers> {
      const { region } = await households.context(userId);
      return { ...offersFor(region), asOf: PERKS_AS_OF };
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
