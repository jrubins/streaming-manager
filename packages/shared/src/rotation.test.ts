import { describe, expect, it } from 'vitest';
import type { ProviderPlan } from './catalog.ts';
import { DEFAULT_PREFERENCES, type Preferences } from './preferences.ts';
import {
  optimizePlan,
  planAlternatives,
  type OptimizerOffering,
  type OptimizerShow,
  type OptimizerSubscription,
} from './rotation.ts';

function plan(
  name: string,
  dollars: number,
  features: Partial<Pick<ProviderPlan, 'ads' | 'streams' | 'uhd' | 'downloads'>> = {},
): ProviderPlan {
  return {
    name,
    monthlyPriceCents: Math.round(dollars * 100),
    ads: false,
    streams: 2,
    uhd: false,
    downloads: false,
    ...features,
  };
}

function offering(
  key: string,
  plans: ProviderPlan[],
  includes: string[] = [key],
): OptimizerOffering {
  return {
    key,
    name: key,
    kind: includes.length > 1 ? 'bundle' : 'service',
    includes,
    logoUrl: null,
    manageUrl: null,
    plans,
  };
}

let nextId = 1;
function sub(
  providerKey: string,
  status: 'active' | 'paused',
  planName: string | null,
  monthlyPriceCents: number | null,
): OptimizerSubscription {
  return { id: nextId++, providerKey, planName, monthlyPriceCents, status };
}
function show(providerKeys: string[], watched = false): OptimizerShow {
  return { id: nextId++, providerKeys, watched };
}

const NETFLIX = offering('netflix', [
  plan('Standard with ads', 8.99, { ads: true }),
  plan('Standard', 19.99),
  plan('Premium', 26.99, { streams: 4, uhd: true, downloads: true }),
]);
const HULU = offering('hulu', [plan('With ads', 12.49, { ads: true }), plan('No ads', 21.49)]);
const DISNEY = offering('disney-plus', [
  plan('Basic', 12.49, { ads: true }),
  plan('Premium', 21.49, { streams: 4, uhd: true, downloads: true }),
]);
const MAX = offering('hbo-max', [plan('Basic with ads', 10.99, { ads: true })]);
const BUNDLE = offering(
  'disney-hulu-espn',
  [plan('With ads', 21.99, { ads: true }), plan('Premium', 32.99)],
  ['disney-plus', 'hulu', 'espn-plus'],
);

function run(
  subscriptions: OptimizerSubscription[],
  offerings: OptimizerOffering[],
  shows: OptimizerShow[],
  preferences: Partial<Preferences> = {},
) {
  return optimizePlan({
    subscriptions,
    offerings,
    shows,
    preferences: { ...DEFAULT_PREFERENCES, ...preferences },
  });
}

const byKey = (result: ReturnType<typeof run>) =>
  Object.fromEntries(
    result.entries.map((e) => [
      e.offering.key,
      `${e.state}${e.plan ? `:${e.plan.name}` : ''}${e.planChange ? '*' : ''}`,
    ]),
  );

describe('optimizePlan', () => {
  it('keeps, pauses, resumes and leaves paused', () => {
    const result = run(
      [
        sub('netflix', 'active', 'Standard with ads', 899),
        sub('hulu', 'active', 'With ads', 1249),
        sub('hbo-max', 'paused', 'Basic with ads', 1099),
        sub('disney-plus', 'paused', 'Basic', 1249),
      ],
      [NETFLIX, HULU, MAX, DISNEY],
      [show(['netflix']), show(['hbo-max'])],
      { suggestNewServices: false },
    );
    expect(byKey(result)).toEqual({
      'hbo-max': 'resume:Basic with ads',
      hulu: 'pause',
      netflix: 'keep:Standard with ads',
      'disney-plus': 'paused',
    });
    expect(result.currentCostCents).toBe(899 + 1249);
    expect(result.plannedCostCents).toBe(899 + 1099);
  });

  it('switches to a cheaper plan that meets the preferences', () => {
    const result = run(
      [sub('netflix', 'active', 'Standard', 1999)],
      [NETFLIX],
      [show(['netflix'])],
    );
    expect(byKey(result)).toEqual({ netflix: 'keep:Standard with ads*' });
    expect(result.plannedCostCents).toBe(899);
  });

  it('keeps an ad-free plan when ads are not allowed', () => {
    const result = run(
      [sub('netflix', 'active', 'Standard', 1999)],
      [NETFLIX],
      [show(['netflix'])],
      {
        allowAds: false,
      },
    );
    expect(byKey(result)).toEqual({ netflix: 'keep:Standard' });
  });

  it('moves up to a plan that meets a requirement (4 screens)', () => {
    const result = run(
      [sub('netflix', 'active', 'Standard', 1999)],
      [NETFLIX],
      [show(['netflix'])],
      {
        minStreams: 4,
      },
    );
    expect(byKey(result)).toEqual({ netflix: 'keep:Premium*' });
  });

  it("keeps the household's own price for its current plan", () => {
    // A grandfathered price below the published one is not "switched" away from.
    const result = run([sub('hulu', 'active', 'No ads', 800)], [HULU], [show(['hulu'])]);
    expect(byKey(result)).toEqual({ hulu: 'keep:No ads' });
    expect(result.plannedCostCents).toBe(800);
  });

  it('uses a bundle when it is cheaper than its services separately', () => {
    const result = run(
      [sub('hulu', 'active', 'With ads', 1249), sub('disney-plus', 'active', 'Basic', 1249)],
      [HULU, DISNEY, BUNDLE],
      [show(['hulu']), show(['disney-plus'])],
    );
    expect(byKey(result)).toEqual({
      'disney-hulu-espn': 'subscribe:With ads',
      'disney-plus': 'pause',
      hulu: 'pause',
    });
    expect(result.plannedCostCents).toBe(2199);
  });

  it('keeps a subscribed bundle for titles on any of its services', () => {
    const result = run(
      [sub('disney-hulu-espn', 'active', 'With ads', 2199)],
      [HULU, DISNEY, BUNDLE],
      [show(['hulu']), show(['disney-plus'])],
    );
    expect(byKey(result)).toEqual({ 'disney-hulu-espn': 'keep:With ads' });
  });

  it("drops a bundle when one service is all that's needed", () => {
    const result = run(
      [sub('disney-hulu-espn', 'active', 'With ads', 2199)],
      [HULU, DISNEY, BUNDLE],
      [show(['hulu'])],
    );
    expect(byKey(result)).toEqual({ hulu: 'subscribe:With ads', 'disney-hulu-espn': 'pause' });
  });

  it('suggests a new service only when new services are allowed', () => {
    const shows = [show(['hbo-max'])];
    expect(byKey(run([], [MAX], shows))).toEqual({ 'hbo-max': 'subscribe:Basic with ads' });
    const ownedOnly = run([], [MAX], shows, { suggestNewServices: false });
    expect(ownedOnly.entries).toEqual([]);
    expect(ownedOnly.uncovered).toEqual(shows);
  });

  it('leaves a title uncovered when no plan meets the preferences', () => {
    const only = show(['hbo-max']);
    const result = run([sub('hbo-max', 'paused', 'Basic with ads', 1099)], [MAX], [only], {
      allowAds: false,
    });
    expect(result.uncovered).toEqual([only]);
    expect(byKey(result)).toEqual({ 'hbo-max': 'paused' });
  });

  it('prefers fewer changes between equally cheap plans', () => {
    const shows = [show(['a', 'b'])];
    const a = offering('a', [plan('Only', 10)]);
    const b = offering('b', [plan('Only', 10)]);
    expect(byKey(run([sub('b', 'active', 'Only', 1000)], [a, b], shows))).toEqual({
      b: 'keep:Only',
    });
  });

  it('ignores watched titles', () => {
    const result = run(
      [sub('netflix', 'active', 'Standard with ads', 899)],
      [NETFLIX],
      [show(['netflix'], true)],
    );
    expect(byKey(result)).toEqual({ netflix: 'pause' });
  });

  it('treats an unknown plan as qualifying, and counts unknown prices separately', () => {
    const starz = offering('starz', []);
    const result = run([sub('starz', 'active', null, null)], [starz], [show(['starz'])], {
      allowAds: false,
    });
    expect(byKey(result)).toEqual({ starz: 'keep' });
    expect(result.unpricedCount).toBe(1);
  });

  it('is deterministic regardless of input order', () => {
    const subs = [
      sub('hulu', 'active', 'With ads', 1249),
      sub('netflix', 'paused', 'Standard', 1999),
    ];
    const shows = [show(['hulu', 'netflix']), show(['disney-plus', 'hulu'])];
    const offerings = [NETFLIX, HULU, DISNEY, BUNDLE];
    expect(byKey(run([...subs].reverse(), [...offerings].reverse(), [...shows].reverse()))).toEqual(
      byKey(run(subs, offerings, shows)),
    );
  });

  it('falls back to a greedy cover for very large catalogs', () => {
    const offerings = Array.from({ length: 30 }, (_, i) =>
      offering(`s${i}`, [plan('Only', 5 + i)]),
    );
    const shows = Array.from({ length: 30 }, (_, i) => show([`s${i}`, `s${(i + 1) % 30}`]));
    const result = run([], offerings, shows);
    const chosen = result.entries.map((e) => e.offering.key);
    for (const s of shows) expect(s.providerKeys.some((key) => chosen.includes(key))).toBe(true);
    expect(result.uncovered).toEqual([]);
  });
});

describe('planAlternatives', () => {
  it('prices the ad-free plan and the owned-only plan', () => {
    const input = {
      subscriptions: [sub('netflix', 'active', 'Standard with ads', 899)],
      offerings: [NETFLIX, MAX],
      shows: [show(['netflix']), show(['hbo-max'])],
      preferences: DEFAULT_PREFERENCES,
    };
    const base = optimizePlan(input);
    const alternatives = planAlternatives(input, base);

    const noAds = alternatives.find((a) => a.id === 'no-ads');
    // Max has no ad-free plan here, so its title would go uncovered.
    expect(noAds).toMatchObject({
      changes: 'netflix: Standard · without hbo-max',
      deltaCents: 1999 - (899 + 1099),
      uncoveredCount: 1,
      preferences: { allowAds: false },
    });
    expect(alternatives.find((a) => a.id === 'owned-only')).toMatchObject({
      changes: 'without hbo-max',
      uncoveredCount: 1,
      preferences: { suggestNewServices: false },
    });
  });

  it('leaves out alternatives that would change nothing', () => {
    const appleTv = offering('apple-tv-plus', [plan('Monthly', 14.99, { streams: 6, uhd: true })]);
    const input = {
      subscriptions: [sub('apple-tv-plus', 'active', 'Monthly', 1499)],
      offerings: [appleTv],
      shows: [show(['apple-tv-plus'])],
      preferences: DEFAULT_PREFERENCES,
    };
    expect(planAlternatives(input, optimizePlan(input))).toEqual([]);
  });
});
