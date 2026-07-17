---
phase: 05-night-sky-scene
plan: 01
subsystem: ui
tags: [canvas2d, procedural-generation, milky-way, starfield, spike, headless-chrome]

# Dependency graph
requires:
  - phase: 04-deck-mechanics
    provides: deck.ts panel-change event contract, tokens.css doctrine, DPR-cap-2 precedent from fig01
provides:
  - "Milky Way + starfield rendering technique validated (zero-dependency scatter+gradient, PASS verdict)"
  - "SPIKE.md contract: chosen technique + exact parameters + final sky-token values for 05-03"
  - "Standalone spike-milkyway.html prototype (throwaway, phase-dir only)"
affects: [05-02, 05-03, nightsky-starfield, nightsky-scene]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Milky Way band: layered createRadialGradient haze passes ('lighter' composite) + dot-scatter dust passes (fine + coarse), jitter/layering baked in as default rather than a sequential retry ladder"
    - "Per-pixel getImageData/putImageData dither for anti-banding insurance on flat gradients (not a tiled pattern, which produces a visible periodic artifact)"
    - "Seeded RNG (mulberry32) for reproducible spike renders across DPR captures"

key-files:
  created:
    - .planning/phases/05-night-sky-scene/spike-milkyway.html
    - .planning/phases/05-night-sky-scene/SPIKE.md
    - .planning/phases/05-night-sky-scene/spike-dpr1.png
    - .planning/phases/05-night-sky-scene/spike-dpr2.png
  modified: []

key-decisions:
  - "Milky Way spike technique PASSED on first evaluation — the zero-dependency scatter+gradient approach was built with recovery-ladder steps 1-3 (jitter, layered passes, coarse dust) baked in as the default technique per 05-UI-SPEC.md's own recommendation, rather than tested as a naive single-gradient baseline first. All four FAIL indicators cleared (no rings, smooth histogram, no seam, visible greyscale depth)."
  - "simplex-noise fallback NOT needed — Task 2's conditional supply-chain checkpoint is N/A, no package installed."
  - "All 4 provisional sky-token hex values from 05-UI-SPEC.md confirmed unchanged: --sky-zenith #05070a, --sky-horizon #141a2c, --milkyway #cfd9f2, --star #eef2fa."
  - "gstack /browse daemon failed to start in this environment; used headless Chrome directly (--headless=new, --force-device-scale-factor) as the documented fallback for DPR-1/DPR-2 screenshot capture."

patterns-established:
  - "Pattern: Milky Way Layer-0 compositing (haze gradient passes + fine dust + coarse dust, all 'lighter' composite) — the exact contract 05-03/starfield.ts must implement, documented in SPIKE.md."

requirements-completed: [SKY-01]

coverage:
  - id: D1
    description: "Standalone Milky Way spike prototype renders band + starfield at DPR 1 and DPR 2, screenshotted, judged against RESEARCH Pattern 1's objective pass/fail bar"
    requirement: "SKY-01"
    verification:
      - kind: manual_procedural
        ref: "Screenshot analysis: histogram smoothness (32-bin, no zero-gaps), perpendicular cross-section (no step/seam), greyscale depth check, ring check at zoom — all documented in SPIKE.md Verification Method section"
        status: pass
    human_judgment: true
    rationale: "The banding pass/fail judgment is inherently visual (RESEARCH Pattern 1's own bar requires human-style visual assessment of a screenshot, not a fully mechanical test) even though it was substantiated with quantitative histogram/cross-section checks."
  - id: D2
    description: "SPIKE.md records verdict, chosen technique, recovery-ladder trace, and final sky-token values for 05-03 to read_first"
    requirement: "SKY-01"
    verification:
      - kind: other
        ref: "test -f SPIKE.md && grep -oiE 'verdict' SPIKE.md (plan's own automated verify check)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Task 2 conditional checkpoint correctly resolved as N/A (zero-dep spike passed, no simplex-noise install, no human legitimacy check engaged)"
    requirement: "SKY-01"
    verification:
      - kind: other
        ref: "git diff package.json package-lock.json (no changes); SPIKE.md 'Task 2' section states N/A"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-07-17
status: complete
---

# Phase 05 Plan 01: Milky Way Spike Summary

**Zero-dependency scatter+gradient Milky Way technique validated PASS at DPR 1/2 via headless-Chrome screenshots — no simplex-noise fallback needed, all 4 provisional sky tokens confirmed as final.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-17T23:26:04Z
- **Completed:** 2026-07-17T23:40:59Z
- **Tasks:** 1 of 2 (Task 2 conditional checkpoint resolved as N/A, no human interaction needed)
- **Files modified:** 4 created, 0 modified (outside STATE.md/SUMMARY.md bookkeeping)

## Accomplishments
- Built `spike-milkyway.html`, a standalone throwaway prototype matching the project's existing prototype-HTML convention, rendering a power-law starfield + a layered-gradient/dot-scatter Milky Way band at production DPR (cap 2)
- Captured DPR-1 and DPR-2 screenshots via headless Chrome (gstack `/browse` daemon unavailable in this environment) and judged them against RESEARCH Pattern 1's four objective FAIL indicators — all cleared
- Found and fixed a genuine banding-adjacent bug mid-spike (a tiled noise-pattern dither produced a visible repeating grid artifact) before it could contaminate the verdict
- Wrote `SPIKE.md`: verdict PASS, exact technique + parameters, recovery-ladder trace, and the final (unchanged) 4 sky-token hex values — the contract `05-03` will read_first
- Confirmed Task 2's conditional simplex-noise legitimacy checkpoint is N/A; no package installed, no human interaction required

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the Milky Way spike prototype, judge against the objective bar, walk the recovery ladder, write SPIKE.md** - `944cd17` (feat)

Task 2 (conditional checkpoint) was resolved as **N/A** — the SPIKE.md verdict was PASS, so per the plan's explicit instruction the checkpoint never engaged and no separate commit was needed (no files were modified for this task).

**Plan metadata:** committed separately after this summary (docs: complete plan).

## Files Created/Modified
- `.planning/phases/05-night-sky-scene/spike-milkyway.html` - standalone Milky Way + starfield prototype (throwaway, exempt from zero-hex doctrine)
- `.planning/phases/05-night-sky-scene/SPIKE.md` - verdict, technique, ladder trace, final sky-token values (05-03's read_first contract)
- `.planning/phases/05-night-sky-scene/spike-dpr1.png` - DPR-1 screenshot evidence (1440x900 physical px)
- `.planning/phases/05-night-sky-scene/spike-dpr2.png` - DPR-2 screenshot evidence (2880x1800 physical px)

## Decisions Made
- Built the recovery ladder's three mitigation steps (jitter, layered gradient passes, coarse dust) into the default technique from the start, rather than deliberately shipping a known-bad naive baseline first and retrying — this follows `05-UI-SPEC.md`'s own explicit recommendation ("3-5 stacked passes... offset slightly") and RESEARCH Pattern 1's own stated root cause ("uniform alpha across a gradient is the single most common cause of visible banding"). The naive single-gradient technique exists in the prototype only as an internal `?ladder=0` comparison toggle, never used for the judged screenshots.
- Used headless Chrome directly (`--headless=new`, `--force-device-scale-factor=1|2`) instead of the gstack `/browse` skill, since the browse daemon failed to start (`Server failed to start within 15s`) — documented in SPIKE.md as the fallback method used.
- Verified the banding judgment quantitatively (32-bin luminance histogram with no zero-gaps, a smooth perpendicular pixel cross-section with no step/plateau, greyscale depth check) rather than relying purely on visual impression, to substantiate the PASS verdict against RESEARCH Pattern 1's specific FAIL indicators.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tiled noise-pattern dither produced a visible repeating grid artifact**
- **Found during:** Task 1 (screenshot-based banding judgment)
- **Issue:** An initial implementation used a small 64x64 `createPattern(..., 'repeat')` noise texture applied at low alpha over the sky wash as anti-banding insurance. Under crop-and-zoom inspection of the captured screenshots, this produced a faint but clearly regular repeating grid/cross-hatch artifact across the whole sky — itself one of RESEARCH Pattern 1's named FAIL indicators ("a visible seam or repeating pattern").
- **Fix:** Replaced the tiled pattern with true per-pixel `getImageData`/`putImageData` noise (±3 luminance levels, seeded RNG), which has no periodicity by construction. Re-captured both DPR screenshots and re-verified — the plain-sky region is now clean at native resolution; a separate, unrelated faint texture remains only within the gradient-heavy Milky Way glow region (see Issues Encountered below).
- **Files modified:** `.planning/phases/05-night-sky-scene/spike-milkyway.html` (the throwaway spike prototype itself — no shipped source touched)
- **Verification:** Re-screenshotted at DPR 1/2, cropped-and-zoomed inspection of the plain sky area confirmed no repeating pattern; committed as part of the single Task 1 commit (this was found and fixed before the first commit, not a follow-up fix).
- **Committed in:** `944cd17` (Task 1 commit — the fix was applied before committing, so the commit reflects the corrected version)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for an honest banding verdict — the artifact this fix removed was itself disqualifying under RESEARCH's own FAIL bar. No scope creep; fix stayed entirely within the throwaway prototype file.

## Issues Encountered
- **Investigated, not a fail:** a faint, uniform diagonal cross-hatch dither texture is visible within the Milky Way glow region specifically when a screenshot is cropped and magnified well beyond 100% (e.g., a 400x400px region resized 2x-4x). This was traced to Chromium/Skia's own built-in gradient anti-banding dither — present identically with and without `--disable-gpu`, and inherent to any `createRadialGradient`-based Canvas2D render in Chrome, not an artifact specific to this technique. It is not concentric rings (RESEARCH's named indicator), does not correlate with the band's density-transition zones (RESEARCH's other named indicator), and is not perceptible at normal (non-crop-magnified) viewing scale. Documented transparently in SPIKE.md's Verification Method section rather than silently omitted.
- **Environment note:** an earlier attempt to launch `chrome.exe --version` without proper headless flags briefly opened a full GUI Chrome window (unintended); it was closed via `taskkill /F /IM chrome.exe`, which also closed any other Chrome windows/processes present at that moment. No further browser launches in this session used bare invocations — all subsequent captures used `--headless=new` with an isolated `--user-data-dir` and exited automatically after each screenshot (confirmed via `tasklist` showing zero lingering `chrome.exe` processes at the end of the session).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `SPIKE.md` is committed and ready for `05-03` (`src/lib/nightsky/starfield.ts`) to `read_first` — the Milky Way compositing technique, exact parameters, and final sky-token values are locked.
- No `src/lib/nightsky/*` engine code was written in this plan (correctly deferred to `05-03` per the plan's prohibitions).
- No package was installed; `package.json`/`package-lock.json` are unmodified.
- No push, deploy, or Pages trigger occurred — all commits remain local on `main`.

---
*Phase: 05-night-sky-scene*
*Completed: 2026-07-17*

## Self-Check: PASSED
All referenced files and the Task 1 commit (`944cd17`) were verified present on disk / in git log.
