import { expect, test, unique } from './fixtures.ts';

test('home page shows API status and the items chart', async ({ page, api, capture }) => {
  // A new user has no items (and so no chart): give this one an item first.
  await api.post('/items', { data: { name: unique('Squat') } });
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
  await expect(page.getByText('API ok')).toBeVisible();
  await expect(page.getByText('Database up')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Items per day' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Items created per day' })).toBeVisible();

  await capture('home');
});
