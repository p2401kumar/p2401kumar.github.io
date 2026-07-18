# Phase 6: Integration & Launch - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase is VERIFICATION + LAUNCH, not construction. The integration the roadmap anticipated already happened upstream: all 7 v1 content sections render as panels (hero · fig-01 · systems · experience · patents · skills · contact — built Phase 4, contrast-measured over the scene in 05-06), the scene + celestial extras are shipped and verified (Phases 5, 5.1), and case-study pages exist from v1. What remains: prove INTG-01..04 against the assembled whole, then ship it live.

Two plans, hard-gated between them:
- **06-01 — Integration verification (all local, autonomous)**: Fig. 01 embedded re-verification, case-study routing/cold-load, sitemap, classic mode, full regression battery, launch-readiness evidence pack.
- **06-02 — Launch (BLOCKED on explicit user go)**: fast-forward push → GitHub Actions Pages deploy → live Lighthouse (mobile+desktop) → post-deploy verification. The push IS the deploy: main is 57 commits ahead and .github/workflows/deploy.yml fires on push to main. This replaces the live v1 site.

NOT here: new features, new UI surface, new panels, content changes, /home repo retirement (tracked post-launch item).

</domain>

<decisions>
## Implementation Decisions

### Deploy gate (LOCKED — overrides autonomous auto-resolve)
- The 06-02 push/deploy is a **blocking human checkpoint that autonomous mode must NOT auto-resolve**. Replacing the live professional site is outward-facing publication; the user personally gated the equivalent v1 decision ("Backup, then replace"). The orchestrator stops after 06-01, presents the full evidence pack + go/no-go, and 06-02 executes only on explicit user approval in chat.
- Push discipline unchanged: fast-forward ONLY, never force. Rollback path if the user ever wants it: revert commits + push (v1 remains in history; tag v1.0; branch legacy-2021 preserved).

### Case-study pages stay scene-free (LOCKED)
- /work/* pages keep their v1 editorial rendering: no NightSky mount, no deck. This is already the shipped architecture (05-06's gate literally asserts scene JS is unreachable from /work/*: performance + reading focus). Phase 6 verifies it, does not revisit it. Same for /404.

### Fig. 01 embedded re-verification (INTG-02 — the Pitfall 11 audit)
Panels hide via transform (never display:none), so the canvas keeps a layout box — but the audit must PROVE the checklist under deck reality:
- Cold-load deep-link straight to #fig-01 (pre-paint speculation excludes non-hero hashes → init happens post-load; canvas must have nonzero size at init)
- Cold-load #hero → wheel/keyboard to fig-01 → full v1 interaction checklist (send, fault, weigh-away, self-heal, keyboard proxies, sr-only announcements)
- Resize the window while fig-01 is INACTIVE (rAF paused by the MutationObserver) → activate → canvas re-measures correctly, no 0×0, no stale DPR backing store
- Classic mode (view-classic link + no-JS build output): Fig. 01 fully functional in the scrolling layout
- Reduced-motion: renderStaticFrame path embedded in deck
- One-active-animation rule: scene paused while fig-01 active (already event-verified in Phase 5; re-confirm in the assembled page via CDP/console evidence)

### Case studies + routing (INTG-03)
- Systems panel links → /work/* cold-load (fresh navigation, not SPA) → browser Back returns to the deck at #systems (hash restored, correct panel active)
- Both case-study URLs render standalone with v1 chrome; sitemap-index.xml + sitemap-0.xml list all routes and only real routes; no scene/deck JS in /work/* output (re-run the leak gate)

### Live verification (INTG-04, inside 06-02 after user go)
- GitHub Actions run completes green; live URL serves the deck (view-source sanity: deck markup + nightsky module present)
- npx lighthouse against https://p2401kumar.github.io/ — mobile AND desktop presets, all four categories ≥90, scores recorded in the phase dir (live run replaces local as the requirement's evidence)
- Post-deploy smoke: home cold-load, #fig-01 deep link, one case study, 404 — all over the live origin
- Real-device touch checklist (carried from Phase 4 by explicit prior agreement): presented to the user at the go/no-go; runnable against the live site post-deploy (rollback available). Not automatable — physical devices are the user's.

### Research + UI-SPEC: skipped (documented rationale)
- No phase researcher: every remaining activity uses patterns already proven in-repo (Lighthouse CLI runs, headless-Chrome evidence, contrast/leak/rAF grep battery, the existing deploy.yml from v1). The roadmap's "research gate" items are verification requirements, not open questions — they become plan tasks.
- No UI researcher/checker: zero new UI surface. All visual contracts inherited (04-UI-SPEC deck chrome, 05-UI-SPEC scene + placement, 05.1 addendum). The planner enforces non-regression only.

### Claude's Discretion
- Exact evidence formats (follow the established phase-dir conventions), CDP vs console-log instrumentation for the pause-state proof, whether the 0×0 audit uses a resize script or manual-size assertions in a headless run

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` "### Phase 6" (goal, INTG-01..04, success criteria) + REQUIREMENTS.md Integration & Floors section
- `.planning/milestones/v1.0-phases/` Fig. 01 verification checklist as shipped (Phase 2 gate artifacts) — the checklist INTG-02 re-passes
- `src/lib/fig01/index.ts` (DOM selector contract header) + `interactions.ts` (MutationObserver pause) + `render.ts` (DPR/resize handling — read what init/resize ACTUALLY does before designing the 0×0 audit)
- `src/lib/nightsky/scene.ts` (pause machine — fig-01 one-active-animation proof points)
- `src/data/panels.ts`, `src/components/PanelDeck.astro`, `src/lib/nightsky/deck.ts` (hash routing/back-forward as built)
- `.github/workflows/deploy.yml` (the launch pipeline, unchanged from v1)
- `.planning/phases/05-night-sky-scene/05-06-SUMMARY.md` + `05.1-celestial-extras/05.1-01-SUMMARY.md` (current gate battery + evidence formats + baselines: contrast 9.27/8.07, Lighthouse local mobile 98/100/100/100 desktop 100×4)
- `scripts/verify-contrast.mjs` (runnable gate, --selftest / --cdp / --moon modes)

</canonical_refs>

<specifics>
## Specific Ideas

- The go/no-go presented to the user must be decision-ready: what changes live (v1 → night sky), the full gate table, screenshots (hero/constellation/moon/reduced-motion), the rollback path, and the real-device checklist — no digging required
- Live Lighthouse is the ONLY gate that can't be pre-verified locally; everything else must be green BEFORE the go/no-go so the deploy is anticlimactic

</specifics>

<deferred>
## Deferred Ideas

- /home repo retirement (post-launch task, already tracked)
- v2 backlog unchanged: NOTE-01/02, CASE-04, PLAT-08, OG-02

</deferred>

---

*Phase: 06-integration-launch*
*Context gathered: 2026-07-18*
