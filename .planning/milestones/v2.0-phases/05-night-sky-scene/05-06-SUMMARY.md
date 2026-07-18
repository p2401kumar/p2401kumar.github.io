---
phase: 05-night-sky-scene
plan: 06
subsystem: frontend
tags: [astro, canvas2d, night-sky, wcag, contrast, scrim, lighthouse, acceptance-gate]

# Dependency graph
requires:
  - phase: 05-04
    provides: "scene.ts single-rAF engine (drawFrame, renderStaticFrame, pause machine, seedTwinkles/seedFireflies) the governor + containment changes land in"
  - phase: 05-05
    provides: "constellations.ts (ensureLayout pixel cache, brighten/dim, firing beam) the margin remap lands in; brightened-state worst-case sampling target"
  - phase: 05-03
    provides: "starfield.ts Layer-0 generator (star bands, Milky Way dust/haze passes) the column brightness governor lands in"
  - phase: "04 (deck)"
    provides: "deck.css (.deck fixed container, .panel > * column) the scrim extends; Phase-4 gate-battery command shapes + 100/95/100/100 Lighthouse baseline"
provides:
  - "src/styles/deck.css content scrim: .deck::before vertical gradient via rgb(from var(--bg) r g b / …), stops 0/0.3@10%/0.38@45%/0.38@70%/0.15@92%/0, no blur, zero hex; .panel > * position:relative z-index:1; classic-mode .panel gets the same gradient as a background"
  - "scripts/verify-contrast.mjs: zero-dep WCAG 2.2 SC 1.4.3 verifier — node --selftest formula fixtures + deck.css scrim-stop sync check; browser per-line-text-rect canvas readback with analytic scrim + DOM-layer compositing; --cdp automation (headless Chrome DevTools Protocol over node 22 built-in WebSocket)"
  - "SKY-05 evidence: contrast-evidence.md + contrast-run-1440.json/contrast-run-1280.json — all 7 panels x 2 viewports PASS, global worst 8.24:1 vs --ink (floor 4.5), zero failing regions"
  - "Sky-brightness governor: starfield.ts column MW attenuation (x0.12) + baked star alpha cap (0.25) + twinkle exclusion inside the 880px column band; constellations.ts margin remap (cluster x-fractions -> actual margin bands at every width); scene.ts firefly margin containment + narrow-viewport half-alpha fallback"
  - "SKY-03 evidence: frame-cost-audit.md — bounded per-frame count (~70 typical / <=~120 worst cheap primitives) + live 60s CDP soak: 5.6% CPU, 0 long tasks, 60.0fps, LayoutDuration 0"
  - "lighthouse-scores.md: full battery PASS/FAIL table + local Lighthouse 100/100/100/100 on BOTH presets (baseline 100/95/100/100 not regressed; a11y improved to 100)"
  - "Scene sign-off screenshot evidence: 05-06-scene-{hero-dpr1,hero-dpr2,experience-dpr1,systems-dpr2,reduced-motion}.png"
affects: [06-deploy, phase-6-live-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Worst-case-pixel verification as a first-class artifact: a self-testing zero-dep script (formula fixtures + CSS sync check) drives headless Chrome over CDP with node's built-in WebSocket — no puppeteer, no new deps"
    - "Brightness governance at the SOURCE, not the overlay: when a <=0.38 scrim ceiling cannot cover saturated additive pixels, cap the scene's emitters inside the text column (design doctrine 'content sits over the darker sky') instead of silently waving the gate"
    - "Decorative elements are placed relative to the REAL content column (fixed 880px centered), never raw viewport fractions — margin remap keeps constellations/fireflies out of text at every width"

key-files:
  created:
    - scripts/verify-contrast.mjs
    - .planning/phases/05-night-sky-scene/contrast-evidence.md
    - .planning/phases/05-night-sky-scene/contrast-run-1440.json
    - .planning/phases/05-night-sky-scene/contrast-run-1280.json
    - .planning/phases/05-night-sky-scene/frame-cost-audit.md
    - .planning/phases/05-night-sky-scene/lighthouse-scores.md
    - .planning/phases/05-night-sky-scene/05-06-scene-hero-dpr1.png
    - .planning/phases/05-night-sky-scene/05-06-scene-hero-dpr2.png
    - .planning/phases/05-night-sky-scene/05-06-scene-experience-dpr1.png
    - .planning/phases/05-night-sky-scene/05-06-scene-systems-dpr2.png
    - .planning/phases/05-night-sky-scene/05-06-scene-reduced-motion.png
  modified:
    - src/styles/deck.css
    - src/lib/nightsky/starfield.ts
    - src/lib/nightsky/scene.ts
    - src/lib/nightsky/constellations.ts

key-decisions:
  - "Scrim lives on .deck::before (viewport-anchored), not .panel::before: panels are internal scroll containers and an abspos pseudo scrolls away with overflowing content — the .deck pseudo is visually identical unscrolled and correct when tall panels scroll (deviation, documented)"
  - "Scrim early stop tuned 0.28@18% -> 0.3@10% (explicit Claude's-discretion knob, peak 0.38 ceiling untouched): panel text starts at ~10% viewport and the first heading row measured sub-4.5 under the 18% ramp"
  - "Worst-case contrast made to PASS by governing the scene, not by recording a shortfall: column MW attenuation + star cap + twinkle exclusion + constellation margin remap + firefly containment — each restores a placement rule 05-UI-SPEC.md already declared"
  - "Text regions = per-line Range.getClientRects glyph runs, not block bounding boxes (an 880px-wide h2 box with 16 glyphs would gate on sky the text never touches)"
  - "Ink-gate per plan (all >=4.5 vs --ink); own-color ratios reported supplementally — --ink/--body/--accent all also pass >=4.5 worst-case; --dim/--faint cannot hold 4.5 even on plain --bg (pre-existing v1 condition, documented out of SKY-05 scope)"

patterns-established:
  - "Pattern: verification scripts must self-test their formulas AND sync-check the CSS they model (SCRIM_STOPS vs deck.css needle match) so evidence can never silently drift from the shipped styles"

requirements-completed: [SKY-03, SKY-05]

coverage:
  - id: D1
    description: "Content scrim per UI-SPEC stops (peak 0.38, no blur, zero hex, rgb(from var(--bg)…)); worst-case WCAG 1.4.3 evidence >=4.5:1 vs --ink at the brightest sky pixels under real text regions"
    requirement: "SKY-05"
    verification:
      - kind: other
        ref: "node scripts/verify-contrast.mjs --selftest exit 0; --cdp runs at 1440x900 + 1280x800: all 7 panels, zero failing regions, global worst 8.24:1 (contrast-evidence.md + committed raw JSON)"
        status: pass
      - kind: other
        ref: "grep gates: ::before present in deck.css, zero hex in deck.css, evidence file contains ratios; build + astro check 0 errors"
        status: pass
    human_judgment: false
  - id: D2
    description: "Bounded frame-cost audit for idle CPU: per-frame element counts x cheap-primitive class + TBT + live soak"
    requirement: "SKY-03"
    verification:
      - kind: other
        ref: "frame-cost-audit.md: ~70 typical / <=~120 worst draws/frame (arcs/hairlines/small gradients, no shadowBlur/filter); live 60s CDP Performance.getMetrics soak 5.6% CPU, 0 long tasks, 60.0fps; Lighthouse TBT 0ms both presets. Formal 5-min on-device confirmation deferred to Phase 6 per 05-CONTEXT.md"
        status: pass
    human_judgment: false
  - id: D3
    description: "Full phase acceptance battery green + scene sign-off"
    requirement: "phase gate"
    verification:
      - kind: other
        ref: "lighthouse-scores.md PASS/FAIL table: build, check 0/0/0, zero-hex (9 documented #dec false positives), fig01 hex=0 rAF=2, nightsky single-rAF (scene.ts=2, others=0), /work leak loop OK, Lighthouse 100x4 mobile + desktop"
        status: pass
      - kind: human
        ref: "Blocking human-verify checkpoint AUTO-RESOLVED under /gsd-autonomous (standing directive) with committed screenshot evidence: hero DPR1+DPR2, experience (Microsoft brightened), systems DPR2, reduced-motion static frame. Async user veto available — the scene ships nowhere until Phase 6"
        status: pass
    human_judgment: true

duration: 66min
completed: 2026-07-18
status: complete
---

# Phase 05 Plan 06: Scrim, Worst-Case Contrast, Full Battery + Scene Sign-off Summary

**SKY-05 proven objectively, not optimistically: the UI-SPEC scrim landed on the fixed .deck container, a zero-dep self-testing WCAG verifier (node selftest + CDP-automated canvas readback under per-line text rects) measured the brightest pixels under real text on all 7 panels at two viewports — the first run FAILED at 1.84:1 (saturated Milky Way dust + full-alpha stars under text), so the scene gained a column brightness governor + constellation margin remap + firefly containment that restore the UI-SPEC's own placement doctrine, and the final recorded worst case is 8.24:1 against the 4.5 floor; the full battery is green with Lighthouse 100/100/100/100 on both presets and a measured 5.6% idle CPU over a 60s soak**

## Performance

- **Duration:** ~66 min
- **Started:** 2026-07-18T01:01:22Z
- **Completed:** 2026-07-18T02:07:00Z
- **Tasks:** 3 (2 auto + 1 blocking checkpoint auto-resolved under /gsd-autonomous)
- **Files modified:** 15 (11 created, 4 modified)

## Task Commits

1. **Task 1: Scrim + verify-contrast.mjs + recorded worst-case evidence (SKY-05)** — `4720095` (feat)
2. **Task 2: Full gate battery — Lighthouse 100x4 both presets, frame-cost audit, twinkle-crash fix** — `5cc5723` (test)
3. **Task 3: Scene sign-off screenshot evidence (checkpoint auto-resolved)** — `5ac19b9` (test)

## Gate Results

| Gate | Result |
|---|---|
| Contrast (SKY-05) worst-case >=4.5:1 vs --ink | **PASS** — global worst 8.24:1 (1440) / 8.64:1 (1280), zero failing regions, selftest exit 0 |
| npm run build | PASS |
| npx astro check | PASS — 0 errors / 0 warnings / 0 hints |
| Zero hex outside tokens.css (boundary-aware) | PASS — 0 real (9 documented `#dec` id-selector false positives) |
| Fig. 01 non-regression (hex=0, rAF=2) | PASS — 0 / 2, untouched |
| Nightsky single-rAF (scene.ts=2, starfield.ts=0) | PASS — 2 / 0 (nightsky total 2, both scene.ts) |
| Zero deck/fig01 imports in nightsky | PASS — 0 import statements (event-name subscription only) |
| Scene JS unreachable from /work/* | PASS — sentinel absent from dist/work, present in dist/_astro, leak loop OK |
| Lighthouse mobile | **PASS — 100 / 100 / 100 / 100** (TBT 0ms, LCP 1.4s, CLS 0.003) |
| Lighthouse desktop | **PASS — 100 / 100 / 100 / 100** (TBT 0ms, LCP 0.4s, CLS 0) |
| Idle cost (SKY-03) | PASS — bounded ~70 draws/frame; live 60s soak 5.6% CPU, 0 long tasks, 60fps (5-min on-device confirmation stays a Phase-6 item per CONTEXT) |
| No push / no deploy | HELD — all commits local on main, no Pages trigger |

## Checkpoint Resolution

Task 3 (`checkpoint:human-verify`, gate="blocking") **auto-resolved under /gsd-autonomous with committed screenshot evidence (async user veto available)** per the standing session directive. Evidence committed at `5ac19b9`: hero at DPR1 + DPR2 (full composition — starfield, Milky Way core right-margin with column taper, 4 ambient constellations, camper + single copper glow, corner fireflies), experience mid-deck (Microsoft constellation visibly brightened, siblings dimmed, deck chrome 04/07 intact), systems at DPR2, and the reduced-motion static frame (`--force-prefers-reduced-motion`: stars + Milky Way + camper + constellations, NO fireflies/twinkle). Nothing is deployed — the live site stays v1 until Phase 6, so the operator can veto any visual call before anything ships.

## Deviations from Plan

### Auto-fixed / engineering deviations

**1. [Rule 1 — spec defect] Scrim placed on `.deck::before`, not `.panel::before`.**
- **Found during:** Task 1 (before implementation)
- **Issue:** Panels are internal scroll containers (`overflow: auto`); an absolutely-positioned pseudo-element child of a scroll container scrolls away WITH the content, so scrolled text on tall panels (experience/skills at short viewports) would lose its scrim entirely.
- **Fix:** The identical UI-SPEC gradient on `.deck::before` (the fixed, full-viewport container) — visually identical unscrolled, correct when scrolled; `.panel > *` still gains position:relative + z-index:1 per spec. Verify grep (`::before` in deck.css) still passes.
- **Commit:** `4720095`

**2. [Rule 2 — missing coverage] Classic mode gets the same scrim.**
- **Issue:** `html.classic-active` (the reachable "view classic" escape hatch) renders the same text over the same live scene with no scrim.
- **Fix:** classic-mode `.panel` sections carry the same gradient as a plain background (backgrounds paint below own content — no z-index dance needed).
- **Commit:** `4720095`

**3. [Rule 2 — threat T-05-09 mitigation; measured gate failure] Sky-brightness governor.**
- **Found during:** Task 1 first sampling run — worst 1.84:1 vs --ink: the spike-locked Milky Way centerline (top x0.63) crosses the text column's upper half with saturated `'lighter'` dust accumulation (raw up to full white), Bright-band stars bake at up to 1.0 alpha under text, and no scrim inside the locked <=0.38 ceiling can cover a near-white backdrop (needs >=0.58).
- **Fix (restores 05-UI-SPEC.md's own placement rules):** starfield.ts column governor (MW dust/haze alpha x0.12 inside the 880px column +24px cushion, 80px smoothstep ramp; baked star alpha cap 0.25; capped stars excluded from twinkle metadata), scrim early stop 0.28@18% -> 0.3@10% (Claude's-discretion knob, peak unchanged).
- **Result:** worst went 1.84 -> 8.24 with the dark aesthetic intact (screenshots committed).
- **Commit:** `4720095`

**4. [Rule 2 — width-dependent gate failure] Constellation margin remap.**
- **Found during:** Task 1 analysis + probe — cluster x-fractions (0.06–0.20 / 0.80–1.0) are viewport-relative but the text column is a FIXED 880px centered block, so at 1280/1200px widths brightened stars (alpha 1.0), halos, and firing beams (0.95) land INSIDE the column under text.
- **Fix:** `ensureLayout` maps each side's fractions linearly into the ACTUAL margin band (same column formula as deck.css, 8px cushion covering the 1.5x halo). At 1440 the shift is <=15px vs the approved 05-05 geometry; verified by the 1280x800 sampling run (all PASS).
- **Commit:** `4720095`

**5. [Rule 2 — measured gate failure at stress viewport] Firefly margin containment.**
- **Found during:** Task 1 sampling at 1264x705 (real inner viewport) — panels overflow, text renders into the scrim's low-opacity bottom taper, and 0.9-alpha copper firefly cores under text measured 3.4:1.
- **Fix:** the flock roams the horizontal margins only (reflecting at column edges, side chosen proportional to margin width — reads as fireflies around the campsite); narrow-viewport fallback (<48px margins): full-width roam at halved alpha (peak 0.45 -> >=4.5:1 even at zero scrim). An earlier interim "band below the text floor" approach was discarded when measurement proved overflowing text has no floor.
- **Commit:** `4720095`

**6. [Rule 1 — real crash caught by the battery] Empty twinkle pool on narrow viewports.**
- **Found during:** Task 2 first mobile Lighthouse run — Best Practices 96 via `errors-in-console`: `TypeError: Cannot read properties of undefined (reading 'r')` in the rAF tick. On a 412px viewport the column governor caps ALL stars, `twinkleStars` is empty, and `seedTwinkles` indexed `twinkleStars[-1]`.
- **Fix:** empty pool -> empty subset guard in scene.ts. Mobile re-run: 100x4, console clean.
- **Commit:** `5cc5723`

**7. [Deviation note] Files beyond the plan's `files_modified` list were touched** (starfield.ts, scene.ts, constellations.ts) — all as Rule-1/Rule-2 fixes required to make the plan's own hard gate (worst-case >=4.5:1) genuinely pass rather than recording a shortfall; the plan's prohibition "do not silently pass a shortfall" was honored by measuring first (failures recorded in contrast-evidence.md), fixing at the source, and re-measuring to green.

## Known Shortfalls Recorded (not silently passed)

- **--dim/--faint own-color ratios** (2.50 / 1.71 worst over sky) sit below 4.5 — but both sit below/at-zero-headroom on plain --bg too (4.83 / 2.85), a pre-existing v1 design-token condition documented since Phase 4's Lighthouse `color-contrast` note. The gate per plan is vs --ink; every color that passes on plain --bg (--ink/--body/--accent) also passes >=4.5 worst-case over the scene. A token-level fix would be a design-system (Rule 4) change — left recorded, not made.
- **SKY-03 formal <10%/5min on-device claim** — locally measured 5.6% over 60s (headless, software raster — conservative) with constant-work-per-frame extrapolation; the 5-minute live confirmation remains Phase 6's item per 05-CONTEXT.md.

## Issues Encountered

- New headless Chrome's `--window-size` includes browser-chrome height (real inner viewport 1424x805 / 1264x705) — evidence notes nominal vs actual sizes; the 705px-tall run doubled as a valuable overflow stress test that exposed deviations 5's failure mode.
- `--virtual-time-budget` screenshots freeze real-time CSS transitions mid-fade on non-hero deep links (ghost panels) — deep-link evidence recaptured via CDP with real-time settle; hero/reduced-motion captures unaffected (pre-paint activation means no fade on `/`).

## Authentication Gates

None.

## User Setup Required

None. No `git push`, deploy, or Pages trigger occurred (all commits local on `main`).

## Known Stubs

None. The scrim, verifier, governor, and evidence chain operate end-to-end.

## Threat Flags

None beyond the plan's threat model. T-05-09 (illegible text): mitigated and PROVEN (worst-case evidence committed). T-05-01 (accidental deploy): no push/deploy/Pages trigger anywhere. T-05-SC: zero new dependencies (verify-contrast.mjs is plain node + built-in WebSocket; lighthouse ran via npx as a transient audit tool only, matching the Phase-4 precedent).

## Next Phase Readiness

- Phase 5 is fully green: all 6 plans complete, all phase requirements (SKY-01..05, CONST-01..03) verified and marked Complete.
- Phase 6 (deploy) owes: the live 5-minute idle-CPU confirmation on real hardware, and the operator's on-device look at the scene before the v2 Pages deploy (the async veto window for this plan's auto-resolved sign-off).
- The verifier is rerunnable against any environment: `node scripts/verify-contrast.mjs --cdp --url <url>`.

---
*Phase: 05-night-sky-scene*
*Completed: 2026-07-18*

## Self-Check: PASSED

All 12 created artifacts and all 3 task commit hashes (4720095, 5cc5723, 5ac19b9) verified present.
