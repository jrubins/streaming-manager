import * as Sentry from '@sentry/node';
import {
  optimizePlan,
  planAlternatives,
  isoToday,
  perkActive,
  type CatalogProvider,
  type OptimizerOffering,
  type PerkOffer,
  type ProviderPlan,
  type RotationPlan,
} from '@app/shared';
import { HttpError } from '../../lib/http-error.ts';
import type { CatalogService } from '../catalog/catalog.service.ts';
import { offersFor } from '../catalog/perk-catalog.ts';
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
      const [{ region }, preferences, serviceList, shows, available, { memberships }] =
        await Promise.all([
          households.context(userId),
          households.preferences(userId),
          services.list(userId),
          watchlist.list(userId),
          regionCatalog(userId),
          households.memberships(userId),
        ]);

      // A perk past its last day no longer applies: the service costs its regular price.
      const today = isoToday();
      const subscriptions = serviceList.map((service) => ({
        ...service,
        perk: perkActive(service.perk, today) ? service.perk : null,
      }));

      const offerings: OptimizerOffering[] = withMembershipPerks(
        available,
        offersFor(region).offers,
        new Set(memberships),
      );
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

/**
 * Each offering, with an extra plan for every perk of a membership the household has: the
 * perk's plan features at the perk's price ("Premium (Walmart+)", $0).
 */
function withMembershipPerks(
  available: readonly CatalogProvider[],
  offers: readonly PerkOffer[],
  memberships: ReadonlySet<string>,
): OptimizerOffering[] {
  return available.map((offering) => {
    const perkPlans: ProviderPlan[] = offers.flatMap((offer) => {
      if (offer.providerKey !== offering.key || !memberships.has(offer.membershipKey)) return [];
      if (offer.monthlyPriceCents === null) return [];
      const base = offering.plans.find((plan) => plan.name === offer.planName);
      if (!base) return [];
      return [
        {
          ...base,
          name: `${base.name} (${offer.membershipName})`,
          monthlyPriceCents: offer.monthlyPriceCents,
          perk: { offerId: offer.id, via: offer.membershipName, url: offer.url },
        },
      ];
    });
    return perkPlans.length === 0
      ? offering
      : { ...offering, plans: [...offering.plans, ...perkPlans] };
  });
}

export type RotationService = ReturnType<typeof createRotationService>;
