import { z } from 'zod';

// Example resource shared by the API and the web app. Replace with your own models.

export const ItemSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  createdAt: z.iso.datetime(),
});
export type Item = z.infer<typeof ItemSchema>;

export const CreateItemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
});
export type CreateItem = z.infer<typeof CreateItemSchema>;

export const ItemIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
