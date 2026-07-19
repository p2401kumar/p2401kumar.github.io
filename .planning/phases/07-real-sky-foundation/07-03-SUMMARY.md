---
phase: 07-real-sky-foundation
plan: 03
subsystem: sky-photo-integration
tags: [avif, lcp-preload, picture-srcset, object-fit-cover, canvas-overlay-surgery, wcag-contrast, cdp, column-vignette]
requires:
  - phase: 07-01
    provides: "banding-free sky masters (public/sky/) + build-sky.mjs pipeline + verify-banding.mjs gate"
  - phase: 07-02
    provides: "Verdict: PASS canonical line (Task-0 wave gate) + Phase-8 glass budget context"
provides:
  - "Real Milky-Way photo full-viewport behind everything: .sky-photo <picture> (AVIF/WebP srcset + LQIP background) as first child of .nightsky-host, LCP-preloaded via BaseLayout head slot, no-JS-safe, zero-CLS (IMG-01, IMG-02)"
  - "Transparent Layer 0: procedural sky wash/dither/starfield-bake/Milky-Way composite removed; moon is the sole canvas bake; Mid+Bright twinkle metadata margin-confined (IMG-05)"
  - "Constellation legibility upgrade: radii 3.0/4.5px + resting 1.3x halo (alpha 0.15) over real star noise"
  - "Photo-aware verify-contrast.mjs: analytic object-fit:cover drawImage composite as bottom sampling layer; --moon comparator reads the photo's galactic-core peak"
  - "Widened baked column vignette (build-sky.mjs 0.234043/0.042553) sized to the max 1.6:1-tier column+ramp edge — contrast >= 4.5:1 at BOTH check widths"
affects: [07-04 gate battery, phase-8 glass, phase-9 ambient]
tech-stack:
  added: []
  patterns:
    - "Preload imagesrcset/imagesizes byte-for-byte mirrors the picture avif source srcset/sizes (single-fetch invariant, 07-RESEARCH.md pitfall 2)"
    - "Bottom-of-stack delivery by DOM order, never new z-index values"
    - "Baked-master geometry constants derive from the MAX viewport-fraction across all contrast-check tiers, not a single reference tier"
key-files:
  created:
    - .planning/phases/07-real-sky-foundation/integration-evidence/ (6 screenshots)
  modified:
    - src/components/NightSky.astro
    - src/layouts/BaseLayout.astro
    - src/pages/index.astro
    - src/lib/nightsky/starfield.ts
    - src/lib/nightsky/constellations.ts
    - scripts/verify-contrast.mjs
    - scripts/build-sky.mjs
    - public/sky/milky-way-{1920,2560}.{avif,webp} + milky-way-lqip.txt (re-baked)
    - .planning/phases/07-real-sky-foundation/07-SPIKE-BANDING.md (07-03 revision note)
decisions:
  - "Column vignette half-width = max column viewport-fraction across the 1.6:1 check tiers (440px @1280 binding), ramp 80px @1280, sized EXACTLY to the column+ramp edge so the galactic core keeps margin-side brightness (mwPeak moved < 1%)"
  - "scene.ts untouched — seedTwinkles proved metadata-agnostic exactly as planned; twinkle margin confinement lives in starfield.ts candidate generation"
  - "07-04 re-verifies IMG-01..05 at the LCP checkpoint; this plan marks IMG-01/02/05 delivered per its frontmatter"
metrics:
  duration: "~2 sessions (initial execution + gate-failure continuation), ~2h task time"
  completed: 2026-07-19
status: complete
---

# Phase 7 Plan 03: Real-Sky Integration Summary

**One-liner:** The real NOIRLab Milky-Way photo now renders full-viewport behind everything (LCP-preloaded AVIF/WebP picture, no-JS-safe, zero-CLS) with the authored overlay surviving on a transparent Layer 0 — and after a 1280×800 product-gate failure (4.06:1) forced an authorized cross-plan widening of the baked column vignette, photo-aware contrast now passes at both check widths (4.58 / 12.22 vs the 4.5 floor).

## What was built

### Task 0 — Spike-2 wave gate (no commit; mechanical check)
`07-SPIKE-GLASS.md` carries exactly one canonical `Verdict: PASS` line — integration unblocked.

### Task 1 — Photo delivery (commit d5e6e1a)
- **BaseLayout.astro**: named `head` slot after the two font preloads; only index injects into it.
- **index.astro**: `rel=preload as=image` for `/sky/milky-way-1920.avif` with `imagesrcset`/`imagesizes` byte-for-byte mirroring the picture's avif source (single fetch).
- **NightSky.astro**: `.sky-photo` as FIRST child of `.nightsky-host` (bottom by DOM order, zero new z-index): AVIF + WebP `<source>` + eager `fetchpriority=high` img; LQIP data URI read at build time as wrapper background over `var(--bg)` (failed-load degrade); no-JS-safe 400ms CSS keyframe fade ending at opacity 1; reduced-motion instant; object-position ladder 10% 70% / 55% 32% / 72% 38% / 78% 34%.

### Task 2 — Overlay surgery + constellation legibility (commit 12efe91)
- **starfield.ts**: sky-wash gradient, ground fill, dither pass, Faintest/Dim star bake, and the entire procedural Milky-Way composite REMOVED — Layer 0 is transparent except the crescent moon (sole remaining bake). Twinkle candidates are Mid+Bright metadata only, hard-confined to the margins outside the content column (mirrors `contentColumnEdges` + 8px cushion); SKY-05 governor alpha-cap halves retired. Layer-0 work units ~2013 → 92; generation median 307.6ms → 206.4ms. `requestAnimationFrame` counts hold: scene=2, starfield=0.
- **constellations.ts**: radii 2.75/4 → 3.0/4.5; resting halo alpha 0.15 at 1.3× (tweened haloScale; brightened stays 1.5×/0.25; dimmed none).
- **scene.ts**: unchanged, exactly as the plan predicted.

### Task 3 — Photo-aware verify-contrast.mjs (commit 3f0df88)
- `coverSourceRect()` (object-fit:cover + object-position) with selftest fixture (posX round-trip 0.72 ± 0.01 at the 1440 tier).
- `samplePageOnce` composites the photo first (canvas source-over via its own alpha, then scrim + DOM chain unchanged); hard-fails if the photo is not decoded.
- `--moon` sample B retargeted to the PHOTO's galactic-core box peak; moonPeak composited over the photo (raw non-premultiplied RGB would overread).
- Header documents the intentional no-blur boundary (Phase 8 owns the screenshot-sampling gate).

### Gate failure → authorized cross-plan fix (commit 27c7bc7, this continuation)
The per-commit honesty gate then **failed**: `--cdp` at 1280×800 reported worst-case **4.06:1** (< 4.5 floor) at a stable pixel vx=207, vy=368 — the left column-edge ramp strip. Root cause (prior executor's diagnosis, verified): the baked column vignette mapped the SKY-05 governor geometry only through the **1440 reference tier** (half-frac 0.219385 = 464px @1440 but just 413px @1280), while the content column is fixed CSS px (half = min(880, W−64)/2 = **440px at both widths**) — so at 1280 the column edge sat in the bright ramp. 1440×900 passed (5.24 worst); `--moon` passed both widths.

With orchestrator authorization (build-sky.mjs + masters are Phase-7-owned 07-01 artifacts), the vignette was widened to the **max column viewport-fraction across the 1.6:1 check tiers**: half = max(440/1280, 440/1440) = 0.34375 window-frac → **0.234043** master-frac; ramp = 80/1280 = 0.0625 window-frac → **0.042553** — sized exactly to the max-tier column+ramp edge (outer window-frac 0.90625) and no further, preserving the galactic core's margin-side brightness (same dim-under-column / vivid-margin parity the procedural governor had). Full derivation documented at `VIGNETTE_HALF_FRAC` in build-sky.mjs; 07-SPIKE-BANDING.md updated so its authoritative recipe/size/detector tables match the committed masters. All 4 masters + LQIP re-baked from the SHA-verified raw TIFF (16,359,276 bytes, `c49e4711…33cb965`). This is floor-preservation, not a design change — the SKY-05 4.5:1 floor is untouched.

## Final gate table (all PASS)

| Gate | Result |
|---|---|
| verify-banding --selftest | PASS (clean passes / banded control fails) |
| verify-banding, 4 masters × 2 regions | PASS — every region runs=1 gaps=0 (1920 tiers improved from runs=2 gaps=1) |
| astro check | 0 errors, 0 warnings, 0 hints |
| npm run build | green; all 4 masters in dist/sky/ |
| verify-contrast --selftest | PASS (incl. coverSourceRect fixtures) |
| --cdp 1280×800 worst vs --ink | **4.58:1** (was 4.06 FAIL) — per-panel: hero 4.58 · systems 6.96 · experience 6.96 · patents 4.58 · skills 4.58 · contact 6.96 · fig-01 n/a (no over-sky text) |
| --cdp 1440×900 worst vs --ink | **12.22:1** (was 5.24 — headroom gained) — per-panel: hero 12.22 · systems 12.41 · experience 12.22 · patents 13.94 · skills 14.39 · contact 14.39 |
| --moon 1280×800 | PASS: moonPeak 0.2123 < mwPeak 0.4695 (prior mwPeak 0.4716 — −0.4%, immaterial) |
| --moon 1440×900 | PASS: moonPeak 0.1857 < mwPeak 0.4748 (prior 0.4781 — −0.7%, immaterial) |
| Single-rAF counts | scene=2 · starfield=0 · meteors=0 · fig01=2 |
| No deck/fig01 imports in scene modules | clean |
| Zero hex outside tokens.css (CSS surfaces) | clean |
| package.json / package-lock / .planning/config.json | untouched; raw TIFF stays gitignored |

## Screenshot index (`integration-evidence/`)

| File | What it evidences |
|---|---|
| 07-03-1440x900-dpr1.png | Reference tier: photo behind deck, column dimmed, core vivid right margin |
| 07-03-1280x800-dpr1.png | Binding contrast tier post-fix: column fully darkened at 440px half |
| 07-03-1440x900-dpr2.png | DPR2 via `--force-device-scale-factor=2` (2848×1610) — no upscale artifacting |
| 07-03-375x667-mobile.png | True 375w (CDP metrics override): quiet lower-left composition, 10% 70% anchor |
| 07-03-1440x900-reduced-motion.png | Static frame under prefers-reduced-motion, photo + moon present |
| 07-03-1440x900-nojs-classic.png | No-JS classic mode: photo present at opacity 1 (CSS-only fade floor) |

## Deviations from Plan

### Carried over from the initial execution (credit: prior 07-03 executor)

**1. [Rule 2] Mobile object-position 10% 70% instead of UI-SPEC's 12% 25%** — the committed winner master carries band glow in its upper-left; its quiet window is the lower-left (per 07-SPIKE-BANDING.md's mobile note). Files: NightSky.astro. Commit d5e6e1a. Re-verified this continuation via the true-375w screenshot.

**2. [Rule 1] verify-contrast readiness probe retargeted to the moon box** — the pre-photo probe asserted an opaque canvas-center pixel, which is transparent forever post-surgery (would time out). Commit 3f0df88.

**3. [Rule 1] drawImage source coords are bitmap-space, naturalWidth is density-corrected** — for srcset w-descriptor images the 9-arg source rect misreads; switched to whole-image 5-arg dest-space mapping. Commit 3f0df88.

**4. [Rule 2] Sampler hard-fails when the photo is not decoded** — silently falling back to --bg would weaken the honesty gate. Commit 3f0df88.

**5. [Rule 1] --moon moonPeak composites canvas pixels over the photo** — raw non-premultiplied canvas RGB would overread a 0.45-alpha crescent as near-white. Commit 3f0df88.

### This continuation

**6. [Orchestrator-authorized cross-plan fix] Widened baked column vignette in scripts/build-sky.mjs (a 07-01 artifact) + master re-bake** — the 1280×800 product-gate failure above. Constants 0.219385/0.037825 → 0.234043/0.042553 with derivation comment; spike doc tables updated to match. Full banding gate re-passed; both contrast tiers + both moon gates re-passed; 1440 improved 5.24 → 12.22. Commit 27c7bc7.

## Authentication gates

None.

## Known Stubs

None — the photo, overlay, and verifier paths are fully wired; no placeholder values flow to the UI.

## Threat Flags

None — no new network endpoints, auth paths, or trust-boundary changes. T-07-04 (silent contrast regression) is mitigated per-commit by the photo-aware --cdp runs recorded above; T-07-05 (srcset mismatch double-fetch) held by the byte-for-byte mirror (07-04's Lighthouse audit re-confirms); T-07-SC held (zero installs, package.json untouched).

## Notes for 07-04

- Record these numbers in the gate battery: contrast 4.58 @1280 / 12.22 @1440; moon 0.2123<0.4695 @1280, 0.1857<0.4748 @1440.
- The LQIP img opacity fade is CSS-keyframe only; if the LCP checkpoint busts budget, the documented fallback is dropping the fade (07-RESEARCH.md §4.2), not gating on JS.
- Twinkle count at 1440×900 to be measured (~40 target from the ~91-candidate margin pool; TWINKLE_SUBSET_FRACTION is the one-line adjustment if sparse).
- 07-02's PASS carried no mitigation ladder (plain PASS) — nothing extra for Phase 8 beyond the blur 12px/16px budget.

## Self-Check: PASSED

All key files verified on disk (SUMMARY, 6 screenshots, re-baked masters, build-sky.mjs) and all four task/fix commits present in git history (d5e6e1a, 12efe91, 3f0df88, 27c7bc7).
