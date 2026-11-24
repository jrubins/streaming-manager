import { expect, test } from './fixtures.ts';

test.describe('services page', () => {
  test('adds a service, changes its plan, price and status', async ({ page, api, capture }) => {
    await api.post('/services', { data: { providerKey: 'hulu' } });
    await api.post('/services', { data: { providerKey: 'peacock', status: 'paused' } });
    await page.goto('/services');
    await expect(page.getByRole('heading', { level: 1, name: 'Services' })).toBeVisible();

    await page.getByRole('button', { name: /^Add Netflix/ }).click();
    const netflix = page.getByRole('row', { name: 'Netflix', exact: true });
    await expect(netflix.getByLabel('Netflix monthly price')).toHaveValue('8.99');
    await expect(page.getByRole('button', { name: /^Add Netflix/ })).toHaveCount(0);

    await netflix.getByRole('combobox', { name: 'Netflix plan' }).click();
    await page.getByRole('option', { name: 'Premium · $26.99' }).click();
    await expect(netflix.getByLabel('Netflix monthly price')).toHaveValue('26.99');

    await netflix.getByLabel('Netflix monthly price').fill('24.50');
    await netflix.getByLabel('Netflix monthly price').press('Enter');
    await expect(netflix.getByText('Entered by you')).toBeVisible();

    await netflix.getByRole('button', { name: 'Paused' }).click();
    await expect(netflix.getByRole('button', { name: 'Paused' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByText('1 active · 2 paused')).toBeVisible();
    await page.waitForLoadState('networkidle');
    await capture('services');

    await netflix.getByRole('button', { name: 'Netflix actions' }).click();
    await expect(page.getByRole('menuitem', { name: 'Manage on netflix.com' })).toHaveAttribute(
      'href',
      'https://www.netflix.com/account',
    );
    await page.getByRole('menuitem', { name: 'Remove Netflix' }).click();
    await expect(netflix).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Add Netflix/ })).toBeVisible();
  });

  test('adds a bundle as one subscription', async ({ page }) => {
    await page.goto('/services');
    await page.getByRole('button', { name: /^Add Disney\+, Hulu & ESPN Select/ }).click();

    const bundle = page.getByRole('row', { name: 'Disney+, Hulu & ESPN Select', exact: true });
    await expect(bundle.getByText('Disney+, Hulu, and ESPN+')).toBeVisible();
    await expect(bundle.getByLabel('Disney+, Hulu & ESPN Select monthly price')).toHaveValue(
      '21.99',
    );
  });
});
