import { expect, test } from '@playwright/test';

test('WebKit supports the core portal and project carousel flows', async ({ page }) => {
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  await page.locator('.door-past').click();
  await expect(page.locator('#past-archive')).toBeVisible();
  await page.locator('#past-archive [data-close-archive]').click();

  await page.goto('/en/projects/w-sha', { waitUntil: 'domcontentloaded' });
  const carousel = page.locator('[data-project-carousel]');
  await carousel.press('ArrowRight');
  await expect(carousel.locator('[data-carousel-current]')).toHaveText('02');
});
