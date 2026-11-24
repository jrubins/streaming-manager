import { describe, expect, it } from 'vitest';
import { computeRotation, type RotationServiceInput, type RotationShowInput } from './rotation.ts';

let nextId = 1;
function service(
  providerKey: string,
  status: 'active' | 'paused',
  monthlyPriceCents: number | null = 1000,
): RotationServiceInput {
  return { id: nextId++, providerKey, status, monthlyPriceCents };
}
function show(providerKeys: string[], watched = false): RotationShowInput {
  return { id: nextId++, providerKeys, watched };
}

function states(result: ReturnType<typeof computeRotation>) {
  return Object.fromEntries(result.entries.map((e) => [e.service.providerKey, e.state]));
}

describe('computeRotation', () => {
  it('gives each service one of the four states', () => {
    const services = [
      service('netflix', 'active'),
      service('hulu', 'active'),
      service('max', 'paused'),
      service('peacock', 'paused'),
    ];
    const shows = [show(['netflix']), show(['max'])];

    expect(states(computeRotation(services, shows))).toEqual({
      netflix: 'keep',
      hulu: 'pause',
      max: 'resume',
      peacock: 'paused',
    });
  });

  it('ignores watched shows', () => {
    const result = computeRotation([service('netflix', 'active')], [show(['netflix'], true)]);
    expect(states(result)).toEqual({ netflix: 'pause' });
    expect(result.entries[0]?.shows).toEqual([]);
  });

  it('needs only one service for a show on several, preferring the one already active', () => {
    const shows = [show(['netflix', 'hulu'])];
    const result = computeRotation(
      [service('netflix', 'paused', 1000), service('hulu', 'active', 1000)],
      shows,
    );
    expect(states(result)).toEqual({ netflix: 'paused', hulu: 'keep' });
    // The show is listed under both services, so the UI can say where else it streams.
    expect(result.entries.map((e) => e.shows)).toEqual([shows, shows]);
  });

  it('picks the fewest services, even over a cheaper larger set', () => {
    const services = [
      service('a', 'active', 500),
      service('b', 'active', 500),
      service('big', 'active', 2000),
    ];
    const shows = [show(['a', 'big']), show(['b', 'big'])];
    expect(states(computeRotation(services, shows))).toEqual({
      a: 'pause',
      b: 'pause',
      big: 'keep',
    });
  });

  it('picks the cheapest among equally small sets', () => {
    const services = [service('pricey', 'active', 2000), service('cheap', 'active', 800)];
    expect(states(computeRotation(services, [show(['pricey', 'cheap'])]))).toEqual({
      pricey: 'pause',
      cheap: 'keep',
    });
  });

  it('resumes a cheaper paused service rather than keep a pricier active one', () => {
    const services = [service('pricey', 'active', 2000), service('cheap', 'paused', 800)];
    expect(states(computeRotation(services, [show(['pricey', 'cheap'])]))).toEqual({
      pricey: 'pause',
      cheap: 'resume',
    });
  });

  it('solves overlapping shows exactly', () => {
    // Greedy would take "x" (covers 3) and then need two more; {a, b} covers all four.
    const services = [service('x', 'active'), service('a', 'active'), service('b', 'active')];
    const shows = [show(['x', 'a']), show(['x', 'b']), show(['x', 'a']), show(['a']), show(['b'])];
    expect(states(computeRotation(services, shows))).toEqual({ x: 'pause', a: 'keep', b: 'keep' });
  });

  it('reports shows on none of the services as uncovered', () => {
    const lonely = show(['starz']);
    const result = computeRotation([service('netflix', 'active')], [lonely, show([])]);
    expect(result.uncovered).toHaveLength(2);
    expect(result.uncovered).toContain(lonely);
    expect(states(result)).toEqual({ netflix: 'pause' });
  });

  it('adds up current and planned costs, counting unpriced services separately', () => {
    const services = [
      service('netflix', 'active', 1999),
      service('hulu', 'active', 1249),
      service('max', 'paused', 1099),
      service('apple', 'active', null),
    ];
    const shows = [show(['netflix']), show(['max']), show(['apple'])];
    const result = computeRotation(services, shows);
    expect(result.currentCostCents).toBe(1999 + 1249);
    expect(result.plannedCostCents).toBe(1999 + 1099);
    expect(result.unpricedCount).toBe(1);
  });

  it('is deterministic regardless of input order', () => {
    const services = [service('a', 'active'), service('b', 'active'), service('c', 'paused')];
    const shows = [show(['a', 'b']), show(['b', 'c']), show(['c'])];
    const forward = states(computeRotation(services, shows));
    const reversed = states(computeRotation([...services].reverse(), [...shows].reverse()));
    expect(reversed).toEqual(forward);
  });

  it('falls back to a greedy cover for very large households', () => {
    const services = Array.from({ length: 40 }, (_, i) => service(`s${i}`, 'active'));
    const shows = Array.from({ length: 40 }, (_, i) => show([`s${i}`, `s${(i + 1) % 40}`]));
    const result = computeRotation(services, shows);
    const kept = result.entries.filter((e) => e.state === 'keep').map((e) => e.service.providerKey);
    for (const s of shows) expect(s.providerKeys.some((key) => kept.includes(key))).toBe(true);
    expect(kept.length).toBeLessThanOrEqual(21);
  });
});
