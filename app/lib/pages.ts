/**
 * The two pages and the eight pop-up addresses, in one place.
 *
 * `/` is the newsroom journey and `/ghost-hosting` is the hosting page. Every
 * other path, pop-up address or not, answers with the journey page: the edge
 * this site replaces did the same, so no existing link breaks.
 */

export type PageKind = 'journey' | 'ghost-hosting';

export const SITE_ORIGIN = 'https://publicpress.co.uk';

export const PAGES: Readonly<
  Record<PageKind, { path: string; title: string; description: string }>
> = {
  journey: {
    path: '/',
    title: 'Independent journalism, on independent infrastructure | PublicPress',
    description:
      'Managed technical solutions for independent newsrooms in the UK, from a company that exists to support them.',
  },
  'ghost-hosting': {
    path: '/ghost-hosting',
    title: 'Managed Ghost hosting, done well | PublicPress',
    description:
      'Managed Ghost hosting for UK writers, charities, clubs and small businesses. Upgrades, backups, newsletters and support included, from £15 a month.',
  },
};

/** Each pop-up: the id of its `<dialog>` and the path that opens it. */
export const POPUPS = [
  { id: 'ghost', path: '/what-is-ghost' },
  { id: 'included', path: '/included' },
  { id: 'yours', path: '/your-site' },
  { id: 'moving', path: '/moving' },
  { id: 'built', path: '/how-its-built' },
  { id: 'why', path: '/why' },
  { id: 'everyone', path: '/everyone' },
  { id: 'about', path: '/about' },
] as const;

export type PopupId = (typeof POPUPS)[number]['id'];

/** The path as the pop-up lookup sees it: no trailing slash, lower case. */
export function normalizePath(pathname: string): string {
  return pathname.replace(/(.)\/+$/, '$1').toLowerCase();
}

export function popupForPath(pathname: string): PopupId | null {
  const path = normalizePath(pathname);
  return POPUPS.find((popup) => popup.path === path)?.id ?? null;
}

export function pathForPopup(id: PopupId): string {
  const popup = POPUPS.find((candidate) => candidate.id === id);
  if (popup === undefined) throw new Error(`no pop-up has the id ${id}`);
  return popup.path;
}

export function isPopupId(value: string): value is PopupId {
  return POPUPS.some((popup) => popup.id === value);
}

/** The page a request path answers with. Only `/ghost-hosting` is not the journey. */
export function pageKindForPath(pathname: string): PageKind {
  return normalizePath(pathname) === PAGES['ghost-hosting'].path ? 'ghost-hosting' : 'journey';
}

export function canonicalUrl(kind: PageKind): string {
  const { path } = PAGES[kind];
  return `${SITE_ORIGIN}${path}`;
}
