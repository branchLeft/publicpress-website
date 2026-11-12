# PublicPress website

The site at [publicpress.co.uk](https://publicpress.co.uk): a journey page (`/`) and a
hosting page (`/ghost-hosting`), with eight pop-ups that each have their own path.

The source is available under the licence in [LICENSE](LICENSE); it is source-available, not open
source. The PublicPress and branchLeft names and brand assets are not part of that grant.

## Stack

- React 19 and React Router 8 in framework mode, server-rendered (`react-router-serve`)
- Plain CSS, self-hosted fonts and images, no inline styles or scripts
- A per-request nonce Content-Security-Policy and the other security headers (`app/lib/security-headers.ts`)
- pnpm 11, Node 26 (`.nvmrc`), Vitest, Playwright (Chromium)

## How it works

- Which pop-up is open is a function of the address. The server renders the matching `<dialog>`
  open, so `/included` arrives with its pop-up showing. Opening one pushes its path, closing returns
  to the page's own path, and Back closes it.
- The register form posts to its own page's route action and works without JavaScript. It has a
  honeypot, a minimum time on the page, a per-address rate limit, length limits and an Origin check,
  and sends one email to the team over SMTP submission (port 587, STARTTLS required).

## Develop

```
pnpm install
pnpm dev            # http://localhost:5173
pnpm typecheck
pnpm test:unit
pnpm test:e2e       # builds and serves the app, then drives Chromium
```

Copy `.env.example` to `.env` for the SMTP settings. The end-to-end suite stubs the mailer.

## Notes

- The shared TypeScript and Prettier configuration of the other repos is inlined here rather than
  installed, so a build needs no registry credential.
- The content was ported from the static launch pages and is compared with them, text for text, by
  `tests/parity.spec.ts` against the copies in `tests/fixtures/reference/`.
- The Compose stack that runs the image on app1 lives in `branchLeft/shared-infra`, in the
  `publicpress_website_app1` Ansible role, which owns its port (8081) and its env file.
