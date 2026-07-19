# Spike 1 Verdict — Banding Pipeline (07-01)

**Date:** 2026-07-19
**Verdict: PASS** — the committed encode recipe produces no detectable banding (histogram comb-spike gate) and no visible banding in the eyeball evidence. The recipe below is **authoritative**: `scripts/build-sky.mjs` bakes exactly these constants; re-running it reproduces the committed masters byte-for-byte-equivalent output.

> **07-03 revision (2026-07-19):** the column vignette was widened after the 07-03 integration contrast gate failed at 1280×800 (worst text pixel 4.06:1 < 4.5 — the original half-width mapped only the 1440 reference tier, reaching 413px of full darkening at 1280 where the fixed 440px column half needs full coverage). New geometry: half-width **0.234043** master-frac (= max column fraction across the 1.6:1 check tiers, 440px @1280), ramp **0.042553** (= 80px @1280), sized exactly to the max-tier column+ramp edge (outer window-frac 0.90625) so the galactic core keeps its margin-side brightness (mwPeak moved only 0.4716→0.4695 @1280, 0.4781→0.4748 @1440). Derivation at `VIGNETTE_HALF_FRAC` in build-sky.mjs. The tables below are updated to the re-baked masters; every other recipe constant is unchanged.

## Source integrity (T-07-01)

| Field | Value |
|---|---|
| URL | `https://noirlab.edu/public/media/archives/images/publicationtiff/noirlab2430b.tif` (301 → storage.noirlab.edu) |
| Byte size | **16,359,276** (asserted by build-sky.mjs before any pixel is used) |
| SHA-256 | `c49e471107fbccd3cea2bcbb67f19caa2d263c8de3b5dc75b0f1c839b33cb965` |
| Metadata | 4000×2000, 8-bit, sRGB TIFF, equirectangular 360°×180°, **galactic coordinates** (band horizontal along map equator, core bulge at x≈2050) |

## Winning recipe — candidate A (`A-core-t20`)

| Stage | Value |
|---|---|
| Core anchor (source px) | (2050, 1040) — the galactic-core bulge located by the research brightness scan |
| Rotation | **20° clockwise** (descending "\" diagonal; `background:#0f1216`) |
| Core frame placement | frame fraction (0.84, 0.58) → reference-tier window x≈0.90 (inside the UI-SPEC core zone x:0.80–0.98) |
| Frame (native) | **987×420** (2.35:1 letterbox), extract bbox [1183,753 1080×741], all distortion-check corners inside safe rows y=550–1450 (bottom pair relaxed to the 0.90 frame line — hidden behind ≥92%-opaque seam) |
| Grade | saturation ×0.35 → tint `#93a7cf` → per-channel linear map (measured p0.5 dark floor [10,13,19] → `--sky-zenith` (5,7,10)) → midtone pull-down ×0.80 anchored on zenith |
| Column vignette | SKY-05 governor geometry through the cover map: center 0.5702 of width, half-width **0.2340**, smoothstep ramp **0.0426** (= 440px column half + 80px ramp at 1280×800 — the binding 1.6:1 check tier; 495px + 90px at 1440×900; object-position 72%), darken α=0.88 toward `#05070a` (texture ×0.12 — governor parity). *07-03 widening; originally 0.2194/0.0378 (1440-reference-only mapping)* |
| Seam ramp | vertical smoothstep to `#0f1216`: pure photo 0–0.72, ramp 0.72–0.94, solid 0.94–1.0 |
| Normalize | `.toColorspace('srgb')` before every encode (ICC pitfall 4) |
| Grain | deterministic ±1.5/channel (mulberry32, seeded per width), applied **after** resize, before encode |
| Encode | AVIF `{quality:58, bitdepth:10, chromaSubsampling:'4:4:4', effort:6}` · WebP `{quality:72}` · LQIP 32w WebP q40 |

### Committed master sizes

| File | Bytes | KB |
|---|---|---|
| `public/sky/milky-way-2560.avif` | 79,329 | 77.5 |
| `public/sky/milky-way-1920.avif` | 57,026 | 55.7 |
| `public/sky/milky-way-2560.webp` | 394,950 | 385.7 |
| `public/sky/milky-way-1920.webp` | 230,566 | 225.2 |
| `public/sky/milky-way-lqip.txt` | 98 raw / 155-char data URI | — |

*(07-03 re-bake — slightly smaller than the 07-01 originals: the wider vignette increases the dark area.)*

All inside the research byte budget (250–450KB at 1920w); AVIF far under it.

## Detector results (verify-banding.mjs)

**Gate:** FAIL if `runsAboveZero > 3` OR `zeroGaps >= 2` in the darkest-quartile populated range, scanned over two genuinely-smooth dark sub-regions (top dark sky x0.02–0.45/y0.02–0.18; seam ramp x0.05–0.55/y0.74–0.92) — never the whole busy frame.

### Selftest (fixture guard — joins the repo gate battery)

| Control | runsAboveZero | zeroGaps | Result |
|---|---|---|---|
| Clean (zenith→horizon gradient + noise ±1.5 + 10-bit AVIF q60 e7) | 1 | 0 | **PASS** (required) |
| Banded (posterized 24-level + 8-bit JPEG q35, no grain) | 4 | 3 | **FAIL** (required) |

### Committed masters (winner A) — all PASS

| File | top-dark-sky | seam-ramp |
|---|---|---|
| milky-way-2560.avif | runs=1 gaps=0 (61/61 bins) | runs=1 gaps=0 (64/64) |
| milky-way-1920.avif | runs=1 gaps=0 (62/62) | runs=1 gaps=0 (64/64) |
| milky-way-2560.webp | runs=1 gaps=0 (61/61) | runs=1 gaps=0 (64/64) |
| milky-way-1920.webp | runs=1 gaps=0 (60/60) | runs=1 gaps=0 (64/64) |

*(07-03 re-bake — improved over the 07-01 originals, whose 1920 tiers scanned runs=2 gaps=1 on top-dark-sky; the widened vignette's new dark-gradient area introduced no comb-spike fracture.)*

### Runner-up candidates (same encode ladder, scanned via `--winner` override)

| Candidate | Frame | Detector (worst region) | Composition notes |
|---|---|---|---|
| **A-core-t20 (WINNER)** | 987×420 | runs=2 gaps=1 → PASS | Dust-lane core lands window x≈0.83–1.0 (core zone ✓); quiet dark-starfield left margin; richest texture; largest native frame of the core candidates |
| B-core-t28 | 792×337 | runs=1 gaps=0 → PASS | Steeper diagonal (closer to UI-SPEC's 24°-from-vertical intent) but 20% less native resolution → softer at 2560w; left margin busier |
| C-rift-t18 | 1100×468 | runs=1 gaps=0 → PASS | Best native resolution, elegant/quiet — but right-margin feature is a star cloud, not the galactic core; weakest match to "core in the right margin" |

All three pass the banding gate — the decision was compositional: A is the only candidate that puts the true galactic-core bulge in the UI-SPEC core zone with a calm left margin.

## Tone-contract measurements (committed 2560 AVIF)

| Check | Measured | Contract | Result |
|---|---|---|---|
| Black point (p0.5 dark region) | (3,5,10); p02 (4,6,10) | `--sky-zenith` (5,7,10) ±4/channel | **PASS** |
| Near-horizon non-band (x0.05–0.5, y0.75–0.85) | mean (9,12,16), p95 (18,22,31) | ≤ `--sky-horizon` (20,26,44) ceiling | **PASS** |
| Bulk background hue | median 218° | 200–230° blue-slate family | **PASS** |
| Bulk background saturation | median 31% HSL-S | UI-SPEC says ≤15% | **Documented deviation** — see below |
| Brightest core pixel | lum 192 at (2477,520) | must exceed moon composite (~115) so the moon reads dimmer | **PASS** (headroom 77) |

**Saturation note:** the ≤15% HSL-S bound is internally inconsistent with the UI-SPEC's own grading targets — `--sky-zenith #05070a` is S=33% and `--sky-horizon #141a2c` is S=37.5% in HSL terms (dark colors have deceptively high HSL-S). Grading the sky to S≤15% would make it *grayer than the tokens it must blend into*, visibly clashing at the seam and against the canvas ground fill. The measured 31% matches the token family's own saturation at the token family's own hue (218°), with no green/red anomaly patches (the desat ×0.35 pass removed the source's warm-core/airglow color). Intent honored; literal number impossible.

## Geometry reality note (for 07-03 integration)

- The source is in **galactic coordinates** — the Milky Way band is horizontal in the map. The UI-SPEC's literal "24° from vertical" diagonal would require ~66° rotation, which collapses the inscribed frame to ≈820×349 (a 3.1× upscale at 2560w — unacceptable softness from the 4K tier, and the 10K tier is out of download scope). The locked 20° rotation reproduces the research-validated look: band enters upper-middle, sweeps down-right to the core in the right margin. This matches the plan's own recipe (`rotate() ~20-24deg`) and the research's end-to-end validation.
- **Mobile object-position note:** the UI-SPEC's `<640px` tier (`12% 25%`) assumes the master's upper-left is quiet — in this master the upper-left carries band glow. The darkest window of the committed master is the **lower-left** (seam-faded) region; recommend `~10% 70%` for the narrow tier when 07-03 tunes the ladder. Flagged here so integration doesn't inherit a stale assumption.
- Native frame is 987×420 → the 2560w export is ~2.6× upscaled. Acceptable for a dark ambient backdrop (soft nebulous content + grain + AVIF; the DPR2 evidence crops show no artifacting), but if a future milestone wants crisper stars at DPR2, the documented escalation path is the 10K TIFF (95,723,018 bytes) with the same recipe constants scaled ×2.5.

## Evidence (committed, `spike-banding/`)

- `WINNER-render-1440x900.png` / `WINNER-render-1280x800.png` — the committed 2560 AVIF through the exact reference-tier cover window (object-position 72%; both check viewports are 1.6:1 so they share one window)
- `WINNER-dpr2-top-dark.png` / `WINNER-dpr2-seam-ramp.png` — 2× native crops of the two darkest gradient regions (what a DPR2 panel displays)
- `CONTROL-banded-1440x900.jpg` — deliberately-banded re-encode of the winner render (posterize 24 + JPEG q35) for side-by-side comparison
- `selftest-clean.png` / `selftest-banded.png` — the synthetic detector fixtures
- `{A,B,C}-*-master.jpg` / `{A,B,C}-*-window-1440.jpg` — per-candidate graded masters + reference-tier windows

## Checkpoint resolution (plan Task 3)

Checkpoint auto-resolved under /gsd-autonomous with committed encode + histogram evidence (async user veto available; masters swap trivially — rerun build-sky.mjs). The OBJECTIVE gate held hard: `verify-banding.mjs --selftest` passes (clean PASS / banded control FAIL) and all four committed masters pass the detector; the eyeball evidence above shows a smooth dithered gradient in the darkest regions versus obvious posterized blotches in the control.
