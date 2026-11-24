import { ApiErrorSchema, HouseholdSchema, ServiceSchema, type Household } from '@app/shared';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, unique, uniqueUserId } from './helpers.ts';

const { app, db } = createTestApp();

afterAll(async () => {
  await db.close();
});

async function asNewUser() {
  const userId = uniqueUserId();
  return { userId, auth: await bearer(userId) };
}

async function household(auth: string): Promise<Household> {
  const res = await request(app).get('/household').set('Authorization', auth).expect(200);
  return HouseholdSchema.parse(res.body);
}

describe('household API', () => {
  it('creates a household on first use, with the user as its only member', async () => {
    const { userId, auth } = await asNewUser();

    const first = await household(auth);

    expect(first.region).toBe('US');
    expect(first.inviteCode).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
    expect(first.members).toEqual([expect.objectContaining({ userId, isYou: true })]);
    expect((await household(auth)).id).toBe(first.id);
  });

  it('creates exactly one household under concurrent first requests', async () => {
    const { auth } = await asNewUser();
    const results = await Promise.all([household(auth), household(auth), household(auth)]);
    expect(new Set(results.map((h) => h.id)).size).toBe(1);
  });

  it('renames the household and changes its region', async () => {
    const { auth } = await asNewUser();
    const name = unique('The Smiths');

    const res = await request(app)
      .patch('/household')
      .set('Authorization', auth)
      .send({ name, region: 'ca' })
      .expect(200);

    expect(HouseholdSchema.parse(res.body)).toMatchObject({ name, region: 'CA' });
  });

  it('rejects an invalid region', async () => {
    const { auth } = await asNewUser();
    const res = await request(app)
      .patch('/household')
      .set('Authorization', auth)
      .send({ region: 'USA' })
      .expect(400);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('validation_error');
  });

  it('lets a second member join with the invite code and share data', async () => {
    const owner = await asNewUser();
    const partner = await asNewUser();
    const home = await household(owner.auth);
    const added = await request(app)
      .post('/services')
      .set('Authorization', owner.auth)
      .send({ providerKey: 'netflix' })
      .expect(201);
    const service = ServiceSchema.parse(added.body);
    const partnersOldHousehold = await household(partner.auth);

    const res = await request(app)
      .post('/household/join')
      .set('Authorization', partner.auth)
      .send({ inviteCode: home.inviteCode.toLowerCase() })
      .expect(200);

    const joined = HouseholdSchema.parse(res.body);
    expect(joined.id).toBe(home.id);
    expect(joined.members.map((m) => m.userId)).toEqual([owner.userId, partner.userId]);
    const partnerServices = await request(app)
      .get('/services')
      .set('Authorization', partner.auth)
      .expect(200);
    expect(ServiceSchema.array().parse(partnerServices.body)).toContainEqual(service);
    // The partner's empty old household is gone: its invite code no longer works.
    await request(app)
      .post('/household/join')
      .set('Authorization', (await asNewUser()).auth)
      .send({ inviteCode: partnersOldHousehold.inviteCode })
      .expect(404);
  });

  it('refuses an unknown invite code', async () => {
    const { auth } = await asNewUser();
    const res = await request(app)
      .post('/household/join')
      .set('Authorization', auth)
      .send({ inviteCode: 'NOPE0-NOPE0' })
      .expect(404);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('invalid_invite');
  });

  it('replaces the invite code so the old one stops working', async () => {
    const owner = await asNewUser();
    const { inviteCode } = await household(owner.auth);

    const res = await request(app)
      .post('/household/invite-code')
      .set('Authorization', owner.auth)
      .expect(200);

    expect(HouseholdSchema.parse(res.body).inviteCode).not.toBe(inviteCode);
    await request(app)
      .post('/household/join')
      .set('Authorization', (await asNewUser()).auth)
      .send({ inviteCode })
      .expect(404);
  });

  it('leaves a shared household for a fresh one, keeping the shared data', async () => {
    const owner = await asNewUser();
    const partner = await asNewUser();
    const home = await household(owner.auth);
    await request(app)
      .post('/household/join')
      .set('Authorization', partner.auth)
      .send({ inviteCode: home.inviteCode })
      .expect(200);

    const res = await request(app)
      .post('/household/leave')
      .set('Authorization', partner.auth)
      .expect(200);

    const fresh = HouseholdSchema.parse(res.body);
    expect(fresh.id).not.toBe(home.id);
    expect(fresh.members.map((m) => m.userId)).toEqual([partner.userId]);
    expect((await household(owner.auth)).members.map((m) => m.userId)).toEqual([owner.userId]);
  });
});
