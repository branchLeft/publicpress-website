import { describe, expect, it, vi } from 'vitest';

vi.mock('~/lib/register.server', () => ({
  submitRegister: vi.fn(async () => ({ wired: true })),
}));

import { submitRegister } from '~/lib/register.server';
import { action, loader, meta, shouldRevalidate } from './site';

// The route's own arguments carry far more than these functions read; only the
// parts they use are supplied.
const loaderArgs = (url: string) => ({ request: new Request(url) }) as Parameters<typeof loader>[0];

describe('loader', () => {
  it('serves the hosting page at /ghost-hosting', async () => {
    expect((await loader(loaderArgs('http://localhost/ghost-hosting'))).page).toBe('ghost-hosting');
  });

  it('serves the journey everywhere else, pop-up and unknown paths included', async () => {
    for (const path of ['/', '/included', '/about', '/nonsense', '/a/b/c']) {
      expect((await loader(loaderArgs(`http://localhost${path}`))).page).toBe('journey');
    }
  });

  it('stamps the time the page was rendered', async () => {
    const before = Date.now();
    const { renderedAt } = await loader(loaderArgs('http://localhost/'));
    expect(renderedAt).toBeGreaterThanOrEqual(before);
    expect(renderedAt).toBeLessThanOrEqual(Date.now());
  });
});

describe('shouldRevalidate', () => {
  it('never revalidates: opening a pop-up must not re-stamp the page or change its kind', () => {
    expect(shouldRevalidate({} as Parameters<typeof shouldRevalidate>[0])).toBe(false);
  });
});

describe('action', () => {
  it('hands the request to the register handler and returns its answer', async () => {
    const request = new Request('http://localhost/', { method: 'POST' });
    const result = await action({ request } as Parameters<typeof action>[0]);
    expect(submitRegister).toHaveBeenCalledWith(request);
    expect(result).toEqual({ wired: true });
  });
});

describe('meta', () => {
  const metaFor = (page: 'journey' | 'ghost-hosting' | undefined) =>
    meta({ loaderData: page && { page, renderedAt: 0 } } as unknown as Parameters<typeof meta>[0]);

  it('gives the hosting page its title, description, canonical link and og tags', () => {
    const tags = metaFor('ghost-hosting');
    expect(tags).toContainEqual({ title: 'Managed Ghost hosting, done well | PublicPress' });
    expect(tags).toContainEqual({
      tagName: 'link',
      rel: 'canonical',
      href: 'https://publicpress.co.uk/ghost-hosting',
    });
    expect(tags).toContainEqual({
      property: 'og:url',
      content: 'https://publicpress.co.uk/ghost-hosting',
    });
    expect(tags).toContainEqual({ property: 'og:type', content: 'website' });
    expect(tags).toContainEqual({ name: 'twitter:card', content: 'summary' });
  });

  it('gives the journey its own, and is the fallback with no loader data', () => {
    for (const tags of [metaFor('journey'), metaFor(undefined)]) {
      expect(tags).toContainEqual({
        title: 'Independent journalism, on independent infrastructure | PublicPress',
      });
      expect(tags).toContainEqual({
        tagName: 'link',
        rel: 'canonical',
        href: 'https://publicpress.co.uk/',
      });
    }
  });
});
