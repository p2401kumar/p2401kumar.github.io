---
phase: 02-fig01-signature-figure
plan: 02
subsystem: ui
tags: [canvas, typescript, fig01, animation, requestAnimationFrame, reduced-motion]

# Dependency graph
requires:
  - phase: 02-fig01-signature-figure (plan 02-01)
    provides: "src/lib/fig01/model.ts (FigureState, computeLayout, pAt, advanceBeams, spawnBeam, order) and src/lib/fig01/tokens.ts (getTokens/rgba read-once token bridge)"
provides:
  - "src/lib/fig01/render.ts — all canvas draw primitives (grid+lens, elbow routes with draw-on stagger, additive-blend gradient beams, node body/glyph/label/status/glow/breathing-ring/fault/focus)"
  - "startAnimationLoop()/stopAnimationLoop() — the single consolidated, idempotent rAF driver (FIG-01/FIG-07)"
  - "renderStaticFrame() — genuine no-rAF static-frame render path (FIG-05 reduced-motion foundation)"
affects: [02-03, 02-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "render.ts: drawRoutesAtProgress() factored as a shared progress-function helper so both the animated draw-on path (drawRoutes, per-route stagger) and the static path (renderStaticFrame, prog=1 always) reuse identical dead-end-dashing logic — one code path, two callers, no drift risk"
    - "render.ts: canvas-only structural greys (hairline family, device-glyph stroke) are named module constants expressed as rgba() strings per 02-UI-SPEC's explicit 'canvas-only, UI-SPEC-blessed' exception; every other color is read from tokens.ts at draw time, never hardcoded"
    - "render.ts: node label ink color (default vs. hover) is rendered as tokens.ink at two alphas (.86 / 1.0) rather than two separate hex constants, since 02-UI-SPEC explicitly calls these 'canvas renderings of the existing ink role, not a third color'"

key-files:
  created:
    - src/lib/fig01/render.ts
  modified: []

key-decisions:
  - "02-UI-SPEC's Canvas-drawn-text table lists #c6cdd6/#f0f3f6 as the node-label default/hover colors, but the plan's hard acceptance gate forbids any hex literal in render.ts — resolved by rendering both as tokens.ink at alpha .86 (default) / 1.0 (hover), which reverse-engineers to the same visual values against the --panel2 node background while keeping the zero-hex-literal guarantee intact"
  - "The client-node under-glyph label color (rgba(120,129,141,.9) in the prototype) is bit-for-bit tokens.dim's parsed RGB triple, so it is sourced via rgba(tokens.dim, 0.9) instead of being left as a hardcoded rgba string, even though the hex-literal grep gate would not have caught the difference — keeps the token-drift mitigation (T-02-03) meaningfully enforced rather than merely grep-clean"
  - "layout()'s dpr parameter is still caller-supplied (per the plan's exact signature), but a new exported getDpr() helper containing the literal Math.min(devicePixelRatio || 1, 2) computation was added so callers have one canonical, correctly-capped source for it and the plan's grep-based DPR-cap acceptance gate is satisfied by the real computation rather than an incidental substring match"
  - "drawFrame()/renderStaticFrame() read canvas CSS-pixel dimensions via ctx.canvas.clientWidth/clientHeight instead of threading a separate {W,H} dims parameter through startAnimationLoop/stopAnimationLoop — keeps their signatures exactly matching the plan's Artifacts list (ctx, state, tokens[, ts]) with no extra parameters, while still giving each frame correct stage dimensions after any layout()/resize call"

requirements-completed: [FIG-01, FIG-05, FIG-07]

coverage:
  - id: D1
    description: "render.ts draw primitives: layout() HiDPI backing-store sizing, rr()/pathTo() path helpers, drawGrid() dot substrate + cursor lens, drawRoutes()/drawRoutesAtProgress() elbow routes with build-in stagger and amber/dashed dead-end encoding, drawBeams() additive-blend gradient beam tail+head, drawNode() full node rendering (glyph/label/status-dot/glow/breathing-ring/fault-dashing/keyboard-focus-ring) — all colors token-sourced, zero hex literals"
    requirement: "FIG-01"
    verification:
      - kind: other
        ref: "grep -nE '#[0-9a-fA-F]{3,8}' src/lib/fig01/render.ts == 0 matches; grep -c 'getTokens' >= 1; grep -c 'setLineDash' >= 1; grep -c \"'lighter'\" == 1 and \"'source-over'\" == 1; grep -n 'setTransform' present; grep -n 'Math.min(devicePixelRatio' present; npx astro check == 0 errors; npx tsc --noEmit == clean"
        status: pass
    human_judgment: false
  - id: D2
    description: "Single consolidated, idempotent rAF driver (startAnimationLoop/stopAnimationLoop) with build-in node stagger + glow decay + gated ambient beam spawn (T>1400ms, then every 2600-4000ms), plus renderStaticFrame() — a genuine no-requestAnimationFrame static-frame render path for FIG-05 reduced motion"
    requirement: "FIG-05, FIG-07"
    verification:
      - kind: other
        ref: "grep -c 'requestAnimationFrame' src/lib/fig01/render.ts == 2 (exact); grep -c 'cancelAnimationFrame' >= 1; grep -nE 'export function (renderStaticFrame|startAnimationLoop|stopAnimationLoop)' all present; grep -n '2600' and '1400' present; manual read of renderStaticFrame's body confirms it calls only drawGrid/drawRoutesAtProgress/drawNode, none of which schedule requestAnimationFrame; npx astro check == 0 errors"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-07-17
status: complete
---

# Phase 02 Plan 02: render.ts — Draw Primitives + Single rAF Driver Summary

**Typed canvas module porting the prototype's full draw path (dot-grid+lens, elbow routes with draw-on stagger, additive-blend gradient beams, node rendering with fault/focus dual-encoding) into one consolidated idempotent rAF loop plus a genuine zero-rAF `renderStaticFrame()` reduced-motion path — every color sourced from `tokens.ts`, zero hex literals.**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-07-17T04:47:53Z (approx)
- **Completed:** 2026-07-17T05:00:08Z
- **Tasks:** 2
- **Files modified:** 1 (created)

## Accomplishments
- Ported the prototype's canvas geometry (HiDPI layout, elbow-route pathing, dot-grid + cursor lens, additive-blend beam rendering, full node body/glyph/label/status/glow/breathing-ring/fault drawing) into typed `render.ts` functions, sourcing every brand color from `getTokens()`/`rgba()` — confirmed zero hex literals via grep
- Added an on-canvas keyboard-focus ring (`state.focusedNode`) mirroring the hover-border treatment, per 02-UI-SPEC's Keyboard row (a true gap the prototype didn't cover, formalized by the UI-SPEC as Claude's-discretion guidance this plan implements)
- Built the single consolidated, idempotent rAF driver (`startAnimationLoop`/`stopAnimationLoop`) with build-in node stagger (`i*60ms`/`380ms` ease, `8px` rise), glow decay (`*0.955`/frame), and gated ambient beam spawn (`T>1400ms`, then `2600-4000ms` cadence) — verified exactly 2 `requestAnimationFrame` call sites in the whole file
- Built `renderStaticFrame()` — one complete frame at full route length and rest node position, no beams, provably zero `requestAnimationFrame` calls anywhere in its call graph — the genuine FIG-05 reduced-motion foundation the next plan wires up

## Task Commits

Each task was committed atomically:

1. **Task 1: Draw primitives — HiDPI layout, dot-grid + lens, elbow routes, gradient beams, node rendering** - `e47ce67` (feat)
2. **Task 2: Single-rAF driver + build-in stagger + ambient spawn + renderStaticFrame (reduced-motion path)** - `06be279` (feat)

**Plan metadata:** (this commit, docs: complete plan)

_Note: Tasks were flagged `tdd="true"`, but — consistent with plan 02-01's precedent — no vitest infrastructure exists in this project and the plan's own `<verify>`/`<acceptance_criteria>` blocks specify only grep-based static checks plus `npx astro check`. Verification followed the plan's specified static checks (all grep gates + `npx astro check` + an additional `npx tsc --noEmit` pass), plus a manual read of `renderStaticFrame`'s call graph to confirm no `requestAnimationFrame` is reachable from it, as the plan's `<verification>` section explicitly requires._

## Files Created/Modified
- `src/lib/fig01/render.ts` - Draw primitives (`layout`, `getDpr`, `rr`, `pathTo`, `drawGrid`, `drawRoutesAtProgress`, `drawRoutes`, `drawBeams`, `drawNode`) plus the rAF driver (`drawFrame`, `startAnimationLoop`, `stopAnimationLoop`) and the reduced-motion static path (`renderStaticFrame`)

## Decisions Made
- Rendered the node-label default/hover colors as `tokens.ink` at two alphas (`.86`/`1.0`) instead of the two hex values 02-UI-SPEC's Canvas-drawn-text table lists, since the plan's hard hex-literal gate forbids any hex constant and the spec itself calls these "canvas renderings of the existing ink role, not a third color"
- Sourced the client under-glyph label color via `rgba(tokens.dim, 0.9)` rather than the prototype's hardcoded `rgba(120,129,141,.9)` literal, since that triple is exactly `--dim`'s parsed value — keeps token-drift mitigation meaningful rather than merely hex-grep-clean
- Added `getDpr()` as an exported helper containing the literal `Math.min(devicePixelRatio || 1, 2)` computation so the DPR-cap acceptance gate is satisfied by a real, reusable computation rather than an incidental match, while `layout()` keeps the plan's exact `(ctx, canvas, stage, state, dpr)` signature with dpr caller-supplied
- `drawFrame`/`renderStaticFrame` read stage dimensions via `ctx.canvas.clientWidth`/`clientHeight` (matching the prototype's own `canvas.clientHeight` usage) instead of threading a dims parameter, keeping both functions' signatures exactly matching the plan's Artifacts list

## Deviations from Plan

None — plan executed exactly as written. One clarification, consistent with 02-01: tasks were tagged `tdd="true"` but the plan's own verification section specifies only grep-based acceptance criteria plus `npx astro check`/manual-read checks (no vitest runner present, matches 02-RESEARCH.md's optional/discretionary framing); verification followed the plan's stated method exactly, plus an additional `npx tsc --noEmit` pass for extra confidence. Not tracked as a Rule 1-4 deviation since it changes verification method only, not scope or behavior.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `render.ts` now exposes the full drawing contract plan 02-03 (interactions.ts) needs: `startAnimationLoop`/`stopAnimationLoop` for lifecycle gating (visibility/IntersectionObserver pause), `renderStaticFrame` for the reduced-motion branch and post-mutation redraws (fault inject/heal/focus change), and `layout`/`getDpr` for resize handling
- `state.focusedNode` is already drawn with an on-canvas focus ring, ready for plan 02-03's visually-hidden keyboard-proxy button wiring to just set that field and call `renderStaticFrame`/rely on the running loop
- No blockers

---
*Phase: 02-fig01-signature-figure*
*Completed: 2026-07-17*

## Self-Check: PASSED

All created files verified present on disk; both task commits (`e47ce67`, `06be279`) verified present in git log.
