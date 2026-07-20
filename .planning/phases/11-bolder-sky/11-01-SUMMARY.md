---
phase: 11-bolder-sky
plan: 01
subsystem: ui
tags: [sharp, astro, canvas, milky-way, image-grade, object-position, banding]

# Dependency graph
requires:
  - phase: 07-real-sky-foundation
    provides: build-sky.mjs pipeline (download/integrity gate, frame geometry solver, seam ramp, encode ladder), verify-banding.mjs gate, the committed NOIRLab masters
  - phase: 10 (sky-visibility fix)
    provides: card-scoped glass (.panel-card is the text scrim), which frees the sky to read bright (column vignette no longer needed)
provides:
  - Regraded warm+bright sky master (reduced desat, no cool tint, midtone LIFT, column vignette removed) baked via sharp
  - Core-led composition (crop anchor coreAt [0.6,0.44]) — amber galactic core leads with sky on both sides
  - Recomputed object-position responsive ladder — every tier frames the core; mobile no longer crops the dead quiet region
  - Regenerated masters (2560/1920 avif+webp) + LQIP; banding gate re-passed green on the lifted-mids regrade
affects: [11-02 (glass card + overlay re-tune over the brighter sky), 11-03 (gate battery — contrast/visibility/moon/aurora re-bless against the new look), 12 (launch)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zenith-anchored midtone LIFT: per-channel power-curve LUT out = Z + (255-Z)*((in-Z)/(255-Z))^gamma pins the black floor on --sky-zenith while lifting mids/highs — a controllable alternative to sharp .gamma() (which re-anchors to 0 and lifts shadows out of zenith)."
    - "Object-position ladder is derived from cover-window geometry: narrow/portrait tiers are height-bound with a tiny horizontal window, so object-position must sit near the core's master-x (~50%) to show the core; wider tiers step the value DOWN to keep the core leading-right."

key-files:
  created:
    - .planning/phases/11-bolder-sky/evidence/ (before/after master, core, mid-frame crops + desktop-1440 + mobile-375 rendered windows)
  modified:
    - scripts/build-sky.mjs (grade constants + compose stages + crop anchor)
    - src/components/NightSky.astro (object-position responsive ladder)
    - public/sky/milky-way-{2560,1920}.{avif,webp} + milky-way-lqip.txt (regenerated)

key-decisions:
  - "Dropped the .tint(#93a7cf) stage entirely (GRADE_TINT_ENABLED=false) rather than warming it — the reduced-desat core color + zenith-anchored black point already give warm core / cool arms / clean cool shadows without a global tint washing the core."
  - "Removed the column vignette (VIGNETTE_ALPHA 0.88 -> 0) — glass is card-scoped now, the card is the text scrim, the sky reads bright across the whole frame (contrast re-held by the card in 11-03, never by darkening the sky)."
  - "Re-anchored the crop from coreAt [0.84,0.58] (core shoved to the dead right edge) to [0.6,0.44] so the core leads with sky on both sides and the frame fills; the more-central anchor also fits a LARGER frame (1053x448 vs 987x420)."
  - "Grade values: GRADE_SATURATION 0.35 -> 0.80, MIDTONE darken 0.80 -> midtone LIFT gamma 0.78; GRAIN_AMP unchanged at 1.5 (banding stayed green, no re-tune needed)."

patterns-established:
  - "Preview-window simulation of object-fit:cover + object-position via sharp (temporary helper, not committed) to tune the ladder against rendered viewports before touching NightSky.astro."

requirements-completed: [BOLD-01, BOLD-02]

coverage:
  - id: D1
    description: "Regraded sky master reads warm + bright: amber galactic core keeps its gold, arms stay cool blue, midtones lifted out of the murk (no cool-slate wash), column vignette gone."
    requirement: "BOLD-01"
    verification:
      - kind: manual_procedural
        ref: ".planning/phases/11-bolder-sky/evidence/after-master-full.jpg + after-core-crop.jpg (vs before-*)"
        status: pass
    human_judgment: true
    rationale: "The 'warm + bright + amber-core-leads' target is a subjective look match to the approved mockup (shot-a.png); the orchestrator/user eyeballs the before/after crops. 11-03 re-blesses verify-visibility SSIM against the new stills."
  - id: D2
    description: "Core-led composition + object-position ladder: core leads at ~72% desktop, ~68% ultrawide, ~50% tablet/mobile; the v3.0 mobile quiet-crop (10% 70%) is removed and mobile shows real core presence."
    requirement: "BOLD-02"
    verification:
      - kind: manual_procedural
        ref: ".planning/phases/11-bolder-sky/evidence/after-desktop-1440.jpg + after-mobile-375.jpg"
        status: pass
    human_judgment: true
    rationale: "Composition/framing is a visual judgment against the mockup; the 375w floors are re-checked automatically by verify-visibility in 11-03."
  - id: D3
    description: "Banding gate re-passes on the lifted-midtone regrade: --selftest (clean PASS / banded FAIL) and all four committed masters green (runsAboveZero<=3, zeroGaps<2)."
    verification:
      - kind: automated
        ref: "node scripts/verify-banding.mjs --selftest && node scripts/verify-banding.mjs"
        status: pass
    human_judgment: false

# Metrics
duration: 14min
completed: 2026-07-20
status: complete
---

# Phase 11 Plan 01: Regrade + Recompose the Sky Master Summary

**Killed the v3.0 murk — reduced desaturation, dropped the cool-slate tint, replaced the midtone darken with a zenith-anchored midtone LIFT, and removed the column vignette; re-anchored the crop so the amber galactic core leads with sky on both sides; recomputed the object-position ladder so every tier (incl. mobile) frames the core; banding gate re-passed green.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-07-20T18:32:27Z
- **Completed:** 2026-07-20T18:45:54Z
- **Tasks:** 3
- **Files modified:** 7 (2 source + 4 masters + 1 LQIP) + 9 evidence crops

## Accomplishments
- **Regrade (BOLD-01):** the master now reproduces the approved mockup's warm+bright look — amber/gold core, cool-blue arms, pink H-alpha nebulae, lifted mids, no grey-blue wash — baked into the master via sharp (no runtime CSS filters). Four coupled moves: desat 0.35→0.80, `.tint(#93a7cf)` dropped, midtone x0.80 darken → midtone LIFT (gamma 0.78, power curve anchored on --sky-zenith), column vignette 0.88→0.
- **Recompose (BOLD-02):** crop anchor coreAt [0.84,0.58]→[0.6,0.44] moves the core off the dead right edge to lead center-right with real sky/arm on both sides (frame grew 987x420→1053x448). Object-position ladder recomputed for every tier; the v3.0 mobile quiet-crop (10% 70%) is gone — mobile now shows the full-height core band, not a dead navy gradient.
- **Banding (BOLD-01 risk):** the lifted-mids regrade re-passed the banding gate on the FIRST try — selftest green (clean PASS / banded FAIL), all four masters green (runsAboveZero=1, zeroGaps=0, 64/64 bins). GRAIN_AMP stayed 1.5; no re-tune needed.

## Task Commits

1. **Task 1: Regrade the master pipeline** — `57dbd74` (feat) — build-sky.mjs grade constants + compose stages + crop anchor
2. **Task 2: Recompose — object-position ladder + regenerate masters** — `0cb9fc3` (feat) — NightSky.astro ladder + 4 masters + LQIP
3. **Task 3: Banding gate + before/after evidence** — `2ff72f5` (test) — evidence crops (gate proven green)

**Plan metadata:** (this SUMMARY + STATE + ROADMAP) — final docs commit

_Note: build-sky.mjs is a single file spanning the T1 grade and the T2 crop-anchor recompose (both are pipeline constants); it landed in the T1 commit. The regenerated masters landed in T2 (their final grade+crop state), so masters are not double-committed._

## Files Created/Modified
- `scripts/build-sky.mjs` — GRADE_SATURATION 0.35→0.80; GRADE_TINT_ENABLED=false (tint dropped); MIDTONE_SCALE darken → MIDTONE_GAMMA 0.78 lift (new `buildLiftLuts`/`liftMidtones` helpers, zenith-anchored power curve); VIGNETTE_ALPHA 0.88→0 (composite skipped when ≤0); candidate A coreAt [0.84,0.58]→[0.6,0.44]. Integrity/geometry-solver/seam/encode ladder untouched.
- `src/components/NightSky.astro` — object-position ladder: base(1024-1799) 72% 38%→10% 40%; @≥1800 78% 34%→3% 40%; @640-1023 55% 32%→50% 45%; @<640 10% 70%→50% 50%.
- `public/sky/milky-way-{2560,1920}.{avif,webp}`, `milky-way-lqip.txt` — regenerated from the warm/bright core-led pipeline.
- `.planning/phases/11-bolder-sky/evidence/` — before/after master-full, core-crop, mid-frame + desktop-1440 + mobile-375 rendered windows.

## Decisions Made
- **Dropped the tint rather than warming it:** removing `.tint(#93a7cf)` and relying on reduced-desat core color + the zenith-anchored black point gives warm-core/cool-arm/clean-cool-shadow for free; a global warm tint would have warmed the arms too (wrong).
- **Zenith-anchored power-curve LIFT over sharp `.gamma()`:** sharp's `.gamma()` re-anchors to 0 and would lift the dark floor (5,7,10) up to ~18 (grey, banding-prone); a per-channel LUT anchored at Z pins the floor and lifts only mids/highs.
- **Vignette removed, not just reduced:** the mockup shows no column darkening, glass is the scrim now, and contrast is 11-03's gate to hold via the card — so alpha 0 (composite skipped).
- **coreAt central-right (0.6,0.44):** a low object-position then keeps the dark quiet left edge under the left-anchored glass card while the core leads on the right — matching mockup A (background-position ~74% 42%).

## Deviations from Plan

None — plan executed exactly as written. All three tasks completed with the grade/crop values left to Claude's documented discretion (11-CONTEXT.md), reproducing the mockup target. No auto-fixes were required; the banding gate passed on the first regenerated masters, so no grain re-tune loop was needed.

## Issues Encountered
- The sharp-based preview helper couldn't resolve `sharp` from the scratchpad dir (node_modules is project-local). Resolved by running the helper from the project root as a temporary `_preview-tmp.mjs`, used only to render object-fit:cover windows for tuning, then deleted before any commit (never staged — no new file/dep introduced).

## Floors honored
- No push (origin/main asserted behind local — 6 commits ahead, nothing pushed; Phase 12 owns the gated deploy).
- No new deps (sharp already present); `package.json` + `.planning/config.json` untouched.
- Raw NOIRLab TIFF stayed gitignored (`sky-source/`), integrity gate (16359276 bytes / 4000x2000 srgb) intact and unmodified.
- Grade literals live in build-sky.mjs only; zero new hex added to NightSky.astro / any CSS (the only `#93a7cf` occurrences are the pre-existing constant referenced in comments).
- The regenerated phase-07 spike-banding previews are at an archived path and left untracked (out of scope; pre-existing preview mechanism).

## Next Phase Readiness
- **11-02** builds on this brighter master: liquid-glass card + camper cut + warm ambient glow + overlay re-tune (constellations/moon/aurora over the busier, brighter photo).
- **11-03** must re-bless `verify-visibility.mjs` to the new stills and re-run the contrast gate (≥4.5 both viewports) — the brighter sky under text is the key risk; the card fill escalates if any surface dips (never re-darken the sky). Moon/aurora comparators re-target to the new brighter MW-core peak. Banding is already re-proven here.
- No blockers. The regrade hit "warm + bright + amber core + cool arms + no banding" within tuning; no muddy/banded master shipped.

## Self-Check: PASSED

- All created/modified files verified present on disk (build-sky.mjs, NightSky.astro, 4 masters, LQIP, SUMMARY, before/after evidence crops).
- All three task commits verified in git log (`57dbd74`, `0cb9fc3`, `2ff72f5`).
- Banding gate re-confirmed green (`--selftest` + all four masters).
- Origin/main asserted behind local; nothing pushed.

---
*Phase: 11-bolder-sky*
*Completed: 2026-07-20*
