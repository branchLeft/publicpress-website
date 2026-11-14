/**
 * What search engines and link previews read: the structured data on each page,
 * robots.txt and the sitemap. Every value comes from `pages.ts` or from text the
 * page itself shows, so there is one home for each fact.
 */
import { PAGES, POPUPS, SITE_ORIGIN, canonicalUrl, normalizePath, type PageKind } from './pages';

/** The site's name as the pages' titles give it. */
export const SITE_NAME = 'PublicPress';

/** The operator named in the footer, and the company the copy credits. */
const OPERATOR = {
  name: 'branchLeft',
  legalName: 'BRANCHLEFT LTD',
  url: 'https://branchleft.co.uk',
} as const;

const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

type JsonLd = Record<string, unknown>;

/**
 * One schema.org graph per page: the operator, the site it publishes, and this
 * page as part of that site. Search engines read the three as linked by `@id`.
 */
export function structuredData(kind: PageKind): JsonLd {
  const page = PAGES[kind];
  const url = canonicalUrl(kind);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: OPERATOR.name,
        legalName: OPERATOR.legalName,
        url: OPERATOR.url,
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: SITE_NAME,
        url: `${SITE_ORIGIN}/`,
        description: PAGES.journey.description,
        inLanguage: 'en-GB',
        publisher: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        name: page.title,
        url,
        description: page.description,
        inLanguage: 'en-GB',
        isPartOf: { '@id': WEBSITE_ID },
        publisher: { '@id': ORGANIZATION_ID },
      },
    ],
  };
}

/**
 * Whether a path is one this site means to have indexed under its own canonical
 * URL: the two pages, or a pop-up address (whose canonical is the journey page).
 * Every other path still answers with the journey, so no old link breaks, but is
 * marked `noindex` so a search engine never lists it as a copy of the home page.
 */
export function isKnownPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return (
    Object.values(PAGES).some((page) => page.path === path) ||
    POPUPS.some((popup) => popup.path === path)
  );
}

export function robotsTxt(): string {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_ORIGIN}/sitemap.xml`, ''].join('\n');
}

/** The two pages. Pop-up addresses are not listed: each is the journey page. */
export function sitemapXml(): string {
  const urls = (Object.keys(PAGES) as PageKind[])
    .map((kind) => `  <url><loc>${canonicalUrl(kind)}</loc></url>`)
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
}
