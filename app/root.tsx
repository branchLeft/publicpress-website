import type * as React from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import type { Route } from './+types/root';
import courierPrimeWoff2 from '~/assets/fonts/courier-prime.woff2?url';
import jostWoff2 from '~/assets/fonts/jost.woff2?url';
import { buildSecurityHeaders } from '~/lib/security-headers';
import './styles/site.css';
import './styles/journey.css';
import './styles/ghost-hosting.css';
import './styles/ghost-anim.css';
import './styles/popups.css';
import './styles/register.css';
import './styles/narrow.css';

export const links: Route.LinksFunction = () => [
  { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  // The two faces above the fold on every page. Fonts are fetched in anonymous
  // CORS mode even from the same origin, so the preload must say so to be reused.
  { rel: 'preload', as: 'font', type: 'font/woff2', href: jostWoff2, crossOrigin: 'anonymous' },
  {
    rel: 'preload',
    as: 'font',
    type: 'font/woff2',
    href: courierPrimeWoff2,
    crossOrigin: 'anonymous',
  },
];

/**
 * Inherited by every route that exports no `headers()` of its own, so this set
 * applies site-wide. The CSP here carries no nonce: this runs before rendering,
 * when none exists. `app/entry.server.tsx` overrides it with the nonce-bearing
 * version for HTML documents.
 */
export const headers: Route.HeadersFunction = () => buildSecurityHeaders();

export function Layout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const statusText = isRouteErrorResponse(error) ? error.statusText : '';
  return (
    <main className="wrap hero">
      <h1>{status}</h1>
      {statusText !== '' && <p className="lede">{statusText}</p>}
    </main>
  );
}
