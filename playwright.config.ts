import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const baseURL = `http://localhost:${PORT}`;

/**
 * Where the stubbed mailer appends the messages the register form would have
 * sent. Test mode only: nothing in production sets this variable.
 */
export const OUTBOX = 'test-results/outbox.jsonl';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /(no-js|parity)\.spec\.ts$/,
    },
    {
      // javaScriptEnabled: false: the register form and the pop-up paths must
      // work with scripting off. Scoped to its own spec file because several
      // assertions are only true without script (the server-rendered pop-up
      // is a non-modal dialog, the page text is the server's, unhydrated).
      name: 'chromium-no-js',
      use: { ...devices['Desktop Chrome'], javaScriptEnabled: false },
      testMatch: /(no-js|parity)\.spec\.ts$/,
    },
  ],
  webServer: {
    // Built and served like production: the dev server injects CSS through a
    // client-side <style> element, which the page's policy would refuse.
    command: 'pnpm build && pnpm start',
    env: { PORT: String(PORT), PUBLICPRESS_MAIL_STUB_FILE: OUTBOX },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
