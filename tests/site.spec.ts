import { expect, test, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type ProjectManifest = {
  slug: string;
  order: number;
  images: unknown[];
};

const projectsDirectory = fileURLToPath(new URL('../src/content/projects/', import.meta.url));
const projects = readdirSync(projectsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
  .map((entry) => JSON.parse(
    readFileSync(new URL(`../src/content/projects/${entry.name}/project.json`, import.meta.url), 'utf8'),
  ) as ProjectManifest)
  .sort((left, right) => left.order - right.order);

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe('core pages', () => {
  const routes = [
    '/zh/',
    '/en/',
    '/zh/projects',
    ...projects.map((project) => `/zh/projects/${project.slug}`),
    '/en/journal',
    '/zh/about',
    '/zh/journal/seeing-the-model',
  ];

  for (const route of routes) {
    test(`${route} renders without layout overflow`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
      await expectNoOverflow(page);
      expect(errors).toEqual([]);
    });
  }
});

for (const project of projects.filter((project) => project.images.length > 1)) {
  test(`${project.slug} uses an interactive detail carousel`, async ({ page }) => {
    await page.goto(`/zh/projects/${project.slug}`, { waitUntil: 'domcontentloaded' });
    const carousel = page.locator('[data-project-carousel]');
    await expect(carousel).toBeVisible();
    await expect(carousel.locator('[data-carousel-slide]')).toHaveCount(project.images.length);
    await expect(carousel.locator('[data-carousel-current]')).toHaveText('01');
    await carousel.press('ArrowRight');
    await expect(carousel.locator('[data-carousel-current]')).toHaveText('02');
    await expect(carousel.locator('[data-carousel-slide]').nth(1).locator('img')).toBeVisible();
    await expect(carousel).toHaveAttribute('data-paused', 'true');
    await expectNoOverflow(page);
  });
}

test('project title leaves the desktop visual unobstructed', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });

  for (const project of projects) {
    await page.goto(`/zh/projects/${project.slug}`, { waitUntil: 'domcontentloaded' });

    const layout = await page.locator('.project-stage').evaluate((stage) => {
      const heading = stage.querySelector('.project-heading h1')?.getBoundingClientRect();
      const visual = stage.querySelector('.project-visual-frame')?.getBoundingClientRect();
      if (!heading || !visual) throw new Error('Project hero elements are missing');
      return {
        headingRight: heading.right,
        visualLeft: visual.left,
      };
    });

    expect(layout.headingRight).toBeLessThanOrEqual(layout.visualLeft);
    await expectNoOverflow(page);
  }
});

test('project archive follows manifest order and generates display indices', async ({ page }) => {
  await page.goto('/zh/projects', { waitUntil: 'domcontentloaded' });
  const projectRows = page.locator('[data-project]');
  await expect(projectRows).toHaveCount(projects.length);
  await expect(projectRows.locator('.project-visual.has-images')).toHaveCount(projects.length);
  await expect(projectRows.locator('[data-project-carousel]')).toHaveCount(0);
  const slugs = await projectRows.evaluateAll((rows) => rows.map((row) => row.getAttribute('data-project')));
  expect(slugs).toEqual(projects.map((project) => project.slug));

  const indices = await projectRows.locator('.archive-rail b').allTextContents();
  expect(indices).toEqual(projects.map((_, index) => String(index + 1).padStart(2, '0')));
});

test('home scene renders and reacts to command', async ({ page }) => {
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  const canvas = page.locator('#data-scene canvas');
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#data-scene')).toHaveAttribute('data-painted', 'true');
  await page.locator('.command-open').first().click();
  await expect(page.locator('#command-dialog')).toBeVisible();
  await page.locator('#command-input').fill('让场景安静一点');
  await page.locator('.command-form').press('Enter');
  await expect(page.locator('.command-response')).toContainText('低频呼吸');
});

test('home hero exposes the signal runner without clipping core copy', async ({ page }) => {
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.runner-stage')).toBeVisible();
  await expect(page.locator('.runner-character')).toBeVisible();
  await expect(page.locator('.runner-label')).toContainText('数据分身');
  await expect(page.locator('.hero-main h1')).toHaveAccessibleName('花辞树');
  await expect(page.locator('.hero-main p')).toBeVisible();
  await expectNoOverflow(page);

  const layout = await page.evaluate(() => {
    const hero = document.querySelector('.hero')!.getBoundingClientRect();
    const heading = document.querySelector('.hero-main h1')!.getBoundingClientRect();
    const copy = document.querySelector('.hero-main p')!.getBoundingClientRect();
    return {
      headingInside: heading.top >= hero.top && heading.bottom <= hero.bottom,
      copyInside: copy.top >= hero.top && copy.bottom <= hero.bottom,
      copyHeight: copy.height,
    };
  });
  expect(layout.headingInside).toBe(true);
  expect(layout.copyInside).toBe(true);
  expect(layout.copyHeight).toBeGreaterThan(40);
});

test('AI filter and language switching work', async ({ page }) => {
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  await page.locator('.command-open').first().click();
  await page.locator('#command-input').fill('有什么 AI 相关文章');
  await page.locator('.command-form').press('Enter');
  await page.waitForURL('**/zh/journal?tag=AI');
  await expect(page.locator('.post-row:not([hidden])')).toHaveCount(2);
  await page.locator('.language-link').click();
  await page.waitForURL('**/en/journal*');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('sound is opt-in and preference is remembered', async ({ page, isMobile }) => {
  test.skip(isMobile, 'ambient sound control is hidden on mobile');
  await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-label', '开启环境声');
  await page.locator('#sound-toggle').click();
  await expect(page.locator('#sound-toggle')).toHaveAttribute('aria-label', '关闭环境声');
  expect(await page.evaluate(() => localStorage.getItem('ambient-sound'))).toBe('on');
  await page.reload();
  await expect(page.locator('#sound-toggle')).toHaveAttribute('data-remembered', 'true');
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
  await expect(navigator).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await navigator.locator('a[href="#capabilities"]').click();
  await expect(page).toHaveURL(/#capabilities$/);
  await expect(page.locator('#capabilities')).toBeInViewport();
  await expect(toggle).toHaveAttribute('aria-expanded', isMobile ? 'false' : 'true');
  await expectNoOverflow(page);
});

test('journal detail uses the collapsible heading navigator without a duplicate toc', async ({ page }) => {
  await page.goto('/zh/journal/seeing-the-model', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-section-navigator] .section-navigator__toggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('[data-section-navigator] .section-navigator__link')).toHaveCount(
    await page.locator('.prose h2, .prose h3').count(),
  );
  await expect(page.locator('.toc')).toHaveCount(0);
});
