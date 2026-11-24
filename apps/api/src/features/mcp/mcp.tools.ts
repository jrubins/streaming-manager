import { CreateItemSchema, ItemIdParamsSchema, ItemSchema } from '@app/shared';
import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import type { ItemsService } from '../items/items.service.ts';

export interface McpServices {
  items: ItemsService;
}

/**
 * The tools an MCP client (e.g. Claude) can call, all acting as `userId`. A fresh server is
 * built per request (stateless Streamable HTTP), so the user is fixed for its lifetime.
 * Tool inputs reuse the shared Zod schemas, exactly like the REST API.
 */
export function createMcpServer(services: McpServices, userId: string): McpServer {
  const server = new McpServer({ name: 'app', version: '1.0.0' });

  server.registerTool(
    'list_items',
    {
      title: 'List items',
      description: "List the signed-in user's items, newest first.",
      outputSchema: z.object({ items: ItemSchema.array() }),
      annotations: { readOnlyHint: true },
    },
    async () => {
      const output = { items: await services.items.list(userId) };
      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );

  server.registerTool(
    'add_item',
    {
      title: 'Add item',
      description: 'Add an item for the signed-in user.',
      inputSchema: CreateItemSchema,
      outputSchema: ItemSchema,
    },
    async (input) => {
      const item = await services.items.create(userId, input);
      return { content: [{ type: 'text', text: JSON.stringify(item) }], structuredContent: item };
    },
  );

  server.registerTool(
    'delete_item',
    {
      title: 'Delete item',
      description: 'Delete one of the signed-in user’s items by id.',
      inputSchema: ItemIdParamsSchema,
      annotations: { destructiveHint: true },
    },
    async ({ id }) => {
      await services.items.remove(userId, id);
      return { content: [{ type: 'text', text: `Deleted item ${id}` }] };
    },
  );

  return server;
}
