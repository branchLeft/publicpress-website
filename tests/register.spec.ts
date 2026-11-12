import { expect, test, type Page } from '@playwright/test';

import {
  REGISTER_FAILURE_MESSAGE,
  REGISTER_SUCCESS_MESSAGE,
} from '../app/content/register-messages';
import { hydrated, watch } from './helpers';
import { MIN_WAIT_MS, expectOneMessageFor, messagesFor, uniqueEmail, uniqueIp } from './mail';

async function fillForm(page: Page, email: string): Promise<void> {
  await page.getByLabel('Name', { exact: true }).fill('Ada Lovelace');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Outlet or organisation').fill('The Analytical Gazette');
  await page.getByLabel('What do you publish on today?').fill('A weekly newsletter on WordPress');
}

for (const { path, origin } of [
  { path: '/', origin: '/' },
  { path: '/ghost-hosting', origin: '/ghost-hosting' },
]) {
  test(`${path}: the form submits with JavaScript and is replaced in place by the success message`, async ({
    page,
  }) => {
    await page.context().setExtraHTTPHeaders({ 'x-forwarded-for': uniqueIp() });
    const seen = await watch(page);
    const email = uniqueEmail();
    await page.goto(path);
    await hydrated(page);
    await page.waitForTimeout(MIN_WAIT_MS);

    await fillForm(page, email);
    await page.getByRole('button', { name: 'Register interest' }).click();

    await expect(page.getByText(REGISTER_SUCCESS_MESSAGE)).toBeVisible();
    await expect(page.locator('form.reg-form')).toHaveCount(0);
    await expect(page.locator('#register')).toBeInViewport();
    // The page did not reload: still the same document, still the same address.
    await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/' : path}(#register)?$`));
    await expect(
      page.getByText('We use these details only to contact you about PublicPress.')
    ).toBeVisible();

    const message = await expectOneMessageFor(email);
    expect(message.to).toBe('info@branchleft.co.uk');
    expect(message.subject).toBe('Register interest in PublicPress');
    expect(message.text).toContain('Name: Ada Lovelace');
    expect(message.text).toContain(`Email: ${email}`);
    expect(message.text).toContain('Outlet or organisation: The Analytical Gazette');
    expect(message.text).toContain(
      'What do you publish on today?\nA weekly newsletter on WordPress'
    );
    expect(message.text).toContain(`Page: ${origin}`);

    expect(await seen.violations()).toEqual([]);
    expect(seen.errors).toEqual([]);
  });
}

test('the form has the owner-approved labels, and the old mailto block is gone', async ({
  page,
}) => {
  await page.goto('/');
  const register = page.locator('#register');
  await expect(register.getByLabel('Name', { exact: true })).toHaveAttribute('required', '');
  await expect(register.getByLabel('Email', { exact: true })).toHaveAttribute('type', 'email');
  await expect(register.getByLabel('Email', { exact: true })).toHaveAttribute('required', '');
  await expect(register.getByLabel('Outlet or organisation')).not.toHaveAttribute('required', '');
  await expect(register.getByLabel('What do you publish on today?')).toBeVisible();
  await expect(register.getByRole('button', { name: 'Register interest' })).toBeVisible();
  await expect(register.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(register).not.toContainText('info@branchleft.co.uk');
});

test('a refused submit shows the failure message and keeps what was typed', async ({ page }) => {
  await page.context().setExtraHTTPHeaders({ 'x-forwarded-for': uniqueIp() });
  await page.goto('/');
  await hydrated(page);
  await page.waitForTimeout(MIN_WAIT_MS);

  // Past the browser's own required-field check, to reach the server's.
  await page.evaluate(() => {
    const form = document.querySelector<HTMLFormElement>('form.reg-form');
    if (form) form.noValidate = true;
  });
  await page.getByLabel('Email', { exact: true }).fill('someone@example.com');
  await page.getByLabel('Outlet or organisation').fill('Kept Outlet');
  await page.getByRole('button', { name: 'Register interest' }).click();

  await expect(page.getByText(REGISTER_FAILURE_MESSAGE)).toBeVisible();
  await expect(page.locator('form.reg-form')).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('someone@example.com');
  await expect(page.getByLabel('Outlet or organisation')).toHaveValue('Kept Outlet');
  expect(messagesFor('someone@example.com')).toHaveLength(0);
});

test.describe('abuse controls, posted directly', () => {
  const fields = (email: string, extra: Record<string, string> = {}) => ({
    name: 'Ada Lovelace',
    email,
    organisation: 'The Analytical Gazette',
    publishing: 'Newsletters',
    page: '/',
    renderedAt: String(Date.now() - 60_000),
    fax: '',
    ...extra,
  });

  test('a POST from a foreign Origin is refused and nothing is sent', async ({
    request,
    baseURL,
  }) => {
    const email = uniqueEmail();
    const response = await request.post('/', {
      headers: { origin: 'https://evil.example', 'x-forwarded-for': uniqueIp() },
      form: fields(email),
    });
    // React Router's own origin check refuses it first (400); the action's check, which
    // answers 403, is covered by the unit tests. Either way, nothing is sent.
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
    expect(messagesFor(email)).toHaveLength(0);

    const own = await request.post('/', {
      headers: { origin: baseURL ?? '', 'x-forwarded-for': uniqueIp() },
      form: fields(email),
    });
    expect(own.status()).toBe(200);
    await expectOneMessageFor(email);
  });

  test('a filled honeypot gets a pretend success and sends nothing', async ({ request }) => {
    const email = uniqueEmail();
    const response = await request.post('/', {
      headers: { 'x-forwarded-for': uniqueIp() },
      form: fields(email, { fax: 'bot' }),
    });
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('be in touch before we launch');
    expect(messagesFor(email)).toHaveLength(0);
  });

  test('a post straight after the page rendered gets a pretend success and sends nothing', async ({
    request,
  }) => {
    const email = uniqueEmail();
    const response = await request.post('/', {
      headers: { 'x-forwarded-for': uniqueIp() },
      form: fields(email, { renderedAt: String(Date.now()) }),
    });
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('be in touch before we launch');
    expect(messagesFor(email)).toHaveLength(0);
  });

  test('the sixth post from one address inside ten minutes is refused', async ({ request }) => {
    const headers = { 'x-forwarded-for': uniqueIp() };
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const response = await request.post('/', {
        headers,
        form: fields(uniqueEmail(), { fax: 'x' }),
      });
      statuses.push(response.status());
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });
});
