---
phase: 07-real-sky-foundation
plan: 01
subsystem: sky-imagery-pipeline
tags: [sharp, avif, webp, banding, astrophotography, noirlab, spike]
requires: []
provides:
  - "public/sky/ masters (milky-way-{2560,1920}.{avif,webp} + milky-way-lqip.txt) proven banding-free for 07-03 integration"
  - "scripts/verify-banding.mjs histogram gate (joins the repo gate battery)"
  - "07-SPIKE-BANDING.md authoritative crop/encode recipe"
affects: [07-03 integration, 07-02 glass spike (photo asset available for harness)]
tech-stack:
  added: []
  patterns:
    - "core-anchored frame geometry solver (place anchor at target frame fraction, rotate, auto-fit to distortion-safe zone)"
    - "measured-floor linear black-point grading to token targets"
    - "deterministic seeded grain post-resize as anti-banding dither"
key-files:
  created:
    - scripts/build-sky.mjs
    - scripts/verify-banding.mjs
    - public/sky/milky-way-2560.avif
    - public/sky/milky-way-1920.avif
    - public/sky/milky-way-2560.webp
    - public/sky/milky-way-1920.webp
    - public/sky/milky-way-lqip.txt
    - .planning/phases/07-real-sky-foundation/07-SPIKE-BANDING.md
  modified:
    - .gitignore
decisions:
  - "Winner crop A-core-t20: core anchor (2050,1040), 20deg clockwise rotation, core at frame fraction (0.84,0.58) — true galactic core lands in the UI-SPEC core zone (window x~0.90) with a quiet left margin"
  - "Source is galactic-coordinates (band horizontal): the literal 24deg-from-vertical diagonal needs ~66deg rotation = 3.1x upscale; locked the research-validated 20deg shallow diagonal instead (plan's own rotate ~20-24deg recipe)"
  - "UI-SPEC S<=15% saturation bound treated as documented deviation: the target tokens themselves are S 33-37% HSL; graded to hue 218deg / S~31% matching the token family"
  - "Vignette geometry mapped through object-fit:cover at the reference tier (not naive export-width scaling) so the baked column matches the on-screen governor geometry"
  - "Task 3 eyeball checkpoint auto-resolved under /gsd-autonomous with committed encode + histogram evidence"
metrics:
  duration: ~35 min
  completed: 2026-07-19
status: complete
---

# Phase 7 Plan 01: Spike 1 — Banding Pipeline Summary

**One-liner:** NOIRLab noirlab2430b 4K TIFF composited via a core-anchored sharp pipeline (20° rotation, zenith-anchored grade, governor-parity vignette, 0.72/0.94 seam) into five committed banding-free masters — 10-bit AVIF 81/58.5 KB + WebP 389/227 KB + 167-char LQIP — gated by a selftesting histogram comb-spike detector.

## What was built

### Task 1 — `scripts/build-sky.mjs` (commit 5b9c3e5)
- `/sky-source/` gitignored FIRST; `git check-ignore` verified before download; raw 15.6MB TIFF never staged.
- Download + integrity gate: byte length must equal **16,359,276** (T-07-01), metadata asserted 4000×2000/8-bit/srgb. SHA-256 recorded: `c49e4711…33cb965`.
- Core-anchored geometry solver: places the galactic-core anchor at a target frame fraction, rotates clockwise (direction verified empirically against sharp output), auto-fits the largest 2.35:1 frame whose distortion-check corners stay inside safe rows y=550–1450 (bottom corner pair relaxed to the 0.90 frame line — those pixels sit behind the ≥92%-opaque seam).
- Grade: desat ×0.35 → blue-slate tint `#93a7cf` → measured-floor (global p0.5) linear map to `--sky-zenith` → midtone ×0.80 pull-down anchored on zenith.
- SKY-05 governor-parity column vignette (α 0.88 toward `#05070a`, cover-mapped geometry), seam ramp 0.72→0.94→1.0 to `--bg`, `.toColorspace('srgb')`, deterministic ±1.5 grain post-resize, AVIF 10-bit 4:4:4 q58 e6 + WebP q72 + 32w LQIP.
- 3 candidates (A-core-t20 / B-core-t28 / C-rift-t18) with committed evidence previews; `--winner` override for reproducible candidate encodes.

### Task 2 — `scripts/verify-banding.mjs` + winner lock (commit 69e569e)
- Rec.709 luminance histogram + comb-spike score (`runsAboveZero`/`zeroGaps`) exactly per 07-RESEARCH.md §2.1; FAIL if runs>3 OR gaps≥2; region-isolated scan (top dark sky + seam ramp), never the whole busy frame.
- `--selftest`: clean control (zenith→horizon gradient + noise + 10-bit AVIF) **runs=1 gaps=0 PASS**; banded control (posterize 24 + JPEG q35) **runs=4 gaps=3 FAIL** — matches the research's validated discrimination. Exits non-zero on regression; joins the gate battery.
- All 3 candidates pass the gate → winner chosen on composition (A). Final masters re-built from A and re-scanned: worst region runs=2 gaps=1 → all PASS.

### Task 3 — eyeball checkpoint (auto-resolved)
Committed evidence in `spike-banding/`: WINNER renders at 1440×900 + 1280×800 (exact reference-tier cover window), DPR2 crops of both darkest gradient regions, deliberately-banded control for side-by-side, selftest fixtures. SPIKE-BANDING.md carries the auto-resolution note; async veto available (rerun build-sky.mjs to swap).

## Verification results

| Gate | Result |
|---|---|
| `verify-banding.mjs --selftest` | PASS (clean passes, banded control fails) |
| Committed AVIF+WebP detector scan | PASS ×4 files ×2 regions (worst: runs=2, gaps=1) |
| `/sky-source/` gitignored, nothing staged | PASS |
| `git diff --exit-code -- package.json package-lock.json` | PASS (no new dependency; sharp@0.35.3 pre-existing) |
| Black point (5,7,10)±4 | PASS — p0.5 = (3,5,10) |
| Near-horizon ≤ (20,26,44) | PASS — p95 (18,22,31) |
| Hue 200–230° | PASS — median 218° |
| Moon-vs-core luminance headroom | PASS — core peak 192 vs moon ~115 |

## Deviations from Plan

### Auto-fixed / documented

**1. [Rule 1 – Geometry] Fixed-height frame formula replaced with auto-fit solver**
- **Found during:** Task 1 first run — frame corner escaped the safe zone (closed-form max only holds for strip-centered frames).
- **Fix:** iterative auto-fit shrinking the frame until all distortion-check corners fit; bottom corners checked at the 0.90 frame line (seam-hidden).
- **Commit:** 5b9c3e5

**2. [Rule 1 – Grading] Dark-floor measurement moved from corner patch to global p0.5**
- **Found during:** Task 1 round 2 — the fixed top-left patch caught band glow (p02 = 41,56,79), over-stretching the black map and crushing dark-rift pixels below the ±4 zenith tolerance.
- **Fix:** floor measured as the global 0.5th percentile over the non-seam frame; final black point (3,5,10) in tolerance.
- **Commit:** 5b9c3e5

**3. [Documented deviation] Band diagonal is 20° from horizontal, not 24° from vertical**
- The source is in galactic coordinates (band horizontal); the literal UI-SPEC diagonal needs ~66° rotation → frame collapses to ~820×349 (3.1× upscale, unacceptable softness; 10K source out of download scope). The plan's own recipe says `rotate() ~20-24deg`, which is what the research validated end-to-end. Recorded in 07-SPIKE-BANDING.md with the full geometry argument.

**4. [Documented deviation] Bulk saturation 31% HSL vs UI-SPEC ≤15%**
- The grading targets themselves (`--sky-zenith`, `--sky-horizon`) are S 33–37.5% in HSL terms — ≤15% is unreachable while staying in the token family. Hue discipline held (218° median, no green/red patches). Recorded with evidence.

**5. [Rule 2 – Integration note] Mobile object-position assumption flagged**
- UI-SPEC's `<640px` tier (`12% 25%`) points at band glow in this master; the genuinely quiet region is lower-left. Recommended `~10% 70%` for 07-03. Not fixed here (markup is 07-03 scope) — flagged in SPIKE-BANDING.md so it isn't inherited silently.

## Known limitations (not stubs)

- Native winner frame is 987×420 → 2560w export is ~2.6× upscaled. Fine for a dark ambient backdrop (DPR2 evidence crops clean); escalation path (10K TIFF, same recipe ×2.5) documented in SPIKE-BANDING.md.
- The committed masters bake the reference-tier vignette; other breakpoint tiers rely on 07-03's object-position ladder as planned.

## Threat model outcome

- T-07-01 (tampering): mitigated — byte-length assert in build-sky.mjs, URL + size + SHA-256 recorded in SPIKE-BANDING.md.
- T-07-SC (supply chain): held — zero installs; package.json/package-lock.json byte-identical at every commit.

## Self-Check: PASSED

- All 8 key files exist on disk (verified via `test -f`).
- Commits 5b9c3e5 and 69e569e exist in history.
- `node scripts/verify-banding.mjs --selftest` exit 0; full master scan exit 0.
