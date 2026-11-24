import { ApiErrorSchema, ItemSchema, type Item } from '@app/shared';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, unique, uniqueUserId } from './helpers.ts';

const { app, db } = createTestApp();

afterAll(async () => {
  await db.close();
});

/** Signs in as a brand-new user for one test. */
async function asNewUser() {
  const userId = uniqueUserId();
  return { userId, auth: await bearer(userId) };
}

async function createItem(auth: string, name: string): Promise<Item> {
  const res = await request(app)
    .post('/items')
    .set('Authorization', auth)
    .send({ name })
    .expect(201);
  return ItemSchema.parse(res.body);
}

async function listItems(auth: string): Promise<Item[]> {
  const res = await request(app).get('/items').set('Authorization', auth).expect(200);
  return ItemSchema.array().parse(res.body);
}

describe('items API', () => {
  it('creates an item, trimming its name', async () => {
    const { auth } = await asNewUser();
    const name = unique('Deadlift');

    const item = await createItem(auth, `  ${name} `);

    expect(item.name).toBe(name);
    expect(await listItems(auth)).toContainEqual(item);
  });

  it('lists newest items first', async () => {
    const { auth } = await asNewUser();
    const first = await createItem(auth, unique('First'));
    const second = await createItem(auth, unique('Second'));

    const ids = (await listItems(auth)).map((item) => item.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
  });

  it('deletes an item', async () => {
    const { auth } = await asNewUser();
    const created = await createItem(auth, unique('Row'));

    await request(app).delete(`/items/${created.id}`).set('Authorization', auth).expect(204);

    expect((await listItems(auth)).map((item) => item.id)).not.toContain(created.id);
  });

  it("keeps each user's items private", async () => {
    const owner = await asNewUser();
    const other = await asNewUser();
    const item = await createItem(owner.auth, unique('Private'));

    expect((await listItems(other.auth)).map((i) => i.id)).not.toContain(item.id);
    // Another user's item doesn't exist for them: deleting it is a 404, and it survives.
    await request(app).delete(`/items/${item.id}`).set('Authorization', other.auth).expect(404);
    expect(await listItems(owner.auth)).toContainEqual(item);
  });

  it('rejects an invalid item with a validation error', async () => {
    const { auth } = await asNewUser();
    const res = await request(app)
      .post('/items')
      .set('Authorization', auth)
      .send({ name: '' })
      .expect(400);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('validation_error');
  });

  it('returns 404 when deleting a missing item', async () => {
    const { auth } = await asNewUser();
    const created = await createItem(auth, unique('Gone'));
    await request(app).delete(`/items/${created.id}`).set('Authorization', auth).expect(204);

    const res = await request(app)
      .delete(`/items/${created.id}`)
      .set('Authorization', auth)
      .expect(404);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('not_found');
  });

  it('returns 400 for malformed JSON', async () => {
    const { auth } = await asNewUser();
    const res = await request(app)
      .post('/items')
      .set('Authorization', auth)
      .set('content-type', 'application/json')
      .send('{bad')
      .expect(400);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('bad_request');
  });

  it('requires sign-in', async () => {
    const res = await request(app).get('/items').expect(401);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('unauthorized');
  });
});
