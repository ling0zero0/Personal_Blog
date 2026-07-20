import { expect, test } from '@playwright/test';
import { expectNoOverflow, projects } from './helpers';

for (const project of projects.filter((project) => project.images.length > 1)) {
  test(`${project.slug} uses a decoded interactive detail carousel`, async ({ page, isMobile }) => {
    await page.goto(`/zh/projects/${project.slug}`, { waitUntil: 'domcontentloaded' });
    const carousel = page.locator('[data-project-carousel]');
    await expect(carousel).toBeVisible();
    await expect(carousel.locator('[data-carousel-slide]')).toHaveCount(project.images.length);
    await expect(carousel.locator('[data-carousel-current]')).toHaveText('01');
    if (isMobile) await expect(carousel.locator('[data-carousel-slide] img')).toHaveCount(1);
    await carousel.press('ArrowRight');
    await expect(carousel.locator('[data-carousel-current]')).toHaveText('02');
    const secondImage = carousel.locator('[data-carousel-slide]').nth(1).locator('img');
    await expect(secondImage).toBeVisible();
    expect(await secondImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(carousel).toHaveAttribute('data-paused', 'true');
    await expectNoOverflow(page);
  });
}

test('project carousel remains operable after history restoration', async ({ page }) => {
  const project = projects.find((candidate) => candidate.images.length > 2)!;
  await page.goto(`/zh/projects/${project.slug}`, { waitUntil: 'domcontentloaded' });
  let carousel = page.locator('[data-project-carousel]');
  await carousel.press('ArrowRight');
  await expect(carousel.locator('[data-carousel-current]')).toHaveText('02');
  await page.goto('/zh/projects', { waitUntil: 'domcontentloaded' });
  await page.goBack({ waitUntil: 'domcontentloaded' });
  carousel = page.locator('[data-project-carousel]');
  await expect(carousel).toBeVisible();
  const before = Number(await carousel.locator('[data-carousel-current]').textContent());
  await carousel.press('ArrowRight');
  const expected = String((before % project.images.length) + 1).padStart(2, '0');
  await expect(carousel.locator('[data-carousel-current]')).toHaveText(expected);
});

test('project title leaves the desktop visual unobstructed', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop layout assertion');
  await page.setViewportSize({ width: 1600, height: 1000 });

  for (const project of projects) {
    await page.goto(`/zh/projects/${project.slug}`, { waitUntil: 'domcontentloaded' });
    const layout = await page.locator('.project-stage').evaluate((stage) => {
      const heading = stage.querySelector('.project-heading h1')?.getBoundingClientRect();
      const visual = stage.querySelector('.project-visual-frame')?.getBoundingClientRect();
      if (!heading || !visual) throw new Error('Project hero elements are missing');
      return { headingRight: heading.right, visualLeft: visual.left };
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
