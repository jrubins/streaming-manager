import { expect, test } from './fixtures.ts';

test.describe('channels', () => {
  test('picks the channels the household watches, and the plan covers them', async ({
    page,
    capture,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Channels', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Channels' })).toBeVisible();

    await page
      .getByRole('group', { name: 'Entertainment' })
      .getByRole('button', { name: 'MTV' })
      .click();
    await page
      .getByRole('group', { name: 'Sports' })
      .getByRole('button', { name: 'ESPN', exact: true })
      .click();
    await expect(page.getByRole('status')).toContainText('2 channels needed');
    await page.waitForLoadState('networkidle');
    await capture('channels');

    await page.getByRole('link', { name: 'See the plan' }).click();
    // MTV on Philo and ESPN on Sling Orange beat YouTube TV, which carries both.
    await expect(page.getByRole('row', { name: /Philo/ })).toContainText('Cheapest way to get MTV');
    await expect(page.getByRole('row', { name: /Sling Orange/ })).toContainText(
      'Cheapest way to get ESPN',
    );
    await page.waitForLoadState('networkidle');
    await capture('plan-channels');
  });
});
