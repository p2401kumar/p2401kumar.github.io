---
phase: 11-bolder-sky
plan: 02
subsystem: ui
tags: [astro, css, glass, backdrop-filter, canvas, constellations, tokens, liquid-glass]

# Dependency graph
requires:
  - phase: 11-01
    provides: the warm/bright core-led sky master (dark quiet-left, amber core center-right) that the card + overlay are re-tuned against
provides:
  - Camper-free scene — the silhouette SVG is cut; the copper warmth survives as a broad soft warm ambient glow low in the frame (a radial, no blob), kept a CHILD of .camper so 11-03's re-pointed visibility gate measures warm-glow luminance at the .camper region
  - Premium liquid-glass card — reworked --glass-* tokens (both tiers) + a .panel-card specular ::before, rounded corners, crisp bright top edge, and a faint inner glow; every v3.0 degradation ladder + engine exemption preserved
  - Overlay re-tuned to the brighter sky — constellation star/link/halo alphas bumped so lines stay authored; firefly pulse floor lifted for copper presence; aurora left unchanged (brighter core = more headroom)
affects: [11-03 (gate battery — contrast/visibility/moon/aurora re-bless against this look; card fill escalation candidate flagged), 12 (launch)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Liquid-glass FORM over fill opacity: the specular ::before + crisp bright top edge + rounded corners + inner glow make a card read as glass more than its fill alpha — so tier-2 can stay a legibility scrim (darker smoked-glass fill) yet still read as glass by sharing the shared .panel-card form."
    - "Specular ::before clipped without overflow:hidden on the content box: inset:0 + border-radius:inherit sizes the pseudo exactly to the card so the radial cannot escape; isolation:isolate + z-index:-1 paints it on the frost, under the text, in BOTH deck and classic modes."

key-files:
  created:
    - .planning/phases/11-bolder-sky/evidence/11-02-after-desktop-1440.png
    - .planning/phases/11-bolder-sky/evidence/11-02-after-mobile-375.png
  modified:
    - src/components/NightSky.astro (camper SVG + fill rules cut; .camper-glow reshaped into a broad warm ambient wash)
    - src/styles/tokens.css (--glass-* reworked both tiers; new --glass-radius/--glass-specular/--glass-inner-glow)
    - src/styles/deck.css (.panel-card liquid-glass form + specular ::before + print-strip update)
    - src/lib/nightsky/constellations.ts (STATE_ALPHAS bumped for the brighter photo)
    - src/lib/nightsky/scene.ts (firefly pulse floor 0.4 -> 0.5)

key-decisions:
  - "Kept the recipe's explicit tier-1 brightness 1.08 despite the centered card overlapping the bright core at 1440 (marginal --dim eyebrow) — contrast is 11-03's gate by the plan's own division of labor; flagged as a card-fill escalation candidate rather than guessing an ad-hoc opacity now."
  - "Tier-2 reworked from the dead neutral rgb(15 18 23/0.55) 'gray box' to blue-tinted luminous smoked glass rgb(18 24 34/0.48) + deeper blur — still darkens for light-text legibility but reads as tinted glass via the shared .panel-card form."
  - "aurora.ts left intentionally unchanged — a brighter MW core gives MORE headroom under the moon<core / aurora<core ceilings, so no envelope change is required (11-03 gates --moon/--aurora)."
  - "Firefly PEAK held at 0.9 (only the floor lifted to 0.5): the SKY-05 narrow-viewport fallback contrast ceiling (0.9 * 0.5 = 0.45 >= 4.5:1 vs --ink at zero scrim) is anchored to the peak and must not move."

patterns-established:
  - "Glass depth supersedes the v3.0 16px blur 'ceiling' note: 11-02 raises panel blur to 20-24px deliberately (glass depth is the point); the ceiling comment is retired in tokens.css."

requirements-completed: [BOLD-03, BOLD-04, BOLD-05]

coverage:
  - id: D1
    description: "No camper silhouette anywhere; a clean broad soft warm ambient glow (radial, no blob) low in the frame carries copper; .camper-glow stays a child of .camper; parallax classes + reduced-motion branches preserved; fireflies unchanged in kind."
    requirement: "BOLD-03"
    verification:
      - kind: automated
        ref: "grep camper-svg/camper-body/camper-window = 0; rgb(from var(--accent)) present; parallax-nudge classes present; npx astro check 0 errors"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/11-bolder-sky/evidence/11-02-after-desktop-1440.png (no silhouette; warm glow low-left)"
        status: pass
    human_judgment: true
    rationale: "The 'clean warm ambient glow, no smudge' target is a subjective look match to mockup A; captured for the orchestrator/11-03 eyeball."
  - id: D2
    description: "The content card reads as PREMIUM liquid glass — brighter frost, a top-left specular highlight, a crisp bright top edge, rounded corners, a faint inner glow, working backdrop blur — not a flat gray box; tier-2 reworked to luminous smoked glass; all v3.0 ladders + .fig exemption + active-panel scoping + -webkit dual-write + zero-hex preserved."
    requirement: "BOLD-04"
    verification:
      - kind: automated
        ref: "@supports/prefers-reduced-transparency/@media print present; backdrop-filter 8 == webkit 4 * 2; deck.css hex = 0; npm run build passes"
        status: pass
      - kind: manual_procedural
        ref: ".planning/phases/11-bolder-sky/evidence/11-02-after-desktop-1440.png (rounded corners + top-left specular + bright edge + blur visible)"
        status: pass
    human_judgment: true
    rationale: "The 'reads as liquid glass' target is a subjective look match to mockup C; exact opacity/contrast is arbitrated by 11-03's screenshot gate."
  - id: D3
    description: "Overlay re-tuned to the brighter sky — constellation alphas/halo scale bumped so lines stay authored; firefly copper presence lifted (floor only); aurora unchanged; single-rAF (2/0/0) + no new 'lighter' (baseline 2) + source-over only + canvas never transformed."
    requirement: "BOLD-05"
    verification:
      - kind: automated
        ref: "scene rAF=2, constellations rAF=0, aurora rAF=0; lib/nightsky 'lighter'=2, aurora 'lighter'=0; npx astro check 0 errors"
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-07-20
status: complete
---

# Phase 11 Plan 02: Camper Cut + Liquid-Glass Card + Overlay Re-tune Summary

**Cut the unrecognizable camper silhouette (the copper warmth survives as a broad soft warm ambient glow low in the frame), reworked the flat gray-box card into premium liquid glass (brighter frost, deeper blur, a top-left specular highlight, a crisp bright edge, rounded corners, a faint inner glow — both tiers), and re-tuned the drawn overlay's alphas to stay authored over the brighter 11-01 sky — every v3.0 accessibility ladder and engine invariant intact, nothing pushed.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 3 (+ evidence)
- **Files modified:** 5 source + 2 evidence captures

## Accomplishments

- **Camper cut (BOLD-03):** deleted the entire `<svg class="camper-svg">` (body rect / wheel circle / window rect) and its `.camper-body,.camper-wheel { fill }` + `.camper-window { fill }` rules. Reshaped `.camper-glow` from a 96px window-anchored ember into a broad soft warm radial (`inset: -28%`, `ellipse at 42% 64%`, peak alpha 0.34 feathering to 0) that reads as a warm ambient wash low-left. Kept `.camper-glow` a CHILD of the `.camper` container (radial peak sits inside the box) so 11-03's re-pointed visibility gate measures warm-glow luminance at the `.camper` region. The `.camper` container + `.parallax-nudge-fwd/back` classes/keyframes + reduced-motion branches are untouched (parallax.ts stays working). Accent stays relative-color (`rgb(from var(--accent) r g b / a)`), no hex, no shadowBlur/filter.
- **Liquid-glass card (BOLD-04):** reworked the `--glass-*` tokens in tokens.css ONLY (zero hex). Tier-1 optical: frost `0.06 -> 0.10`, blur `12 -> 22px`, saturate `140%`, brightness `0.90 -> 1.08`, edge `0.10 -> 0.28`. Tier-2 protected: the dead gray box `rgb(15 18 23/0.55)` -> luminous smoked glass `rgb(18 24 34/0.48)`, blur `10 -> 20px`, saturate `140%`. New form tokens: `--glass-radius: 15px`, `--glass-specular` (top-left white radial), `--glass-inner-glow` (inset box-shadow). In deck.css §8 the `.panel-card` glass rule gains `border-radius`, `position: relative`, `isolation: isolate`, and the inner-glow `box-shadow`, plus a specular `::before` (inset:0 + border-radius:inherit so it can't escape the card; `z-index:-1` paints it on the frost under the text; `pointer-events:none`). The `::before` was added to the `@media print` strip.
- **Overlay re-tune (BOLD-05):** bumped `STATE_ALPHAS` (ambient star 0.45/0.55->0.54/0.64, link 0.16->0.22, halo 0.15/1.3x->0.19/1.4x; brightened link 0.5->0.6, halo 0.25/1.5x->0.32/1.6x; dimmed lifted off the floor) so lines stay clearly authored over the busier photo — still `--star` exclusively. Lifted the firefly pulse FLOOR `0.4 -> 0.5` (peak held at 0.9). aurora.ts intentionally unchanged.

## Task Commits

1. **Task 1: Cut camper; reshape glow** — `b341c26` (feat) — src/components/NightSky.astro
2. **Task 2: Liquid-glass tokens + .panel-card form** — `ba5b1d6` (feat) — src/styles/tokens.css, src/styles/deck.css
3. **Task 3: Overlay re-tune (alpha-only)** — `3175170` (feat) — src/lib/nightsky/constellations.ts, src/lib/nightsky/scene.ts
4. **Evidence: composited-page captures (1440 + 375)** — `4445208` (test) — evidence PNGs

## --glass-* token values (before -> after)

| Token | Before | After |
|-------|--------|-------|
| `--glass-bg` (tier-1 frost) | `rgb(255 255 255 / 0.06)` | `rgb(255 255 255 / 0.10)` |
| `--glass-blur` | `12px` | `22px` |
| `--glass-saturate` | `150%` | `140%` |
| `--glass-brightness` | `0.90` | `1.08` |
| `--glass-bg-2` (tier-2 fill) | `rgb(15 18 23 / 0.55)` | `rgb(18 24 34 / 0.48)` |
| `--glass-blur-2` | `10px` | `20px` |
| `--glass-saturate-2` | `130%` | `140%` |
| `--glass-brightness-2` | `0.96` | `0.98` |
| `--glass-edge` | `rgb(255 255 255 / 0.10)` | `rgb(255 255 255 / 0.28)` |
| `--glass-radius` | _(new)_ | `15px` |
| `--glass-specular` | _(new)_ | `radial-gradient(120% 82% at 14% 0%, rgb(255 255 255 / 0.11), rgb(255 255 255 / 0.045) 32%, transparent 62%)` |
| `--glass-inner-glow` | _(new)_ | `inset 0 0 34px 0 rgb(255 255 255 / 0.045)` |

Chrome tokens (header/footer/jump-index) intentionally left as-is per the plan (untouched unless 11-03's contrast gate flags them).

## Camper-cut confirmation

`grep` counts (all 0): `camper-svg` = 0, `camper-body` = 0, `camper-window` = 0. `rgb(from var(--accent)` still present (4, the reshaped glow). `class="camper"` container present (1). `parallax-nudge` classes present (8). `npx astro check` = 0 errors.

## Overlay re-tune deltas

- constellations `STATE_ALPHAS`: ambient `{starMid 0.45->0.54, starBright 0.55->0.64, link 0.16->0.22, halo 0.15->0.19, haloScale 1.3->1.4}`; brightened `{link 0.5->0.6, halo 0.25->0.32, haloScale 1.5->1.6}`; dimmed `{starMid 0.27->0.32, starBright 0.34->0.40, link 0.10->0.13}`.
- scene fireflies: `FIREFLY_ALPHA_MIN 0.4 -> 0.5` (peak 0.9 held).
- aurora: no change (documented — brighter core gives more headroom).

## Composited-page capture paths

- `C:\Development\Dump\Portfolio\.planning\phases\11-bolder-sky\evidence\11-02-after-desktop-1440.png`
- `C:\Development\Dump\Portfolio\.planning\phases\11-bolder-sky\evidence\11-02-after-mobile-375.png`

Both are headless-Chrome (`--headless=new`, backdrop-filter compositing) captures of the deck-active hero: camper cut, liquid-glass card (rounded corners + top-left specular + bright edge + working backdrop blur visible), brighter amber-core sky.

## Invariants verified (each commit)

- single-rAF: scene.ts = 2; clouds/aurora/parallax/constellations/starfield/meteors = 0 (checked constellations=0, aurora=0).
- no new `'lighter'`: `lib/nightsky` = 2 (baseline: constellation firing beam + meteors), aurora = 0.
- canvas never CSS-transformed: parallax targets `.camper` only (untouched).
- zero hex outside tokens.css: deck.css hex = 0; the glow uses relative-color from `--accent`.
- `-webkit` dual-write preserved: deck.css backdrop-filter 8 == webkit 4 * 2.
- ladders preserved: `@supports` (4), `prefers-reduced-transparency` (2), `@media print` (1) all present.
- `package.json` + `.planning/config.json` untouched; nothing pushed.

## Deviations from Plan

None to the task actions. Two documented judgment calls within the plan's explicit discretion:

1. **aurora.ts left unchanged** — the plan's Task 3 action states "no envelope change is required unless 11-03's --aurora/--moon check flags it." Reviewed and intentionally not modified; a brighter MW core only increases headroom under the ceilings. (Listed in files_modified as an expectation, not a mandate to edit.)
2. **Recipe brightness 1.08 kept despite a marginal eyebrow at 1440** — see Known Issues / flag for 11-03 below.

## Known Issues / Flag for 11-03 (contrast escalation)

At 1440 the centered `.panel-card` overlaps the bright amber core (the composition is 11-01's, unchanged here), and the low-contrast `--dim` eyebrow label ("DISTRIBUTED SYSTEMS · CLOUD") reads marginal over the lifted (brightness 1.08) frost. The heading (`--ink`) and body (`--body`) read fine. Per the plan's division of labor, contrast is 11-03's screenshot gate — this is flagged as a **card-fill escalation candidate** (lean the tier-1 fill more opaque and/or trim `--glass-brightness`; escalate the card, NEVER re-darken the sky). Left at the recipe values rather than guessing an ad-hoc opacity that 11-03 will measure precisely. No tier-2 legibility problem observed (smoked-glass fill still darkens for light text).

## Self-Check: PASSED
