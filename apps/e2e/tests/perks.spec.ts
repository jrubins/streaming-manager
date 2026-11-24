import { expect, test } from './fixtures.ts';

/** YYYY-MM-DD, `days` from today. */
const dayFromToday = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

test.describe('perks', () => {
  test('records a service that comes with another plan, and warns before it ends', async ({
    page,
    api,
    capture,
  }) => {
    await api.post('/services', { data: { providerKey: 'peacock', planName: 'Premium' } });
    await api.post('/watchlist', { data: { tmdbId: 1009, mediaType: 'tv' } }); // On Peacock.
    await page.goto('/services');

    await page.getByRole('button', { name: 'Peacock actions' }).last().click();
    await page.getByRole('menuitem', { name: 'Comes with another plan…' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Comes with').fill('Xfinity');
    await dialog.getByLabel('Last day (optional)').fill(dayFromToday(10));
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toHaveCount(0);

    const table = page.getByRole('table');
    await expect(table.getByText(/Free via Xfinity until/)).toBeVisible();
    await expect(table.getByRole('row', { name: /Active services/ })).toContainText('$0.00');
    await page.waitForLoadState('networkidle');
    await capture('services-perk');

    await page.getByRole('link', { name: 'Plan', exact: true }).click();
    const notice = page.getByRole('region', { name: 'Perks ending soon' });
    await expect(notice).toContainText('Peacock from Xfinity ends in 10 days');
    await expect(
      page.getByRole('row', { name: /Peacock/ }).getByText(/Free via Xfinity/),
    ).toBeVisible();
    await page.waitForLoadState('networkidle');
    await capture('plan-perk-ending');
  });

  test('finds perks of memberships the household has, and uses them in the plan', async ({
    page,
    api,
    capture,
  }) => {
    await api.post('/watchlist', { data: { tmdbId: 1009, mediaType: 'tv' } }); // On Peacock.
    await page.goto('/services');
    await page.getByRole('tab', { name: 'Offers' }).click();
    await page
      .getByRole('group', { name: 'Memberships' })
      .getByRole('button', { name: 'Walmart+' })
      .click();
    const yours = page.getByRole('list', { name: 'Offers with your memberships' });
    await expect(yours.getByText('Free with Walmart+').first()).toBeVisible();
    await expect(yours.getByRole('listitem').first()).toContainText('On your watchlist');
    await page.waitForLoadState('networkidle');
    await capture('services-offers');

    // The plan suggests the free perk.
    await page.getByRole('link', { name: 'Plan', exact: true }).click();
    await expect(
      page.getByRole('row', { name: /Peacock/ }).getByText('Free with Walmart+'),
    ).toBeVisible();
    await page.waitForLoadState('networkidle');
    await capture('plan-membership-perk');

    // Claiming it records the perk on the service.
    await page.getByRole('link', { name: 'Services', exact: true }).click();
    await page.getByRole('tab', { name: 'Offers' }).click();
    await yours.getByRole('button', { name: /We get this.*Peacock with Walmart\+/ }).click();
    await expect(page.getByRole('table').getByText('Free via Walmart+')).toBeVisible();
  });
});
