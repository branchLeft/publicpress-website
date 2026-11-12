import type { ShouldRevalidateFunction } from 'react-router';

import type { Route } from './+types/site';
import { PopupProvider } from '~/components/Popup';
import { SiteContext } from '~/components/SiteContext';
import { GhostHostingBody } from '~/content/GhostHostingBody';
import { JourneyBody } from '~/content/JourneyBody';
import { PAGES, canonicalUrl, pageKindForPath } from '~/lib/pages';
import { submitRegister } from '~/lib/register.server';

/**
 * The page is decided once, from the address the document was requested at, and
 * `renderedAt` is stamped then. Neither may change while the visitor opens and
 * closes pop-ups (which navigate), so the loader never revalidates.
 */
export async function loader({ request }: Route.LoaderArgs) {
  return {
    page: pageKindForPath(new URL(request.url).pathname),
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
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
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
