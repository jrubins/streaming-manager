import * as Sentry from '@sentry/node';
import {
  optimizePlan,
  planAlternatives,
  type CatalogProvider,
  type OptimizerOffering,
  type RotationPlan,
} from '@app/shared';
import { HttpError } from '../../lib/http-error.ts';
import type { CatalogService } from '../catalog/catalog.service.ts';
import type { HouseholdService } from '../household/household.service.ts';
import type { StreamingServicesService } from '../streaming-services/streaming-services.service.ts';
import type { WatchlistService } from '../watchlist/watchlist.service.ts';

/**
 * This month's plan: the cheapest set of subscriptions, each on its cheapest plan that meets
 * the household's preferences, that carries the unwatched watchlist; plus what it would cost
 * under other preferences.
 */
export function createRotationService(
  households: HouseholdService,
  catalog: CatalogService,
  services: StreamingServicesService,
  watchlist: WatchlistService,
) {
  /** The region's catalog; without TMDB (unconfigured or down), only what's subscribed. */
  async function regionCatalog(userId: string): Promise<CatalogProvider[]> {
    try {
      return await catalog.providers(userId);
    } catch (error) {
      if (!(error instanceof HttpError && error.code === 'tmdb_unavailable')) {
        Sentry.captureException(error);
      }
      return [];
    }
  }

  return {
    async plan(userId: string): Promise<RotationPlan> {
      await watchlist.refreshStale(userId);
      const [{ region }, preferences, subscriptions, shows, available] = await Promise.all([
        households.context(userId),
        households.preferences(userId),
        services.list(userId),
        watchlist.list(userId),
        regionCatalog(userId),
      ]);

      const offerings: OptimizerOffering[] = [...available];
      for (const subscription of subscriptions) {
        if (!offerings.some((offering) => offering.key === subscription.providerKey)) {
          offerings.push(catalog.fallbackOffering(region, subscription));
        }
      }

      const input = { subscriptions, offerings, shows, preferences };
      const plan = optimizePlan(input);
      return { preferences, ...plan, alternatives: planAlternatives(input, plan) };
    },
  };
}

export type RotationService = ReturnType<typeof createRotationService>;
