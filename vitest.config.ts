import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    // Playwright specs live in tests/ and run via `pnpm test:e2e`, not Vitest.
    // Nested worktree checkouts are excluded for the same reason as in the
    // sibling repos: each is its own checkout with its own tests/ dir.
    exclude: [...configDefaults.exclude, 'tests/**', '.worktrees/**', '.claude/worktrees/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,tsx}'],
      // What runs in the browser (effects, history, scroll) is covered end to end by the
      // Playwright suite; these tests cover the server-side logic and the server-rendered HTML.
      exclude: ['app/**/*.test.{ts,tsx}', 'app/testing/**'],
      // Floors, not targets: they stop coverage silently regressing toward zero.
      thresholds: {
        statements: 62,
        branches: 50,
        functions: 58,
        lines: 65,
      },
    },
  },
});
