import { randomUUID } from 'node:crypto';
import { createDb } from '@app/db';
import { pino } from 'pino';
import { createApp } from '../src/app.ts';
import { createTmdbClient } from '../src/features/catalog/tmdb.client.ts';
import { createTmdbStub, type TmdbStub } from './tmdb-stub.ts';
import type { WorkosSessions } from '../src/auth/workos-sessions.ts';
import { signTestToken } from '../src/auth/tokens.ts';
import { loadConfig } from '../src/config.ts';

/** Secret for test tokens: from the environment (.env / CI), or a fixed fallback. */
export const TEST_SECRET =
  process.env['AUTH_TEST_SECRET'] ?? 'api-test-secret-0123456789abcdefghijklmnop';

/**
 * Builds a real app wired to the test database, with logging silenced and test tokens
 * accepted. Pass env overrides to test configuration-dependent behaviour, and a fake WorkOS
 * to test web sign-in without calling WorkOS.
 */
export function createTestApp(
  overrides: Record<string, string> = {},
  deps: { workos?: WorkosSessions; tmdbStub?: TmdbStub } = {},
) {
  const config = loadConfig({
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: process.env['TEST_DATABASE_URL'],
    SENTRY_DSN: '',
    CORS_ORIGINS: 'http://localhost:5173',
    WORKOS_CLIENT_ID: '',
    WORKOS_API_KEY: '',
    WORKOS_COOKIE_PASSWORD: '',
    WEB_URL: 'http://localhost:5173',
    AUTHKIT_DOMAIN: '',
    ALLOWED_USER_IDS: '',
    MCP_RESOURCE_URL: 'http://localhost:3000/mcp',
    AUTH_TEST_SECRET: TEST_SECRET,
    TMDB_API_TOKEN: 'test-tmdb-token-0123456789',
    TMDB_API_URL: 'https://tmdb.test',
    TMDB_IMAGE_URL: 'https://images.tmdb.test/t/p',
    ...overrides,
  });
  const db = createDb(config.DATABASE_URL, { max: 2 });
  // TMDB is never called for real: the client's network is the in-process stub.
  const tmdbStub = deps.tmdbStub ?? createTmdbStub();
  const tmdb = createTmdbClient({
    token: config.TMDB_API_TOKEN,
    apiUrl: config.TMDB_API_URL,
    imageUrl: config.TMDB_IMAGE_URL,
    fetch: tmdbStub.fetch,
  });
  const app = createApp({
    config,
    db,
    logger: pino({ level: 'silent' }),
    tmdb,
    ...(deps.workos ? { workos: deps.workos } : {}),
  });
  return { app, db, config, tmdbStub };
}

/**
 * A value no other test (or test run) will produce. Tests share one database and run in
 * parallel, so each test creates its own rows with unique values and asserts only on those,
 * never on table counts or on rows it didn't create.
 */
export function unique(label: string): string {
  return `${label} ${randomUUID()}`;
}

/** A fresh user ID: each test can act as its own user, fully isolated from the others. */
export function uniqueUserId(): string {
  return `test-user-${randomUUID()}`;
}

/** `Authorization` header value for a test token. */
export async function bearer(userId: string): Promise<string> {
  return `Bearer ${await signTestToken(TEST_SECRET, userId)}`;
}
