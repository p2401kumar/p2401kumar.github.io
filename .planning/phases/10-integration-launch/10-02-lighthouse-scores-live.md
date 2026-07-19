# 10-02 — LIVE Lighthouse (FLR-01 authoritative evidence)

**Audit method:** `npx lighthouse` (v13.4.0) headless Chrome (`--chrome-flags="--headless=new"`),
run against the **LIVE origin** `https://p2401kumar.github.io/` — post-deploy (Actions run
`29708118111`, build + deploy both `success`, pushed HEAD `0dbe46f`). These scores are the
authoritative FLR-01 gate numbers and REPLACE 10-01's local pre-flight (battery rows 17–18:
mobile 99/100/100/100, desktop 100×4). v3.0 Real Sky composite fully active: NOIRLab photo
`<picture>` + preload, frosted-glass chrome, living ambient (clouds/aurora/scintillation/moon),
deck + Fig. 01 (default view preference, clean profile).
**Date:** 2026-07-19 (mobile fetched 23:39:34Z, desktop 23:40:17Z)

## PASS/FAIL summary

| Check | Result |
|---|---|
| Lighthouse — Performance ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — Accessibility ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — Best Practices ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — SEO ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |

## Lighthouse scores (LIVE origin, full v3.0 real-sky composite active)

| Run | Performance | Accessibility | Best Practices | SEO | TBT | LCP | CLS | FCP |
|---|---|---|---|---|---|---|---|---|
| Mobile (default preset) | **100** | 100 | 100 | 100 | 0 ms | 1.5 s | 0.003 | 1.0 s |
| Desktop (`--preset=desktop`) | **100** | 100 | 100 | 100 | 0 ms | 0.4 s | 0 | 0.3 s |

Every category on both presets ≥ 90 → **FLR-01 COMPLETE**. A perfect **100×8** — live mobile
performance actually EXCEEDS the local pre-flight (99 → 100; local LCP 1.9 s → 1.5 s over the
live CDN, TBT 0 ms both). Desktop identical to the local run (100×4, LCP 0.5 s → 0.4 s live).
Reference families: 10-01 local (mobile 99/100/100/100, LCP 1.9 s, TBT 0 ms, CLS 0.003;
desktop 100×4, LCP 0.5 s) and the v2.0 live launch (06-02: mobile 98, LCP 1.3 s, TBT 180 ms —
v3's real-photo composite ships with LESS blocking time than v2's procedural sky).

Raw JSON: `lh-live-mobile.json` / `lh-live-desktop.json` (scratchpad — not committed;
re-run with the commands above to reproduce against the live origin).

## Live smoke + view-source (same session, live origin)

| Check | Result |
|---|---|
| View-source: `body class="has-sky"` | PASS |
| View-source: `id="deck-live"` present | PASS |
| View-source: `class="panel"` count = 7, `data-panel-id` count = 7 | PASS |
| View-source: sky `<picture>` + `/sky/milky-way-1920.avif` preload (`imagesrcset`) | PASS |
| View-source: `.nightsky-host` + `id="nightsky-canvas"` markup present | PASS |
| Deck sentinel `nightsky:panel-change` resolves in referenced `/_astro/*.js` chunk | PASS (NightSky chunk `k0pUprmR`) |
| Credit line verbatim: `Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0` | PASS |
| Credit link `https://noirlab.edu/public/images/noirlab2430b/` | 200 |
| Credit link `https://creativecommons.org/licenses/by/4.0/` | 200 |
| `GET /` | 200 — byte-identical to the 10-01-verified local `dist/index.html` |
| `GET /work/dynamodb-cellularization/` | 200 — byte-identical to local dist; scene-free in-browser (no `#nightsky-canvas`, no `has-sky` body) |
| `GET /work/elb-auto-weight-away/` | 200 — byte-identical to local dist; scene-free in-browser |
| `GET /this-path-does-not-exist` | 404 (custom 404 page, `<title>404 — Prateek Kumar</title>`, body renders) |
| Live CDP: `/` scene ALIVE at hero (canvas hash differs across ~1.6 s pair) | PASS |
| Live CDP: `/` glass rendering (`backdrop-filter: blur(12px) saturate(1.5) brightness(0.9)` on panel) | PASS |
| Live CDP: cold `/#fig-01` — fig-01 panel `data-state="active"`, figure canvas 878×380 painted | PASS |
| Live CDP: cold `/#fig-01` — ambient FROZEN (nightsky canvas hash identical across ~1.6 s pair: `165590:1409298720` ×2) | PASS |
| Live CDP: cold `/#work` — alias → systems active, hash preserved as `#work`, 6 other panels inert | PASS |
| Live OG: `/og/og-default.png` = 309,377 B, sha256 `c4f5a921…` — byte-identical to the 10-01 refreshed 1200×630 capture | PASS |

**Live smoke: 13/13 PASS.** (First harness pass read the active panel via a stale `.is-active`
selector — instrument-only; corrected to the real `data-state="active"` marker and both
hash-route probes pass. Same class of harness fix as 10-01's recorded deviations.)
