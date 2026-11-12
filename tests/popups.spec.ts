import { expect, test } from '@playwright/test';

import { POPUP_BUTTONS, hydrated, isModal, watch } from './helpers';

test.describe('journey page', () => {
  for (const popup of POPUP_BUTTONS) {
    test(`${popup.path}: opens, closes to /, and Back closes it`, async ({ page }) => {
      const seen = await watch(page);
      await page.goto('/');
      await hydrated(page);
      const dialog = page.locator(`dialog#${popup.id}`);

      await page.getByRole('button', { name: popup.opener }).click();
      await expect(page).toHaveURL(popup.path);
      await expect(dialog).toBeVisible();
      expect(await isModal(page, popup.id)).toBe(true);
      await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(popup.title);

      await dialog.getByRole('link', { name: 'Close' }).click();
      await expect(page).toHaveURL('/');
      await expect(dialog).toBeHidden();

      await page.getByRole('button', { name: popup.opener }).click();
      await expect(dialog).toBeVisible();
      await page.goBack();
      await expect(page).toHaveURL('/');
      await expect(dialog).toBeHidden();

      expect(await seen.violations()).toEqual([]);
      expect(seen.errors).toEqual([]);
    });
  }

  test('Escape closes a pop-up and returns to the page', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    await page.getByRole('button', { name: 'More about Ghost' }).click();
    await expect(page.locator('dialog#ghost')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL('/');
    await expect(page.locator('dialog#ghost')).toBeHidden();
  });

  test('a click on the backdrop closes a pop-up', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    await page.getByRole('button', { name: 'More about Ghost' }).click();
    const dialog = page.locator('dialog#ghost');
    await expect(dialog).toBeVisible();
    await page.mouse.click(2, 300);
    await expect(page).toHaveURL('/');
    await expect(dialog).toBeHidden();
  });

  test('opening a pop-up keeps the scroll position', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    const button = page.getByRole('button', { name: 'How moving works' });
    // Centred, so the sticky header never covers it and Playwright's click does not scroll again.
    await button.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    // The header compacts (and the browser's scroll anchoring settles) once scrolled past 80px.
    await expect(page.locator('header.top')).toHaveClass(/compact/);
    await page.waitForTimeout(300);
    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBeGreaterThan(300);
    // A raw mouse click: Playwright's own click re-scrolls the button into view when the
    // page shifts under load, which would move the very thing this test measures.
    const box = await button.boundingBox();
    if (box === null) throw new Error('the button has no box');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.locator('dialog#moving')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog#moving')).toBeHidden();
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThan(5);
  });

  test('a pop-up reached by address opens on load and closes to /', async ({ page }) => {
    await page.goto('/included');
    await hydrated(page);
    const dialog = page.locator('dialog#included');
    await expect(dialog).toBeVisible();
    await expect.poll(() => isModal(page, 'included')).toBe(true);

    await dialog.getByRole('link', { name: 'Close' }).click();
    await expect(page).toHaveURL('/');
    await expect(dialog).toBeHidden();
  });

  test('the "Register interest" button in a pop-up closes it and goes to the form', async ({
    page,
  }) => {
    await page.goto('/');
    await hydrated(page);
    await page.getByRole('button', { name: 'More about Ghost' }).click();
    await page.locator('dialog#ghost').getByRole('link', { name: 'Register interest' }).click();
    await expect(page).toHaveURL('/#register');
    await expect(page.locator('dialog#ghost')).toBeHidden();
    await expect(page.locator('#register')).toBeInViewport();
  });

  test('a link to a heading inside a pop-up opens that pop-up at the heading', async ({ page }) => {
    await page.goto('/#ghost-members');
    await hydrated(page);
    await expect(page.locator('dialog#ghost')).toBeVisible();
    await expect(page).toHaveURL('/what-is-ghost#ghost-members');
    await expect(page.locator('#ghost-members')).toBeInViewport();
  });

  test('a source link inside the Ghost pop-up scrolls in place and keeps it open', async ({
    page,
  }) => {
    await page.goto('/');
    await hydrated(page);
    await page.getByRole('button', { name: 'More about Ghost' }).click();
    const dialog = page.locator('dialog#ghost');
    await dialog.getByRole('link', { name: '5', exact: true }).first().click();
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL('/what-is-ghost#src-g5');
  });
});

test.describe('Ghost hosting page', () => {
  test('a pop-up shows its path and closing returns to /ghost-hosting', async ({ page }) => {
    await page.goto('/ghost-hosting');
    await hydrated(page);

    await page.getByRole('button', { name: "What's included" }).click();
    await expect(page).toHaveURL('/included');
    await expect(page.locator('dialog#included')).toBeVisible();
    // Still the hosting page behind it.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Managed Ghost hosting, done well.'
    );
    await expect(page).toHaveTitle('Managed Ghost hosting, done well | PublicPress');

    await page.locator('dialog#included').getByRole('link', { name: 'Close' }).click();
    await expect(page).toHaveURL('/ghost-hosting');
    await expect(page.locator('dialog#included')).toBeHidden();
  });

  test('Back from a pop-up returns to /ghost-hosting', async ({ page }) => {
    await page.goto('/ghost-hosting');
    await hydrated(page);
    await page.getByRole('button', { name: 'More about Ghost' }).click();
    await expect(page).toHaveURL('/what-is-ghost');
    await page.goBack();
    await expect(page).toHaveURL('/ghost-hosting');
    await expect(page.locator('dialog#ghost')).toBeHidden();
  });
});
