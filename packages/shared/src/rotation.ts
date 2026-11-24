import { z } from 'zod';
import { ServiceSchema, type ServiceStatus } from './services.ts';
import { WatchlistShowSchema } from './watchlist.ts';

/**
 * - keep: active, and part of the plan
 * - pause: active, but not needed this month (the savings)
 * - resume: paused, but needed for shows on the list
 * - paused: paused, and not needed
 */
export const RotationStateSchema = z.enum(['keep', 'pause', 'resume', 'paused']);
export type RotationState = z.infer<typeof RotationStateSchema>;

export const RotationEntrySchema = z.object({
  service: ServiceSchema,
  state: RotationStateSchema,
  /** Unwatched shows that stream on this service (whether or not it is in the plan). */
  shows: WatchlistShowSchema.array(),
});
export type RotationEntry = z.infer<typeof RotationEntrySchema>;

/** GET /rotation: what to keep, pause and resume this month. */
export const RotationPlanSchema = z.object({
  entries: RotationEntrySchema.array(),
  /** Unwatched shows that stream on none of the household's services. */
  uncovered: WatchlistShowSchema.array(),
  /** What the active services cost now, per month. */
  currentCostCents: z.number().int(),
  /** What the plan's services (keep + resume) cost per month. */
  plannedCostCents: z.number().int(),
  /** Services in the plan, or active now, without a known price (not counted above). */
  unpricedCount: z.number().int(),
});
export type RotationPlan = z.infer<typeof RotationPlanSchema>;

export interface RotationServiceInput {
  id: number;
  providerKey: string;
  status: ServiceStatus;
  monthlyPriceCents: number | null;
}

export interface RotationShowInput {
  id: number;
  providerKeys: readonly string[];
  watched: boolean;
}

export interface RotationResult<S, W> {
  entries: { service: S; state: RotationState; shows: W[] }[];
  uncovered: W[];
  currentCostCents: number;
  plannedCostCents: number;
  unpricedCount: number;
}

/** Above this many candidate subsets the exact search gives way to a greedy one. */
const EXACT_SEARCH_LIMIT = 250_000;

/**
 * Picks the services to have active this month: the fewest that together carry every
 * unwatched show on the list, then the cheapest such set, then the one that resumes the
 * fewest paused services (less churn). A show on several services needs only one of them.
 *
 * Pure and deterministic: the same input always gives the same plan.
 */
export function computeRotation<S extends RotationServiceInput, W extends RotationShowInput>(
  services: readonly S[],
  shows: readonly W[],
): RotationResult<S, W> {
  const ordered = [...services].sort((a, b) => a.id - b.id);
  const indexByKey = new Map(ordered.map((service, index) => [service.providerKey, index]));
  const unwatched = shows.filter((show) => !show.watched);

  const showsByService = ordered.map(() => [] as W[]);
  const uncovered: W[] = [];
  // Each need is the set of services (indices) any one of which would let us watch a show.
  const needs: number[][] = [];
  for (const show of unwatched) {
    const candidates = [
      ...new Set(show.providerKeys.flatMap((key) => indexByKey.get(key) ?? [])),
    ].sort((a, b) => a - b);
    if (candidates.length === 0) {
      uncovered.push(show);
      continue;
    }
    for (const index of candidates) showsByService[index]?.push(show);
    needs.push(candidates);
  }

  const chosen = chooseServices(ordered, dedupeNeeds(needs));

  const entries = ordered.map((service, index) => {
    const inPlan = chosen.has(index);
    const state: RotationState =
      service.status === 'active' ? (inPlan ? 'keep' : 'pause') : inPlan ? 'resume' : 'paused';
    return { service, state, shows: showsByService[index] ?? [] };
  });

  let currentCostCents = 0;
  let plannedCostCents = 0;
  let unpricedCount = 0;
  for (const { service, state } of entries) {
    const active = service.status === 'active';
    const planned = state === 'keep' || state === 'resume';
    if (!active && !planned) continue;
    if (service.monthlyPriceCents === null) {
      unpricedCount += 1;
      continue;
    }
    if (active) currentCostCents += service.monthlyPriceCents;
    if (planned) plannedCostCents += service.monthlyPriceCents;
  }

  return { entries, uncovered, currentCostCents, plannedCostCents, unpricedCount };
}

/** Drops duplicate needs and needs implied by a narrower one (covering it covers them). */
function dedupeNeeds(needs: number[][]): number[][] {
  const unique = [...new Map(needs.map((need) => [need.join(','), need])).values()].sort(
    (a, b) => a.length - b.length,
  );
  const kept: number[][] = [];
  for (const need of unique) {
    const implied = kept.some((narrower) => narrower.every((index) => need.includes(index)));
    if (!implied) kept.push(need);
  }
  return kept;
}

interface Candidate {
  set: number[];
  cost: number;
  resumes: number;
}

function chooseServices(services: readonly RotationServiceInput[], needs: number[][]) {
  const costOf = (index: number) => services[index]?.monthlyPriceCents ?? 0;
  const resumesOf = (index: number) => (services[index]?.status === 'paused' ? 1 : 0);
  const describe = (set: number[]): Candidate => ({
    set,
    cost: set.reduce((sum, index) => sum + costOf(index), 0),
    resumes: set.reduce((sum, index) => sum + resumesOf(index), 0),
  });

  // A show on exactly one service forces that service into the plan.
  const forced = [...new Set(needs.filter((need) => need.length === 1).flat())];
  const open = needs.filter((need) => !need.some((index) => forced.includes(index)));
  const pool = [...new Set(open.flat())].sort((a, b) => a - b);

  const covers = (set: readonly number[]) =>
    open.every((need) => need.some((index) => set.includes(index)));

  let best: Candidate | undefined;
  if (open.length === 0) {
    best = describe([]);
  } else if (searchSize(pool.length) <= EXACT_SEARCH_LIMIT) {
    for (let size = 1; size <= pool.length && !best; size += 1) {
      for (const set of combinations(pool, size)) {
        if (!covers(set)) continue;
        const candidate = describe(set);
        if (!best || isBetter(candidate, best)) best = candidate;
      }
    }
  } else {
    best = describe(greedyCover(open, pool, costOf, resumesOf));
  }

  return new Set([...forced, ...(best?.set ?? [])]);
}

function isBetter(a: Candidate, b: Candidate): boolean {
  if (a.cost !== b.cost) return a.cost < b.cost;
  if (a.resumes !== b.resumes) return a.resumes < b.resumes;
  // Combinations come in lexicographic order, so the first found wins remaining ties.
  return false;
}

/** Upper bound on subsets the exact search may visit for a pool of `n` services. */
function searchSize(n: number): number {
  return n >= 31 ? Number.POSITIVE_INFINITY : 2 ** n;
}

function* combinations(pool: readonly number[], size: number): Generator<number[]> {
  const picked: number[] = [];
  function* pick(start: number): Generator<number[]> {
    if (picked.length === size) {
      yield [...picked];
      return;
    }
    for (let i = start; i <= pool.length - (size - picked.length); i += 1) {
      picked.push(pool[i] ?? 0);
      yield* pick(i + 1);
      picked.pop();
    }
  }
  yield* pick(0);
}

/** Classic greedy set cover: most shows covered first, then cheaper, then already active. */
function greedyCover(
  needs: number[][],
  pool: readonly number[],
  costOf: (index: number) => number,
  resumesOf: (index: number) => number,
): number[] {
  const chosen: number[] = [];
  let remaining = needs;
  while (remaining.length > 0) {
    let pick = pool[0] ?? 0;
    let pickCount = -1;
    for (const index of pool) {
      const count = remaining.filter((need) => need.includes(index)).length;
      const better =
        count > pickCount ||
        (count === pickCount &&
          (costOf(index) < costOf(pick) ||
            (costOf(index) === costOf(pick) && resumesOf(index) < resumesOf(pick))));
      if (better) {
        pick = index;
        pickCount = count;
      }
    }
    chosen.push(pick);
    remaining = remaining.filter((need) => !need.includes(pick));
  }
  return chosen;
}
