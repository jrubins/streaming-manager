import {
  ApiErrorSchema,
  ChannelCatalogSchema,
  HouseholdChannelsSchema,
  RotationPlanSchema,
  type RotationPlan,
} from '@app/shared';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, uniqueUserId } from './helpers.ts';

const { app, db } = createTestApp();

afterAll(async () => {
  await db.close();
});

async function setChannels(auth: string, channels: string[]) {
  const res = await request(app)
    .put('/household/channels')
    .set('Authorization', auth)
    .send({ channels })
    .expect(200);
  return HouseholdChannelsSchema.parse(res.body);
}

async function plan(auth: string): Promise<RotationPlan> {
  const res = await request(app).get('/rotation').set('Authorization', auth).expect(200);
  return RotationPlanSchema.parse(res.body);
}

describe('channels', () => {
  it('lists channels with the services that carry them', async () => {
    const auth = await bearer(uniqueUserId());
    const res = await request(app).get('/catalog/channels').set('Authorization', auth).expect(200);
    const catalog = ChannelCatalogSchema.parse(res.body);
    expect(catalog.channels).toContainEqual(
      expect.objectContaining({ key: 'mtv', category: 'entertainment', local: false }),
    );
    expect(catalog.channels.find((c) => c.key === 'cbs')).toMatchObject({ local: true });
    expect(catalog.lookups).toContainEqual(expect.objectContaining({ name: 'YouTube TV' }));
  });

  it('saves the channels a household needs, rejecting unknown ones', async () => {
    const auth = await bearer(uniqueUserId());
    expect(await setChannels(auth, ['mtv', 'espn', 'mtv'])).toEqual({
      channels: ['espn', 'mtv'],
    });
    const read = await request(app).get('/household/channels').set('Authorization', auth);
    expect(read.body).toEqual({ channels: ['espn', 'mtv'] });

    const bad = await request(app)
      .put('/household/channels')
      .set('Authorization', auth)
      .send({ channels: ['nope'] })
      .expect(400);
    expect(ApiErrorSchema.parse(bad.body).error.code).toBe('unknown_channel');
  });

  it('covers needed channels with the cheapest services that carry them', async () => {
    const auth = await bearer(uniqueUserId());
    // MTV is on Philo ($33); ESPN isn't, but it is on Sling Orange ($45.99): together they
    // beat YouTube TV ($82.99), which carries both.
    await setChannels(auth, ['mtv', 'espn']);
    const p = await plan(auth);
    expect(p.entries.find((e) => e.offering.key === 'philo')).toMatchObject({
      state: 'subscribe',
      channels: ['MTV'],
    });
    expect(p.entries.find((e) => e.offering.key === 'sling-orange')).toMatchObject({
      state: 'subscribe',
      channels: ['ESPN'],
    });
    expect(p.plannedCostCents).toBe(3300 + 4599);
    expect(p.uncoveredChannels).toEqual([]);
  });
});
