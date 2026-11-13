import { expect, test } from '@playwright/test';

import { hydrated, watch } from './helpers';

test('the header compacts past 80px of scroll and relaxes at the top', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  const header = page.locator('header.top');
  await expect(header).not.toHaveClass(/compact/);
  await page.evaluate(() => window.scrollTo(0, 400));
  await expect(header).toHaveClass(/compact/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(header).not.toHaveClass(/compact/);
});

test('the header "Register interest" button links to #register', async ({ page }) => {
  await page.goto('/ghost-hosting');
  await hydrated(page);
  const button = page.locator('header.top').getByRole('link', { name: 'Register interest' });
  await expect(button).toHaveAttribute('href', '#register');
  await button.click();
  await expect(page).toHaveURL('/ghost-hosting#register');
  await expect(page.locator('#register')).toBeInViewport();
});

test('the date tooltip opens on click and closes on Escape or an outside click', async ({
  page,
}) => {
  await page.goto('/');
  await hydrated(page);
  const info = page.getByRole('button', { name: 'About this date' });
  const tip = page.locator('#date-tip');
  await expect(tip).toBeHidden();

  await info.click();
  await expect(info).toHaveAttribute('aria-expanded', 'true');
  await expect(tip).toBeVisible();
  await page.keyboard.press('Escape');
  // The tooltip also shows while the pointer hovers the button (CSS): move it away.
  await page.mouse.move(5, 5);
  await expect(info).toHaveAttribute('aria-expanded', 'false');
  await expect(tip).toBeHidden();

  await info.click();
  await expect(tip).toBeVisible();
  await page.mouse.click(5, 400);
  await expect(info).toHaveAttribute('aria-expanded', 'false');
});

test('headings gain "#" links once the page has hydrated', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  const anchor = page.locator('#what-is-ghost .anchor');
  await expect(anchor).toHaveAttribute('href', '#what-is-ghost');
  await expect(anchor).toHaveAttribute('aria-label', 'Link to this section');
  await expect(anchor).toHaveText('#');

  await page.getByRole('button', { name: 'More about Ghost' }).click();
  await expect(page.locator('#ghost-members .anchor')).toHaveAttribute('href', '#ghost-members');
});

test('a "#" link shows only on hover, keyboard focus or as the target', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  const heading = page.locator('#looked-after');
  const anchor = heading.locator('.anchor');
  const opacity = () => anchor.evaluate((node) => getComputedStyle(node).opacity);
  await expect.poll(opacity).toBe('0');

  await heading.hover();
  await expect.poll(opacity).toBe('1');
  await page.mouse.move(0, 0);
  await expect.poll(opacity).toBe('0');

  await anchor.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(anchor).toBeFocused();
  await expect.poll(opacity).toBe('1');
  await anchor.blur();

  await page.goto('/#looked-after');
  await hydrated(page);
  await page.mouse.move(0, 0);
  await expect.poll(opacity).toBe('1');
  await expect
    .poll(() =>
      page.locator('#what-is-ghost .anchor').evaluate((node) => getComputedStyle(node).opacity)
    )
    .toBe('0');
});

test('the mail tabs switch panels by click and by arrow keys', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  const mx = page.locator('#mail-mx');
  const sw = page.locator('#mail-sw');
  const mg = page.locator('#mail-mg');
  await expect(mx).toBeVisible();
  await expect(sw).toBeHidden();

  await page.getByRole('tab', { name: 'Sweego' }).click();
  await expect(sw).toBeVisible();
  await expect(mx).toBeHidden();
  await expect(page.getByRole('tab', { name: 'Sweego' })).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowRight');
  await expect(mg).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Mailgun' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(mx).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(mg).toBeVisible();
});

test('the ghost animation arms and plays when scrolled into view', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  const figure = page.locator('figure.ghost-anim');
  await expect(figure).toHaveClass(/\bjs\b/);
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveClass(/is-playing/);
});

test('the footer and the prices render, with the entry tier name', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Essentials', level: 3 })).toBeVisible();
  await expect(page.locator('footer.site-foot')).toContainText('Operated by BRANCHLEFT LTD');
  await expect(page.locator('.pill.when-pill')).toHaveText('Launching by 1st March 2027');
});

test('the close button is round and sits in the pop-up bar', async ({ page }) => {
  const seen = await watch(page);
  await page.goto('/');
  await hydrated(page);
  await page.getByRole('button', { name: 'More about Ghost' }).click();
  const close = page.locator('dialog#ghost .close');
  await expect(close).toBeVisible();
  const box = await close.boundingBox();
  expect(box?.width).toBeCloseTo(box?.height ?? 0, 0);
  expect(await close.evaluate((el) => getComputedStyle(el).borderRadius)).toBe('50%');
  expect(seen.errors).toEqual([]);
});
