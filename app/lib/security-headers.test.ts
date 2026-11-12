import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy, buildSecurityHeaders } from './security-headers';

// Splits a CSP header into its directives, keyed by directive name, so
// assertions target one directive at a time instead of the whole string.
function parseDirectives(csp: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const part of csp.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    const [name, ...values] = tokens;
    if (name !== undefined) result[name] = values;
  }
  return result;
}

describe('buildContentSecurityPolicy', () => {
  const csp = buildContentSecurityPolicy('THE_NONCE');
  const directives = parseDirectives(csp);

  it('gates script-src on self plus the nonce, with no unsafe-inline, unsafe-eval or wildcard', () => {
    expect(directives['script-src']).toEqual(["'self'", "'nonce-THE_NONCE'"]);
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
  });

  it('keeps style-src to self: no inline style anywhere', () => {
    expect(directives['style-src']).toEqual(["'self'"]);
  });

  it('allows data: for images only; fonts are self', () => {
    expect(directives['img-src']).toEqual(["'self'", 'data:']);
    expect(directives['font-src']).toEqual(["'self'"]);
    for (const [name, values] of Object.entries(directives)) {
      if (name !== 'img-src') expect(values, name).not.toContain('data:');
    }
  });

  it('restricts default-src, connect-src and form-action to self', () => {
    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['connect-src']).toEqual(["'self'"]);
    expect(directives['form-action']).toEqual(["'self'"]);
  });

  it('blocks framing and plugin content, and pins base-uri', () => {
    expect(directives['frame-ancestors']).toEqual(["'none'"]);
    expect(directives['object-src']).toEqual(["'none'"]);
    expect(directives['base-uri']).toEqual(["'self'"]);
  });

  it('never carries a wildcard source', () => {
    for (const [name, values] of Object.entries(directives)) {
      expect(values, name).not.toContain('*');
    }
  });

  it('force-upgrades subresources when the request was secure, and not otherwise', () => {
    expect(csp).toContain('upgrade-insecure-requests');
    expect(buildContentSecurityPolicy('THE_NONCE', false)).not.toContain(
      'upgrade-insecure-requests'
    );
  });

  it('falls back to self alone for script-src when no nonce exists yet', () => {
    expect(parseDirectives(buildContentSecurityPolicy())['script-src']).toEqual(["'self'"]);
  });

  it('a CR/LF in a nonce is refused by the Headers API, not written to the wire', () => {
    const headers = new Headers();
    expect(() =>
      headers.set('Content-Security-Policy', buildContentSecurityPolicy('a\r\nSet-Cookie: x=1'))
    ).toThrow();
  });
});

describe('buildSecurityHeaders', () => {
  const headers = buildSecurityHeaders('THE_NONCE');

  it('sets the fixed headers to their documented values', () => {
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('threads the nonce into the Content-Security-Policy', () => {
    expect(headers['Content-Security-Policy']).toContain("'nonce-THE_NONCE'");
  });

  it('disables every listed feature in the Permissions-Policy', () => {
    const entries = (headers['Permissions-Policy'] ?? '').split(', ');
    expect(entries.length).toBeGreaterThan(10);
    for (const entry of entries) expect(entry).toMatch(/^[a-z-]+=\(\)$/);
    expect(entries).toEqual(expect.arrayContaining(['camera=()', 'microphone=()', 'payment=()']));
  });

  it('sets a months-long HSTS max-age, without includeSubDomains or preload', () => {
    const hsts = headers['Strict-Transport-Security'] ?? '';
    const maxAge = Number(hsts.match(/max-age=(\d+)/)?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(30 * 86_400);
    expect(maxAge).toBeLessThanOrEqual(365 * 86_400);
    expect(hsts).not.toMatch(/includeSubDomains|preload/);
  });
});
