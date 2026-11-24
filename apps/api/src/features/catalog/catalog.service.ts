import type { CatalogProvider, ProviderPlan, Region, TitleSearchResult } from '@app/shared';
import type { HouseholdService } from '../household/household.service.ts';
import { manageUrl } from './manage-links.ts';
import { plansFor, PRICES_AS_OF } from './price-catalog.ts';
import type { TmdbClient, TmdbProvider } from './tmdb.client.ts';

export interface PricedProvider extends TmdbProvider {
  plans: ProviderPlan[];
}

/** What can be subscribed to and watched: TMDB's catalog with our price data merged in. */
export function createCatalogService(tmdb: TmdbClient, households: HouseholdService) {
  /** Streaming services in the household's region; ones with known prices first. */
  async function priced(userId: string): Promise<PricedProvider[]> {
    const { region } = await households.context(userId);
    const providers = (await tmdb.providers(region)).map((provider) => ({
      ...provider,
      plans: [...plansFor(region, provider.key)],
    }));
    return [
      ...providers.filter((provider) => provider.plans.length > 0),
      ...providers.filter((provider) => provider.plans.length === 0),
    ];
  }

  return {
    async providers(userId: string): Promise<CatalogProvider[]> {
      return (await priced(userId)).map((provider) => ({
        key: provider.key,
        name: provider.name,
        logoUrl: tmdb.imageUrl(provider.logoPath, 'w92'),
        plans: provider.plans,
        pricesAsOf: provider.plans.length > 0 ? PRICES_AS_OF : null,
        manageUrl: manageUrl(provider.key),
      }));
    },

    async provider(userId: string, key: string): Promise<PricedProvider | undefined> {
      return (await priced(userId)).find((provider) => provider.key === key);
    },

    regions(): Promise<Region[]> {
      return tmdb.regions();
    },

    async search(query: string): Promise<TitleSearchResult[]> {
      const titles = await tmdb.search(query);
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

export type CatalogService = ReturnType<typeof createCatalogService>;
