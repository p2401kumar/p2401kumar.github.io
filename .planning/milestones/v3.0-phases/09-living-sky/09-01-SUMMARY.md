---
phase: 09-living-sky
plan: 01
subsystem: nightsky-ambient
tags: [canvas, clouds, parallax, scintillation, idle-queue, single-raf, column-governor, reduced-motion]
requires:
  - "08-02/08-03: gate-certified glass CSS + the measured 6.10% CPU baseline the ambient budget rides on"
  - "07-03: transparent Layer 0 (photo provides sky), margin-confined twinkle metadata, contentColumnEdges mirror"
  - "05-04/05-05: scene.ts single-rAF engine + constellations.ts handle idiom (the shape clouds.ts/parallax.ts mirror)"
provides:
  - "idle-queue.ts: shared requestIdle/drainQueue (verbatim extraction from starfield.ts, Safari shim intact)"
  - "clouds.ts: far wisps (0.72H, peak 0.08, 3px/s) + near banks (0.78H, peak 0.13, 6px/s), seamless wraparound blit, x0.15/80px-smoothstep column governor, 9px/60ms-delay/480ms panel-change nudge, setFarShed seam"
  - "parallax.ts + .camper keyframes: 18px/420ms nudge-and-settle ground layer, reduced-motion double-gated"
  - "scene.ts: Layer 1.5 clouds hook, 2-oscillator scintillation (0.12-0.18 slow + 0.04-0.07/400-700ms flutter), +/-8% chromatic nudge on the 3 brightest, chromaticNudgeEnabled seam"
affects:
  - "09-02: aurora module rides the same idle-queue + handle shape; draws between Layer-0 blit and clouds"
  - "09-03: wires setFarShed (tier 1) + chromaticNudgeEnabled (tier 3) mobile-ladder seams; closing battery re-proves everything"
tech-stack:
  added: []
  patterns:
    - "Handle-shaped ambient module (advance/draw/drawStatic/resize/teardown), zero owned rAF/timers — pause machine covers it for free"
    - "destination-in alpha stencil on a reusable band buffer: live column attenuation without baking the column into drifting sprites"
    - "Blob drawn at x and x+/-tileWidth during generation = lossless wraparound tile at any offset"
    - "JS cubic-bezier(0.16,1,0.3,1) evaluator so canvas offsets share the deck's CSS easing family without transforming the canvas"
key-files:
  created:
    - src/lib/nightsky/idle-queue.ts
    - src/lib/nightsky/clouds.ts
    - src/lib/nightsky/parallax.ts
    - .planning/phases/09-living-sky/evidence/ (7 PNGs: clouds/scene-only/canvas-only both viewports, parallax mid-nudge, reduced-motion still)
  modified:
    - src/lib/nightsky/starfield.ts
    - src/lib/nightsky/scene.ts
    - src/components/NightSky.astro
decisions:
  - "Sprites + band buffer are 1x CSS-px (not DPR-scaled): cloud content is soft gradient haze, the dpr upscale is imperceptible and halves memory/fill cost"
  - "Layer alpha ceilings applied at blit time via buffer globalAlpha (sprite content authored <=1.0) — 0.08/0.13 are hard peaks by construction"
  - "Cloud nudge mirrors the camper keyframe shape (peak at 35% of the window) so ground and mid layer read as one gesture, 60ms/60ms-longer offset"
  - "Chromatic trio alternates cool/warm (210/35) only when a star is effectively neutral (S<0.02); tinted stars keep their own hue anchor"
metrics:
  duration: "~21 min"
  completed: "2026-07-19"
  tasks: 3
  files: 6
status: complete
---

# Phase 9 Plan 01: Idle-Queue Extraction + Clouds + Parallax + Scintillation Summary

**One-liner:** Two column-governed drifting cloud layers, an 18px camper / 9px cloud nudge-and-settle parallax, and 2-oscillator scintillation with a chromatic nudge on the 3 brightest — all riding scene.ts's single rAF with zero new timers, the canvas never CSS-transformed, and the contrast gate green at both viewports.

## What was built

### Task 1 — idle-queue extraction + clouds + scene wiring (311a7b8)
- **idle-queue.ts:** `requestIdle`/`drainQueue` + `IdleDeadlineLike`/`WorkUnit` moved VERBATIM out of starfield.ts and exported. The Safari setTimeout shim is byte-identical — behavior-preserving by construction (build + astro check green; canvas-only evidence shows moon/twinkle pool unchanged).
- **clouds.ts (AMB-01):** far wisps (band 0.64–0.80H, 4–6 elongated 6:1–10:1 blobs, peak margin alpha 0.08, 3 CSS-px/s) + near banks (0.71–0.85H, 3–5 clusters of 3–4 rounder 2:1–3:1 blobs, peak 0.13, 6 px/s). Every blob is a 5-stop radial gradient in `--milkyway` with a `--sky-horizon` zero-alpha outer terminator (anti-banding, cooler falloff). Sprites are generated chunked through the shared idle queue, only on `resize()`, with last-good sprites retained until the new pair drains. Per frame: 4 sprite `drawImage` calls into one reusable band buffer, one `destination-in` stencil fill (alpha 1.0 margins → 0.15 column with 80px smoothstep ramps at the mirrored `contentColumnEdges`), one masked-buffer blit — compositing reset to source-over immediately.
- **AMB-02 mid layer:** clouds' own independent `nightsky:panel-change` listener records a `9 * -direction` px nudge starting 60ms after the event, easing to peak at 35% and back to 0 over 480ms on a JS cubic-bezier(0.16,1,0.3,1) — added on top of drift at blit time (drift never mutated; bounded settle-to-0, T-09-03). Reduced motion: instant settle, no animation.
- **scene.ts:** clouds init after tokens; `resize()` before the static paint in `adoptLayer0`; Layer 1.5 advance/draw between the Layer-0 blit and the twinkle loop; `drawStatic` in `renderStaticFrame` (fixed phase, peak margin alpha, nudge 0 — a beautiful still); teardown wired; stale header comment updated.

### Task 2 — 2-oscillator scintillation + chromatic nudge (82de460)
- Primary oscillator trimmed 0.15–0.25 → 0.12–0.18; new secondary flutter 0.04–0.07 at 400–700ms random per star — combined envelope ~0.16–0.25, statistically today's range (textured, not brighter).
- The 3 largest-radius pool entries (picked once per generation, deterministic) carry `chromatic` base-HSL anchors; per frame their saturation swings ±0.08 in phase with their own slow oscillator, clamped to the 0.3 jitter cap. Neutral stars borrow the jitterStarColor 210°/35° pair, alternated across the trio.
- `hslToRgb` exported from starfield.ts (reused verbatim); local `rgbToHsl` helper in scene.ts; `chromaticNudgeEnabled` module seam for 09-03's tier-3 shed. Pool count, `TWINKLE_SUBSET_FRACTION`, and margin containment untouched; reduced-motion static frame still omits the twinkle subset entirely.

### Task 3 — camper parallax (48c80a3)
- **parallax.ts:** independent literal-event listener; direction from index delta (`|| 1` default forward); reduced-motion returns before touching classList; remove-both → forced reflow → re-add for clean rapid-fire restarts; teardown removes the listener. Zero rAF/timers/canvas involvement.
- **NightSky.astro:** `camper-parallax-nudge-fwd/back` keyframes (0 → ∓18px at 35% → 0, 420ms, deck's cubic-bezier(0.16,1,0.3,1)), co-located with `.camper` for Astro scoping; `@media (prefers-reduced-motion: reduce) { animation: none }` defense-in-depth; `initParallax()` booted in the existing single script path. No transform anywhere near `#nightsky-canvas`/`.nightsky-host`.

## Verification evidence

| Check | Result |
|---|---|
| `npm run build` / `npx astro check` | green / 0 errors (after every task) |
| Contrast gate `--cdp-screenshot` 1440×900 | PASS (exit 0) |
| Contrast gate `--cdp-screenshot` 1280×800 | PASS (exit 0) |
| `verify-banding.mjs --selftest` | PASS |
| Canvas transform at rest | `none` (both viewports) |
| Canvas + host transform mid-nudge | `none` / `none` while `.camper` = `matrix(1,0,0,1,-17.9777,0)` (≈−18px peak, frozen at ~140ms of 420ms) |
| Camper settled state | transform `none` after 600ms |
| Reduced motion | `rmMatches: true`; panel change applies NO nudge class, camper transform `none`; clouds present in the static frame (band alpha > 0) |
| Column attenuation (canvas alpha x-profile, 1440) | margins avg 0.030 (peaks 0.042), column interior ~0.001 with smooth ramps at x=280/1160; 1280 margins 0.012 vs column 0.0024 |
| Invariant greps | clouds.ts/parallax.ts: rAF=0 timers=0 lighter=0 hex=0 deck-import=0; idle-queue.ts: rAF=0 hex=0 deck-import=0 (setTimeout=1 — the verbatim Safari shim, plan-sanctioned); scene.ts rAF=2; fig01/render.ts rAF=2; starfield imports the extracted scheduler |
| package.json / .planning/config.json | untouched (`git diff --stat` empty) |

**Evidence index** (`.planning/phases/09-living-sky/evidence/`):
- `clouds-1440x900.png`, `clouds-1280x800.png` — full deck view (visually matches the 08-approved glass baseline)
- `scene-only-clouds-1440x900.png`, `scene-only-clouds-1280x800.png` — deck hidden, photo visible
- `canvas-only-clouds-1440x900.png` — canvas isolated: clouds unambiguous in the lower-sky margins, ghosted under the column; moon/constellations/fireflies intact (Layer-0 extraction spot-check)
- `parallax-mid-nudge-1440x900.png` — camper frozen at −17.98px, canvas untransformed
- `reduced-motion-still-1440x900.png` — complete motionless composition with clouds at fixed phase

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] starfield.ts imports `{ drainQueue, type WorkUnit }` only (plan text listed `requestIdle` too)**
- **Found during:** Task 1
- **Issue:** starfield.ts never calls `requestIdle` directly (it lives inside `drainQueue`); importing it would fail `astro check` under the strict preset's noUnusedLocals.
- **Fix:** import narrowed to what is used; `requestIdle` remains exported from idle-queue.ts for 09-02's aurora.
- **Commit:** 311a7b8

**2. [Rule 1 - Bug] clouds.ts header comment tripped the rAF grep gate**
- **Found during:** Task 1 verification
- **Issue:** the doctrine comment contained the literal string "requestAnimationFrame", which the plan's `grep -o | wc -l` convention counts.
- **Fix:** comment reworded ("zero animation-frame scheduling"); code unchanged.
- **Commit:** 311a7b8

### Notes (not deviations)
- Seamless tiling is implemented as each blob drawn at x and x±tileWidth during generation — the general lossless form of the spec's "rightmost ~120px repeated at the left edge" technique (strict superset: any overhang wraps, both edges).
- idle-queue.ts necessarily contains one `setTimeout` — the VERBATIM Safari requestIdleCallback shim the plan mandates preserving. The plan's own verification greps assert zero timers in clouds.ts/parallax.ts only, deliberately excluding the shim.

## Known Stubs
- `setFarShed(false)` default and `chromaticNudgeEnabled = true` are intentional seams for 09-03's mobile degradation ladder (documented in the plan; not wired to any trigger yet).

## Self-Check: PASSED
- src/lib/nightsky/idle-queue.ts — FOUND
- src/lib/nightsky/clouds.ts — FOUND
- src/lib/nightsky/parallax.ts — FOUND
- .planning/phases/09-living-sky/evidence/ (7 PNGs) — FOUND
- Commits 311a7b8, 82de460, 48c80a3 — FOUND in git log
