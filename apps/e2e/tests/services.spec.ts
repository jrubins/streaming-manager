import { expect, test } from './fixtures.ts';

test.describe('services page', () => {
  test('adds a service, changes its plan, price and status', async ({ page, api, capture }) => {
    await api.post('/services', { data: { providerKey: 'hulu' } });
    await api.post('/services', { data: { providerKey: 'peacock', status: 'paused' } });
    await page.goto('/services');
    await expect(page.getByRole('heading', { level: 1, name: 'Services' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Your services (2)' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // Find it by searching, then add it: the page switches back to the list.
    await page.getByRole('tab', { name: 'Add a service' }).click();
    await page.getByLabel('Search services').fill('net');
    await expect(page.getByRole('button', { name: /^Add Hulu/ })).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    await capture('services-add');
    await page.getByRole('button', { name: /^Add Netflix/ }).click();
    await expect(page.getByRole('tab', { name: 'Your services (3)' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const netflix = page.getByRole('row', { name: 'Netflix', exact: true });
    await expect(netflix.getByLabel('Netflix monthly price')).toHaveValue('8.99');

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
    await page.getByRole('tab', { name: 'Add a service' }).click();
    await expect(page.getByRole('button', { name: /^Add Netflix/ })).toBeVisible();
  });

  test('adds a bundle as one subscription', async ({ page, capture }) => {
    await page.goto('/services');
    await page.getByRole('tab', { name: 'Bundles' }).click();
    const card = page.getByRole('listitem', { name: 'Disney+, Hulu & ESPN Select' });
    await expect(card.getByText('Includes Disney+, Hulu, and ESPN Select')).toBeVisible();
    await expect(card.getByText('$32.99')).toBeVisible();
    await page.waitForLoadState('networkidle');
    await capture('services-bundles');

    await card.getByRole('button', { name: 'Add Disney+, Hulu & ESPN Select' }).click();
    const bundle = page.getByRole('row', { name: 'Disney+, Hulu & ESPN Select', exact: true });
    await expect(bundle.getByText('Disney+, Hulu, and ESPN Select')).toBeVisible();
    await expect(bundle.getByLabel('Disney+, Hulu & ESPN Select monthly price')).toHaveValue(
      '21.99',
    );
  });

  test('always keeps a service the list does not need', async ({ page, api, capture }) => {
    await api.post('/services', { data: { providerKey: 'hulu' } });
    await page.goto('/');
    await expect(page.getByRole('row', { name: /Hulu/ })).toContainText('Pause');

    await page.getByRole('link', { name: 'Services', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Services' })).toBeVisible();
    await page
      .getByRole('table')
      .getByRole('row', { name: /Hulu/ })
      .getByRole('button', { name: 'Hulu actions' })
      .click();
    await page.getByRole('menuitemcheckbox', { name: 'Always keep' }).click();
    await expect(page.getByRole('table').getByText('Always kept')).toBeVisible();

    await page.getByRole('link', { name: 'Plan', exact: true }).click();
    const hulu = page.getByRole('row', { name: /Hulu/ });
    await expect(hulu).toContainText('Always kept');
    await expect(hulu).toContainText('Keep');
    await page.waitForLoadState('networkidle');
    await capture('plan-always-keep');
  });
});
