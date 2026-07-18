# SKY-05 Worst-Case Contrast Evidence (Plan 05-06, Task 1)

**Method:** `scripts/verify-contrast.mjs` — zero-dependency WCAG 2.2 SC 1.4.3 verifier.
`--selftest` (node) proves the formulas against fixtures (black/white = 21:1 exact, the
canonical #767676/#fff = 4.54:1, worst-pixel scanner locates the brightest sample, --ink
over --bg = 15.70:1 from live tokens.css, and a deck.css sync check that the analytic
scrim stops match the shipped gradient). `--cdp` (node 22 built-in WebSocket + headless
Chrome DevTools Protocol — still zero deps) then drives the LOCAL preview
(`http://localhost:4321/`, production build), walks all 7 deck panels via hash
navigation, and for every visible text element on the active panel reads the live scene
canvas (`getImageData`) under the element's **per-line text rects** (Range.getClientRects
— the true glyph runs, not block bounding boxes), **12 samples over a ~4.2 s window per
panel** so twinkle peaks and beam passes are caught. Every canvas pixel is composited
under the scrim's analytic alpha at that pixel's viewport-y plus any semi-transparent DOM
backgrounds, then scanned for the WORST (lowest) ratio — worst-case pixels, never
averages.

**Selftest:** `node scripts/verify-contrast.mjs --selftest` → `SELFTEST PASS` (exit 0).

**Date:** 2026-07-17 · **Runs:** nominal 1440×900 (actual innerViewport 1424×805 — new
headless window-size includes browser chrome) and nominal 1280×800 (actual 1264×705, a
deliberately hostile size: panels overflow, so text reaches the low-scrim bottom taper).

## Verdict

**PASS — every over-sky text region on every panel at both viewports is ≥ 4.5:1 vs
--ink (≥ 3:1 large); zero failing regions.** Global worst across both runs: **8.24:1**
(small-text threshold 4.5:1) — a 1.8× margin over the floor.

## Worst-case ratios per panel (vs --ink luminance, post-scrim)

| Panel | Run 1440 worst | Run 1280 worst | Worst region (1440) | Worst pixel raw / scrim α |
|---|---|---|---|---|
| hero | **9.95** | 10.31 | `a` "résumé →" | [73,78,90] @ 0.38 |
| fig-01 | n/a | n/a | all 12 text regions sit over opaque DOM backgrounds (Fig. 01 card) — not over sky | — |
| systems | **9.74** | 9.44 | `span` "90% ops automated" (AWS constellation brightened) | [77,80,90] @ 0.38 |
| experience | **8.24** | 8.64 | `li` "Built multi-client RTSP…" (Microsoft brightened) | [77,82,98] @ 0.23 |
| patents | **10.12** | 10.14 | `span` "~30% faster dead-code…" (Education & Patents brightened) | [73,76,85] @ 0.38 |
| skills | **10.43** | 10.35 | `p` "Tools I reach for…" (Samsung brightened) | [66,69,77] @ 0.33 |
| contact | **15.84** | 10.51 | `a` "linkedin →" | [13,16,24] @ 0.34 |

All thresholds: 4.5:1 normal text / 3:1 large (≥24px, or ≥18.66px bold). The hero `h1`
(large) measured 10.1–10.3:1 vs its 3:1 threshold.

## The plan's three named worst-case probes

1. **Milky Way taper under text** — the band's inner dust/haze crossing the column is now
   governed (see below); worst in-column MW-tinted pixels under real text lines measured
   raw ≈ [87,93,105] (experience li at 1280, vsInk 8.64) — the brightest sky surface any
   text sits over, PASS with ~1.9× margin.
2. **A Bright-band star under text** — baked stars inside the column are alpha-capped at
   0.25 (governor); the brightest star-core pixels under glyph runs measured raw ≈
   [71–77, 74–82, 83–98] → all ≥ 8.2:1 vs --ink, PASS.
3. **Brightened constellation glow under text** — each mapped panel was sampled WITH its
   constellation brightened (panel navigation drives the real `nightsky:panel-change`
   event; systems = AWS at full 1.0 star alpha + halo). Cluster geometry is margin-remapped
   (see below), so no brightened star/halo/beam pixel can render under column text; the
   sampled worst on those panels (8.24–10.43) confirms it, PASS.

## Sky-brightness governor (what made worst-case PASS honest, not lucky)

The first measurement run (pre-governor, UI-SPEC scrim exactly as sketched) FAILED:
worst ratios 1.84–2.33 vs --ink — saturated `'lighter'`-accumulated Milky Way dust (raw
up to #ffffff) and near-full-alpha Bright-band stars directly under real text lines, plus
(at the 1264×705 stress size) 0.9-alpha copper firefly cores under overflowed text in the
scrim's bottom taper. No scrim inside the locked ≤0.38/≤40% ceiling can fix a #ffffff
backdrop (would need ≥0.58 opacity). Per the recorded shortfall the scene was fixed at
the source — restoring 05-UI-SPEC.md's own placement rules ("the band's bright core sits
entirely outside the column", "no cluster's bounding box may extend into the content-safe
column", "content sits over the DARKER sky regions by design"):

- `starfield.ts` — column governor: Milky Way dust/haze alpha ×0.12 inside the
  880px-centered column (+24px cushion, 80px smoothstep ramp — no visible seam; haze
  blobs use their own radius as ramp); baked star alpha capped at 0.25 inside the column;
  capped stars excluded from twinkle metadata (a wobble would re-brighten them).
- `constellations.ts` — margin remap: cluster x-fractions (0.06–0.20 / 0.80–1.0) map into
  the ACTUAL margin bands (same column formula as deck.css) instead of raw viewport
  fractions — at 1440 the shift is ≤15px vs the approved geometry; at 1280/1200 it is what
  keeps brightened stars (α 1.0), halos, and firing beams (α 0.95) out of the column at all.
- `scene.ts` — firefly containment: the flock roams the horizontal margins only
  (reflecting at the column edges; side chosen ∝ margin width). Narrow-viewport fallback
  (margins < 48px): full-width roam at halved alpha (peak 0.45 → ≥4.5:1 vs --ink even at
  zero scrim).
- `deck.css` — scrim early stop tuned 0.28@18% → 0.3@10% (stops are Claude's-discretion
  per 05-CONTEXT.md; peak stays 0.38): panel text starts at padding-top 96px ≈ 10% of the
  viewport, and the first heading row measured sub-4.5 under the 18% ramp.

## Own-color ratios (supplementary honesty — the gate above is vs --ink per plan)

Worst ratio of each text color vs its OWN sampled worst backdrop, across both runs:

| Text color | Worst vs own color | Baseline vs plain --bg (no scene) | Status |
|---|---|---|---|
| --ink `#e8ebef` | 9.95 | 15.70 | PASS ≥4.5 |
| --body `#aab2bd` | 5.66 | 8.63 | PASS ≥4.5 |
| --accent `#d99163` (metric labels) | 4.54 | 6.9 | PASS ≥4.5 |
| --dim `#78818d` | 2.50 | 4.83 | pre-existing: 4.83 vs plain --bg leaves zero headroom — ANY non-black backdrop drops it below 4.5. v1 carried this (Phase 4 Lighthouse a11y 95, `color-contrast` sub-audit documented pre-existing). Out of SKY-05 scope (a text-token/design-system decision, not a scene defect). |
| --faint `#565f6b` | 1.71 | 2.85 | pre-existing: fails 4.5 even on plain --bg (v1 condition, same audit). Out of SKY-05 scope. |

The scene cannot push --dim/--faint below a floor they could otherwise hold — they have
no 4.5 floor even on the flat v1 background. Every color that passes on plain --bg
(--ink/--body/--accent) still passes ≥4.5 worst-case over the live scene.

## Analytic bound for the DOM camper glow (not canvas-readable)

The Layer-1 camper glow is a DOM radial-gradient (peak α 0.55 × --accent, pulse ×1.0)
UNDER the scrim (`.nightsky-host` z:-1 < `.deck::before` scrim < panel text). The glow's
top edge never rises above the 85% horizon line, where the scrim is ≥0.22: worst composite
≈ rgb(91,57,38)-class → ≥6:1 vs --ink. Bounded PASS by construction.

## Reproduce

```
npm run build && npm run preview
node scripts/verify-contrast.mjs --selftest
node scripts/verify-contrast.mjs --cdp --url http://localhost:4321/ --samples 12
node scripts/verify-contrast.mjs --cdp --url http://localhost:4321/ --width 1280 --height 800 --samples 12
```

Raw JSON reports for both recorded runs are committed alongside this file:
`contrast-run-1440.json`, `contrast-run-1280.json`.
