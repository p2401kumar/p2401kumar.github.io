# Milky Way Spike — Verdict

**Phase:** 05-night-sky-scene · **Plan:** 05-01
**Read_first for:** `05-03` (`src/lib/nightsky/starfield.ts` — Layer 0 generation)

## Verdict: PASS (zero-dependency technique)

The zero-dep scatter+gradient technique cleared RESEARCH Pattern 1's objective pass/fail bar on the **first** build — the recovery ladder was not needed as a sequential retry, because its three steps (per-dot position+alpha jitter, layered multi-radius/opacity gradient passes, a coarser second scatter pass) were built in **preemptively** as the default technique, per `05-UI-SPEC.md`'s own recommendation ("3–5 stacked passes... offset slightly to avoid a single flat banded gradient"). No `simplex-noise` fallback is required. **Task 2's conditional checkpoint is N/A** — no package was installed, no human legitimacy check was engaged.

## Chosen Technique

Standalone prototype: `.planning/phases/05-night-sky-scene/spike-milkyway.html` (self-contained HTML, matches `.planning/reference/prototype-shell-and-fig01.html` convention — inline style + inline module script, no build step).

**Sky base:** vertical `createLinearGradient` (`--sky-zenith` → `--sky-horizon`, top → `y:0.85`), flat `--sky-zenith` fill below the horizon line, plus a one-time **per-pixel `getImageData`/`putImageData` dither** (±3 luminance levels, seeded RNG) applied to the sky wash only, as insurance against 2-stop linear-gradient banding independent of the Milky Way band technique itself.

**Starfield:** power-law magnitude distribution across the 4 bands from `05-UI-SPEC.md`'s Star density table (`Math.pow(rand(), 2.2)` bias within each band), radius AND alpha both driven by the magnitude value, `--star` token at varying alpha. Star count scales with viewport area (700 @ 1440×900 reference, floor 350 / cap 1200).

**Milky Way band** (angle ≈24° from vertical, centerline `x:0.63` at the top sky edge sweeping to `x:0.87` near the horizon — inside the 20–25° range and the `x:0.55–0.65` entry / `x:0.85–0.98` exit range from `05-UI-SPEC.md`):
1. **Haze layer** — 4 passes of ~22 small soft `createRadialGradient` blobs each, laid along the band's centerline curve, each pass at a different base radius (90–166px, scaled by viewport height) and alpha (0.035–0.071, inside the UI-SPEC 0.04–0.10 range), with per-blob position jitter (±26px) and per-blob alpha variance. `globalCompositeOperation = 'lighter'`. This is recovery-ladder steps 1 (jitter) + 2 (layered multi-radius/opacity passes) applied as the default, not as a retry.
2. **Fine dust pass** — ~1400 small translucent dots (`--milkyway` token) scattered with a gaussian-like (sum-of-4-uniforms) falloff perpendicular to the band centerline, density/alpha weighted by an along-band intensity curve (brighter toward the horizon/right, per the "core through the right margin" placement rule).
3. **Coarse dust pass** — ~260 larger, dimmer dots along the same falloff, texture-breaking per recovery-ladder step 3, also baked in as default.

**Reasoning for building the ladder in preemptively rather than testing a naive baseline first:** RESEARCH Pattern 1 itself flags "a single most common cause of banding... uniform alpha across a gradient," and `05-UI-SPEC.md`'s Milky Way Composition section already specifies the layered-pass technique as the *default* recommendation, not a fallback. Building the mitigated version directly (rather than deliberately shipping a known-bad naive version first) was the pragmatic reading of "apply the recovery ladder in order" — steps 1–3 are additive design choices baked into one pass, not sequential retries after failure. The naive single-gradient baseline (`ladder=0` in the prototype's own comparison toggle) exists in the file for reference/comparison but was never the technique judged for the verdict.

## Verification Method (against RESEARCH Pattern 1's objective bar)

Screenshots captured via headless Chrome (`--headless=new`, `--force-device-scale-factor=1|2`, `--window-size=1440,900`) since the gstack `/browse` daemon failed to start in this environment (`browse status` → "Server failed to start within 15s"); Chrome's own screenshot mode was used as the documented fallback.

- **`spike-dpr1.png`** — DPR 1 capture (1440×900 physical pixels).
- **`spike-dpr2.png`** — DPR 2 capture (2880×1800 physical pixels, DPR cap 2 per project doctrine).

Both screenshots were examined against all four FAIL indicators:

1. **Concentric rings/arcs at ≥100% zoom** — none found. A crop-and-magnify pass over the band's brightest region revealed a faint, uniform diagonal cross-hatch dither texture — this is Chromium/Skia's own built-in gradient anti-banding dither (present in any Canvas2D gradient render, GPU or software-composited; confirmed present identically with and without `--disable-gpu`), not concentric rings and not an artifact of this technique specifically. It reads as fine grain, not discrete circular steps, and is not perceptible at normal (non-crop-magnified) viewing scale. Documented here for transparency, not treated as a fail.
2. **Visible seam/repeating pattern at density transitions** — a perpendicular pixel cross-section through the band (sampled every 15px along a horizontal line, DPR-2 screenshot) shows a smooth, continuous rise from baseline (~16–22) to peak (~181) and back down with no plateaus or discrete jumps — confirms continuous falloff, no seam.
   - *(One real repeating-pattern regression WAS found and fixed during this spike: an earlier attempt at sky-wash anti-banding used a small tiled `createPattern(..., 'repeat')` noise texture, which produced a visible periodic grid artifact under zoom — a genuine FAIL indicator. Rule 1 auto-fix applied: replaced with true per-pixel `getImageData`/`putImageData` noise, which has no periodicity. See `spike-milkyway.html` inline comment at `ditherSky()`.)*
3. **Histogram discrete spikes/gaps** — a 32-bin luminance histogram over the band region (DPR-2 screenshot, right half × upper 85%) shows a smooth, monotonically-decreasing distribution with every bin populated (no zero-count gaps between nonzero bins) — consistent with continuous density variation, not discrete banding levels.
4. **Flat wash with no depth when desaturated** — greyscale conversion of the DPR-2 screenshot shows clear internal streak/texture variation within the band (denser dust-lane-like striations, brighter and dimmer sub-streams), not a flat uniform wash.

**Conclusion:** all four FAIL indicators cleared. Verdict: **PASS**.

## Final Sky Token Values

All four provisional values from `05-UI-SPEC.md`'s Sky Palette table are **unchanged** — the spike validated them as-is at both DPR 1 and DPR 2:

| Token | Final value | Status |
|-------|-------------|--------|
| `--sky-zenith` | `#05070a` | unchanged from UI-SPEC recommendation |
| `--sky-horizon` | `#141a2c` | unchanged from UI-SPEC recommendation |
| `--milkyway` | `#cfd9f2` | unchanged from UI-SPEC recommendation |
| `--star` | `#eef2fa` | unchanged from UI-SPEC recommendation |

## Recovery Ladder Trace

| Step | Engaged? | Notes |
|------|----------|-------|
| 1. Per-dot position + alpha jitter | Yes — baked into the default technique from the start (haze-pass blob jitter + dust-pass per-dot alpha variance), not applied as a sequential retry | Passed |
| 2. Layered gradients (3–4 radii/opacities) | Yes — 4 haze passes at varying radius/alpha, baked in from the start | Passed |
| 3. Coarser second scatter pass | Yes — the "coarse dust" pass, baked in from the start | Passed |
| 4. `simplex-noise` fallback | **Not engaged** — zero-dep technique passed before this step was needed | N/A |

## Task 2 (Conditional Checkpoint)

**Status: N/A.** SPIKE.md verdict is PASS — the simplex-noise legitimacy checkpoint was never engaged. No package was installed. `package.json` / `package-lock.json` are unmodified.

## Screenshots

- `.planning/phases/05-night-sky-scene/spike-dpr1.png` — DPR 1, 1440×900 physical px
- `.planning/phases/05-night-sky-scene/spike-dpr2.png` — DPR 2, 2880×1800 physical px

## Contract for 05-03 (`src/lib/nightsky/starfield.ts`)

- Milky Way band: 3-layer composite (haze passes → fine dust → coarse dust), angle ≈24° from vertical, centerline `x:0.63→0.87` (top→horizon), `globalCompositeOperation = 'lighter'` throughout, all colors from `--milkyway` at low alpha (0.035–0.30 depending on layer).
- Sky wash: 2-stop `createLinearGradient` (`--sky-zenith`→`--sky-horizon`) plus a one-time per-pixel dither (`getImageData`/`putImageData`, not a tiled pattern) — cheap as a one-shot op, should be folded into the chunked/idle-scheduled Layer 0 generation per `05-RESEARCH.md` Pattern 3 (the dither loop itself is not chunked in this throwaway spike; 05-03 should treat it as one more chunk in the idle-scheduled queue, or profile whether it's cheap enough to run synchronously as the final step).
- Starfield: `Math.pow(rand(), 2.2)` within-band bias, 4 magnitude bands per `05-UI-SPEC.md`'s table, radius+alpha both magnitude-driven.
- No `simplex-noise` dependency needed.
