---
phase: 06-integration-launch
plan: 01
subsystem: integration-verification
tags: [verification, lighthouse, cdp, contrast, fig01, routing, launch-readiness]
requires:
  - phase: 05.1-celestial-extras
    provides: full scene + gate battery baselines (contrast 9.27/8.07, LH mobile 98 desktop 100x4)
  - phase: 04-panel-deck
    provides: deck + pre-paint activation + Fig. 01 pause wiring
  - phase: 02-fig01-signature-figure (v1.0)
    provides: the v1 Fig. 01 checklist this plan re-passes (02-VERIFICATION.md)
provides:
  - INTG-01/02/03 proven green against the assembled build (local)
  - INTG-04 pre-flight (local Lighthouse >=90 x4 both presets)
  - decision-ready go/no-go pack for the 06-02 human deploy gate
affects: [06-02 launch decision]
tech-stack:
  added: []
  patterns:
    - zero-dep CDP audit drivers (scratchpad) reusing verify-contrast.mjs harness
    - Emulation.setFocusEmulationEnabled for headless focus-event dispatch
key-files:
  created:
    - .planning/phases/06-integration-launch/06-01-integration-evidence.md
    - .planning/phases/06-integration-launch/06-01-fig01-audit.md
    - .planning/phases/06-integration-launch/06-01-lighthouse-scores-local.md
    - .planning/phases/06-integration-launch/06-01-LAUNCH-READINESS.md
    - .planning/phases/06-integration-launch/06-01-fig01-coldload.png
    - .planning/phases/06-integration-launch/06-01-fig01-degraded.png
    - .planning/phases/06-integration-launch/06-01-fig01-resize-activate.png
    - .planning/phases/06-integration-launch/06-01-scene-hero.png
    - .planning/phases/06-integration-launch/06-01-scene-experience.png
    - .planning/phases/06-integration-launch/06-01-scene-moon-crop.png
    - .planning/phases/06-integration-launch/06-01-scene-reduced-motion.png
  modified: []
decisions:
  - "One-active-animation gate verified on the event-driven contract (deck navigation); the cold /#fig-01 scene-still-animating edge recorded as fix-forward, not patched (plan scope)"
  - "/#work -> hero fallback recorded as fix-forward per plan; not fixed"
  - "Headless focus-event gap fixed in the audit harness via CDP focus emulation — product code untouched"
metrics:
  duration: ~24 min
  completed: 2026-07-18
  tasks: 3
  commits: 3
status: complete
---

# Phase 6 Plan 01: Integration Verification (Local) Summary

**One-liner:** All-local proof that the assembled night-sky deck is launch-ready — 36/36
embedded Fig. 01 CDP checks, contrast worst 7.89:1/8.39:1 with 0 failures, routing/sitemap/
leak gates green, local Lighthouse mobile 96 desktop 100×4 — aggregated into a decision-ready
go/no-go pack; nothing pushed, live site still v1.

## What was verified

- **INTG-01** (`06-01-integration-evidence.md`): 7 panels wrap the original v1 components
  unforked (Panel.astro is a pure slot wrapper, zero content forks); deck.css hides inactive
  panels via transform+opacity+pointer-events only (0 box-suppression declarations); the
  SKY-05 contrast battery re-passed at both viewports (worst 7.89:1 @1440×900, 8.39:1
  @1280×800 vs --ink, 0 failing regions across all 7 panels) plus --moon PASS both viewports.
- **INTG-02** (`06-01-fig01-audit.md`): scripted CDP audit, 4 cold browser instances,
  **36 PASS / 0 FAIL**. Cold `/#fig-01` inits a nonzero 878×380 canvas with the panel active
  and no pre-paint speculation (class-mutation timeline proves post-load activation). Full v1
  checklist embedded: send, fault→weigh-away (amber/dashed + hl narration + disabled button +
  sr-only "degraded, rerouting" suffix), ~8s self-heal (ok narration, re-enable, suffix
  cleared), keyboard proxies (10 labeled buttons, tooltip on focus, dispatch on click).
  Resize-while-inactive at deviceScaleFactor 2 → activate re-measures to 1468×760 (DPR cap 2
  path exercised, no stale store). Classic mode interactive; reduced-motion static frame with
  working fault narration; one-active-animation verified via pixel-capture pairs.
- **INTG-03** (`06-01-integration-evidence.md`): both /work/* routes cold-load standalone
  with full v1 chrome and ZERO scripts; browser Back restores the deck at #systems (hash +
  active panel); sitemap lists exactly 3 real routes with /404 absent; deck sentinel
  unreachable from /work/* and /404.
- **INTG-04 pre-flight** (`06-01-lighthouse-scores-local.md`): build + astro check 0/0/0,
  boundary-aware zero-hex, rAF invariants 2/2/0/0, 0 cross-boundary imports, local Lighthouse
  mobile **96/100/100/100** and desktop **100/100/100/100** (mobile perf delta vs 98 baseline
  is TBT emulation noise — 230ms vs 170ms; no code changed this plan).
- **Go/no-go pack** (`06-01-LAUNCH-READINESS.md`): what-changes-live, 19-gate aggregate table
  (18 green, live Lighthouse the sole deferral to 06-02), 7-screenshot index, explicit
  rollback plan (revert range + FF push; tag v1.0; origin/legacy-2021; verified: main is 62
  commits ahead), real-device touch checklist (carried from Phase 4 item 8), 5-min idle-CPU
  live check (05-06 SKY-03 deferral), and the fix-forward list.

## Task commits

| Task | Name | Commit | Type |
|---|---|---|---|
| 1 | INTG-01 + INTG-03 evidence | `f4dd1ee` | test |
| 2 | INTG-02 embedded Fig. 01 audit + screenshots | `56300c6` | test |
| 3 | Battery + Lighthouse + launch-readiness pack | `522584f` | feat |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug, audit tooling only] Headless focus events never dispatched**
- **Found during:** Task 2, first audit run (1 FAIL: tooltip-on-focus)
- **Issue:** headless-Chrome documents are unfocused; `element.focus()` set
  `document.activeElement` but never dispatched the `focus` event, so the tooltip listener
  never ran. Verified in an isolated repro (fired=false without, fired=true with emulation).
- **Fix:** enabled CDP `Emulation.setFocusEmulationEnabled` in the scratchpad audit harness.
  **Product code untouched** — re-run: 36/36 PASS.
- **Files modified:** scratchpad `fig01-embedded-audit.mjs` only (not committed to repo)
- **Commit:** n/a (scratchpad)

### Recorded observations (NOT fixed — plan scope; carried to the go/no-go fix-forward list)

1. **`/#work` crosslink → hero fallback** (pre-known, plan-directed): the case-study "back to
   work →" anchor targets `/#work`, which isn't a deck manifest hash, so deck mode falls back
   to panel 0. Documented in the evidence + LAUNCH-READINESS fix-forward table exactly as the
   plan requires.
2. **Cold `/#fig-01` scene keeps animating until the first navigation** (new, discovered by
   this audit): the scene↔fig01 pause contract is event-driven (`nightsky:panel-change` only
   fires from `goTo()`), and init hash resolution applies panel states without dispatching.
   Measured live. Self-corrects on first navigation; no Lighthouse impact; the specified
   one-active-animation behavior (event-driven) passes. Recorded as fix-forward with a
   suggested one-line post-launch fix.

### TDD note (Task 2, tdd="true")

This is a verification-only plan auditing already-shipped behavior: the audit script IS the
test artifact. RED/GREEN collapsed by design — the script was written first from the
`<behavior>` block, and its single first-run failure was a harness defect (above), not
product behavior. The scratchpad script is deliberately uncommitted per the plan
("do NOT add it to the repo"); the committed evidence is `06-01-fig01-audit.md` + screenshots.

## Threat model compliance

- **T-06-01 (critical):** NO `git push` executed anywhere in this plan — verified below.
- **T-06-04:** `.planning/config.json` untouched (its pre-existing unstaged modification is
  orchestrator-owned and was never staged or committed by this plan).
- **T-06-SC:** `npx lighthouse` used transiently; no dependency added to package.json.

## Known Stubs

None — this plan produced verification artifacts only; no product code was created or modified.

## Next

06-02 — the deploy, BLOCKED on the explicit human go decision. The user reads
`06-01-LAUNCH-READINESS.md` and says go / no-go. The only unproven gate is live Lighthouse.

## Self-Check: PASSED

All 12 claimed artifacts exist on disk; all 3 task commits (`f4dd1ee`, `56300c6`, `522584f`)
present in git log; `origin/main` unmoved (no push executed); `.planning/config.json` never
staged or committed.
