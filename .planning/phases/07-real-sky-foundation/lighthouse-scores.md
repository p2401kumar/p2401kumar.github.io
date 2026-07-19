# Phase 07-04 — Full Gate-Battery Re-Run + Local Lighthouse (blocking LCP checkpoint)

**Audit method:** `npx lighthouse` (v13.4.0) headless Chrome (`--chrome-flags="--headless=new"`),
against the LOCAL preview server (`npm run build && npm run preview` → `http://localhost:4321/`)
— NOT the deployed site (no push/deploy occurred this phase; the live site stays v2 until
Phase 10). Full v3 foundation active: **composited NOIRLab Milky-Way photo (LCP-preloaded
AVIF/WebP picture + LQIP) behind everything, transparent Layer 0 (moon bake + margin-confined
twinkle), constellations with resting halo, meteors, SKY-05 scrim, deck mode, CC BY 4.0
footer credit line** (default view preference, clean profile).
**Date:** 2026-07-19

## PASS/FAIL summary

| Check | Result |
|---|---|
| `npm run build` | PASS (4 pages; all 4 sky masters in dist/sky/) |
| `npx astro check` (0 errors) | PASS (0 errors / 0 warnings / 0 hints) |
| Zero hex literals outside tokens.css — plan trio (NightSky.astro, SiteFooter.astro, deck.css) via `#[0-9a-fA-F]{3,8}` | PASS (0) |
| Zero hex, boundary-aware wider sweep (`#[0-9a-fA-F]{3,8}\b`: src/lib/nightsky, src/lib/shared, src/lib/fig01, NightSky.astro, SiteFooter.astro, deck.css, src/data/constellations.ts) | PASS (0) |
| Single-rAF invariant: scene.ts `requestAnimationFrame` = 2 | PASS (2) |
| Single-rAF invariant: starfield.ts = 0 | PASS (0) |
| Single-rAF invariant: meteors.ts = 0 | PASS (0) |
| Fig. 01 non-regression: fig01/render.ts = 2 | PASS (2, untouched) |
| Zero deck/fig01 imports in scene modules (scene/starfield/constellations/meteors) | PASS (0 import statements; the only grep hits are doc comments stating the rule) |
| `verify-contrast.mjs --selftest` (incl. coverSourceRect fixtures) | PASS (exit 0) |
| Contrast (SKY-05, photo-aware) `--cdp` 1440×900 | PASS — global worst **12.22:1** vs --ink (hero 12.22 · systems 12.41 · experience 12.22 · patents 13.94 · skills 14.39 · contact 14.39; fig-01 n/a) — matches 07-03's recorded 12.22 |
| Contrast (SKY-05, photo-aware) `--cdp` 1280×800 | PASS — global worst **4.58:1** vs --ink (hero/patents/skills 4.58 · systems/experience/contact 6.96; fig-01 n/a) — matches 07-03's recorded 4.58; floor 4.5 |
| Moon dimness (IMG-05) `--moon` 1440×900 | PASS — moonPeak **0.1857** < mwPeak **0.4748** (identical to 07-03) |
| Moon dimness (IMG-05) `--moon` 1280×800 | PASS — moonPeak **0.2123** < mwPeak **0.4695** (identical to 07-03) |
| `verify-banding.mjs --selftest` | PASS (clean passes / banded control fails) |
| `verify-banding.mjs` committed masters (4 files × 2 regions) | PASS — every region runsAboveZero=1 zeroGaps=0 |
| Credit line (IMG-04) source + built HTML | PASS — byte-exact `Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0`; NOIRLab → noirlab.edu/public/images/noirlab2430b/, CC BY 4.0 → creativecommons.org/licenses/by/4.0/, both `target=_blank rel="noopener noreferrer"`; renders in deck (fixed footer) AND classic/no-JS modes |
| Deck-mode footer clearance | PASS — 2-line footer CDP-measured 131.5px; `.panel` bottom padding bumped 112→136px; deck chrome (index pill/hint/mode links) raised 24px to match |
| Leak gate: sky preload + scene/deck JS unreachable from /work/* and /404 | PASS — `/work/dynamodb-cellularization/`, `/work/elb-auto-weight-away/`, `/404` carry **zero** `<script src>` tags and **zero** `/sky/milky-way` references; preload + NightSky/Figure01/PanelDeck scripts exist ONLY in `/index.html` |
| Sitemap routes | PASS — exactly 3 (`/`, `/work/dynamodb-cellularization/`, `/work/elb-auto-weight-away/`) |
| package.json / package-lock.json / .planning/config.json | untouched (git diff clean); zero new dependencies; Lighthouse via npx per Phase 4/5/5.1 precedent |
| Lighthouse — Performance ≥ 90 (mobile + desktop) | **PASS — 99 / 100** |
| Lighthouse — Accessibility ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — Best Practices ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — SEO ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| **Blocking LCP checkpoint** (mobile LCP within 1.5–2.8 s) | **PASS — 1.9 s (1860 ms)**; desktop 0.5 s — see `lcp-checkpoint.md` |

## Lighthouse scores (photo + full overlay + credit line active)

| Run | Performance | Accessibility | Best Practices | SEO | TBT | LCP | CLS | FCP | SI |
|---|---|---|---|---|---|---|---|---|---|
| Mobile (default preset) | **99** | 100 | 100 | 100 | 0 ms | **1.9 s** | 0.003 | 1.4 s | 1.4 s |
| Desktop (`--preset=desktop`) | **100** | 100 | 100 | 100 | 0 ms | **0.5 s** | 0 | 0.4 s | 0.5 s |

Every category on both presets ≥ 90. Mobile Performance 99 vs 05.1's 98 — the full-viewport
real photo costs essentially nothing against the floor (56 KB AVIF transfer, preload-discovered,
zero render-blocking impact; TBT 0 ms both presets). CLS 0.003 mobile matches the pre-photo
baseline exactly (zero-CLS delivery held). Preload-LCP audit is clean: exactly one
`milky-way-1920.avif` fetch per run, zero runWarnings (no unused-preload flag). Note: the LCP
element is the hero text, not the photo — Chrome's LCP spec excludes full-viewport images as
presumed backgrounds; delivery contract still fully held (see `lcp-checkpoint.md` for the
honest breakdown).

Raw JSON: `lh-mobile.json` / `lh-desktop.json` (scratchpad — not committed; re-run to
reproduce with the commands above).

## Screenshot manifest (07-04 additions, `integration-evidence/`)

All captured via headless Chrome (CDP) against the local preview, full scene + credit line
active, AFTER the deck-chrome offset fix. DPR2 via `--force-device-scale-factor=2` CLI
(05.1's sanctioned alternative — CDP deviceScaleFactor 2 hangs in this environment).

| File | Viewport / DPR | Shows |
|---|---|---|
| `07-04-1440x900-dpr1.png` | 1440×900 / 1 | Reference tier full page: band core in the RIGHT margin, seam invisible, credit line + both links in fixed footer, deck chrome cleanly stacked (view classic → status → credit; hint → pill → clock) |
| `07-04-1280x800-dpr1.png` | 1280×800 / 1 | Binding contrast tier: column fully dimmed, band clear of content, credit line renders, no chrome collision |
| `07-04-1440x900-dpr2.png` | 1440×900 / 2 (2880×1800) | DPR2 — crisp render, no upscale artifacting, credit line legible |
| `07-04-1440x900-reduced-motion.png` | 1440×900 / 1, `--force-prefers-reduced-motion` | Static frame: photo + moon + constellations + camper + credit line present |
| `07-04-1440x900-nojs-classic-bottom.png` | 1440×900 / 1, scripts disabled, scrolled to bottom | No-JS classic mode page bottom: photo present, skills/contact sections flow normally, footer with credit line + links renders in document flow |

**No push, no deploy, no Pages trigger — all verification local.**
