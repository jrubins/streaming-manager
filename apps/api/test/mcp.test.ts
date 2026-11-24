import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { ApiErrorSchema, ItemSchema } from '@app/shared';
import express from 'express';
import { pino } from 'pino';
import { pinoHttp } from 'pino-http';
import request from 'supertest';
import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mcpMetadataRouter } from '../src/features/mcp/mcp.routes.ts';
import { errorHandler } from '../src/middleware/error-handler.ts';
import { bearer, createTestApp, unique, uniqueUserId } from './helpers.ts';

const AUTHKIT = 'https://example.authkit.app';
const { app, db } = createTestApp({ AUTHKIT_DOMAIN: AUTHKIT });
let server: Server;
let mcpUrl: URL;

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  mcpUrl = new URL(`http://127.0.0.1:${(server.address() as AddressInfo).port}/mcp`);
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.close();
});

/** An MCP client signed in as `userId`, like Claude after the OAuth flow. */
async function connect(userId: string): Promise<Client> {
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(mcpUrl, {
    requestInit: { headers: { Authorization: await bearer(userId) } },
  });
  await client.connect(transport);
  return client;
}

describe('MCP endpoint', () => {
  it('lists the tools', async () => {
    const client = await connect(uniqueUserId());
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining(['list_items', 'add_item', 'delete_item']),
    );
    await client.close();
  });

  it("acts as the signed-in user, on that user's data only", async () => {
    const alice = await connect(uniqueUserId());
    const bob = await connect(uniqueUserId());
    const name = unique('Squat');

    const added = await alice.callTool({ name: 'add_item', arguments: { name } });
    const item = ItemSchema.parse(added.structuredContent);

    const ItemList = z.object({ items: ItemSchema.array() });
    const aliceList = await alice.callTool({ name: 'list_items', arguments: {} });
    expect(ItemList.parse(aliceList.structuredContent).items).toContainEqual(item);
    const bobList = await bob.callTool({ name: 'list_items', arguments: {} });
    expect(ItemList.parse(bobList.structuredContent).items.map((i) => i.id)).not.toContain(item.id);

    await alice.close();
    await bob.close();
  });

  it('reports invalid tool input as an error result', async () => {
    const client = await connect(uniqueUserId());
    const result = await client.callTool({ name: 'add_item', arguments: { name: '' } });
    expect(result.isError).toBe(true);
    await client.close();
  });
});

describe('MCP authorization', () => {
  it('challenges unauthenticated requests with the resource metadata URL', async () => {
    const res = await request(app).post('/mcp').send({}).expect(401);
    expect(res.headers['www-authenticate']).toContain(
      'resource_metadata="http://localhost:3000/.well-known/oauth-protected-resource/mcp"',
    );
  });

  it('publishes protected resource metadata naming AuthKit', async () => {
    const res = await request(app).get('/.well-known/oauth-protected-resource/mcp').expect(200);
    expect(res.body).toMatchObject({
      resource: 'http://localhost:3000/mcp',
      authorization_servers: [AUTHKIT],
    });
  });

  it('only accepts POST', async () => {
    await request(app).get('/mcp').expect(405);
  });
});

describe('authorization server metadata (for older MCP clients)', () => {
  const upstream = {
    issuer: AUTHKIT,
    authorization_endpoint: `${AUTHKIT}/oauth2/authorize`,
    token_endpoint: `${AUTHKIT}/oauth2/token`,
  };

  function appWith(fetchMetadata: (url: string) => Promise<Response>) {
    const metadataApp = express();
    metadataApp.use(pinoHttp({ logger: pino({ level: 'silent' }) }));
    metadataApp.use(mcpMetadataRouter('http://localhost:3000/mcp', AUTHKIT, fetchMetadata));
    metadataApp.use(errorHandler);
    return metadataApp;
  }

  it("passes AuthKit's own metadata through, unchanged and cached", async () => {
    const requested: string[] = [];
    const metadataApp = appWith((url) => {
      requested.push(url);
      return Promise.resolve(Response.json(upstream));
    });

    await request(metadataApp).get('/.well-known/oauth-authorization-server').expect(200, upstream);
    await request(metadataApp).get('/.well-known/oauth-authorization-server').expect(200, upstream);

    expect(requested).toEqual([`${AUTHKIT}/.well-known/oauth-authorization-server`]);
  });

  it('reports a 502 when AuthKit is unavailable', async () => {
    const metadataApp = appWith(() => Promise.resolve(new Response('down', { status: 503 })));
    const res = await request(metadataApp)
      .get('/.well-known/oauth-authorization-server')
      .expect(502);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('bad_gateway');
  });

  it('reports a 502 when AuthKit is unreachable', async () => {
    const metadataApp = appWith(() => Promise.reject(new TypeError('fetch failed')));
    const res = await request(metadataApp)
      .get('/.well-known/oauth-authorization-server')
      .expect(502);
    expect(ApiErrorSchema.parse(res.body).error.code).toBe('bad_gateway');
  });
});
