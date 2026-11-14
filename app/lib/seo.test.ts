import { describe, expect, it } from 'vitest';

import { PAGES } from './pages';
import { isKnownPath, robotsTxt, sitemapXml, structuredData } from './seo';

type Node = Record<string, unknown> & { '@type': string; '@id': string };
const graphOf = (kind: 'journey' | 'ghost-hosting') =>
  (structuredData(kind) as { '@graph': Node[] })['@graph'];

describe('structuredData', () => {
  it('links the page to the site and the site to its operator by @id', () => {
    const [organization, website, webpage] = graphOf('ghost-hosting');
    expect(organization?.['@type']).toBe('Organization');
    expect(organization?.legalName).toBe('BRANCHLEFT LTD');
    expect(website?.publisher).toEqual({ '@id': organization?.['@id'] });
    expect(webpage?.isPartOf).toEqual({ '@id': website?.['@id'] });
  });

  it("describes each page with that page's own title, description and canonical URL", () => {
    for (const kind of ['journey', 'ghost-hosting'] as const) {
      const webpage = graphOf(kind)[2];
      expect(webpage?.name).toBe(PAGES[kind].title);
      expect(webpage?.description).toBe(PAGES[kind].description);
      expect(webpage?.url).toBe(`https://publicpress.co.uk${PAGES[kind].path}`);
    }
  });
});

describe('isKnownPath', () => {
  it('knows the two pages and every pop-up address, in any case and with a trailing slash', () => {
    for (const path of ['/', '/ghost-hosting', '/Ghost-Hosting/', '/included', '/about/']) {
      expect(isKnownPath(path)).toBe(true);
    }
  });

  it('does not know anything else', () => {
    for (const path of ['/nonsense', '/a/b/c', '/ghost-hosting/extra', '/robots']) {
      expect(isKnownPath(path)).toBe(false);
    }
  });
});

describe('robotsTxt', () => {
  it('allows every crawler everywhere and names the sitemap', () => {
    expect(robotsTxt()).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://publicpress.co.uk/sitemap.xml\n'
    );
  });
});

describe('sitemapXml', () => {
  it('lists exactly the two pages', () => {
    const xml = sitemapXml();
    expect(xml.match(/<loc>/g)).toHaveLength(2);
    expect(xml).toContain('<loc>https://publicpress.co.uk/</loc>');
    expect(xml).toContain('<loc>https://publicpress.co.uk/ghost-hosting</loc>');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
});
