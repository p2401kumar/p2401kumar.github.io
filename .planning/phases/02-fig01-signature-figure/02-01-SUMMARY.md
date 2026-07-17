---
phase: 02-fig01-signature-figure
plan: 01
subsystem: ui
tags: [canvas, typescript, fig01, design-tokens, state-machine]

# Dependency graph
requires:
  - phase: 01-editorial-shell-content
    provides: src/data/types.ts honesty-gate `source` pattern, src/styles/tokens.css token system
provides:
  - "Fig01Fact interface + 10 source-annotated node facts (src/data/fig01.ts)"
  - "Runtime CSS-token reader (src/lib/fig01/tokens.ts) — read-once getComputedStyle bridge, zero hardcoded colors"
  - "model.ts — pure, DOM-free topology/route-geometry/beam-fault state machine (src/lib/fig01/model.ts)"
affects: [02-02, 02-03, 02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "tokens.ts: lazy getComputedStyle read cached at module scope, exposed via getTokens()/rgba() so canvas code never hardcodes a hex literal"
    - "model.ts: FigureState created fresh per instance via createState()/cloneNodes() rather than shared module-level mutable state, keeping the state machine pure/testable"

key-files:
  created:
    - src/data/fig01.ts
    - src/lib/fig01/tokens.ts
    - src/lib/fig01/model.ts
  modified:
    - src/data/types.ts

key-decisions:
  - "spawnBeam(state, fromId?) dispatches from fromId only when it is a client node (c0/c1/c2); any other fromId falls back to a random client, since the topology has no route originating anywhere but the 3 client nodes — matches UI-SPEC's 'sourced from that node instead of a random client where applicable' wording"
  - "dp (data-pipelines) fact's source string extends the DynamoDB cellularization résumé citation (no new résumé section exists for 'reconciles legacy data' specifically; it introduces no new number, so honesty gate is satisfied by tracing to the same AWS cellularization work)"
  - "createState() deep-clones the canonical `nodes` topology per call instead of sharing one module-level object, so multiple FigureState instances (e.g. in tests) never share mutable px/py/glow"

patterns-established:
  - "Pattern: read-once token bridge (tokens.ts) — any future canvas/DOM module needing tokens.css values should follow the same lazy-cache-getComputedStyle shape"

requirements-completed: [FIG-02, FIG-03, FIG-04]

coverage:
  - id: D1
    description: "Fig01Fact interface + fig01.ts with 10 source-annotated, verbatim-copy tooltip facts (c0,c1,c2,lb,cell0-3,dp,ml)"
    requirement: "FIG-04"
    verification:
      - kind: other
        ref: "grep -c 'nodeId' src/data/fig01.ts == 10; grep -c 'source:' src/data/fig01.ts == 10; npx astro check"
        status: pass
    human_judgment: false
  - id: D2
    description: "tokens.ts read-once getComputedStyle token reader with rgba() helper, zero hardcoded colors"
    verification:
      - kind: other
        ref: "grep -nE '#[0-9a-fA-F]{3,8}' src/lib/fig01/tokens.ts == 0 matches; grep -c 'getComputedStyle(' == 1; npx astro check"
        status: pass
    human_judgment: false
  - id: D3
    description: "model.ts topology (nodes/order/cells/routeDefs), computeLayout/pAt route geometry, and healthyCells/pickFaultCell/injectFault/healFault/spawnBeam/advanceBeams state machine — fault selection excludes cell0, degraded cells excluded from routing"
    requirement: "FIG-02, FIG-03"
    verification:
      - kind: unit
        ref: "scratch smoke test (compiled model.ts, run under node): pickFaultCell never returns cell0 across 500 samples; healthyCells excludes degraded cell; injectFault/healFault no-op and clear correctly; spawnBeam route never traverses degraded cell; advanceBeams terminates and removes beam after final leg; pAt(0)/pAt(len) match route endpoints"
        status: pass
      - kind: other
        ref: "grep -nE '#[0-9a-fA-F]{3,8}' src/lib/fig01/model.ts == 0; grep -c 'as any' == 0 (comment mention only); no requestAnimationFrame/getContext; npx astro check"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-07-17
status: complete
---

# Phase 02 Plan 01: Fig. 01 Foundation — Data, Tokens, Model Summary

**Typed résumé-sourced fact data, a read-once CSS-token bridge, and a pure DOM-free topology/beam/fault-injection state machine ported from the approved prototype — the runtime contract render.ts and interactions.ts will consume.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-17T04:19:00Z (approx)
- **Completed:** 2026-07-17T04:44:17Z
- **Tasks:** 2
- **Files modified:** 4 (1 modified, 3 created)

## Accomplishments
- Extended `src/data/types.ts` with `Fig01Fact` and authored `src/data/fig01.ts` with 10 source-annotated node facts, tooltip copy copied verbatim from `02-UI-SPEC.md`'s Copywriting Contract
- Built `src/lib/fig01/tokens.ts`: a read-once, cached `getComputedStyle` bridge into `tokens.css` exposing parsed RGB triples + an `rgba()` helper — zero hex literals anywhere in `src/lib/fig01/`
- Ported the prototype's topology, elbow-route geometry (`computeLayout`/`pAt`), and beam/fault state machine (`healthyCells`/`pickFaultCell`/`injectFault`/`healFault`/`spawnBeam`/`advanceBeams`) into a strict-TS, DOM-free `model.ts` with an explicit `NodeSpec` interface (no `as any`, no non-null-assertion sprawl)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fact data (types.ts + data/fig01.ts) and the runtime token reader (tokens.ts)** - `0401841` (feat)
2. **Task 2: model.ts — topology, route math, and the beam/fault state machine** - `9cadb5c` (feat)

**Plan metadata:** (this commit, docs: complete plan)

_Note: Tasks were flagged `tdd="true"` in the plan, but the plan's own `<verify>`/`<acceptance_criteria>` blocks specify only grep-based static checks and `npx astro check` (no vitest test runner is present in this project, and 02-RESEARCH.md marks vitest as optional/discretionary). Verification followed the plan's specified static checks; model.ts behaviors were additionally smoke-tested via a scratch-compiled build (see Task Commits detail and Deviations below) rather than committed as a permanent test suite, since the plan didn't request one._

## Files Created/Modified
- `src/data/types.ts` - Added `Fig01Fact` interface (nodeId/label/tooltipHtml/accessibleName/source)
- `src/data/fig01.ts` - 10 typed, source-annotated node facts (c0,c1,c2,lb,cell0-3,dp,ml)
- `src/lib/fig01/tokens.ts` - `getTokens()`/`FigTokens`/`rgba()` — read-once token bridge from tokens.css
- `src/lib/fig01/model.ts` - `NodeId`/`NodeSpec`/`RouteGeom`/`Beam`/`FigureState` types; `nodes`/`order`/`cells`/`routeDefs` consts; `createState`/`computeLayout`/`pAt`/`healthyCells`/`pickFaultCell`/`injectFault`/`healFault`/`spawnBeam`/`advanceBeams` functions

## Decisions Made
- `spawnBeam(state, fromId?)` only honors `fromId` when it names a client node (`c0`/`c1`/`c2`) since the topology has no route originating elsewhere; other `fromId` values fall back to a random client — a conservative reading of UI-SPEC's "where applicable" qualifier
- `dp` node's honesty-gate `source` string extends the DynamoDB cellularization résumé citation rather than inventing a new résumé section, since "durable · idempotent · reconciles legacy data" introduces no number and is a natural extension of the same AWS cellularization work already cited in `src/data/systems.ts`
- `createState()` deep-clones the canonical `nodes` topology per call (via `cloneNodes()`) instead of one shared module-level mutable object, so the state machine is safely reusable/testable across independent instances

## Deviations from Plan

None — plan executed exactly as written. One clarification: tasks were tagged `tdd="true"`, but no vitest infrastructure exists in this project and the plan's own verification section specifies only grep-based acceptance criteria plus `npx astro check`. Rather than scaffold a new test framework (a discretionary/optional step per 02-RESEARCH.md, not requested by the plan), model.ts's stated `<behavior>` assertions were verified via a one-off scratch-compiled smoke test (tsc-compiled `model.ts` run under Node, exercising `pickFaultCell` exclusion, `healthyCells`/`injectFault`/`healFault`, `spawnBeam` degraded-cell exclusion, `advanceBeams` termination/removal, and `pAt` endpoint correctness) plus the plan's own grep/astro-check criteria. This is not tracked as a Rule 1-4 deviation since it changes verification method only, not scope or behavior.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `model.ts`'s `FigureState` is now the locked runtime contract — plan 02-02 (render.ts) and later interactions.ts can build directly against `createState()`, `computeLayout()`, and the beam/fault functions without further shape changes
- `src/lib/fig01/tokens.ts` is ready for render.ts to source all canvas colors from, keeping the zero-hardcoded-hex guarantee intact
- `src/data/fig01.ts` facts are ready for the tooltip/keyboard-proxy wiring in a later plan (accessibleName strings already match the 02-UI-SPEC accessibility-copy pattern)
- No blockers

---
*Phase: 02-fig01-signature-figure*
*Completed: 2026-07-17*

## Self-Check: PASSED

All created files verified present on disk; all task commits (`0401841`, `9cadb5c`) and the plan-metadata commit (`ac358b3`) verified present in git log.
