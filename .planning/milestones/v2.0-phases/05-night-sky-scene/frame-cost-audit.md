# SKY-03 Frame-Cost Audit (Plan 05-06, Task 2)

**Claim audited:** the ambient scene's per-frame work is bounded and cheap enough that
idle CPU stays under the SKY-03 floor (<10% sustained; formal 5-minute live confirmation
deferred to Phase 6 per 05-CONTEXT.md if local tooling can't measure — local tooling
COULD measure, see the live soak below).

**Date:** 2026-07-17 · build: production `dist/` on the local preview, deck + scene + scrim active.

## Per-frame element/draw-call count (from code, worst case)

The single rAF tick (`scene.ts drawFrame`) does exactly this and nothing else:

| Layer | Work per frame | Count (1440×900 reference) | Bounded worst case |
|---|---|---|---|
| Layer 0 blit | `clearRect` + one `drawImage` of the pre-rendered bitmap | 2 calls | 2 (never regenerated per frame) |
| Layer 2a twinkle | 1 sin + 1 arc fill per twinkling star | ~16 arcs (91 Mid/Bright twinkle-eligible × ~36% outside the governed column × ½ stride subset) | ≤ ~55 arcs (star count caps at 1200; Mid+Bright 13%; widest useful margins) |
| Layer 2b fireflies | 1 two-stop radial gradient + 2 arc fills each | 9 × 3 = 27 draws | 27 (count locked at 9 of the ≤15 ceiling) |
| Layer 2c constellations | per cluster: 1 batched path stroke (4–6 hairline links) + 6 star arc fills; radial halo gradients ONLY on the one brightened cluster | 4 strokes + 24 fills (+ ≤6 small halos when a panel maps) | 34 draws |
| Firing beam | ≤ ONE at a time (setTimeout-scheduled every 6–10 s, never per-frame dice): 1 gradient stroke + 1 head arc, `'lighter'` | 0 most frames; 2 draws while traveling | 2 |
| Advance math | 4 constellations × 4-channel alpha lerp + ≤1 beam position | O(20) lerps | O(20) |

**Total: ~70 draws/frame typical at reference, ≤ ~120 bounded worst case** — all simple
arcs, hairline strokes, and small radial gradients. No `shadowBlur`, no `filter: blur()`,
no per-frame `getImageData`, no per-frame layout/DOM work (`LayoutDuration` delta over the
60 s soak = 0.000 s). This is the same primitive cost class as `fig01/render.ts` (the
already-shipped, Lighthouse-100, 60 fps-approved engine), which draws a comparable batch
per frame. Layer 0 (700-star field + Milky Way, the expensive part) is pre-rendered once
per size to a detached canvas and only ever blitted; the offscreen generation context is
unreachable from any per-frame path.

Single-rAF invariant held (grep-verified this plan): `requestAnimationFrame` count = 2 in
`scene.ts` (recursive tick + initial call), 0 in every other nightsky module, and
`fig01/render.ts` untouched at 2. The pause machine stops the loop (not dampens) on
tab-hidden / fig-01-active / reduced-motion, so idle cost off the home hero is zero.

## Live idle soak (obtained locally — method explicitly noted)

Headless Chrome (new headless, software rasterization — conservative vs real GPU) via the
DevTools Protocol `Performance.getMetrics`, hero panel, ambient scene running, no input,
**60-second soak** (scratchpad `idle-soak.mjs`; a shorter-than-5-min soak, extrapolated —
the per-frame work is constant by construction, so sustained behavior is linear):

| Metric | Value |
|---|---|
| Soak wall-clock | 59.99 s |
| Renderer TaskDuration delta | 3.36 s → **5.6% CPU** |
| ScriptDuration delta | 1.15 s (1.9%) |
| LayoutDuration delta | 0.00 s |
| Long tasks (PerformanceObserver `longtask`) | **0** |
| Frames observed | 3600 → **60.0 fps** |

5.6% < the 10% SKY-03 floor, with zero long tasks and no frame drops over the full
minute. Extrapolation to 5 minutes is sound because every frame does the identical
bounded work above (no accumulation, no growth — fireflies/twinkle/beam state is
fixed-size). Note the 5.6% includes the injected rAF frame-counter and headless
software rasterization overhead; a real-GPU browser session should sit lower.

## Lighthouse TBT (corroborating)

Total Blocking Time with deck + scene + scrim active, local preview: **0 ms mobile,
0 ms desktop** (see `lighthouse-scores.md`). Layer-0 generation is chunked through
`requestIdleCallback`/`setTimeout` slices, so even initial generation never blocks.

## Conclusion

Bounded per-frame cost (~70 draws of proven-cheap primitives, hard-capped by
construction), 0 ms TBT, 60 fps sustained, 0 long tasks, and a measured 5.6% idle CPU
over a 60 s local soak → **SKY-03's idle-cost floor is met locally with margin**. The
formal on-device 5-minute confirmation remains a Phase 6 live-verification item per
05-CONTEXT.md, with this audit as the recorded local evidence.
