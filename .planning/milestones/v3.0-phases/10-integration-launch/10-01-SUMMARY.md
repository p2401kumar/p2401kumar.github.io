---
phase: 10-integration-launch
plan: 01
subsystem: launch-verification
tags: [verification, cdp, contrast, aurora, moon, soak, lighthouse, fig01, og-image, launch-readiness]
requires:
  - phase: 09-living-sky
    provides: all-green reference families (soak 5.49%, contrast worsts, aurora/moon peaks, LH 99+100×7) + the committed battery/soak drivers
  - phase: 06-integration-launch (v2.0)
    provides: the proven audit technique (CDP proxies, focus emulation, coldNav discipline) + the two carried fix-forward notes now closed
provides:
  - FLR-02 + FLR-03 verified green on the fully composited build (36-check Fig. 01 audit, deck mechanics, no-JS floor, case-study/SEO, reduced-motion, honesty)
  - FLR-01 local pre-flight (Lighthouse 99+100×3 mobile / 100×4 desktop)
  - LNC-01 rollback path documented (revert range + FF push; tags v1.0/v2.0)
  - OG-03 closed — real 1200×630 reduced-motion hero capture shipped to public/og/og-default.png
  - decision-ready go/no-go pack for the 10-02 human deploy gate
affects: [10-02 launch decision]
tech-stack:
  added: []
  patterns:
    - about:blank interposition for genuinely-cold fragment deep-link loads under CDP (fragment-only Page.navigate is same-document)
    - tier-flip delta probe with exact-restore assertion for the mobile shed ladder (replaces the luck-dependent fixed-strip instrument)
key-files:
  created:
    - .planning/phases/10-integration-launch/10-01-fig01-audit.md
    - .planning/phases/10-integration-launch/10-01-integration-evidence.md
    - .planning/phases/10-integration-launch/10-01-battery.md
    - .planning/phases/10-integration-launch/10-01-LAUNCH-READINESS.md
    - .planning/phases/10-integration-launch/10-01-hero-v2-live.png
    - .planning/phases/10-integration-launch/10-01-hero-v3-local.png
    - .planning/phases/10-integration-launch/10-01-reduced-motion-still.png
    - .planning/phases/10-integration-launch/10-01-experience-panel.png
    - .planning/phases/10-integration-launch/10-01-jump-index.png
    - .planning/phases/10-integration-launch/10-01-aurora-moon.png
    - .planning/phases/10-integration-launch/10-01-mobile-375w.png
    - .planning/phases/10-integration-launch/10-01-classic-mode.png
    - .planning/phases/10-integration-launch/10-01-fig01-coldload.png
    - .planning/phases/10-integration-launch/10-01-fig01-degraded.png
    - .planning/phases/10-integration-launch/10-01-fig01-resize-activate.png
  modified:
    - public/og/og-default.png
decisions:
  - "OG-03 taken (not deferred): a real reduced-motion capture at 1440×756 (same 40:21 aspect) Lanczos-downscaled to 1200×630 — a straight 630-high viewport clips the links row behind the footer glass; no crop, no retouch"
  - "Shed-ladder far-strip rows replaced by a tier-flip delta probe with exact-restore proof after diagnosing the committed instrument's per-process layout luck + ineffective same-size re-roll; product exonerated (source bit-identical to the 09-03-proven commit)"
  - "Soak total 6.39% recorded as a +0.90pp delta vs the 5.49% point, inside the 08-03 glass-live 6.10% noise family — machine shared with the day's audit workload; floor holds with 3.61pp headroom"
metrics:
  duration: ~50 min
  completed: 2026-07-19
  tasks: 3
  commits: 3
status: complete
---

# Phase 10 Plan 01: Launch-Readiness Verification (Local) Summary

**One-liner:** All-local proof that the fully composited v3.0 Real Sky site is launch-ready —
36/36 embedded Fig. 01 checks with the full ambient frozen behind it, every carry-forward gate
inside its Phase-9 family (contrast worsts identical, aurora 0.1052/0.0386, moon 0.2374/0.2466,
soak 6.39%<10%, LH 99+100×3 / 100×4), OG-03 refreshed with an honest capture — aggregated into
a 21-gate go/no-go pack; nothing pushed, live site still v2.0.

## What was verified

- **Task 1 (`10-01-fig01-audit.md` + `10-01-integration-evidence.md`):** scripted CDP audit,
  30 runtime + 6 static checks, **0 FAIL**. The v3 parity proof landed: whole
  `#nightsky-canvas` hash identical across ~2s pairs while fig-01 is active — on the COLD
  deep-link path (06-02 Fix B `seedFig01ActiveFromDom`, proven live for the first time) AND
  the event path — while fig-01's own canvas animates a dispatched beam, and the same pair
  differs at hero. Deck mechanics (one-gesture-one-panel incl. wheel-burst lock, hash +
  back/forward, `/#patents` cold with a mutation-timeline no-hero-flash proof), `/#work`
  alias → systems with hash preserved, view-classic escape/return, resize-while-inactive at
  deviceScaleFactor 2 → 1468×760 exact re-measure, reduced-motion byte-identical stills +
  fault narration, classic mode with photo + credit, both `/work/*` scene-free with Back →
  `#systems`, sitemap exactly 3 routes.
- **Task 2 (`10-01-battery.md`):** 30-row consolidated battery, every row green vs its
  Phase-9 family — build + astro check 0/0/0, all five verifier modes at both viewports,
  banding selftest + fresh live crops (runs=1 gaps=0), 60s soak 6.39% total at 60.0fps with 0
  long tasks, single-rAF 2/2/0×5, zero cross-boundary imports, boundary-aware zero-hex 0,
  pause-machine triple proof, local Lighthouse **99/100/100/100 mobile (LCP 1.9s, TBT 0ms,
  CLS 0.003)** and **100×4 desktop (LCP 0.5s)** — both identical to reference. **OG-03
  closed**: `public/og/og-default.png` is now a real 1200×630 reduced-motion capture of the
  composited hero (before 43,141 B design card → after 309,377 B real capture; meta + dist
  dims verified).
- **Task 3 (`10-01-LAUNCH-READINESS.md`):** the pack — v2-live vs v3-local hero shots lead
  (live site captured read-only), 21-gate aggregate table (20 green, LIVE Lighthouse the sole
  deferral), 11-screenshot index featuring the reduced-motion still as the proof-of-craft
  artifact, explicit rollback (revert `3fbbcd2..HEAD` + FF push, never --force; tags
  v1.0/v2.0 on origin), the carried real-device checklist + 5 v3 additions, fix-forward list,
  and the three-option verdict. Push distance: 65 commits.

## Task commits

| Task | Name | Commit | Type |
|---|---|---|---|
| 1 | Composited Fig. 01 36-check audit + integration evidence | `c9343cb` | test |
| 2 | Full gate battery + OG-03 refresh + sign-off screenshots | `23cba85` | feat |
| 3 | Go/no-go pack + live v2 hero capture | `baa5215` | docs |

## Deviations from Plan

### Auto-fixed issues (Rule 1 — audit tooling only, product untouched)

**1. Tooltip opacity read mid-transition**
- **Found during:** Task 1, first audit run (1 FAIL: A7 tooltip-on-focus)
- **Issue:** tooltip opacity is CSS-transitioned; reading computed style in the same
  `Runtime.evaluate` as `focus()` returns the pre-transition 0 (the handler provably ran).
- **Fix:** read after a 450ms settle. Scratchpad harness only.

**2. Fragment-only `Page.navigate` is a same-document navigation**
- **Found during:** Task 1, first run (Section F timeout; B6/B7 "cold" loads not actually cold)
- **Fix:** `about:blank` interposition before every cold deep-link (`coldNav`). Harness only.

**3. Document-start injected observer on a null `documentElement`**
- **Found during:** Task 1, second run (B6 timeline empty)
- **Fix:** observe `document` with `subtree` + filter to html-class mutations. Result:
  `deck-active` added exactly once at `readyState "interactive"` with patents already active.

**4. Shed-ladder far-strip instrument fragility (committed driver, diagnosed not rewritten)**
- **Found during:** Task 2 (`capture-battery.mjs` re-run: 10/12 rows PASS, 2 far-strip rows FAIL)
- **Issue:** the fixed right-margin probe strip catches the far cloud layer only when the
  per-process random sprite layout happens to cover it, and the driver's same-size synthetic
  resize re-roll regenerates Layer 0 (marker-pixel test: repaint < 1s) but reuses the cloud
  sprites — it can never re-randomize the strip. The committed 09 report's own tier1/tier3
  values reproduce bit-for-bit today.
- **Fix (instrument-side, scratchpad):** tier-flip delta probe on the far-carrying margin
  band — dm=4 drops the band mean 13.026 → 9.445 (cover2 −0.083), reverting restores the
  exact tier-0 values; near clouds intact throughout. Product source verified bit-identical
  to the commit the 09-03 battery proved green this morning (`git diff df8e6e7 HEAD -- src
  public …` empty). Recorded as a fix-forward instrument note, not a product issue.

### Verify-block adaptation (documented)

The plan's literal `grep '<picture>'` reads 0 because Astro emits the scoped-style attribute
(`<picture data-astro-cid-…>`); adapted to `<picture[^>]*>` (= 1). Product markup exactly as
specified.

### Recorded deltas (not failures)

- Soak total 6.39% vs the 5.49% reference point: +0.90pp, inside the 08-03 glass-live 6.10%
  noise family; 60.0fps, 0 long tasks, LayoutDuration ~0 all at reference. Floor (<10%) holds
  with 3.61pp headroom.
- Moon crescent invisible in full-page still crops at (84, 612): verified pixel-identical to
  the committed 09 marquee still (max lum 35 in the bbox both) — the deliberately-dim SKY-07
  appearance, not a regression; the `--moon` sampler (canvas-over-photo, no scrim) measures
  0.2374 today.

## Threat model compliance

- **T-10-01 (critical):** NO `git push` anywhere; Task 3 verify asserts `origin/main` is an
  ancestor of and not equal to local `main`.
- **T-10-05:** locked values verified read-only; the sole product edit is the honesty-gated
  OG capture (sanctioned).
- **T-10-04 / T-10-SC:** `package.json` / `package-lock.json` / `.planning/config.json`
  byte-identical (git diff empty); Lighthouse + CDP drivers transient, zero installs.

## Known Stubs

None — verification artifacts + one sanctioned asset swap only; no product code created or
modified.

## Next

10-02 — the deploy, BLOCKED on the explicit human go decision. The user reads
`10-01-LAUNCH-READINESS.md` (60-second call: two hero shots + the gate table) and says
**launch now / fix-listed-items-then-launch / hold**. The only unproven gate is LIVE
Lighthouse.

## Self-Check: PASSED

All 16 claimed artifacts exist on disk; all 3 task commits (`c9343cb`, `23cba85`, `baa5215`)
present in git log; `origin/main` unmoved and strictly behind local main (no push executed);
`package.json` / `package-lock.json` / `.planning/config.json` byte-identical.
