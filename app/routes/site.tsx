import type { ShouldRevalidateFunction } from 'react-router';

import type { Route } from './+types/site';
import { PopupProvider } from '~/components/Popup';
import { SiteContext } from '~/components/SiteContext';
import { GhostHostingBody } from '~/content/GhostHostingBody';
import { JourneyBody } from '~/content/JourneyBody';
import { PAGES, canonicalUrl, pageKindForPath } from '~/lib/pages';
import { SITE_NAME, isKnownPath, structuredData } from '~/lib/seo';
import { submitRegister } from '~/lib/register.server';

/**
 * The page is decided once, from the address the document was requested at, and
 * `renderedAt` is stamped then. Neither may change while the visitor opens and
 * closes pop-ups (which navigate), so the loader never revalidates.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const { pathname } = new URL(request.url);
  return {
    page: pageKindForPath(pathname),
    indexable: isKnownPath(pathname),
    renderedAt: Date.now(),
  };
}

export const shouldRevalidate: ShouldRevalidateFunction = () => false;

export async function action({ request }: Route.ActionArgs) {
  return submitRegister(request);
}

export function meta({ loaderData }: Route.MetaArgs) {
  const kind = loaderData?.page ?? 'journey';
  const { title, description } = PAGES[kind];
  const canonical = canonicalUrl(kind);
  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: canonical },
    // A path that is neither a page nor a pop-up still shows the journey, but is
    // kept out of search results so it never competes with the home page.
    ...(loaderData?.indexable === false ? [{ name: 'robots', content: 'noindex, follow' }] : []),
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: 'en_GB' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { 'script:ld+json': structuredData(kind) },
  ];
}

export default function Site({ loaderData }: Route.ComponentProps) {
  const { page, renderedAt } = loaderData;
  return (
    <SiteContext.Provider value={{ page, renderedAt }}>
      <PopupProvider>
        {page === 'ghost-hosting' ? <GhostHostingBody /> : <JourneyBody />}
      </PopupProvider>
    </SiteContext.Provider>
  );
}
