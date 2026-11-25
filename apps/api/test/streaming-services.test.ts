import { ApiErrorSchema, CatalogProviderSchema, ServiceSchema, type Service } from '@app/shared';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, uniqueUserId } from './helpers.ts';

const { app, db } = createTestApp();

afterAll(async () => {
  await db.close();
});

async function asNewUser() {
  return bearer(uniqueUserId());
}

async function addService(auth: string, body: Record<string, unknown>): Promise<Service> {
  const res = await request(app)
    .post('/services')
    .set('Authorization', auth)
    .send(body)
    .expect(201);
  return ServiceSchema.parse(res.body);
}

describe('catalog providers', () => {
  it('lists one entry per service, priced ones first, with plans', async () => {
    const auth = await asNewUser();
    const res = await request(app).get('/catalog/providers').set('Authorization', auth).expect(200);
    const providers = CatalogProviderSchema.array().parse(res.body);
    const keys = providers.map((p) => p.key);

    // "Netflix Standard with Ads" and "HBO Max Amazon Channel" are not separate services.
    expect(keys.filter((key) => key === 'netflix')).toHaveLength(1);
    expect(keys.filter((key) => key === 'hbo-max')).toHaveLength(1);
    const netflix = providers.find((p) => p.key === 'netflix');
    expect(netflix).toMatchObject({ name: 'Netflix', pricesAsOf: '2026-11-24' });
    expect(netflix?.plans[0]).toEqual({
      name: 'Standard with ads',
      monthlyPriceCents: 899,
      ads: true,
      streams: 2,
      uhd: false,
      downloads: true,
    });
    expect(netflix).toMatchObject({ kind: 'service', includes: ['netflix'] });
    expect(netflix?.logoUrl).toBe('https://images.tmdb.test/t/p/w92/logo/netflix.svg');
    const firstUnpriced = providers.findIndex((p) => p.plans.length === 0);
    expect(providers.slice(firstUnpriced).every((p) => p.plans.length === 0)).toBe(true);
    expect(keys).toContain('crunchyroll');
  });
});

describe('bundles', () => {
  it('offers bundles whose services all stream in the region', async () => {
    const auth = await asNewUser();
    const res = await request(app).get('/catalog/providers').set('Authorization', auth).expect(200);
    const bundle = CatalogProviderSchema.array()
      .parse(res.body)
      .find((p) => p.key === 'disney-hulu-espn-select');
    expect(bundle).toMatchObject({
      kind: 'bundle',
      name: 'Disney+, Hulu & ESPN Select',
      includes: ['disney-plus', 'hulu', 'espn-plus'],
      manageUrl: 'https://www.disneyplus.com/account',
    });
    expect(bundle?.plans.map((p) => p.monthlyPriceCents)).toEqual([2199, 3299]);
  });

  it('offers the Disney+ and Hulu bundle without ESPN', async () => {
    const auth = await asNewUser();
    expect(
      await addService(auth, { providerKey: 'disney-hulu', planName: 'Premium' }),
    ).toMatchObject({
      name: 'Disney+ & Hulu',
      includes: ['disney-plus', 'hulu'],
      planName: 'Premium',
      monthlyPriceCents: 2199,
    });
  });

  it('adds a bundle as one subscription that includes its services', async () => {
    const auth = await asNewUser();
    expect(await addService(auth, { providerKey: 'disney-hulu-espn-select' })).toMatchObject({
      name: 'Disney+, Hulu & ESPN Select',
      includes: ['disney-plus', 'hulu', 'espn-plus'],
      planName: 'With ads',
      monthlyPriceCents: 2199,
    });
  });
});

describe('services API', () => {
  it('adds a service at its cheapest published plan by default', async () => {
    const auth = await asNewUser();
    const service = await addService(auth, { providerKey: 'hbo-max' });

    expect(service).toMatchObject({
      providerKey: 'hbo-max',
      name: 'HBO Max',
      status: 'active',
      planName: 'Basic with ads',
      monthlyPriceCents: 1099,
      priceSource: 'catalog',
      manageUrl: 'https://www.hbomax.com/subscription',
    });
    const list = await request(app).get('/services').set('Authorization', auth).expect(200);
    expect(ServiceSchema.array().parse(list.body)).toContainEqual(service);
  });

  it('uses a chosen plan, or a typed price', async () => {
    const auth = await asNewUser();
    expect(await addService(auth, { providerKey: 'netflix', planName: 'Premium' })).toMatchObject({
      planName: 'Premium',
      monthlyPriceCents: 2699,
      priceSource: 'catalog',
    });
    expect(
      await addService(auth, {
        providerKey: 'crunchyroll',
        status: 'paused',
        monthlyPriceCents: 799,
      }),
    ).toMatchObject({
      status: 'paused',
      monthlyPriceCents: 799,
      priceSource: 'manual',
      planName: null,
    });
  });

  it('adds a service without known prices unpriced', async () => {
    const auth = await asNewUser();
    expect(await addService(auth, { providerKey: 'starz' })).toMatchObject({
      monthlyPriceCents: null,
      priceSource: null,
      manageUrl: null,
    });
  });

  it('refuses duplicates and services unknown in the region', async () => {
    const auth = await asNewUser();
    await addService(auth, { providerKey: 'hulu' });
    const dup = await request(app)
      .post('/services')
      .set('Authorization', auth)
      .send({ providerKey: 'hulu' })
      .expect(409);
    expect(ApiErrorSchema.parse(dup.body).error.code).toBe('already_added');
    const unknown = await request(app)
      .post('/services')
      .set('Authorization', auth)
      .send({ providerKey: 'crave' })
      .expect(400);
    expect(ApiErrorSchema.parse(unknown.body).error.code).toBe('unknown_provider');
  });

  it('pauses a service, changes its plan and overrides its price', async () => {
    const auth = await asNewUser();
    const service = await addService(auth, { providerKey: 'peacock' });

    const paused = await request(app)
      .patch(`/services/${service.id}`)
      .set('Authorization', auth)
      .send({ status: 'paused', planName: 'Premium Plus' })
      .expect(200);
    expect(ServiceSchema.parse(paused.body)).toMatchObject({
      status: 'paused',
      planName: 'Premium Plus',
      monthlyPriceCents: 1999,
      priceSource: 'catalog',
    });

    const priced = await request(app)
      .patch(`/services/${service.id}`)
      .set('Authorization', auth)
      .send({ monthlyPriceCents: 1500 })
      .expect(200);
    expect(ServiceSchema.parse(priced.body)).toMatchObject({
      monthlyPriceCents: 1500,
      priceSource: 'manual',
    });
  });

  it('deletes a service', async () => {
    const auth = await asNewUser();
    const service = await addService(auth, { providerKey: 'disney-plus' });
    await request(app).delete(`/services/${service.id}`).set('Authorization', auth).expect(204);
    const list = await request(app).get('/services').set('Authorization', auth).expect(200);
    expect(
      ServiceSchema.array()
        .parse(list.body)
        .map((s) => s.id),
    ).not.toContain(service.id);
  });

  it("keeps each household's services private", async () => {
    const owner = await asNewUser();
    const other = await asNewUser();
    const service = await addService(owner, { providerKey: 'netflix' });

    const list = await request(app).get('/services').set('Authorization', other).expect(200);
    expect(
      ServiceSchema.array()
        .parse(list.body)
        .map((s) => s.id),
    ).not.toContain(service.id);
    await request(app)
      .patch(`/services/${service.id}`)
      .set('Authorization', other)
      .send({ status: 'paused' })
      .expect(404);
    await request(app).delete(`/services/${service.id}`).set('Authorization', other).expect(404);
  });
});
