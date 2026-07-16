// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// User-root GitHub Pages deploy (p2401kumar.github.io) — no `base` path.
// Fontaine (font fallback metrics) is wired in plan 01-02, not here.
export default defineConfig({
  site: 'https://p2401kumar.github.io',
  output: 'static',
});
