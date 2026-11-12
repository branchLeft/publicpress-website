import { expect, test } from '@playwright/test';

import {
  REGISTER_FAILURE_MESSAGE,
  REGISTER_SUCCESS_MESSAGE,
} from '../app/content/register-messages';
import { MIN_WAIT_MS, expectOneMessageFor, messagesFor, uniqueEmail, uniqueIp } from './mail';

// Runs with JavaScript disabled (the `chromium-no-js` project): everything here
// is what the server alone delivers.

test('the page renders and carries no script-added chrome', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Independent journalism, on independent infrastructure.'
  );
  await expect(page.locator('.anchor')).toHaveCount(0);
  await expect(page.locator('#register')).toBeAttached();
});

for (const path of [
  '/what-is-ghost',
  '/included',
  '/your-site',
  '/moving',
  '/how-its-built',
  '/why',
  '/everyone',
  '/about',
]) {
  test(`${path} arrives with its pop-up already open`, async ({ page }) => {
    await page.goto(path);
    const open = page.locator('dialog[open]');
    await expect(open).toHaveCount(1);
    await expect(open).toBeVisible();
    await expect(open.locator('.sheet h2')).toBeVisible();
    await expect(open.getByRole('link', { name: 'Close' })).toHaveAttribute('href', '/');
  });
}

test('the close link of a pop-up opened by address goes to the page', async ({ page }) => {
  await page.goto('/included');
  await page.locator('dialog[open]').getByRole('link', { name: 'Close' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

for (const { path, origin } of [
  { path: '/', origin: '/' },
  { path: '/ghost-hosting', origin: '/ghost-hosting' },
]) {
  test(`${path}: the register form posts and the answer replaces the form`, async ({ page }) => {
    await page.context().setExtraHTTPHeaders({ 'x-forwarded-for': uniqueIp() });
    const email = uniqueEmail();
    await page.goto(path);
    await page.waitForTimeout(MIN_WAIT_MS);

    await page.getByLabel('Name', { exact: true }).fill('Grace Hopper');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Outlet or organisation').fill('Compiler Weekly');
    await page.getByLabel('What do you publish on today?').fill('Ghost, plus a podcast');
    await page.getByRole('button', { name: 'Register interest' }).click();

    await expect(page.getByText(REGISTER_SUCCESS_MESSAGE)).toBeVisible();
    await expect(page.locator('form.reg-form')).toHaveCount(0);
    await expect(
      page.getByText('We use these details only to contact you about PublicPress.')
    ).toBeVisible();
    // The answer lands at the form, not at the top of the page.
    await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/' : path}#register$`));
    await expect(page.locator('#register')).toBeInViewport();

    const message = await expectOneMessageFor(email);
    expect(message.text).toContain('Name: Grace Hopper');
    expect(message.text).toContain('Outlet or organisation: Compiler Weekly');
    expect(message.text).toContain('Ghost, plus a podcast');
    expect(message.text).toContain(`Page: ${origin}`);
  });
}

test('a refused post without JavaScript shows the failure message and keeps the typed values', async ({
  page,
}) => {
  await page.context().setExtraHTTPHeaders({ 'x-forwarded-for': uniqueIp() });
  await page.goto('/');
  await page.waitForTimeout(MIN_WAIT_MS);
  // Bypass the browser's own required-field check to reach the server's.
  await page.locator('form.reg-form').evaluate((form) => {
    (form as HTMLFormElement).noValidate = true;
  });
  await page.getByLabel('Email', { exact: true }).fill('nameless@example.com');
  await page.getByRole('button', { name: 'Register interest' }).click();

  await expect(page.getByText(REGISTER_FAILURE_MESSAGE)).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('nameless@example.com');
  expect(messagesFor('nameless@example.com')).toHaveLength(0);
});
