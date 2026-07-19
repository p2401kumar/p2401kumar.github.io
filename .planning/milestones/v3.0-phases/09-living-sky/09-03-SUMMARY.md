---
phase: 09-living-sky
plan: 03
subsystem: nightsky-ambient
tags: [amb-05, mobile-ladder, device-tier, ambient-soak, closing-battery, reduced-motion, pause-machine, phase-close]
requires:
  - "09-01: setFarShed + chromaticNudgeEnabled seams; clouds/parallax/scintillation live; idle-queue drain idiom"
  - "09-02: setShapeThrottle seam; aurora live over-moon/before-clouds; --aurora gate; the two carried notes this plan closes/dispositions"
  - "08-03: glass-reproof/real-soak.mjs scaffolding + the 6.10% glass-live reference the marginal is measured against"
provides:
  - "computeAmbientTier in scene.ts: width/deviceMemory ladder (documented in-code), recomputed every adopt/resize, pushing setFarShed / setShapeThrottle(9) / chromaticNudgeEnabled — parallax never referenced"
  - "clouds requestRepaint seam: idle-queued sprite drains repaint the static frame when no loop runs (reduced-motion completeness fix)"
  - "ambient-soak/ambient-soak.mjs: reusable ambient A/B soak driver (reduced-motion toggle, glass live both runs, ambient-handle readiness probes)"
  - "battery/: full closing evidence — soak 5.49% total, all gates both viewports, RM marquee still, 375w shed still, capture-battery.mjs driver"
  - "Phase 9 CLOSED: AMB-01..05 Complete, ROADMAP 3/3 [x], STATE advanced to Phase 10 with the measured ambient budget"
affects:
  - "Phase 10: launch battery inherits ambient-soak.mjs + capture-battery.mjs shapes; entering budget 5.49% total (4.51pp headroom); RM/375w stills feed the real-device checklist"
tech-stack:
  added: []
  patterns:
    - "Device tier as a pure function of (width, feature-detected deviceMemory), computed at the single adopt/resize chokepoint and PUSHED to subsystem seams — no subsystem self-detects"
    - "Paused-only repaint gate: async producers (idle-queued drains) request a repaint; the scene repaints only when rafId === null, so a running loop never gets an extra frame"
    - "Haze-coverage probes (fraction of pixels in the low-alpha band) as the canvas-evidence instrument — max-alpha probes are star-polluted and were rejected"
    - "Ambient A/B soak via prefers-reduced-motion emulation on one navigated page: baseline = the pause machine's own static frame, so the marginal is the whole-scene cost by construction"
key-files:
  created:
    - .planning/phases/09-living-sky/ambient-soak/ambient-soak.mjs
    - .planning/phases/09-living-sky/battery/ (21 files — summary, drivers, JSON/txt records, 4 PNGs)
  modified:
    - src/lib/nightsky/scene.ts
    - src/lib/nightsky/clouds.ts
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/STATE.md
decisions:
  - "Soak marginal framed honestly: the plan's RM baseline stops the WHOLE scene (+4.26pp = full living-scene cost); the 0.3-0.7pp projection's basis is 08's 6.10% glass-live total, against which the four new ambient systems measure -0.61pp ~= 0 within the +/-0.4-0.7pp noise family"
  - "Aurora shape throttle at tier 2 set to 9 (midpoint of the specced 8-10 window)"
  - "Far-shed proven behaviorally via right-margin coverage probe under deterministic RM emulation; aurora-throttle + chromatic-drop at tiers 2/3 are grep-verified wiring (no static-screenshot signature by design)"
  - "Carried note (b) — aurora lateral softening — deliberately NOT taken: side edges are vertical exactly as specified; the offscreen-pass lever stays documented for Phase 10 aesthetics if wanted"
metrics:
  duration: "~60 min"
  completed: "2026-07-19"
  tasks: 3
  files: 28
status: complete
---

# Phase 9 Plan 03: Mobile Shed Ladder + Closing Battery + Phase Close Summary

**One-liner:** AMB-05 closed — the width/deviceMemory degradation ladder shipped at scene.ts's adopt chokepoint (far clouds shed → aurora throttled to 9 → chromatic nudge dropped; parallax proven firing at 375w tier 3), the reduced-motion still made complete (clouds now survive the idle-drain race — carried note (a) fixed with column-band alpha 5 vs 09-02's 0), and the full closing battery re-proved every floor with everything live: **5.49% total idle < 10%** (marginal ≈0 vs the 08 reference), 60.0fps, 0 long tasks, all contrast/aurora/moon/banding/Lighthouse/pause/transform/leak gates green at both viewports.

## What was built

### Task 1 — mobile degradation ladder + drain-repaint fix (41fa988)
- **`computeAmbientTier(cssWidth)` in scene.ts** (AMB-05): the LOCKED ladder documented in-code — tier ≥1 `w<640 OR dm≤4` → `cloudsHandle.setFarShed(true)`; tier ≥2 `w<480 OR dm≤2` → `auroraHandle.setShapeThrottle(9)` (8–10 window midpoint; brightness sine stays per-frame); tier ≥3 `w<390 OR (dm≤2 AND tier 2)` → `chromaticNudgeEnabled = false`. Computed in `adoptLayer0` after the clouds/aurora resize, before the static paint — recomputed on every adopt/resize. `navigator.deviceMemory` feature-detected (`typeof === 'number'`); Safari/iOS falls back width-only. **Parallax is never referenced** — it NEVER sheds (locked), asserted by grep (zero "tier" in parallax.ts).
- **[Rule 2] clouds `requestRepaint` seam** (closes 09-02 carried note (a)): sprite generation is idle-queued, so the drain ALWAYS lands after `adoptLayer0`'s synchronous static paint — under reduced-motion no loop ever repainted, leaving the still permanently cloudless for visitors who load with RM already set. clouds.ts now invokes an optional `requestRepaint` when a drained pair is adopted; scene.ts passes a gated callback (`rafId === null` → `renderStaticFrame()`), so a running loop never gets an extra frame. Mirrors the constellations idiom.
- Both seams confirmed: `setFarShed` skips far in draw AND drawStatic (shared `render()`); `setShapeThrottle` touches shape cadence only.

### Task 2 — full closing battery (0d3f618)
- **`ambient-soak/ambient-soak.mjs`**: real-soak.mjs adaptation (CDP scaffolding verbatim, zero deps, locked 08 file untouched) — glass live throughout, AMBIENT toggled via `prefers-reduced-motion` emulation; readiness wait extended with canvas readback probes proving the ambient handles live (cloud + aurora bands nonzero).
- **`battery/capture-battery.mjs`** + 21 evidence files. Full record: `battery/battery-summary.md`. Headline table:

| Gate | Result |
|---|---|
| Soak TOTAL (ambient + glass) | **5.49% < 10%** — 4.51pp headroom, 60.0fps, 0 long tasks, Layout 0.000s |
| Soak MARGINAL (plan-designed, vs RM baseline 1.23%) | **+4.26pp** = whole-scene cost vs static frame |
| Soak MARGINAL (projection-comparable, vs 08's 6.10% glass-live) | **−0.61pp ≈ 0** within ±0.4–0.7pp noise — at/below the 0.3–0.7pp projection; tree 35.32% vs 36.67% (−1.35pp) |
| `--cdp-screenshot` 1440×900 / 1280×800 | PASS / PASS — every `failing[]` empty (experience 15.06 / patents 15.55 / skills 15.57; header 6.23 unchanged) |
| `--aurora` full-cycle (21.6s ≥ period) | PASS both: 0.1035 < 0.4748 @1440; 0.0384 < 0.4695 @1280; ceiling grep ✔ |
| `--moon` + `--selftest` | PASS both viewports / PASS |
| Banding: selftest + live crops (cloud + aurora gradients, RM still, new capture path) | ALL PASS (runs=1, gaps=0 every region) |
| Lighthouse (npx 13.4.0, preview) | mobile **99/100/100/100**, desktop **100×4**, TBT 0ms both — 07-04/08-03 family held |
| Single-rAF | scene 2 · clouds/aurora/parallax 0 · idle-queue 0 rAF + exactly 1 code setTimeout (verbatim Safari shim) · meteors/starfield 0 · fig01 2 |
| Zero deck imports / zero-hex / source-over-only | 0 / 0 (`--aurora` #bfe8df in tokens.css only) / 0 |
| Reduced-motion still | two shots 2s apart **byte-identical** (273,878 B); clouds in margins (cover 72%) AND column band (max 5) + aurora (mean 12.94) — the marquee: `battery/reduced-motion-still-1440x900.png` |
| Pause machine | hidden + fig01-active canvas-hash pairs identical (canvas-hash instrument: camper-glow CSS pulse legitimately animates outside RM; the pause contract is the canvas) |
| Canvas never transformed | canvas + host `none` at rest AND mid-nudge, both viewports (camper at −11.09/−18.00 matrix mid-window) |
| Shed ladder | far coverage 0.213 → **0.029** at dm=4 (tier 1), stays shed at dm=2 (tier 3); near + aurora intact; 375w width-only tier 3: near clouds legible (cover 15%), aurora gracefully absent (margin 18px < 48), **parallax fires** (camper −10.91 matrix), canvas `none` — `battery/shed-ladder-375w.png` |
| Leak gate | /work/* + /404: 0 nightsky / 0 /sky/ / 0 script tags; ambient chunk referenced by index.html only — airtight |

### Task 3 — close-out (796255a)
AMB-05 → Complete in REQUIREMENTS.md (checkbox + traceability — all five AMB rows Complete). ROADMAP: Phase 9 `[x]` completed 2026-07-19, Plans 3/3 complete, all plan boxes ticked, progress row Complete. STATE: phase 9 complete with the measured ambient budget, the shipped ladder heuristic, the re-proved invariants, and next = plan Phase 10.

## Carried-note resolutions (from 09-02)

1. **(a) RM still missing clouds in the column band — FIXED (Rule 2, Task 1).** Root cause was a real race, not a capture artifact: the first static paint always precedes the idle-queued sprite drain, and under RM nothing ever repainted. The `requestRepaint` seam closes it; battery proof: column-band max alpha **5** (was **0**), margins cover 72%, still byte-identical.
2. **(b) aurora curtain side edges vertical — deliberately NOT changed.** Only the TOP edge undulates, exactly as specified; the visual pass found no need for lateral softening. The offscreen-pass lever (research Open Question 2) stays documented as an optional Phase-10 aesthetic lever.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Reduced-motion still permanently cloudless when RM is set at load**
- **Found during:** Task 1 (pre-battery analysis of the 09-02 carried note; battery confirmed the fix)
- **Issue:** clouds' idle-queued sprite drain always lands after `adoptLayer0`'s synchronous `renderStaticFrame()`; with no loop running under reduced motion, the drained sprites were never painted — the "beautiful still" shipped without clouds for OS-level RM users.
- **Fix:** optional `requestRepaint` in `CloudsInitOptions` invoked on drain adoption; scene.ts passes a paused-only gate (`rafId === null` → static repaint).
- **Files modified:** src/lib/nightsky/clouds.ts, src/lib/nightsky/scene.ts
- **Commit:** 41fa988

### Notes (not deviations)
- **Soak marginal framing:** the plan's RM-baseline design measures the ENTIRE animated scene (+4.26pp), not the four new systems. The 0.3–0.7pp projection is measured against 08's 6.10% glass-live reference: −0.61pp ≈ 0 within noise. The blowout clause was NOT triggered — desktop 1440 fits the <10% floor with everything live at tier 0, no shedding.
- **Battery instrument iteration (evidence tooling only, zero product code):** max-alpha canvas probes are polluted by baked Layer-0 star/moon pixels; the committed `capture-battery.mjs` uses haze-coverage/mean statistics, the right-margin far-only strip (no aurora/moon/MW by construction), and deterministic RM emulation. Two intermediate runs during instrument development are recorded here for transparency; the final run is ALL PASS.
- **idle-queue setTimeout grep counts 3:** 2 are documentation comments; the CODE contains exactly 1 — the verbatim Safari shim (09-01 precedent). File untouched since 311a7b8.
- **Lighthouse via transient npx** (13.4.0) per the Phase 4/5/7/8 precedent — package.json/lock/config byte-identical (asserted in grep-invariants.txt).
- The hidden/fig01 pause pairs use canvas dataURL hashes rather than full screenshots because the camper-glow CSS pulse legitimately keeps animating outside reduced motion; RM uses full-screenshot byte-identity (CSS animations media-gated off).

## Known Stubs

None — the 09-01/09-02 seams (`setFarShed`, `setShapeThrottle`, `chromaticNudgeEnabled`) are now all wired to the tier heuristic; no stubs remain in the ambient stack.

## Threat register disposition

- **T-09-07 (ambient never stops on pause): MITIGATED** — capture-pair proofs identical under hidden/fig01/RM + single-rAF greps.
- **T-09-08 (constrained-device load): MITIGATED** — ladder sheds in the locked order, recomputed per adopt/resize; parallax proven intact at 375w; narrow-width capture committed.
- **T-09-09 (composite legibility): MITIGATED** — `--cdp-screenshot` arbiter PASS both viewports, `failing[]` inspected empty on the tall panels.
- **T-09-SC (supply chain): HELD** — zero installs; soak/capture drivers are node built-ins (+ the repo's existing transitive sharp for crops); package.json/lock/config untouched.

## Commits

| Task | Commit | Description |
|---|---|---|
| 1 | 41fa988 | Mobile degradation ladder + RM cloud drain-repaint (Rule 2) |
| 2 | 0d3f618 | Full closing battery GREEN — soak 5.49%, all gates both viewports |
| 3 | 796255a | Phase 9 close-out — AMB-01..05 Complete, ROADMAP 3/3, STATE advanced |

## Self-Check: PASSED
- src/lib/nightsky/scene.ts (computeAmbientTier) — FOUND
- .planning/phases/09-living-sky/ambient-soak/ambient-soak.mjs — FOUND
- .planning/phases/09-living-sky/battery/battery-summary.md + capture-report.json + 4 PNGs — FOUND
- Commits 41fa988, 0d3f618, 796255a — FOUND in git log
- AMB-01..05 all Complete in both REQUIREMENTS lists — VERIFIED
