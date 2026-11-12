import { expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __cspViolations?: string[];
  }
}

export type PageWatch = {
  /** Every console error and uncaught page error, as text. */
  readonly errors: string[];
  /** Every `securitypolicyviolation` event the page raised. */
  violations: () => Promise<string[]>;
};

/**
 * Starts recording CSP violations and console errors on `page`. Call before the
 * first navigation: the listener is installed ahead of the page's own scripts.
 */
export async function watch(page: Page): Promise<PageWatch> {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.__cspViolations?.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return {
    errors,
    violations: () => page.evaluate(() => window.__cspViolations ?? []),
  };
}

/** Waits until React has hydrated: the headings only gain their "#" links then. */
export async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('main h2 .anchor').first()).toBeAttached();
}

/** Whether the dialog is open as a true modal (top layer), not just `open`. */
export function isModal(page: Page, id: string): Promise<boolean> {
  return page.evaluate(
    (dialogId) => document.getElementById(dialogId)?.matches(':modal') ?? false,
    id
  );
}

/** The pop-up paths and the button that opens each one on the journey page. */
export const POPUP_BUTTONS = [
  { id: 'ghost', path: '/what-is-ghost', opener: 'More about Ghost', title: 'What is Ghost?' },
  {
    id: 'included',
    path: '/included',
    opener: "What's included",
    title: 'Included on every paid plan',
  },
  { id: 'yours', path: '/your-site', opener: 'Your site, your way', title: 'Your site, your way' },
  { id: 'moving', path: '/moving', opener: 'How moving works', title: 'Moving to PublicPress' },
  {
    id: 'built',
    path: '/how-its-built',
    opener: 'How PublicPress is built',
    title: 'How PublicPress is built',
  },
  { id: 'why', path: '/why', opener: 'Why we are doing this', title: 'Why we are doing this' },
  {
    id: 'everyone',
    path: '/everyone',
    opener: 'Ghost hosting for everyone',
    title: 'Ghost hosting for everyone',
  },
  {
    id: 'about',
    path: '/about',
    opener: 'Meet branchLeft and its founder',
    title: 'branchLeft and its founder',
  },
] as const;

export const PAGE_PATHS = ['/', '/ghost-hosting', ...POPUP_BUTTONS.map((popup) => popup.path)];
