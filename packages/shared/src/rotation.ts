import { z } from 'zod';
import {
  OfferingKindSchema,
  ProviderPlanSchema,
  type OfferingKind,
  type ProviderPlan,
} from './catalog.ts';
import {
  PreferencesSchema,
  UpdatePreferencesSchema,
  planMeets,
  type Preferences,
} from './preferences.ts';
import { ServiceSchema, type ServiceStatus } from './services.ts';
import { WatchlistShowSchema } from './watchlist.ts';

/**
 * - keep: active, and part of the plan (possibly on a different plan, see `planChange`)
 * - pause: active, but not in the plan (the savings)
 * - resume: paused, but in the plan
 * - paused: paused, and not in the plan
 * - subscribe: not subscribed yet, but the cheapest way to watch part of the list
 */
export const RotationStateSchema = z.enum(['keep', 'pause', 'resume', 'paused', 'subscribe']);
export type RotationState = z.infer<typeof RotationStateSchema>;

/** A service or bundle as the plan shows it. */
export const PlanOfferingSchema = z.object({
  key: z.string(),
  name: z.string(),
  kind: OfferingKindSchema,
  includes: z.string().array(),
  logoUrl: z.string().nullable(),
  manageUrl: z.string().nullable(),
});
export type PlanOffering = z.infer<typeof PlanOfferingSchema>;

export const RotationEntrySchema = z.object({
  offering: PlanOfferingSchema,
  /** The household's subscription to it, if they have one. */
  service: ServiceSchema.nullable(),
  state: RotationStateSchema,
  /** The plan to be on this month (in the plan), or null (out of it, or plans unknown). */
  plan: ProviderPlanSchema.nullable(),
  /** The plan differs from the one the household is on. */
  planChange: z.boolean(),
  /** What it costs per month in the plan, or null (out of it, or price unknown). */
  plannedCostCents: z.number().int().nullable(),
  /** Unwatched titles that stream on it (whether or not it is in the plan). */
  shows: WatchlistShowSchema.array(),
});
export type RotationEntry = z.infer<typeof RotationEntrySchema>;

/** The same list under different preferences, as a one-click alternative. */
export const PlanAlternativeSchema = z.object({
  id: z.enum(['no-ads', 'allow-ads', 'owned-only', 'new-services', 'more-screens', 'uhd']),
  label: z.string(),
  /** What would be different, e.g. "Netflix: Standard · Hulu: No ads · without Peacock". */
  changes: z.string(),
  plannedCostCents: z.number().int(),
  /** Versus this plan: positive costs more. */
  deltaCents: z.number().int(),
  uncoveredCount: z.number().int(),
  /** The preferences to apply to get it. */
  preferences: UpdatePreferencesSchema,
});
export type PlanAlternative = z.infer<typeof PlanAlternativeSchema>;

/** GET /rotation: this month's plan. */
export const RotationPlanSchema = z.object({
  preferences: PreferencesSchema,
  entries: RotationEntrySchema.array(),
  /** Unwatched titles no plan meeting the preferences can cover. */
  uncovered: WatchlistShowSchema.array(),
  /** What the active subscriptions cost now, per month. */
  currentCostCents: z.number().int(),
  /** What the plan costs per month. */
  plannedCostCents: z.number().int(),
  /** Subscriptions in the plan, or active now, without a known price (not counted above). */
  unpricedCount: z.number().int(),
  alternatives: PlanAlternativeSchema.array(),
});
export type RotationPlan = z.infer<typeof RotationPlanSchema>;

export interface OptimizerOffering {
  key: string;
  name: string;
  kind: OfferingKind;
  includes: readonly string[];
  logoUrl: string | null;
  manageUrl: string | null;
  plans: readonly ProviderPlan[];
}

export interface OptimizerSubscription {
  id: number;
  /** The offering subscribed to. */
  providerKey: string;
  planName: string | null;
  monthlyPriceCents: number | null;
  status: ServiceStatus;
}

export interface OptimizerShow {
  id: number;
  providerKeys: readonly string[];
  watched: boolean;
}

export interface OptimizerInput<S, W> {
  /** The household's subscriptions. Each needs an offering below with its key. */
  subscriptions: readonly S[];
  /** Everything subscribable in the region, including every subscribed offering. */
  offerings: readonly OptimizerOffering[];
  shows: readonly W[];
  preferences: Preferences;
}

export interface OptimizedEntry<S, W> {
  offering: PlanOffering;
  service: S | null;
  state: RotationState;
  plan: ProviderPlan | null;
  planChange: boolean;
  plannedCostCents: number | null;
  shows: W[];
}

export interface OptimizedPlan<S, W> {
  entries: OptimizedEntry<S, W>[];
  uncovered: W[];
  currentCostCents: number;
  plannedCostCents: number;
  unpricedCount: number;
}

/** A way to watch part of the list: one offering, on its best plan under the preferences. */
interface Candidate<S> {
  offering: OptimizerOffering;
  service: S | null;
  plan: ProviderPlan | null;
  planChange: boolean;
  /** Monthly cost; null when unknown (counted as 0, and reported as unpriced). */
  cost: number | null;
  /** Changes the household makes if this is in the plan. */
  changesIfChosen: number;
  /** Changes if it's left out (pausing an active subscription). */
  changesIfLeft: number;
}

/** Above this many candidates in play, the exact search gives way to a greedy one. */
const EXACT_POOL_LIMIT = 20;

const STATE_ORDER: Record<RotationState, number> = {
  resume: 0,
  subscribe: 1,
  pause: 2,
  keep: 3,
  paused: 4,
};

/**
 * This month's plan: the cheapest set of subscriptions (each on its cheapest plan that meets
 * the preferences) that carries every unwatched title it can. Ties go to the set with the
 * fewest changes from what the household has (pauses, resumes, plan switches, new
 * subscriptions), then to the fewest subscriptions. A title needs only one of the services it
 * streams on; a bundle covers each of its services.
 *
 * Pure and deterministic: the same input always gives the same plan.
 */
export function optimizePlan<S extends OptimizerSubscription, W extends OptimizerShow>(
  input: OptimizerInput<S, W>,
): OptimizedPlan<S, W> {
  const { preferences } = input;
  const offerings = [...input.offerings].sort((a, b) => a.key.localeCompare(b.key));
  const subscriptionByKey = new Map(input.subscriptions.map((s) => [s.providerKey, s]));

  const candidates: Candidate<S>[] = [];
  for (const offering of offerings) {
    const service = subscriptionByKey.get(offering.key) ?? null;
    const candidate = toCandidate(offering, service, preferences);
    if (candidate) candidates.push(candidate);
  }

  const unwatched = input.shows.filter((show) => !show.watched);
  const covers = (offering: OptimizerOffering, show: W) =>
    show.providerKeys.some((key) => offering.includes.includes(key));

  const uncovered: W[] = [];
  const needs: number[][] = [];
  for (const show of unwatched) {
    const options = candidates.flatMap((c, index) => (covers(c.offering, show) ? [index] : []));
    if (options.length === 0) uncovered.push(show);
    else needs.push(options);
  }

  const chosen = chooseCandidates(candidates, needs);

  const entries: OptimizedEntry<S, W>[] = [];
  const listed = new Set<string>();
  candidates.forEach((candidate, index) => {
    const inPlan = chosen.has(index);
    if (!inPlan && !candidate.service) return;
    const { offering, service } = candidate;
    listed.add(offering.key);
    entries.push({
      offering: toPlanOffering(offering),
      service,
      state: stateOf(service, inPlan),
      plan: inPlan ? candidate.plan : null,
      planChange: inPlan && candidate.planChange,
      plannedCostCents: inPlan ? candidate.cost : null,
      shows: unwatched.filter((show) => covers(offering, show)),
    });
  });
  // Subscriptions with no plan meeting the preferences: out of the plan.
  for (const service of input.subscriptions) {
    if (listed.has(service.providerKey)) continue;
    const offering = offerings.find((o) => o.key === service.providerKey);
    if (!offering) continue;
    entries.push({
      offering: toPlanOffering(offering),
      service,
      state: stateOf(service, false),
      plan: null,
      planChange: false,
      plannedCostCents: null,
      shows: unwatched.filter((show) => covers(offering, show)),
    });
  }
  entries.sort(
    (a, b) =>
      STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
      Number(b.planChange) - Number(a.planChange) ||
      a.offering.name.localeCompare(b.offering.name),
  );

  let currentCostCents = 0;
  let plannedCostCents = 0;
  const unpriced = new Set<string>();
  for (const service of input.subscriptions) {
    if (service.status !== 'active') continue;
    if (service.monthlyPriceCents === null) unpriced.add(service.providerKey);
    else currentCostCents += service.monthlyPriceCents;
  }
  for (const index of chosen) {
    const candidate = candidates[index];
    if (!candidate) continue;
    if (candidate.cost === null) unpriced.add(candidate.offering.key);
    else plannedCostCents += candidate.cost;
  }

  return { entries, uncovered, currentCostCents, plannedCostCents, unpricedCount: unpriced.size };
}

function toPlanOffering(offering: OptimizerOffering): PlanOffering {
  return {
    key: offering.key,
    name: offering.name,
    kind: offering.kind,
    includes: [...offering.includes],
    logoUrl: offering.logoUrl,
    manageUrl: offering.manageUrl,
  };
}

function stateOf(service: OptimizerSubscription | null, inPlan: boolean): RotationState {
  if (!service) return 'subscribe';
  if (service.status === 'active') return inPlan ? 'keep' : 'pause';
  return inPlan ? 'resume' : 'paused';
}

const cheapest = (plans: readonly ProviderPlan[]) =>
  [...plans].sort(
    (a, b) => a.monthlyPriceCents - b.monthlyPriceCents || a.name.localeCompare(b.name),
  )[0];

/**
 * The best way to have `offering` this month, or null if no plan meets the preferences (or it
 * isn't subscribed and new services are off). A household's own plan wins ties, and keeps its
 * own price (which may differ from the published one).
 */
function toCandidate<S extends OptimizerSubscription>(
  offering: OptimizerOffering,
  service: S | null,
  preferences: Preferences,
): Candidate<S> | null {
  const eligible = offering.plans.filter((plan) => planMeets(plan, preferences));
  const best = cheapest(eligible);

  if (!service) {
    if (!preferences.suggestNewServices || !best) return null;
    return {
      offering,
      service,
      plan: best,
      planChange: false,
      cost: best.monthlyPriceCents,
      changesIfChosen: 1,
      changesIfLeft: 0,
    };
  }

  const active = service.status === 'active';
  const base = { offering, service, changesIfLeft: active ? 1 : 0 };
  const startChanges = active ? 0 : 1;
  const current = offering.plans.find((plan) => plan.name === service.planName);

  // Its current plan, if it qualifies: published features with the household's own price. A
  // plan we know nothing about (custom, or no published plans) is assumed to qualify.
  const currentQualifies = current ? planMeets(current, preferences) : true;
  const currentCost = service.monthlyPriceCents ?? current?.monthlyPriceCents ?? null;
  const stay: Candidate<S> | null = currentQualifies
    ? {
        ...base,
        plan: current ?? null,
        planChange: false,
        cost: currentCost,
        changesIfChosen: startChanges,
      }
    : null;
  const switchTo: Candidate<S> | null =
    best && best.name !== service.planName
      ? {
          ...base,
          plan: best,
          planChange: true,
          cost: best.monthlyPriceCents,
          changesIfChosen: startChanges + 1,
        }
      : null;

  if (stay && switchTo) {
    // Switch only when it's cheaper; an unknown current price is never switched away from.
    return stay.cost !== null && switchTo.cost !== null && switchTo.cost < stay.cost
      ? switchTo
      : stay;
  }
  return stay ?? switchTo;
}

interface Score {
  cost: number;
  changes: number;
  count: number;
}

const better = (a: Score, b: Score) =>
  a.cost !== b.cost
    ? a.cost < b.cost
    : a.changes !== b.changes
      ? a.changes < b.changes
      : a.count < b.count;

function chooseCandidates<S>(candidates: readonly Candidate<S>[], needs: number[][]): Set<number> {
  const costOf = (i: number) => candidates[i]?.cost ?? 0;
  const score = (set: readonly number[]): Score => {
    const inSet = new Set(set);
    let cost = 0;
    let changes = 0;
    candidates.forEach((candidate, i) => {
      if (inSet.has(i)) {
        cost += costOf(i);
        changes += candidate.changesIfChosen;
      } else {
        changes += candidate.changesIfLeft;
      }
    });
    return { cost, changes, count: set.length };
  };

  // A title on exactly one candidate forces it into the plan.
  const forced = [...new Set(needs.filter((need) => need.length === 1).flat())];
  const open = needs.filter((need) => !need.some((i) => forced.includes(i)));
  const pool = [...new Set(open.flat())].sort((a, b) => a - b);

  if (open.length === 0) return new Set(forced);

  if (pool.length <= EXACT_POOL_LIMIT) {
    const needMasks = open.map((need) =>
      need.reduce((mask, i) => mask | (1 << pool.indexOf(i)), 0),
    );
    let best: { set: number[]; score: Score } | undefined;
    const total = 1 << pool.length;
    for (let mask = 1; mask < total; mask += 1) {
      if (!needMasks.every((need) => (need & mask) !== 0)) continue;
      const set = pool.filter((_, bit) => (mask & (1 << bit)) !== 0);
      const candidateScore = score([...forced, ...set]);
      if (!best || better(candidateScore, best.score)) best = { set, score: candidateScore };
    }
    return new Set([...forced, ...(best?.set ?? [])]);
  }

  // Greedy: cheapest cost per newly covered title, then fewest changes.
  const chosen = [...forced];
  let remaining = open;
  while (remaining.length > 0) {
    let pick = -1;
    let pickRatio = Number.POSITIVE_INFINITY;
    for (const i of pool) {
      const covered = remaining.filter((need) => need.includes(i)).length;
      if (covered === 0) continue;
      const ratio = costOf(i) / covered;
      if (ratio < pickRatio) {
        pick = i;
        pickRatio = ratio;
      }
    }
    if (pick < 0) break;
    chosen.push(pick);
    remaining = remaining.filter((need) => !need.includes(pick));
  }
  return new Set(chosen);
}

/** The preference changes offered as alternatives, given the current preferences. */
function alternativeSpecs(
  preferences: Preferences,
): { id: PlanAlternative['id']; label: string; patch: Partial<Preferences> }[] {
  const specs: { id: PlanAlternative['id']; label: string; patch: Partial<Preferences> }[] = [];
  if (preferences.allowAds)
    specs.push({ id: 'no-ads', label: 'No ads', patch: { allowAds: false } });
  else specs.push({ id: 'allow-ads', label: 'Allow ads', patch: { allowAds: true } });
  if (preferences.suggestNewServices) {
    specs.push({
      id: 'owned-only',
      label: 'Only services you have',
      patch: { suggestNewServices: false },
    });
  } else {
    specs.push({
      id: 'new-services',
      label: 'Consider other services',
      patch: { suggestNewServices: true },
    });
  }
  if (preferences.minStreams < 4) {
    specs.push({ id: 'more-screens', label: '4 screens at once', patch: { minStreams: 4 } });
  }
  if (!preferences.require4k) {
    specs.push({ id: 'uhd', label: '4K picture', patch: { require4k: true } });
  }
  return specs;
}

const chosenPlans = <S, W>(plan: OptimizedPlan<S, W>) =>
  new Map(
    plan.entries
      .filter((e) => e.state === 'keep' || e.state === 'resume' || e.state === 'subscribe')
      .map((e) => [e.offering.key, e]),
  );

/**
 * The plan under each alternative set of preferences, where it differs from `base`: what it
 * would cost and change. Lets the household see the price of ad-free, more screens and so on.
 */
export function planAlternatives<S extends OptimizerSubscription, W extends OptimizerShow>(
  input: OptimizerInput<S, W>,
  base: OptimizedPlan<S, W>,
): PlanAlternative[] {
  const baseChosen = chosenPlans(base);
  return alternativeSpecs(input.preferences).flatMap((spec) => {
    const plan = optimizePlan({ ...input, preferences: { ...input.preferences, ...spec.patch } });
    const altChosen = chosenPlans(plan);
    const changes: string[] = [];
    for (const [key, entry] of altChosen) {
      const before = baseChosen.get(key);
      if (!before || before.plan?.name !== entry.plan?.name) {
        changes.push(
          entry.plan ? `${entry.offering.name}: ${entry.plan.name}` : entry.offering.name,
        );
      }
    }
    for (const [key, entry] of baseChosen) {
      if (!altChosen.has(key)) changes.push(`without ${entry.offering.name}`);
    }
    const sameCoverage = plan.uncovered.length === base.uncovered.length;
    if (changes.length === 0 && sameCoverage) return [];
    return [
      {
        id: spec.id,
        label: spec.label,
        changes: changes.join(' · '),
        plannedCostCents: plan.plannedCostCents,
        deltaCents: plan.plannedCostCents - base.plannedCostCents,
        uncoveredCount: plan.uncovered.length,
        preferences: spec.patch,
      },
    ];
  });
}
