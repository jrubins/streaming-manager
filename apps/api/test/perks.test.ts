import {
  ApiErrorSchema,
  HouseholdMembershipsSchema,
  OffersSchema,
  RotationPlanSchema,
  ServiceSchema,
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

/** YYYY-MM-DD, `days` from today. */
const dayFromToday = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

describe('service perks', () => {
  it('records a perk on a service, and clears it', async () => {
    const auth = await bearer(uniqueUserId());
    const perk = { via: 'Xfinity', monthlyPriceCents: 0, endsOn: '2027-03-01' };
    const peacock = ServiceSchema.parse(
      await post(auth, '/services', { providerKey: 'peacock', planName: 'Premium', perk }),
    );
    expect(peacock).toMatchObject({ perk, monthlyPriceCents: 1299 });

    const res = await request(app)
      .patch(`/services/${peacock.id}`)
      .set('Authorization', auth)
      .send({ perk: null })
      .expect(200);
    expect(ServiceSchema.parse(res.body).perk).toBeNull();
  });

  it('rejects a perk with a malformed end date', async () => {
    const auth = await bearer(uniqueUserId());
    const res = await request(app)
      .post('/services')
      .set('Authorization', auth)
      .send({
        providerKey: 'peacock',
        perk: { via: 'Xfinity', monthlyPriceCents: 0, endsOn: 'March' },
      })
      .expect(400);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('validation_error');
  });

  it('plans a free perk at no cost, and at the regular price once it has ended', async () => {
    const auth = await bearer(uniqueUserId());
    await post(auth, '/watchlist', { tmdbId: 1009, mediaType: 'tv' }); // On Peacock.
    const peacock = ServiceSchema.parse(
      await post(auth, '/services', {
        providerKey: 'peacock',
        planName: 'Premium',
        perk: { via: 'Xfinity', monthlyPriceCents: 0, endsOn: dayFromToday(10) },
      }),
    );

    const during = await plan(auth);
    expect(entry(during, 'peacock')).toMatchObject({ state: 'keep', plannedCostCents: 0 });
    expect(entry(during, 'peacock')?.service?.perk?.via).toBe('Xfinity');
    expect(during.currentCostCents).toBe(0);

    await request(app)
      .patch(`/services/${peacock.id}`)
      .set('Authorization', auth)
      .send({ perk: { via: 'Xfinity', monthlyPriceCents: 0, endsOn: dayFromToday(-1) } })
      .expect(200);
    const after = await plan(auth);
    // Paying again, the cheapest plan that meets the preferences wins.
    expect(entry(after, 'peacock')).toMatchObject({
      state: 'keep',
      planChange: true,
      plannedCostCents: 899,
    });
    expect(after.currentCostCents).toBe(1299);
    expect(entry(after, 'peacock')?.service?.perk).toBeNull();
  });
});

describe('memberships and offers', () => {
  it('lists offers for the region', async () => {
    const auth = await bearer(uniqueUserId());
    const res = await request(app).get('/catalog/offers').set('Authorization', auth).expect(200);
    const offers = OffersSchema.parse(res.body);
    expect(offers.memberships).toContainEqual(
      expect.objectContaining({ key: 'walmart-plus', name: 'Walmart+' }),
    );
    expect(offers.offers).toContainEqual(
      expect.objectContaining({
        id: 'xfinity-peacock',
        membershipName: 'Xfinity',
        providerName: 'Peacock',
        monthlyPriceCents: 0,
      }),
    );
  });

  it('saves the household memberships, rejecting unknown ones', async () => {
    const auth = await bearer(uniqueUserId());
    const saved = await request(app)
      .put('/household/memberships')
      .set('Authorization', auth)
      .send({ memberships: ['walmart-plus', 'xfinity', 'walmart-plus'] })
      .expect(200);
    expect(HouseholdMembershipsSchema.parse(saved.body).memberships).toEqual([
      'walmart-plus',
      'xfinity',
    ]);
    const read = await request(app)
      .get('/household/memberships')
      .set('Authorization', auth)
      .expect(200);
    expect(read.body).toEqual(saved.body);

    const bad = await request(app)
      .put('/household/memberships')
      .set('Authorization', auth)
      .send({ memberships: ['nope'] })
      .expect(400);
    expect(ApiErrorSchema.parse(bad.body).error.code).toBe('unknown_membership');
  });

  it('plans with perks the household is entitled to but has not claimed', async () => {
    const auth = await bearer(uniqueUserId());
    await post(auth, '/watchlist', { tmdbId: 1009, mediaType: 'tv' }); // On Peacock.
    await request(app)
      .put('/household/memberships')
      .set('Authorization', auth)
      .send({ memberships: ['walmart-plus'] })
      .expect(200);

    const p = await plan(auth);
    expect(entry(p, 'peacock')).toMatchObject({
      state: 'subscribe',
      plannedCostCents: 0,
      plan: { name: 'Premium (Walmart+)', perk: { via: 'Walmart+' } },
    });
  });
});
