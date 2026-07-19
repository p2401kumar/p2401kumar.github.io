---
phase: 08-glass-system
plan: 03
subsystem: performance-gates-and-closeout
tags: [gls-04, idle-cpu, cdp-soak, lighthouse, regression-battery, leak-gate, phase-close]
requires:
  - "08-02: the exact glass CSS (13 tokens, tier assignments, cssTarget fix, DeckIndex relocation) this plan re-proves"
  - "07-SPIKE-GLASS: the +0.47pp/4.52% projection + soak methodology this plan validates on the real page"
provides:
  - "GLS-04 PASS on the REAL preview page: total 6.10% < 10% (3.9pp headroom), 60.0fps, 0 long tasks, LayoutDuration 0.000s"
  - "Spike-2 projection confirmed: main-thread marginal ~0 within noise; whole-tree +6.68pp vs spike's +6.48pp (0.2pp agreement)"
  - "Lighthouse with glass live: mobile 99/100/100/100, desktop 100x4, TBT 0ms both — 07-04 family unmoved"
  - "Full carried-floor battery green + airtight leak gate + DeckIndex-relocation smoke PASS (08-03-glass-reproof.md)"
  - "Phase 8 CLOSED: GLS-01..04 Complete, ROADMAP 3/3 [x], STATE advanced to Phase 9 with the ambient budget note"
  - "glass-reproof/real-soak.mjs: reusable real-page soak driver (same-page glass toggle via reduced-transparency emulation)"
affects:
  - "Phase 9: ambient must fit in ~3.9pp main-thread headroom (6.10% measured total); --cdp-screenshot floor is the light-source arbiter"
  - "Phase 10: battery shapes + real-page soak driver carry forward to the launch gate"
tech-stack:
  added: []
  patterns:
    - "Same-page A/B via CDP Emulation.setEmulatedMedia (prefers-reduced-transparency reduce vs no-preference) — the honest glass marginal with zero harness divergence"
    - "Compositor-cost verdicts key off the whole-tree cross-check; main-thread marginal alone is blind to backdrop-filter (and its noise floor swallows +0.5pp)"
    - "Leak-gate assertions must be boundary-correct: assert the <body> class, not file-wide substring counts (inlined unmatched selectors are not leaks)"
key-files:
  created:
    - .planning/phases/08-glass-system/08-03-glass-reproof.md
    - .planning/phases/08-glass-system/glass-reproof/real-soak.mjs
    - .planning/phases/08-glass-system/glass-reproof/real-soak-output.txt
    - .planning/phases/08-glass-system/08-03-SUMMARY.md
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/STATE.md
decisions:
  - "GLS-04 verdict keys off the floors (total <10%, 60fps, 0 long tasks) + the tree cross-check; the -0.70pp main-thread marginal is recorded honestly as scene-script run noise, not a glass credit"
  - "Raw Lighthouse JSONs extracted then not committed (tables are the record) — matches the 07-04 evidence convention"
  - "work/404 has-sky asserted on <body> tags with per-occurrence backdrop-filter accounting — stronger than the plan's literal file-wide grep, which counts unmatched selector text"
  - "Mitigation ladder untouched — 3.9pp headroom; the GLASS.md 1.4 levers remain Phase 9 headroom"
metrics:
  duration: "~25 min"
  completed: "2026-07-19"
  tasks: 3
  files: 7
status: complete
---

# Phase 8 Plan 03: GLS-04 Real-Page Re-Proof + Battery + Phase Close Summary

**One-liner:** The glass CPU budget re-proved on the REAL preview page — total 6.10% idle (<10% floor, 3.9pp headroom), 60.0fps, 0 long tasks, with the whole-tree cross-check landing within 0.2pp of Spike-2's compositor-cost projection — Lighthouse held the 99+100×7 family with TBT 0ms, the full carried-floor battery re-passed green with an airtight leak gate and a passing DeckIndex-relocation smoke, and Phase 8 is closed with GLS-01..04 Complete.

## What was built

### Task 1 — GLS-04 real-page soak + Lighthouse (ac4382d)
- **`glass-reproof/real-soak.mjs`**: real-page adaptation of the 05-06/07-02 soak methodology (CDP pieces verbatim from `spike-glass/soak.mjs`; zero deps). Navigates the built preview ONCE at 1440×900 DPR1, 15s unmeasured warm-up, then toggles glass on the SAME document via `Emulation.setEmulatedMedia`: baseline under `prefers-reduced-transparency: reduce` (verified live: 0 elements with computed backdrop-filter) vs glass under `no-preference` (verified: 4 live surfaces — header, active panel, jump pill, footer — with the exact 08-02 recipes).
- **Soak result (60s each):** baseline 6.80% / glass **6.10%**, both 60.0fps, 0 long tasks, LayoutDuration Δ 0.000s. Main-thread marginal −0.70pp — statistically zero (the glass run's ScriptDuration was 0.24s *lower*; ±0.4pp scene noise dominates). The check that carries the blur cost: whole-tree **+6.68pp vs Spike-2's measured +6.48pp** — the real page reproduces the spike's compositor cost within 0.2pp. Baseline 6.80% sits at the top of the live 5.6–6.9% family (full v3 page: deck DOM + photo stack + 7 panels), as expected.
- **Lighthouse (npx lighthouse 13.4.0, both presets):** mobile **99/100/100/100** (TBT 0ms, LCP 1.86s, CLS 0.003), desktop **100/100/100/100** (TBT 0ms, LCP 0.46s) — identical to the 07-04 pre-glass baseline. Glass added zero JS.
- **Mitigation ladder:** not triggered; all levers remain Phase 9 headroom.

### Task 2 — Full regression battery + leak gate (608d778)
All green, every number in `08-03-glass-reproof.md`: astro check 0/0/0 · build green 4 pages · exactly 13 `--glass-*` tokens (0 hex in their values) · zero-hex across the modified source (DeckIndex via identifier-boundary PCRE) · single-rAF 2/0/0/2 unchanged · zero scene→deck/fig01 imports · `--selftest` (scrim 0.38 sync green) + `--agreement-selftest` + banding selftest + 4 masters all PASS · `--cdp-screenshot` exit 0 both widths (worsts 6.331/6.234, per-surface table matches 08-02's final post-relocation record) · `--moon` unchanged (0.2123<0.4695 @1280, 0.1857<0.4748 @1440) · sitemap 3 routes · package.json/lock/config untouched.
**Leak gate airtight:** index `<body class="has-sky">`; work/404 bodies bare; every one of the 8 backdrop-filter occurrences per work/404 page accounted (4 `@supports` condition text + 4 unmatchable `body.has-sky` rules, unaccounted = 0); zero deck-glass selectors leaked; dist ships both backdrop-filter forms (6+6 — the 08-02 cssTarget fix held); zero `<script src>`/`nightsky`/`/sky/` refs on work/404 (07-04 record matched).
**DeckIndex-relocation smoke (CDP):** `#deck-index` outside `.deck` in dist; jump to `#systems` activates the right panel (count `03 / 07`); `aria-current` follows (exactly one carrier throughout); `nightsky:panel-change` fires exactly 1:1 per navigation — the fig-01 pause contract's transport is intact (dist carries 5 refs; source untouched since 08-02).

### Task 3 — Close-out (this commit)
GLS-04 → Complete in REQUIREMENTS.md (checkbox + traceability; GLS-01..03 were already Complete). ROADMAP: Phase 8 bullet [x] completed 2026-07-19, plan list 3/3 all ticked, progress row Complete. STATE advanced: Phase 8 complete, next = plan Phase 9, Phase-8 decisions appended, velocity row recorded, Phase 9 budget note (~3.9pp headroom + screenshot contrast floor as ambient arbiter).

## Deviations from Plan

**1. [Assertion precision — documented, gate NOT weakened] work/404 `has-sky` asserted on `<body>` tags, not file-wide.** The plan's literal verify (`cat dist/work/*/index.html dist/404.html | grep -o 'has-sky' | wc -l = 0`) counts 6 — all six are *selector text* of the inlined, unmatched `body.has-sky` chrome rules Astro inlines on every page using SiteHeader/SiteFooter. The gate's stated truth ("body has no has-sky class → no chrome-glass rule can match") was asserted boundary-correctly on the `<body>` tags (index = 1, work/404 = 0) PLUS a stronger per-occurrence accounting proving every work/404 backdrop-filter is condition text or an unmatchable rule. Recorded in the reproof file.

**2. [Recorded nuance, no code change] Main-thread marginal measured −0.70pp (negative).** Scene-script run-to-run variance (meteor spawn timing, twinkle phase, ~±0.4pp) swamps a compositor-side cost that never touches the main thread — exactly the blindness Spike-2's tree cross-check was added for. The tree marginal (+6.68pp vs projected +6.48pp) is the honest cost record; the verdict keys off the floors, all of which pass with headroom.

Neither is a Rule 1–4 code deviation: zero source fixes were needed anywhere in the battery.

## Authentication gates
None.

## Known Stubs
None — evidence chain complete end-to-end; no placeholders.

## Threat Flags
None — T-08-03 mitigated and closed (GLS-04 PASS with 3.9pp headroom, ladder untouched); T-08-SC held (zero installs — lighthouse via npx transient per the Phase 4/5/7 precedent; package.json/lock/config byte-identical, asserted). No new endpoints/auth/trust boundaries; real-soak.mjs consumes only its own locally-spawned Chrome.

## Verification summary
- Task 1 verify chain PASS (reproof file exists with marginal/total/Lighthouse content; no "sharp" in package.json)
- Task 2 verify chain PASS (all greps, selftests, CDP gates exit 0; leak assertions boundary-correct)
- Task 3: GLS-01..04 Complete in both REQUIREMENTS lists; ROADMAP 3/3 [x] Complete; STATE advanced; all three 08-0N-SUMMARY.md exist; config.json untouched
- No push; all commits local on main

## Commits

| Task | Commit | Description |
|---|---|---|
| 1 | ac4382d | GLS-04 real-page re-proof PASS + Lighthouse 99+100×7 + soak driver |
| 2 | 608d778 | Full regression battery + leak gate ALL GREEN |
| 3 | (final docs commit) | Phase 8 close-out: REQUIREMENTS/ROADMAP/STATE + this summary |

## Self-Check: PASSED

All 4 created artifacts verified on disk (08-03-glass-reproof.md, glass-reproof/real-soak.mjs, glass-reproof/real-soak-output.txt, 08-03-SUMMARY.md); both task commits (ac4382d, 608d778) verified in git history; GLS-01..04 all Complete in both REQUIREMENTS lists; ROADMAP Phase 8 [x] 3/3 Complete 2026-07-19; .planning/config.json untouched.
