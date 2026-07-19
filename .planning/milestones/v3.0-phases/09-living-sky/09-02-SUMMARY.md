---
phase: 09-living-sky
plan: 02
subsystem: nightsky-ambient
tags: [canvas, aurora, noise-table, breathing, luminance-gate, single-raf, left-margin, source-over]
requires:
  - "09-01: idle-queue/clouds handle idiom + scene.ts Layer-1.5 wiring pattern; comment-string grep discipline"
  - "07-03: transparent Layer 0 (photo provides sky), moon baked as final Layer-0 unit, mwBox photo comparator"
  - "05.1-01: --moon gate pattern (launchChrome/Cdp/READY_PROBE, moonPeak < mwPeak assertion this plan mirrors)"
provides:
  - "--aurora token (#bfe8df) in tokens.css — the one sanctioned hue-family exception; SkyTokens.aurora bridge"
  - "aurora.ts: 3 deterministic left-margin curtains, 96-sample sine-sum noise table, per-frame alpha sine (0.07-0.17), 4-frame shape throttle (<=1.5px edge step), AURORA_ALPHA_CEILING 0.20 hard cap, setShapeThrottle seam"
  - "scene.ts Layer 1.25: aurora advance/draw after the Layer-0 blit, over the moon, before clouds; drawStatic at fixed mid-breath"
  - "verify-contrast.mjs --aurora: full-cycle max sampling (N*I >= 21s), point-feature erosion, max(auroraPeak) < mwPeak both viewports"
affects:
  - "09-03: wires setShapeThrottle(8-10) as mobile-ladder tier 2; closing battery re-proves the full ambient stack"
tech-stack:
  added: []
  patterns:
    - "Deterministic noise (pure sine sum, no random jitter) so the reduced-motion still is byte-identical every render"
    - "Relative gradient stops + globalAlpha multiplier: the 0.20 ceiling stays analytic (pixel <= token x 0.20) at every stop"
    - "Point-feature erosion (separable min filter) in a luminance gate: measure the area-scale feature, not the point features sharing its box"
key-files:
  created:
    - src/lib/nightsky/aurora.ts
    - ".planning/phases/09-living-sky/evidence/ (8 aurora PNGs — see Evidence index)"
  modified:
    - src/styles/tokens.css
    - src/lib/nightsky/tokens.ts
    - src/lib/nightsky/scene.ts
    - scripts/verify-contrast.mjs
decisions:
  - "Curtain layout/undulation is fully deterministic (fixed fractions + fixed phase offsets + jitter-free noise table) — reduced-motion determinism proven at 0 differing bytes across captures"
  - "Gradient stops carry RELATIVE alpha; the live breathing alpha rides globalAlpha at fill time — the hard cap bounds every stop by construction"
  - "--aurora gate erodes sub-window point features (~7 CSS px separable min) before taking the peak: the raw box peak is dominated by pre-existing margin stars/moon that carry their own gates; raw peak still reported, never asserted"
  - "No idle-queue use: the 96-sample table build is a one-time ~300-op loop — direct init build, offscreen-upscale optimization stays deferred per research Open Question 2"
metrics:
  duration: "~24 min"
  completed: "2026-07-19"
  tasks: 3
  files: 5
status: complete
---

# Phase 9 Plan 02: Aurora Token + Module + Luminance Gate Summary

**One-liner:** A breathing 3-curtain teal-white aurora (AMB-03) confined to the left margin by construction — per-frame alpha sine 0.07–0.17 hard-capped at 0.20 in code, 4-frame shape throttle with a ≤1.5px edge step, composited over the moon and before the clouds on the single rAF tick — with a new `--aurora` verify mode proving its full-cycle peak (0.1018 @1440, 0.0384 @1280) stays far below the Milky-Way core (0.4748 / 0.4695) at both viewports.

## What was built

### Task 1 — `--aurora` token + bridge (26d8a1b)
- `tokens.css`: `--aurora:#bfe8df` immediately after `--star`, with the 09-UI-SPEC Token Manifest exception comment (the one sanctioned step outside the 200–230° hue family). No other token touched; glass/scrim/photo values locked and unmodified.
- `tokens.ts`: `SkyTokens.aurora` read via `readToken(styles, '--aurora')` — cache stays identity-stable, zero hex literals in the bridge.

### Task 2 — aurora.ts + scene wiring (6f96ca0)
- **aurora.ts (AMB-03):** handle-shaped (`advance/draw/drawStatic/resize/setShapeThrottle/teardown`), zero owned animation-frame scheduling, zero timers, zero hex, source-over only. 96-sample `Float32Array` noise table (sum of non-harmonic sines, periods 17/29/41, normalized [0,1], linear interpolation, deterministic — no random jitter). Three curtains at fixed fractions of the margin box `[8, columnLeft−8]` (1440 → x:8–272; 1280 → x:8–192) with independent noise phase offsets (0 / 37.3 / 71.9 samples) and per-curtain height offsets; below a 48px margin width nothing renders (twinkle-pool graceful-empty rule). Vertical box: base fixed 0.85H; top breathes 0.49H–0.55H in phase with the alpha sine (`envelope = 0.12 + 0.05·sin(ts/20000·2π)`), then `alpha = min(envelope, AURORA_ALPHA_CEILING=0.20)` — the hard in-code cap. Alpha evaluated every frame; shape (noise drift + top-edge path + gradient) rebuilt every `shapeEveryN` frames (default 4), each repaint advancing the noise phase by exactly 1.5px of edge displacement (0.1875 samples × 8px/sample). Fill: 5-stop vertical `createLinearGradient` (relative alphas 0→1→0.62→0.28→0) in `tokens.aurora`, multiplied by the live alpha via `globalAlpha` inside save/restore.
- **scene.ts:** Layer 1.25 — `auroraHandle.advance(ts); auroraHandle.draw(...)` immediately after the Layer-0 blit and before the 09-01 cloud block (over the moon, physically correct, per 09-UI-SPEC; supersedes the RESEARCH diagram's tentative last-layer placement). `renderStaticFrame` draws the aurora once at the exact mid-breath (alpha 0.12, top 0.52H, drift 0) before the clouds' static draw. `resize` wired in `adoptLayer0` before the static paint; teardown wired. scene.ts still owns exactly 2 animation-frame references.

### Task 3 — verify-contrast.mjs `--aurora` gate (5885d76 + fix 25bb072)
- `sampleAuroraOnce()`: fully self-contained sibling of `sampleMoonOnce` (own inline `deviceRect`/`compositedPeakOf`/`photoPeakOf`) — the locked moon path untouched. Aurora box x:8–(columnLeft−8), y:0.49H–0.85H; mwBox is the SAME comparator the moon gate uses (x:0.80–0.98, y:0.30–0.60); box disjointness asserted Node-side (left margin vs right margin — never self-referential).
- `auroraMain()`: 24 samples × 900ms = 21.6s ≥ the 20s breathing period (window size enforced ≥21s), running MAX of the composited aurora peak — any window ≥ the period provably contains the envelope peak. Asserts `max(auroraPeak) < mwPeak` strictly, exits non-zero on failure. CLI branch + usage string added.

## Verification evidence

| Check | Result |
|---|---|
| `npm run build` / `npx astro check` | green / 0 errors, 0 warnings (after every task) |
| `--aurora` 1440×900 | **PASS**: max auroraPeak **0.1018** < mwPeak **0.4748** (24 samples / 21.6s; raw box peak 0.586 = point features, reported not asserted) |
| `--aurora` 1280×800 | **PASS**: max auroraPeak **0.0384** < mwPeak **0.4695** |
| `--moon` regression (aurora live over the moon) | PASS both: 1440 moonPeak 0.2258 < 0.4748; 1280 moonPeak 0.2580 < 0.4695 |
| `--selftest` | PASS (moon fixtures intact) |
| `--cdp-screenshot` 1440×900 / 1280×800 | PASS / PASS (all surfaces ≥ threshold with aurora + clouds live) |
| Left-margin confinement (canvas alpha scan, aurora band y:0.49–0.85H) | 1440: column max alpha **4–6/255** (cloud-attenuation floor) vs left margin mean ~17/255 carrying the aurora; 1280: column max **4/255**. Zero aurora pixels in the column at both viewports |
| Breathing captured | left-band mean alpha 16.75/255 (t0) → 10.82/255 (t0+10s) — opposite envelope points, two stills |
| Reduced-motion fixed phase | `rmMatches: true`; two captures 3s apart: **0 differing bytes of 3,888,000** — deterministic mid-breath still; column band alpha 0 |
| Invariant greps | aurora.ts: rAF=0 timers=0 lighter=0 hex=0 deck-import=0 ceiling-constant=1; scene.ts rAF=2; fig01/render.ts rAF=2; tokens.ts hex=0 |
| package.json / .planning/config.json | untouched (`git diff` empty) |

**Evidence index** (`.planning/phases/09-living-sky/evidence/`):
- `aurora-full-1440x900.png`, `aurora-full-1280x800.png` — full glass composite, aurora live
- `aurora-canvas-only-1440x900.png`, `aurora-canvas-only-1280x800.png` — canvas isolated: 3 wavy-topped curtains unambiguous in the left margin, moon visible through curtain 1, column + right margin clear
- `aurora-over-moon-closeup-1440x900.png` — crescent through the curtain (canvas-only crop)
- `aurora-breath-t0-1440x900.png`, `aurora-breath-t10-1440x900.png` — ~10s apart, opposite envelope points
- `reduced-motion-aurora-1440x900.png` — fixed mid-breath still (byte-identical across captures)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] --aurora sampler attributed pre-existing point features to the aurora**
- **Found during:** live-gate run (verification section)
- **Issue:** the raw box peak was a neutral-white 0.891-luminance pixel `[242,242,243]` — a margin-confined twinkle/constellation star, analytically impossible for a ≤0.20-alpha teal area fill over the dark left-margin photo (composited ceiling ≈0.19). The box (which the spec places around the whole curtain area) also contains the moon and the margin star pools, all pre-dating this plan — the literal assertion failed independent of aurora brightness (dimming to zero would still fail).
- **Fix:** separable min-filter erosion (~7 CSS px window, DPR-scaled) before taking the peak — any feature narrower than the window (star disks ≤ ~5 CSS px) is eliminated while the aurora's slow-varying area luminance is untouched, so a broad too-bright aurora regression still fails the gate. Raw un-eroded peak reported alongside for transparency, never asserted.
- **Files modified:** scripts/verify-contrast.mjs
- **Commit:** 25bb072

### Notes (not deviations)
- The prompt's escalation clause ("dim within spec ranges / STOP") was not triggered: the aurora itself was never over the ceiling — the eroded peaks (0.1018 / 0.0384) sit at the design-time estimate (~0.13–0.15 upper bound) with 4.7×/12× margin below mwPeak. No palette or alpha values were changed.
- The evidence capture's reduced-motion still showed the static clouds absent from the column band scan (max alpha 0 vs the live 4/255 floor) — a pre-existing 09-01 static-paint/sprite-drain timing behavior, not introduced by this plan (aurora renders in the RM still; 09-03's closing battery re-proves the full RM composition).
- Curtain side edges are vertical (only the TOP edge undulates, exactly as specified); if 09-03's visual pass wants softer lateral falloff, an offscreen-buffer pass (the deferred research Open Question 2 optimization) is the natural seam.

## Known Stubs
- `setShapeThrottle(everyN)` defaults to 4 and is not wired to any trigger — the intentional 09-03 mobile-ladder tier-2 seam (documented in the plan).

## Self-Check: PASSED
- src/lib/nightsky/aurora.ts — FOUND
- --aurora token in src/styles/tokens.css — FOUND
- --aurora mode in scripts/verify-contrast.mjs — FOUND
- 8 evidence PNGs in .planning/phases/09-living-sky/evidence/ — FOUND
- Commits 26d8a1b, 6f96ca0, 5885d76, 25bb072 — FOUND in git log
