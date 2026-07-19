// @ts-check
import { defineConfig } from 'astro/config';
import { FontaineTransform } from 'fontaine';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// User-root GitHub Pages deploy (p2401kumar.github.io) — no `base` path.
export default defineConfig({
  site: 'https://p2401kumar.github.io',
  output: 'static',
  integrations: [
    // Excludes the /404 route so the sitemap covers exactly the real
    // pages (home + 2 case studies) — verify against the BUILT
    // dist/sitemap-0.xml, not just this config (03-RESEARCH.md Pitfall 2).
    sitemap({
      filter: (page) => !page.endsWith('/404/') && !page.endsWith('/404'),
    }),
  ],
  vite: {
    build: {
      // Phase 8 (GLS-01/GLS-02): explicit CSS browser targets. Vite 8
      // minifies CSS with lightningcss and passes it
      // `convertTargets(build.cssTarget)` — WITHOUT explicit targets it
      // collapses a `-webkit-backdrop-filter` + `backdrop-filter` pair to
      // a single property (last declaration wins), silently stripping
      // either the Safari-required prefix or the standard property from
      // the shipped CSS (08-RESEARCH.md Pitfall 6). With Safari-inclusive
      // targets it emits BOTH. Floor set: Safari/iOS 15.4 (needs the
      // -webkit- prefix until Safari 18), Firefox 115 ESR (standard
      // property only — the prefix alone would break it), Chrome/Edge 110.
      // NOTE: `css.lightningcss.targets` is NOT honored by the minify
      // pass (vite minifyCSS overrides it with cssTarget) — this is the
      // correct knob.
      cssTarget: ['chrome110', 'edge110', 'firefox115', 'safari15.4', 'ios15.4'],
    },
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
