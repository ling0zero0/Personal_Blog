import { expect, test } from '@playwright/test';
import { expectNoOverflow } from './helpers';

test('home portal opens both archives and restores focus', async ({ page }) => {
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  const pastDoor = page.locator('.door-past');
  const futureDoor = page.locator('.door-future');
  await expect(pastDoor).toContainText('成长档案');
  await expect(futureDoor).toContainText('求职规划');

  await pastDoor.click();
  await expect(page.locator('#past-archive')).toBeVisible();
  await expect(page.locator('#past-archive .timeline li')).toHaveCount(5);
  await page.locator('#past-archive [data-close-archive]').click();
  await expect(pastDoor).toBeFocused();

  await futureDoor.click();
  await expect(page.locator('#future-archive')).toBeVisible();
  await expect(page.locator('#future-archive')).toContainText('特殊行动专员');
  await expect(page.locator('#future-archive')).toContainText('8–15K');
  await page.locator('#future-archive [data-close-archive]').click();
  await expect(futureDoor).toBeFocused();
  await expectNoOverflow(page);
});

test('home portal button automatically opens the doors and synchronizes focus state', async ({ page }) => {
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  const trigger = page.locator('[data-open-doors]');
  await trigger.click();
  const stage = page.locator('.portal-stage');
  await expect.poll(async () => Number(await stage.evaluate((element) => getComputedStyle(element).getPropertyValue('--open'))), { timeout: 8000 }).toBeGreaterThan(.9);
  await expect(page.locator('[data-home-portal]')).toHaveAttribute('data-state', 'open');
  await expect(page.locator('.door-past')).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('.inner-copy nav a').first()).toBeFocused();
});

test('scrollbar can take over the automatic reveal and close the portal', async ({ page }) => {
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  const stage = page.locator('.portal-stage');
  const openProgress = () => stage.evaluate((element) => Number(getComputedStyle(element).getPropertyValue('--open')));
  await page.locator('[data-open-doors]').click();
  await expect.poll(openProgress, { timeout: 4000 }).toBeGreaterThan(.08);
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(openProgress).toBeLessThan(.1);
  await expect(page.locator('[data-home-portal]')).toHaveAttribute('data-state', 'closed');
  await expect(page.locator('.door-past')).toBeVisible();
  await expectNoOverflow(page);
});

test('home portal scroll opens the doors and reveals the inner motto', async ({ page }) => {
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  const portal = page.locator('[data-home-portal]');
  const scrollTarget = await portal.evaluate((element) => (element as HTMLElement).offsetHeight - innerHeight);
  await page.evaluate((target) => scrollTo(0, target), scrollTarget);
  await expect.poll(async () => Number(await page.locator('.portal-stage').evaluate((element) => getComputedStyle(element).getPropertyValue('--open')))).toBeGreaterThan(.9);
  await expect(page.locator('.inner-copy')).toContainText('自己做一个选择');
  await expect(page.locator('.inner-copy nav a')).toHaveCount(3);
  await expectNoOverflow(page);
});

test('reduced motion exposes the final portal state and both archives', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-home-portal]')).toHaveAttribute('data-state', 'open');
  await expect(page.locator('.inner-copy')).toBeVisible();
  await expect(page.locator('.door-past')).toHaveAttribute('aria-hidden', 'true');
  const archiveButtons = page.locator('.reduced-motion-archives button');
  await expect(archiveButtons).toHaveCount(2);
  await archiveButtons.first().click();
  await expect(page.locator('#past-archive')).toBeVisible();
});
