# 06-01 — Full Local Regression Battery + Local Lighthouse (INTG-04 pre-flight)

**Audit method:** `npx lighthouse` (v13.4.0) headless Chrome (`--chrome-flags="--headless=new"`),
against the LOCAL preview server (`npm run build && npx astro preview` → `http://localhost:4321/`)
— NOT the deployed site (no push/deploy this plan; the live site stays v1 until the 06-02 gate).
Deck + full night-sky scene + scrim + moon + meteor active (default view preference, clean profile).
**Date:** 2026-07-18

The authoritative INTG-04 gate is the LIVE Lighthouse run in 06-02 (post-deploy). This is the
local pre-flight so the go/no-go is anticlimactic.

## PASS/FAIL summary

| Check | Result |
|---|---|
| `npm run build` | PASS (exit 0, 4 pages) |
| `npx astro check` | PASS (0 errors / 0 warnings / 0 hints) |
| Zero hex literals outside tokens.css, boundary-aware `#[0-9a-fA-F]{3,8}\b` (src/lib/nightsky incl. meteors.ts, src/lib/fig01, src/lib/shared, NightSky.astro, src/data/constellations.ts, deck.css) | PASS (0 — the `\b`-terminated pattern excludes the documented `#dec`/`#deck-*` id-selector false positives at deck.ts lines 12–14/442, per the 05.1 precedent) |
| Single-rAF invariant: fig01/render.ts `requestAnimationFrame` = 2 | PASS (2) |
| Single-rAF invariant: nightsky/scene.ts = 2 | PASS (2) |
| Single-rAF invariant: nightsky/starfield.ts = 0 | PASS (0) |
| Single-rAF invariant: nightsky/meteors.ts = 0 | PASS (0) |
| Single-rAF invariant: src/lib/nightsky total = 2 (both in scene.ts) | PASS (2) |
| Single-rAF invariant: src/lib/fig01 total = 2 (both in render.ts) | PASS (2) |
| Zero deck/fig01 imports in the nightsky scene modules (scene/constellations/starfield/meteors) | PASS (0 import statements; event-name subscription + mirrored math only) |
| Lighthouse — Performance ≥ 90 (mobile + desktop) | **PASS — 96 / 100** |
| Lighthouse — Accessibility ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — Best Practices ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — SEO ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |

## Lighthouse scores (deck + scene + scrim + moon + meteor active, local preview)

| Run | Performance | Accessibility | Best Practices | SEO | TBT | LCP | CLS |
|---|---|---|---|---|---|---|---|
| Mobile (default preset) | **96** | 100 | 100 | 100 | 230 ms | 1.4 s | 0.003 |
| Desktop (`--preset=desktop`) | **100** | 100 | 100 | 100 | 30 ms | 0.4 s | 0 |

Every category on both presets ≥ 90. Mobile Performance reads 96 vs 05.1's 98 / 05-06's 100 —
the delta is TBT run-to-run noise on the throttled mobile emulation (230 ms this run vs
170 ms in 05.1; the responsible audit is `total-blocking-time` alone — LCP 1.4 s and CLS 0.003
are byte-identical to the 05.1 baseline, and no code changed since that run: this plan is
verification-only). Desktop is a clean 100×4, unchanged. Recorded honestly per plan: a local
sub-90 would be a flag; 96 is comfortably above the floor.

Raw JSON: `lh-mobile.json` / `lh-desktop.json` (scratchpad — not committed; re-run to
reproduce with the commands above).

## Contrast + moon non-regression (re-run this plan, Task 1 — recorded here for the battery)

| Check | Result |
|---|---|
| `verify-contrast.mjs --selftest` | PASS (exit 0, all fixtures + deck.css sync check green) |
| Contrast `--cdp` 1440×900 | PASS — global worst **7.89:1** vs --ink, 0 failing regions, all 7 panels (05.1 baseline 9.27 — sampling noise, floor 4.5) |
| Contrast `--cdp` 1280×800 | PASS — global worst **8.39:1** vs --ink, 0 failing regions, all 7 panels (05.1 baseline 8.07) |
| Moon dimness `--moon` 1440×900 | PASS — moonPeak 0.1949 < mwPeak 0.4496 |
| Moon dimness `--moon` 1280×800 | PASS — moonPeak 0.1949 < mwPeak 0.4464 |

## Sign-off screenshot manifest

All captured via headless Chrome (CDP `Page.captureScreenshot`) against the local preview,
full scene active, 1440×900 DPR 1.

| File | Shows |
|---|---|
| `06-01-scene-hero.png` | Hero panel over the full scene: thesis serif, constellations, Milky Way, crescent moon (left margin), camper glow, deck chrome 01/07 |
| `06-01-scene-experience.png` | Experience panel (04/07): Microsoft cluster constellation brightened top-left, text legible over the scene |
| `06-01-scene-moon-crop.png` | 180×180 crop centered on the crescent moon region (~(82, 612 area)) — waning crescent, dimmer than the Milky Way core |
| `06-01-scene-reduced-motion.png` | `--force-prefers-reduced-motion` static frame: moon + constellations present, no fireflies/twinkle/meteor |
| `06-01-fig01-coldload.png` (Task 2) | Cold `/#fig-01` — canvas painted, panel active |
| `06-01-fig01-degraded.png` (Task 2) | Post-fault degraded state — amber dashed cell, narration, tooltip fact |
| `06-01-fig01-resize-activate.png` (Task 2) | Post-resize (800×700) + activate — re-measured figure |

**No push, no deploy, no Pages trigger — all verification local. `.planning/config.json` untouched.**
