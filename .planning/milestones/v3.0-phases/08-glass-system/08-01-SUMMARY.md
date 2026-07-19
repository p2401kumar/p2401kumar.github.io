---
phase: 08-glass-system
plan: 01
subsystem: verification-tooling
tags: [contrast, wcag, cdp, screenshot, sharp, gate, baseline]
requires:
  - "07-04: analytic contrast baseline + Lighthouse floors (superseded viewport labels reconciled here)"
  - "07-SPIKE-GLASS: blur(12px) budget lock (the kernel this verifier exists to measure)"
provides:
  - "verify-contrast.mjs --cdp-screenshot: THE Phase-8 contrast gate (real post-composite screenshots, DPR1, panels + header/footer/jump-index, tall-panel sweep)"
  - "verify-contrast.mjs --agreement-selftest: permanent analytic-vs-screenshot pipeline proof (solid ±0.05 asserted; glass divergence recorded)"
  - "scripts/fixtures/glass-agreement-fixture.html: live-DOM-contract fixture (solid + glass variants)"
  - "08-01-baseline-contrast.md: the pre-glass arbiter reference for 08-02's glass gate"
affects:
  - "08-02: glass application judged against this baseline; must resolve the two pre-existing shortfalls"
  - "08-03: re-proof phase inherits the DPR1 screenshot gate"
tech-stack:
  added: []
  patterns:
    - "CDP Page.captureScreenshot -> sharp(buf).raw().ensureAlpha() -> existing WCAG helpers unchanged"
    - "Emulation.setDeviceMetricsOverride dsf:1 before navigation + hard decode-size self-check (DPR1-only gate doctrine)"
    - "Glyph occlusion via color:transparent injection pre-capture (backdrop-filter samples the backdrop, not element content)"
key-files:
  created:
    - scripts/fixtures/glass-agreement-fixture.html
    - .planning/phases/08-glass-system/08-01-baseline-contrast.md
    - .planning/phases/08-glass-system/deferred-items.md
  modified:
    - scripts/verify-contrast.mjs
decisions:
  - "Gate is DPR1-only (emulation-forced); DSF-2 reserved for manual visual evidence (known Windows capture hang)"
  - "Agreement fixture models zero scrim (no scrim DOM in fixture); production scrim stays locked by --selftest's deck.css sync check — the selftest proves the pixel pipeline, not the scrim model"
  - "Opaque-background regions (today's jump-index pill) measured from real pixels and recorded (notOverSky) but excluded from the over-sky gate, preserving analytic-mode semantics"
  - "Screenshot baseline at true CSS-px viewports supersedes the 4.58/12.22 analytic family (legacy --window-size viewports were mislabeled: 1440,900 -> 1424x805 effective)"
  - "Pre-existing shortfalls recorded, not fixed: zero product CSS in this plan; 08-02's gate owns the fix decisions"
metrics:
  duration: "~25 min"
  completed: "2026-07-19"
  tasks: 3
  files: 4
status: complete
---

# Phase 8 Plan 01: GLS-03 Verifier Re-architecture + Pre-Glass Baseline Summary

**One-liner:** verify-contrast.mjs now gates on real CDP screenshots decoded through sharp (DPR1, panels + never-gated chrome, scroll-sweep-armed), with a committed agreement selftest (solid Δ0.0005, glass divergence 6.68 recorded), and the true-viewport pre-glass baseline is on record — including two pre-existing shortfalls the old analytic gate could never see.

## What was built

### Task 1 — capture/decode plumbing + agreement selftest (882ea09)
- `captureAndDecode()`: `Page.captureScreenshot {png, fromSurface}` → `sharp(buf).raw().ensureAlpha().toBuffer({resolveWithObject:true})`, with a hard throw if decoded size ≠ requested viewport (DPR drift → wrong pixels).
- `extractSubImage()`: stride-math rect copy producing `{data,width,height}` consumed by the EXISTING `worstCaseContrastInRegion()` verbatim (zero changes to the WCAG helpers).
- `forceDpr1()`: `Emulation.setDeviceMetricsOverride({deviceScaleFactor:1})` before navigation; DPR1-only gate doctrine documented inline (DSF-2 capture hang, 05.1-01-SUMMARY.md:77-78).
- `--agreement-selftest` + `scripts/fixtures/glass-agreement-fixture.html` (exact live DOM contract: solid-filled `#nightsky-canvas`, 1×1 data-URI `.sky-photo img`, `.panel[data-state="active"]` with `--ink`-colored text). Solid fixture: analytic 11.3880 vs screenshot 11.3875 (|Δ| 0.0005 ≤ 0.05, asserted, exit non-zero on disagreement). Glass variant (stripes narrower than the blur kernel + fixture-only `backdrop-filter: blur(12px)`): analytic 1.1070 vs screenshot 7.7901 — recorded, never asserted; screenshot authoritative. Runnable forever.
- Glyph occlusion (`color:transparent` style injection pre-capture) so text pixels never self-compare; `--force-color-profile=srgb` pinned on the Chrome launch so captures are raw sRGB.
- sharp imported from node_modules only — package.json byte-identical (asserted).

### Task 2 — `--cdp-screenshot` gate mode (99fca0b)
- `discoverTextRegions()`: geometry-only factoring of `samplePageOnce`'s rect walk (identical text extraction, ancestor-opaque-bg walk, Range-based glyph-run line rects) — stops before any pixel read; injected via `.toString()`; pixels come from the Node-side decode.
- Widened scope: `header`, `footer`, `#deck-index` sampled once while hero is active (fixed chrome, panel-independent) — surfaces never visited by the panel-scoped analytic query.
- Tall-panel internal-scroll sweep: `scrollTop` stepped by `clientHeight` whenever `scrollHeight > clientHeight`, worst-case unioned across offsets; `sampled_offsets` recorded per panel entry (auditable), "no internal scroll needed at WxH" recorded otherwise.
- Same JSON report shape as `--cdp` (`report.panels[]` with `panel`/`worstVsInk`/`failing`/`regions`), tagged `mode:"screenshot"`, serialized with the identical `JSON.stringify(report, null, 2)` formatting (`"panel": "header"` with space — the plan's greps held as written, no adjustment needed). Additive fields: `sampled_offsets`, `scroll`, `notOverSky`.
- Gate semantics: exit non-zero if ANY over-sky region's worstVsInk < threshold (4.5/3). Analytic `--cdp`, `--moon`, `--selftest`, `--print-browser-snippet` all fully intact.

### Task 3 — pre-glass baseline reference (cbc34da)
`08-01-baseline-contrast.md`: worst-case-vs-ink for all 7 panels + 3 chrome surfaces at true 1280×800 and 1440×900, worst-region identities, scroll-sweep findings (no panel scrolls internally at either width — capability stays armed), own-color context for the dim chrome tier, mode-agreement record, and the expected-family reconciliation.

## Pre-existing conditions discovered (recorded prominently, NOT fixed — 08-02's gate owns the decisions)

1. **experience @1280×800 = 3.636:1** — panel bullet text directly over the pulsing `.camper-glow` copper radial (worst pixel rgb(160,110,76) at (242,633) ≡ computed glow center (245,632)). The analytic mode is *architecturally blind* to this: the glow is a Layer-1 DOM sibling — not canvas, not photo, not an ancestor background. First tool in project history able to see it.
2. **header @1440×900 = 4.335:1** — `<b>prateek kumar</b>` over bright top-left photo sky where the scrim ramp is weak. Header was never contrast-gated before this plan. Passes at 1280×800 (5.272).

Both baseline runs exit non-zero solely due to these two conditions; every other over-sky surface clears with ≥10 points of headroom. Per plan contract the plan does not fail on them.

## Deviations from Plan

### Auto-fixed / adjusted

**1. [Rule 1 - Fixture bug] Fixture background painted over the scene host**
- **Found during:** Task 1 first `--agreement-selftest` run (solid Δ4.31 FAIL — screenshot worst was `--bg`, not the canvas color)
- **Issue:** fixture set `background` on both `html` and `body`; with html backgrounded, body paints its own box ABOVE the `z-index:-1` host (background-propagation rule the live NightSky.astro documents)
- **Fix:** background on `body` only — matches the live contract; solid Δ collapsed to 0.0005
- **Files:** scripts/fixtures/glass-agreement-fixture.html · **Commit:** 882ea09

**2. [Rule 2 - Missing critical coverage] Element query widened with `b`,`div`**
- **Found during:** Task 2 design (SiteHeader read)
- **Issue:** the header identity line is a direct-text `<div>` with a `<b>` child — neither tag in the original panel-scoped h1..span list; chrome gating is the entire point of the widened scope
- **Fix:** `discoverTextRegions` query = original list + `b,div` (direct-text-node filter keeps container divs out). This addition is what discovered pre-existing condition 2.
- **Files:** scripts/verify-contrast.mjs · **Commit:** 99fca0b

**3. [Rule 2 - Measurement correctness] Glyph occlusion + sRGB profile pin**
- **Found during:** Task 1 design
- **Issue:** screenshots contain rendered glyphs (self-compare at ~1:1) and are display-profile-dependent
- **Fix:** `color:transparent` injection between rect discovery and capture; `--force-color-profile=srgb` launch flag
- **Files:** scripts/verify-contrast.mjs · **Commit:** 882ea09

**4. [Investigated - not a deviation] Expected 4.58/12.22 family not reproduced — STOP-and-investigate performed and closed**
- Screenshot panels landed ~14.5–15.6, not ~12.22. Root cause: legacy `--window-size` viewports are mislabeled (probe: 1440,900 → 1424×805 effective; emulation → exactly 1440×900). Cross-check at identical true viewports: analytic vs screenshot agree per panel within 0.02–0.46 (residual = 12-sample twinkle breadth vs 1 frame). Neither pipeline lies; the baseline supersedes the old family. Legacy-mode label fix logged to deferred-items.md (out of scope — plan mandates existing modes stay intact).

### JSON format note (plan-checker item)
The existing `--cdp` report serializes with `JSON.stringify(report, null, 2)` → `"panel": "header"` **with** a space. The new mode uses the identical serialization; the plan's verify greps matched as written — no grep adjustment was required.

## Authentication gates
None.

## Known Stubs
None — no placeholder values, no unwired data paths. The `--cdp-screenshot` mode is fully implemented end-to-end.

## Threat Flags
None — no new network endpoints, auth paths, or trust-boundary changes. The screenshot decode consumes PNG bytes from the script's own locally-spawned Chrome (T-08-01 accept holds); zero packages installed (T-08-SC mitigation held: package.json untouched, asserted in Task 1 verify).

## Verification summary

- `--selftest` PASS (all existing fixtures incl. deck.css scrim sync — scrim untouched)
- `--agreement-selftest` exit 0 (solid |Δ| 0.0005; glass divergence 6.68 recorded)
- `--cdp-screenshot` end-to-end at both widths; report covers 7 panels + header/footer/jump-index; `sampled_offsets` present for experience/patents/skills at both widths
- `astro check`: 0 errors/warnings/hints · `astro build`: green (4 pages + sitemap)
- package.json / package-lock / .planning/config.json untouched; zero installs; zero product CSS/src changes; no push

## Commits

| Task | Commit | Description |
|---|---|---|
| 1 | 882ea09 | capture/decode plumbing + DPR1 doctrine + agreement selftest + fixture |
| 2 | 99fca0b | --cdp-screenshot gate mode (chrome scope + scroll sweep) |
| 3 | cbc34da | pre-glass baseline reference + deferred items |

## Self-Check: PASSED
