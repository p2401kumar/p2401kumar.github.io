---
phase: 05-night-sky-scene
plan: 02
subsystem: infra
tags: [astro, typescript, canvas-tokens, honesty-gate, constellations]

# Dependency graph
requires:
  - phase: 02-fig01-canvas
    provides: fig01/tokens.ts (the getComputedStyle/parseHex/rgba bridge this plan extracts from)
  - phase: 04-deck-shell
    provides: src/data/panels.ts (panel id manifest the panelIds mapping references)
  - phase: 01-editorial-shell
    provides: src/data/experience.ts, src/data/systems.ts, src/data/patents.ts (validated honesty-gate source strings this plan reuses verbatim)
provides:
  - "src/lib/shared/css-tokens.ts: engine-agnostic RgbTriple/parseHex/rgba/getRootStyles/readToken bridge"
  - "src/lib/fig01/tokens.ts thinned to a wrapper over the shared module (FigTokens shape + fig01 token names unchanged)"
  - "src/data/constellations.ts: typed 4-constellation data module (CONST-01) with panelToConstellation mapping"
affects: [05-nightsky-tokens, 05-constellation-render, 05-scene-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared token bridge: engine-specific tokens.ts modules delegate hex-parse/rgba/getComputedStyle-once mechanics to src/lib/shared/css-tokens.ts, keeping only their own token name list and shape"
    - "panelToConstellation as single source of truth: derived once from constellations[].panelIds at module load, never re-derived by consumers"

key-files:
  created: [src/lib/shared/css-tokens.ts, src/data/constellations.ts]
  modified: [src/lib/fig01/tokens.ts]

key-decisions:
  - "education-patents constellation's source annotation reuses only the two patents.ts source strings verbatim (joined); USC/IIT Dhanbad education facts from UI-SPEC's suggested label were omitted because they are not present in experience.ts/systems.ts/patents.ts, the three files the plan's honesty gate permits as source material"
  - "StarMagnitude uses a 2-value 'mid'|'bright' convention (not the ambient field's 4-band Faintest/Dim/Mid/Bright) since constellation stars are always larger/brighter than the ambient field regardless of band"
  - "Each cluster's link graph is a 6-star path (5 edges) plus one cross-link (6 total), the max of the UI-SPEC's 4-6 recommended segment range, satisfying 'never a mesh'"

patterns-established:
  - "Pattern: shared/*.ts modules hold generic engine-agnostic mechanics; per-engine tokens.ts modules hold only their own shape + names and delegate to shared/"

requirements-completed: [CONST-01]

coverage:
  - id: D1
    description: "Extracted src/lib/shared/css-tokens.ts and thinned fig01/tokens.ts to a wrapper with identical observable behavior"
    verification:
      - kind: other
        ref: "npm run build && npx astro check (0 errors); grep zero-hex in src/lib/fig01+shared; grep rAF count = 2 in src/lib/fig01"
        status: pass
    human_judgment: false
  - id: D2
    description: "Authored src/data/constellations.ts — 4 typed constellations with normalized coords, magnitudes, link pairs, honesty-gate source annotations, and the panelIds mapping"
    requirement: "CONST-01"
    verification:
      - kind: other
        ref: "npm run build && npx astro check (0 errors); grep constellation id/panelIds/source presence; grep zero-hex in src/data/constellations.ts"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-07-17
status: complete
---

# Phase 05 Plan 02: Shared css-tokens Extraction + Constellation Data Module Summary

**Extracted src/lib/shared/css-tokens.ts from fig01/tokens.ts (zero behavior change) and authored src/data/constellations.ts — the typed 4-constellation CONST-01 data module with honesty-gate source annotations and the authoritative panelIds mapping**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-07-17T23:43:26Z
- **Completed:** 2026-07-17T23:53:09Z
- **Tasks:** 2
- **Files modified:** 3 (1 created + modified as a pair, 1 new)

## Accomplishments
- `src/lib/shared/css-tokens.ts` now holds the generic `RgbTriple`/`parseHex`/`rgba`/`getRootStyles`/`readToken` mechanics with zero fig01-specific token names, ready for `05-03`'s nightsky/tokens.ts to consume without duplicating hex-parsing logic
- `src/lib/fig01/tokens.ts` thinned to a wrapper: keeps `FigTokens` + `getTokens()`'s public contract and identity-stable cache behavior, delegates parsing/formatting to the shared module — fig01 non-regression gate green (astro check 0 errors, build green, zero hex literals, rAF count unchanged at 2)
- `src/data/constellations.ts` ships the CONST-01 typed module: 4 constellations (aws, microsoft, samsung, education-patents), 6 stars each within their UI-SPEC outer-margin bounds, 6 sparse link segments each (path + 1 cross-link, never a mesh), and `panelToConstellation` as the single source of truth for panel-reactive brightening consumed by `05-05`'s render

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract src/lib/shared/css-tokens.ts and thin fig01/tokens.ts (fig01 non-regression gate)** - `de34a41` (feat)
2. **Task 2: Author src/data/constellations.ts — 4-constellation typed data module with honesty gate + panelIds mapping (CONST-01)** - `45ada33` (feat)

**Plan metadata:** (this commit, following)

## Files Created/Modified
- `src/lib/shared/css-tokens.ts` - New: generic RgbTriple/parseHex/rgba/getRootStyles/readToken bridge, no engine-specific names
- `src/lib/fig01/tokens.ts` - Thinned to a wrapper: FigTokens interface + getTokens() token list only, delegates to shared/css-tokens.ts
- `src/data/constellations.ts` - New: typed 4-constellation data module (CONST-01), panelToConstellation mapping + getConstellationForPanel helper

## Decisions Made
- Education-patents constellation's `source` field reuses only the two `patents.ts` source strings verbatim (joined with `; `) rather than the UI-SPEC's suggested "USC MS CS + IIT Dhanbad" text, because those education-institution facts are not present in `experience.ts`/`systems.ts`/`patents.ts` — the three files this plan's honesty gate (and its `read_first`/`must_haves`) explicitly permits as source material. The `label` field ("Education & Patents") is kept as UI-SPEC's data-only starting text since it is never rendered as canvas text this phase.
- `StarMagnitude` uses a 2-value `'mid' | 'bright'` convention (reusing the ambient field's Mid/Bright vocabulary) rather than the full 4-band Faintest/Dim/Mid/Bright scale, since constellation stars always render larger/brighter than the ambient field's largest band regardless of magnitude (per UI-SPEC's "Constellation star radius" note).
- Each cluster's link graph is a 6-star path (5 edges) plus one cross-link (6 total segments) — at the top of the UI-SPEC's recommended 4-6 range, chosen for visual richness while staying unambiguously non-mesh.

## Deviations from Plan

None - plan executed exactly as written. The education-patents source-string scoping above is a direct application of the plan's own explicit honesty-gate constraint (read_first lists only experience.ts/patents.ts/systems.ts as permitted sources), not a deviation from it.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `src/lib/shared/css-tokens.ts` is ready for `05-03` (nightsky/tokens.ts) to consume without re-implementing hex parsing.
- `src/data/constellations.ts` (stars, links, panelToConstellation) is ready for `05-05`'s constellation render to consume directly.
- No blockers. All work is local-only; nothing pushed or deployed (per plan prohibitions).

---
*Phase: 05-night-sky-scene*
*Completed: 2026-07-17*

## Self-Check: PASSED

All created/modified files and both task commit hashes verified present.
