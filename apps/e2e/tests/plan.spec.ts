import { ServiceSchema, WatchlistShowSchema } from '@app/shared';
import type { APIRequestContext } from '@playwright/test';
import { expect, test } from './fixtures.ts';

/** A household mid-rotation, set up through the API (titles come from the TMDB stub). */
async function seedHousehold(api: APIRequestContext) {
  const service = async (data: Record<string, unknown>) =>
    ServiceSchema.parse(await (await api.post('/services', { data })).json());
  const show = async (tmdbId: number, mediaType: 'tv' | 'movie') =>
    WatchlistShowSchema.parse(
      await (await api.post('/watchlist', { data: { tmdbId, mediaType } })).json(),
    );

  await service({ providerKey: 'netflix', planName: 'Standard' });
  await service({ providerKey: 'hulu' });
  await service({ providerKey: 'apple-tv-plus' });
  await service({ providerKey: 'hbo-max', status: 'paused', planName: 'Basic with ads' });
  await service({ providerKey: 'peacock', status: 'paused', planName: 'Premium' });
  await service({ providerKey: 'disney-plus', status: 'paused' });

  await show(1001, 'tv'); // Netflix
  await show(1011, 'tv'); // Netflix
  await show(1012, 'movie'); // Netflix
  await show(1010, 'tv'); // Netflix or Hulu
  await show(1004, 'movie'); // Netflix or Peacock
  await show(1002, 'tv'); // HBO Max
  await show(1006, 'movie'); // Starz: not a service of theirs
  await show(1008, 'movie'); // rent only
  const watched = await show(1005, 'tv'); // Apple TV+, already watched
  await api.patch(`/watchlist/${watched.id}`, { data: { watched: true } });
}

test.describe('plan page', () => {
  test('shows what to keep, switch, pause and resume this month', async ({
    page,
    api,
    capture,
  }) => {
    await seedHousehold(api);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: "This month's plan" })).toBeVisible();
    const summary = page.getByRole('region', { name: 'Monthly cost' });
    await expect(summary.getByText('$47.47')).toBeVisible();
    await expect(summary.getByText('$19.98')).toBeVisible();
    await expect(summary.getByText('$27.49/mo')).toBeVisible();
    await expect(
      page.getByText('Planned for: Ads OK · 1 screen · HD · new services suggested'),
    ).toBeVisible();

    const row = (name: string) => page.getByRole('row', { name, exact: true });
    // Ads are fine by default: Netflix moves to its ad plan for the same titles.
    await expect(row('Netflix').getByText('Switch plan')).toBeVisible();
    await expect(row('Netflix').getByText('Same titles for $11.00 less')).toBeVisible();
    await expect(row('Netflix').getByText('Needed for')).toHaveCount(0);
    await expect(row('HBO Max').getByText('Resume', { exact: true })).toBeVisible();
    await expect(row('Hulu').getByText('Its title is also on Netflix')).toBeVisible();
    await expect(row('Apple TV+').getByText('Nothing on your list streams here')).toBeVisible();
    await expect(row('Peacock').getByText('Stay paused', { exact: true })).toBeVisible();
    await expect(row('Peacock').getByText('Its title is also on Netflix')).toBeVisible();
    await expect(row('Disney+')).toBeVisible();
    const notCovered = page.getByRole('region', { name: 'Not covered' });
    await expect(notCovered.getByText('Streams on Starz')).toBeVisible();
    await page.waitForLoadState('networkidle');
    await capture('plan');

    // Hovering a title's poster names it; "+1" lists all of Netflix's titles.
    const netflixTitles = page.getByRole('list', { name: 'Titles on Netflix' });
    await netflixTitles.getByRole('button').first().hover();
    await expect(page.getByRole('tooltip')).toContainText(/Series|Movie/);
    await capture('plan-title-tooltip');
    await netflixTitles.getByRole('button', { name: /show all 5 titles on Netflix/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Titles on Netflix' });
    for (const title of ['The Long Harbor', 'Lantern Season', 'Quarry Road', 'Harbor Lights']) {
      await expect(dialog.getByText(title, { exact: true })).toBeVisible();
    }
    await expect(dialog.getByText('Also on Hulu')).toBeVisible();
    await dialog.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    await capture('plan-titles-dialog');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    // Each change links to the service's own page, then is marked done here.
    await page.getByRole('button', { name: 'Hulu actions' }).click();
    await expect(page.getByRole('menuitem', { name: 'Pause on hulu.com' })).toHaveAttribute(
      'href',
      'https://www.hulu.com/account',
    );
    await page
      .getByRole('menu')
      .evaluate((menu) => Promise.all(menu.getAnimations().map((a) => a.finished)));
    await capture('plan-row-menu');
    await page.getByRole('menuitem', { name: 'Mark as paused' }).click();
    await expect(row('Hulu').getByText('Stay paused', { exact: true })).toBeVisible();
    await expect(summary.getByText('$34.98')).toBeVisible();

    await page.getByRole('button', { name: 'Netflix actions' }).click();
    await page.getByRole('menuitem', { name: 'Mark plan as changed' }).click();
    await expect(row('Netflix').getByText('Keep', { exact: true })).toBeVisible();
    await expect(summary.getByText('$23.98')).toBeVisible();
  });

  test('offers the plan under other preferences', async ({ page, api, capture }) => {
    await seedHousehold(api);
    await page.goto('/');

    const options = page.getByRole('list', { name: 'Other options' });
    const noAds = options.getByRole('listitem', { name: 'No ads' });
    await expect(noAds.getByText('+$18.50/mo')).toBeVisible();
    await expect(noAds.getByText(/HBO Max: Standard/)).toBeVisible();
    await page.waitForLoadState('networkidle');
    await capture('plan-alternatives');

    await noAds.getByRole('button', { name: 'Use this option: No ads' }).click();
    await expect(page.getByText(/Planned for: No ads/)).toBeVisible();
    const summary = page.getByRole('region', { name: 'Monthly cost' });
    await expect(summary.getByText('$38.48')).toBeVisible();
    await expect(
      page.getByRole('row', { name: 'Netflix', exact: true }).getByText('Keep', { exact: true }),
    ).toBeVisible();
  });

  test('suggests a bundle that beats separate subscriptions', async ({ page, api, capture }) => {
    for (const providerKey of ['hulu', 'disney-plus', 'hbo-max']) {
      await api.post('/services', { data: { providerKey } });
    }
    await api.post('/watchlist', { data: { tmdbId: 1003, mediaType: 'tv' } }); // Hulu or Disney+
    await api.post('/watchlist', { data: { tmdbId: 1002, mediaType: 'tv' } }); // HBO Max
    await page.goto('/');

    const bundle = page.getByRole('row', { name: 'Disney+, Hulu & HBO Max', exact: true });
    await expect(bundle.getByText('Subscribe', { exact: true })).toBeVisible();
    await expect(bundle.getByText('Includes Disney+, Hulu, and HBO Max')).toBeVisible();
    await page.waitForLoadState('networkidle');
    await capture('plan-bundle');

    await page.getByRole('button', { name: 'Disney+, Hulu & HBO Max actions' }).click();
    await page.getByRole('menuitem', { name: 'Mark as subscribed' }).click();
    await expect(bundle.getByText('Keep', { exact: true })).toBeVisible();
  });

  test('shows the way in when the plan is empty', async ({ page, capture }) => {
    await page.goto('/');
    await expect(page.getByText("Let's build your first rotation")).toBeVisible();
    await page.getByRole('link', { name: 'Add your services' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Services' })).toBeVisible();
    await page.goto('/');
    await capture('plan-empty');
  });
});
