import type { Config } from '@react-router/dev/config';

/**
 * Framework Mode with SSR always on and manual routes in `app/routes.ts`.
 *
 * Pre-rendering stays off: a prerendered page would ship without the
 * per-request nonce CSP that `app/entry.server.tsx` sets, and the register
 * form's abuse controls need a live server.
 */
export default {
  ssr: true,
  // React Router refuses an action whose `Origin` differs from the request
  // URL's origin. Behind the TLS-terminating edge the server sees
  // `http://publicpress.co.uk` while browsers send `https://publicpress.co.uk`,
  // so every JavaScript form submission (a fetch to `<route>.data`) would be
  // refused with a 400. Only the site's own host is allowed.
  allowedActionOrigins: ['publicpress.co.uk'],
} satisfies Config;
