---
phase: 05-night-sky-scene
plan: 04
subsystem: frontend
tags: [astro, canvas2d, night-sky, raf, pause-state-machine, twinkle, fireflies]

# Dependency graph
requires:
  - phase: 05-03
    provides: "starfield.ts generateLayer0()/capDpr() (Layer0Result with twinkleStars metadata), nightsky/tokens.ts getSkyTokens(), NightSky.astro scene host with stable #nightsky-canvas contract + interim generate+blit bootstrap"
  - phase: "04 (deck)"
    provides: "deck.ts's document-level 'nightsky:panel-change' CustomEvent contract (detail { index, id, total }) — consumed by literal event name only, never imported"
provides:
  - "src/lib/nightsky/scene.ts: initNightSky(root) returning a teardown — the SINGLE animation-frame driver for the whole scene (drawFrame = Layer-0 blit + Layer-2 twinkle subset + ≤15 fireflies), renderStaticFrame, updateRunState pause gate {hidden, fig-01-active, reduced-motion}, debounced 250ms resize regen with generation-counter staleness guard"
  - "NightSky.astro boots initNightSky(host) once on load (single boot path — 05-03's interim bootstrap fully superseded, no dead script)"
  - "drawFrame's commented Layer-2 section boundary (between the Layer-0 blit and the fireflies) is where 05-05 slots constellation rendering; the pause listener and 05-05's brighten/dim listener are independent registrations on the same event"
affects: [05-05-constellations, 05-06-contrast-gates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single-rAF driver mirrored (never imported) from fig01/render.ts: module-scope single rafId, idempotent startAnimationLoop (recursive tick + initial call = exactly two requestAnimationFrame occurrences), stopAnimationLoop cancel+null"
    - "Pause-reason state machine mirrored from fig01/interactions.ts's updateRunState: shouldRun = tabVisible && !fig01Active && !rm.matches, idempotent, driven by visibilitychange + literal-name 'nightsky:panel-change' subscription + live matchMedia change listener; reduced motion is stop-then-one-static-frame, never a dampened loop"
    - "Generation-counter staleness guard for async chunked regeneration: each resize/init bumps a monotonic counter captured by the completion closure; stale results (superseded mid-generation or post-teardown) are discarded instead of adopted"
    - "Layer-2-over-blit compositing: per-frame work draws ON TOP of the pre-rendered Layer-0 bitmap via visibleCtx.drawImage only — the offscreen layer0Ctx is never referenced by any per-frame code path (Pitfall 3 guard held)"

key-files:
  created: [src/lib/nightsky/scene.ts]
  modified: [src/components/NightSky.astro]

key-decisions:
  - "Twinkle subset = a uniform-stride half of starfield.ts's Mid/Bright twinkleStars metadata (~13% of the field halved to ~6.5%) — lands inside the locked 5–8% window, ~40–45 stars at the 1440×900 reference, with zero shuffle allocation"
  - "renderStaticFrame is clear + Layer-0 blit only: every star (including twinkle-eligible ones) is already baked into the Layer-0 bitmap at its fixed base alpha by starfield.ts, so the blit alone IS 'all stars at base alpha'; twinkle and fireflies are fully OFF (removed, not dampened) per the UI-SPEC reduced-motion table"
  - "Firefly glow = per-firefly two-stop radial-gradient halo (radius 3× core dot) + core arc, both rgba(--accent) — fig01's layered-gradient-not-shadowBlur doctrine; 9 fireflies × 2 arcs + 1 gradient per frame is the whole flock budget"
  - "adoptLayer0 paints one static frame immediately on every generation completion (init and resize) before re-evaluating the run state — paused/reduced-motion/fig-01-active states never show a blank or stale-size scene"
  - "Visible-canvas backing store adopts Layer0Result's own device-pixel dimensions + dpr transform (sizeVisibleCanvas), so star metadata CSS-pixel coordinates are directly valid and the device-pixel bitmap blits 1:1 crisp"

patterns-established:
  - "Pattern: event-name-only decoupling across engine boundaries — scene.ts keys behavior on the literal 'nightsky:panel-change' string with an inline CustomEvent<{ id: string }> cast; grep-enforceable zero import coupling to deck.ts/fig01"

requirements-completed: [SKY-03, SKY-04]

coverage:
  - id: D1
    description: "scene.ts single-rAF engine: Layer-0 blit first, then ONLY twinkle subset + ≤15 fireflies per frame; debounced resize regen; initNightSky/teardown"
    requirement: "SKY-03"
    verification:
      - kind: other
        ref: "npm run build && npx astro check (0 errors); grep requestAnimationFrame == 2 in scene.ts (and == 2 total across src/lib/nightsky/*.ts, all in scene.ts; fig01/render.ts untouched at 2); grep drawImage != 0; grep deck/fig01-import == 0; grep zero-hex == 0"
        status: pass
      - kind: human
        ref: "Headless-Chrome smoke screenshot (1440×900, virtual-time 9s) — Layer 0 + camper + copper fireflies visibly rendering in the bottom-25% band behind the live deck"
        status: pass
    human_judgment: true
  - id: D2
    description: "Pause state machine {tab-hidden, fig-01-active via nightsky:panel-change literal-name subscription, prefers-reduced-motion static frame with live change listener}; NightSky.astro single boot path"
    requirement: "SKY-04"
    verification:
      - kind: other
        ref: "grep visibilitychange/prefers-reduced-motion/nightsky:panel-change/fig-01 all != 0 in scene.ts; grep deck/fig01-import == 0; grep initNightSky != 0 in NightSky.astro; rAF still exactly 2; build + astro check green"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-18
status: complete
---

# Phase 05 Plan 04: Scene Engine (single-rAF driver + pause state machine) Summary

**nightsky/scene.ts — the single-rAF scene engine blitting 05-03's pre-rendered Layer 0 and drawing only the ~6.5% twinkle subset + 9 copper fireflies per frame, gated by a {tab-hidden, fig-01-active, reduced-motion} pause state machine subscribed to 'nightsky:panel-change' by literal event name; NightSky.astro now boots initNightSky(host) as the scene's single boot path**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-18T00:33:39Z
- **Completed:** 2026-07-18T00:45:00Z
- **Tasks:** 2
- **Files modified:** 2 (1 created: scene.ts; 1 modified: NightSky.astro)

## Accomplishments

- `src/lib/nightsky/scene.ts` mirrors fig01/render.ts's proven driver shape (mirrored, never imported): a module-scope single `rafId`, idempotent `startAnimationLoop` with exactly two `requestAnimationFrame` occurrences (recursive tick + initial call), `stopAnimationLoop` cancel+null
- `drawFrame` blits the detached Layer-0 bitmap FIRST via `visibleCtx.drawImage` (the offscreen `layer0Ctx` is unreachable from any per-frame path — starfield.ts never exposes it), then draws ONLY Layer 2: ~40–45 twinkling stars (`alpha = baseAlpha + amplitude·sin(ts/period + phase)`, unsynchronized 2–4s periods, ±0.15–0.25 amplitude) and 9 fireflies (bottom-25% ground band, 4–8px/s heading-random-walk wander with band-edge reflection, 3–5s alpha pulse 0.4–0.9, `--accent`-tinted core + gradient halo)
- Pause state machine (the one-active-animation rule): `updateRunState` gates on `tabVisible && !fig01Active && !rm.matches`; driven by `visibilitychange`, a literal-name `'nightsky:panel-change'` document subscription (`detail.id === 'fig-01'`), and a live `prefers-reduced-motion` change listener — under reduced motion the loop NEVER starts; `renderStaticFrame` paints one complete frame (twinkle/fireflies fully off)
- Debounced (250ms) resize regenerates Layer 0 at the new DPR-capped size via a generation-counter guard that discards superseded in-flight results, reseeds Layer-2 state for the new bounds, repaints once, and re-evaluates the run state
- `NightSky.astro` boots `initNightSky(host)` once on load and retains the teardown — 05-03's interim generate+blit bootstrap is fully superseded (exactly one boot path, no dead script)
- Runtime smoke verification via headless Chrome: starfield + Milky Way + camper + visible copper fireflies rendering behind the fully functional deck, no console errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement nightsky/scene.ts — single rAF driver, drawFrame (Layer0 blit + Layer2 twinkle + fireflies), resize regen, initNightSky entry** — `c9d1498` (feat)
2. **Task 2: Pause state machine (hidden / fig-01-active / reduced-motion) + reduced-motion static frame + NightSky.astro init wiring** — `7d03e9e` (feat)

**Plan metadata:** (docs commit, following)

## Files Created/Modified

- `src/lib/nightsky/scene.ts` — New: the scene engine (initNightSky/teardown, drawFrame, start/stopAnimationLoop, renderStaticFrame, updateRunState, seedTwinkles/seedFireflies, debounced resize + generation-guarded regen)
- `src/components/NightSky.astro` — Modified: bootstrap script replaced with the `initNightSky(host)` module-script boot; host doc comment updated to describe the engine contract

## Decisions Made

See `key-decisions` in frontmatter — twinkle-subset sampling strategy, renderStaticFrame-as-blit reasoning, firefly gradient-halo glow, paint-on-adopt behavior, and visible-canvas sizing from Layer0Result are all documented there.

## Deviations from Plan

### Reconciliation with 05-03's as-built state

**1. [Rule 2 — single boot path] Task 2's NightSky.astro action says "add the module `<script>`" — the as-built component already HAD a script (05-03's documented Rule-2 bootstrap deviation).**
- **Found during:** Task 2
- **Issue:** Leaving both would double-generate Layer 0 and double-boot the scene (two independent `generateLayer0` calls, two blit paths).
- **Fix:** Replaced the bootstrap script's body entirely with the `initNightSky(host)` boot (scene.ts absorbs generate+blit as its own init path) and rewrote the stale host doc comment. Exactly ONE boot path remains; `grep generateLayer0 NightSky.astro` = 0.
- **Files modified:** `src/components/NightSky.astro`
- **Commit:** `7d03e9e`

**2. [Execution-convention note, not a code deviation] Tasks carry `tdd="true"` but were executed via the plan's own automated verify gates, not RED/GREEN test commits.**
- Project config sets `tdd_mode: false`, the project has zero test infrastructure (no test runner in package.json), and this module is browser-canvas/rAF/matchMedia-bound (would require jsdom+mocks to test meaningfully). All plans in this phase (05-01..05-03) followed the same convention: the plan's `<verify>` grep/build gates ARE the acceptance harness, and every gate passed. No `test(...)` commits exist for this plan by that convention.

**3. [Interpretation, documented] renderStaticFrame implements "draw the stars at their fixed base alpha" as the Layer-0 blit itself.**
- starfield.ts bakes EVERY star (twinkle-eligible included) into the Layer-0 bitmap at its base alpha, so clear + blit already IS the complete static composition (Layer 1 camper/glow is DOM/CSS). Re-drawing the twinkle subset at base alpha on top would double-composite and slightly brighten ~45 stars, diverging from the UI-SPEC's "fixed base alpha" intent. Documented in the function's doc comment.

None of the above are architectural (Rule 4) — no user decision was required.

## Issues Encountered

None. Build + astro check green on both task commits; all automated verify gates passed first run.

## Authentication Gates

None.

## User Setup Required

None. No `git push`, deploy, or Pages trigger occurred (all commits local on `main`, per the plan's prohibitions).

## Known Stubs

None. The engine is fully wired: generation, blit, twinkle, fireflies, pause machine, resize regen, and boot path all operate end-to-end (smoke-verified in headless Chrome). Constellation rendering and link-firing are 05-05's stated responsibility (the drawFrame Layer-2 section boundary is the documented insertion point), and the formal idle-CPU/frame-cost audit finalizes in 05-06 — next-plan responsibilities, not stubs.

## Threat Flags

None beyond the plan's own `<threat_model>`. T-05-05 (per-frame DoS) mitigations implemented as specified: bounded Layer-2 work (≤45 twinkle arcs + 9 fireflies), Layer 0 never regenerated per frame, single rAF, full pause coverage. T-05-06 (coupling): zero deck/fig01 imports, grep-enforced. No new network/auth/trust surface.

## Next Phase Readiness

- 05-05 (constellations) slots its rendering between drawFrame's Layer-0 blit and the firefly section (commented boundary in scene.ts), and registers its OWN independent `nightsky:panel-change` listener for brighten/dim — the pause-gate listener here stays untouched.
- The single-rAF invariant to preserve: `grep -o requestAnimationFrame src/lib/nightsky/*.ts | wc -l` == 2 (both in scene.ts); constellation work must draw inside the existing drawFrame, never add its own loop; link-firing must be setTimeout-scheduled, never per-frame dice.
- No blockers.

---
*Phase: 05-night-sky-scene*
*Completed: 2026-07-18*

## Self-Check: PASSED
