---
phase: 05-night-sky-scene
plan: 05
subsystem: frontend
tags: [astro, canvas2d, night-sky, constellations, panel-reactive, link-firing, settimeout]

# Dependency graph
requires:
  - phase: 05-04
    provides: "scene.ts single-rAF engine (drawFrame Layer-2 section, renderStaticFrame, updateRunState pause gate, initNightSky/teardown) — the tick constellation work rides"
  - phase: 05-02
    provides: "src/data/constellations.ts typed 4-constellation data module + panelToConstellation mapping; shared/css-tokens.ts rgba bridge (via nightsky/tokens.ts)"
  - phase: "04 (deck)"
    provides: "document-level 'nightsky:panel-change' CustomEvent contract (detail { index, id, total }) — consumed by literal event name only, never imported"
provides:
  - "src/lib/nightsky/constellations.ts: initConstellations({tokens, getViewport, requestRepaint}) → handle {draw, advance, setFiringSuppressed, teardown}; exported straight-line pointAtDistance sampler (fig01 pAt mirrored locally)"
  - "Panel-reactive brighten/dim: independent literal-name 'nightsky:panel-change' listener → panelToConstellation → one Brightened / siblings Dimmed / hero+contact all Ambient, ~400ms ease-out tween (instant + single repaint under reduced motion)"
  - "Quiet link-firing: at most ONE beam, setTimeout-scheduled 6000+random()*4000ms, ambient (non-brightened) links only, suppressed by the pause gate; head/gradient-tail 'lighter' treatment in --star"
  - "scene.ts: Layer-2c constellation advance/draw in drawFrame, instant-state constellation draw in renderStaticFrame, setFiringSuppressed toggled from updateRunState, constellation teardown wired"
affects: [05-06-contrast-gates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Panel-reactive canvas state via literal-name CustomEvent subscription + data-module mapping (panelToConstellation) — second independent listener on the same event as the pause gate, zero import coupling"
    - "Sparse decorative motion as setTimeout-scheduled events (6–10s cadence) riding the existing single rAF for advance/draw — never per-frame dice, never a second loop"
    - "Suppression-discards-state: setFiringSuppressed(true) clears the pending timer AND the in-flight beam, so paused/static frames are structurally beam-free"

key-files:
  created: [src/lib/nightsky/constellations.ts]
  modified: [src/lib/nightsky/scene.ts]

key-decisions:
  - "Star alphas carry a small magnitude split inside each locked UI-SPEC range (bright anchors at the top, mid connectors lower: ambient 0.55/0.45, brightened 1.0/0.88, dimmed 0.34/0.27) so clusters keep internal hierarchy in every highlight state"
  - "Firing candidates = all links of every non-Brightened constellation (Dimmed included) — 'ambient (non-highlighted) sky' read as not-the-brightened-one, so the sky keeps firing while a panel is highlighted elsewhere"
  - "Beam geometry recomputed from the precomputed per-size link cache each advance (via getViewport→ensureLayout), not captured at spawn — a debounced resize mid-beam can never strand a beam at stale pixel coordinates"
  - "constellations.ts registers its own reduced-motion 'change' listener that snaps in-flight tweens to target BEFORE scene.ts's listener repaints the static frame (init order guarantees listener order), so an OS motion flip never freezes a mid-fade"
  - "scene.ts onMotionChange now routes through updateRunState (then repaints if reduced) so firing suppression is applied on a motion-preference flip through the same single gate as hidden/fig-01"

patterns-established:
  - "Pattern: subsystem handles injected into the scene engine ({draw, advance, set*, teardown}) ride the single rAF and expose a suppression setter the pause gate toggles — the shape 05-06+ should reuse for any future Layer-2 addition"

requirements-completed: [CONST-01, CONST-02, CONST-03]

coverage:
  - id: D1
    description: "4 constellations render as 2.5–4px star nodes + 0.75–1px hairline links from the data module, panel-reactive brighten/dim over ~400ms ease-out via the literal event, instant + one repaint under reduced motion"
    requirement: "CONST-02"
    verification:
      - kind: other
        ref: "npm run build && npx astro check (0 errors); grep gates: nightsky:panel-change != 0, deck/fig01-import == 0, zero-hex == 0, constellation in scene.ts != 0, rAF == 2"
        status: pass
      - kind: human
        ref: "Headless-Chrome smoke screenshot (1440×900, virtual-time 9s): all 4 clusters visible in the outer margins at ambient state (hero active), clearly distinct from the ambient field, no console errors"
        status: pass
    human_judgment: true
  - id: D2
    description: "Single setTimeout-scheduled link-firing beam (6000+random()*4000ms, one at a time, ambient links only), locally-mirrored Fig. 01 beam math, suppressed while paused/reduced-motion, torn down with the scene"
    requirement: "CONST-03"
    verification:
      - kind: other
        ref: "grep gates: setTimeout != 0, setFiringSuppressed/suppress != 0 in both files, deck/fig01-import == 0, zero-hex == 0, rAF == 2 in scene.ts (fig01/render.ts untouched at 2); build + astro check green"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-07-18
status: complete
---

# Phase 05 Plan 05: Constellations (render + brighten/dim + link-firing) Summary

**nightsky/constellations.ts brings the 4 career-chapter constellations to life: data-module-driven star/link rendering always distinct from the ambient field, panel-reactive brighten/dim over 400ms driven only by the literal 'nightsky:panel-change' event through panelToConstellation, and a single setTimeout-scheduled link-firing beam (Fig. 01 beam math mirrored locally) riding scene.ts's single rAF, fully suppressed by the pause gate**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-07-18T00:44:00Z
- **Completed:** 2026-07-18T00:57:00Z
- **Tasks:** 2
- **Files modified:** 2 (1 created: constellations.ts; 1 modified: scene.ts)

## Accomplishments

- `initConstellations({tokens, getViewport, requestRepaint})` returns a handle `{draw, advance, setFiringSuppressed, teardown}` driven entirely from scene.ts's existing tick — zero new `requestAnimationFrame` anywhere (nightsky total stays at exactly 2, both in scene.ts)
- Base rendering is cheap by construction: fractional data-module coordinates are converted to pixels + link segment lengths ONCE per viewport size (`ensureLayout`), so per-frame work is pure alpha application over precomputed geometry (4×6 links batched per-constellation, 24 star arcs, halos only while a constellation is brightened)
- Brighten/dim (CONST-02): an independent document listener on the literal `'nightsky:panel-change'` name resolves `detail.id` through the data module's `panelToConstellation` — active panel's constellation targets Brightened (stars 0.88–1.0, links 0.5, radial halo 1.5×r at 0.25), siblings Dimmed (0.27–0.34 / 0.1), hero/contact send all four to Ambient (0.45–0.55 / 0.16); alphas ease-out over 400ms inside the running loop; under reduced motion the listener snaps and requests exactly ONE repaint (fig01 createRedraw shape mirrored)
- Link-firing (CONST-03): at most one beam, spawned only by a `setTimeout` chain (`6000 + random()*4000` ms — no per-frame dice), on a random link of the non-brightened sky; head (1.5px) + 40px gradient tail at 0.18px/ms with the `'lighter'` composite — fig01 `pAt`/`drawBeams` reimplemented locally as the exported straight-line `pointAtDistance` sampler, fig01 modules never imported
- Suppression is structural: `setFiringSuppressed(true)` (toggled by scene.ts's `updateRunState` whenever hidden / fig-01-active / reduced-motion) clears the pending timer AND discards the in-flight beam, so `renderStaticFrame` — which now draws constellations at their instant state — can never contain a beam
- Honesty gate held: no constellation label string is rendered anywhere (labels stay data-only); all stars/links/halos/beams use `--star` exclusively via the token bridge; zero hex literals in both files
- Runtime smoke via headless Chrome: all 4 clusters visible at ambient (hero active) in their UI-SPEC margin regions, clearly larger/brighter than the ambient field, no console errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Render constellations + panel-reactive brighten/dim, integrated into scene.ts drawFrame** — `c0b45a3` (feat)
2. **Task 2: Quiet link-firing beam — locally-mirrored Fig. 01 beam math, setTimeout-scheduled, pause-suppressed** — `563c63b` (feat)

**Plan metadata:** (docs commit, following)

## Files Created/Modified

- `src/lib/nightsky/constellations.ts` — New: constellation subsystem (initConstellations, per-state alpha targets/tween, ensureLayout pixel cache, panel-change + motion listeners, firing scheduler/beam, exported pointAtDistance)
- `src/lib/nightsky/scene.ts` — Modified: Layer-2c advance/draw in drawFrame, instant-state constellation draw in renderStaticFrame, setFiringSuppressed wired into updateRunState, onMotionChange routed through updateRunState, constellation init + teardown; stale 05-04-era comments updated

## Decisions Made

See `key-decisions` in frontmatter — magnitude-split alphas within locked ranges, non-brightened firing candidacy, per-advance beam geometry from the size cache, the constellation-side reduced-motion snap listener, and the onMotionChange→updateRunState routing.

## Deviations from Plan

### Auto-fixed / reconciliations

**1. [Rule 2 — as-built reconciliation] 05-04's scene.ts comments said constellations "slot between the blit and the fireflies"; the plan's must_haves/action say "after fireflies".**
- **Found during:** Task 1
- **Issue:** The 05-04-era comment described a placement expectation the 05-05 plan superseded; leaving it would misdocument the as-built draw order.
- **Fix:** Followed the plan (Layer 2c after fireflies — the two never meaningfully overlap: fireflies live in the bottom-25% band, constellations in the margins above) and updated scene.ts's header + drawFrame comments to describe the actual order.
- **Files modified:** `src/lib/nightsky/scene.ts`
- **Commit:** `c0b45a3`

**2. [Rule 2 — missing suppression path] scene.ts's original onMotionChange branch bypassed updateRunState when reduced motion turned ON, which would have left firing unsuppressed on an OS motion-preference flip.**
- **Found during:** Task 2
- **Issue:** The plan requires firing suppressed under reduced motion; the pre-existing rm branch called renderStaticFrame directly without touching the (new) suppression gate.
- **Fix:** onMotionChange now calls stopAnimationLoop → updateRunState (which applies both the loop gate and setFiringSuppressed) → renderStaticFrame if reduced. Behavior is otherwise identical to 05-04's.
- **Files modified:** `src/lib/nightsky/scene.ts`
- **Commit:** `563c63b`

**3. [Execution-convention note, not a code deviation] Tasks carry `tdd="true"` but were executed via the plan's automated verify gates, not RED/GREEN test commits.**
- Project config sets `tdd_mode: false` and the project has zero test infrastructure; this module is browser-canvas/rAF/matchMedia/setTimeout-bound. Same documented convention as 05-01..05-04: the plan's `<verify>` grep/build gates ARE the acceptance harness, and every gate passed.

## Issues Encountered

None. Build + astro check green on both task commits; all automated verify gates passed first run; headless-Chrome smoke clean.

## Authentication Gates

None.

## User Setup Required

None. No `git push`, deploy, or Pages trigger occurred (all commits local on `main`, per the plan's prohibitions).

## Known Stubs

None. Constellations render, brighten/dim, and fire end-to-end; labels are intentionally data-only this phase (a locked UI-SPEC/plan prohibition, not a stub — a future `/craft` experiment is the documented owner of visible labels).

## Threat Flags

None beyond the plan's own `<threat_model>`. T-05-07: labels never reach any DOM/canvas text sink (grep: no fillText/strokeText/innerHTML in constellations.ts). T-05-08: setTimeout-scheduled sparse firing, one beam, suppression wired to the full pause machine. T-05-06: zero deck/fig01 imports (grep-enforced); beam math local. No new network/auth/trust surface.

## Next Phase Readiness

- The scene is visually complete for 05-06's scrim/contrast verification + final gate: Layer 0 + twinkle + fireflies + constellations (all states) + firing all composite on the single canvas.
- Worst-case contrast sampling in 05-06 should include a BRIGHTENED constellation star + halo (alpha up to 1.0) near the content column edges — the brightest --star pixels the sky can now produce.
- Single-rAF invariant intact for 05-06's audit: `grep -o requestAnimationFrame src/lib/nightsky/*.ts | wc -l` == 2 (both scene.ts); fig01/render.ts untouched at 2.
- No blockers.

---
*Phase: 05-night-sky-scene*
*Completed: 2026-07-18*

## Self-Check: PASSED

All created/modified files, both task commit hashes, and the no-label-sink grep verified present.
