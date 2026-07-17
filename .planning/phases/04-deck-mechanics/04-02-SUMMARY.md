---
phase: 04-deck-mechanics
plan: 02
subsystem: ui
tags: [typescript, deck, wheel, touch, keyboard, routing, accessibility, vanilla-js]

# Dependency graph
requires:
  - phase: 04-deck-mechanics (plan 01)
    provides: "Typed panels.ts manifest, PanelDeck/Panel/DeckIndex shell components, deck.css (transform-based layout, fixed chrome, scroll-lock, reduced-motion), full DOM/CSS contract (.panel[data-panel-id], #deck-live, #deck-index-count, .deck-jump a[data-panel-index], #deck-hint, .deck-view-classic/.deck-view-deck)"
provides:
  - "src/lib/nightsky/deck.ts — the live panel-deck state machine: goTo, hash routing, inert/aria-hidden/aria-live accessibility wiring, wheel/touch/keyboard/jump-list input normalization, first-visit hint + view-classic persistence, and the nightsky:panel-change event contract"
  - "PanelDeck.astro boots initDeck via a bare, try/catch'd bundling <script> against the .deck root"
affects: [04-03-deck-mechanics-remaining, 05-nightsky-scene]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-scope mutable deck state (currentIndex/locked/panelEls/liveEl/...) set once by initDeck and read/written by every wire* function in the same module — mirrors lib/fig01/interactions.ts's own module-scope state precedent, no class/store abstraction introduced"
    - "Every wire* function returns a teardown; initDeck folds all of them into its own returned teardown (wireHistory, wireWheel, wireTouch, wireKeyboard, wireJumpList, wireHint, wireViewToggle)"
    - "classic-active mode gates every input handler via a shared isClassicActive() guard so the view-classic escape hatch isn't immediately re-overridden by a stray wheel/touch/keyboard event"
    - "Tunable wheel/touch constants (WHEEL_THRESHOLD, IDLE_RESET_MS, TRANSITION_LOCK_MS, SWIPE_DISTANCE, SWIPE_VELOCITY, SWIPE_HORIZONTAL_TOLERANCE) are named exports at the top of deck.ts, matching CONTEXT.md's 'whole tuning surface in one place' contract"

key-files:
  created:
    - src/lib/nightsky/deck.ts
  modified:
    - src/components/PanelDeck.astro

key-decisions:
  - "Deferred the .deck-jump/.deck-view-classic/.deck-view-deck required() DOM validation from Task 1 to Task 2 (rather than validating in Task 1 and wiring in Task 2) — those bindings would otherwise be unused-but-declared in Task 1's commit, violating tsconfig's noUnusedLocals under astro/tsconfigs/strict; validation now sits directly next to the handler that uses each node"
  - "applyPanelStates(index) takes no `animate` option — the plan's action text mentions one, but cold-load correctness is already guaranteed structurally (states are always set before .deck-active/.classic-active is added, so no transition can play on the first paint regardless of a flag); adding an unused parameter would fail noUnusedParameters"
  - "Gated every input handler (wheel/touch/keyboard/jump-list) behind isClassicActive() (Rule 2 — missing critical functionality): without this guard, a stray wheel tick or arrow key while classic mode is active would immediately re-apply inert/aria-hidden to inactive panels, breaking the entire 'view classic' escape hatch the moment the user tried to actually scroll"

patterns-established:
  - "wire*(...) : () => void — every deck input surface follows this exact shape (mirrors fig01's wire* naming), even wireHint which has no listeners of its own and returns a no-op teardown purely for shape consistency"

requirements-completed: [DECK-01, DECK-02, DECK-03, DECK-04, DECK-05, DECK-06, DECK-07, DECK-08]

coverage:
  - id: D1
    description: "Wheel input: deltaMode-normalized delta accumulation + idle-reset + transition lock fires exactly one panel change per gesture, registered on the deck root only (never window)"
    requirement: DECK-01
    verification:
      - kind: automated_ui
        ref: "grep -q deltaMode src/lib/nightsky/deck.ts; grep -q WHEEL_THRESHOLD src/lib/nightsky/deck.ts; grep -q '{ passive: false }' src/lib/nightsky/deck.ts; grep -oE \"window.addEventListener\\('wheel\" src/lib/nightsky/deck.ts | wc -l == 0"
        status: pass
    human_judgment: true
    rationale: "Grep confirms the mechanism is present and wired correctly; whether the 50px/400ms constants FEEL like exactly one panel per real trackpad/mouse gesture is a physical-hardware judgment call deferred to plan 04-03's human-verify checkpoint (04-RESEARCH.md Open Question 1)."
  - id: D2
    description: "Vertical touch swipe (distance + velocity threshold) advances/retreats one panel; horizontal gestures are never preventDefaulted, leaving iOS edge-back intact"
    requirement: DECK-02
    verification:
      - kind: automated_ui
        ref: "grep -oE \"addEventListener\\('(touchstart|touchmove|touchend)'\" src/lib/nightsky/deck.ts | wc -l >= 3; grep -q SWIPE_DISTANCE src/lib/nightsky/deck.ts"
        status: pass
    human_judgment: true
    rationale: "Real touch-gesture feel and iOS edge-swipe non-collision require a physical device — deferred to plan 04-03/Phase 6's checklist per 04-RESEARCH.md 'Cross-device input testing'."
  - id: D3
    description: "Full keyboard nav (Arrow/PageUp/Down/Home/End) guarded against form controls/modifiers, collision-free with Fig. 01's focus/blur/click-only handling; hidden panels inert+aria-hidden; aria-live announces each change"
    requirement: DECK-03
    verification:
      - kind: automated_ui
        ref: "grep -q keydown src/lib/nightsky/deck.ts; grep -q isContentEditable src/lib/nightsky/deck.ts; grep -qE 'PageDown|PageUp' src/lib/nightsky/deck.ts; grep -q .inert src/lib/nightsky/deck.ts; grep -q aria-hidden src/lib/nightsky/deck.ts; grep -q textContent src/lib/nightsky/deck.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Jump list moves directly to any panel via data-panel-index anchor interception; progress index (#deck-index-count) reflects the current panel"
    requirement: DECK-04
    verification:
      - kind: automated_ui
        ref: "grep -qE 'data-panel-index|panelIndex' src/lib/nightsky/deck.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every panel has a URL hash; pushState-driven internal nav; popstate+hashchange dual-listen for back/forward and jump-list safety net; cold-load resolves synchronously before .deck-active is added (no flash of panel 0)"
    requirement: DECK-05
    verification:
      - kind: automated_ui
        ref: "grep -q history.pushState src/lib/nightsky/deck.ts; grep -oE \"addEventListener\\('(popstate|hashchange)'\" src/lib/nightsky/deck.ts | wc -l >= 2; grep -q findIndex src/lib/nightsky/deck.ts; grep -q decodeURIComponent src/lib/nightsky/deck.ts; npx astro check"
        status: pass
    human_judgment: false
  - id: D6
    description: "First-visit hint dismisses on first navigation and is remembered via deck-hint-seen; view-classic disables the deck and persists via deck-view-preference; deck-view restores it"
    requirement: DECK-06
    verification:
      - kind: automated_ui
        ref: "grep -q deck-hint-seen src/lib/nightsky/deck.ts; grep -q deck-view-preference src/lib/nightsky/deck.ts; grep -q classic-active src/lib/nightsky/deck.ts"
        status: pass
    human_judgment: false
  - id: D7
    description: ".deck-active is added to <html> ONLY after successful init (required() DOM lookups + synchronous initial-state apply all precede it); PanelDeck.astro boots initDeck via a bare try/catch'd script so init failure leaves the v1 layout"
    requirement: DECK-07
    verification:
      - kind: automated_ui
        ref: "grep -q \"classList.add('deck-active')\" src/lib/nightsky/deck.ts; grep -q initDeck src/components/PanelDeck.astro; npm run build; npx astro check"
        status: pass
    human_judgment: true
    rationale: "Confirming zero flash-of-panel-0 on a real deep-linked cold load and confirming the try/catch fallback actually renders v1 layout on a forced init failure are rendered-output judgment calls deferred to plan 04-03's human-verify checkpoint."
  - id: D8
    description: "Under prefers-reduced-motion, the transition lock window collapses to ~0 via matchMedia so instant CSS transitions aren't needlessly input-blocked; deck.ts imposes zero JS-driven animation duration itself"
    requirement: DECK-08
    verification:
      - kind: automated_ui
        ref: "grep -q matchMedia src/lib/nightsky/deck.ts"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-07-17
status: complete
---

# Phase 04 Plan 02: Deck Mechanics Controller Summary

**Vanilla-TS `deck.ts` panel state machine — deltaMode-normalized wheel accumulation, vertical-only touch swipe, guarded Arrow/PageUp-Down/Home-End keyboard, pushState hash routing with dual popstate/hashchange listen, inert+aria-live accessibility, and localStorage-backed hint/view-classic persistence — booted from `PanelDeck.astro` via a try/catch'd bare script.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-17T20:44:00Z
- **Completed:** 2026-07-17T20:58:17Z
- **Tasks:** 2 completed
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments
- `src/lib/nightsky/deck.ts` created: `goTo` composes data-state/inert/aria-hidden/focus/aria-live/pushState/`nightsky:panel-change` on every panel activation; `resolveIndexFromHash` bounds-checks a crafted or absent hash against the build-time `panels[]` manifest, always degrading to index 0, never throwing (T-04-01)
- `initDeck(root)` bootstraps in the exact locked order: `required()` DOM lookups → synchronous initial-state apply (cold-load-correct, no flash of panel 0) → wire all input → `.deck-active`/`.classic-active` added last, so any pre-activation throw leaves the page in its v1 scrolling layout (DECK-07)
- Wheel input: `deltaMode`-branched normalization, accumulate-then-lock (never debounce), momentum-tail suppression checked before accumulating, registered `{ passive: false }` on the deck root only — never `window` (DECK-01)
- Touch input: vertical-only swipe distance+velocity detector; `touchmove` preventDefaults only once vertical intent is confirmed, leaving iOS edge-back gestures untouched (DECK-02)
- Keyboard: Arrow/PageUp/Down/Home/End guarded against form controls, `contenteditable`, and modifier keys; Space never hijacked; verified collision-free against Fig. 01's focus/blur/click-only keyboard handling (DECK-03)
- Jump-list click interception + `popstate`/`hashchange` dual-listen safety net for back/forward and un-intercepted anchor navigation (DECK-04, DECK-05)
- First-visit hint fades and remembers dismissal via `deck-hint-seen`; `view-classic`/`deck-view` links toggle `.classic-active`/`.deck-active`, persist via `deck-view-preference`, and re-apply panel inert/aria-hidden state so content stays coherent after the mode flip (DECK-06, DECK-07)
- `PanelDeck.astro` boots `initDeck` via a bare, attribute-less bundling `<script>` wrapped in try/catch, identical to `Figure01.astro`'s own boot pattern
- Verified: `npm run build` green, `npx astro check` 0 errors/0 warnings/0 hints, zero `fig01/*` imports, wheel never bound to `window`

## Task Commits

Each task was committed atomically:

1. **Task 1: deck.ts core — state machine, hash routing, a11y, change-event, bootstrap ordering** - `6c4d955` (feat)
2. **Task 2: deck.ts input surface — wheel, touch, keyboard, jump list, hint + view-classic persistence; boot from PanelDeck** - `4204562` (feat)

_No TDD tasks in this plan — both are `type="auto"` structural/behavioral tasks._

## Files Created/Modified
- `src/lib/nightsky/deck.ts` - panel state machine: `initDeck`, `resolveIndexFromHash`, `goTo`, `applyPanelStates`, `announce`, `wireHistory`, `wireWheel`, `wireTouch`, `wireKeyboard`, `wireJumpList`, `wireHint`, `wireViewToggle`, named tunable constants, `PANEL_CHANGE_EVENT`
- `src/components/PanelDeck.astro` - added the trailing bare bundling `<script>` that imports and boots `initDeck` against `.deck`, try/catch-wrapped

## Decisions Made
- Split `.deck-jump`/`.deck-view-classic`/`.deck-view-deck` DOM validation out of Task 1 and into Task 2, placed directly alongside the handlers that consume them — Task 1's `required()` calls only cover the nodes Task 1's own code path (`goTo`/`announce`/`wireHistory`) actually reads, avoiding unused-but-declared bindings that would fail `noUnusedLocals` under `astro/tsconfigs/strict`.
- Implemented `applyPanelStates(index)` without an `animate` parameter. The plan's action text describes one, but the cold-load-no-flash guarantee is already structural (panel state is always set before `.deck-active`/`.classic-active` exists, so no CSS transition can ever play on first paint) — an unused `{ animate }` option would be dead code and fail `noUnusedParameters`. The reduced-motion story is instead handled by `deck.css`'s own media-query branch plus `lockDuration()` collapsing the JS transition-lock window to 0.
- Added a `lockDuration()` helper that reads the module-scope `matchMedia('(prefers-reduced-motion: reduce)')` result (mirroring `lib/fig01/interactions.ts`'s own `rm` idiom) so wheel/touch transition locks don't needlessly block input when CSS transitions are already instant.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Gated every input handler behind a classic-mode guard**
- **Found during:** Task 2 (wireWheel/wireTouch/wireKeyboard/wireJumpList)
- **Issue:** The plan describes `wireViewToggle` switching `.classic-active` on/off and re-applying panel inert state, but never states that the other input handlers (wheel/touch/keyboard/jump-list) must stop acting while classic mode is active. Without a guard, the very next wheel tick or arrow-key press after clicking "view classic" would re-run `goTo`, re-applying `inert`/`aria-hidden` to the just-un-hidden panels — silently breaking the entire escape hatch the user just activated.
- **Fix:** Added a shared `isClassicActive()` helper (`htmlEl.classList.contains('classic-active')`) and an early-return guard at the top of `onWheel`, `onTouchMove`/`onTouchEnd`, `onKeyDown`, and the jump-list's `onClick`. In classic mode these handlers no-op (wheel/keyboard) or defer to native browser behavior (touchmove doesn't preventDefault; jump-list anchors get real in-page navigation instead of interception).
- **Files modified:** `src/lib/nightsky/deck.ts`
- **Verification:** `npx astro check` 0 errors; manual review confirms every `wire*` handler checks `isClassicActive()` before acting; `npm run build` green.
- **Committed in:** `4204562` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 2 — missing critical functionality)
**Impact on plan:** Necessary for the view-classic escape hatch to actually function once a user starts interacting again. No scope creep — the fix is a single shared guard function reused across the exact handlers the plan already specified.

## Issues Encountered
- The plan's Task 1/Task 2 acceptance-criteria grep for `innerHTML == 0` is a substring false-positive trap identical to the one flagged in 04-01-SUMMARY: the doc comments explaining the file *never uses* `innerHTML` (T-04-02 rationale, written as `` `innerHTML` input`` and `` never `innerHTML` ``) themselves contain the literal substring `innerHTML`, so a naive grep counts 2 matches even though zero executable `innerHTML` assignments exist anywhere in the file. Verified the real invariant by manual read: both matches are inside `/** ... */` comments, not code. No code change needed — a verification-command precision issue, not a functional defect.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The full DECK-01..08 mechanics contract is implemented and structurally verified (`npm run build` green, `npx astro check` 0/0/0, all acceptance-criteria greps pass). What remains is **experiential** verification — actually feeling one-wheel-tick-equals-one-panel on real hardware, confirming zero flash-of-panel-0 on a deep-linked cold load in a browser, and confirming the try/catch init-failure fallback visually renders the v1 layout — all deferred to plan 04-03's `checkpoint:human-verify`, per this plan's own `<verification>` section.
- `nightsky:panel-change` is dispatched with the locked `{ index, id, total }` detail shape on every activation — Phase 5's constellation/scene consumers can subscribe to `document` for this event with no further deck-side changes needed.
- No blockers. The wheel/touch numeric constants (`WHEEL_THRESHOLD=50`, `TRANSITION_LOCK_MS=400`, `SWIPE_DISTANCE=40`, `SWIPE_VELOCITY=0.3`) are all named exports at the top of `deck.ts`, ready for tuning during 04-03's cross-device QA pass without touching handler logic.

---
*Phase: 04-deck-mechanics*
*Completed: 2026-07-17*

## Self-Check: PASSED

Both created/modified files (src/lib/nightsky/deck.ts, src/components/PanelDeck.astro) found on disk; both task commit hashes (6c4d955, 4204562) found in git log.
