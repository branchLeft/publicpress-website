import { describe, expect, it } from 'vitest';

import { robotsTxt, sitemapXml } from '~/lib/seo';
import { loader as robotsLoader } from './robots';
import { loader as sitemapLoader } from './sitemap';

describe('the crawler files', () => {
  it('serves robots.txt as plain text', async () => {
    const response = robotsLoader();
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(await response.text()).toBe(robotsTxt());
  });

  it('serves the sitemap as XML', async () => {
    const response = sitemapLoader();
    expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
    expect(await response.text()).toBe(sitemapXml());
  });
});
