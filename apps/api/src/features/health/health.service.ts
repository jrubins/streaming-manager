import type { Db } from '@app/db';
import type { Health } from '@app/shared';

export function createHealthService(db: Db, version: string) {
  return {
    async check(): Promise<Health> {
      const databaseUp = await db.ping();
      return {
        status: databaseUp ? 'ok' : 'degraded',
        database: databaseUp ? 'up' : 'down',
        version,
        time: new Date().toISOString(),
      };
    },
  };
}

export type HealthService = ReturnType<typeof createHealthService>;
