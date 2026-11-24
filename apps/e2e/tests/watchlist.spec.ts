import { expect, test } from './fixtures.ts';

test.describe('watchlist page', () => {
  test('searches, adds, marks watched and removes titles', async ({ page, api, capture }) => {
    await api.post('/services', { data: { providerKey: 'netflix' } });
    await api.post('/watchlist', { data: { tmdbId: 1003, mediaType: 'tv' } });
    await api.post('/watchlist', { data: { tmdbId: 1005, mediaType: 'tv' } });
    await page.goto('/');
    await page.getByRole('link', { name: 'Watchlist' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Watchlist' })).toBeVisible();

    await page.getByLabel('Search for a show or movie').fill('harbor');
    const results = page.getByRole('list', { name: 'Search results' });
    await expect(results.getByText('The Long Harbor')).toBeVisible();
    await expect(results.getByText('Harbor Person')).toHaveCount(0);
    await page.getByRole('button', { name: 'Add The Long Harbor' }).click();
    await expect(page.getByRole('button', { name: 'Added The Long Harbor' })).toBeVisible();

    const harbor = page.getByRole('article', { name: 'The Long Harbor' });
    await expect(harbor.getByText('On Netflix')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'To watch (3)' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await capture('watchlist-search');

    await page.getByLabel('Search for a show or movie').press('Escape');
    await harbor.getByRole('button', { name: 'Mark The Long Harbor watched' }).click();
    await expect(page.getByRole('tab', { name: 'Watched (1)' })).toBeVisible();
    await page.getByRole('tab', { name: 'Watched (1)' }).click();
    await expect(
      page.getByRole('article', { name: 'The Long Harbor' }).getByText('Watched'),
    ).toBeVisible();

    await page.getByRole('tab', { name: 'To watch (2)' }).click();
    await page.getByRole('button', { name: 'Remove Glass Orchard' }).click();
    await expect(page.getByRole('article', { name: 'Glass Orchard' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'To watch (1)' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await capture('watchlist');
  });

  test('shows the most popular matches first, in a list that scrolls on its own', async ({
    page,
    capture,
  }) => {
    await page.goto('/watchlist');
    await page.getByLabel('Search for a show or movie').fill('a');
    const results = page.getByRole('list', { name: 'Search results' });
    await expect(results.getByRole('listitem').first()).toContainText('Glass Orchard');
    await expect(page.getByText(/titles, most popular first/)).toBeVisible();

    const scrolls = await results.evaluate((list) => list.scrollHeight > list.clientHeight);
    expect(scrolls).toBe(true);
    // The tabs below the results stay on the first screen.
    await expect(page.getByRole('tab', { name: /To watch/ })).toBeInViewport();
    await page.waitForLoadState('networkidle');
    await capture('watchlist-search-many');
  });
});
