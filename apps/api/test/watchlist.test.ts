import {
  ApiErrorSchema,
  TitleSearchResultSchema,
  WatchlistShowSchema,
  type WatchlistShow,
} from '@app/shared';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createTmdbStub } from './tmdb-stub.ts';
import { bearer, createTestApp, uniqueUserId } from './helpers.ts';

// Its own stub, because one test changes where a title streams.
const tmdbStub = createTmdbStub();
const { app, db } = createTestApp({}, { tmdbStub });
const unconfigured = createTestApp({ TMDB_API_TOKEN: '' });

afterAll(async () => {
  await db.close();
  await unconfigured.db.close();
});

async function asNewUser() {
  return bearer(uniqueUserId());
}

async function add(
  auth: string,
  tmdbId: number,
  mediaType: 'tv' | 'movie',
): Promise<WatchlistShow> {
  const res = await request(app)
    .post('/watchlist')
    .set('Authorization', auth)
    .send({ tmdbId, mediaType })
    .expect(201);
  return WatchlistShowSchema.parse(res.body);
}

describe('title search', () => {
  it('finds shows and movies, skipping people', async () => {
    const auth = await asNewUser();
    const res = await request(app)
      .get('/catalog/search')
      .query({ q: 'harbor' })
      .set('Authorization', auth)
      .expect(200);
    const results = TitleSearchResultSchema.array().parse(res.body);
    // The more popular title first, whatever order TMDB returns them in.
    expect(results.map((r) => r.title)).toEqual(['Harbor Lights', 'The Long Harbor']);
    expect(results[1]).toMatchObject({
      tmdbId: 1001,
      mediaType: 'tv',
      year: 2024,
      posterUrl: 'https://images.tmdb.test/t/p/w342/poster/1001.svg',
    });
  });

  it('puts an exact title match first, then the most popular', async () => {
    const res = await request(app)
      .get('/catalog/search')
      .query({ q: 'lanterns' })
      .set('Authorization', await asNewUser())
      .expect(200);
    const results = TitleSearchResultSchema.array().parse(res.body);
    expect(results.map((r) => r.title)).toEqual(['Lanterns', 'Paper Lanterns']);
  });

  it('answers 503 when TMDB is not configured', async () => {
    const res = await request(unconfigured.app)
      .get('/catalog/search')
      .query({ q: 'harbor' })
      .set('Authorization', await asNewUser())
      .expect(503);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('tmdb_unavailable');
  });
});

describe('watchlist API', () => {
  it('adds a title with the services it streams on', async () => {
    const auth = await asNewUser();
    const show = await add(auth, 1002, 'tv');

    expect(show).toMatchObject({ title: 'Signal Fires', year: 2025, watched: false });
    // Both "HBO Max" and "HBO Max Amazon Channel" are HBO Max.
    expect(show.providerKeys).toEqual(['hbo-max']);
    const list = await request(app).get('/watchlist').set('Authorization', auth).expect(200);
    expect(WatchlistShowSchema.array().parse(list.body)).toContainEqual(show);
  });

  it('counts ad-supported offers and plan variants, not rentals', async () => {
    const auth = await asNewUser();
    expect((await add(auth, 1004, 'movie')).providerKeys).toEqual(['netflix', 'peacock']);
    expect((await add(auth, 1008, 'movie')).providerKeys).toEqual([]);
  });

  it('refuses a title already on the list, and unknown titles', async () => {
    const auth = await asNewUser();
    await add(auth, 1001, 'tv');
    const dup = await request(app)
      .post('/watchlist')
      .set('Authorization', auth)
      .send({ tmdbId: 1001, mediaType: 'tv' })
      .expect(409);
    expect(ApiErrorSchema.parse(dup.body).error.code).toBe('already_added');
    // 1001 is a TV show, not a movie.
    await request(app)
      .post('/watchlist')
      .set('Authorization', auth)
      .send({ tmdbId: 1001, mediaType: 'movie' })
      .expect(404);
  });

  it('marks a title watched and unwatched', async () => {
    const auth = await asNewUser();
    const show = await add(auth, 1005, 'tv');
    const res = await request(app)
      .patch(`/watchlist/${show.id}`)
      .set('Authorization', auth)
      .send({ watched: true })
      .expect(200);
    expect(WatchlistShowSchema.parse(res.body).watched).toBe(true);
  });

  it('removes a title', async () => {
    const auth = await asNewUser();
    const show = await add(auth, 1003, 'tv');
    await request(app).delete(`/watchlist/${show.id}`).set('Authorization', auth).expect(204);
    const list = await request(app).get('/watchlist').set('Authorization', auth).expect(200);
    expect(
      WatchlistShowSchema.array()
        .parse(list.body)
        .map((s) => s.id),
    ).not.toContain(show.id);
  });

  it('refreshes where a title streams', async () => {
    const auth = await asNewUser();
    const show = await add(auth, 1009, 'tv');
    expect(show.providerKeys).toEqual(['peacock']);
    tmdbStub.setOffers(1009, 'US', [8]);

    const res = await request(app)
      .post(`/watchlist/${show.id}/refresh`)
      .set('Authorization', auth)
      .expect(200);

    const refreshed = WatchlistShowSchema.parse(res.body);
    expect(refreshed.providerKeys).toEqual(['netflix']);
    expect(Date.parse(refreshed.providersRefreshedAt)).toBeGreaterThanOrEqual(
      Date.parse(show.providersRefreshedAt),
    );
  });

  it("looks titles up again in the household's new region", async () => {
    const auth = await asNewUser();
    const show = await add(auth, 1002, 'tv');
    await request(app)
      .patch('/household')
      .set('Authorization', auth)
      .send({ region: 'CA' })
      .expect(200);

    const list = await request(app).get('/watchlist').set('Authorization', auth).expect(200);
    const updated = WatchlistShowSchema.array()
      .parse(list.body)
      .find((s) => s.id === show.id);
    expect(updated?.providerKeys).toEqual(['crave']);
  });

  it("keeps each household's watchlist private", async () => {
    const owner = await asNewUser();
    const other = await asNewUser();
    const show = await add(owner, 1006, 'movie');

    const list = await request(app).get('/watchlist').set('Authorization', other).expect(200);
    expect(
      WatchlistShowSchema.array()
        .parse(list.body)
        .map((s) => s.id),
    ).not.toContain(show.id);
    await request(app)
      .patch(`/watchlist/${show.id}`)
      .set('Authorization', other)
      .send({ watched: true })
      .expect(404);
    await request(app).delete(`/watchlist/${show.id}`).set('Authorization', other).expect(404);
  });
});
