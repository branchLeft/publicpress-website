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
  // The headshot loads lazily, so it is fetched only once it nears the viewport.
  const headshot = page.waitForResponse((response) =>
    /^\/assets\/headshot-320-.+\.webp$/.test(new URL(response.url()).pathname)
  );
  await page.locator('main img[src*="headshot-320-"]').first().scrollIntoViewIfNeeded();
  await headshot;
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

  await expect(page.locator('meta[name=robots]')).toHaveCount(0);

  await page.goto('/zzz/not-a-page');
  await expect(page).toHaveTitle(
    'Independent journalism, on independent infrastructure | PublicPress'
  );
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://publicpress.co.uk/'
  );
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex, follow');

  await page.goto('/included');
  await expect(page.locator('meta[name=robots]')).toHaveCount(0);
});

test('each page carries one schema.org graph naming the page, the site and the operator', async ({
  page,
}) => {
  await page.goto('/ghost-hosting');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
  const blocks = page.locator('script[type="application/ld+json"]');
  await expect(blocks).toHaveCount(1);
  const data = JSON.parse((await blocks.textContent()) ?? '') as {
    '@graph': { '@type': string; url?: string }[];
  };
  expect(data['@graph'].map((node) => node['@type'])).toEqual([
    'Organization',
    'WebSite',
    'WebPage',
  ]);
  expect(data['@graph'][2]?.url).toBe('https://publicpress.co.uk/ghost-hosting');
});

test('robots.txt allows everything and names the sitemap, which lists the two pages', async ({
  request,
}) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toContain('text/plain');
  expect(await robots.text()).toContain('Sitemap: https://publicpress.co.uk/sitemap.xml');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  const body = await sitemap.text();
  expect(body).toContain('<loc>https://publicpress.co.uk/</loc>');
  expect(body).toContain('<loc>https://publicpress.co.uk/ghost-hosting</loc>');
});
