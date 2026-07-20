import { expect, test } from '@playwright/test';

test('AI filter and language switching work', async ({ page }) => {
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  await page.locator('.command-open').first().click();
  await page.locator('#command-input').fill('有什么 AI 相关文章');
  await page.locator('.command-form').press('Enter');
  await page.waitForURL('**/zh/journal?tag=AI');
  await expect(page.locator('.post-row:not([hidden])')).toHaveCount(2);
  await page.locator('.language-link').click();
  await expect(page).toHaveURL(/\/en\/journal\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('sound preference requires a fresh user action after reload', async ({ page, isMobile }) => {
  test.skip(isMobile, 'ambient sound control is hidden on mobile');
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-label', '开启环境声');
  await page.locator('#sound-toggle').click();
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-label', '关闭环境声');
  expect(await page.evaluate(() => localStorage.getItem('ambient-sound'))).toBe('on');
  await page.reload();
  await expect(page.locator('#sound-toggle')).toHaveAttribute('data-remembered', 'true');
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-label', '点击恢复环境声');
  await page.locator('#sound-toggle').click();
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-label', '关闭环境声');
});

test('command palette closes without executing an empty command', async ({ page }) => {
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  await page.locator('.command-open').first().click();
  const dialog = page.locator('#command-dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('.command-close').click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/\/zh\/?$/);
});

test('mobile menu is usable', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile-only interaction');
  await page.goto('/en/');
  await page.locator('.mobile-menu-button').click();
  await expect(page.locator('.mobile-menu')).toHaveAttribute('data-open', 'true');
  await expect(page.locator('.mobile-menu nav a').first()).toBeVisible();
  await page.locator('.mobile-menu nav a').filter({ hasText: 'About' }).click();
  await page.waitForURL('**/en/about');
});
