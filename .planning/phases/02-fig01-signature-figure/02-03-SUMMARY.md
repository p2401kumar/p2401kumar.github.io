---
phase: 02-fig01-signature-figure
plan: 03
subsystem: ui
tags: [canvas, typescript, fig01, accessibility, reduced-motion, keyboard, intersection-observer]

# Dependency graph
requires:
  - phase: 02-fig01-signature-figure (plan 02-01)
    provides: "src/lib/fig01/model.ts (FigureState, spawnBeam, injectFault, healFault, healthyCells, order) and src/data/fig01.ts (fig01Facts tooltip/accessible-name copy)"
  - phase: 02-fig01-signature-figure (plan 02-02)
    provides: "src/lib/fig01/render.ts (startAnimationLoop/stopAnimationLoop/renderStaticFrame/layout/getDpr — the entry points this plan branches between and calls on resize)"
provides:
  - "src/lib/fig01/interactions.ts — pointer hover/click, send/fault buttons, timestamped aria-live event log, setTimeout-based fault self-heal, prefers-reduced-motion branch point, dual-gate rAF lifecycle (IntersectionObserver + visibilitychange), keyboard proxy-button wiring"
  - "src/lib/fig01/index.ts — public initFig01(root: HTMLElement): () => void orchestrator + teardown"
affects: [02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "interactions.ts: a single module-scope `redraw()` closure (createRedraw) threaded through every wiring function (pointer/buttons/keyboard) — no-ops under animation (the running loop already repaints), calls renderStaticFrame under reduced motion — this one branch point is what keeps every interaction working identically in both motion modes"
    - "interactions.ts: the fault self-heal is a setTimeout returned by a scheduleHeal() factory (not a per-frame time comparison inside the animation loop), so it fires identically whether or not the loop is running"
    - "interactions.ts: lifecycle gating (IntersectionObserver + visibilitychange + live matchMedia change listener) is centralized in one wireLifecycle() call that returns a single teardown, rather than scattering observer/listener cleanup across initFig01"

key-files:
  created:
    - src/lib/fig01/interactions.ts
    - src/lib/fig01/index.ts
  modified: []

key-decisions:
  - "wireButtons/wireKeyboard/scheduleHeal signatures were extended beyond the plan's shorthand Artifacts list (wireKeyboard additionally takes logEl + canvas; scheduleHeal is a factory returning a zero-arg trigger) because the task's own <action> text requires writeLog + tooltip-width clamping + a single bound heal trigger that the 4-6 param shorthand in the Artifacts table didn't literally accommodate — behavior matches the action text exactly, only the parameter list grew"
  - "Added syncProxyFaultLabels(), appending ' · degraded, rerouting' to a proxy button's aria-label while its node is faulted — the UI-SPEC's Accessibility copy table marks this 'Claude's discretion (recommendation)', but it directly extends the locked FIG-03/05 color+dash dual-encoding requirement to keyboard/screen-reader users, so it was implemented rather than skipped (Rule 2 framing: accessibility completeness for a locked requirement, not scope creep)"
  - "DOM selector contract used by initFig01 (not yet locked by any existing markup, since Figure01.astro is plan 02-04's output): `.fig-stage`, `#fig01-canvas`, `#fig01-tip`, `#fig01-log`, `#send`, `#fault`, `.node-proxy[data-node]` — sourced from ARCHITECTURE.md's own Figure01.astro example markup plus this plan's explicit `data-node`/`.node-proxy` wording; documented at the top of index.ts so 02-04's markup must match exactly"
  - "Lifecycle gating (IntersectionObserver/visibilitychange/ResizeObserver/matchMedia-change) is centralized in a new wireLifecycle() helper (not explicitly named in the plan's Artifacts list, which only names applyMotionPreference/updateRunState) — necessary because the observers/listeners need a single teardown handle for initFig01 to return, and the plan's own action text explicitly asks for observer creation + 'return the created observers so index.ts can include them in teardown'"

requirements-completed: [FIG-02, FIG-03, FIG-04, FIG-05, FIG-06, FIG-07]

coverage:
  - id: D1
    description: "Pointer hover/click (hit-test with 6px/8px slop, tooltip show/position/hide, click-to-dispatch), send/fault buttons with verbatim log copy, timestamped (America/Los_Angeles) trim-to-2 event log, and a setTimeout-based 8s fault self-heal fully decoupled from the animation loop"
    requirement: "FIG-02, FIG-03, FIG-04"
    verification:
      - kind: other
        ref: "grep -c 'requestAnimationFrame' src/lib/fig01/interactions.ts == 0; grep -c 'setTimeout(' >= 1; grep -c '8000' >= 1; grep -c 'America/Los_Angeles' >= 1; exact-string greps for 'request dispatched → region', 'fault injected → weighed away · traffic rerouting · p99 stable', 'recovered · weight restored' all == 1; grep -nE '#[0-9a-fA-F]{3,8}' == 0; npx astro check == 0 errors"
        status: pass
    human_judgment: false
  - id: D2
    description: "prefers-reduced-motion branch point (applyMotionPreference: rm.matches renders one static frame and starts no loop, with a live matchMedia change listener) and dual-gate rAF lifecycle (updateRunState gated on IntersectionObserver intersection && !document.hidden && !rm.matches, plus a ResizeObserver re-layout on container resize)"
    requirement: "FIG-05, FIG-07"
    verification:
      - kind: other
        ref: "grep -c \"matchMedia('(prefers-reduced-motion: reduce)')\" == 1; grep -c IntersectionObserver >= 1; grep -c visibilitychange >= 1; grep -c document.hidden >= 1; grep -c ResizeObserver >= 1; grep -c \"addEventListener('change'\" >= 1; manual read of applyMotionPreference confirms the rm.matches branch calls renderStaticFrame and startAnimationLoop is only reachable from updateRunState's else-branch; npx astro check == 0 errors"
        status: pass
    human_judgment: false
  - id: D3
    description: "Keyboard proxy-button wiring (.node-proxy[data-node] focus/blur/click driving state.focusedNode + tooltip + beam dispatch, native tab order, no keyboard trap) and the public initFig01(root) orchestrator returning a teardown"
    requirement: "FIG-06"
    verification:
      - kind: other
        ref: "grep -c node-proxy >= 1; grep -c data-node >= 1; grep -c focusedNode >= 1; grep -c \"'focus'\" >= 1; grep -c \"'blur'\" >= 1 in interactions.ts; grep -c 'export function initFig01' == 1 and 'return (): void =>' present in index.ts; grep -c 'region healthy · 4 cells · ambient traffic' == 1 in index.ts; no non-null assertion on querySelector/getElementById results in index.ts; grep -nE '#[0-9a-fA-F]{3,8}' == 0 across both files; npx astro check == 0 errors"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-07-17
status: complete
---

# Phase 02 Plan 03: interactions.ts + index.ts — Runtime Wiring Summary

**Wired pointer/button/keyboard interaction, a setTimeout-decoupled fault self-heal, a genuine no-rAF `prefers-reduced-motion` branch, and a triple-gated (intersection + visibility + motion) single animation loop into `initFig01(root)` — the public entry point Figure01.astro will call in plan 02-04.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-17T05:05:00Z (approx)
- **Completed:** 2026-07-17T05:19:28Z
- **Tasks:** 3
- **Files modified:** 2 (both created)

## Accomplishments
- Ported the prototype's pointer hover/click, `send request`/`inject fault` button handlers, and timestamped (`America/Los_Angeles`, same `Intl.DateTimeFormat` shape as `SiteFooter.astro`'s clock) trim-to-2 event log verbatim, with the fault self-heal relocated to a `setTimeout(8000)` so it fires identically whether or not the animation loop is running (02-RESEARCH.md Pitfall 3)
- Built the genuine FIG-05 reduced-motion branch: `applyMotionPreference()` starts no loop at all under `prefers-reduced-motion: reduce` (confirmed by direct read — `startAnimationLoop` is only reachable from `updateRunState`'s non-reduced-motion path, never from the `rm.matches` branch), with a live `matchMedia` `change` listener so an OS toggle mid-session re-branches instead of only being checked once at load
- Built the FIG-07 dual-gate lifecycle: a single `updateRunState()` gates the consolidated loop on `intersecting && !document.hidden && !rm.matches`, driven by an `IntersectionObserver` (threshold 0) and a `visibilitychange` listener, plus a `ResizeObserver` that re-lays-out the canvas on container-driven resizes (font-load reflow)
- Built FIG-06 keyboard access: `wireKeyboard()` wires `focus`/`blur`/`click` on `.node-proxy[data-node]` buttons, setting `state.focusedNode` (render.ts already draws the on-canvas focus ring keyed on that field from plan 02-02) and dispatching a beam on native Enter/Space activation — no keydown interception, so native sequential tab order and no-keyboard-trap are both satisfied for free
- Added `syncProxyFaultLabels()` — an accessibility extra beyond the plan's hard gates — appending `· degraded, rerouting` to a proxy button's `aria-label` while its node is the faulted cell, mirroring the locked color+dash dual-encoding for keyboard/screen-reader users
- Assembled `initFig01(root)`: queries the documented DOM contract (`.fig-stage`, `#fig01-canvas`, `#fig01-tip`, `#fig01-log`, `#send`, `#fault`, `.node-proxy`) with zero non-null assertions, lays out the canvas once, writes the startup log line, wires pointer/buttons/keyboard, applies the initial motion branch, registers the lifecycle gates, and returns a teardown that stops the loop and disconnects every observer/listener

## Task Commits

Each task was committed atomically:

1. **Task 1: Pointer + buttons + timestamped aria-live event log + setTimeout self-heal** - `b280e18` (feat)
2. **Task 2: Reduced-motion branch (matchMedia, no rAF) + dual-gate rAF lifecycle** - `e92b9fa` (feat)
3. **Task 3: Keyboard proxy-button wiring + initFig01 orchestrator** - `04d20a2` (feat)

**Plan metadata:** (this commit, docs: complete plan)

_Note: Tasks were flagged `tdd="true"`, but — consistent with plans 02-01/02-02's precedent — no vitest infrastructure exists in this project and the plan's own `<verify>`/`<acceptance_criteria>` blocks specify only grep-based static checks plus `npx astro check`. Verification followed the plan's specified static checks exactly (all grep gates re-run and confirmed after each task, plus a manual read of `applyMotionPreference`'s branch structure per the plan's own `<verification>` requirement), plus an additional `npx tsc --noEmit` pass for extra confidence._

## Files Created/Modified
- `src/lib/fig01/interactions.ts` - `writeLog`, `wirePointer`, `scheduleHeal`, `wireButtons`, `syncProxyFaultLabels`, `wireKeyboard`, `createRedraw`, `updateRunState`, `applyMotionPreference`, `wireLifecycle` (+ `LifecycleHandle`)
- `src/lib/fig01/index.ts` - `initFig01(root: HTMLElement): () => void`, the public orchestrator

## Decisions Made
- Extended `wireKeyboard`'s parameter list beyond the plan's 4-param shorthand (`state, proxyButtons, tipEl, redraw`) to also take `logEl` and `canvas`, since the task's own `<action>` text requires writing the dispatch log line and clamping the tooltip against the stage width on focus — the same requirements `wirePointer` already needed those params for
- Made `scheduleHeal` a factory (`scheduleHeal(state, faultBtn, logEl, redraw) => () => void`) rather than a function called directly with those four args, so `wireButtons` can invoke a single bound zero-arg `triggerHeal()` — matches the plan's action text ("`scheduleHeal()`" called with no args) while still keeping `scheduleHeal`'s own signature close to the plan's documented one
- Implemented `syncProxyFaultLabels()` (not in the plan's Artifacts list) to append the `· degraded, rerouting` accessible-name suffix the UI-SPEC calls out as "Claude's discretion (recommendation)" — treated as a Rule 2-adjacent accessibility completeness item since it extends the *locked* FIG-03/05 color+dash dual encoding to non-visual users, called only from the fault-inject/heal paths (not the hot mousemove-driven `redraw()`) to avoid unnecessary DOM writes
- Centralized IntersectionObserver/visibilitychange/ResizeObserver/matchMedia-change registration in one `wireLifecycle()` helper returning a single `{ teardown }` handle, since `initFig01` needs one composable teardown and the plan's own action text says to "return the created observers so index.ts can include them in teardown"
- Documented the exact DOM selector contract (`.fig-stage`/`#fig01-canvas`/`#fig01-tip`/`#fig01-log`/`#send`/`#fault`/`.node-proxy[data-node]`) at the top of `index.ts` since `Figure01.astro`'s markup (plan 02-04) does not exist yet — sourced from `ARCHITECTURE.md`'s own example markup plus this plan's `env_notes`/action text on `data-node` proxy buttons, so 02-04 has an unambiguous contract to match

## Deviations from Plan

None requiring Rule 1-4 escalation. One clarification, consistent with plans 02-01/02-02's precedent: tasks were tagged `tdd="true"` but the plan's own verification section specifies only grep-based acceptance criteria plus `npx astro check`/manual-read checks (no vitest runner present). Verification followed the plan's stated method exactly, plus an additional `npx tsc --noEmit` pass. Parameter-list extensions to `wireKeyboard`/`scheduleHeal` (see Decisions Made) are documented as clarifications of the plan's own shorthand Artifacts table against its more-detailed `<action>` prose, not scope changes — every acceptance-criteria grep and the full `<verification>` block pass unchanged.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `initFig01(root)` is ready for plan 02-04's `Figure01.astro` to import and call against its root element on `DOMContentLoaded`/module load — the DOM contract it expects (`.fig-stage`, `#fig01-canvas`, `#fig01-tip`, `#fig01-log`, `#send`, `#fault`, `.node-proxy[data-node]`) is documented at the top of `index.ts` and must be matched exactly by that markup
- Every node's keyboard-proxy button needs a base `aria-label` set from `fig01Facts[i].accessibleName` in the markup itself (plan 02-04) — `interactions.ts` only appends the `· degraded, rerouting` suffix on top of whatever `aria-label` the markup already carries
- The canvas needs `role="img"` + the `aria-label` UI-SPEC recommends, and `.fig-log` needs `aria-live="polite"` — both are markup-side additions for plan 02-04, not this plan's scope
- No blockers

---
*Phase: 02-fig01-signature-figure*
*Completed: 2026-07-17*

## Self-Check: PASSED

All created files verified present on disk (`src/lib/fig01/interactions.ts`, `src/lib/fig01/index.ts`, this SUMMARY); all three task commits (`b280e18`, `e92b9fa`, `04d20a2`) verified present in git log.
