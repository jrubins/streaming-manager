import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

// A phone: every page must fit its width, with no sideways scrolling.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  // On failure, name what sticks out past the right edge.
  const culprits =
    overflow > 0
      ? await page.evaluate(() => {
          const width = document.documentElement.clientWidth;
          return [...document.querySelectorAll('body *')]
            .filter((el) => el.getBoundingClientRect().right > width + 1)
            .slice(0, 5)
            .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`)
            .join(', ');
        })
      : '';
  expect(overflow, `${page.url()} is wider than the screen: ${culprits}`).toBeLessThanOrEqual(0);
}

test.describe('on a phone', () => {
  test('every page fits the screen', async ({ page, api, capture }) => {
    for (const providerKey of ['netflix', 'hulu', 'hbo-max']) {
      await api.post('/services', { data: { providerKey } });
    }
    await api.post('/watchlist', { data: { tmdbId: 1001, mediaType: 'tv' } });
    await api.post('/watchlist', { data: { tmdbId: 1002, mediaType: 'tv' } });

    for (const [path, name] of [
      ['/', 'mobile-plan'],
      ['/services', 'mobile-services'],
      ['/channels', 'mobile-channels'],
      ['/preferences', 'mobile-preferences'],
      ['/household', 'mobile-household'],
    ] as const) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await capture(name);
      await expectNoHorizontalScroll(page);
    }

    // Adding a service or a bundle.
    await page.goto('/services');
    for (const [tab, name] of [
      ['Add a service', 'mobile-services-add'],
      ['Bundles', 'mobile-services-bundles'],
    ] as const) {
      await page.getByRole('tab', { name: tab }).click();
      await page.waitForLoadState('networkidle');
      await capture(name);
      await expectNoHorizontalScroll(page);
    }
    // Scrolled to, a bundle's Add button is fully on screen (not cut off at the side).
    const addBundle = page.getByRole('button', { name: 'Add Disney+, Hulu & ESPN Select' });
    await addBundle.scrollIntoViewIfNeeded();
    await expect(addBundle).toBeInViewport({ ratio: 1 });

    await page.goto('/watchlist');
    await page.getByLabel('Search for a show or movie').fill('harbor');
    await expect(page.getByRole('button', { name: 'Add Harbor Lights' })).toBeInViewport();
    await page.waitForLoadState('networkidle');
    await capture('mobile-watchlist-search');
    await expectNoHorizontalScroll(page);
  });

  test('closes the menu after choosing a page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
    const menu = page.getByRole('dialog');
    await menu.getByRole('link', { name: 'Watchlist' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Watchlist' })).toBeVisible();
    await expect(menu).toHaveCount(0);
  });
});
