import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DevTokenResponseSchema, type DevTokenResponse } from '@app/shared';
import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test';
import { API_URL } from '../playwright.config.ts';

interface Options {
  /** Sign the page in before the test (default). `test.use({ signedIn: false })` to opt out. */
  signedIn: boolean;
}

interface Fixtures {
  /** This test's own user: a fresh ID, so tests never see each other's data. */
  user: DevTokenResponse;
  /** HTTP client for the API, authorized as `user`: use it to set up data quickly. */
  api: APIRequestContext;
  /** Saves a full-page screenshot to apps/e2e/screenshots/<name>.png for visual review. */
  capture: (name: string) => Promise<void>;
}

/** Must match DEV_SESSION_COOKIE in apps/api/src/auth/web-sessions.ts. */
const DEV_SESSION_COOKIE = 'app_dev_session';

/**
 * - Every test fails if the page logs a console error or throws, so silent breakage can't pass.
 * - Every test runs as its own signed-in user (via the API's dev-only POST /auth/dev-token).
 */
export const test = base.extend<Fixtures & Options>({
  signedIn: [true, { option: true }],

  user: async ({ playwright }, use) => {
    const http = await playwright.request.newContext({ baseURL: API_URL });
    const res = await http.post('/auth/dev-token', { data: { userId: uniqueUserId() } });
    expect(res.ok(), 'dev sign-in (is AUTH_TEST_SECRET set for the API?)').toBe(true);
    await use(DevTokenResponseSchema.parse(await res.json()));
    await http.dispose();
  },

  api: async ({ playwright, user }, use) => {
    const http = await playwright.request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${user.token}` },
    });
    await use(http);
    await http.dispose();
  },

  page: async ({ page, signedIn, user, baseURL }, use) => {
    if (signedIn) {
      // The same session cookie the API's dev sign-in sets (the web app reaches the API at /api).
      await page
        .context()
        .addCookies([{ name: DEV_SESSION_COOKIE, value: user.token, url: baseURL ?? '' }]);
    }
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(`page error: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      // Chrome logs every 4xx response. An API client error (e.g. a wrong invite code) is
      // expected behaviour the UI shows and tests assert on; server errors still fail.
      const apiClientError =
        /status of 4\d\d/.test(message.text()) && message.location().url.includes('/api/');
      if (!apiClientError) errors.push(`console error: ${message.text()}`);
    });
    await use(page);
    expect(errors, 'the browser reported errors').toEqual([]);
  },

  capture: async ({ page }, use, testInfo) => {
    const dir = path.join(import.meta.dirname, '..', 'screenshots');
    mkdirSync(dir, { recursive: true });
    await use(async (name: string) => {
      const file = path.join(dir, `${name}.png`);
      // Grow the viewport to the whole page rather than using `fullPage`, so fixed elements
      // (the sidebar) span the full height of the screenshot.
      const viewport = page.viewportSize();
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      if (viewport) await page.setViewportSize({ width: viewport.width, height });
      await page.screenshot({ path: file });
      if (viewport) await page.setViewportSize(viewport);
      await testInfo.attach(name, { path: file, contentType: 'image/png' });
    });
  },
});

export { expect };
export type { Page };

/** A value no other test (or test run) will produce. See "Testing rules" in AGENTS.md. */
export function unique(label: string): string {
  return `${label} ${randomUUID().slice(0, 8)}`;
}

function uniqueUserId(): string {
  return `e2e-${randomUUID()}`;
}
