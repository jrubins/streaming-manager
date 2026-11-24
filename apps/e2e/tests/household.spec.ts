import { randomUUID } from 'node:crypto';
import { DevTokenResponseSchema, HouseholdSchema } from '@app/shared';
import { API_URL } from '../playwright.config.ts';
import { expect, test, unique } from './fixtures.ts';

test.describe('household page', () => {
  test('renames the household and shares it with a partner', async ({
    page,
    api,
    playwright,
    capture,
  }) => {
    const household = HouseholdSchema.parse(await (await api.get('/household')).json());
    await page.goto('/household');
    await expect(page.getByRole('heading', { level: 1, name: 'Household' })).toBeVisible();
    await expect(page.getByLabel('Your invite code')).toHaveText(household.inviteCode);

    const name = unique('The Parkers');
    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Save' }).click();
    // The sidebar shows the household's new name.
    await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();

    // A partner signs in with their own account and joins with the code.
    const partner = await playwright.request.newContext({ baseURL: API_URL });
    const signIn = await partner.post('/auth/dev-token', {
      data: { userId: `e2e-partner-${randomUUID()}` },
    });
    const { token } = DevTokenResponseSchema.parse(await signIn.json());
    const joined = await partner.post('/household/join', {
      data: { inviteCode: household.inviteCode },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(joined.ok()).toBe(true);
    await partner.dispose();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Members (2)' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await capture('household');
  });

  test('explains an unknown invite code', async ({ page }) => {
    await page.goto('/household');
    await page.getByLabel('Invite code', { exact: true }).fill('NOPE0-NOPE0');
    await page.getByRole('button', { name: 'Join' }).click();
    await expect(page.getByText('No household has that invite code')).toBeVisible();
  });
});
