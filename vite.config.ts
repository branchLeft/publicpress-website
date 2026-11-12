import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    // Fonts and the headshot are served as hashed files, never inlined as
    // `data:` URIs: the policy admits `data:` for images only (the favicon
    // fallback), and not at all for fonts.
    assetsInlineLimit: 0,
  },
});
