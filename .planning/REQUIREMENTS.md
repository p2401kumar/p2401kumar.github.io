# Requirements: Prateek Kumar — Portfolio · Milestone v2.0 "Night Sky"

**Defined:** 2026-07-17
**Core Value:** Within seconds of landing, a senior engineering leader should think "this person operates at our level" — credibility delivered through demonstrated craft, not adjectives. v2.0 adds: the first seconds should also be *beautiful* — a zero-light-pollution night that no other engineer's portfolio has.

## v2.0 Requirements

Requirements for this milestone. Each maps to roadmap phases (numbering continues from Phase 4).

### Deck Mechanics

- [x] **DECK-01**: Visitor advances/retreats panels via mouse wheel — one gesture = one panel (delta accumulation + transition lock; no trackpad double-fire, no dead mouse feel)
- [x] **DECK-02**: Visitor advances/retreats via vertical touch swipe on mobile
- [x] **DECK-03**: Visitor navigates fully by keyboard with a keymap that does not collide with Fig. 01's inner controls; hidden panels are `inert`; panel changes are announced via `aria-live`
- [x] **DECK-04**: Visitor sees a progress indicator (mono index) and can jump directly to any panel from it
- [x] **DECK-05**: Every panel has a URL hash — browser back/forward work, deep links cold-load to the correct panel
- [x] **DECK-06**: First-visit affordance hints how to navigate, then gets out of the way
- [x] **DECK-07**: With JS unavailable the page renders as the v1 scrolling layout (progressive enhancement — `.deck-active` added only after successful init); a quiet "view classic" link offers the scrolling view anytime
- [x] **DECK-08**: Panel transitions are instant under `prefers-reduced-motion`

### Night Scene

- [x] **SKY-01**: Persistent zero-light-pollution scene — dense pre-rendered starfield + vivid Milky Way band (offscreen-rendered once, blitted) behind every panel
- [x] **SKY-02**: Camper-car camp silhouette at the horizon with a single warm copper glow (hand-authored static SVG, outside the animation loop)
- [ ] **SKY-03**: Sparse drifting fireflies + twinkling star subset are the only per-frame canvas work; idle CPU < 10% sustained over 5 minutes
- [ ] **SKY-04**: Scene pauses when the tab is hidden and while Fig. 01's panel is active (one-active-animation rule); `prefers-reduced-motion` renders one static frame with no animation loop
- [ ] **SKY-05**: All text over the sky passes WCAG 1.4.3 contrast at worst-case brightness points via a scrim that preserves the dark aesthetic
- [ ] **SKY-06**: Occasional shooting stars streak the upper sky — one at a time, ~20–45s cadence, fading trail — absent under reduced-motion and while the scene is paused *(Phase 5.1, INSERTED)*
- [ ] **SKY-07**: A thin crescent moon (static Layer 0, tokens-only, procedural — no image assets) sits low and dim, clear of the Milky Way band, preserving the zero-light-pollution premise *(Phase 5.1, INSERTED)*

### Constellations

- [x] **CONST-01**: Stars form named career-chapter constellations (AWS · Microsoft · Samsung · education/patents) defined in a typed data module with source-annotated labels (honesty gate)
- [ ] **CONST-02**: The active panel's constellation brightens while others dim, driven by the `nightsky:panel-change` event contract
- [ ] **CONST-03**: Neural links between constellation stars occasionally fire a quiet signal (reusing the Fig. 01 beam pattern; sparse, decorative-classified motion)

### Integration & Floors

- [ ] **INTG-01**: All v1 content sections render as panels without forking their markup (thin `Panel.astro` slot wrapper; hide via transform, never `display:none`)
- [ ] **INTG-02**: Fig. 01 works fully as a panel — resize-on-activation handled, complete v1 verification checklist re-passes while embedded
- [ ] **INTG-03**: Case studies keep distinct, cold-loadable URLs linked from the systems panel; sitemap remains valid
- [ ] **INTG-04**: Home page holds Lighthouse ≥ 90 in all four categories with deck + scene active (mobile and desktop runs, live URL)

## Future Requirements

Deferred. Tracked but not in this milestone.

- **NOTE-01**: Notes/writing section — once a content pipeline exists
- **NOTE-02**: `/craft` experiments page
- **CASE-04**: Third case study (azure/health-snapshots)
- **PLAT-08**: JSON-LD Person structured data
- **OG-02**: Panel-aware OG share cards — pending real usage signal

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto-advancing panels | Research-corroborated anti-feature: rushes readers, motion-sickness and WCAG 2.2.2 risk |
| three.js / GSAP / fullPage.js / swiper | Bundle cost + paradigm mismatch; everything achievable with the proven Canvas2D + vanilla TS pattern |
| Horizontal swipe axis on mobile | iOS edge-swipe collision (Pitfall 10); vertical axis chosen |
| Preloaders/splash screens | Anti-feature; scene must init within the TBT budget instead |
| WebGL rendering | Element counts far below where it pays; adds context-loss risk with no precedent in this codebase |
| Dimming-only reduced-motion | WCAG C39 requires decorative motion to STOP — static frame, not dimmer |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DECK-01 | Phase 4 | Complete |
| DECK-02 | Phase 4 | Complete |
| DECK-03 | Phase 4 | Complete |
| DECK-04 | Phase 4 | Complete |
| DECK-05 | Phase 4 | Complete |
| DECK-06 | Phase 4 | Complete |
| DECK-07 | Phase 4 | Complete |
| DECK-08 | Phase 4 | Complete |
| SKY-01 | Phase 5 | Complete |
| SKY-02 | Phase 5 | Complete |
| SKY-03 | Phase 5 | Pending |
| SKY-04 | Phase 5 | Pending |
| SKY-05 | Phase 5 | Pending |
| CONST-01 | Phase 5 | Complete |
| CONST-02 | Phase 5 | Pending |
| CONST-03 | Phase 5 | Pending |
| SKY-06 | Phase 5.1 | Pending |
| SKY-07 | Phase 5.1 | Pending |
| INTG-01 | Phase 6 | Pending |
| INTG-02 | Phase 6 | Pending |
| INTG-03 | Phase 6 | Pending |
| INTG-04 | Phase 6 | Pending |

**Coverage:**

- v2.0 requirements: 22 total (20 original + 2 inserted via Phase 5.1)
- Mapped to phases: 22 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-17*
*Last updated: 2026-07-17 after roadmap creation (Phases 4-6 mapped)*
