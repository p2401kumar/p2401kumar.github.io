# Phase 5: Night-Sky Scene - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning
**Source:** v2.0 milestone lock + research corpus + Phase 4 shipped contracts (deck.ts event contract, panel manifest)

<domain>
## Phase Boundary

The persistent zero-light-pollution scene behind the deck: pre-rendered starfield + Milky Way, camper-car silhouette with a single warm glow, sparse fireflies, and the four career-chapter constellations with panel-reactive brightening + occasional link-firing. Covers SKY-01..05 and CONST-01..03. Begins with the Milky Way visual spike (the milestone's one unproven technique).

NOT in this phase: Fig. 01 embedded re-verification, live-URL Lighthouse, deploy (all Phase 6). NO push to origin this phase either.

</domain>

<decisions>
## Implementation Decisions

### Sequencing (LOCKED — research gate)
1. **Milky Way spike FIRST** (~2-3h box): validate the zero-dep scatter+gradient offscreen technique visually before building the engine around it. If irreparably banded, the ~1-2KB simplex-noise package is the approved fallback (must pass the package legitimacy audit + exact pin). Spike output: a committed standalone HTML/screenshot pair + verdict in the phase dir.
2. Then engine, then constellations, then gates.

### Scene architecture (LOCKED — extends Phase 4 patterns)
- Engine: `src/lib/nightsky/scene.ts` (layers, rAF driver, pause logic), `src/lib/nightsky/constellations.ts` (graph render + highlight + link-firing), `src/lib/nightsky/tokens.ts` (runtime token reads). Extract the generic getComputedStyle/parse logic from `fig01/tokens.ts` into `src/lib/shared/css-tokens.ts` NOW (both engines consume it; fig01 must not regress — its existing checks re-run: zero hex, astro check, single-rAF greps)
- `NightSky.astro`: fixed full-viewport canvas host rendered by index.astro BEHIND the deck (z-index under `.deck`, `pointer-events:none`), plus the camper silhouette as a DOM/SVG layer (below content, above canvas or composited into the static pre-render — planner's choice; silhouette itself is hand-authored SVG, never in the rAF loop)
- Layer split by update frequency (LOCKED): Layer 0 = starfield + Milky Way pre-rendered ONCE to an offscreen canvas per resize (chunked/idle-scheduled generation to protect TBT), blitted each frame; Layer 1 = SVG silhouette + copper glow (static DOM/CSS); Layer 2 = per-frame work ONLY: twinkle subset (~5-8% of stars, alpha wobble) + ≤ ~15 fireflies (ground band, slow drift, copper-tinted pulse) + at most ONE constellation link-firing beam at a time
- Single rAF loop for the whole scene; DPR cap 2; `visibilitychange` pause; subscribes to `nightsky:panel-change` — pauses ambient entirely while panel id `fig-01` is active (one-active-animation rule); resumes on leaving
- `prefers-reduced-motion`: render ONE static complete frame (Layer 0 + static stars + silhouette; no fireflies motion, no twinkle, no firing) and never start the loop — same doctrine as fig01's renderStaticFrame
- New sky tokens ALLOWED in tokens.css only (e.g. `--sky-zenith`, `--sky-horizon`, `--milkyway`) — the zero-light-pollution sky may need deeper blacks/blues than `--bg`; zero hex literals anywhere else (canvas reads via shared css-tokens)

### Constellations (LOCKED)
- `src/data/constellations.ts`: typed module — 4 constellations (aws, microsoft, samsung, education-patents) with normalized star coords, magnitudes, link pairs, a display label, a `source` annotation (honesty gate: labels are employer/education names + patent facts only — nothing invented), and a `panelIds` mapping
- Panel→constellation highlight mapping lives IN the data module (single source of truth). Rule: at most ONE constellation brightened at a time; panels without a mapping leave all at ambient. Suggested mapping (planner may refine): fig-01+systems→aws, experience→microsoft, patents→education-patents, skills→samsung, hero/contact→none (all ambient)
- Brightening = alpha/glow lift on that constellation's stars + links over ~400ms ease-out; others dim slightly; driven ONLY by the `nightsky:panel-change` CustomEvent (no imports from deck.ts)
- Link-firing: reuse the fig01 beam MATH PATTERN (t-parameterized head+tail along a segment) reimplemented locally in constellations.ts (do NOT import fig01 modules); one quiet firing every ~6-10s on a random link of the ambient sky (suppressed while paused/reduced-motion)

### Scrim & contrast (SKY-05)
- A content scrim (subtle vertical gradient behind the panel content column, ~30-40% max opacity, preserving the dark look) added at the deck/panel level; text contrast verified at WORST-CASE points — verification samples the brightest sky pixels under text regions (canvas readback in a verification script or screenshot analysis), not averages

### Quality gates (this phase)
- astro check 0 errors; build green; zero hex outside tokens.css; fig01 non-regression greps re-run after the shared-tokens extraction
- Local Lighthouse ≥90 all four categories with deck + scene active (mobile + desktop presets), recorded in the phase dir
- Idle-CPU sanity: with the scene idle 60s+, document evidence the per-frame work is bounded (e.g. DevTools performance sample via browse tooling if it starts, else a reasoned frame-cost audit: elements-per-frame count in the code + TBT from Lighthouse). The formal <10%/5min claim finalizes in Phase 6's live verification if tooling can't measure it locally
- **NO push to origin** (hard prohibition — live site stays v1 until Phase 6)

### Claude's Discretion
- Star counts/densities, Milky Way band angle/composition, exact new token values, glow radii, firefly count (≤15), firing cadence within 6-10s, silhouette artwork details (camper shape, horizon line), chunked-generation scheduling (requestIdleCallback vs setTimeout slices), scrim gradient exact stops

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/research/STACK.md` + `SUMMARY.md` (v2.0 — layering strategy, spike flag, no-new-deps doctrine)
- `.planning/research/PITFALLS.md` (v2.0 — Pitfalls 5-8: battery, TBT, overdraw, contrast)
- `.planning/research/ARCHITECTURE.md` (v2.0 — event contract, shared css-tokens extraction, component split)
- `src/lib/nightsky/deck.ts` (the shipped event dispatcher + panel manifest import pattern)
- `src/data/panels.ts` (panel ids the constellation mapping references)
- `src/lib/fig01/tokens.ts` (source for the shared extraction) and `src/lib/fig01/model.ts` (beam math pattern to mirror, NOT import)
- `src/styles/deck.css`, `src/styles/tokens.css` (where scrim + new sky tokens land)
- `.planning/phases/04-deck-mechanics/lighthouse-scores.md` (the 100/95/100/100 baseline the scene must not regress below 90)
- `.planning/REQUIREMENTS.md` (SKY-01..05, CONST-01..03)

</canonical_refs>

<specifics>
## Specific Ideas

- Zero light pollution means the sky CARRIES the luminance: ground silhouette nearly black, the Milky Way band is the brightest surface on the page; the camper's single copper-lit window/ember is the only warm note (ties to `--accent`)
- Star brightness follows a power-law (many faint, few bright) — realism beats uniform sprinkle
- The constellation links echo the "neural network" idea from the original milestone vision — thin, subtle, occasionally firing; never a plexus mesh
- Fireflies live low (bottom ~25% of viewport), drift slowly, pulse gently — sparse enough to feel discovered, not decorative

</specifics>

<deferred>
## Deferred Ideas

- Fig. 01 embedded re-verification + resize audit → Phase 6
- Live-URL Lighthouse + deploy + real-device touch checklist → Phase 6
- Any constellation interactivity (hover/click on stars) → future (/craft territory)

</deferred>

---

*Phase: 05-night-sky-scene*
*Context gathered: 2026-07-17 via milestone lock + research corpus*
