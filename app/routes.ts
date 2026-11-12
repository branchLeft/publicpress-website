import { type RouteConfig, route } from '@react-router/dev/routes';

/**
 * One route module answers every path. `/` is the journey page and
 * `/ghost-hosting` is the hosting page; the eight pop-up paths and every unknown
 * path answer with the journey page (see app/lib/pages.ts).
 *
 * `:slug?` matches `/` and any single segment, which covers every pop-up path:
 * opening a pop-up navigates between two of those addresses, and one route
 * keeps the page mounted (scroll position, animation state) while it does. The
 * `*` route is only for deeper unknown paths, which render the journey too.
 */
export default [
  route(':slug?', 'routes/site.tsx'),
  route('*', 'routes/site.tsx', { id: 'routes/site-deep' }),
] satisfies RouteConfig;
