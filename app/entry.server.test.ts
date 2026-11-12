import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntryContext } from 'react-router';

const { renderToPipeableStream } = vi.hoisted(() => ({
  renderToPipeableStream: vi.fn(),
}));

vi.mock('react-dom/server', () => ({
  renderToPipeableStream,
}));

vi.mock('isbot', () => ({
  isbot: () => false,
}));

vi.mock('@react-router/node', () => ({
  createReadableStreamFromReadable: () => new ReadableStream(),
}));

import handleRequest from './entry.server';

// A base64-encoded 16-byte value: 22 data characters plus '==' padding. Confirms
// the nonce comes from a byte source of adequate width, not Math.random() or a
// short, guessable string.
const NONCE_SHAPE = /^[A-Za-z0-9+/]{22}==$/;

// Stands in for react-dom/server rendering: invokes the ready callback after the
// { pipe, abort } destructuring has completed (as the real implementation does)
// and hands the test the element and options entry.server.tsx passed in.
function mockRenderOnce() {
  let captured: { element: unknown; options: Record<string, unknown> } | undefined;
  renderToPipeableStream.mockImplementationOnce(
    (element: unknown, options: Record<string, () => void>) => {
      captured = { element, options };
      queueMicrotask(() => options.onShellReady?.());
      return { pipe: vi.fn(), abort: vi.fn() };
    }
  );
  return () => {
    if (!captured) throw new Error('renderToPipeableStream was not called');
    return captured;
  };
}

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/', { headers });
}

async function run(request: Request) {
  const getCaptured = mockRenderOnce();
  // React Router fills responseHeaders from root.tsx's `headers()` before
  // entry.server.tsx runs, so Strict-Transport-Security is already present.
  const responseHeaders = new Headers({ 'Strict-Transport-Security': 'max-age=15552000' });
  const response = (await handleRequest(request, 200, responseHeaders, {
    isSpaMode: false,
  } as unknown as EntryContext)) as Response;
  return { response, captured: getCaptured() };
}

describe('handleRequest nonce generation', () => {
  beforeEach(() => {
    renderToPipeableStream.mockReset();
  });

  it('generates a nonce shaped like 16 crypto-random bytes, base64-encoded', async () => {
    const { captured } = await run(makeRequest({ 'x-forwarded-proto': 'https' }));
    expect(captured.options.nonce).toMatch(NONCE_SHAPE);
  });

  it('never produces the same nonce twice across requests', async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      const { captured } = await run(makeRequest({ 'x-forwarded-proto': 'https' }));
      const nonce = captured.options.nonce as string;
      expect(seen.has(nonce)).toBe(false);
      seen.add(nonce);
    }
  });

  it('uses the same nonce for the render options and the <ServerRouter nonce> prop', async () => {
    const { captured } = await run(makeRequest({ 'x-forwarded-proto': 'https' }));
    const element = captured.element as { props: { nonce: string } };
    expect(element.props.nonce).toBe(captured.options.nonce);
  });

  it('puts the render nonce into the Content-Security-Policy response header', async () => {
    const { response, captured } = await run(makeRequest({ 'x-forwarded-proto': 'https' }));
    expect(response.headers.get('Content-Security-Policy')).toContain(
      `'nonce-${captured.options.nonce}'`
    );
  });
});

describe('handleRequest CSP/HSTS branching', () => {
  beforeEach(() => {
    renderToPipeableStream.mockReset();
  });

  it('treats x-forwarded-proto: https as secure: upgrades requests, keeps HSTS', async () => {
    const { response } = await run(makeRequest({ 'x-forwarded-proto': 'https' }));
    expect(response.headers.get('Content-Security-Policy')).toContain('upgrade-insecure-requests');
    expect(response.headers.get('Strict-Transport-Security')).not.toBeNull();
  });

  it('treats a request with no x-forwarded-proto as insecure: no upgrade, no HSTS', async () => {
    const { response } = await run(makeRequest());
    expect(response.headers.get('Content-Security-Policy')).not.toContain(
      'upgrade-insecure-requests'
    );
    expect(response.headers.get('Strict-Transport-Security')).toBeNull();
  });

  it('does not trust an https:// request URL on its own: only the proxy header decides', async () => {
    const { response } = await run(new Request('https://example.publicpress.co.uk/'));
    expect(response.headers.get('Strict-Transport-Security')).toBeNull();
  });

  it('never relaxes script-src or style-src, on either path', async () => {
    const variants: Record<string, string>[] = [{}, { 'x-forwarded-proto': 'https' }];
    for (const headers of variants) {
      const { response } = await run(makeRequest(headers));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      expect(csp).not.toMatch(/unsafe-inline/);
      expect(csp).not.toMatch(/unsafe-eval/);
    }
  });
});

describe('handleRequest HEAD requests', () => {
  it('responds without rendering', async () => {
    renderToPipeableStream.mockReset();
    const response = (await handleRequest(
      new Request('http://localhost/', { method: 'HEAD' }),
      200,
      new Headers(),
      { isSpaMode: false } as unknown as EntryContext
    )) as Response;

    expect(response.status).toBe(200);
    expect(renderToPipeableStream).not.toHaveBeenCalled();
  });
});
