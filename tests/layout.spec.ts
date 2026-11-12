import { expect, test } from '@playwright/test';

import { PAGE_PATHS, hydrated } from './helpers';

for (const width of [375, 320]) {
  for (const path of PAGE_PATHS) {
    test(`${path} has no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await hydrated(page);
      await page.evaluate(() => document.fonts.ready);

      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return { scroll: root.scrollWidth, client: root.clientWidth };
      });
      expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
      expect(overflow.client).toBe(width);
    });
  }
}

test('the register form fits at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await hydrated(page);
  const box = await page.locator('form.reg-form').boundingBox();
  expect(box).not.toBeNull();
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
  const textarea = await page.getByLabel('What do you publish on today?').boundingBox();
  expect((textarea?.x ?? 0) + (textarea?.width ?? 0)).toBeLessThanOrEqual(320);
});
