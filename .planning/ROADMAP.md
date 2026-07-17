# Roadmap: Prateek Kumar — Portfolio

## Milestones

- ✅ **v1.0 Launch** — Phases 1-3 (shipped 2026-07-17) — [archive](milestones/v1.0-ROADMAP.md)
- 🌌 **v2.0 Night Sky (current)** — Phases 4-6 — no-scroll panel deck + persistent zero-light-pollution night scene layered over the shipped v1 content

## Phases

<details>
<summary>✅ v1.0 Launch (Phases 1-3) — SHIPPED 2026-07-17</summary>

- [x] Phase 1: Foundation & Editorial Shell (7/7 plans) — completed 2026-07-17
- [x] Phase 2: Fig. 01 — Signature Interactive Figure (5/5 plans) — completed 2026-07-17
- [x] Phase 3: Case Studies & Launch Polish (4/4 plans) — completed 2026-07-17

Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### v2.0 Night Sky (current)

- [x] **Phase 4: Deck Mechanics** - No-scroll panel deck: full input parity (wheel/swipe/keys/dots), hash routing, focus management, progressive-enhancement fallback (completed 2026-07-17)
- [ ] **Phase 5: Night-Sky Scene** - Persistent zero-light-pollution scene: pre-rendered starfield + Milky Way, camper silhouette, fireflies, panel-reactive career constellations
- [ ] **Phase 6: Integration & Launch** - v1 content layered as panels, Fig. 01 re-verified embedded, case-study URLs intact, live Lighthouse ≥90

## Phase Details

### Phase 4: Deck Mechanics

**Goal**: Visitors navigate the full CV as a no-scroll deck — every input path works one-gesture-one-panel, panels are deep-linkable and back-button-safe, and the page degrades cleanly to the v1 scrolling layout when JS is unavailable.
**Depends on**: v1.0 shipped shell (Phase 3) — must build the interaction model before any scene is layered on (research sequencing: mechanics before aesthetics)
**Requirements**: DECK-01, DECK-02, DECK-03, DECK-04, DECK-05, DECK-06, DECK-07, DECK-08
**Success Criteria** (what must be TRUE):

  1. Visitor can advance/retreat exactly one panel at a time via mouse wheel, vertical touch swipe, keyboard, and the mono progress index (with direct jump-to-panel) — no trackpad double-fire, no dead mouse feel
  2. Every panel has a URL hash: browser back/forward move between panels and a deep link cold-loads to the correct panel
  3. Keyboard navigation is fully operable with a keymap that does not collide with Fig. 01's inner controls; hidden panels are `inert` and panel changes announce via `aria-live`
  4. A first-visit affordance hints how to navigate then recedes; a quiet "view classic" link exposes the scrolling view at any time
  5. With JS disabled the page renders the v1 scrolling layout (`.deck-active` added only after successful init); under `prefers-reduced-motion` panel transitions are instant

**Research gate**: Lighthouse ≥90 with the deck active but no scene yet; real-device input testing on iPhone + mid-tier Android; case-study routing architecture decided here (not deferred to Integration); Fig. 01 keymap resolved against actual `src/lib/fig01/` source.
**Plans**: 3/3 plans complete
**Wave 1**

- [x] 04-01-PLAN.md — Panel manifest + deck shell components + index restructure + deck.css (no-JS-safe static foundation)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md — deck.ts engine: wheel/touch/keyboard/jump input, hash routing, inert/aria-live, hint + view-classic, change-event; boot from PanelDeck

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-03-PLAN.md — Automated gate (build/hex/fallback/leak/Lighthouse local) + human-verify checkpoint (feel, cold-load, back/forward, reduced-motion)

**UI hint**: yes

### Phase 5: Night-Sky Scene

**Goal**: A persistent zero-light-pollution night scene lives behind every panel — pre-rendered starfield + Milky Way, a silhouetted camper with a single warm glow, drifting fireflies, and named career constellations that brighten with the active panel — all held inside the battery, contrast, and reduced-motion floors.
**Depends on**: Phase 4 (constellation brightening subscribes to the `nightsky:panel-change` event contract the deck dispatches)
**Requirements**: SKY-01, SKY-02, SKY-03, SKY-04, SKY-05, CONST-01, CONST-02, CONST-03
**Success Criteria** (what must be TRUE):

  1. A persistent scene renders behind every panel: dense pre-rendered starfield + vivid Milky Way band (offscreen-rendered once, blitted), with a silhouetted camper-car camp and a single warm copper glow at the horizon
  2. Stars form named career-chapter constellations (AWS · Microsoft · Samsung · education/patents) with source-annotated labels; the active panel's constellation brightens while others dim, driven by `nightsky:panel-change`
  3. Neural links between constellation stars occasionally fire a quiet signal, reusing the Fig. 01 beam pattern (sparse, decorative-classified motion)
  4. Only drifting fireflies + a twinkling star subset run per frame — idle CPU stays under 10% sustained over 5 minutes; the scene pauses when the tab is hidden and while Fig. 01's panel is active; `prefers-reduced-motion` renders one static frame with no animation loop
  5. All text over the sky passes WCAG 1.4.3 contrast at worst-case brightness points via a scrim that preserves the dark aesthetic

**Research gate**: Milky Way visual spike FIRST (~2-3h, LOW-confidence technique — evaluate zero-dep scatter+gradient before adding any noise dependency); idle-CPU <10% sustained over 5 min; contrast ≥4.5:1 measured at worst-case brightness points (not averages); Lighthouse ≥90 immediately after scene layered in.
**Plans**: 2/6 plans executed

**Wave 1** *(parallel — zero file overlap)*

- [x] 05-01-PLAN.md — Milky Way visual spike (standalone HTML + SPIKE.md verdict; conditional simplex-noise fallback behind a blocking-human legitimacy checkpoint)
- [x] 05-02-PLAN.md — Foundation: shared/css-tokens.ts extraction (fig01 non-regression) + src/data/constellations.ts typed data module (honesty gate)

**Wave 2** *(blocked on 05-01 + 05-02)*

- [ ] 05-03-PLAN.md — Scene shell + Layer 0: sky tokens, nightsky/tokens.ts, NightSky.astro (canvas host + camper SVG + glow, behind .deck), starfield.ts offscreen generation

**Wave 3** *(blocked on 05-03)*

- [ ] 05-04-PLAN.md — Scene engine: single-rAF scene.ts, pause state machine {hidden, fig01-active, reduced-motion}, Layer 2 twinkle + fireflies

**Wave 4** *(blocked on 05-04 + 05-02)*

- [ ] 05-05-PLAN.md — Constellations: render + panel-reactive brighten/dim (nightsky:panel-change) + quiet link-firing (Fig. 01 beam math mirrored)

**Wave 5** *(blocked on 05-05)*

- [ ] 05-06-PLAN.md — Scrim + worst-case contrast verifier (SKY-05) + full gate battery + human scene sign-off

**UI hint**: yes

### Phase 6: Integration & Launch

**Goal**: All v1 content is layered into the deck as panels over the scene without forking markup, Fig. 01 works fully as a panel with its complete v1 verification checklist re-passed while embedded, case studies keep cold-loadable URLs, and the live home page holds Lighthouse ≥90 on both mobile and desktop.
**Depends on**: Phase 5 (the scene must exist to layer content over and to run the final combined deck + scene Lighthouse gate)
**Requirements**: INTG-01, INTG-02, INTG-03, INTG-04
**Success Criteria** (what must be TRUE):

  1. All v1 content sections render as panels without forking their markup (thin `Panel.astro` slot wrapper; hidden via `transform`, never `display:none`), each reading legibly through the scene scrim
  2. Fig. 01 works fully as a panel — resize-on-activation handled (no 0×0 init) and the complete v1 Fig. 01 verification checklist re-passes while embedded
  3. Case studies keep distinct, cold-loadable URLs linked from the systems panel; the sitemap remains valid
  4. The home page holds Lighthouse ≥90 in all four categories with deck + scene active, on both mobile and desktop runs against the live URL, and the change is deployed

**Research gate**: Full v1 Fig. 01 re-verification (Pitfall 11 — hidden-until-active canvas 0×0 init); case-study cold-load verified; sitemap/SEO intact; live Lighthouse ≥90 mobile + desktop; deploy via the existing GitHub Actions → Pages pipeline.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
| ----- | --------- | -------------- | ------ | --------- |
| 1. Foundation & Editorial Shell | v1.0 | 7/7 | Complete | 2026-07-17 |
| 2. Fig. 01 — Signature Interactive Figure | v1.0 | 5/5 | Complete | 2026-07-17 |
| 3. Case Studies & Launch Polish | v1.0 | 4/4 | Complete | 2026-07-17 |
| 4. Deck Mechanics | v2.0 | 3/3 | Complete   | 2026-07-17 |
| 5. Night-Sky Scene | v2.0 | 2/6 | In Progress|  |
| 6. Integration & Launch | v2.0 | 0/TBD | Not started | - |

---
*Phase numbering continues from 4 in the next milestone (never restarts).*
