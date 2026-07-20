import { expect, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export type ProjectManifest = {
  slug: string;
  order: number;
  images: unknown[];
};

const projectsDirectory = fileURLToPath(new URL('../src/content/projects/', import.meta.url));
export const projects = readdirSync(projectsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
  .map((entry) => JSON.parse(
    readFileSync(new URL(`../src/content/projects/${entry.name}/project.json`, import.meta.url), 'utf8'),
  ) as ProjectManifest)
  .sort((left, right) => left.order - right.order);

export const locales = ['zh', 'en'] as const;

export const journalSlugs = Object.fromEntries(locales.map((locale) => {
  const directory = fileURLToPath(new URL(`../src/content/blog/${locale}/`, import.meta.url));
  const slugs = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.mdx?$/.test(entry.name))
    .map((entry) => entry.name.replace(/\.mdx?$/, ''));
  return [locale, slugs];
})) as Record<(typeof locales)[number], string[]>;

export async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

export async function expectHealthyPage(page: Page, route: string) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`);
  });

  const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  expect(response, `${route} should return a document response`).not.toBeNull();
  expect(response?.ok(), `${route} returned ${response?.status()}`).toBe(true);
  await page.waitForLoadState('load');
  await expect(page.locator('main')).toBeVisible();
  await expectNoOverflow(page);

  const brokenImages = await page.locator('img').evaluateAll((images) => images
    .map((image) => image as HTMLImageElement)
    .filter((image) => image.complete && image.naturalWidth === 0)
    .map((image) => image.currentSrc || image.getAttribute('src') || '(missing src)'));
  expect(brokenImages).toEqual([]);
  expect(failedRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}
