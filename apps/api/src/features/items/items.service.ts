import * as Sentry from '@sentry/node';
import type { Db } from '@app/db';
import type { CreateItem, Item } from '@app/shared';
import { notFound } from '../../lib/http-error.ts';

type ItemRow = { id: number; name: string; createdAt: Date };

const toItem = (row: ItemRow): Item => ({
  id: row.id,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
});

/**
 * Business logic for items. Handlers stay thin; the database is only touched here.
 * Every method takes the acting user's ID and only ever reads or writes that user's rows.
 */
export function createItemsService(db: Db) {
  return {
    async list(userId: string): Promise<Item[]> {
      // Newest first; id breaks ties between rows created in the same millisecond.
      const rows = await db.orm.public.Item.where({ userId })
        .orderBy([(item) => item.createdAt.desc(), (item) => item.id.desc()])
        .limit(100)
        .all();
      return rows.map(toItem);
    },

    async create(userId: string, input: CreateItem): Promise<Item> {
      const row = await db.orm.public.Item.create({ userId, name: input.name });
      // Example custom metric (a no-op while Sentry is disabled).
      Sentry.metrics.count('items.created', 1);
      return toItem(row);
    },

    async remove(userId: string, id: number): Promise<void> {
      // Another user's item is reported as missing, never as forbidden: it doesn't exist for them.
      const deleted = await db.orm.public.Item.where({ id, userId }).delete();
      if (!deleted) throw notFound(`Item ${id} not found`);
    },
  };
}

export type ItemsService = ReturnType<typeof createItemsService>;
