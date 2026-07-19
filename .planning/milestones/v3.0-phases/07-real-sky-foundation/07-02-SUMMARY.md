---
phase: 07-real-sky-foundation
plan: 02
subsystem: performance-verification
tags: [backdrop-filter, glassmorphism, cdp, performance-getmetrics, idle-cpu, spike, re-scope-gate]
requires:
  - phase: 07-01
    provides: "committed public/sky/milky-way-2560.avif master used as the harness backdrop"
  - phase: "05-06"
    provides: "CDP soak methodology (Performance.getMetrics, 60s, headless=new) + the 5.6% baseline family + verify-contrast.mjs CDP primitives reused verbatim"
provides:
  - "07-SPIKE-GLASS.md — the Phase-8 glass re-scope verdict: PASS (marginal +0.47pp, total 4.52% < 10%); 07-03's Task-0 gate parses its canonical verdict line"
  - "spike-glass/harness.html + soak.mjs — rerunnable glass-CPU measurement rig (real engine, real master, 4 production-geometry glass surfaces, two-run + sensitivity protocol)"
  - "Phase-8 radius budget numbers: blur 12px default / 16px ceiling (+0.68pp main-thread, +4.15pp whole-tree for 12->16px); display:none removal of inactive glass proven free"
affects: [07-03 integration (Task-0 gate), phase-8 glass build]
tech-stack:
  added: []
  patterns:
    - "Spike harness exercises the REAL engine (esbuild-bundled src module), never a mock — v2 spike-milkyway.html precedent carried forward"
    - "Cross-process measurement honesty: renderer TaskDuration (the comparable gate metric) + whole-Chrome-process-tree CPU sample (catches compositor-side cost the mandated metric cannot see)"
    - "Unmeasured warm-up phase before A/B soak runs so first-load raster-cache transients cannot bias whichever run goes first"
key-files:
  created:
    - .planning/phases/07-real-sky-foundation/spike-glass/harness.html
    - .planning/phases/07-real-sky-foundation/spike-glass/soak.mjs
    - .planning/phases/07-real-sky-foundation/07-SPIKE-GLASS.md
  modified: []
decisions:
  - "Verdict PASS keyed off the 05-06-comparable main-thread marginal (+0.47pp <= 2pp, total 4.52% < 10%) per the plan's 'keyed off the marginal' rule; whole-tree +6.48pp recorded as a software-raster upper bound, not the gate metric"
  - "Real engine imported via esbuild bundle of src/lib/nightsky/scene.ts (esbuild already transitive under vite/astro — zero installs) instead of astro preview: faithful live-code execution with a deterministic static server"
  - "Harness omits -webkit-backdrop-filter (Chrome-only measurement page + the Task-1 single-blur-12px-literal gate); Phase 8's production CSS still requires the prefix per GLASS.md"
  - "Phase 8 blur budget from the sensitivity run: 12px default, 16px hard ceiling over canvas (cost grows ~radius^2: +33% radius = 2.4x the marginal)"
  - "IMG-05 NOT marked complete here — 07-04's gate battery explicitly owns marking IMG-01..05 after the LCP checkpoint; this spike only validates the overlay/glass coexistence budget"
metrics:
  duration: ~35 min
  completed: 2026-07-19
status: complete
---

# Phase 7 Plan 02: Spike 2 — Glass-over-Animating-Canvas CPU Summary

**One-liner:** The Phase-8 re-scope gate is open — 4 production-geometry blur(12px) glass surfaces over the real animating scene cost +0.47pp of main-thread CPU (4.04% → 4.52%, 60s CDP soaks, 60fps held, 0 long tasks, 0 layout), a PASS with 5.5pp of floor headroom; blur-16px sensitivity (+0.68pp) hands Phase 8 its radius budget.

## What was built

### Task 1 — `spike-glass/harness.html` + `spike-glass/soak.mjs` (commit 7dff011)
- Harness stack per 07-RESEARCH.md §3.2: committed 2560w AVIF master (bottom) → `#nightsky-canvas` driven by the **real `initNightSky()`** (esbuild-bundled `src/lib/nightsky/scene.ts` — blit + ~40 twinkle + 9 fireflies + constellation/meteor hooks, the exact production idle loop) → 4 mock `.glass` surfaces at production geometry (header 64px, footer 88px, jump index 160×220, panel 880×60vh) with `backdrop-filter: blur(12px) saturate(150%)` over `rgb(255 255 255 / 0.07)`.
- One page serves every run: `?glass=0/1` toggles the surfaces via a `display:none` class; `?blur=N` string-builds an inline override for the sensitivity probe (keeps the stylesheet the single `blur(12px)` literal — Task-1 gate).
- `soak.mjs`: `findChrome`/`launchChrome`/`Cdp`/`connectCdp` reused **verbatim** from `scripts/verify-contrast.mjs`; tiny node http server for `/sky/` + the bundle; exact 1440×900 DPR1 via `Emulation.setDeviceMetricsOverride`; per run records wall-clock, TaskDuration→CPU%, ScriptDuration, LayoutDuration, long-task count (in-page `PerformanceObserver`), realized fps (rAF counter snapshotted at the metric-window edges), plus the supplementary whole-process-tree CPU sample. `finally` block kills Chrome + removes tmp profile/bundle (T-07-03).

### Task 2 — 60s soaks + `07-SPIKE-GLASS.md` verdict (commit 75c33f3)

| run | CPU % (main thread) | ScriptDur Δ | LayoutDur Δ | long tasks | fps | tree CPU % |
|---|---|---|---|---|---|---|
| baseline: scene alone | **4.04** | 0.991s | 0.000s | 0 | 60.0 | 20.22 |
| glass: 4× blur(12px) | **4.52** | 1.143s | 0.000s | 0 | 60.0 | 26.70 |
| sensitivity: 4× blur(16px) | 5.20 | 1.375s | 0.000s | 0 | 60.0 | 30.85 |

- **Marginal (the gate number): +0.47pp** (≤ 2–3pp budget) · **total 4.52% < 10%** → canonical line `Verdict: PASS` (exactly one, mechanically parseable by 07-03 Task-0).
- Baseline sanity: 4.04% sits at the low end of the live 5.6–6.9% family — scene-only harness (no deck DOM/scrim/panels), exact 1440×900 vs 05-06's 1424×805, identical per-frame engine code (07-03's Layer-0 slimming hasn't run and wouldn't change per-frame cost anyway).
- Radius sensitivity for Phase 8: 12→16px costs +0.68pp main-thread / +4.15pp whole-tree (~radius² growth confirmed) → 12px default, 16px ceiling over canvas.
- FAIL protocol stated verbatim in the spike doc (not triggered).

## Verification results

| Gate | Result |
|---|---|
| Task-1: files exist + exactly one `blur(12px)` literal in harness.html | PASS |
| Task-2: 07-SPIKE-GLASS.md exists with a single verdict tier | PASS |
| Canonical verdict line: one `^Verdict: PASS$` line, no other `Verdict: ` line-start | PASS (line 80, count 1/1) |
| `git diff --exit-code -- package.json package-lock.json` | PASS — zero new dependency (T-07-SC; esbuild is pre-existing transitive) |
| Both 60s soaks completed; marginal computed | PASS |
| FAIL-STOP protocol wired (stated verbatim; not triggered) | PASS |
| No push | HELD — all commits local on main |

## Deviations from Plan

### Auto-fixed / added

**1. [Rule 2 — measurement honesty] Whole-process-tree CPU cross-check added to soak.mjs**
- **Found during:** Task 1 smoke run — the mandated `Performance.getMetrics` `TaskDuration` covers the renderer main thread only, while backdrop-filter blur executes in the compositor (viz/GPU process). A near-zero main-thread marginal alone could have been a false PASS.
- **Fix:** per-run cumulative kernel+user CPU sampled across the Chrome process tree (Win32_Process walk). Canonical verdict still keys off the 05-06-comparable marginal; the tree number (+6.48pp under pure software raster) is recorded as the conservative upper bound with its interpretation.
- **Commit:** 7dff011

**2. [Rule 1 — shakedown measurement bugs] fps/tree-wall accounting + first-run contamination**
- **Found during:** Task 1 shakedown — (a) the blocking PowerShell tree samples let frames accumulate outside the metric window (fps read 122); (b) the first measured run absorbed first-load transients (tree CPU read 48% vs ~20% steady state), making glass appear *cheaper* than baseline.
- **Fix:** frame counter snapshotted exactly at the `getMetrics` window edges; tree wall-clock uses PS-call midpoints; 15s unmeasured warm-up before the first measured run. All fixed pre-commit.
- **Commit:** 7dff011

### Documented deviations

**3. Harness omits `-webkit-backdrop-filter`** — Chrome-only measurement page; the duplicate would also break the Task-1 "exactly one blur(12px) literal" gate. Phase 8's production CSS still needs the prefix (GLASS.md §4.1).

**4. Engine served via esbuild bundle, not astro preview** — the plan offered "astro preview OR a tiny static file server"; bundling `scene.ts` with the already-present esbuild gives the literal live module graph with zero dev-server noise and zero installs.

**5. Blur-16px sensitivity run added** (cheap third soak) — hands Phase 8 the radius-cost number without a new spike.

**6. IMG-05 left unmarked in REQUIREMENTS.md** — 07-04's acceptance battery explicitly owns marking IMG-01..05 complete after the LCP checkpoint; this plan only contributes the coexistence-budget evidence.

## Authentication Gates

None.

## Known Stubs

None — harness, driver, and verdict chain operate end-to-end and are rerunnable (`node .planning/phases/07-real-sky-foundation/spike-glass/soak.mjs --blur16`).

## Threat model outcome

- T-07-03 (leftover headless Chrome): mitigated — `finally` kills the process and best-effort-removes the tmp profile + bundle dir every run.
- T-07-SC (supply chain): held — zero installs; package.json/package-lock.json byte-identical (`git diff --exit-code` clean).

## Next Phase Readiness

- **07-03 is unblocked:** its Task-0 gate will find `Verdict: PASS` at line 80 of 07-SPIKE-GLASS.md.
- Phase 8 inherits measured numbers, not folklore: +0.47pp for 4 surfaces at 12px; 12px default / 16px ceiling; `display:none` removal proven free (the baseline run had all 4 divs in DOM); ≤4-surface ceiling re-affirmed; GLASS.md §1.4 ladder untouched as headroom.

## Self-Check: PASSED

- All 3 artifacts exist on disk (harness.html, soak.mjs, 07-SPIKE-GLASS.md) — verified via `test -f`.
- Commits 7dff011 and 75c33f3 exist in history.
- Task-1 and Task-2 automated verify commands re-run green; canonical-verdict-line grep count 1/1.
