# Phase 9: Living Sky - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

The static sky comes alive: drifting cloud/haze layers, panel-change parallax, a faint breathing aurora, and atmospheric scintillation — all inside the single rAF + existing pause machine, fitting the measured budget glass left behind, shedding gracefully on mobile, and rendering exactly one static frame under reduced motion. AMB-01..05.

NOT here: deploy (Phase 10), any glass/token/photo changes beyond what ambient strictly needs (new ambient tokens allowed in tokens.css; glass values are LOCKED — an ambient contrast problem is solved in ambient placement/alpha, never by re-tuning glass).

</domain>

<decisions>
## Implementation Decisions

### The measured budget (hard inputs from Phase 8 close-out)
- Main-thread: real-page total with glass = 6.10% → **~3.9pp headroom** under the 10% floor for ALL four ambient systems combined (software raster, 1440×900 DPR1, 60s soak methodology)
- Contrast: the screenshot gate (--cdp-screenshot, both viewports) is the arbiter — worst surface today is header 6.23; **no ambient light source may push any surface below 4.5:1**
- Glass re-blur reality: ambient canvas work under glass surfaces re-blurs per changed frame — ambient systems should bias their visual activity toward the MARGINS (outside panel/chrome footprints) both for contrast AND re-blur cost; the final soak with everything running is the proof

### Physically-honest parallax model (LOCKED — resolves the canvas-transform trap)
Real parallax: near things move, infinity doesn't. Therefore on panel change:
- **Ground/silhouette/camper (DOM)**: largest shift (the "near" layer)
- **Clouds**: middle shift — implemented as a canvas-internal draw-offset transition (clouds are canvas sprites; their offset tweens inside the tick), NOT a CSS transform of the canvas
- **Photo sky + stars/constellations (canvas)**: ZERO shift — they are at infinity; the canvas element is NEVER CSS-transformed (transforming it would shift margin-contained constellations/twinkle into the text column, invalidate contrast geometry, and re-blur every glass surface for 300-500ms)
- CSS `translate3d` transitions (300–500ms, compositor-only, deck.css easing family) apply ONLY to the ground-layer DOM elements; instant under reduced-motion; parallax NEVER sheds on mobile (it's event-driven and compositor-only — effectively free)
- Amounts: small and dignified (UI-SPEC decides exact px; ground likely ≤24px, clouds ≤12px equivalent) — depth cue, not a slideshow effect

### Clouds (AMB-01)
- 2 pre-rendered semi-transparent sprite layers (generated once offscreen like Layer 0 — procedural wisps, tokens-only, no image assets), wraparound blit in the existing tick; slow (research: real drift speeds), LOWER SKY bias (below/around the horizon band, out of the text column's worst-case rects); alpha capped so stars/MW read through; far layer is the FIRST mobile shed
- Cloud pixels under text rects are a contrast risk — the gate decides final alphas/placement

### Aurora (AMB-03)
- Noise-table-driven curtains (precomputed value-noise, zero deps), painted every 3–5 frames into an offscreen layer composited in the tick; slow breathing undulation
- Placement: horizon-region margins (research + placement map), clear of the content column; peak luminance CAPPED below the Milky Way core (same readback assertion pattern as the moon — extend the --moon mode or sibling check: auroraPeak < mwPeak, verified both viewports)
- The one sanctioned added light source; if the gate shows any text-rect regression, aurora dims/moves — glass and scrim stay locked

### Scintillation (AMB-04)
- Upgrade the existing ~40-star twinkle subset's waveform: 2-oscillator precomputed-phase sum + occasional chromatic nudge on the brightest few ONLY; no count widening; margin containment unchanged
- The photo's own stars stay static (research precedent: overlay-motion asymmetry reads fine; the drawn stars are the authored layer)

### Doctrine + pause + reduced-motion (AMB-05)
- All systems inside scene.ts's single rAF (aurora/cloud offscreen updates throttled internally); pause machine unchanged {hidden, fig01-active, reduced-motion} — ambient fully stops in all three
- Reduced-motion static frame: clouds + aurora render ONCE at a fixed phase (static paint, like the moon), scintillation absent (stars at base), parallax instant-jump — zero motion anywhere (WCAG C39)
- Mobile degradation ladder (documented in-code + SUMMARY): shed far cloud layer → throttle aurora to every 8-10 frames → drop chromatic nudge; PARALLAX NEVER SHEDS; trigger = viewport width/deviceMemory heuristic (planner decides, documented)
- Battery to close the phase: full soak with ALL ambient + glass (<10% total, 60fps, 0 long tasks), screenshot contrast gate both viewports all surfaces ≥4.5, aurora/moon luminance assertions, Lighthouse both presets ≥90, single-rAF counts unchanged, zero-hex, reduced-motion static-frame screenshot evidence, banding selftest (clouds/aurora introduce new gradients — verify they don't band)

### Floors (all carried)
- No push; no new dependencies; package.json + .planning/config.json untouched; new ambient tokens (if any) in tokens.css only; scrim + glass values locked; photo masters locked; Fig. 01 untouched; leak gate (ambient JS stays out of /work/* + /404)

### Claude's Discretion
- Cloud sprite generation technique/shape language, exact drift speeds, aurora curtain count/palette-within-tokens, oscillator frequencies, parallax easing, the mobile-shed heuristic

</decisions>

<canonical_refs>
## Canonical References

- `.planning/research/AMBIENT.md` (techniques + budget table per system) + GLASS.md (re-blur interaction)
- `.planning/phases/08-glass-system/08-03-SUMMARY.md` + 08-03-glass-reproof.md (the 6.10%/3.9pp budget + soak methodology) + 08-02-glass-gate.md (per-surface contrast reality)
- `src/lib/nightsky/scene.ts` (the tick + pause machine being extended), starfield.ts (offscreen-generation pattern to mirror for cloud/aurora sprites), constellations.ts (setTimeout/throttle patterns), meteors.ts (transient-object pattern)
- `scripts/verify-contrast.mjs` (--cdp-screenshot gate + the luminance-assertion pattern to extend for aurora)
- `.planning/phases/07-real-sky-foundation/07-UI-SPEC.md` (placement map: band position, margins, horizon) + `.planning/ROADMAP.md` Phase 9 (5 success criteria) + REQUIREMENTS.md AMB-01..05

</canonical_refs>

<specifics>
## Specific Ideas

- The night should feel ALIVE but never busy: at any glance, at most one thing should be perceptibly moving — clouds so slow you only notice they moved when you look away and back; aurora breathing on a ~20s cycle; a meteor still the rare gift
- Parallax is the "oh." moment — the first panel change should make the scene feel physically deep without anyone being able to say why
- Aurora color stays inside the site's cool family (the --sky/--milkyway range, maybe the faintest green-teal within tokens) — never a rainbow

</specifics>

<deferred>
## Deferred Ideas

- Weather states / seasonal skies → /craft someday; audio → never; shooting-star showers → still deferred from 5.1

</deferred>

---
*Phase: 09-living-sky*
*Context gathered: 2026-07-19*
