import { expect, test } from './fixtures.ts';

test.describe('preferences page', () => {
  test('changes what the plan is made for', async ({ page, api, capture }) => {
    await api.post('/services', { data: { providerKey: 'netflix', planName: 'Standard' } });
    await api.post('/watchlist', { data: { tmdbId: 1001, mediaType: 'tv' } });
    await page.goto('/');
    await page.getByRole('link', { name: 'Preferences', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Preferences' })).toBeVisible();

    await page.getByRole('group', { name: 'Ads' }).getByRole('button', { name: 'No ads' }).click();
    await expect(page.getByRole('status')).toHaveText(/Saved/);
    await page
      .getByRole('group', { name: 'Screens at once' })
      .getByRole('button', { name: '4+' })
      .click();
    await expect(
      page.getByRole('group', { name: 'Screens at once' }).getByRole('button', { name: '4+' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.waitForLoadState('networkidle');
    await capture('preferences');

    await page.getByRole('link', { name: 'See the plan' }).click();
    await expect(page.getByText(/Planned for: No ads · 4 screens/)).toBeVisible();
    // Netflix moves up to the plan with 4 screens.
    const netflix = page.getByRole('row', { name: 'Netflix', exact: true });
    await expect(netflix.getByText('Switch plan')).toBeVisible();
    await expect(netflix.getByText('Premium', { exact: true })).toBeVisible();
  });
});
