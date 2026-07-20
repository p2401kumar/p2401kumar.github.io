# Phase 11: Bolder Sky — Context

**Gathered:** 2026-07-20
**Status:** Ready for planning
**Milestone:** v3.1 "Bolder Sky" — a focused aesthetic rework of the shipped v3.0 background (not new capability). Lean: direction is locked + mocked, so NO 4-lane research.

<domain>
## Why this phase exists

The shipped v3.0 background was judged (by the user, bluntly) as looking bad — confirmed on all four counts: too dark & muddy, glass reads as a flat gray box, the camper is an unrecognizable smudge, and the composition is empty & lopsided. The user picked a **bolder rework** and, from a 3-direction mockup, chose **Direction A (Galactic Core) with Direction C's liquid-glass card** (recommended synthesis).

This phase rebuilds the *look*, not the engine. The engine (sky pipeline, glass tokens, ambient systems, the full verifier suite incl. the new `verify-visibility.mjs`) all stays — this re-grades the master, recomposes, cuts the camper, upgrades the glass card, re-tunes the overlay, and re-passes every gate.

</domain>

<visual_anchor>
## The approved look (visual anchor — the build must read like this)

- Interactive mockup: Artifact `https://claude.ai/code/artifact/6edcd025-d312-4178-965d-68889d4a18d5` (Direction A + the "A+C glass" pick)
- Source + captures: `<scratchpad>/build-mockup.mjs`, `shot-a.png` (Galactic Core), `shot-c.png` (the liquid-glass card treatment to graft on)
- The mockup approximated the grade with CSS filters `brightness(1.32) contrast(1.12) saturate(1.42)` + a warm amber core-glow + a warm low-left glow. The REAL build reproduces that target by baking the grade into the master via `sharp` (not runtime CSS filters — the v3.0 no-runtime-filter rule holds).

</visual_anchor>

<decisions>
## The recipe (locked)

### 1. Sky regrade — `scripts/build-sky.mjs` rebuild (BOLD-01)
The current grade is the murk culprit: desaturate ×0.35 → cool slate tint `#93a7cf` → black point crushed to `--sky-zenith` → midtone ×0.80 (darken) → a heavy column vignette (α0.88). It kills the real amber core and dulls everything to grey-blue.
- **Warm + bright**: LIFT midtones (no ×0.80 darken — bring them up), REDUCE desaturation (≈×0.6–0.7, not ×0.35) so the galactic core keeps its real amber/gold and the arms keep cool blue — the warm-cool contrast is the whole point. Do NOT tint everything cool slate.
- **Black point** can stay near `--sky-zenith` so shadows are clean, but the lift lives in the mids/highs.
- **Column vignette**: heavily REDUCE or remove it. In v3.0 it existed to protect full-viewport-panel contrast — but glass is now card-scoped (post visibility-fix, on `.panel-card`), so the card provides the text scrim and the sky should read bright across the whole frame. Contrast is re-held by the card, not by darkening the sky (verified by the gate).
- **Banding**: the brighter, lifted-midtone grade is a NEW banding risk (lifted mids band more than crushed blacks) — re-run `verify-banding` and re-tune grain/dither; the banding gate must stay green.

### 2. Recompose — core as hero, fill the frame (BOLD-02)
- Bring the amber galactic core to LEAD as a bold anchor (mockup A: `background-position ~74% 42%`) — recompute the crop window + the object-position responsive ladder so the core is present and the frame is filled, killing the dead-center murk and the lopsided "band shoved to the edge" read.
- Keep the mobile tier honest: it must show real sky/core presence (the v3.0 mobile tier deliberately cropped to the *quiet* region — that's part of why mobile looked empty; recompose so mobile still reads as a sky, per the visibility gate's 375w floors).

### 3. Cut the camper (BOLD-03)
- Remove the camper silhouette SVG (the "smudge") from `NightSky.astro`.
- Keep the copper brand accent alive as a CLEAN soft warm ambient glow low in the frame (a radial, no hard silhouette) — mockup A kept exactly this. Fireflies already carry copper; the warm glow keeps the "warmth in the cold night" without the literal blob.
- Note: this drops the literal "campsite" narrative the user themselves elected to cut. Fine — user-directed.

### 4. Liquid-glass card — C's treatment (BOLD-04)
Restyle the existing card glass (already card-scoped) to read as PREMIUM glass, not a flat gray box:
- Brighter frost (white ≈9–10%, up from 6%), blur ≈20–24px, saturate ≈1.4, brightness ≈1.08; crisp bright top edge (white ≈28–30%); a specular highlight (a soft white radial in the card's top-left via `::before`); rounded corners (≈14–16px); a faint inner glow.
- Tier-2 dense-text panels: the v3.0 dark `rgb(15 18 23 / 0.55)` fill is the literal "gray box" — rework it to still read as glass (lighter, or a tinted-but-luminous fill) while holding contrast. The screenshot gate arbitrates the exact values; the LOOK target is "liquid glass," never "dark rectangle."
- All values as `--glass-*` tokens in `tokens.css` only. `@supports` / `prefers-reduced-transparency` / print ladders + the Fig. 01 `.fig` solid exemption + active-panel-only scoping all PRESERVED.

### 5. Re-tune the overlay to the brighter sky (BOLD-05)
- Constellations must still read as clearly AUTHORED over a brighter, busier photo (may need a touch more brightness/halo). Moon stays dim (a brighter MW core gives MORE headroom under the moon<core ceiling — good). Aurora stays under the core ceiling. Fireflies + the new warm glow carry copper. Meteors unchanged.
- No new rAF, no `'lighter'`, canvas never CSS-transformed, single-rAF counts unchanged — all v3.0 engine invariants hold.

### 6. Gates — the non-negotiable part (BOLD-06)
The v3.0 process passed a broken look because every gate rewarded darkness. This rework's gates must PROVE the new look, brightness included:
- **`verify-visibility.mjs` RE-BLESSED** (`--bless`) to the new intended stills, and still GREEN at all three viewports (brighter ⇒ easier; but re-bless so SSIM anchors to the approved look, and confirm the blur/blackout selftest controls still FAIL).
- **`verify-contrast.mjs --cdp-screenshot` BOTH viewports — EVERY surface ≥4.5:1** with the brighter sky + new glass card. THE KEY RISK: a brighter sky under text. The card glass is the scrim now; if any surface dips, escalate the card fill (more opaque) — NEVER ship below floor, NEVER re-darken the whole sky to pass (that's the v3.0 anti-pattern). Header/footer/jump-index chrome over the now-brighter top sky get re-checked too.
- **`--moon` + `--aurora`** re-pass (re-target the comparator to the new brighter MW-core peak).
- **`verify-banding` selftest + masters** green (the lifted-midtone regrade).
- Soak <10% (unchanged engine — expect the 5–6% family), Lighthouse ≥90 ×4 both presets, single-rAF, zero-hex, leak gate.
- **Human/orchestrator eyeball**: the built result must actually read like the approved mockup (Galactic Core + liquid glass). I (orchestrator) will look at real captures, not trust "verified."

### Deploy
- Gated on explicit user go (v1/v2/v3 doctrine). FF-only, never force. Rollback = revert + FF push; tag the current live as recoverable. The live site keeps the (fixed-but-muddy) v3.0 look until the user approves the bolder one.

### Claude's Discretion
- Exact grade curve numbers (reproduce the mockup target), crop window, glow placement/softness, precise glass token values (gate-arbitrated), constellation brightness bump.

</decisions>

<canonical_refs>
- The mockup (visual anchor, above) + `.planning/10-UI-REVIEW.md` (the 4-complaint diagnosis + the luminance-range insight blur can't game)
- `scripts/build-sky.mjs` (the grade/crop/vignette to rebuild) + `scripts/verify-banding.mjs`
- `scripts/verify-visibility.mjs` + `scripts/fixtures/visibility-refs/` (the gate to re-bless) + `verify-contrast.mjs` (--cdp-screenshot/--moon/--aurora)
- `src/styles/tokens.css` (--glass-*, --sky-*, --accent) + `src/styles/deck.css` (the .panel-card glass, post visibility-fix) + `src/components/NightSky.astro` (the camper to cut, the glow)
- `.planning/milestones/v3.0-phases/` (the shipped engine + gate methodology) + `.planning/quick/2026-07-19-sky-visibility-fix/` (the current card-scoped-glass state)

</canonical_refs>

<specifics>
- The bar: "same campsite, clearer AND warmer night" — a visitor who saw the muddy version should feel it got *richer and more alive*, not just brighter.
- The amber core is the one warm event in a cool frame — spend the boldness there, keep everything else quiet (the copper accent stays <5%).
- The glass card is the second thing they notice after the core — it must feel like glass you could touch, not a dimming overlay.

</specifics>

<deferred>
- Aurora lateral-softening lever (still optional); /home repo retirement; v4 backlog (NOTE-01/02, CASE-04, PLAT-08, OG-02). OG-03 image should be refreshed to the new look at launch if trivial.

</deferred>

---
*Phase: 11-bolder-sky · Milestone v3.1 "Bolder Sky" · Context 2026-07-20 (direction locked via mockup pick)*
