---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Night Sky
current_phase: 04
current_phase_name: Deck Mechanics
status: executing
stopped_at: Completed 04-03-PLAN.md — Phase 04 (Deck Mechanics) complete, ready for verification
last_updated: "2026-07-17T23:24:37.142Z"
last_activity: 2026-07-17
last_activity_desc: Phase 04 execution started
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 33
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-17)

**Core value:** Within seconds of landing, a senior engineering leader should think "this person operates at our level" — credibility delivered through demonstrated craft (a live systems demo), not adjectives. v2.0 adds: the first seconds should also be *beautiful*.
**Current focus:** Phase 04 — Deck Mechanics

## Current Position

Phase: 04 (Deck Mechanics) — READY FOR VERIFICATION
Plan: 3 of 3
Status: Ready to execute
Last activity: 2026-07-17 — Phase 04 execution started

## Performance Metrics

**Velocity:**

- Total plans completed (v2.0): 0
- Average duration: - min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 4 | 0 | - | - |
| 5 | 0 | - | - |
| 6 | 0 | - | - |

**Recent Trend:**

- Last 5 plans: none yet this milestone
- Trend: -

*Updated after each plan completion*

<details>
<summary>v1.0 plan history (shipped 2026-07-17)</summary>

| Phase 01 P01 | 22min | 3 tasks | 13 files |
| Phase 01 P02 | 20min | 3 tasks | 9 files |
| Phase 01 P03 | 15min | 3 tasks | 6 files |
| Phase 01 P04 | 12min | 3 tasks | 3 files |
| Phase 01 P05 | 9min | 3 tasks | 5 files |
| Phase 01 P06 | 9min | 2 tasks | 2 files |
| Phase 01 P07 | ~15min | 3 tasks | 0 files |
| Phase 02 P01 | 25min | 2 tasks | 4 files |
| Phase 02 P02 | 13min | 2 tasks | 1 files |
| Phase 02 P03 | 15min | 3 tasks | 2 files |
| Phase 02-fig01-signature-figure P04 | 13min | 2 tasks | 2 files |
| Phase 02 P05 | 6min | 2 tasks | 0 files |
| Phase 03 P01 | 8min | 3 tasks | 3 files |
| Phase 03 P02 | 6min | 2 tasks | 2 files |
| Phase 03-case-studies-launch-polish P03 | 8min | 3 tasks | 9 files |
| Phase 03-case-studies-launch-polish P04 | 21min | 3 tasks | 3 files |

</details>
| Phase 04 P01 | 12min | 3 tasks | 7 files |
| Phase 04-deck-mechanics P02 | 14min | 2 tasks | 2 files |
| Phase 04 P03 | 70min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **[v2.0 Roadmap]**: Coarse granularity mapped v2.0's 20 requirements onto exactly the 3 research-recommended phases — Phase 4 Deck Mechanics (DECK-01..08), Phase 5 Night-Sky Scene (SKY-01..05 + CONST-01..03), Phase 6 Integration & Launch (INTG-01..04). Sequence is Mechanics → Scene → Integration: the panel-cycling interaction model must be bulletproof before visual content is layered on (half the pitfalls are mechanics, not aesthetics).
- **[v2.0 Roadmap]**: Constellations grouped INTO the Scene phase (not a standalone phase) because CONST-02's panel-reactive brightening depends on the `nightsky:panel-change` event contract and shares the same canvas engine — splitting them would create a thin dependency-coupled phase.
- **[v2.0 Roadmap]**: Case-study routing architecture decided in Phase 4 (Mechanics), not deferred to Phase 6 (Integration) — deep-link/SEO correctness is an interaction-model concern (Pitfall 9), verified for real in Integration.
- **[v2.0 Roadmap]**: Milky Way visual spike (LOW-confidence technique) scheduled FIRST inside Phase 5 before the layered engine is built; a ~1-2KB simplex-noise dep is a fallback only if the zero-dep scatter+gradient bands.

<details>
<summary>v1.0 decisions (shipped)</summary>

- Roadmap: Coarse granularity compressed research's 5 suggested phases into 3 — Foundation+Shell+Content merged; Case Studies+Polish merged
- Roadmap: PLAT-06/PLAT-07 placed in Phase 3 since final verification needs every route (including case studies) to exist first
- [Phase 01]: Scaffolded Astro at repo root by moving files out of create-astro's auto-created subdir
- [Phase 01]: Pinned vite to 8.1.2 via npm overrides to route around a corporate proxy block on vite@8.1.4 (local machine/network issue, not a project constraint)
- [Phase 01]: Added ProfileLink wrapper type ({href, source}) so every profile link carries honesty-gate provenance
- [Phase 01]: SiteFooter clock uses a plain unattributed inline script (no hydration directive)
- [Phase 01]: Backup-then-replace at 01-07; 2021 repo content preserved as branch legacy-2021 @ 00b240e9
- [Phase 02]: createState() deep-clones the canonical nodes topology per call (pure/testable state machine)
- [Phase 02]: node-label/DPR/glyph colors rendered via tokens at alphas instead of hardcoded hex (zero-hex-literal gate)
- [Phase 02]: DOM selector contract for initFig01 documented at top of index.ts (.fig-stage/#fig01-canvas/#fig01-tip/#fig01-log/#send/#fault/.node-proxy[data-node])
- [Phase 03]: Imported z from astro/zod instead of the deprecated astro:content re-export
- [Phase 03]: @astrojs/sitemap pinned as exact 3.7.3 (no caret) per no-drift criterion
- [Phase 03]: No Lighthouse fix-forward needed — all four categories ≥90 first run (home 99/94/100/100, case study 100/90/100/100)
- [Phase 03]: Residual visual QA resolved via gstack /browse automation with recorded evidence

</details>

- [Phase 04-01]: Added html.deck-active .deck { position:fixed; inset:0 } as the panel stack's containing block (Rule 2 — not in the plan's literal deck.css list, required for .panel's inset:0 to resolve reliably against the viewport)
- [Phase 04-01]: Followed 04-UI-SPEC's locked fixed header/footer values (inset-inline:0) literally with no compensating horizontal padding — visual QA of the edge-to-edge chrome deferred to the plan that first wires .deck-active
- [Phase 04-deck-mechanics]: Split .deck-jump/.deck-view-classic/.deck-view-deck DOM validation from Task 1 into Task 2, placed next to the handlers that consume them — Avoids unused-but-declared bindings under noUnusedLocals in Task 1's astro check
- [Phase 04-deck-mechanics]: applyPanelStates(index) takes no animate parameter — Cold-load no-flash guarantee is already structural (state set before .deck-active exists); an unused option would fail noUnusedParameters
- [Phase 04-deck-mechanics]: Gated every deck input handler (wheel/touch/keyboard/jump-list) behind isClassicActive() — Rule 2 fix — without the guard, the next wheel tick or arrow key after entering view-classic mode would immediately re-hide panels, breaking the escape hatch
- [Phase 04-03]: Human decision 'Fix now, guarded' — CLS=1 regression fixed inside this plan via guarded pre-paint deck activation rather than deferred to Phase 6, preserving DECK-07's init-failure fallback guarantee
- [Phase 04-03]: Non-hero deep-link hash loads deliberately excluded from pre-paint speculation (Lighthouse only audits '/'; speculating on arbitrary hashes risked flash-of-wrong-panel) — accepted, documented trade-off
- [Phase 04-03]: Human checkpoint resolved by explicit user direction ('proceed'); real-device touch testing carries forward to Phase 6's checkpoint as pre-agreed

### Pending Todos

None yet.

### Blockers/Concerns

- **Milky Way visual technique (LOW confidence)**: Phase 5's pre-rendered Milky Way band recipe is the one unproven element — flagged for an early spike inside Phase 5 planning. Not a blocker to Phase 4.
- **Fig. 01 keymap collision (integration risk)**: the deck keymap (Phase 4) must resolve against actual `src/lib/fig01/` arrow-key semantics — carry into Phase 4 planning.
- ~~GitHub Pages hosting target~~ **RESOLVED 2026-07-15**: user root — repo `p2401kumar.github.io`, no `base` path. Old `/home` repo retirement remains a post-launch task.

## Deferred Items

Items acknowledged and carried forward:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Post-launch | Retire/redirect old `p2401kumar.github.io/home` repo | Open | v1.0 close |
| v2 backlog | Notes/blog (NOTE-01), /craft (NOTE-02), 3rd case study (CASE-04), JSON-LD (PLAT-08), panel-aware OG (OG-02) | Deferred | v2.0 scoping |

## Session Continuity

Last session: 2026-07-17T22:28:48.473Z
Stopped at: Completed 04-03-PLAN.md — Phase 04 (Deck Mechanics) complete, ready for verification
Resume file: None

## Operator Next Steps

- Plan Phase 4 (Deck Mechanics) with `/gsd-plan-phase 4`
