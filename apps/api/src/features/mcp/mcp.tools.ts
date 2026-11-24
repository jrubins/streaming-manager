import {
  AddToWatchlistSchema,
  CatalogProviderSchema,
  CreateServiceSchema,
  RotationPlanSchema,
  ServiceIdParamsSchema,
  ServiceSchema,
  TitleSearchQuerySchema,
  TitleSearchResultSchema,
  UpdateServiceSchema,
  UpdateWatchlistShowSchema,
  WatchlistShowIdParamsSchema,
  WatchlistShowSchema,
} from '@app/shared';
import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import type { CatalogService } from '../catalog/catalog.service.ts';
import type { HouseholdService } from '../household/household.service.ts';
import type { RotationService } from '../rotation/rotation.service.ts';
import type { StreamingServicesService } from '../streaming-services/streaming-services.service.ts';
import type { WatchlistService } from '../watchlist/watchlist.service.ts';

export interface McpServices {
  households: HouseholdService;
  catalog: CatalogService;
  streamingServices: StreamingServicesService;
  watchlist: WatchlistService;
  rotation: RotationService;
}

function result<T extends Record<string, unknown>>(output: T) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(output) }],
    structuredContent: output,
  };
}

/**
 * The tools an MCP client (e.g. Claude) can call, all acting as `userId` in their household.
 * A fresh server is built per request (stateless Streamable HTTP), so the user is fixed for
 * its lifetime. Tool inputs reuse the shared Zod schemas, exactly like the REST API.
 */
export function createMcpServer(services: McpServices, userId: string): McpServer {
  const server = new McpServer({ name: 'stream-rotation', version: '1.0.0' });

  server.registerTool(
    'get_rotation_plan',
    {
      title: 'Get rotation plan',
      description:
        "This month's plan for the household's streaming services: each service is keep (active " +
        'and needed), pause (active, not needed: the savings), resume (paused, but needed) or ' +
        'paused. The plan uses the fewest, then cheapest, services that carry every unwatched ' +
        'title. Costs are in cents per month.',
      outputSchema: RotationPlanSchema,
      annotations: { readOnlyHint: true },
    },
    async () => result(await services.rotation.plan(userId)),
  );

  server.registerTool(
    'list_watchlist',
    {
      title: 'List watchlist',
      description:
        "The household's watchlist, newest first, with the services each title streams on.",
      outputSchema: z.object({ shows: WatchlistShowSchema.array() }),
      annotations: { readOnlyHint: true },
    },
    async () => result({ shows: await services.watchlist.list(userId) }),
  );

  server.registerTool(
    'search_titles',
    {
      title: 'Search titles',
      description: 'Search TMDB for TV shows and movies to add to the watchlist.',
      inputSchema: TitleSearchQuerySchema,
      outputSchema: z.object({ results: TitleSearchResultSchema.array() }),
      annotations: { readOnlyHint: true },
    },
    async ({ q }) => result({ results: await services.catalog.search(q) }),
  );

  server.registerTool(
    'add_to_watchlist',
    {
      title: 'Add to watchlist',
      description: 'Add a title (tmdbId and mediaType from search_titles) to the watchlist.',
      inputSchema: AddToWatchlistSchema,
      outputSchema: WatchlistShowSchema,
    },
    async (input) => result(await services.watchlist.add(userId, input)),
  );

  server.registerTool(
    'set_watched',
    {
      title: 'Mark watched or unwatched',
      description: 'Mark a watchlist entry as watched (it no longer needs a service) or not.',
      inputSchema: WatchlistShowIdParamsSchema.extend(UpdateWatchlistShowSchema.shape),
      outputSchema: WatchlistShowSchema,
    },
    async ({ id, watched }) => result(await services.watchlist.update(userId, id, { watched })),
  );

  server.registerTool(
    'remove_from_watchlist',
    {
      title: 'Remove from watchlist',
      description: 'Remove a title from the watchlist by its watchlist id.',
      inputSchema: WatchlistShowIdParamsSchema,
      annotations: { destructiveHint: true },
    },
    async ({ id }) => {
      await services.watchlist.remove(userId, id);
      return { content: [{ type: 'text', text: `Removed watchlist entry ${id}` }] };
    },
  );

  server.registerTool(
    'list_services',
    {
      title: 'List services',
      description: "The household's streaming services, active or paused, with monthly prices.",
      outputSchema: z.object({ services: ServiceSchema.array() }),
      annotations: { readOnlyHint: true },
    },
    async () => result({ services: await services.streamingServices.list(userId) }),
  );

  server.registerTool(
    'list_available_services',
    {
      title: 'List available services',
      description:
        "Streaming services in the household's region that can be added, with known plan prices.",
      outputSchema: z.object({ providers: CatalogProviderSchema.array() }),
      annotations: { readOnlyHint: true },
    },
    async () => result({ providers: await services.catalog.providers(userId) }),
  );

  server.registerTool(
    'add_service',
    {
      title: 'Add service',
      description:
        'Add a streaming service by provider key (from list_available_services). Without a ' +
        "price, the named plan's (or the cheapest plan's) published price is used.",
      inputSchema: CreateServiceSchema,
      outputSchema: ServiceSchema,
    },
    async (input) => result(await services.streamingServices.create(userId, input)),
  );

  server.registerTool(
    'update_service',
    {
      title: 'Update service',
      description:
        'Change a service: status ("active" after resuming it, "paused" after pausing it), plan ' +
        'or monthly price in cents.',
      inputSchema: ServiceIdParamsSchema.extend(UpdateServiceSchema.shape),
      outputSchema: ServiceSchema,
    },
    async ({ id, ...changes }) =>
      result(await services.streamingServices.update(userId, id, changes)),
  );

  return server;
}
