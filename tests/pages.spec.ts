import { expect, test } from '@playwright/test';

import { PAGE_PATHS, hydrated, watch } from './helpers';

for (const path of PAGE_PATHS) {
  test(`${path} loads with no CSP violation and no console error`, async ({ page }) => {
    const seen = await watch(page);
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await hydrated(page);
    await expect(page.locator('main')).toBeVisible();

    expect(await seen.violations()).toEqual([]);
    expect(seen.errors).toEqual([]);
  });
}

test('the policy has a per-request nonce, no unsafe-inline, and the asked-for sources', async ({
  request,
}) => {
  const first = (await request.get('/')).headers()['content-security-policy'] ?? '';
  const second = (await request.get('/')).headers()['content-security-policy'] ?? '';
  expect(first).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/]{22}=='/);
  expect(first).not.toContain('unsafe-inline');
  expect(first).toContain("style-src 'self';");
  expect(first).toContain("font-src 'self';");
  expect(first).toContain("img-src 'self' data:;");
  expect(first).toContain("connect-src 'self';");
  expect(first).toContain("form-action 'self';");
  expect(second).not.toBe(first);
});

test('the violation listener fires: an injected inline script is reported and blocked', async ({
  page,
}) => {
  const seen = await watch(page);
  await page.goto('/');
  await hydrated(page);
  expect(await seen.violations()).toEqual([]);

  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.injectedRan = true';
    document.body.append(script);
  });

  await expect.poll(() => seen.violations()).toContainEqual(expect.stringContaining('script-src'));
  expect(await page.evaluate(() => 'injectedRan' in window)).toBe(false);
});

test('fonts and the headshot are hashed files, not data: URIs', async ({ page }) => {
  const requested: string[] = [];
  page.on('response', (response) => requested.push(new URL(response.url()).pathname));
  await page.goto('/');
  await hydrated(page);
  await page.evaluate(() => document.fonts.ready);

  expect(requested.filter((path) => /^\/assets\/jost-.+\.woff2$/.test(path))).not.toHaveLength(0);
  expect(
    requested.filter((path) => /^\/assets\/headshot-320-.+\.webp$/.test(path))
  ).not.toHaveLength(0);
  const html = (await (await page.request.get('/')).text()).toLowerCase();
  expect(html).not.toContain('data:font');
  expect(html).not.toContain('base64');
});

test('the head carries the title, description, canonical link and og tags', async ({ page }) => {
  await page.goto('/ghost-hosting');
  await expect(page).toHaveTitle('Managed Ghost hosting, done well | PublicPress');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://publicpress.co.uk/ghost-hosting'
  );
  await expect(page.locator('meta[name=description]')).toHaveAttribute(
    'content',
    'Managed Ghost hosting for UK writers, charities, clubs and small businesses. Upgrades, backups, newsletters and support included, from £15 a month.'
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://publicpress.co.uk/ghost-hosting'
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');

  await page.goto('/zzz/not-a-page');
  await expect(page).toHaveTitle(
    'Independent journalism, on independent infrastructure | PublicPress'
  );
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://publicpress.co.uk/'
  );
});
