import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
  type StaticHandlerContext,
} from 'react-router';

import { SiteContext, type SiteValue } from '~/components/SiteContext';

type Options = {
  /** The address the page is rendered at. */
  readonly url?: string;
  readonly site?: SiteValue;
  /** What the route's action answered, as `useActionData` will see it. */
  readonly actionData?: unknown;
};

/**
 * Server-renders `element` inside a data router at `url`, the way the framework
 * renders a route, and returns the HTML. Effects do not run: this is the HTML a
 * visitor without scripting receives.
 */
export async function renderRoute(element: ReactElement, options: Options = {}): Promise<string> {
  const { url = 'http://localhost/', site = { page: 'journey', renderedAt: 1234 } } = options;
  const routes = [{ id: 'route', path: '*', Component: () => element }];
  const handler = createStaticHandler(routes);
  const query = await handler.query(new Request(url));
  if (query instanceof Response) throw new Error('the static handler answered with a Response');
  const context: StaticHandlerContext = {
    ...query,
    actionData: options.actionData === undefined ? null : { route: options.actionData },
  };
  const router = createStaticRouter(handler.dataRoutes, context);
  const html = renderToString(
    <SiteContext.Provider value={site}>
      <StaticRouterProvider router={router} context={context} hydrate={false} />
    </SiteContext.Provider>
  );
  // React separates adjacent text nodes with `<!-- -->`; they are not content.
  return html.replaceAll('<!-- -->', '');
}
