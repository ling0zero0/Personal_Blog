import { expect, test } from '@playwright/test';
import { expectNoOverflow } from './helpers';

test('article language links and hreflang use the translation index', async ({ page }) => {
  await page.goto('/zh/journal/seeing-the-model', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.language-link')).toHaveAttribute('href', '/en/journal/seeing-the-model');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/journal\/seeing-the-model/);
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', /\/zh\/journal\/seeing-the-model/);
});

test('journal detail uses the collapsible heading navigator without a duplicate toc', async ({ page }) => {
  await page.goto('/zh/journal/seeing-the-model', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-section-navigator] .section-navigator__toggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('[data-section-navigator] .section-navigator__link')).toHaveCount(
    await page.locator('.prose h2, .prose h3').count(),
  );
  await expect(page.locator('.toc')).toHaveCount(0);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(async () => Number(await page.locator('[data-reading-progress]').getAttribute('aria-valuenow'))).toBeGreaterThan(90);
});

test('about portrait and floating section navigation are usable', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/zh/about', { waitUntil: 'domcontentloaded' });
  const portrait = page.locator('.portrait-image');
  const navigator = page.locator('[data-section-navigator]');
  const toggle = navigator.locator('.section-navigator__toggle');
  await portrait.scrollIntoViewIfNeeded();
  await expect(portrait).toBeVisible();
  await expect(page.locator('.portrait-wordmark-group')).toHaveCount(2);
  await expect(page.locator('.portrait-wordmark-track')).toHaveCSS('animation-name', 'portrait-titles');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await navigator.locator('a[href="#capabilities"]').click();
  await expect(page).toHaveURL(/#capabilities$/);
  await expect(page.locator('#capabilities')).toBeInViewport();
  await expect(toggle).toHaveAttribute('aria-expanded', isMobile ? 'false' : 'true');
  await expectNoOverflow(page);
});
