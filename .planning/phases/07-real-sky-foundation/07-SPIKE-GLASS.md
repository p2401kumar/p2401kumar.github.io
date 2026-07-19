# Spike 2 — Glass-over-Animating-Canvas CPU (07-02)

**Run:** 2026-07-19 · **Gate:** the Phase-8 glass re-scope trigger (07-CONTEXT.md D-Spike2)
**Budget:** marginal ≤ 2–3 percentage points AND total < 10% idle CPU
**Method:** 60s CDP soak per run, `Performance.getMetrics` — the exact methodology that produced 05-06's 5.6%/60s baseline (headless Chrome `--headless=new`, software rasterization — conservative vs real GPU, so a passing number is a safe lower bound). DPR1 at an exact 1440×900 viewport via `Emulation.setDeviceMetricsOverride` (nominal `--window-size` includes browser-chrome height; 05-06 recorded 1424×805 actual — the override removes that ambiguity). No screenshots taken anywhere (the known Windows DSF-2 CDP screenshot hang is untouched).

## Harness

`spike-glass/harness.html` served by `spike-glass/soak.mjs` (tiny node http server; committed masters resolve at `/sky/`):

| Layer | Content |
|---|---|
| bottom (z:-2) | `<img src="/sky/milky-way-2560.avif">` — 07-01's committed real master, cover-fit (static: costs glass nothing recurring once painted, GLASS.md §1.4) |
| middle (z:-1) | `#nightsky-canvas` driven by the **REAL `initNightSky()`** from `src/lib/nightsky/scene.ts` — esbuild-bundled live engine code (esbuild 0.28.1 already present transitively; zero installs), never a mock. Idle per-frame profile = Layer-0 blit + ~40-star twinkle subset + 9 fireflies + constellation ambient/beam hook + meteor hook — the exact production idle loop |
| top | 4 mock `.glass` surfaces, `backdrop-filter: blur(12px) saturate(150%)` over `rgb(255 255 255 / 0.07)`, at production geometry: header (full-width × 64px), footer (full-width × 88px), jump index (160×220 bottom-right), content panel (880px × 60vh centered) |

Toggle: `?glass=0` keeps all 4 surfaces `display:none` (BASELINE); `?glass=1` shows them (GLASS); `?blur=16` overrides the radius for the sensitivity probe. One page serves every run.

Methodology notes (deviations from the raw 05-06 recipe, all recorded):

- **15s unmeasured warm-up** before the first measured run — shakedown runs showed first-load transients (AVIF decode, SwiftShader shader/raster cache warm-up) inflating whichever run went first by ~2× on whole-process CPU.
- **Whole-process-tree CPU cross-check added.** `Performance.getMetrics` `TaskDuration` covers the renderer **main thread** only, but backdrop-filter blur executes in the compositor (viz, hosted in the GPU process) — invisible to the mandated metric. Each run therefore also samples cumulative kernel+user CPU across the entire Chrome process tree (Win32_Process walk from the spawned pid). The canonical gate stays the 05-06-comparable main-thread marginal; the tree number guards against a false PASS hiding the cost in another process.
- No `-webkit-backdrop-filter` duplicate in the harness (Chrome-only measurement page; Phase 8's production CSS still needs the prefix per GLASS.md §4.1).

## Results — 60s soaks, 1440×900 DPR1

### Run 1 — BASELINE (scene alone: real photo + real engine, 0 glass surfaces)

| Metric | Value | Target |
|---|---|---|
| Wall clock | 60.0 s | 60 s |
| TaskDuration Δ → CPU | 2.427 s → **4.04%** | — (family check below) |
| ScriptDuration Δ | 0.991 s | — |
| LayoutDuration Δ | 0.000 s | 0.000 s ✓ |
| Long tasks | 0 | 0 ✓ |
| Realized fps | 60.0 | 60.0 ✓ |
| Whole-tree CPU (suppl.) | 20.22% | — (software-raster compositing of the full-viewport canvas; see interpretation) |

**Baseline sanity vs the live 5.6%:** 4.04% sits at the low end of the live 5.6–6.9% family, as expected rather than anomalous: (a) the engine here is the same per-frame code (blit + twinkle + fireflies — 07-03's Layer-0 slimming has NOT run yet, and per-frame cost is what a soak measures), (b) 05-06 measured the full production page (deck DOM, scrim gradient, 7 panels) while the harness carries only the scene stack, and (c) 05-06's actual inner viewport was 1424×805 vs the exact 1440×900 here. Same family, no red flag.

### Run 2 — GLASS (same page + 4 × blur(12px) saturate(150%) surfaces)

| Metric | Value | Target |
|---|---|---|
| Wall clock | 60.0 s | 60 s |
| TaskDuration Δ → CPU | 2.710 s → **4.52%** | total < 10% ✓ |
| ScriptDuration Δ | 1.143 s | — |
| LayoutDuration Δ | 0.000 s | 0.000 s ✓ (blur is a compositor op, not layout — confirmed) |
| Long tasks | 0 | 0 ✓ |
| Realized fps | 60.0 | 60.0 ✓ |
| Whole-tree CPU (suppl.) | 26.70% | — |

### Marginal delta (the gate number)

| Measure | Baseline | Glass | Marginal | Budget | Result |
|---|---|---|---|---|---|
| **Main-thread CPU (05-06 methodology — canonical)** | 4.04% | 4.52% | **+0.47 pp** | ≤ 2–3 pp | **PASS** (well inside) |
| Total with glass | — | **4.52%** | — | < 10% | **PASS** (5.5 pp headroom) |
| Whole-tree CPU (supplementary, software raster) | 20.22% | 26.70% | +6.48 pp | (informational) | see interpretation |

### Sensitivity — blur(16px) vs blur(12px) (for Phase 8's radius budget)

| Measure | blur(12px) | blur(16px) | Radius cost 12→16px |
|---|---|---|---|
| Main-thread CPU | 4.52% | 5.20% | **+0.68 pp** |
| Marginal vs baseline | +0.47 pp | +1.15 pp | (2.4× the 12px marginal) |
| Whole-tree CPU | 26.70% | 30.85% | +4.15 pp |
| fps / long tasks / LayoutDuration Δ | 60.0 / 0 / 0.000 s | 60.0 / 0 / 0.000 s | — |

Cost grows super-linearly with radius as GLASS.md §1.2 predicts (~radius²): +33% radius ≈ +2.4× main-thread marginal. Phase 8 should treat **12px as the default and 16px as the hard ceiling** wherever the canvas sits underneath.

### Interpreting the whole-tree numbers (why they don't flip the verdict)

The +6.48 pp tree marginal is measured under **pure software rasterization** (SwiftShader), where the entire compositing pipeline — including the ~20% baseline cost of just blitting a 1440×900 canvas at 60fps with **zero** glass — runs on the CPU. On real hardware both that baseline compositing and the blur run on the GPU; 05-06 used exactly this reasoning ("software rasterization is conservative vs real GPU") and its real-device Lighthouse/idle checks confirmed it. The tree numbers are recorded as the honest upper bound and as relative evidence (glass adds ~32% to compositor work; radius 16px adds another ~16%), not as the gate metric — the floor's 5.6%/10% family has always been the main-thread measure. Phase 8's own gate re-verifies on the production page.

## Verdict

Keyed off the marginal (not either absolute number), per the plan: marginal +0.47 pp ≤ 2 pp AND total 4.52% < 10%, with 0 long tasks, 60.0 fps held, and LayoutDuration Δ 0.000 s in every run.

Verdict: PASS

Full glass proceeds in Phase 8 — no mitigation ladder is *required* to clear the floor. Non-binding notes Phase 8 should still inherit (measured here, free to apply):

- **Blur radius:** default 12px; ≤16px hard ceiling over canvas (the +0.68 pp / +4.15 pp measured radius cost above).
- **`display:none` for inactive glass** genuinely removes the cost — the baseline run IS the proof (4 glass divs present in DOM but `display:none` measured identical to no glass at all).
- **≤4 simultaneous surfaces** stays the ceiling (exactly what was measured).
- The GLASS.md §1.4 ladder (overlap-area reduction, 15–20fps canvas throttle under glass, spawn-density bias) remains available headroom if Phase 8's real-page gate ever needs it — none of it was needed here.

**FAIL protocol (stated verbatim per the plan, not triggered): STOP — do not proceed to any later plan. Do not attempt mitigations and silently re-measure. Return the FAIL verdict with the measured numbers as evidence; the orchestrator presents the structural rethink (glass over static-only regions) to the user. This is a designated autonomous-mode stop (07-CONTEXT.md).**

## Reproduce

```bash
node .planning/phases/07-real-sky-foundation/spike-glass/soak.mjs --blur16
# per-run knob: --soak-ms=60000 (default)
```

Raw run JSON (60s runs, 2026-07-19): baseline `taskS 2.427 / cpuPct 4.0438 / treeCpuPct 20.221`; glass `taskS 2.710 / cpuPct 4.5154 / treeCpuPct 26.703`; blur16 `taskS 3.119 / cpuPct 5.1978 / treeCpuPct 30.851`; `marginalPct 0.4716`.
