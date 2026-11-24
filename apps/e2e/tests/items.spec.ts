import { ItemSchema } from '@app/shared';
import { expect, test, unique } from './fixtures.ts';

test.describe('items page', () => {
  test('adds an item', async ({ page, capture }) => {
    const name = unique('Squat');
    await page.goto('/items');

    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByLabel('Name')).toHaveValue('');
    await capture('items-after-add');
  });

  test('shows a validation error for an empty name', async ({ page }) => {
    await page.goto('/items');

    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
  });

  test('deletes an item', async ({ page, api }) => {
    // Set up through the API (fast), test the behaviour through the UI.
    const name = unique('Bench');
    const res = await api.post('/items', { data: { name } });
    const item = ItemSchema.parse(await res.json());

    await page.goto('/items');
    await page.getByRole('button', { name: `Delete ${item.name}` }).click();

    await expect(page.getByText(name)).toHaveCount(0);
  });

  test('is reachable from the navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Items' }).click();

    await expect(page).toHaveURL(/\/items$/);
    await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible();
  });
});
