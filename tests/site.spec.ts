import { expect, test, type Page } from '@playwright/test';

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe('core pages', () => {
  for (const route of ['/zh/', '/en/', '/zh/projects', '/zh/projects/w-sha', '/zh/projects/jump-pro-max', '/en/journal', '/zh/about', '/zh/journal/seeing-the-model']) {
    test(`${route} renders without layout overflow`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page.locator('main')).toBeVisible();
      await expectNoOverflow(page);
      expect(errors).toEqual([]);
    });
  }
});

for (const project of [
  { slug: 'w-sha', slideCount: 7 },
  { slug: 'jump-pro-max', slideCount: 6 },
]) {
  test(`${project.slug} uses a fixed archive poster and an interactive detail carousel`, async ({ page }) => {
    await page.goto('/zh/projects', { waitUntil: 'networkidle' });
    const archivePoster = page.locator(`[data-project="${project.slug}"] .project-visual`);
    await expect(archivePoster).toHaveClass(/has-images/);
    await expect(archivePoster).not.toHaveAttribute('data-project-carousel');

    await page.goto(`/zh/projects/${project.slug}`, { waitUntil: 'networkidle' });
    const carousel = page.locator('[data-project-carousel]');
    await expect(carousel).toBeVisible();
    await expect(carousel.locator('[data-carousel-slide]')).toHaveCount(project.slideCount);
    await expect(carousel.locator('[data-carousel-current]')).toHaveText('01');
    await carousel.locator('[data-carousel-next]').click();
    await expect(carousel.locator('[data-carousel-current]')).toHaveText('02');
    await expect(carousel).toHaveAttribute('data-paused', 'true');
    await expectNoOverflow(page);
  });
}

test('project archive follows manifest order and generates display indices', async ({ page }) => {
  await page.goto('/zh/projects', { waitUntil: 'networkidle' });
  const projectRows = page.locator('[data-project]');
  await expect(projectRows).toHaveCount(5);
  const slugs = await projectRows.evaluateAll((rows) => rows.map((row) => row.getAttribute('data-project')));
  expect(slugs).toEqual([
    'w-sha',
    'jump-pro-max',
    'latent-atlas',
    'second-weather',
    'quiet-machine',
  ]);

  const indices = await projectRows.locator('.archive-rail b').allTextContents();
  expect(indices).toEqual(['01', '02', '03', '04', '05']);
});

test('home scene paints nonblank pixels and reacts to command', async ({ page }) => {
  await page.goto('/zh/', { waitUntil: 'networkidle' });
  const canvas = page.locator('#data-scene canvas');
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  const pixels = await canvas.evaluate((element: HTMLCanvasElement) => {
    const sample = document.createElement('canvas'); sample.width = 96; sample.height = 96;
    const ctx = sample.getContext('2d')!; ctx.drawImage(element, 0, 0, 96, 96);
    const data = ctx.getImageData(0, 0, 96, 96).data; let bright = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i] + data[i + 1] + data[i + 2] > 45) bright++;
    return bright;
  });
  expect(pixels).toBeGreaterThan(30);
  await page.locator('.command-open').first().click();
  await expect(page.locator('#command-dialog')).toBeVisible();
  await page.locator('#command-input').fill('让场景安静一点');
  await page.locator('.command-form').press('Enter');
  await expect(page.locator('.command-response')).toContainText('低频呼吸');
});

test('home hero exposes the signal runner without clipping core copy', async ({ page }) => {
  await page.goto('/zh/', { waitUntil: 'networkidle' });
  await expect(page.locator('.runner-stage')).toBeVisible();
  await expect(page.locator('.runner-character')).toBeVisible();
  await expect(page.locator('.runner-label')).toContainText('数据分身');
  await expect(page.locator('.hero-main h1')).toContainText('花辞树');
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
  await page.goto('/zh/', { waitUntil: 'networkidle' });
  await page.locator('.command-open').first().click();
  await page.locator('#command-input').fill('有什么 AI 相关文章');
  await page.locator('.command-form').press('Enter');
  await page.waitForURL('**/zh/journal?tag=AI');
  await expect(page.locator('.post-row:not([hidden])')).toHaveCount(2);
  await page.locator('.language-link').click();
  await page.waitForURL('**/en/journal*');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('sound is opt-in and preference is remembered', async ({ page }) => {
  await page.goto('/zh/');
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
  await page.goto('/zh/about', { waitUntil: 'networkidle' });

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
  await page.goto('/zh/journal/seeing-the-model', { waitUntil: 'networkidle' });
  await expect(page.locator('[data-section-navigator] .section-navigator__toggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('[data-section-navigator] .section-navigator__link')).toHaveCount(
    await page.locator('.prose h2, .prose h3').count(),
  );
  await expect(page.locator('.toc')).toHaveCount(0);
});
