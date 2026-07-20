# Requirements: Prateek Kumar — Portfolio · Milestone v3.1 "Bolder Sky"

**Defined:** 2026-07-20
**Core Value:** Within seconds of landing, a senior engineering leader should think "this person operates at our level." v3.1 fixes a self-inflicted miss: the shipped v3.0 background looked muddy and cheap. This milestone makes it *bold and alive* — a warm, core-led real sky under genuinely premium glass — without breaking a floor, and with the perceptual gate (`verify-visibility.mjs`) now guarding the look.

## v3.1 Requirements

Focused aesthetic rework of the shipped v3.0 background (engine unchanged). Direction locked via a 3-way mockup pick: **Galactic Core + liquid-glass card**. Prior milestones archived: [v1](milestones/v1.0-REQUIREMENTS.md) · [v2](milestones/v2.0-REQUIREMENTS.md) · [v3.0](milestones/v3.0-REQUIREMENTS.md).

- [x] **BOLD-01**: Sky master regraded warm + bright via `build-sky.mjs` — the real amber galactic core keeps its color, midtones lifted out of the murk, cool-warm contrast restored; no visible banding (the lifted-midtone grade re-passes the banding gate)
- [x] **BOLD-02**: Recomposed so the galactic core leads and the frame is filled (no dead center, no lopsided band-at-the-edge); the object-position ladder keeps real sky/core presence at 375 / 1280 / 1440 (mobile no longer reads as an empty gradient)
- [ ] **BOLD-03**: The camper silhouette (the "smudge") is cut; the copper brand warmth survives as a clean soft ambient glow (no hard blob), fireflies unchanged
- [ ] **BOLD-04**: The content-card glass is reworked to read as premium liquid glass (brighter frost + specular highlight + crisp bright edge + rounded corners), not a flat gray box; both tiers read as glass while holding contrast; ladders + Fig. 01 exemption + active-panel scoping preserved; values in `tokens.css` only
- [ ] **BOLD-05**: The drawn overlay is re-tuned to the brighter sky — constellations still read as authored, moon + aurora stay under the (now brighter) Milky-Way-core luminance ceiling, fireflies + warm glow carry copper; every v3.0 engine invariant holds (single-rAF, no `'lighter'`, canvas never CSS-transformed)
- [ ] **BOLD-06**: All gates re-pass on the new look — `verify-visibility.mjs` re-blessed to the approved stills and green ×3 viewports (blur/blackout controls still fail); `--cdp-screenshot` ≥4.5:1 every surface both viewports (held by the card, never by re-darkening the sky); `--moon`/`--aurora`/banding green; soak <10%; **live** Lighthouse ≥90 ×4; deploy gated on explicit user go with rollback documented

## Future Requirements

Deferred: NOTE-01 (notes), NOTE-02 (/craft), CASE-04 (3rd case study), PLAT-08 (JSON-LD), OG-02 (panel-aware OG), OG-03 (refresh OG image to the new look — do at launch if trivial).

## Out of Scope

| Feature | Reason |
|---------|--------|
| Re-architecting the sky/glass/ambient engine | v3.0's engine is sound; this is a look rework, not a rebuild |
| Re-darkening the sky to pass contrast | The exact v3.0 anti-pattern that produced the muddy look — contrast is held by the card, proven by the screenshot gate |
| Runtime CSS filters for the grade | Baked into the master via sharp (v3.0 no-runtime-filter rule holds) |
| A different background concept | User chose "bolder rework" of the real-sky direction, not a pivot |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOLD-01 | Phase 11 | Complete |
| BOLD-02 | Phase 11 | Complete |
| BOLD-03 | Phase 11 | Pending |
| BOLD-04 | Phase 11 | Pending |
| BOLD-05 | Phase 11 | Pending |
| BOLD-06 | Phase 12 | Pending (local gates in 11; live + deploy in 12) |

**Coverage:** 6 total · mapped 6 · unmapped 0

---
*Requirements defined: 2026-07-20 from the user's "bolder rework" direction + the approved Galactic-Core+liquid-glass mockup pick*
