---
phase: 11-bolder-sky
plan: 03
subsystem: ui
tags: [contrast, wcag, glass, object-position, crop-anchor, visibility-gate, ssim, banding, lighthouse]

# Dependency graph
requires:
  - phase: 11-01
    provides: the warm/bright core-led sky master + object-position ladder + frozen grade constants
  - phase: 11-02
    provides: cut camper + warm glow (child of .camper), liquid-glass card tokens, overlay re-tune
provides:
  - A green gate battery on the NEW bolder look (brightness INCLUDED) — visibility re-blessed + honest, contrast >=4.5 every surface both viewports, moon/aurora/banding/soak/Lighthouse all green
  - STEP-0 composition fix — the sky (not the locked card) moved so the amber core LEADS in the clear right margin the centered deck card does not cover, with the card's text over naturally-darker sky (matches approved mockup A)
  - Warm-glow visibility metric — the camper region assertion swapped from the cut silhouette's Sobel edge-energy to copper warm-glow luminance-presence (right metric for the new glow; coverage kept, not weakened)
  - Escalated card/chrome glass tokens that hold contrast on the brighter sky WITHOUT ever re-darkening the frozen grade
affects: [12 (launch — owns the user-gated deploy; origin still behind local)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Composition (which part of the master shows where) as a distinct lever from grade (the frozen pixel values): crop anchor coreAt-x + object-position pan the SAME bright master to lead the core in a card's clear zone — never dim the sky to fix a layout/contrast tension."
    - "Right-metric-not-lower-floor gate re-point: when a design element changes kind (silhouette -> soft glow), swap the METRIC (edge-energy -> warm luminance-presence) rather than dropping the floor; the --selftest blur/blackout controls prove the re-pointed gate still rejects the failure modes."
    - "Card-edge open-sky pixels can't be held by fill opacity (they're outside the card); a small tier-2 padding-inline that wraps dense prose INSIDE the dark scrim is the honest fix (never re-darken the sky)."

key-files:
  created:
    - .planning/phases/11-bolder-sky/evidence/11-03-before-desktop-1440.png
    - .planning/phases/11-bolder-sky/evidence/11-03-before-mobile-375.png
    - .planning/phases/11-bolder-sky/evidence/11-03-after-desktop-1440.png
    - .planning/phases/11-bolder-sky/evidence/11-03-after-mobile-375.png
    - .planning/phases/11-bolder-sky/{gate,selftest,contrast-1440,contrast-1280}-report/json + soak-report.txt + lighthouse-{mobile,desktop}.json
  modified:
    - scripts/build-sky.mjs (crop anchor coreAt-x 0.6 -> 0.68; masters regenerated; banding re-passed)
    - src/components/NightSky.astro (base desktop object-position 10% -> 0%; ladder comments)
    - scripts/verify-visibility.mjs (camper Sobel-edge -> warm-glow delta metric; deterministic range floors 90/100 -> 135/135)
    - scripts/fixtures/visibility-refs/*.png (re-blessed to the shipped core-led + escalated-glass look)
    - src/styles/tokens.css (tier-1/tier-2/chrome glass escalation — brightness/fill only, zero-hex intact)
    - src/styles/deck.css (§8b tier-2 dense-prose padding-inline)

key-decisions:
  - "STEP-0 needed a crop recompose, not just object-position: measurement showed the master's warm core peak sat at master-x ~0.56, and object-position alone maxes the core at viewport ~55% (still behind the card). coreAt-x 0.6 -> 0.68 shifted the peak to master-x ~0.64 so object-position 0% leads it at viewport ~86% (right margin). This is composition; the 11-01 grade is frozen."
  - "Camper metric swap = right metric, not a weakened floor: edge-energy measured the CUT silhouette's edges (near-zero for a soft radial — a false FAIL); warm-glow delta (mean R-B, glow zone vs cool sky above) measures what actually survived. Healthy 19.75/19.78/22.49; floors 10/10/12 reject a collapsed glow."
  - "RAISED the deterministic bandRange/starfieldRange floors 90/100 -> 135/135: the brighter look measures healthy 159/168 and a blur(12) only drops them to 119/107 — the OLD floors would no longer catch the original blur BLOCKER. Higher floors keep the gate HONEST (blur + blackout controls still FAIL) while healthy clears with a 24-33pt margin. Making the gate STRICTER, never weaker."
  - "Contrast held by the CARD, sky frozen: tier-1 brightness 1.08 -> 0.62 (the 11-02 luminous lift blew out systems' right-edge tags over the core to 2.38); tier-2 0.48/0.98 -> 0.55/0.82 + a padding-inline; chrome 0.92 -> 0.64. The liquid-glass FORM (specular/edge/radius/inner-glow) keeps the darker fill reading as glass — eyeball-confirmed, not a gray box."
  - "The experience failing pixel was OPEN SKY at the card's right edge (unchanged by fill escalation) — fixed by insetting tier-2 prose so lines wrap inside the scrim, not by touching the sky."

patterns-established:
  - "Re-bless AFTER all visual changes are final: the first bless (post-composition) was invalidated by the Task-2 glass escalation, so the refs were re-blessed to the shipped look and the gate/selftest re-run — the SSIM anchor must match what actually ships."

requirements-completed: [BOLD-06]

coverage:
  - id: T1
    description: "verify-visibility re-blessed to the new approved stills, GREEN at all three viewports; blur + blackout selftest controls still FAIL (gate honesty intact); camper metric swapped to warm-glow presence (coverage kept, not weakened)."
    requirement: "BOLD-06"
    verification:
      - kind: automated
        ref: "verify-visibility --gate PASS 1440/1280/375 (SSIM 1.0/1.0/0.9999); --selftest PASS (blackout trips bandRange/starfield/starCount/ssim; blur trips bandRange/starfield/starCount/ssim)"
        status: pass
    human_judgment: false
  - id: T2
    description: "Every over-sky text surface >=4.5:1 at BOTH viewports on the brighter sky + new glass — held by the CARD (escalated), never by re-darkening the sky; moon/aurora/banding all green."
    requirement: "BOLD-06"
    verification:
      - kind: automated
        ref: "verify-contrast --cdp-screenshot 1440 + 1280 PASS (worst systems 5.19/5.22); --moon (0.32/0.24 < 0.84/0.85) + --aurora (0.13/0.04) PASS strictly; contrast + banding selftests green"
        status: pass
    human_judgment: false
  - id: T3
    description: "Ambient soak <10%; local Lighthouse >=90 x4 both presets; single-rAF/zero-hex/leak/no-cross-import invariants hold; origin behind local (NOTHING pushed)."
    requirement: "BOLD-06"
    verification:
      - kind: automated
        ref: "soak 6.96% cpu/60fps/0 longtasks; Lighthouse mobile 99/100/100/100, desktop 100/100/100/100; scene rAF=2 others 0; zero-hex 0; leak gate + no-cross-import clean; git rev-list origin/main..HEAD = 15"
        status: pass
    human_judgment: false
  - id: D1
    description: "The before/after 1440 + 375 captures read like the approved mockup — amber core leading in the right margin around a clean liquid-glass card, text over darker sky, eyebrow legible, camper cut."
    requirement: "BOLD-06"
    verification:
      - kind: manual_procedural
        ref: ".planning/phases/11-bolder-sky/evidence/11-03-{before,after}-{desktop-1440,mobile-375}.png"
        status: pass
    human_judgment: true
    rationale: "Final composition/glass match to mockup A + C is the orchestrator's end-of-phase eyeball; captured before/after at both priority viewports."

# Metrics
duration: 55min
completed: 2026-07-20
status: complete
---

# Phase 11 Plan 03: Gate Battery + Composition Fix Summary

**Moved the SKY (not the locked deck card) so the amber galactic core with dust lanes LEADS in the clear right margin while the card sits over naturally-darker sky (approved mockup A) — then proved the new bolder look on every gate, brightness INCLUDED: re-blessed the visibility gate (swapping the cut camper's Sobel-edge floor for a copper warm-glow luminance-presence metric and RAISING the range floors so a blur still trips them), held >=4.5:1 on every surface both viewports by escalating the card/chrome glass (never the frozen sky), and passed moon/aurora/banding/soak/Lighthouse — nothing pushed.**

## Performance

- **Duration:** ~55 min
- **Tasks:** Step 0 (composition) + 3 (gate battery)
- **Files modified:** 6 source/script + masters/refs + evidence/reports

## STEP-0 Composition Fix (the pre-gate move)

The 11-02 composited result put the centered deck card directly OVER the bright core (core blurred away, eyebrow marginal). The deck card position is LOCKED, so the SKY was moved:

- **Measurement first:** a column-luminance scan of the master showed the warm-core peak at master-x ~0.56; object-fit:cover geometry proved object-position alone maxes the core at viewport ~55% (still behind the card). So a crop recompose was required (object-position alone could not do it).
- **Crop anchor** `coreAt-x 0.6 -> 0.68` (build-sky.mjs): shifts the visual warm-core peak to master-x ~0.64 with an EXPANDED dark quiet region to its left. Frame 1053x448 -> 978x416; masters + LQIP regenerated; **banding gate re-passed** (selftest + all four masters green on the first regenerate).
- **Base desktop object-position** `10% -> 0%` (NightSky.astro): max rightward pan lands the core at viewport ~86% (right margin, dust lanes in the open) while the card's left-aligned text sits over the dark quiet-left (master ~0.15-0.36).
- Result: the eyebrow is legible over darker sky and the core leads to the right of / around the card — matching shot-a. COMPOSITION only; the 11-01 grade constants are frozen. (Mobile 50% and ultrawide 3% tiers re-checked and held post-recrop.)

## Task 1 — Visibility gate: re-blessed, green, honest

- **Metric swap (plan-checker BLOCKER):** the camper region assertion moved from `camperEdgeAbs` (Sobel edge-energy — measured the CUT silhouette's edges; a soft radial has near-zero edge energy, a false FAIL) to `camperWarmDelta` — mean(R-B) over the glow zone minus the cool sky above (the copper glow #d99163 lifts R-B; a lost glow collapses toward the surround). Healthy 19.75/19.78/22.49; floors 10/10/12. Coverage of the lower-left is KEPT, not weakened.
- **Range floors RAISED** 90/100 -> 135/135 (deterministic, byte-stable captures): the brighter look measures healthy band 159 / starfield 168, and a blur(12) control only drops them to 119/107 — the OLD floors would no longer catch the original blur BLOCKER. New floors keep the gate honest (blur trips a range floor) with a 24-33pt healthy margin.
- **Re-blessed** the SSIM reference stills to the approved look; `--gate` PASS all 3 viewports (SSIM 1.0/1.0/0.9999); `--selftest` PASS (blackout + blur controls both FAIL correctly).

## Task 2 — Contrast >=4.5 both viewports (card escalation, sky frozen)

Contrast FAILED on the brighter core-led sky (systems 2.38, experience 4.01, header 3.75). Held by escalating the CARD/chrome fill — never the sky:

| Token | Before (11-02) | After (11-03) | Forcing surface |
|-------|----------------|---------------|-----------------|
| `--glass-brightness` (tier-1) | 1.08 | **0.62** | systems right-edge metric tags over the core (2.38) |
| `--glass-bg` (tier-1) | 0.10 | **0.08** | (white frost glare over the bright core) |
| `--glass-bg-2` (tier-2) | 0.48 | **0.55** | experience dense prose |
| `--glass-brightness-2` (tier-2) | 0.98 | **0.82** | experience dense prose |
| `--glass-brightness-chrome` | 0.92 | **0.64** | top-right header nav over the bright top band (3.75) |
| deck.css §8b `padding-inline` (tier-2 cards) | — | **clamp(14px,1.8vw,26px)** | experience's wrapped line's last word sat at the card's OPEN-SKY right edge (outside any fill) |

**Final worst-vs-ink per surface (all >=4.5):**

| Surface | 1440 | 1280 |
|---|---|---|
| hero | 7.76 | 8.16 |
| systems | **5.19** | **5.22** |
| experience | 9.19 | 9.20 |
| patents | 9.06 | 9.04 |
| skills | 9.01 | 9.87 |
| contact | 9.61 | 9.66 |
| header | 6.05 | 5.32 |
| footer | 14.49 | 14.31 |
| jump-index | 13.67 | 13.37 |

- `--moon` PASS strictly: moonPeak 0.3223/0.2436 < mwPeak 0.8384/0.8482 (brighter core = more headroom).
- `--aurora` PASS strictly: max auroraPeak 0.1334/0.0423 < mwPeak.
- `verify-contrast --selftest` + `verify-banding --selftest` + `verify-banding` (masters) all green.
- Re-blessed the visibility refs AGAIN after the glass finalized (the shipped look is the SSIM ground truth); `--gate` + `--selftest` re-run green.

## Task 3 — Budget + invariants + evidence

- **Ambient soak:** 6.96% CPU (< 10% floor), 60.0fps, 0 long tasks, layout 0.000s (reduced-motion baseline 1.51%).
- **Local Lighthouse (>=90 x4 both presets):** mobile **99/100/100/100**, desktop **100/100/100/100**.
- **Invariants:** single-rAF (scene.ts 2; aurora/constellations/parallax/starfield/meteors 0; fig01 2); zero 6-hex outside tokens.css (0); leak gate (`nightsky-canvas` in index only, 0 in work pages); no cross-boundary nightsky<->fig01/deck imports. **Engine (lib/nightsky, fig01) untouched by 11-03.**
- **Before/after** 1440 + 375 captures committed under `evidence/` (muddy 11-02 core-behind-eyebrow -> new core-led look).
- **No push:** `git rev-list --count origin/main..HEAD` = 15; `package.json` + `.planning/config.json` untouched. Phase 12 owns the gated deploy.

## Deviations from Plan

1. **STEP-0 required a crop recompose, not just object-position** — the plan's Step 0 said "adjust object-position ... only if object-position alone can't do it, the crop anchor." Measurement proved object-position alone maxes the core at viewport ~55% (still behind the card), so `coreAt-x 0.6 -> 0.68` was applied and masters regenerated + banding re-passed. Within the sanctioned path; grade frozen.
2. **Range floors RAISED during Task 1** (not just the camper swap) — the brighter look made the OLD range floors (90/100) blind to a blur (healthy jumped to 159/168; blur only drops to 119/107). Raising to 135/135 was required to keep the `--selftest` blur control tripping a range floor (gate honesty). This STRENGTHENS the gate; it is the opposite of "lowering a floor to pass."
3. **Re-blessed twice** — the plan's Task 1 blesses once, but the Task-2 glass escalation changed the card luminance, invalidating the first refs. Re-blessed to the shipped (escalated) look and re-ran gate/selftest green. The SSIM anchor now matches what ships.
4. **One tier-2 layout inset in deck.css** (padding-inline) beyond tokens.css — the experience failing pixel was OPEN SKY at the card's right edge (outside any fill; a fill bump provably could not move it), so the dense prose is inset to wrap inside the dark scrim. No sky change; hero (tier-1, the mockup card) untouched.

## Known Stubs

None. No hardcoded/placeholder values introduced; all gate numbers trace to live captures committed under `.planning/phases/11-bolder-sky/`.

## Self-Check: PASSED
