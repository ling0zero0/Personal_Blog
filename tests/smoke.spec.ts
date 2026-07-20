import { expect, test } from '@playwright/test';
import { expectHealthyPage, journalSlugs, locales, projects } from './helpers';

const localizedRoutes = locales.flatMap((locale) => [
  `/${locale}/`,
  `/${locale}/projects`,
  ...projects.map((project) => `/${locale}/projects/${project.slug}`),
  `/${locale}/journal`,
  ...journalSlugs[locale].map((slug) => `/${locale}/journal/${slug}`),
  `/${locale}/about`,
]);

test.describe('localized route matrix', () => {
  for (const route of localizedRoutes) {
    test(`${route} is healthy`, async ({ page }) => {
      await expectHealthyPage(page, route);
    });
  }
});

test('site metadata endpoints are available', async ({ request }) => {
  const rss = await request.get('/rss.xml');
  expect(rss.ok()).toBe(true);
  expect(rss.headers()['content-type']).toMatch(/(?:application\/rss\+xml|text\/xml)/);
  expect(await rss.text()).toContain('<rss');

  const sitemap = await request.get('/sitemap-index.xml');
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain('<sitemapindex');

  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain('Sitemap:');
});

test('unknown routes return the custom 404 document', async ({ page }) => {
  const response = await page.goto('/definitely-not-a-real-page', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(404);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main')).toContainText('Signal lost');
});
