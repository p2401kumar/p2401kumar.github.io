# Phase 8: Glass System - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

The full content chrome — panels, header/footer, jump index — becomes frosted glass over the real sky, with the contrast verifier re-architected to screenshot sampling BEFORE any glass value locks, clean degradation ladders, and the glass CPU budget proven on the real page. GLS-01..04.

NOT here: ambient animations (Phase 9), deploy (Phase 10), any photo/master changes (Phase 7 artifacts are locked — a glass problem is solved in glass values, not by re-baking the sky).

</domain>

<decisions>
## Implementation Decisions

### Measured foundation (Spike 2, 07-SPIKE-GLASS.md — the numbers that govern this phase)
- Marginal cost of 4 production-geometry blur(12px) surfaces over the animating scene: **+0.47pp CPU** (total 4.52% < 10% floor), 60fps, 0 long tasks — full glass PASS, no mitigation ladder required
- Blur sensitivity: 12→16px = +0.68pp main-thread — LOCKED budget rule: **blur(12px) default, 16px hard ceiling**, ≤4 simultaneous surfaces (exactly: panel, header, footer, jump index)

### GLS-03 verifier re-architecture (FIRST task of the phase — hard precondition)
- verify-contrast.mjs gains a screenshot-sampling mode: in-page glyph-run rect discovery stays (it already computes text rects), but pixel sampling moves to CDP `Page.captureScreenshot` → decode in Node via the ALREADY-INSTALLED sharp (`sharp(png).raw().toBuffer()` — no hand-rolled decoder, no new dependency) → worst-case per-pixel ratio over the text rects. This is the only honest way to measure through a real blur kernel
- Keep the analytic mode for fast pre-glass iteration; the screenshot mode is the GATE. Selftest: a known-ratio fixture (solid panel over solid bg) must agree between modes within tolerance pre-blur; DPR1 only (known DSF-2 CDP screenshot hang on this machine — use --force-device-scale-factor CLI capture only for visual evidence, never for the gate)
- Windows note: sharp is a devDependency via Astro — import it in the script from the project's node_modules

### Glass recipe (research baseline; UI-SPEC finalizes numbers, contrast gate arbitrates)
- Panels: translucent fill (white ~5-10% alpha family), `backdrop-filter: blur(12px) saturate(150%)` (brightness nudge optional per GLASS.md), 1px top light edge (white ~10%)
- Chrome (header/footer/jump index): lighter — blur(10px), fill ~5%
- TIERING SANCTIONED within the glass grammar (roadmap deliberation): text-dense panels (experience/patents/skills prose) may take a higher-opacity/lower-blur variant if the screenshot-sampled floor demands it; the hero/contact can run glassier. The 4.5:1 worst-case floor is the arbiter — not taste, not uniformity dogma. The existing scrim (deck::before 0.38 peak) may be reduced or retired IF glass fills replace its duty — measured, not assumed; classic mode keeps a working scrim/fallback regardless
- All values as `--glass-*` tokens in tokens.css ONLY (fill alphas, blur radii, edge alpha) — zero hex elsewhere, zero magic numbers in component CSS

### Degradation ladders (GLS-02)
- `@supports (backdrop-filter: blur(1px))` gates ALL glass; baseline = current opaque `--panel` look (the site as it works today — no visual regression for non-supporting browsers)
- `prefers-reduced-transparency: reduce` → solid surfaces (additive pattern: opaque default in that branch, glass only under no-preference)
- Print: solid, no filters
- No-JS classic mode: glass is pure CSS so it CAN apply — but verify the classic scrolling layout with glass panels stays legible against the static photo (the screenshot gate covers deck mode; classic gets a spot-check at both viewports)

### GLS-04 real-page budget re-proof
- After glass lands: 60s CDP idle soak on the REAL preview page (05-06/07-02 methodology) — expect ~baseline+0.5pp; total must stay <10% with 60fps and 0 long tasks; record alongside Spike-2's projection
- Lighthouse both presets ≥90 re-run (glass adds compositing but no JS — expect scores held; TBT must stay ~0)

### Floors (all carried)
- astro check 0; build green; zero hex outside tokens.css; single-rAF counts unchanged; zero deck/fig01 imports in scene modules; leak gate (no glass CSS bleeding into /work/* beyond the shared token file — case studies stay editorial; if SiteHeader/Footer are shared, their glass must degrade to the solid look on photo-free pages — decide explicitly and verify); sitemap; no push; no new dependencies; .planning/config.json untouched

### Claude's Discretion
- Exact fill alphas per tier, saturate/brightness values, edge-highlight construction, focus-visible treatment on glass, whether the scrim reduces or stays, hover/active glass states

</decisions>

<canonical_refs>
## Canonical References

- `.planning/phases/07-real-sky-foundation/07-SPIKE-GLASS.md` (the measured budget + sensitivity) + 07-03/07-04 SUMMARYs (integration reality, contrast numbers 4.58/12.22, chrome offsets)
- `.planning/research/GLASS.md` (recipe grammar, backdrop-root footguns, reduced-transparency pattern) + PITFALLS.md (Safari quirks, stacking traps)
- `scripts/verify-contrast.mjs` (the script being re-architected — read fully first)
- `src/styles/deck.css` + tokens.css + `src/components/` (PanelDeck, DeckIndex, SiteHeader, SiteFooter — the surfaces going glass)
- `.planning/ROADMAP.md` Phase 8 (5 success criteria) + REQUIREMENTS.md GLS-01..04

</canonical_refs>

<specifics>
## Specific Ideas

- The glass should read as *optical* — light bending through cold night air — not as gray overlays: the 1px top edge and the saturate() are what sell it
- Fig. 01's panel is a special case: the figure itself must stay on its solid `--panel` surface (an instrument, not a window) — glass frames it, never filters it
- The jump index pill going glass is the smallest, most jewel-like surface — get it right first as the reference implementation

</specifics>

<deferred>
## Deferred Ideas

- Ambient systems (Phase 9); glass hover-parallax micro-effects → /craft; light-refraction easter eggs → never (restraint)

</deferred>

---
*Phase: 08-glass-system*
*Context gathered: 2026-07-19*
