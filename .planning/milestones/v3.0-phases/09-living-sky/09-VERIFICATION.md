---
phase: 09-living-sky
verified: 2026-07-19T08:55:00Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification: false
---

# Phase 9: Living Sky — Goal-Backward Verification Report

**Phase Goal:** The static sky comes alive — drifting clouds, panel-change parallax, a breathing aurora, and atmospheric scintillation — all inside a single bounded-ambient rAF budget that re-proves the <10% idle floor and sheds load gracefully on mobile, with reduced motion rendering exactly one static frame.
**Verified:** 2026-07-19 (Windows, Git Bash; checks re-run against the working tree at HEAD `6ef0ab6`)
**Status:** passed
**Re-verification:** No — initial goal-backward verification

Verification stance: SUMMARY claims were not trusted. Every cheap check was re-run in this session (greps, selftest, build, `astro check`, and a live `--aurora` gate run against a fresh preview build); expensive captures (soak, Lighthouse, CDP screenshot battery) were verified against the committed raw evidence files in `battery/`, which corroborate the summary numbers exactly.

## Success Criteria Verdicts

### SC1 — Two drifting cloud layers inside the scene tick (AMB-01) — ✓ PASSED

- **Two layers, pre-rendered sprites:** `src/lib/nightsky/clouds.ts:216-217` (`farSprite`/`nearSprite`), generated only on `applySize` via the shared idle queue (`clouds.ts:371-394`) — never per tick.
- **Wraparound blit:** `blitLayer` draws the same tile twice at wrapped integer offsets (`clouds.ts:450-468`); `drawBlob` triple-draws each blob at `x`, `x−W`, `x+W` for lossless seamless tiling (`clouds.ts:253`).
- **Token-sourced fills, zero hex:** sole fills are `tokens.milkyway` + `tokens.skyHorizon` via the SkyTokens bridge (`clouds.ts:34, 206-207, 259, 262`). Re-grep: zero hex literals in any `src/` file outside `tokens.css`.
- **Column attenuation ×0.15:** `COLUMN_ATTENUATION = 0.15` / `COLUMN_RAMP_PX = 80` (`clouds.ts:62-63`); `contentColumnEdges` mirrors deck.css (`clouds.ts:104-108`); smoothstep-shaped stencil (`clouds.ts:332-356`) applied live via `destination-in` then reset to source-over (`clouds.ts:487-490`).
- **Far-shed hook:** `setFarShed` (`clouds.ts:523-525`), honored in `render` (`clouds.ts:483`).
- **Scene wiring:** advance/draw ride the single tick as Layer 1.5 (`scene.ts:476-479`); static path at `scene.ts:589`.
- **Drift speeds per UI-SPEC:** `FAR_SPEED_PX_S = 3`, `NEAR_SPEED_PX_S = 6` (`clouds.ts:57-58`) — matches 09-UI-SPEC.md:129-130.

### SC2 — Panel-change parallax, compositor-only, instant under reduced motion (AMB-02) — ✓ PASSED

- **Event-name subscription, zero deck imports:** `parallax.ts:54` and `clouds.ts:443` subscribe the literal `'nightsky:panel-change'`; re-grep confirms no `deck` import in clouds/parallax/aurora.
- **Ground layer 18px / 420ms:** `.camper.parallax-nudge-fwd/back` animations at `NightSky.astro:305-311`; `@keyframes` 0 → ±18px `translate3d` at the 35% keyframe → 0, `cubic-bezier(0.16,1,0.3,1)` (`NightSky.astro:315-337`). Targets `.camper` classList only (`parallax.ts:45-52`).
- **Cloud mid-layer 9px offset:** `NUDGE_PEAK_PX = 9`, 60ms delay, 480ms settle, peak at 35% (`clouds.ts:71-74`), eased nudge-and-settle-to-0 that self-nulls at t≥1 (`clouds.ts:409-423`) — bounded by construction, never a persistent camera offset.
- **Reduced-motion guard:** handler returns before touching classList (`parallax.ts:44`); clouds handler zeroes the nudge (`clouds.ts:433-439`); CSS defense-in-depth `animation: none` under the media query (`NightSky.astro:344-349`).
- **Canvas never transformed:** battery §7 evidence — `#nightsky-canvas`/`.nightsky-host` computed transform `none` at rest AND mid-nudge at both viewports while `.camper` = matrix(−11.09/−18.00px) (capture-report.json; accepted as evidence, not re-run — requires the CDP battery rig).
- **Parallax not in the shed ladder:** `computeAmbientTier` body (`scene.ts:290-298`) contains zero parallax references (comment-only doctrine note above it); the ladder application (`scene.ts:646-649`) never touches parallax.

### SC3 — Breathing aurora, throttled, luminance-capped below the Milky Way band (AMB-03) — ✓ PASSED

- **3 curtains, left margin only:** `CURTAINS` (3 entries, `aurora.ts:106-110`); every x bounded in `[8, columnLeft−8]` with a 48px graceful-empty floor (`aurora.ts:75-76, 219-221`).
- **Hard cap:** `AURORA_ALPHA_CEILING = 0.20` (`aurora.ts:62`), enforced in `liveAlpha` via `Math.min(envelope, ceiling)` (`aurora.ts:202-205`); breathing envelope 0.07–0.17 (`aurora.ts:55-56`).
- **4-frame internal counter, no timers:** `shapeEveryN = 4` frame counter inside `advance()` (`aurora.ts:182-183, 275-281`); re-grep: zero `setTimeout`/`requestAnimationFrame` in aurora.ts.
- **Source-over only:** fills via `globalAlpha` + default compositing (`aurora.ts:255-269`); battery grep `'lighter'` in clouds/aurora = 0.
- **Token:** `--aurora:#bfe8df` lives in `tokens.css:50-55` with the sanctioned-exception comment; bridged at `tokens.ts:28, 48`.
- **Verifier mode:** `--aurora` mode in `scripts/verify-contrast.mjs` (routing ~:100-109, implementation :1253-1466) with the ≥21000ms full-cycle window enforced (`:1416`) and separable point-feature erosion (`:1300-1363`).
- **Re-run this session:** `--selftest` PASS (all 12 fixtures incl. moon fixture); live `--aurora` at 1440×900 against a fresh build: **PASS, max auroraPeak 0.1054 < mwPeak 0.4748** (24 samples / 21.6s) — consistent with the recorded 0.1035. Recorded 1280×800 evidence: 0.0384 < 0.4695 (`battery/aurora-1280x800.txt`).

### SC4 — Scintillation upgrade without widening the star count (AMB-04) — ✓ PASSED

- **2-oscillator waveform per spec:** primary 2000–4000ms / 0.12–0.18, secondary 400–700ms / 0.04–0.07 (`scene.ts:59-67`); summed per star in the tick (`scene.ts:485-490`).
- **Chromatic nudge on the 3 brightest only:** 3 largest-radius pool entries selected once per generation (`scene.ts:365-378`), ±8% saturation delta clamped to 0.3, same period/phase as the primary oscillator (`scene.ts:74-78, 492-499`).
- **Subset NOT widened:** `TWINKLE_SUBSET_FRACTION = 0.5` and the `target = Math.max(1, Math.round(len * fraction))` pool math are byte-identical to pre-phase `76bfce3` (verified via `git show 76bfce3:src/lib/nightsky/scene.ts`). Primary amplitude trimmed 0.15–0.25 → 0.12–0.18 to make room for the flutter term — a documented spec change keeping the combined envelope in range, not a count change.
- **Margin containment intact:** `seedTwinkles` still consumes only Layer-0 `twinkleStars` metadata (the SKY-05 column-governed pool); no containment code changed.

### SC5 — Bounded-ambient doctrine: single rAF, pause machine, shed ladder, reduced-motion still (AMB-05) — ✓ PASSED

- **Single-rAF re-grep (this session):** `scene.ts` = 2, `clouds/aurora/parallax/starfield/meteors/constellations/idle-queue` = 0 each, `fig01/render.ts` = 2. `idle-queue.ts` has exactly one code `setTimeout` — the documented Safari `requestIdleCallback` shim (`idle-queue.ts:36`, doctrine note :10-15). Pre-existing timers (constellations firing, meteors spawn, scene resize debounce, deck) are unchanged and out of scope.
- **Pause machine covers ambient:** clouds/aurora cadence lives exclusively inside `drawFrame`'s advance/draw calls (`scene.ts:466-479`) — no owned timers means `stopAnimationLoop` (`scene.ts:561-566`) stops them for free. Battery §7: byte-identical screenshot pair under reduced-motion; identical canvas-hash pairs under hidden-tab and fig-01-active.
- **Shed ladder, locked order:** `computeAmbientTier` (`scene.ts:290-298`) with the documented width/deviceMemory heuristic (doc block :266-289); applied in order at `scene.ts:646-649` — tier 1 `setFarShed`, tier 2 aurora shape throttle 4→9, tier 3 chromatic-nudge drop. Battery §9 proves tier transitions empirically (far-strip coverage 0.213 → 0.029 at tier 1; near band + aurora intact; parallax still fires at 375w tier 3 with canvas transform `none`).
- **Reduced-motion static frame is complete:** `renderStaticFrame` draws aurora at fixed mid-breath (`aurora.ts:297-305`) then clouds at offset 0 / peak alpha / nudge 0 (`clouds.ts:512-516`) via `scene.ts:588-589`. The Rule-2 drain-repaint fix: clouds invoke `requestRepaint` when an idle-queued sprite drain lands (`clouds.ts:172, 386-394`), and scene.ts gates it paused-only — `if (rafId === null) renderStaticFrame()` (`scene.ts:707-709`) — so the RM still gains its clouds without ever adding a mid-animation frame. Battery §8: RM column band max alpha 5 (was 0 pre-fix), byte-identical pair.

### SC6 — Idle CPU re-proves under the <10% total floor (AMB-05 battery) — ✓ PASSED (evidence-verified)

- **Soak:** `battery/ambient-soak-output.txt` — full ambient + glass: **5.49% CPU total** (< 10% floor, 4.51pp headroom), 60.0 fps, 0 long tasks, layout 0.000s. Marginal vs 08-03's 6.10% glass-live reference: ≈0 (−0.61pp, within scene noise).
- **Lighthouse:** `battery/lighthouse-scores.json` — mobile 99/100/100/100, desktop 100/100/100/100, TBT 0ms both.
- **Contrast screenshot gate:** `contrast-cdp-1440x900.txt` / `contrast-cdp-1280x800.txt` — both end `contrast gate PASS`, `failing[]` empty.
- **Banding:** `banding-selftest.txt` — clean passes, banded control fails; live crops (cloud + aurora bands) runs=1 gaps=0 PASS (`banding-live-crops.txt`).
- **Leak gate:** `leak-gate.txt` — 0 nightsky/sky refs on `/work/*` and `/404`; ambient chunk referenced by `index.html` only.

## Cross-Cutting Checks (re-run this session)

| Check | Result |
|---|---|
| `npx astro check` | 0 errors / 0 warnings / 0 hints (50 files) |
| `npm run build` | Green — 4 pages + sitemap |
| Zero hex outside tokens.css | Re-grep clean (`--aurora` counted in tokens.css) |
| Phase-9 code diff scope (`76bfce3..HEAD`, excl. `.planning/`) | 10 files, all sanctioned: verify-contrast.mjs, NightSky.astro (parallax CSS + teardown comment only), 5 nightsky modules, idle-queue extraction, tokens.ts, tokens.css (`--aurora` block only) |
| Glass/scrim/photo untouched | `deck.css`, the 13 `--glass-*` values, `public/` sky masters absent from the phase diff |
| `package.json` / `.planning/config.json` | Untouched |
| Fig. 01 | Untouched (`src/lib/fig01/` absent from diff) |

## Accepted Deviations (documented, not gaps)

1. RM cloud drain-repaint fix (Rule 2 — the one product deviation; `clouds.ts:164-172`, `scene.ts:701-710`).
2. `--aurora` erosion-sampler fix (commit `25bb072`) — measures the aurora, not point features.
3. Marginal-framing note (battery §1 — plan-designed marginal vs projection-comparable marginal both documented).
4. Aurora lateral softening deliberately not taken — recorded Phase-10 lever.
5. Idle-queue Safari-shim `setTimeout` — grep-exempt by doctrine (`idle-queue.ts:10-15`).
6. Comment-wording changes for grep hygiene.

## Verdict

**PASSED — 6/6 success criteria verified.** AMB-01..05 are implemented in the codebase as specified, all structural invariants re-grep clean, the build and type check are green, the contrast selftest and a fresh live `--aurora` gate run pass, and the committed battery evidence corroborates every recorded number. Phase 9 goal achieved.

---

_Verified: 2026-07-19_
_Verifier: Claude (gsd-verifier)_
