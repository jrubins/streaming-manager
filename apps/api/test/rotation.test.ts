import {
  RotationPlanSchema,
  ServiceSchema,
  WatchlistShowSchema,
  type RotationPlan,
} from '@app/shared';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, uniqueUserId } from './helpers.ts';

const { app, db } = createTestApp();

afterAll(async () => {
  await db.close();
});

async function post(auth: string, path: string, body: object) {
  const res = await request(app).post(path).set('Authorization', auth).send(body).expect(201);
  return res.body as unknown;
}

async function plan(auth: string): Promise<RotationPlan> {
  const res = await request(app).get('/rotation').set('Authorization', auth).expect(200);
  return RotationPlanSchema.parse(res.body);
}

const entry = (p: RotationPlan, key: string) => p.entries.find((e) => e.offering.key === key);

describe('rotation plan', () => {
  it('keeps, pauses, resumes and switches plans for the unwatched list', async () => {
    const auth = await bearer(uniqueUserId());
    const netflix = ServiceSchema.parse(
      await post(auth, '/services', { providerKey: 'netflix', planName: 'Standard' }),
    );
    await post(auth, '/services', { providerKey: 'hulu' });
    await post(auth, '/services', { providerKey: 'hbo-max', status: 'paused' });
    await post(auth, '/services', { providerKey: 'peacock', status: 'paused' });
    // On Netflix only; HBO Max only; and on Netflix or Hulu (so Hulu isn't needed).
    const harbor = WatchlistShowSchema.parse(
      await post(auth, '/watchlist', { tmdbId: 1001, mediaType: 'tv' }),
    );
    await post(auth, '/watchlist', { tmdbId: 1002, mediaType: 'tv' });
    await post(auth, '/watchlist', { tmdbId: 1010, mediaType: 'tv' });
    // Watched titles don't count.
    const watched = WatchlistShowSchema.parse(
      await post(auth, '/watchlist', { tmdbId: 1009, mediaType: 'tv' }),
    );
    await request(app)
      .patch(`/watchlist/${watched.id}`)
      .set('Authorization', auth)
      .send({ watched: true })
      .expect(200);
    // Only on BritBox, which has no known prices: nothing to suggest.
    const lonely = WatchlistShowSchema.parse(
      await post(auth, '/watchlist', { tmdbId: 1006, mediaType: 'movie' }),
    );

    const result = await plan(auth);

    // Ads are allowed by default, so Netflix moves to its cheaper ad plan.
    expect(entry(result, 'netflix')).toMatchObject({
      state: 'keep',
      planChange: true,
      plan: { name: 'Standard with ads' },
      plannedCostCents: 899,
      service: { id: netflix.id },
    });
    expect(entry(result, 'netflix')?.shows.map((s) => s.id)).toContain(harbor.id);
    expect(entry(result, 'hulu')?.state).toBe('pause');
    expect(entry(result, 'hbo-max')).toMatchObject({ state: 'resume', planChange: false });
    expect(entry(result, 'peacock')?.state).toBe('paused');
    expect(result.uncovered.map((s) => s.id)).toEqual([lonely.id]);
    expect(result.currentCostCents).toBe(1999 + 1249);
    expect(result.plannedCostCents).toBe(899 + 1099);
    expect(result.preferences.allowAds).toBe(true);

    // The ad-free alternative: Netflix stays on Standard, HBO Max moves to Standard.
    expect(result.alternatives.find((a) => a.id === 'no-ads')).toMatchObject({
      plannedCostCents: 1999 + 1849,
      deltaCents: 1999 + 1849 - (899 + 1099),
      preferences: { allowAds: false },
    });
  });

  it('keeps a service marked always keep, even when the list does not need it', async () => {
    const auth = await bearer(uniqueUserId());
    const hulu = ServiceSchema.parse(await post(auth, '/services', { providerKey: 'hulu' }));
    expect(entry(await plan(auth), 'hulu')?.state).toBe('pause');

    const res = await request(app)
      .patch(`/services/${hulu.id}`)
      .set('Authorization', auth)
      .send({ alwaysKeep: true })
      .expect(200);
    expect(ServiceSchema.parse(res.body).alwaysKeep).toBe(true);
    expect(entry(await plan(auth), 'hulu')).toMatchObject({
      state: 'keep',
      plannedCostCents: 1249,
      service: { alwaysKeep: true },
    });
  });

  it('follows the household preferences', async () => {
    const auth = await bearer(uniqueUserId());
    await post(auth, '/services', { providerKey: 'netflix', planName: 'Standard' });
    await post(auth, '/watchlist', { tmdbId: 1001, mediaType: 'tv' });
    await request(app)
      .patch('/household/preferences')
      .set('Authorization', auth)
      .send({ minStreams: 4 })
      .expect(200);

    const result = await plan(auth);

    expect(entry(result, 'netflix')).toMatchObject({ planChange: true, plan: { name: 'Premium' } });
    expect(result.preferences.minStreams).toBe(4);
  });

  it('suggests a bundle that beats separate subscriptions', async () => {
    const auth = await bearer(uniqueUserId());
    await post(auth, '/services', { providerKey: 'hulu' });
    await post(auth, '/services', { providerKey: 'disney-plus' });
    await post(auth, '/services', { providerKey: 'hbo-max' });
    // Copper & Thyme is on Hulu and Disney+; Signal Fires on HBO Max.
    await post(auth, '/watchlist', { tmdbId: 1003, mediaType: 'tv' });
    await post(auth, '/watchlist', { tmdbId: 1002, mediaType: 'tv' });

    const result = await plan(auth);

    // Hulu ($12.49) + HBO Max ($10.99) separately, or the Disney+/Hulu/HBO Max bundle ($21.99).
    expect(entry(result, 'disney-hulu-max')).toMatchObject({
      state: 'subscribe',
      plan: { name: 'With ads', monthlyPriceCents: 2199 },
      service: null,
    });
    expect(['hulu', 'disney-plus', 'hbo-max'].map((key) => entry(result, key)?.state)).toEqual([
      'pause',
      'pause',
      'pause',
    ]);
    expect(result.plannedCostCents).toBe(2199);
    // Without new services, the household's own cheapest pair is the plan.
    expect(result.alternatives.find((a) => a.id === 'owned-only')).toMatchObject({
      plannedCostCents: 1249 + 1099,
      preferences: { suggestNewServices: false },
    });
  });

  it('plans with the subscriptions alone when TMDB is unavailable', async () => {
    const { app: offline, db: offlineDb } = createTestApp({ TMDB_API_TOKEN: '' });
    const auth = await bearer(uniqueUserId());
    const service = ServiceSchema.parse(
      (
        await request(app)
          .post('/services')
          .set('Authorization', auth)
          .send({ providerKey: 'netflix' })
          .expect(201)
      ).body,
    );

    const res = await request(offline).get('/rotation').set('Authorization', auth).expect(200);
    const result = RotationPlanSchema.parse(res.body);
    expect(result.entries.map((e) => [e.offering.key, e.service?.id])).toEqual([
      ['netflix', service.id],
    ]);
    await offlineDb.close();
  });
});
