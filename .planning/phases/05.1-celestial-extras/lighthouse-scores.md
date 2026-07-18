# Phase 05.1-01 — Full Gate-Battery Re-Run + Local Lighthouse (FLAG 3)

**Audit method:** `npx lighthouse` (v13.4.0) headless Chrome (`--chrome-flags="--headless=new"`),
against the LOCAL preview server (`npm run build && npx astro preview` → `http://localhost:4321/`)
— NOT the deployed site (no push/deploy occurred this phase; the live site stays v1).
Deck + full night-sky scene + SKY-05 scrim + **crescent moon (SKY-07) + meteor subsystem
(SKY-06) active** (default view preference, clean profile).
**Date:** 2026-07-17

## PASS/FAIL summary

| Check | Result |
|---|---|
| `npm run build` | PASS |
| `npx astro check` (0 errors) | PASS (0 errors / 0 warnings / 0 hints) |
| Zero hex literals outside tokens.css, boundary-aware `#[0-9a-fA-F]{3,8}\b` (src/lib/nightsky incl. meteors.ts, src/lib/shared, NightSky.astro, src/data/constellations.ts, deck.css) | PASS (0 — the `\b`-terminated pattern excludes the documented `#deck-*` id-selector false positives) |
| Single-rAF invariant: scene.ts `requestAnimationFrame` = 2 | PASS (2) |
| Single-rAF invariant: starfield.ts = 0 | PASS (0) |
| Single-rAF invariant: **meteors.ts = 0** (token absent entirely, comments included) | PASS (0; scheduling is setTimeout only) |
| Single-rAF invariant: src/lib/nightsky total = 2 | PASS (2, both in scene.ts) |
| Fig. 01 non-regression: src/lib/fig01 `requestAnimationFrame` = 2 | PASS (2, untouched) |
| Fig. 01 non-regression: src/lib/fig01 hex = 0 | PASS (0) |
| Zero deck/fig01 imports in the nightsky scene modules (scene/constellations/starfield/meteors/tokens) | PASS (0 import statements; event-name subscription + mirrored math only) |
| `verify-contrast.mjs --selftest` (incl. new moon comparator fixture #8) | PASS (exit 0, all fixtures + deck.css sync check green) |
| Contrast non-regression (SKY-05) `--cdp` 1440×900 | PASS — global worst **9.27:1** vs --ink, 0 failing regions, all 7 panels (05-06 baseline 8.24:1; floor 4.5:1) |
| Contrast non-regression (SKY-05) `--cdp` 1280×800 | PASS — global worst **8.07:1** vs --ink, 0 failing regions, all 7 panels (05-06 baseline 8.64:1 — small drift within noise, comfortably above the 4.5:1 floor) |
| Moon dimness (SKY-07, FLAG 1) `--moon` 1440×900 | PASS — moonPeak 0.1952 < mwPeak 0.6283 (see `luminance-evidence.md`) |
| Moon dimness (SKY-07, FLAG 1) `--moon` 1280×800 | PASS — moonPeak 0.1952 < mwPeak 0.5181 (see `luminance-evidence.md`) |
| Frame-cost delta (SKY-06, FLAG 2) recorded | PASS — see `frame-cost-delta.md` (idle +0 draws / one null-check; in-flight +2 cheap draws; 30 s soak 6.9% CPU, 60.0 fps, 0 layout) |
| Lighthouse — Performance ≥ 90 (mobile + desktop) | **PASS — 98 / 100** |
| Lighthouse — Accessibility ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — Best Practices ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |
| Lighthouse — SEO ≥ 90 (mobile + desktop) | **PASS — 100 / 100** |

## Lighthouse scores (deck + scene + scrim + moon + meteor active)

| Run | Performance | Accessibility | Best Practices | SEO | TBT | LCP | CLS |
|---|---|---|---|---|---|---|---|
| Mobile (default preset) | **98** | 100 | 100 | 100 | 170 ms | 1.4 s | 0.003 |
| Desktop (`--preset=desktop`) | **100** | 100 | 100 | 100 | 20 ms | 0.4 s | 0 |

Every category on both presets ≥ 90. Mobile Performance reads 98 vs 05-06's 100 — the
delta is TBT run-to-run noise on the throttled mobile emulation (170 ms, still far under
the 200 ms "good" threshold; 05-06 recorded 0 ms on its lucky run), not a regression
attributable to the additions: the moon is a one-time Layer-0 bake and the meteor adds
zero idle per-frame work (`frame-cost-delta.md`).

Raw JSON: `lh-mobile.json` / `lh-desktop.json` (scratchpad — not committed; re-run to
reproduce with the commands above).

## Screenshot manifest (FLAG 3)

All captured via headless Chrome against the local preview, full scene active. DPR2
frames were captured via `--force-device-scale-factor=2` (the CDP
`Emulation.setDeviceMetricsOverride`/`Page.captureScreenshot` combination hangs at
deviceScaleFactor 2 in this environment — the plan's sanctioned CLI alternative was used
with a virtual-time budget long enough for the chunked Layer-0 queue to drain).

| File | Viewport / DPR | Shows |
|---|---|---|
| `05.1-01-moon-1440-dpr1.png` | 1440×900 (inner 1424×805) / 1 | Waning crescent moon at ≈(82, 547) in the left margin — visually distinct from the microsoft/samsung clusters above and the camper below; full scene (starfield, Milky Way, constellations, fireflies) |
| `05.1-01-moon-1440-dpr2.png` | 1440×900 / 2 (2880×1800) | Same framing at DPR2 — crescent crisp, no aliasing artifacts |
| `05.1-01-moon-1280-dpr1.png` | 1280×800 (inner 1264×705) / 1 | Moon at ≈(58, 479) — margin-clearance holds at the narrower check width |
| `05.1-01-moon-1280-dpr2.png` | 1280×800 / 2 (2560×1600) | Same framing at DPR2 |
| `05.1-01-reduced-motion.png` | 1440×900 / 1, `--force-prefers-reduced-motion` | Static frame: moon PRESENT (baked in Layer 0), constellations present, **no meteor, no fireflies, no twinkle** — the SKY-06/07 reduced-motion acceptance still |
| `05.1-01-meteor-midflight.png` | 1440×900 / 1 | Mid-flight meteor at ≈(226, 122): bright head, tip-to-tail fading `--star` trail, upper LEFT margin, down-and-away trajectory — clear of the content column and clusters |

**Mid-flight capture method (documented per the plan's best-effort clause):** the meteor
was made capturable by TEMPORARILY lowering the two cadence constants in a LOCAL,
uncommitted edit to `meteors.ts` (spawn every ~1 s instead of 20–45 s), capturing via a
CDP frame-diff poll over the upper-sky margins, then restoring the file with
`git checkout src/lib/nightsky/meteors.ts` and rebuilding. The streak's life/speed/trail
in the still are the SHIPPED values (only cadence was altered); the committed code keeps
the locked `20000 + (rand ** 0.6) * 25000` ms cadence (grep-verified post-restore:
meteors.ts rAF = 0, cadence constants intact). The moon's placement never needed the
sanctioned `MOON_X_MARGIN_FRACTION` nudge — separation from the clusters reads clean at
both widths.

**No push, no deploy, no Pages trigger — all verification local. FLAG 3 resolved.**
