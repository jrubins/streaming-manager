import { z } from 'zod';

/** Response of GET /health. Example of a schema shared by the API and the web app. */
export const HealthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  database: z.enum(['up', 'down']),
  version: z.string(),
  time: z.iso.datetime(),
});
export type Health = z.infer<typeof HealthSchema>;
