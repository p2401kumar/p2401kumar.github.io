# Phase 7: Real-Sky Foundation - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning (license pre-verified)

<domain>
## Phase Boundary

The home page's sky becomes a real composited astrophotography photo — banding-free, credited, LCP-clean — with the authored overlay (constellations, meteors, drawn moon, twinkle subset) surviving on top. BOTH empirical spikes run FIRST inside this phase (v2's spike-first pattern), because Spike 2 is the milestone's re-scope trigger and must fire before Phase 8 builds glass.

NOT here: the glass system build (Phase 8 — only its CPU spike runs here), ambient animations (Phase 9 — clouds/parallax/aurora/scintillation), deploy (Phase 10).

</domain>

<decisions>
## Implementation Decisions

### License + source (VERIFIED 2026-07-18, in-browser, primary source — HIGH confidence)
- noirlab.edu/public/copyright/: images CC BY 4.0, "reproduced without fee provided the credit is clear and visible"; no-endorsement + no-logo-use conditions noted (we use neither)
- noirlab.edu/public/images/noirlab2430b/: "largest open-source, freely available all-sky photo of the night sky", 40000×20000, 360°×180°, credit **NOIRLab/NSF/AURA/E. Slawik/M. Zamani**, NO special license note → general CC BY 4.0 applies
- Available masters: Publication TIFF 10K (91.3MB) · TIFF 4K (15.6MB) · Publication JPEG (3.5MB). Spike 1 starts from the 4K TIFF (15.6MB); escalate to 10K TIFF only if the final crop region needs more source resolution at 2560w output. DOWNLOAD SCOPE: these named NOIRLab assets (+ ESO eso0932a only if fallback triggers) — nothing else.
- Credit line (IMG-04): `Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0` with "NOIRLab" linked to the image page and "CC BY 4.0" linked to the license — placed in the site footer/colophon in both deck and classic modes.

### Spike 1 — Banding (gates the pipeline)
- Encode ladder: sharp/avifenc AVIF 10-bit 4:4:4 at q≈55-60 (+ film-grain/noise strategy, + the 2×-resolution-lower-quality variant) vs WebP fallback; judge on a real 8-bit display + histogram comb-spike test (script the histogram check — it joins the gate battery)
- Output artifact: SPIKE-BANDING.md with the winning recipe + encoded evidence files + the histogram script committed

### Spike 2 — Glass-over-animating-canvas CPU (the RE-SCOPE TRIGGER)
- Standalone harness (like v2's spike-milkyway.html): the real photo + the current live scene canvas + 4 MOCK backdrop-filter surfaces at production-like sizes/blur(12px). Measure: idle CPU scene-alone vs scene+glass (60s CDP soak, same methodology as 05-06's 5.6% baseline). Marginal budget: ≤2-3% (total <10%)
- Verdict tiers in SPIKE-GLASS.md: PASS (full glass proceeds in Phase 8) / PASS-WITH-LADDER (mitigations required, enumerate which) / FAIL → STOP THE CHAIN and present the structural rethink to the user (this is a designated autonomous-mode stop)

### Photo delivery + layering
- `<picture>` (AVIF + WebP sources) or CSS background in NightSky.astro's DOM BELOW the canvas — plain HTML/CSS so it renders in no-JS classic mode; never canvas-drawn
- z-order: photo img (bottom) → overlay canvas (current z-index:-1 host, canvas above img within it) → ground/camper silhouette → content/glass. Planner reads the current NightSky.astro/deck.css stacking reality before choosing exact z values
- LCP: preload + fetchpriority=high + inline LQIP (tiny blurred placeholder, no CLS); the LCP checkpoint (local Lighthouse both presets + LCP number vs the 1.5-2.8s research budget) runs immediately after integration and BLOCKS the phase from completing hot

### Overlay adaptation (starfield.ts evolves, not forked)
- Procedural Milky Way: OFF (the photo provides it). Procedural 4-band ambient field: REDUCED to the ~40-star twinkle subset (scintillation upgrades it in Phase 9) — the photo provides ambient stars
- KEPT drawn: career constellations (+panel brightening), meteors, crescent moon (physics decision recorded), the twinkle subset, ground/silhouette/camper/copper glow (the photo is sky-only — no horizon in the equirectangular master; our composite crops sky and our existing ground treatment stays)
- Layer 0 becomes transparent except authored elements; generation gets cheaper, blit path unchanged; sky-brightness governor logic re-evaluated against the photo (the governor attenuated the PROCEDURAL MW inside the text column — with a photo backdrop, the equivalent duty moves to crop/exposure choice + scrim, verified by contrast)
- Contrast floor over the photo: the verifier's analytic mode breaks the moment the backdrop isn't canvas — pull the minimal photo-aware sampling forward into THIS phase (composite img+canvas in the sample, still pre-blur), leaving the full screenshot-sampling re-architecture for Phase 8's gate as planned. Planner decides the smallest honest evolution; silent unverified contrast is not acceptable for even one commit

### Composite recipe (build-time, one-time)
- Equirectangular 360×180 → select a Milky-Way-band crop region that reproduces the current design's diagonal band placement (05-UI-SPEC band geometry as the target look — read it), level/rotate, bottom gradient-blend into --bg for the ground seam, export masters (2560w + 1920w; LQIP ~32w inline) via a committed script (scripts/build-sky.mjs or similar) — masters checked in, raw TIFF NOT checked in (gitignore it; document the recipe for reproducibility)

### Floors (all carried)
- astro check 0, build green, zero-hex (any new tokens in tokens.css), single-rAF counts unchanged, no deck/fig01 imports in scene modules, no push, no new npm dependencies (sharp already present via astro; avifenc via npx/sharp only — if a genuinely new tool is unavoidable, that's a SUS stop), Lighthouse ≥90 both presets at the LCP checkpoint

### Claude's Discretion
- Exact crop window, blend gradient stops, LQIP encoding, preload markup details, whether the photo lives as <img> or CSS background (LCP-discoverability decides), spike harness file layout

</decisions>

<canonical_refs>
## Canonical References

- `.planning/research/SUMMARY.md` + `IMAGERY.md` + `PITFALLS.md` (encode recipes, LCP ladder, banding pipeline, precedent)
- `.planning/research/GLASS.md` (mock-glass spike parameters) + `AMBIENT.md` (what Phase 9 will need from the photo — don't paint it into a corner)
- `.planning/milestones/v2.0-phases/05-night-sky-scene/05-UI-SPEC.md` (band geometry the crop reproduces) + `05-06-SUMMARY.md` (governor + contrast baselines)
- `src/lib/nightsky/starfield.ts` + `scene.ts` + `src/components/NightSky.astro` (as live — the overlay adaptation surface)
- `scripts/verify-contrast.mjs` (the verifier that gains photo-aware sampling)
- `.planning/ROADMAP.md` Phase 7 (6 success criteria) + REQUIREMENTS.md IMG-01..05

</canonical_refs>

<specifics>
## Specific Ideas

- The crop should feel like the SAME campsite on a clearer night — the Milky Way band lands where the procedural one lived, so returning visitors sense an upgrade, not a redesign
- The seam between photo sky and drawn ground must be invisible at every viewport — the gradient blend is craft-critical
- Rejecting the photo moon is a STORY (physics + honesty) — keep the decision note in the colophon-adjacent docs if a colophon emerges

</specifics>

<deferred>
## Deferred Ideas

- Glass build → Phase 8 (only its spike runs here); ambient systems → Phase 9; OG image refresh (OG-03) → Phase 10 candidate
- Annotated/zoomable sky exploration → /craft territory, someday

</deferred>

---
*Phase: 07-real-sky-foundation*
*Context gathered: 2026-07-18 (license verified in-browser same day)*
