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
  await show(1010, 'tv'); // Netflix or Hulu
  await show(1004, 'movie'); // Netflix or Peacock
  await show(1002, 'tv'); // HBO Max
  await show(1006, 'movie'); // Starz: not a service of theirs
  await show(1008, 'movie'); // rent only
  const watched = await show(1005, 'tv'); // Apple TV+, already watched
  await api.patch(`/watchlist/${watched.id}`, { data: { watched: true } });
}

test.describe('plan page', () => {
  test('shows what to keep, pause and resume this month', async ({ page, api, capture }) => {
    await seedHousehold(api);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: "This month's plan" })).toBeVisible();
    const hero = page.getByRole('region', { name: 'Monthly cost' });
    await expect(hero.getByText('Rotate this month and save')).toBeVisible();
    await expect(hero.getByText('$16.49')).toBeVisible();
    await expect(hero.getByText('$47.47')).toBeVisible();
    await expect(hero.getByText('$30.98')).toBeVisible();

    const card = (name: string) => page.getByRole('row', { name, exact: true });
    await expect(card('Netflix').getByText('Keep')).toBeVisible();
    await expect(card('Netflix').getByText('Needed for 3 titles on your list')).toBeVisible();
    await expect(card('HBO Max').getByText('Resume', { exact: true })).toBeVisible();
    await expect(
      card('HBO Max').getByText('1 title waiting for it', { exact: false }),
    ).toBeVisible();
    await expect(card('Hulu').getByText('Its title is also on Netflix')).toBeVisible();
    await expect(card('Apple TV+').getByText('Nothing on your list streams here')).toBeVisible();
    await expect(card('Peacock').getByText('Stay paused', { exact: true })).toBeVisible();
    await expect(card('Peacock').getByText('Its title is also on Netflix')).toBeVisible();
    await expect(card('Disney+')).toBeVisible();
    await expect(page.getByText('Streams on Starz')).toBeVisible();
    // The sidebar shows the saving and the counts.
    await expect(page.getByText('Save $16.49')).toBeVisible();
    await page.waitForLoadState('networkidle');
    await capture('plan');

    // Marking a pause done updates the plan.
    await page.getByRole('button', { name: "I've paused Hulu" }).click();
    await expect(card('Hulu').getByText('Stay paused', { exact: true })).toBeVisible();
    await expect(hero.getByText('$34.98')).toBeVisible();
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
