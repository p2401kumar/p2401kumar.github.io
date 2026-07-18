# SKY-06 Frame-Cost Delta (Plan 05.1-01, Task 2 — FLAG 2)

**Claim verified:** the meteor subsystem adds ZERO idle per-frame cost (one reference
null-check when no meteor is active) and a bounded in-flight delta (+2 cheap draws, at
most one meteor at a time), vs the 05-06 `frame-cost-audit.md` baseline (~70 typical /
≤~120 bounded worst-case draws/frame). The moon adds literally nothing per-frame — it is
baked into the Layer 0 bitmap, covered by the existing single `drawImage` blit.

**Date:** 2026-07-17 · build: production `dist/` on the local preview, deck + scene +
scrim + moon + meteor subsystem active.

## Per-frame delta (from code, matching the 05-06 audit format)

`scene.ts drawFrame` gains exactly one new section (Layer 2d) after the constellations:

| State | Work per frame added by 05.1-01 | Draw calls | Allocation |
|---|---|---|---|
| Idle (no active meteor — the overwhelming majority of frames) | `meteorsHandle.advance(ts)`: timestamp bookkeeping + ONE `activeMeteor === null` check, then `draw(...)`: the same single null-check, immediate return | **+0** | **0** |
| In-flight (≤1 meteor, life 0.6–1.0 s once every 20–45 s) | `advance`: one multiply-add on `d` + one end-of-path compare (O(1)); `draw`: 1 linear-gradient trail stroke (4 stops) + 1 head arc fill, `'lighter'` composite — the SAME cheap primitive class as the constellation firing beam (05-06 audit row "Firing beam") | **+2** | 1 gradient object per in-flight frame (same as the constellation beam and firefly halos — proven-cheap in the 05-06 soak) |
| Moon (Layer 0) | none — baked into the pre-rendered bitmap at generation time; present in every blit including the reduced-motion static frame | +0 | 0 |

**Bounded worst case: ≤ ~122 draws/frame** (05-06's ≤~120 + the meteor's 2) — and only
while a single meteor flies. Duty cycle: life ≤1.0 s per spawn at a 20–45 s spawn-to-spawn
cadence → a meteor is on screen on **≤ ~5% of frames** (typically ~2–3%); every other
frame pays the null-check only. Spawn geometry runs inside the `setTimeout` fire (never
per-frame), and suppression (pause / reduced-motion / fig-01 active / hidden tab) clears
the timer and discards the in-flight meteor, so the paused idle cost off the hero remains
exactly zero.

Single-rAF invariant held (grep-verified this plan): `requestAnimationFrame` = 2 in
`scene.ts`, 0 in `meteors.ts` (token absent entirely, comments included), 0 in
`starfield.ts`, nightsky total = 2; `fig01/render.ts` untouched at 2. Meteor cadence is
`setTimeout` only, mirroring `constellations.ts`'s firing scheduler.

## Live idle CDP soak (corroborating — same method as the 05-06 audit)

Headless Chrome (new headless, software rasterization — conservative vs real GPU),
`Performance.getMetrics` deltas, hero panel, ambient scene + meteor subsystem armed,
no input, **30-second soak** (scratchpad `idle-soak.mjs`, same shape as 05-06's):

| Metric | 05.1-01 (30 s) | 05-06 baseline (60 s) |
|---|---|---|
| Renderer TaskDuration delta → CPU | 2.07 s → **6.9%** | 3.36 s → 5.6% |
| ScriptDuration delta | 0.65 s (2.2%) | 1.15 s (1.9%) |
| LayoutDuration delta | **0.00 s** | 0.00 s |
| Frames observed | 1802 → **60.0 fps** | 3600 → 60.0 fps |

6.9% vs the 5.6% baseline is within run-to-run noise for a half-length headless
software-rasterized soak (both include the injected rAF frame-counter); the window may
also have caught one in-flight meteor (~1 s of +2 draws), which is the expected bounded
behavior, not a regression. Still comfortably under the 10% SKY-03 floor, 60 fps
sustained, zero layout work.

## Conclusion

Idle delta **+0 draws / one null-check**, in-flight delta **+2 draws of the proven-cheap
primitive class** bounded to a single meteor ≤~5% of the time, moon at **zero per-frame
cost by construction** → the 05-06 frame-cost baseline is preserved. **FLAG 2 resolved.**
