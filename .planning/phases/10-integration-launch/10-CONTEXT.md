# Phase 10: Integration & Launch - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure verification + gated launch — the v2.0 Phase 6 pattern, proven. Everything v1/v2/v3 promised is re-verified against the assembled whole locally, a decision-ready launch pack is produced, and the deploy happens ONLY on explicit user approval. FLR-01..03 + LNC-01.

Two plans, hard-gated between them:
- **10-01 — Launch readiness (all local, autonomous)**: the full carry-forward regression battery, the Fig. 01 embedded 36-check audit re-run, live-parity smoke of every route/mode, the evidence pack.
- **10-02 — Launch (BLOCKED on explicit user go)**: fast-forward push (the deploy — deploy.yml fires on push to main; main is ~55+ commits ahead), Actions watch, live verification, live Lighthouse (FLR-01 authoritative), closeout.

NOT here: new features, new UI, content changes, ambient/glass/photo tuning (all locked and verified), /home repo retirement (still the tracked post-launch item).

</domain>

<decisions>
## Implementation Decisions

### Deploy gate (LOCKED — v2 precedent, recorded in PROJECT.md Key Decisions)
- 10-02's first task is a blocking human checkpoint that autonomous mode must NOT auto-resolve: the push replaces the live v2.0 Night Sky with v3.0 Real Sky — outward-facing publication of the user's professional site. The orchestrator stops after 10-01, presents the launch pack + go/no-go (offering the same option shape the user chose last time: launch now / fix-listed-items-then-launch / hold).
- Push discipline: fast-forward ONLY (merge-base ancestor check before push), never force. Rollback documented in the pack: revert range + FF push; tags v1.0 + v2.0 on origin mark both prior generations.

### The carry-forward regression battery (10-01 — lift the list verbatim, every item re-run against the final build)
1. **Fig. 01 embedded audit**: the complete 36-check CDP audit from v2's 06-01 re-run (cold /#fig-01 deep-link no-0×0 + scene-pause seed, send/fault/weigh-away/~8s self-heal, 10 keyboard proxies + sr-only narration, resize-while-inactive→activate, classic mode, reduced-motion + fault narration, one-active-animation with the FULL ambient set now behind it)
2. **Deck mechanics**: wheel/keys/jump one-gesture-one-panel, hash routing + back/forward, /#work alias → systems, deep-link cold-loads, view-classic escape + return
3. **No-JS classic**: photo present (it's <img>/CSS), content readable, Fig. 01 no-JS floor (10 proxy buttons + log in dist), glass degrades per @supports/declare-nothing
4. **Case studies + SEO**: /work/* cold-load scene-free (leak gate: zero nightsky//sky//ambient refs), Back→#systems, sitemap exactly 3 routes, 404 sane, credit line present both modes
5. **Full gate suite**: astro check 0 · build green · zero-hex (all tokens incl. --glass-*/--aurora in tokens.css only) · single-rAF (scene=2, fig01=2, all ambient modules=0) · zero deck/fig01 imports in scene modules · --selftest + --agreement-selftest + --cdp-screenshot both viewports all surfaces ≥4.5 · --moon + --aurora both viewports · verify-banding selftest + masters + ambient crops · ambient soak <10% total (the 5.49% family) 60fps 0 long tasks · pause-machine capture-pairs · canvas transform none · shed-ladder spot check · reduced-motion byte-identical still
6. **Local Lighthouse pre-flight** both presets ≥90 ×4 (the 99/100 family) with LCP/CLS/TBT recorded

### Live verification (10-02, post-approval)
- Push → `gh run watch --exit-status` → view-source sanity (has-sky body, deck markup, picture/preload, nightsky chunk) → live smoke: /, /#fig-01 (pause seed), /#work (alias), both /work/* pages, 404, credit line + its two links resolve → LIVE Lighthouse both presets ≥90 ×4 recorded (FLR-01 authoritative evidence) → REQUIREMENTS FLR-01..03 + LNC-01 complete → ROADMAP/STATE → SUMMARY → docs FF push
- Live Lighthouse <90 in any category: record + STOP for user fix-forward decision (never auto-revert) — v2 rule
- Failure of Actions run: STOP and report; Pages keeps serving the previous deploy

### OG-03 (opportunistic, 10-01, planner's discretion)
- The static OG image still shows the v1/v2-era look. If trivial (capture the 1200×630 hero still from the reduced-motion frame via headless Chrome + place as the existing OG asset path), refresh it inside 10-01 with a build+meta verify; if it turns into real design work, record as deferred (OG-03 stays in Future Requirements). Honesty gate applies (it must be a real capture of the real site).

### Real-device checklist (carried from v2 by standing agreement)
- Presented in the launch pack for the user to run on their phones post-deploy (rollback available): swipe one-panel, iOS edge-swipe intact, jump-index tap, deep-link cold-load, view-classic, Fig. 01 touch, PLUS v3 additions: photo loads fast on cellular, glass renders (iOS Safari -webkit path), parallax nudge feels right, no scroll jank with ambient live, 5-min idle battery/warmth check (the <10% soak's real-world confirmation)

### Launch-readiness pack (10-01-LAUNCH-READINESS.md — decision-ready, 06-01's shape)
- What changes live (v2 night sky → v3 real sky: the photo, glass chrome, living ambient) with before/after screenshots
- The full gate table with numbers · screenshot index (hero, tier-2 panel, jump index, aurora+moon, reduced-motion still, mobile 375w, classic mode) · rollback plan · the real-device checklist · fix-forward list (anything known-cosmetic, e.g. the aurora lateral-softening lever deliberately not taken)

### Research + UI-SPEC: skipped (documented rationale — same as v2 Phase 6)
- Every activity uses in-repo proven patterns (the 06-01 audit script approach, the deploy flow, all verifier modes). No new UI surface (OG refresh is a capture, not a design). The roadmap's research-gate items are verification requirements → they become plan tasks.

### Claude's Discretion
- Evidence formats (follow conventions), audit-script reuse vs fresh-write for the Fig. 01 36 checks, OG capture framing

</decisions>

<canonical_refs>
## Canonical References

- `.planning/milestones/v2.0-phases/06-integration-launch/` — the proven Phase-6 pattern: 06-01-LAUNCH-READINESS.md shape, the 36-check audit technique, 06-02's gated-launch flow
- `.planning/research/SUMMARY.md` carry-forward list + `.planning/phases/09-living-sky/battery/` (the current all-green reference numbers)
- `scripts/verify-contrast.mjs` (all modes) + `verify-banding.mjs` + `.planning/phases/09-living-sky/battery/ambient-soak.mjs`
- `.github/workflows/deploy.yml` (push-to-main = deploy) · tags v1.0/v2.0 on origin (rollback anchors)
- `.planning/ROADMAP.md` Phase 10 (4 success criteria) + REQUIREMENTS.md FLR-01..03, LNC-01
- Fig. 01 selector contract: src/lib/fig01/index.ts header

</canonical_refs>

<specifics>
## Specific Ideas

- The go/no-go must let the user decide in 60 seconds: lead with the before/after hero shots and the gate table; everything else is appendix
- The reduced-motion still is the proof-of-craft artifact — feature it in the pack
- This launch replaces a 1-day-old v2 — frame the pack honestly: v2 was live for a day; v3 is the same substance with a real sky (the user knew this trajectory; no drama needed)

</specifics>

<deferred>
## Deferred Ideas

- /home repo retirement (post-launch, tracked since v1) · NOTE-01/02, CASE-04, PLAT-08, OG-02 (backlog) · aurora lateral softening (documented lever)

</deferred>

---
*Phase: 10-integration-launch*
*Context gathered: 2026-07-19*
