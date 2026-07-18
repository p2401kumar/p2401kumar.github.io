# Phase 05-06 — Automated Acceptance Gate + Local Lighthouse

**Audit method:** `npx lighthouse` (v13.4.0) headless Chrome (`--chrome-flags="--headless=new"`),
against the LOCAL preview server (`npm run build && npm run preview` → `http://localhost:4321/`)
— NOT the deployed site (no push/deploy occurred this phase). Deck + full night-sky scene +
SKY-05 scrim active (default view preference, clean profile).
**Date:** 2026-07-17

## PASS/FAIL summary

| Check | Result |
|---|---|
| `npm run build` | PASS |
| `npx astro check` (0 errors) | PASS (0 errors / 0 warnings / 0 hints) |
| Zero hex literals outside tokens.css (scene + touched source: src/lib/nightsky, src/lib/shared, NightSky.astro, src/data/constellations.ts, deck.css) | PASS — 0 real; raw grep count 9, all the documented `#dec` substring false positives from `#deck-*` CSS id selectors in deck.ts (same category as 04-01/04-02/04-03 summaries) |
| Fig. 01 non-regression: src/lib/fig01 hex = 0 | PASS (0) |
| Fig. 01 non-regression: src/lib/fig01 `requestAnimationFrame` = 2 | PASS (2, untouched) |
| Nightsky single-rAF: scene.ts `requestAnimationFrame` = 2 | PASS (2) |
| Nightsky single-rAF: starfield.ts `requestAnimationFrame` = 0 (and 0 in every non-scene module) | PASS (0; nightsky total = 2, both in scene.ts) |
| Zero deck/fig01 imports in nightsky modules (event-name subscription only) | PASS (0 import statements; only doc-comment mentions) |
| Scene JS unreachable from /work/*: `nightsky:panel-change` sentinel absent from dist/work | PASS (0 files) |
| Sentinel present in dist/_astro | PASS (2 files) |
| /work leak loop (every /work HTML → every referenced /_astro JS chunk clean) | PASS (loop prints OK) |
| `src/pages/work/[slug].astro` does not import NightSky | PASS (0 matches) |
| Contrast (SKY-05) worst-case evidence recorded | PASS — see `contrast-evidence.md` (global worst 8.24:1 vs --ink, floor 4.5; both viewports, all 7 panels, zero failing regions) |
| Frame-cost audit (SKY-03) recorded | PASS — see `frame-cost-audit.md` (≤~120 bounded draws/frame; live 60 s soak 5.6% CPU, 0 long tasks, 60 fps) |
| Lighthouse — Performance ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — Accessibility ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — Best Practices ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — SEO ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |

## Lighthouse scores (deck + scene + scrim active)

| Run | Performance | Accessibility | Best Practices | SEO | TBT | LCP | CLS |
|---|---|---|---|---|---|---|---|
| Mobile (default preset) | **100** | 100 | 100 | 100 | 0 ms | 1.4 s | 0.003 |
| Desktop (`--preset=desktop`) | **100** | 100 | 100 | 100 | 0 ms | 0.4 s | 0 |

Every category on both presets ≥ 90 (all at 100); no regression vs the Phase-4 baseline
(100/95/100/100) — Accessibility actually improved 95 → 100 with the scene + scrim active
(the previously flagged `color-contrast` sub-audit now passes on the audited page under
Lighthouse 13.4.0).

## Console-error fix caught by the first mobile run

The first mobile pass scored Best Practices 96 via `errors-in-console`: a real
`TypeError: Cannot read properties of undefined (reading 'r')` in the scene engine on
narrow (mobile-emulated) viewports — the new SKY-05 column governor excludes capped
in-column stars from twinkle metadata, and on a 412 px viewport the column spans the whole
width, leaving ZERO twinkle-eligible stars; `seedTwinkles` then indexed `twinkleStars[-1]`
and pushed an undefined-colored twinkle that crashed `rgba()` inside the rAF tick.
Fixed (empty pool → empty subset guard in `scene.ts seedTwinkles`); mobile re-run is the
100/100/100/100 recorded above with `errors-in-console` score 1 and zero items.

Raw JSON: `lh-mobile2.json` / `lh-desktop2.json` (scratchpad — not committed; re-run to
reproduce with the commands above). Superseded first-pass runs: `lh-mobile.json`
(BP 96, pre-fix) / `lh-desktop.json`.
