/**
 * Security response headers, shared between `root.tsx` (`headers()` export,
 * runs before rendering, so no nonce exists yet) and `entry.server.tsx` (runs
 * during rendering: generates the per-request nonce and overrides the
 * `Content-Security-Policy` header with the nonce-bearing version).
 */

/**
 * No `'unsafe-inline'` anywhere. The pages carry no `style=""` attribute and no
 * inline `<style>`: every rule is in a stylesheet served from this origin, and
 * the animation's rules are in that stylesheet too.
 */
const STYLE_SRC = "'self'";

/**
 * `isSecure` defaults to `true` (production's normal case). `entry.server.tsx`,
 * the one caller that knows the real scheme, passes `false` for a plain-HTTP
 * request: `upgrade-insecure-requests` is a live, per-response instruction that
 * force-upgrades every same-page subresource request to HTTPS, which breaks
 * asset loading outright against a server with no TLS listener (`pnpm start`,
 * the end-to-end test server).
 */
export function buildContentSecurityPolicy(nonce?: string, isSecure = true): string {
  const scriptSrc = nonce ? `'self' 'nonce-${nonce}'` : "'self'";
  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${STYLE_SRC}`,
    // `data:` is for images only (an icon fallback); fonts and the headshot are
    // hashed files from this origin.
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ];
  if (isSecure) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'autoplay=()',
  'camera=()',
  'display-capture=()',
  'encrypted-media=()',
  'fullscreen=()',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'payment=()',
  'picture-in-picture=()',
  'publickey-credentials-get=()',
  'screen-wake-lock=()',
  'usb=()',
  'xr-spatial-tracking=()',
].join(', ');

/**
 * The static (nonce-independent) header set. Applies to every response, document
 * requests and resource routes alike, via root.tsx's `headers()` export.
 */
export function buildSecurityHeaders(nonce?: string): Record<string, string> {
  return {
    'Content-Security-Policy': buildContentSecurityPolicy(nonce),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': PERMISSIONS_POLICY,
    // Conservative max-age (~180 days), no includeSubDomains, no preload: HSTS
    // is only safe to widen once HTTPS is confirmed permanent, and preload
    // submission is a one-way door.
    'Strict-Transport-Security': 'max-age=15552000',
  };
}
