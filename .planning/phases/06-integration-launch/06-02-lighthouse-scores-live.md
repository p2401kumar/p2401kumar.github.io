# 06-02 — LIVE Lighthouse (INTG-04 authoritative evidence)

**Audit method:** `npx lighthouse` (v13.4.0) headless Chrome (`--chrome-flags="--headless=new"`),
run against the **LIVE origin** `https://p2401kumar.github.io/` — post-deploy (Actions run
`29637043211`, build + deploy both `success`, pushed HEAD `793c370`). These scores are the
authoritative INTG-04 gate numbers and REPLACE 06-01's local pre-flight
(`06-01-lighthouse-scores-local.md`), which was recorded against the local preview only.
Deck + full night-sky scene + scrim + moon + meteor active (default view preference, clean profile).
**Date:** 2026-07-18

## PASS/FAIL summary

| Check | Result |
|---|---|
| Lighthouse — Performance ≥ 90 (mobile + desktop) | **PASS — 98 / 100** |
| Lighthouse — Accessibility ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — Best Practices ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — SEO ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |

## Lighthouse scores (LIVE origin, deck + scene + scrim + moon + meteor active)

| Run | Performance | Accessibility | Best Practices | SEO | TBT | LCP | CLS | FCP |
|---|---|---|---|---|---|---|---|---|
| Mobile (default preset) | **98** | 100 | 100 | 100 | 180 ms | 1.3 s | 0.003 | 1.0 s |
| Desktop (`--preset=desktop`) | **100** | 100 | 100 | 100 | 10 ms | 0.4 s | 0 | 0.3 s |

Every category on both presets ≥ 90 → **INTG-04 COMPLETE**. Live mobile 98 matches the
same-day local post-fix run (98/100/100/100, TBT 170 ms) — the two pre-launch fixes
(`185be56`, `c9c6148`) cost nothing; LCP actually improved 1.4 s → 1.3 s over the live CDN.
Desktop is a clean 100×4, identical to every local baseline since 05.1.

Raw JSON: `lh-live-mobile.json` / `lh-live-desktop.json` (scratchpad — not committed;
re-run with the commands above to reproduce against the live origin).

## Live smoke + view-source (same session, live origin)

| Check | Result |
|---|---|
| View-source: `id="deck-live"` present | PASS |
| View-source: `class="panel"` count = 7, `data-panel-id` count = 7 | PASS |
| View-source: `#nightsky-canvas` + `.nightsky-host` markup present | PASS |
| Deck sentinel `nightsky:panel-change` resolves in referenced `/_astro/*.js` chunks | PASS (NightSky + PanelDeck chunks) |
| `GET /` | 200 |
| `GET /work/dynamodb-cellularization/` | 200 (`<title>dynamodb/cellularization</title>`, crosslink `/#work` present) |
| `GET /work/elb-auto-weight-away/` | 200 (`<title>elb/auto-weight-away</title>`, crosslink `/#work` present) |
| `GET /this-path-does-not-exist` | 404 (custom 404 page served by GH Pages) |
| Sitemap `<loc>` = exactly 3 real routes | PASS |
| Headless live cold-load fix re-proof (`/#work` → systems, `/#fig-01` paused, hero animates, classic unchanged) | **11/11 PASS** |
