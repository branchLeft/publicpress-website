import * as React from 'react';

import type { PageKind } from '~/lib/pages';

/** What the page body needs from the route's loader, without knowing the route. */
export type SiteValue = {
  /** Which page this document is, fixed when the document loaded. */
  readonly page: PageKind;
  /** When the server rendered the page: the register form posts it back. */
  readonly renderedAt: number;
};

export const SiteContext = React.createContext<SiteValue | null>(null);

export function useSite(): SiteValue {
  const value = React.useContext(SiteContext);
  if (value === null) throw new Error('useSite must be used inside the site route');
  return value;
}
