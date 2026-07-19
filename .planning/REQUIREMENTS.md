# Requirements: Prateek Kumar — Portfolio · Milestone v3.0 "Real Sky"

**Defined:** 2026-07-18
**Core Value:** Within seconds of landing, a senior engineering leader should think "this person operates at our level" — credibility delivered through demonstrated craft, not adjectives. v3.0 adds: the sky becomes *real* — composited astrophotography, glass, and living atmosphere, with every floor intact.

## v3.0 Requirements

Each maps to roadmap phases (numbering continues from Phase 7). Prior-milestone requirements are archived: [v1](milestones/v1.0-REQUIREMENTS.md) · [v2](milestones/v2.0-REQUIREMENTS.md).

### Real Sky (imagery)

- [x] **IMG-01**: A composited real-astrophotography Milky Way sky (NOIRLab `noirlab2430b` primary / ESO `eso0932a` fallback, combined + rotated/cropped at build time into a checked-in master) renders full-viewport behind everything on the home page
- [x] **IMG-02**: The photo ships as a static `<img>`/CSS background — never canvas-drawn — so it is LCP-discoverable (preload + `fetchpriority=high` + LQIP ladder, no CLS) and present in the no-JS classic mode
- [x] **IMG-03**: Encode pipeline (AVIF 10-bit 4:4:4 + WebP fallback) produces no visible banding on an 8-bit display, proven by the banding spike (histogram comb-spike test + eyeball) before integration
- [x] **IMG-04**: A photo credit line renders in the footer/colophon — exact attribution text with source link, CC BY 4.0 compliant; license page manually verified in a browser before ship
- [x] **IMG-05**: The authored overlay survives on the real sky: career constellations with panel-reactive brightening, meteors, and the drawn crescent moon (photo moon rejected on physics — recorded decision)

### Glass System

- [x] **GLS-01**: Full glass chrome — content panels, header/footer, and jump index render as frosted-glass surfaces (translucent fill + backdrop blur + saturation + 1px light edge, token-expressed as `--glass-*`), tiering permitted within the grammar for text-dense panels if the contrast floor demands it
- [x] **GLS-02**: Glass degrades cleanly: `@supports` ladder to the opaque `--panel` baseline, `prefers-reduced-transparency` renders solid surfaces (additive enhancement pattern), print styles sane
- [x] **GLS-03**: The contrast verifier is re-architected to sample real post-composite screenshots (analytic compositing cannot model blur) BEFORE glass values lock; every panel × both viewports holds ≥4.5:1 worst-case over the photo
- [x] **GLS-04**: Glass + scene idle CPU stays under the 10% total floor — the glass-over-animating-canvas spike measures the marginal re-blur cost first and the mitigation ladder (throttle-under-glass, density, blur cap) is applied as measured

### Living Sky (ambient animations)

- [x] **AMB-01**: Two drifting cloud/haze layers (pre-rendered sprites, wraparound blit) move slowly across the lower sky inside the existing scene tick
- [x] **AMB-02**: Sky, horizon, and foreground shift at different rates on every panel change (CSS `translate3d` transitions, 300–500ms, compositor-only); instant under reduced-motion
- [x] **AMB-03**: A faint breathing aurora (noise-driven curtains, updates throttled to every 3–5 frames) glows with peak luminance capped below the Milky Way band — the one sanctioned light source
- [x] **AMB-04**: The twinkle subset upgrades to atmospheric scintillation (2-oscillator waveform + occasional chromatic nudge on the brightest few) without widening the star count
- [x] **AMB-05**: Bounded-ambient doctrine: all systems run inside the single rAF + existing pause machine (hidden/fig01-active/reduced-motion), a documented mobile degradation ladder sheds load in order (far clouds → aurora throttle → color nudge; parallax never sheds), reduced-motion renders one static frame

### Floors & Launch

- [ ] **FLR-01**: Live Lighthouse ≥90 all four categories, both presets, after full integration — with a dedicated LCP checkpoint immediately after photo integration (before glass/animations compound)
- [ ] **FLR-02**: The full carry-forward regression list re-passes: Fig. 01 embedded 36-check audit, deck mechanics, no-JS classic WITH the photo, view-classic, case-study scene-free leak gate, sitemap, `/#work` alias, cold-`/#fig-01` pause, honesty gate, single-rAF counts, zero-hex (new tokens in tokens.css only)
- [ ] **FLR-03**: Reduced-motion full-stop, keyboard operability, and the honesty gate remain intact through every phase
- [ ] **LNC-01**: Deploy via the existing pipeline, gated on explicit user go (v2 precedent); rollback path documented

## Future Requirements

Deferred. Tracked but not in this milestone.

- **NOTE-01**: Notes/writing section — once a content pipeline exists
- **NOTE-02**: `/craft` experiments page
- **CASE-04**: Third case study (azure/health-snapshots)
- **PLAT-08**: JSON-LD Person structured data
- **OG-02**: Panel-aware OG share cards — pending real usage signal
- **OG-03**: Refresh the static OG image to the v3 real-sky look — candidate for this milestone's launch phase if trivial

## Out of Scope

| Feature | Reason |
|---------|--------|
| Photo moon | Physics: a real moon bright enough to see washes out a real Milky Way in the same exposure — drawn crescent stays (research-validated) |
| Canvas-drawn photo sky | Breaks LCP discoverability AND the no-JS classic floor — photo is `<img>`/CSS, period |
| WebGL / shader aurora | Element counts far below where it pays; Canvas2D noise curtains suffice within budget |
| Continuous scroll-linked parallax | Deck is discrete panels; scroll-linked effects contradict the no-scroll model and cost frames |
| Third-party image CDN | GitHub Pages static constraint; checked-in optimized masters |
| Removing the procedural starfield engine | The drawn overlay (constellations/moon/meteors/scintillation) IS the procedural engine repurposed — it stays |

## Traceability

Each requirement maps to the phase that **completes** it. FLR-01's LCP checkpoint additionally runs early — lifted into Phase 7's research gate immediately after photo integration — but the requirement is finally *verified live* (Lighthouse ≥90 ×4, both presets, after full integration) in Phase 10, so it is mapped there.

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMG-01 | Phase 7 | Complete |
| IMG-02 | Phase 7 | Complete |
| IMG-03 | Phase 7 | Complete |
| IMG-04 | Phase 7 | Complete |
| IMG-05 | Phase 7 | Complete |
| GLS-01 | Phase 8 | Complete |
| GLS-02 | Phase 8 | Complete |
| GLS-03 | Phase 8 | Complete |
| GLS-04 | Phase 8 | Complete |
| AMB-01 | Phase 9 | Complete |
| AMB-02 | Phase 9 | Complete |
| AMB-03 | Phase 9 | Complete |
| AMB-04 | Phase 9 | Complete |
| AMB-05 | Phase 9 | Complete |
| FLR-01 | Phase 10 | Pending (LCP checkpoint also gated in Phase 7) |
| FLR-02 | Phase 10 | Pending |
| FLR-03 | Phase 10 | Pending |
| LNC-01 | Phase 10 | Pending |

**Coverage:**

- v3.0 requirements: 18 total
- Mapped to phases: 18 (IMG→7, GLS→8, AMB→9, FLR/LNC→10)
- Unmapped: 0

---
*Requirements defined: 2026-07-18 from user-locked direction + 4-lane research synthesis · Mapped to phases 7-10: 2026-07-18*
