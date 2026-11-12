# CLAUDE.md — PublicPress website

branchLeft-internal: cross-repo rules live in the local workspace root CLAUDE.md (not part of this repo).

## Stack

React 19 + React Router 8 (SSR, `react-router.config.ts`), plain CSS in `app/styles/`, pnpm, Node per `.nvmrc`.

## Rules for this repo

- Page copy is the owner's approved launch copy, in `app/content/`. Do not reword it. The register
  form's success and failure messages live in `app/content/register-messages.ts` only.
- No inline `style`, inline script, inline event handler, `mailto:` link or `data:` URI: the CSP
  forbids them, and the unit and e2e suites check for them. Fonts and images are hashed static files.
- The register form must keep working without JavaScript (`tests/no-js.spec.ts`).
- Pop-up state comes from the address (`app/lib/pages.ts`, `app/components/Popup.tsx`); do not add
  parallel state.
- Never log a secret. SMTP settings are the four `PUBLICPRESS_SMTP_*` variables.
- New code is TypeScript. No new `.js` or `.mjs`.

## Commands

`pnpm typecheck`, `pnpm test:unit --run --coverage`, `pnpm test:e2e`, `pnpm lint`, `pnpm format`.
