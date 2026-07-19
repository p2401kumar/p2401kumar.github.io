---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: Real Sky
current_phase: 7
current_phase_name: Real-Sky Foundation
status: ready_to_plan
stopped_at: v3.0 roadmap created
last_updated: "2026-07-19T04:29:28.245Z"
last_activity: 2026-07-19
last_activity_desc: "07-01 executed: build-sky.mjs + verify-banding.mjs + 5 banding-free sky masters committed (winner A-core-t20)"
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 4
  completed_plans: 1
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-18)

**Core value:** Within seconds of landing, a senior engineering leader should think "this person operates at our level" — credibility delivered through demonstrated craft (a live systems demo), not adjectives. v3.0 adds: the sky becomes *real* — composited astrophotography, glass, and living atmosphere, with every floor intact.
**Current focus:** Milestone v3.0 Real Sky — roadmap created (phases 7-10, coarse granularity); ready to plan Phase 7 (Real-Sky Foundation, spikes-first).

## Current Position

Phase: 7 (Real-Sky Foundation) — executing
Plan: 2 of 4 (07-01 Spike 1 banding COMPLETE — masters committed; next: 07-02 glass spike)
Status: executing — Spike 1 PASS (banding gate + eyeball evidence); 07-02/07-03/07-04 remain
Last activity: 2026-07-19 — 07-01 executed: build-sky.mjs + verify-banding.mjs + 5 banding-free sky masters committed (winner A-core-t20)

## Performance Metrics

**Velocity:**

- Total plans completed (v3.0): 0
- Average duration: - min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 7 | 0 | - | - |
| 8 | 0 | - | - |
| 9 | 0 | - | - |
| 10 | 0 | - | - |

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

<details>
<summary>v2.0 plan history (shipped 2026-07-18)</summary>

| Phase 04 P01 | 12min | 3 tasks | 7 files |
| Phase 04-deck-mechanics P02 | 14min | 2 tasks | 2 files |
| Phase 04 P03 | 70min | 2 tasks | 4 files |
| Phase 05 P01 | 14min | 1 tasks | 4 files |
| Phase 05 P02 | 10min | 2 tasks | 3 files |
| Phase 05 P03 | 25min | 2 tasks | 5 files |
| Phase 05 P04 | 12min | 2 tasks | 2 files |
| Phase 05 P05 | 13min | 2 tasks | 2 files |
| Phase 05 P06 | 66min | 3 tasks | 15 files |
| Phase 05.1 P01 | 75min | 3 tasks | 10 files |
| Phase 06 P01 | 24 min | 3 tasks | 12 files |
| Phase 06 P02 | ~50 min | 2 tasks | 5 files |

</details>
| Phase 07 P01 | 35m | 3 tasks | 23 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **[v3.0 Roadmap]**: Coarse granularity mapped v3.0's 18 requirements onto exactly the 4 research-recommended phases — Phase 7 Real-Sky Foundation (IMG-01..05), Phase 8 Glass System (GLS-01..04), Phase 9 Living Sky (AMB-01..05), Phase 10 Integration & Launch (FLR-01..03 + LNC-01). Sequence: Foundation → Glass → Ambient → Launch.
- **[v3.0 Roadmap]**: Both empirical spikes (banding + glass-over-animating-canvas CPU) run FIRST inside Phase 7 before any pipeline/integration work (v2's spike-first pattern). The glass-CPU spike is the milestone's re-scope trigger — if the marginal re-blur cost can't tune under the <10% idle floor, "full glass over a permanently-animating scene" gets a structural rethink before glass is built.
- **[v3.0 Roadmap]**: Glass (Phase 8) precedes Ambient (Phase 9) because the re-architected screenshot-sampling contrast verifier + the measured glass re-blur CPU budget together constrain what ambient can spend against the <10% idle floor — building ambient first would force a re-tune once glass eats the budget.
- **[v3.0 Roadmap]**: FLR-01 mapped to Phase 10 (final live Lighthouse verification) even though its LCP checkpoint is lifted forward into Phase 7's research gate immediately after photo integration — the requirement is mapped to the phase that completes it.
- **[v3.0 Roadmap]**: Phase 10 deploy gated on explicit user go with a documented rollback path (v2 precedent recorded in PROJECT.md Key Decisions — replacing the live professional site is outward-facing).

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
- [Phase 05]: Milky Way zero-dependency scatter+gradient technique PASSED the spike's objective banding bar on first attempt; recovery ladder steps 1-3 built in as default, simplex-noise fallback not needed
- [Phase 05]: All 4 provisional sky-token hex values from 05-UI-SPEC.md confirmed unchanged: --sky-zenith #05070a, --sky-horizon #141a2c, --milkyway #cfd9f2, --star #eef2fa
- [Phase 05-02]: education-patents constellation source annotation reuses only patents.ts strings (not USC/IIT Dhanbad) since experience.ts/systems.ts/patents.ts are the only honesty-gate-permitted files
- [Phase 05-02]: StarMagnitude uses a 2-value mid|bright convention rather than the 4-band ambient field scale, since constellation stars always render larger/brighter than the ambient field regardless of band
- [Phase 05]: NightSky.astro scene host uses z-index:-1 (not 0) so it stays behind static content in both deck-active and the DECK-07 no-JS fallback mode — CSS painting order places position:fixed z-index:0/auto elements above non-positioned in-flow siblings within the same stacking context; only a negative z-index guarantees background-layer behavior in every mode while still sitting below .deck's z-index:1 whenever deck-active is present
- [Phase 05]: Wired a one-time generate+blit bootstrap for Layer 0 in this plan rather than deferring all script wiring to 05-04 — The plan's own prohibition text states Layer 0 is generate-once + blit; the rAF driver arrives in 05-04 - the blit itself belongs in 05-03, only the continuous per-frame loop is deferred; verified via headless-Chrome screenshots at DPR1/DPR2
- [Phase ?]: 05-04: twinkle subset = uniform-stride half of Mid/Bright metadata (~6.5% of field, inside the locked 5-8% window)
- [Phase ?]: 05-04: renderStaticFrame is clear + Layer-0 blit only — stars already baked at base alpha; twinkle/fireflies fully OFF under reduced motion
- [Phase ?]: 05-04: NightSky.astro's 05-03 bootstrap fully superseded by initNightSky — single boot path, no dead script
- [Phase 05]: 05-05: constellation star alphas carry a magnitude split within each locked UI-SPEC range (bright anchors top, mid connectors lower) for internal cluster hierarchy in every state
- [Phase 05]: 05-05: link-firing candidates = all non-Brightened constellations (Dimmed included); beam geometry recomputed from the per-size cache each advance so resize never strands a beam
- [Phase 05]: 05-05: setFiringSuppressed(true) discards the in-flight beam as well as the pending timer — paused/static frames are structurally beam-free
- [Phase ?]: 05-06: SKY-05 proven measure-first — scrim ceiling (0.38) cannot cover saturated additive sky pixels, so the scene gained a column brightness governor (MW x0.12, star cap 0.25, twinkle exclusion) + constellation margin remap + firefly margin containment; worst-case went 1.84 -> 8.24 vs --ink
- [Phase ?]: 05-06: scrim lives on .deck::before (viewport-anchored) not .panel::before — abspos pseudos scroll away inside overflow:auto panels; classic mode gets the same gradient as a section background
- [Phase 05.1]: 05.1-01: MASK_OFFSET_RATIO corrected 1.85->0.25 (Rule 1) — unique offset yielding the spec's locked thin 0.20R waning crescent; LIT_ALPHA stayed 0.45; moon + meteor shipped inside all Phase-5 floors (rAF 2/0/0, Lighthouse 98-100, contrast 9.27/8.07)
- [Phase 06]: 06-01: one-active-animation verified on the event-driven contract; cold /#fig-01 scene-animating edge + /#work->hero fallback recorded as fix-forward, not patched
- [Phase 06]: 06-01: headless focus-event gap fixed via CDP focus emulation in audit tooling only — product code untouched
- [Phase 06]: 06-02: Fix-then-launch — both 06-01 fix-forward items fixed and battery re-run green before the deploy, per the user's contingent approval (Fix 2 edges, then launch)
- [Phase 06]: 06-02: Fix B pause seed reads DOM state (html.deck-active + active panel data-panel-id) at first Layer-0 adoption — timing-safe, zero deck imports
- [Phase 07]: 07-01 winner crop A-core-t20: NOIRLab core anchor (2050,1040), 20deg clockwise, core at frame (0.84,0.58) — All 3 candidates passed the banding gate; A alone puts the true galactic core in the UI-SPEC core zone with a quiet left margin
- [Phase 07]: 07-01 saturation deviation: bulk sky graded to hue 218deg / S~31% HSL vs UI-SPEC <=15% — The grading target tokens themselves are S 33-37% HSL; <=15% is unreachable while matching the token family — intent (no clashing hue patches) honored
- [Phase 07]: 07-01 integration note: mobile object-position should target ~10% 70%, not 12% 25% — The committed master's upper-left carries band glow; the quiet region is the lower-left seam-faded zone
- [Phase 07]: 07-01 Task 3 eyeball checkpoint auto-resolved under /gsd-autonomous — Committed encode + histogram evidence; objective gate held hard; async user veto available (rerun build-sky.mjs to swap masters)

### Pending Todos

None yet.

### Blockers/Concerns

- **Milestone re-scope trigger (Phase 7 Spike 2)**: the "full glass over a permanently-animating scene" premise is gated by the glass-over-animating-canvas CPU spike. If the marginal re-blur cost can't tune under the <10% idle floor, glass scope is restructured (glass over static-only regions) before Phase 8 builds it. Empirical, decided in Phase 7.
- **NOIRLab license (Phase 7, IMG-04)**: `noirlab2430b` license/resolution corroborated via mirrors only (site bot-gated); manual browser check of noirlab.edu/public/copyright/ required before ship — ESO `eso0932a` is the CC BY 4.0 fallback.

<details>
<summary>v2.0-era blockers (resolved)</summary>

- **Milky Way visual technique (LOW confidence)**: RESOLVED — Phase 5's zero-dep scatter+gradient passed the banding bar first try; simplex-noise fallback not needed.
- **Fig. 01 keymap collision (integration risk)**: RESOLVED — deck keymap resolved against `src/lib/fig01/` arrow-key semantics in Phase 4.
- **GitHub Pages hosting target**: RESOLVED 2026-07-15 — user root, repo `p2401kumar.github.io`, no `base` path. Old `/home` repo retirement remains a post-launch task.

</details>

## Deferred Items

Items acknowledged and carried forward:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Post-launch | Retire/redirect old `p2401kumar.github.io/home` repo | Open | v1.0 close |
| v2 backlog | Notes/blog (NOTE-01), /craft (NOTE-02), 3rd case study (CASE-04), JSON-LD (PLAT-08), panel-aware OG (OG-02) | Deferred | v2.0 scoping |

## Session Continuity

Last session: 2026-07-19T04:27:44.492Z
Stopped at: v3.0 roadmap created — phases 7-10 mapped (18/18 requirements), ready to plan Phase 7
Resume file: None

## Operator Next Steps

- Review the v3.0 roadmap (`.planning/ROADMAP.md`) — 4 phases (7-10), spike-first Phase 7, glass-before-ambient sequencing
- Plan Phase 7 with `/gsd-plan-phase 7` — both empirical spikes (banding + glass-CPU) run FIRST inside the phase before any pipeline work
- (Carried from v2.0 close) retire/redirect the old `p2401kumar.github.io/home` repo; run the live-site real-device touch + 5-min idle-CPU check at your leisure (06-01-LAUNCH-READINESS.md §5–6)
