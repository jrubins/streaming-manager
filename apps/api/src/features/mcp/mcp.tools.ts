import {
  AddToWatchlistSchema,
  CatalogProviderSchema,
  CreateServiceSchema,
  PreferencesSchema,
  RotationPlanSchema,
  ServiceIdParamsSchema,
  ServiceSchema,
  TitleSearchQuerySchema,
  TitleSearchResultSchema,
  UpdatePreferencesSchema,
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
        "This month's plan: the cheapest set of subscriptions (services or bundles), each on " +
        "its cheapest plan that meets the household's preferences, that carries every unwatched " +
        'title. Each entry is keep, pause, resume, paused or subscribe (not subscribed yet), ' +
        'with planChange when it should switch plan. Alternatives show the cost under other ' +
        'preferences (e.g. no ads). Costs are in cents per month.',
      outputSchema: RotationPlanSchema,
      annotations: { readOnlyHint: true },
    },
    async () => result(await services.rotation.plan(userId)),
  );

  server.registerTool(
    'get_preferences',
    {
      title: 'Get preferences',
      description:
        'What the household needs from its plans: ads allowed, screens at once, 4K, downloads, ' +
        "and whether to suggest services it doesn't have.",
      outputSchema: PreferencesSchema,
      annotations: { readOnlyHint: true },
    },
    async () => result(await services.households.preferences(userId)),
  );

  server.registerTool(
    'update_preferences',
    {
      title: 'Update preferences',
      description: 'Change what the household needs from its plans; the plan follows.',
      inputSchema: UpdatePreferencesSchema,
      outputSchema: PreferencesSchema,
    },
    async (input) => result(await services.households.updatePreferences(userId, input)),
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
        "Streaming services and bundles in the household's region that can be added, with " +
        'known plans (price, ads, screens, 4K, downloads).',
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
        'Add a streaming service or bundle by key (from list_available_services). Without a ' +
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
