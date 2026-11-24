import { computeRotation, type RotationPlan } from '@app/shared';
import type { StreamingServicesService } from '../streaming-services/streaming-services.service.ts';
import type { WatchlistService } from '../watchlist/watchlist.service.ts';

/** This month's plan: which services to keep, pause and resume for the watchlist. */
export function createRotationService(
  services: StreamingServicesService,
  watchlist: WatchlistService,
) {
  return {
    async plan(userId: string): Promise<RotationPlan> {
      await watchlist.refreshStale(userId);
      const [subscriptions, shows] = await Promise.all([
        services.list(userId),
        watchlist.list(userId),
      ]);
      return computeRotation(subscriptions, shows);
    },
  };
}

export type RotationService = ReturnType<typeof createRotationService>;
