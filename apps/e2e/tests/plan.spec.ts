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
  test('shows what to keep, pause and resume this month', async ({ page, api, capture }) => {
    await seedHousehold(api);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: "This month's plan" })).toBeVisible();
    const hero = page.getByRole('region', { name: 'Monthly cost' });
    await expect(hero.getByText('$16.49/mo')).toBeVisible();
    await expect(hero.getByText('$197.88 a year')).toBeVisible();
    await expect(hero.getByText('$47.47')).toBeVisible();
    await expect(hero.getByText('$30.98')).toBeVisible();

    const card = (name: string) => page.getByRole('row', { name, exact: true });
    await expect(card('Netflix').getByText('Keep')).toBeVisible();
    await expect(card('Netflix').getByText('Needed for 5 titles on your list')).toBeVisible();
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
    await page.waitForLoadState('networkidle');
    await capture('plan');

    // Hovering a title's poster names it; "+1" lists all of Netflix's titles.
    const netflixTitles = page.getByRole('list', { name: 'Titles on Netflix' });
    await netflixTitles.getByRole('button').first().hover();
    await expect(page.getByRole('tooltip')).toContainText(/Series|Movie/);
    await capture('plan-title-tooltip');
    await netflixTitles.getByRole('button', { name: /show all 5 titles on Netflix/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Titles on Netflix' });
    for (const title of [
      'The Long Harbor',
      'Lantern Season',
      'Quarry Road',
      'Harbor Lights',
      'Northbound',
    ]) {
      await expect(dialog.getByText(title, { exact: true })).toBeVisible();
    }
    await expect(dialog.getByText('Also on Hulu')).toBeVisible();
    await dialog.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    await capture('plan-titles-dialog');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    // Marking a pause done updates the plan.
    await page.getByRole('button', { name: 'Hulu actions' }).click();
    await expect(page.getByRole('menuitem', { name: 'Pause on hulu.com' })).toHaveAttribute(
      'href',
      'https://www.hulu.com/account',
    );
    await expect(page.getByRole('menuitem', { name: 'Mark as paused' })).toBeVisible();
    // Let the menu finish fading in before the screenshot.
    await page
      .getByRole('menu')
      .evaluate((menu) => Promise.all(menu.getAnimations().map((a) => a.finished)));
    await capture('plan-row-menu');
    await page.getByRole('menuitem', { name: 'Mark as paused' }).click();
    await expect(card('Hulu').getByText('Stay paused', { exact: true })).toBeVisible();
    await expect(hero.getByText('$34.98')).toBeVisible();
  });

  test('links to a search for services without a known account page', async ({ page, api }) => {
    await api.post('/services', { data: { providerKey: 'starz' } });
    await page.goto('/');
    await page.getByRole('button', { name: 'Starz actions' }).click();
    const link = page.getByRole('menuitem', { name: 'Find how to pause Starz' });
    await expect(link).toHaveAttribute('href', /google\.com\/search\?q=how\+to\+pause/);
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
