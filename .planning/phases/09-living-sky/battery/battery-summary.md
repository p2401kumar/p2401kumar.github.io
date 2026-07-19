# 09-03 Closing Battery — Full Evidence Record

All gates run against the built preview (`npm run preview` serving `dist/`), 2026-07-19.
Every number below is reproducible from the committed drivers: `../ambient-soak/ambient-soak.mjs` (soak) and `capture-battery.mjs` (CDP captures/probes).

## 1. Ambient soak (60s per run, 1440×900 DPR1, headless=new software raster, glass LIVE both runs)

| run | glass surfaces | wall (s) | TaskDur Δ (s) | CPU % | ScriptDur Δ (s) | LayoutDur Δ (s) | long tasks | fps | tree CPU % |
|---|---|---|---|---|---|---|---|---|---|
| baseline: reduced-motion (ambient off, glass live) | 4 | 60.0 | 0.737 | **1.23** | 0.077 | 0.000 | 0 | 60.0 | 5.27 |
| ambient: no-preference (ambient + glass live) | 4 | 60.0 | 3.296 | **5.49** | 1.621 | 0.000 | 0 | 60.0 | 35.32 |

- **TOTAL with all four ambient systems + glass: 5.49% < 10% floor — PASS with 4.51pp headroom.** 60.0fps, 0 long tasks, LayoutDuration 0.000s in both runs.
- **Plan-designed MARGINAL (ambient − RM baseline): +4.26pp** — this is the cost of the ENTIRE animated scene (pre-existing twinkles/fireflies/beams/meteors + the four new ambient systems) vs one static frame, because the reduced-motion baseline stops the whole single-rAF loop, not just Phase 9's additions.
- **Projection-comparable marginal (the 0.3–0.7pp basis):** the 0.3–0.7pp projection was measured against 08-03's glass-live total of **6.10%** (full pre-ambient scene animating). The full living sky measures **5.49% → −0.61pp vs that reference** — statistically zero within the documented ±0.4–0.7pp scene-noise family. The four new ambient systems' marginal is **≈0, at/below the projection**. Whole-tree cross-check agrees: 36.67% (08 glass-live) → 35.32% (09 ambient) = −1.35pp, no compositor blowout.
- **Shed ladder NOT triggered at desktop 1440** — the page fits the floor with everything live at tier 0.
- Baseline census: RM static frame carries aurora + clouds (probe alphas 172/236) — the drain-repaint fix live (see §8).

## 2. Contrast screenshot gate (the arbiter) — BOTH viewports, everything live

| Viewport | Result | failing[] | Notable worsts (vs --ink) |
|---|---|---|---|
| 1440×900 | **PASS** (exit 0) | empty on every surface | experience 15.06 · patents 15.55 · skills 15.57 · header 6.23 · hero 13.55 |
| 1280×800 | **PASS** (exit 0) | empty on every surface | (full record in contrast-cdp-1280x800.txt) |

Tall scroll-swept panels (experience/patents/skills, Pitfall 2) inspected: `failing[]` empty at both widths.

## 3. Aurora luminance gate + moon regression + selftests

| Gate | 1440×900 | 1280×800 |
|---|---|---|
| `--aurora` (24 samples / 21.6s ≥ breathing period) | **PASS**: max auroraPeak 0.1035 < mwPeak 0.4748 | **PASS**: 0.0384 < 0.4695 |
| `--moon` (aurora live over the moon) | **PASS**: moonPeak 0.2212 < 0.4748 | **PASS**: 0.2580 < 0.4695 |
| `--selftest` | **PASS** | — |
| `verify-banding --selftest` | **PASS** (clean passes, banded control fails) | — |
| `AURORA_ALPHA_CEILING = 0.20` static grep | **PASS** (≥1) | — |

## 4. Banding — live gradient crops (new capture path)

Crops taken from the reduced-motion still (clouds at PEAK alpha = worst case), left margin at 1440×900; comb-spike detector run on the crops:

| Crop | top-dark-sky | seam-ramp |
|---|---|---|
| cloud band (0–280px, y 576–765) | runs=1 gaps=0 → **PASS** | runs=1 gaps=0 → **PASS** |
| aurora band (0–280px, y 441–765) | runs=1 gaps=0 → **PASS** | runs=1 gaps=0 → **PASS** |

## 5. Lighthouse (npx lighthouse 13.4.0, local preview, both presets)

| Preset | Perf | A11y | Best-Prac | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| mobile | **99** | **100** | **100** | **100** | 1.9s | 0ms | 0.003 |
| desktop | **100** | **100** | **100** | **100** | 0.5s | 0ms | 0 |

Identical to the 07-04/08-03 family — ambient added no JS weight of note (TBT 0ms held).

## 6. Structural invariants (greps, full record in grep-invariants.txt)

| Invariant | Result |
|---|---|
| single-rAF: scene.ts | **2** ✔ |
| single-rAF: clouds/aurora/parallax | **0** ✔ |
| single-rAF: idle-queue / meteors / starfield | **0** ✔ (idle-queue has exactly **1 code** `setTimeout` — the verbatim Safari shim, 09-01 precedent; the grep count of 3 includes 2 doc comments) |
| single-rAF: fig01/render.ts | **2** ✔ |
| deck imports in all 8 scene modules | **0** ✔ |
| hex literals in scene modules (incl. tokens.ts) | **0** ✔ (`--aurora #bfe8df` lives in tokens.css only — the one sanctioned Phase 9 hue token) |
| `'lighter'` compositing in clouds/aurora | **0** ✔ (source-over only) |
| package.json / package-lock.json / .planning/config.json | untouched (git diff empty) ✔ |

## 7. Pause machine + canvas-transform proofs (capture-report.json)

| Proof | Result |
|---|---|
| Reduced-motion still: two full screenshots 2s apart | **byte-identical** (273,878 bytes) |
| Hidden-tab: canvas hash pair 2s apart | **identical** (len 193430, hash equal) |
| fig-01-active: canvas hash pair 2s apart | **identical** (len 189670, hash equal) — canvas-hash instrument used for hidden/fig01 because the camper-glow CSS pulse legitimately animates outside reduced motion; the pause machine's contract is the canvas |
| Canvas transform at rest (1440 + 1280) | `#nightsky-canvas` **none** / `.nightsky-host` **none** ✔ |
| Canvas transform mid-parallax-nudge (1440 + 1280, sampled ~160ms into the 420ms window) | canvas **none** / host **none** while `.camper` = matrix(−11.09px) @1440, matrix(−18.00px) @1280 ✔ |

## 8. Reduced-motion "beautiful still" (marquee: reduced-motion-still-1440x900.png)

Byte-identical pair (zero motion) containing photo + moon + constellations + **clouds** + **aurora**:

- aurora left margin (y 0.50–0.60H): mean alpha **12.94**, coverage(≥4) **50%** — curtains present at fixed mid-breath
- clouds left margin (y 0.72–0.84H): coverage(≥4) **72%**, max 16 — both layers at peak margin alpha
- clouds **content-column band** (x 0.25–0.75, y 0.72–0.84H): **max alpha 5, coverage(≥2) 19%** — **09-02 carried note (a) CLOSED**: the column band read max 0 in 09-02's capture; the Rule-2 drain-repaint fix (clouds request a static repaint when the idle-queued sprite drain lands while no loop runs) makes the RM still complete for visitors who load with reduced-motion already set.

## 9. Mobile shed ladder (T-09-08; capture-report.json + shed-ladder-375w.png)

Instrument: far-only strip (right margin x 0.82–0.98, y 0.645–0.685H — no aurora/moon/MW by construction, only far clouds + ~1–3% star noise), haze coverage(≥2), under emulated reduced motion (deterministic aurora). `navigator.deviceMemory` overridden via prototype getter; synthetic resize forces tier re-adoption.

| State | Far-strip coverage(≥2) | Near band | Aurora | Verdict |
|---|---|---|---|---|
| tier 0 (dm=32, 1440w) | **0.213** (far live) | 0.82 | mean 12.94 | baseline |
| tier 1 (dm=4, 1440w) | **0.029** (−0.18 → far SHED) | 0.72 ✔ intact | mean 12.94 ✔ intact | **PASS** |
| tier 3 (dm=2, 1440w) | **0.029** (far stays shed) | 0.72 ✔ | (throttle 9 + chroma drop wired in scene.ts, grep-verified — no static-screenshot signature by design) | **PASS** |
| width-only tier 3 (375×812 mobile, dm=32 real) | far signal sub-quantization at this width (margins ~18px, column ×0.15 → ≤3/255) — rides the tier variable proven above | coverage(≥4) **0.15** — Near alone still reads as clouds ✔ | gracefully absent (margin 18px < 48px floor) ✔ | **PASS** |
| parallax at 375w tier 3 | `.camper` = matrix(−10.91px) mid-window, canvas transform **none** | | | **NEVER SHEDS ✔** |

Heuristic (documented in `computeAmbientTier`, scene.ts): tier≥1 `w<640 OR dm≤4`; tier≥2 `w<480 OR dm≤2`; tier≥3 `w<390 OR (dm≤2 AND tier 2)`; deviceMemory feature-detected, Safari/iOS falls back width-only.

## 10. Leak gate (leak-gate.txt)

Both `/work/*` pages + `/404`: **0** `nightsky` refs, **0** `/sky/` refs, **0** `<script src>` tags. The single built chunk containing the ambient code (`NightSky.astro_astro_type_script_index_0_lang.*.js`) is referenced by `index.html` only (positive control = 1). **Airtight.**

## Verdict

**ALL GATES PASS.** AMB-05 proven: single rAF + pause machine cover all four ambient systems (capture-pair identical under all three pause conditions), the mobile ladder sheds in the locked order with parallax intact, reduced motion renders exactly one complete static frame, and the whole living sky + glass idles at 5.49% — inside the 10% floor with 4.51pp to spare.
