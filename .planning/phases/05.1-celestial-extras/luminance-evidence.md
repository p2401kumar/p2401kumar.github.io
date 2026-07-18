# SKY-07 Moon Dimness Evidence (Plan 05.1-01, Task 1 — FLAG 1)

**Claim verified:** the procedural waning-crescent moon baked into Layer 0 is dim by
construction — its peak composited luminance stays STRICTLY below the Milky Way core's
peak at both check widths, preserving the zero-light-pollution premise (05.1-CONTEXT.md).

**Date:** 2026-07-17 · build: production `dist/` on the local preview
(`npm run build && npx astro preview`), full scene active (deck + scene + scrim + moon).

## Method

`node scripts/verify-contrast.mjs --moon --width W --height H` — headless Chrome via CDP
(zero deps, node built-in WebSocket), navigates the local preview, waits for Layer 0 to
paint + a 2.5 s settle (the moon is the FINAL chunked work unit), then reads the live
canvas via `getImageData` and computes the MAX WCAG relative luminance in each box:

| Box | Definition (CSS px, from `window.innerWidth/innerHeight`) |
|---|---|
| Moon bbox | `[moonX − 1.1R, moonY − 1.1R] … [moonX + 1.1R, moonY + 1.1R]` — geometry recomputed in-page with the SAME formulas as `starfield.ts drawMoon` (pad `clamp(18, w·0.04, 32)`; `columnLeft = w/2 − min(880, w−2·pad)/2`; `R = clamp(12, 0.018·min(w,h), 22)`; `moonX = 0.30·columnLeft`; `moonY = 0.68·h`) |
| Milky-Way core box | `x: 0.80–0.98 · w`, `y: 0.30–0.60 · h` of the viewport |

Assertion: `moonPeak < mwPeak` (strict). Exit non-zero on failure. The comparison logic
is self-tested by the `--selftest` moon fixture (synthetic dim-crescent vs saturated-MW
ImageData pair — fixture #8).

## Results — PASS at both viewports

| Requested viewport | Inner viewport | moonX / moonY / R | moonPeak | mwPeak | Verdict |
|---|---|---|---|---|---|
| 1440×900 | 1424×805 | 81.6 / 547.4 / 14.49 | **0.1949** | **0.9071** | **PASS** (moonPeak 21% of mwPeak) |
| 1280×800 | 1264×705 | 57.6 / 479.4 / 12.69 | **0.1949** | **0.5139** | **PASS** (moonPeak 38% of mwPeak) |

- Moon peak pixel both runs: `rgb(118, 122, 134)` — the crescent's brightest composited
  pixel (`--star` at `LIT_ALPHA 0.45` over the sky wash), identical across viewports as
  expected (fixed alpha, fixed tokens).
- mwPeak varies run-to-run (random star scatter + `'lighter'` dust accumulation inside
  the core box — 05-06 recorded ungoverned MW dust saturating toward full white); every
  observed value sits far above moonPeak. Worst observed margin in any run this session:
  moonPeak 0.1949 vs mwPeak 0.3761 (1440) / 0.4338 (1280) — still a ≥1.9× separation.
- `LIT_ALPHA` stays at the spec default **0.45** (range 0.40–0.50, hard ceiling 0.55) —
  no tuning was needed.

## Reproduce

```
npm run build
npx astro preview --port 4321
node scripts/verify-contrast.mjs --moon --width 1440 --height 900
node scripts/verify-contrast.mjs --moon --width 1280 --height 800
node scripts/verify-contrast.mjs --selftest   # includes the moon comparator fixture
```

**Verdict: PASS — SKY-07's dimness contract is proven numerically at both check widths.
FLAG 1 resolved.**
