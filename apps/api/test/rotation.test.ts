import { RotationPlanSchema, ServiceSchema, WatchlistShowSchema } from '@app/shared';
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

describe('rotation plan', () => {
  it('keeps, pauses and resumes services for the unwatched list', async () => {
    const auth = await bearer(uniqueUserId());
    const netflix = ServiceSchema.parse(
      await post(auth, '/services', { providerKey: 'netflix', planName: 'Standard' }),
    );
    const hulu = ServiceSchema.parse(await post(auth, '/services', { providerKey: 'hulu' }));
    const max = ServiceSchema.parse(
      await post(auth, '/services', { providerKey: 'hbo-max', status: 'paused' }),
    );
    const peacock = ServiceSchema.parse(
      await post(auth, '/services', { providerKey: 'peacock', status: 'paused' }),
    );
    // On Netflix only; HBO Max only; and on Netflix or Hulu (so Hulu isn't needed).
    const harbor = WatchlistShowSchema.parse(
      await post(auth, '/watchlist', { tmdbId: 1001, mediaType: 'tv' }),
    );
    await post(auth, '/watchlist', { tmdbId: 1002, mediaType: 'tv' });
    await post(auth, '/watchlist', { tmdbId: 1010, mediaType: 'tv' });
    // Watched titles don't count.
    const static_ = WatchlistShowSchema.parse(
      await post(auth, '/watchlist', { tmdbId: 1009, mediaType: 'tv' }),
    );
    await request(app)
      .patch(`/watchlist/${static_.id}`)
      .set('Authorization', auth)
      .send({ watched: true })
      .expect(200);
    const lonely = WatchlistShowSchema.parse(
      await post(auth, '/watchlist', { tmdbId: 1006, mediaType: 'movie' }),
    );

    const res = await request(app).get('/rotation').set('Authorization', auth).expect(200);
    const plan = RotationPlanSchema.parse(res.body);

    const stateOf = (id: number) => plan.entries.find((e) => e.service.id === id)?.state;
    expect(stateOf(netflix.id)).toBe('keep');
    expect(stateOf(hulu.id)).toBe('pause');
    expect(stateOf(max.id)).toBe('resume');
    expect(stateOf(peacock.id)).toBe('paused');
    expect(plan.entries.find((e) => e.service.id === netflix.id)?.shows.map((s) => s.id)).toContain(
      harbor.id,
    );
    expect(plan.uncovered.map((s) => s.id)).toEqual([lonely.id]);
    expect(plan.currentCostCents).toBe(1999 + 1249);
    expect(plan.plannedCostCents).toBe(1999 + 1099);
    expect(plan.unpricedCount).toBe(0);
  });
});
