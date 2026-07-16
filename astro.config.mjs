// @ts-check
import { defineConfig } from 'astro/config';
import { FontaineTransform } from 'fontaine';

// https://astro.build/config
// User-root GitHub Pages deploy (p2401kumar.github.io) — no `base` path.
export default defineConfig({
  site: 'https://p2401kumar.github.io',
  output: 'static',
  vite: {
    plugins: [
      // Generates metrics-matched fallback @font-face rules
      // (size-adjust/ascent-override/descent-override) for the two
      // self-hosted faces so the fallback -> custom-font swap does not
      // reflow the hero thesis (PLAT-04, no visible CLS).
      // Per-family fallback map (not the array shape) since this project
      // self-hosts two distinct families with two distinct locked
      // fallback stacks (01-RESEARCH.md Open Question 1).
      FontaineTransform.vite({
        fallbacks: {
          'Source Serif 4': ['Georgia'],
          'Cascadia Code': ['Consolas'],
        },
        resolvePath: (id) => new URL(`./public${id}`, import.meta.url),
      }),
    ],
  },
});
