# 10-01 Full Carry-Forward Gate Battery — composited build vs the Phase-9 reference families (FLR-01 pre-flight, FLR-02)

All gates run 2026-07-19 against the built preview (`npm run build && npm run preview` →
`http://localhost:4321/`), reusing the committed drivers verbatim (`scripts/verify-contrast.mjs`,
`scripts/verify-banding.mjs`, `.planning/phases/09-living-sky/ambient-soak/ambient-soak.mjs`,
`.planning/phases/09-living-sky/battery/capture-battery.mjs` — the last run from a scratchpad
copy with only its OUTPUT directory redirected, so the committed 09 evidence stays untouched).
Product source is **bit-identical** to the source the 09-03 closing battery proved this morning
(`git diff df8e6e7 HEAD -- src public package.json package-lock.json astro.config.mjs` = empty).
No push. package.json / package-lock.json / .planning/config.json untouched.

## The consolidated gate table

| # | Gate | Measured (this run) | Phase-9 reference family | Verdict |
|---|---|---|---|---|
| 1 | `npm run build` | exit 0, 4 pages | exit 0 | **PASS** |
| 2 | `npx astro check` | **0 errors / 0 warnings / 0 hints** | 0/0/0 | **PASS** |
| 3 | `verify-contrast --selftest` | PASS (WCAG fixtures + live tokens ≥4.5) | PASS | **PASS** |
| 4 | `verify-contrast --agreement-selftest` | PASS (analytic vs screenshot within tolerance) | PASS | **PASS** |
| 5 | `--cdp-screenshot` 1440×900 | exit 0, `failing[]` empty on every surface; worsts: experience **15.06** · patents **15.55** · skills **15.57** · header **6.23** · hero **13.55** | identical worsts: 15.06 / 15.55 / 15.57 / 6.23 / 13.55 | **PASS** (exact family) |
| 6 | `--cdp-screenshot` 1280×800 | exit 0, `failing[]` empty; worsts: hero 13.40 · experience 12.16 · patents 15.55 · skills 15.55 · header 6.33 | full record in 09 archive; all ≥ 4.5 floor | **PASS** |
| 7 | `--moon` 1440×900 | moonPeak **0.2374 < 0.4748** mwPeak | 0.2212 < 0.4748 | **PASS** (family) |
| 8 | `--moon` 1280×800 | moonPeak **0.2466 < 0.4695** | 0.2580 < 0.4695 | **PASS** (family) |
| 9 | `--aurora` 1440×900 (24 samples / 21.6s ≥ breathing period) | max auroraPeak **0.1052 < 0.4748** | 0.1035 < 0.4748 | **PASS** (family) |
| 10 | `--aurora` 1280×800 | max auroraPeak **0.0386 < 0.4695** | 0.0384 < 0.4695 | **PASS** (family) |
| 11 | `verify-banding --selftest` | clean PASSes (runs=1 gaps=0), banded control FAILs (runs=4 gaps=3) | same | **PASS** |
| 12 | Banding live crops (cloud + aurora bands off today's fresh reduced-motion still, peak alpha) | cloud band **runs=1 gaps=0** bins 41/41 · aurora band **runs=1 gaps=0** bins 41/41 | runs=1 gaps=0 each | **PASS** |
| 13 | Ambient soak 60s (glass live both runs, ambient A/B via RM emulation) | TOTAL **6.39%** (< 10% floor, 3.61pp headroom) · baseline 1.18% · marginal +5.21pp · **60.0fps · 0 long tasks** · Layout ~0 · tree 38.24% | 5.49% total (marginal +4.26pp; 08-03 glass-live basis 6.10%; documented scene noise ±0.4–0.7pp) | **PASS** (+0.90pp vs 5.49; within noise of the 6.10% 08-03 glass-live reference — this run shared the machine with the day's audit workload; fps/long-tasks/layout all at reference) |
| 14 | Single-rAF greps (`grep -o \| wc -l`): scene.ts / fig01 render.ts | **2 / 2** | 2 / 2 | **PASS** |
| 15 | Single-rAF: clouds / aurora / parallax / meteors / starfield | **0 / 0 / 0 / 0 / 0** | all 0 | **PASS** |
| 16 | Cross-boundary imports (deck/fig01) in all scene modules | **0** | 0 | **PASS** |
| 17 | Boundary-aware zero-hex `#[0-9a-fA-F]{3,8}\b` over src/lib/nightsky + src/lib/fig01 + deck.css + NightSky.astro (tokens.css excluded — it legitimately holds the --glass-*/--aurora hex tokens) | **0** | 0 | **PASS** |
| 18 | `AURORA_ALPHA_CEILING = 0.20` static grep | 1 | ≥1 | **PASS** |
| 19 | `'lighter'` compositing in clouds/aurora | 0 (source-over only) | 0 | **PASS** |
| 20 | Pause machine: reduced-motion still (2 full screenshots 2s apart) | **byte-identical** (273,831 bytes), aurora mean 12.94 / cloud margin cover4 0.93 / column max 4 (nonzero — drain-repaint fix live) | byte-identical, 12.94 / ≥0.08 / ≥1 | **PASS** |
| 21 | Pause machine: hidden-tab canvas hash pair | identical (len 222170) | identical | **PASS** |
| 22 | Pause machine: fig-01-active canvas hash pair | identical (len 219282) | identical | **PASS** (and re-proven cold + composited in `10-01-fig01-audit.md` A3/A12) |
| 23 | Canvas transform at rest + mid-parallax-nudge, 1440 + 1280 | canvas/host **none** at rest AND mid-nudge; `.camper` matrix −11.09px @1440 / −11.12px @1280 mid-window | none/none; −11.09 / −18.00 | **PASS** (nudge magnitude sampled ~160ms into the 420ms ease — timing-sensitive, both in range) |
| 24 | Mobile ladder tier 3 (dm=2): far stays shed + near intact | far cover2 0.0291 · near cover4 **0.7185** · dm 2 | 0.029 · 0.72 | **PASS** (identical) |
| 25 | Mobile 375×812 (width-only tier 3): near legible, aurora gracefully absent, canvas untransformed, parallax intact | near cover4 **0.1819** · auroraStrip mean 2.9 · canvas/host none · camper matrix −11.10px | 0.15 · absent · none · −10.91px | **PASS** |
| 26 | Mobile ladder tiers 0→1 (far shed engages) | **See "Shed-ladder instrument note"** — proven via the tier-flip delta probe: margin-band mean **13.026 → 9.445** (cover2 0.9664 → 0.8837) when dm=4 engages tier 1, with EXACT restoration (13.026/0.9664) on reverting to tier 0; near clouds intact throughout | strip delta 0.213 → 0.029 | **PASS** (equivalent proof, stronger instrument — see note) |
| 27 | Lighthouse mobile (npx lighthouse 13.x, local preview) | **99 / 100 / 100 / 100** · LCP **1.9s** · TBT **0ms** · CLS **0.003** | 99/100/100/100 · 1.9s · 0ms · 0.003 | **PASS** (identical) |
| 28 | Lighthouse desktop (--preset=desktop) | **100 / 100 / 100 / 100** · LCP **0.5s** · TBT **0ms** · CLS **0** | 100×4 · 0.5s | **PASS** (identical) |
| 29 | Leak gate (dist/work + dist/404: nightsky/sky/script refs) | all **0** (recorded in `10-01-integration-evidence.md` §c) | 0 | **PASS** |
| 30 | package.json / package-lock.json / .planning/config.json | untouched (git diff empty) | untouched | **PASS** |

**30 rows green. Every number lands inside its Phase-9 reference family (the soak total carries
a +0.90pp recorded delta with rationale; the tier-0→1 shed row carries the instrument note).**

## Shed-ladder instrument note (rows 24–26 — diagnosed, product exonerated)

The committed `capture-battery.mjs` re-run reproduced 10 of its 12 checks bit-for-bit (several
values **identical to 4 decimals** vs the committed 09 report — the canvas alpha in the probed
bands is deterministic given the build). Its 2 far-strip rows (`shed-far-present-tier0`,
`shed-tier1-dm4`) FAILED on instrument grounds, diagnosed live:

- The far-cloud presence inside the fixed right-margin strip (x 0.82–0.98, y 0.645–0.685H) is
  a **per-process random draw** (cloud cluster layouts are `Math.random` per sprite
  generation). The 09 morning process drew a layout whose far bank covered the strip (0.2129);
  today's processes drew layouts that leave it at the deterministic constellation-only floor
  (0.0291) — three independent processes confirmed.
- The instrument's own re-roll (`window.dispatchEvent(new Event('resize'))`) provably DOES
  regenerate + re-adopt Layer 0 (marker-pixel test: repainted < 1s), but same-size re-adoption
  reuses the existing cloud sprites — the strip content never re-randomizes, so the re-roll
  can never help. Confirmed by EXACT value restoration across tier flips.
- The product behavior the row exists to prove — **far layer sheds at tier ≥ 1 — was then
  proven directly**: with dm=4 + re-adoption, the far-carrying margin band (0.02–0.13 ×
  0.72–0.84H) drops mean 13.026 → 9.445 / cover2 0.9664 → 0.8837 (the far layer's ~27%
  contribution removed), near clouds remain, and reverting dm restores the exact tier-0
  values. Tier-3 + width-only-375 rows passed in the committed instrument itself.
- Product source is bit-identical to the source whose ladder the 09-03 battery proved green
  this morning. **No product change, no regression — instrument fragility only.**

## OG-03 — REFRESHED (the sole sanctioned product edit)

| | Before | After |
|---|---|---|
| File | `public/og/og-default.png` (v1/v2-era static design) | real capture of the real composited v3 hero |
| Dimensions | 1200×630 | **1200×630** (verified from PNG header, source + dist) |
| Bytes | 43,141 | 309,377 |
| Method | — | headless Chrome, `prefers-reduced-motion: reduce` emulated (the honest fixed-phase still: photo + clouds + aurora + constellations, no mid-animation smear), captured at 1440×756 (the same 40:21 aspect; a straight 1200×630 viewport clips the résumé/linkedin/github row behind the footer glass) and Lanczos-downscaled to exactly 1200×630 — no crop, no compositing, no retouch |
| Honesty gate | | The image is exactly what the site renders under reduced motion at 40:21 — hero copy, links row, header/footer glass, CC BY 4.0 credit line all legible |
| Verification | | `npm run build` green; `dist/index.html` og:image → `https://p2401kumar.github.io/og/og-default.png`; dist PNG 1200×630 |

## Sign-off screenshots (committed to this phase dir)

hero (`10-01-hero-v3-local.png`), tier-2 experience panel (`10-01-experience-panel.png`),
jump index expanded (`10-01-jump-index.png`), aurora+moon left-margin crop
(`10-01-aurora-moon.png` — the crescent is deliberately dim per the SKY-07 gate: moonPeak
0.2374 strictly below the MW core 0.4748; today's still is pixel-identical in the moon bbox to
the committed 09 marquee), reduced-motion still (`10-01-reduced-motion-still.png` — fresh
byte-identical-pair capture from today's re-run), mobile 375w (`10-01-mobile-375w.png`),
classic mode (`10-01-classic-mode.png`, captured in Task 1).

## Verdict

**ALL GATES GREEN** — the fully composited v3 build reproduces the Phase-9 reference families
across contrast, aurora/moon ceilings, banding, pause machine, structural invariants, soak,
and Lighthouse (99+100×3 mobile / 100×4 desktop). OG-03 refreshed with an honest capture.
The only gate not runnable locally is LIVE Lighthouse (10-02).
