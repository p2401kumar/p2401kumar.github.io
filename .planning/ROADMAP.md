# Roadmap: Prateek Kumar — Portfolio

## Milestones

- ✅ **v1.0 Launch** — Phases 1-3 (shipped 2026-07-17) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v2.0 Night Sky** — Phases 4-6 (shipped 2026-07-18) — [archive](milestones/v2.0-ROADMAP.md)
- 🌌 **v3.0 Real Sky (current)** — Phases 7-10 — composited astrophotography sky + full glass chrome + ambient realism over the shipped v2 deck

## Phases

<details>
<summary>✅ v1.0 Launch (Phases 1-3) — SHIPPED 2026-07-17</summary>

- [x] Phase 1: Foundation & Editorial Shell (7/7 plans) — completed 2026-07-17
- [x] Phase 2: Fig. 01 — Signature Interactive Figure (5/5 plans) — completed 2026-07-17
- [x] Phase 3: Case Studies & Launch Polish (4/4 plans) — completed 2026-07-17

Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v2.0 Night Sky (Phases 4-6) — SHIPPED 2026-07-18</summary>

- [x] Phase 4: Deck Mechanics (3/3 plans) — completed 2026-07-17
- [x] Phase 5: Night-Sky Scene (6/6 plans) — completed 2026-07-18
- [x] Phase 5.1: Celestial Extras (INSERTED — meteors + crescent moon) (1/1 plans) — completed 2026-07-18
- [x] Phase 6: Integration & Launch (2/2 plans) — completed 2026-07-18, LIVE

Full details: [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) · Phase artifacts: `milestones/v2.0-phases/`

</details>

### 🌌 v3.0 Real Sky (Phases 7-10) — CURRENT

- [ ] **Phase 7: Real-Sky Foundation** - Both empirical spikes first, then a real composited Milky Way photo lands LCP-clean behind everything with the authored overlay intact
- [ ] **Phase 8: Glass System** - Frosted-glass panels + chrome over the photo, contrast verifier re-architected to screenshot-sample before glass values lock
- [ ] **Phase 9: Living Sky** - Clouds, panel-change parallax, breathing aurora, and scintillation inside one bounded-ambient rAF budget
- [ ] **Phase 10: Integration & Launch** - Full carry-forward regression battery re-passes, live Lighthouse ≥90 ×4, user-gated deploy

## Phase Details

### Phase 7: Real-Sky Foundation

**Goal**: The home page renders a real composited astrophotography Milky Way sky as an LCP-discoverable static image behind everything — banding-free, credited, and with the authored overlay surviving on top — without compounding any performance floor.
**Depends on**: v2.0 (Phase 6, shipped and live) — the real sky replaces the procedural sky base behind the existing panel deck.
**Requirements**: IMG-01, IMG-02, IMG-03, IMG-04, IMG-05
**Success Criteria** (what must be TRUE):

  1. A full-viewport real Milky Way photo (NOIRLab `noirlab2430b` primary / ESO `eso0932a` fallback, composited + rotated/cropped at build time into a checked-in master) renders behind everything on the home page.
  2. The photo is a static `<img>`/CSS background (never canvas-drawn) — LCP-discoverable via preload + `fetchpriority=high` + LQIP ladder, zero CLS, and present in no-JS classic mode.
  3. No visible banding on a real 8-bit display (AVIF 10-bit 4:4:4 + WebP fallback), proven by the histogram comb-spike test + eyeball before integration.
  4. The authored overlay survives on the real sky: career constellations with panel-reactive brightening, meteors, and the drawn crescent moon all render over the photo (photo moon rejected on physics — recorded decision).
  5. A CC BY 4.0 photo-credit line renders in the footer/colophon — exact attribution (`Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0`, linked), license page manually browser-verified before it locks.
  6. The dedicated post-photo LCP checkpoint passes (mobile LCP within budget) before any glass or animation work is allowed to compound.

**Research gate**: Run BOTH spikes FIRST, before any pipeline/integration work inside the phase (v2's spike-first pattern):

  - **Spike 1 — Banding**: AVIF 10-bit 4:4:4 encode (+ film-grain/noise strategy + 2×-resolution-lower-quality trick) shows no visible banding on a real 8-bit display; verified by histogram comb-spike test + eyeball. Banding baked into the foundation is the costliest late discovery.
  - **Spike 2 — Glass-over-animating-canvas CPU**: measure idle CPU (scene alone vs scene + 4 glass surfaces); marginal re-blur cost must fit inside the <10% idle floor (target ≤2–3% marginal). This is the milestone's **re-scope trigger** — if it can't tune under the floor, "full glass over a permanently-animating scene" needs a structural rethink (glass over static-only regions), decided before glass is built in Phase 8.
  - **LCP checkpoint (lifted forward from FLR-01)**: immediately after photo integration, a dedicated LCP/Lighthouse read confirms LCP is within the realistic mobile budget (research: 1.5–2.8s with full-viewport AVIF) before glass/animations compound. FLR-01 is finally *verified* live in Phase 10; this early checkpoint de-risks it.

**Plans**: 3/4 plans executed

  - [x] 07-01-PLAN.md — Spike 1: banding pipeline (build-sky.mjs + verify-banding.mjs, committed masters, SPIKE-BANDING.md)
  - [x] 07-02-PLAN.md — Spike 2: glass-over-animating-canvas CPU (milestone re-scope trigger, SPIKE-GLASS.md; FAIL stops the chain)
  - [x] 07-03-PLAN.md — Real-sky integration: photo delivery + overlay surgery + photo-aware contrast
  - [ ] 07-04-PLAN.md — Credit line + full gate battery + blocking LCP checkpoint + IMG-01..05 close-out

**UI hint**: yes

### Phase 8: Glass System

**Goal**: The full content chrome — panels, header/footer, and jump index — becomes frosted glass floating over the real sky, with the contrast verifier re-architected to sample real post-composite screenshots so every panel provably holds the legibility floor, and clean degradation for every capability tier.
**Depends on**: Phase 7 — the photo backdrop must exist to sample contrast against, and Spike 2's measured marginal re-blur budget constrains how much glass (blur radius, surface count) can spend.
**Requirements**: GLS-01, GLS-02, GLS-03, GLS-04
**Success Criteria** (what must be TRUE):

  1. Content panels, header/footer, and jump index render as frosted-glass surfaces (translucent fill + backdrop blur + saturation + 1px light edge, token-expressed as `--glass-*`); text-dense panels may tier to a higher-opacity/lower-blur variant of the same grammar if the contrast floor demands it.
  2. The contrast verifier samples real post-composite screenshots (not analytic compositing) and every panel × both viewports holds ≥4.5:1 worst-case over the photo — verified BEFORE glass values lock.
  3. Glass degrades cleanly: `@supports` ladder to the opaque `--panel` baseline, `prefers-reduced-transparency` renders solid surfaces (additive-enhancement pattern), print styles sane.
  4. Glass + scene idle CPU stays under the 10% total floor, with the measured mitigation ladder (throttle-under-glass → density → blur cap) applied exactly as the Spike-2 numbers dictate.
  5. New `--glass-*` tokens live only in `tokens.css` — the zero-hex-literal gate holds.

**Research gate**:

  - **Verifier re-architecture precondition**: `verify-contrast.mjs` must be re-architected to sample real post-composite screenshots (CDP scaffolding already present in the script) BEFORE any glass value locks — analytic compositing cannot model a blur kernel. This is a hard precondition for criterion 2.
  - **Glass budget re-proof**: measure the marginal re-blur cost against Spike 2's numbers and apply the mitigation ladder as measured; if the cost can't be tuned under the floor, this is where the milestone re-scope trigger fires.

**Plans**: TBD
**UI hint**: yes

### Phase 9: Living Sky

**Goal**: The static sky comes alive — drifting clouds, panel-change parallax, a breathing aurora, and atmospheric scintillation — all inside a single bounded-ambient rAF budget that re-proves the <10% idle floor and sheds load gracefully on mobile, with reduced motion rendering exactly one static frame.
**Depends on**: Phase 8 — the screenshot-sampled contrast floor and the glass CPU budget together fix how much of the <10% idle floor remains; ambient animation must fit in what glass leaves, so glass values must be locked before ambient spends against them.
**Requirements**: AMB-01, AMB-02, AMB-03, AMB-04, AMB-05
**Success Criteria** (what must be TRUE):

  1. Two drifting cloud/haze layers (pre-rendered sprites, wraparound blit) move slowly across the lower sky inside the existing scene tick.
  2. Sky, horizon, and foreground shift at different rates on every panel change (CSS `translate3d`, 300–500ms, compositor-only); instant under reduced-motion.
  3. A faint breathing aurora (noise-driven curtains, updates throttled to every 3–5 frames) glows with peak luminance capped below the Milky Way band — the one sanctioned added light source.
  4. The twinkle subset upgrades to atmospheric scintillation (2-oscillator waveform + occasional chromatic nudge on the brightest few) without widening the star count.
  5. All systems run inside the single rAF + existing pause machine (hidden / fig01-active / reduced-motion); the documented mobile degradation ladder sheds load in order (far clouds → aurora throttle → color nudge; parallax never sheds); reduced-motion renders one static frame.
  6. Idle CPU re-proves under the <10% total floor with all four ambient systems live alongside glass, fireflies, beams, and meteors.

**Research gate**:

  - **Budget re-proof**: per-system frame-cost profiling; the full ambient set + glass must re-prove idle <10% CPU. Validate the mobile ladder in order (drop far cloud layer → throttle aurora → drop color nudge; NEVER drop parallax).
  - **Reduced-motion**: always full-stop — one static frame, no exceptions.

**Plans**: TBD
**UI hint**: yes

### Phase 10: Integration & Launch

**Goal**: Every carry-forward floor re-passes on the fully composited experience, the live site scores Lighthouse ≥90 ×4 on both presets, and v3.0 deploys through the existing pipeline only on explicit user go with a documented rollback path.
**Depends on**: Phase 9 — every visual system (photo, glass, ambient) must be in place before the full regression battery and a live-scored launch mean anything.
**Requirements**: FLR-01, FLR-02, FLR-03, LNC-01
**Success Criteria** (what must be TRUE):

  1. Live Lighthouse ≥90 across all four categories on both presets after full integration (FLR-01 — the checkpoint de-risked in Phase 7 is finally *verified live* here).
  2. The full carry-forward regression list re-passes: Fig. 01 embedded 36-check audit · deck mechanics (wheel/swipe/keys/jump/hash/back-forward) · no-JS classic mode WITH the photo present · view-classic escape hatch · case-study scene-free leak gate · sitemap 3 routes · `/#work` alias · cold-`/#fig-01` scene pause · honesty gate label sourcing · single-rAF counts · zero-hex (new `--glass-*`/photo tokens in `tokens.css`) · contrast ≥4.5:1 worst-case (screenshot-sampled mode) · idle <10% CPU.
  3. Reduced-motion full-stop, keyboard operability, and the honesty gate remain intact across the whole composited stack.
  4. v3.0 deploys via the existing GitHub Actions pipeline **only after explicit user go** (v2 precedent, recorded in PROJECT.md Key Decisions); the rollback path is documented before deploy.

**Research gate**:

  - **Carry-forward regression battery** (verbatim from research SUMMARY): the full checklist in criterion 2 above is the launch gate — every item re-passes on the composited build.
  - **Real-device checklist + gated deploy**: the user-run real-device touch + 5-min idle-CPU check precedes deploy; deploy is gated on explicit user approval (v2 precedent — replacing the live professional site is outward-facing).

**Plans**: TBD
**UI hint**: yes

## Sequencing Rationale

- **Phase 7 depends on v2.0**: the real sky graduates the shipped procedural sky base without touching the deck's proven interaction model.
- **Spikes run FIRST inside Phase 7** (v2's spike-first pattern): banding baked into the foundation is the costliest late discovery, and the glass-over-animating-canvas CPU spike is the *milestone re-scope trigger* — the "full glass over a permanently-animating scene" premise must be proven viable before any pipeline or glass work is built on top of it. Empirical answers before integration.
- **Glass (Phase 8) before Ambient (Phase 9)**: the re-architected contrast verifier and the measured glass CPU cost together constrain what ambient can spend — glass sets the screenshot-sampled ≥4.5:1 legibility floor and consumes the first slice of the <10% idle budget via re-blur, so ambient must fit in what remains. Building ambient first would force a re-tune once glass eats the budget.
- **Launch (Phase 10) last, user-gated**: the full carry-forward regression battery and live Lighthouse only mean something once photo + glass + ambient are all composited; and per v2 precedent (PROJECT.md Key Decisions) the deploy that replaces the live professional site is gated on explicit user go, with a documented rollback path.

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
| ----- | --------- | -------------- | ------ | --------- |
| 1. Foundation & Editorial Shell | v1.0 | 7/7 | Complete | 2026-07-17 |
| 2. Fig. 01 — Signature Interactive Figure | v1.0 | 5/5 | Complete | 2026-07-17 |
| 3. Case Studies & Launch Polish | v1.0 | 4/4 | Complete | 2026-07-17 |
| 4. Deck Mechanics | v2.0 | 3/3 | Complete | 2026-07-17 |
| 5. Night-Sky Scene | v2.0 | 6/6 | Complete | 2026-07-18 |
| 5.1 Celestial Extras (INSERTED) | v2.0 | 1/1 | Complete | 2026-07-18 |
| 6. Integration & Launch | v2.0 | 2/2 | Complete | 2026-07-18 |
| 7. Real-Sky Foundation | v3.0 | 3/4 | In Progress|  |
| 8. Glass System | v3.0 | 0/TBD | Not started | - |
| 9. Living Sky | v3.0 | 0/TBD | Not started | - |
| 10. Integration & Launch | v3.0 | 0/TBD | Not started | - |

---
*Phase numbering continues from the last shipped phase in the next milestone (never restarts).*
