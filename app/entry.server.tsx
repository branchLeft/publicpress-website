import { PassThrough } from 'node:stream';
import { randomBytes } from 'node:crypto';

import type { EntryContext } from 'react-router';
import { createReadableStreamFromReadable } from '@react-router/node';
import { ServerRouter } from 'react-router';
import { isbot } from 'isbot';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { renderToPipeableStream } from 'react-dom/server';
import { buildContentSecurityPolicy } from './lib/security-headers';

export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === 'HEAD') {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get('user-agent');

    // Per-request nonce for the inline <script> tags React Router's <Scripts />
    // emits for hydration (the __reactRouterContext assignment and the
    // route-modules import map), see app/lib/security-headers.ts. 16 random
    // bytes, base64-encoded, per the CSP nonce recommendation:
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce
    const nonce = randomBytes(16).toString('base64');

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode ? 'onAllReady' : 'onShellReady';

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1000
    );

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} nonce={nonce} />,
      {
        nonce,
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              // Clear the timeout to prevent retaining the closure and memory leak
              clearTimeout(timeoutId);
              timeoutId = undefined;
              callback();
            },
          });
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set('Content-Type', 'text/html');

          // The edge terminates TLS upstream and forwards plain HTTP with
          // `X-Forwarded-Proto: https` set. That header, not the request's own
          // URL scheme, is the real signal for whether the original connection
          // was secure. `pnpm start` and the end-to-end test server (plain HTTP,
          // no proxy) have no such header, so `isSecure` is correctly `false`.
          const isSecure = request.headers.get('x-forwarded-proto') === 'https';

          // Override root.tsx's nonce-less CSP with the nonce-bearing version
          // now that one exists. `isSecure` matters: `upgrade-insecure-requests`
          // sent on a plain-HTTP response still force-upgrades every same-page
          // subresource request to HTTPS, which fails outright against a server
          // with no TLS listener and breaks asset loading and hydration.
          responseHeaders.set(
            'Content-Security-Policy',
            buildContentSecurityPolicy(nonce, isSecure)
          );

          // Strict-Transport-Security is a persistent, origin-wide browser
          // decision: it must never ride on a response that did not arrive over HTTPS.
          if (!isSecure) {
            responseHeaders.delete('Strict-Transport-Security');
          }

          pipe(body);

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell. Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );
  });
}
