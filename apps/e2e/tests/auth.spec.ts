import { randomUUID } from 'node:crypto';
import { DevTokenResponseSchema } from '@app/shared';
import { API_URL } from '../playwright.config.ts';
import { expect, test, unique } from './fixtures.ts';

test.describe('signed out', () => {
  test.use({ signedIn: false });

  test('shows the sign-in screen, then the app after signing in', async ({ page, capture }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await capture('sign-in');

    await page.getByLabel('User ID').fill(`e2e-signin-${randomUUID()}`);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();

    // The session is an HttpOnly cookie on the web app's origin, so it survives a reload.
    const cookies = await page.context().cookies();
    expect(cookies.find((cookie) => cookie.name === 'app_dev_session')?.httpOnly).toBe(true);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
  });
});

test('signs out', async ({ page, user }) => {
  await page.goto('/');
  await expect(page.getByText(user.userId)).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  // Signed out for good: a reload doesn't bring the session back.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test("doesn't show other users' items", async ({ page, api, playwright }) => {
  // Another user's item, created through the API as that user.
  const other = await playwright.request.newContext({ baseURL: API_URL });
  const signIn = await other.post('/auth/dev-token', {
    data: { userId: `e2e-other-${randomUUID()}` },
  });
  const { token } = DevTokenResponseSchema.parse(await signIn.json());
  const foreign = unique('Foreign');
  await other.post('/items', {
    data: { name: foreign },
    headers: { Authorization: `Bearer ${token}` },
  });
  await other.dispose();
  // And one of our own, so the list isn't empty.
  const mine = unique('Mine');
  await api.post('/items', { data: { name: mine } });

  await page.goto('/items');

  await expect(page.getByText(mine)).toBeVisible();
  await expect(page.getByText(foreign)).toHaveCount(0);
});
