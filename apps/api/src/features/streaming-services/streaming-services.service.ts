import type { Db } from '@app/db';
import type { CreateService, PriceSource, Service, ServicePerk, UpdateService } from '@app/shared';
import { isUniqueViolation } from '../../lib/db-errors.ts';
import { HttpError, notFound } from '../../lib/http-error.ts';
import type { CatalogService } from '../catalog/catalog.service.ts';
import { manageUrl } from '../catalog/manage-links.ts';
import { bundleByKey, includedServices } from '../catalog/price-catalog.ts';
import type { TmdbClient } from '../catalog/tmdb.client.ts';
import type { HouseholdService } from '../household/household.service.ts';

interface ServiceRow {
  id: number;
  providerKey: string;
  name: string;
  logoPath: string | null;
  planName: string | null;
  monthlyPriceCents: number | null;
  priceSource: PriceSource | null;
  status: 'active' | 'paused';
  perkVia: string | null;
  perkPriceCents: number | null;
  perkEndsOn: string | null;
  alwaysKeep: boolean;
  createdAt: Date;
}

const perkOf = (row: ServiceRow): ServicePerk | null =>
  row.perkVia === null
    ? null
    : { via: row.perkVia, monthlyPriceCents: row.perkPriceCents ?? 0, endsOn: row.perkEndsOn };

const perkColumns = (perk: ServicePerk | null) => ({
  perkVia: perk?.via ?? null,
  perkPriceCents: perk?.monthlyPriceCents ?? null,
  perkEndsOn: perk?.endsOn ?? null,
});

/** The household's streaming subscriptions and their prices. */
export function createStreamingServicesService(
  db: Db,
  households: HouseholdService,
  catalog: CatalogService,
  tmdb: TmdbClient,
) {
  const Rows = db.orm.public.Service;

  const toService = (row: ServiceRow): Service => ({
    id: row.id,
    providerKey: row.providerKey,
    name: row.name,
    includes: includedServices(row.providerKey),
    logoUrl: tmdb.imageUrl(row.logoPath, 'w92'),
    planName: row.planName,
    monthlyPriceCents: row.monthlyPriceCents,
    priceSource: row.priceSource,
    status: row.status,
    perk: perkOf(row),
    alwaysKeep: row.alwaysKeep,
    manageUrl: bundleByKey(row.providerKey)?.manageUrl ?? manageUrl(row.providerKey),
    createdAt: row.createdAt.toISOString(),
  });

  async function find(householdId: number, id: number): Promise<ServiceRow> {
    const row = await Rows.where({ id, householdId }).first();
    if (!row) throw notFound(`Service ${id} not found`);
    return row;
  }

  return {
    async list(userId: string): Promise<Service[]> {
      const { id: householdId } = await households.context(userId);
      const rows = await Rows.where({ householdId })
        .orderBy([(s) => s.name.asc(), (s) => s.id.asc()])
        .limit(200)
        .all();
      return rows.map(toService);
    },

    async create(userId: string, input: CreateService): Promise<Service> {
      const { id: householdId } = await households.context(userId);
      const provider = await catalog.provider(userId, input.providerKey);
      if (!provider) {
        throw new HttpError(
          400,
          'unknown_provider',
          'That service is not available in your region',
        );
      }
      // A named plan's catalog price, else the cheapest plan's, unless a price was typed.
      const plan =
        provider.plans.find((p) => p.name === input.planName) ??
        (input.planName === undefined ? provider.plans[0] : undefined);
      const typed = input.monthlyPriceCents !== undefined;
      try {
        const row = await Rows.create({
          householdId,
          providerKey: provider.key,
          name: provider.name,
          logoPath: provider.logoPath,
          planName: input.planName ?? plan?.name ?? null,
          monthlyPriceCents: typed
            ? (input.monthlyPriceCents ?? null)
            : (plan?.monthlyPriceCents ?? null),
          priceSource: typed ? 'manual' : plan ? 'catalog' : null,
          status: input.status ?? 'active',
          ...perkColumns(input.perk ?? null),
        });
        return toService(row);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new HttpError(409, 'already_added', `${provider.name} is already in your services`);
        }
        throw error;
      }
    },

    async update(userId: string, id: number, input: UpdateService): Promise<Service> {
      const { id: householdId } = await households.context(userId);
      const current = await find(householdId, id);
      const provider = input.planName
        ? await catalog.provider(userId, current.providerKey)
        : undefined;
      const plan = provider?.plans.find((p) => p.name === input.planName);

      const changes: Partial<Omit<ServiceRow, 'id' | 'createdAt'>> = {};
      if (input.status !== undefined) changes.status = input.status;
      if (input.perk !== undefined) Object.assign(changes, perkColumns(input.perk));
      if (input.alwaysKeep !== undefined) changes.alwaysKeep = input.alwaysKeep;
      if (input.planName !== undefined) changes.planName = input.planName;
      if (input.monthlyPriceCents !== undefined) {
        changes.monthlyPriceCents = input.monthlyPriceCents;
        changes.priceSource = input.monthlyPriceCents === null ? null : 'manual';
      } else if (plan) {
        // Picking a catalog plan without a price fills in the plan's price.
        changes.monthlyPriceCents = plan.monthlyPriceCents;
        changes.priceSource = 'catalog';
      }
      if (Object.keys(changes).length === 0) return toService(current);
      const row = await Rows.where({ id, householdId }).update(changes);
      if (!row) throw notFound(`Service ${id} not found`);
      return toService(row);
    },

    async remove(userId: string, id: number): Promise<void> {
      const { id: householdId } = await households.context(userId);
      const deleted = await Rows.where({ id, householdId }).delete();
      if (!deleted) throw notFound(`Service ${id} not found`);
    },
  };
}

export type StreamingServicesService = ReturnType<typeof createStreamingServicesService>;
