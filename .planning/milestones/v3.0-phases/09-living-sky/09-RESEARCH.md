# Phase 9: Living Sky - Research

**Researched:** 2026-07-19
**Domain:** Canvas ambient animation (procedural clouds + aurora), CSS compositor-only parallax, atmospheric-scintillation star rendering, all inside an existing single-rAF engine with a locked pause machine and a measured 3.9pp CPU headroom under a glass-panel budget.
**Confidence:** MEDIUM (grounded primarily in direct reads of the live engine — `scene.ts`/`starfield.ts`/`constellations.ts`/`meteors.ts`/`deck.ts`/`deck.css`/`NightSky.astro`/`verify-contrast.mjs` — plus `.planning/research/AMBIENT.md`'s milestone-level technique survey; the numeric budget projections are estimates, not benchmarks, and are explicitly flagged LOW where unverified)

## Summary

Phase 9 adds four ambient systems to a night-sky engine that already has a hard architectural discipline: ONE `requestAnimationFrame` loop (`scene.ts`), a three-condition pause machine (`tabVisible && !fig01Active && !reducedMotion`), and a "generate-once-blit-per-frame" doctrine for anything expensive (`starfield.ts`'s `generateLayer0`, mirrored by `drainQueue`/`requestIdle`). Every recommendation below is deliberately shaped to extend that SAME machinery rather than add new loops, new timers, or new pause states — `AMBIENT.md`'s central finding (the existing 3-condition gate already covers all four systems, confirmed HIGH confidence by direct code read) holds as long as clouds/aurora/scintillation are pure per-tick work with zero independent `setInterval`/`setTimeout` cadence of their own, and parallax is pure CSS (zero JS per frame).

Clouds are two pre-rendered offscreen sprite layers, generated via the SAME `requestIdle`/`drainQueue` chunked-generation infrastructure `starfield.ts` already built (its own doctrine comment explicitly anticipates this reuse), blitted with integer-rounded wraparound `drawImage()` calls inside `drawFrame()`. Aurora is a noise-driven curtain painted with plain `source-over` alpha — NOT `'lighter'` — because `'lighter'`-composite accumulation was the *specific, already-diagnosed* root cause of the 05-06 Milky-Way contrast failure (unbounded additive saturation toward near-white under text); reusing that technique here would risk repeating the exact failure this phase's own luminance-ceiling requirement exists to prevent. Parallax is CSS-only, compositor-thread-only, and — critically — is NOT a persistent camera offset: it is a bounded "nudge and settle back to zero" `@keyframes` animation on the single existing `.camper` wrapper div (no new DOM wrapper needed), which is also why "reduced-motion = instant jump" collapses cleanly to "zero motion" (the start and end state are the same point, 0). Scintillation is a pure per-star waveform upgrade inside the already-existing ~40-star twinkle loop — zero new draw calls, zero new state machinery.

**Primary recommendation:** Build clouds and aurora as new sibling modules (`clouds.ts`, `aurora.ts`) that mirror `constellations.ts`/`meteors.ts`'s handle shape (`{ advance(ts), draw(ctx,...), teardown() }`, driven from `scene.ts`'s existing tick, zero owned timers), extract `starfield.ts`'s `drainQueue`/`requestIdle` pair to a shared util for cloud/aurora sprite generation, implement parallax as a new `parallax.ts` that ONLY manipulates `.camper`'s CSS class list on the literal `nightsky:panel-change` event (no `deck.ts` import), and extend `verify-contrast.mjs` with a sibling `--aurora` mode built by factoring `sampleMoonOnce`'s two peak-sampling helpers to module scope. All four systems are projected (LOW-MEDIUM confidence, unbenchmarked) to cost well under 1pp combined against the measured 3.9pp headroom — the real risk is not CPU, it is contrast: clouds sit in the exact lower-sky region (`y ≈ 0.7–1.0`) where the shipped scrim gradient tapers to its weakest (`0.15` at `92%`, `0` at `100%`), and that same region is exactly where a tall panel's internal-scroll sweep can push worst-case text during the `--cdp-screenshot` gate.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AMB-01 | Two drifting cloud/haze layers (pre-rendered sprites, wraparound blit) move slowly across the lower sky inside the existing scene tick | §1 Clouds — sprite generation recipe, tiling math, drift speeds, alpha ceiling, placement geometry, banding mitigation |
| AMB-02 | Sky, horizon, and foreground shift at different rates on every panel change (CSS `translate3d` transitions, 300–500ms, compositor-only); instant under reduced-motion | §2 Parallax — exact DOM node, displacement amounts, direction mapping, timing, reduced-motion mechanism, glass re-blur interaction |
| AMB-03 | A faint breathing aurora (noise-driven curtains, updates throttled to every 3–5 frames) glows with peak luminance capped below the Milky Way band — the one sanctioned light source | §3 Aurora — noise table, curtain technique (source-over, not `'lighter'`), update cadence inside the single tick, luminance-ceiling assertion design |
| AMB-04 | The twinkle subset upgrades to atmospheric scintillation (2-oscillator waveform + occasional chromatic nudge on the brightest few) without widening the star count | §4 Scintillation — current implementation cited, 2-oscillator upgrade, chromatic nudge, cost delta |
| AMB-05 | Bounded-ambient doctrine: all systems run inside the single rAF + existing pause machine, a documented mobile degradation ladder sheds load in order, reduced-motion renders one static frame | §5 Soak + gates, §6 Budget table, §7 Pitfall checklist |
</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**The measured budget (hard inputs from Phase 8 close-out)**
- Main-thread: real-page total with glass = 6.10% → ~3.9pp headroom under the 10% floor for ALL four ambient systems combined (software raster, 1440×900 DPR1, 60s soak methodology)
- Contrast: the screenshot gate (`--cdp-screenshot`, both viewports) is the arbiter — worst surface today is header 6.23; no ambient light source may push any surface below 4.5:1
- Glass re-blur reality: ambient canvas work under glass surfaces re-blurs per changed frame — ambient systems should bias their visual activity toward the MARGINS (outside panel/chrome footprints) both for contrast AND re-blur cost; the final soak with everything running is the proof

**Physically-honest parallax model (LOCKED — resolves the canvas-transform trap)**
Real parallax: near things move, infinity doesn't. Therefore on panel change:
- Ground/silhouette/camper (DOM): largest shift (the "near" layer)
- Clouds: middle shift — implemented as a canvas-internal draw-offset transition (clouds are canvas sprites; their offset tweens inside the tick), NOT a CSS transform of the canvas
- Photo sky + stars/constellations (canvas): ZERO shift — they are at infinity; the canvas element is NEVER CSS-transformed
- CSS `translate3d` transitions (300–500ms, compositor-only, deck.css easing family) apply ONLY to the ground-layer DOM elements; instant under reduced-motion; parallax NEVER sheds on mobile (it's event-driven and compositor-only — effectively free)
- Amounts: small and dignified (UI-SPEC decides exact px; ground likely ≤24px, clouds ≤12px equivalent) — depth cue, not a slideshow effect

**Clouds (AMB-01)**
- 2 pre-rendered semi-transparent sprite layers (generated once offscreen like Layer 0 — procedural wisps, tokens-only, no image assets), wraparound blit in the existing tick; slow (research: real drift speeds), LOWER SKY bias (below/around the horizon band, out of the text column's worst-case rects); alpha capped so stars/MW read through; far layer is the FIRST mobile shed
- Cloud pixels under text rects are a contrast risk — the gate decides final alphas/placement

**Aurora (AMB-03)**
- Noise-table-driven curtains (precomputed value-noise, zero deps), painted every 3–5 frames into an offscreen layer composited in the tick; slow breathing undulation
- Placement: horizon-region margins, clear of the content column; peak luminance CAPPED below the Milky Way core (same readback assertion pattern as the moon — extend the `--moon` mode or sibling check: `auroraPeak < mwPeak`, verified both viewports)
- The one sanctioned added light source; if the gate shows any text-rect regression, aurora dims/moves — glass and scrim stay locked

**Scintillation (AMB-04)**
- Upgrade the existing ~40-star twinkle subset's waveform: 2-oscillator precomputed-phase sum + occasional chromatic nudge on the brightest few ONLY; no count widening; margin containment unchanged
- The photo's own stars stay static

**Doctrine + pause + reduced-motion (AMB-05)**
- All systems inside `scene.ts`'s single rAF (aurora/cloud offscreen updates throttled internally); pause machine unchanged `{hidden, fig01-active, reduced-motion}` — ambient fully stops in all three
- Reduced-motion static frame: clouds + aurora render ONCE at a fixed phase (static paint, like the moon), scintillation absent (stars at base), parallax instant-jump — zero motion anywhere (WCAG C39)
- Mobile degradation ladder: shed far cloud layer → throttle aurora to every 8-10 frames → drop chromatic nudge; PARALLAX NEVER SHEDS; trigger = viewport width/deviceMemory heuristic (planner decides, documented)
- Battery to close the phase: full soak with ALL ambient + glass (<10% total, 60fps, 0 long tasks), screenshot contrast gate both viewports all surfaces ≥4.5, aurora/moon luminance assertions, Lighthouse both presets ≥90, single-rAF counts unchanged, zero-hex, reduced-motion static-frame screenshot evidence, banding selftest

**Floors (all carried)**
No push; no new dependencies; package.json + .planning/config.json untouched; new ambient tokens (if any) in tokens.css only; scrim + glass values locked; photo masters locked; Fig. 01 untouched; leak gate (ambient JS stays out of /work/* + /404)

### Claude's Discretion
- Cloud sprite generation technique/shape language, exact drift speeds, aurora curtain count/palette-within-tokens, oscillator frequencies, parallax easing, the mobile-shed heuristic

### Deferred Ideas (OUT OF SCOPE)
- Weather states / seasonal skies → /craft someday; audio → never; shooting-star showers → still deferred from 5.1
</user_constraints>

## Project Constraints (from CLAUDE.md)

- Hosting: GitHub Pages, static-only — no server code (irrelevant to this phase; all work is client-side)
- Tech stack: Astro + vanilla TS/canvas — no UI framework runtime; this phase adds plain `.ts` modules only, consistent with the existing `nightsky/*` module set
- Performance: 60fps on average laptops (DPR cap 2, batched draws), Lighthouse ≥90 across the board — directly governs the budget table in §6
- Honesty: every displayed number traces to the résumé — not applicable to this decorative phase (no numeric claims are rendered)
- Zero-hex CSS doctrine (`ARCHITECTURE.md` Anti-Pattern 2, enforced by `tokens.css`'s own header comment): any new ambient token belongs in `tokens.css`, never a literal hex/rgb() in `.astro`/`.css`/`.ts`
- Module-boundary rule (`05-CONTEXT.md`, grep-enforced): `nightsky/*` never imports `deck.ts` or any `fig01` module; cross-module signals travel only via the literal `nightsky:panel-change` document event name, mirrored not imported

## Architectural Responsibility Map

This is a static, client-only site with no backend/API/CDN tiers of its own — everything below lives in the **Browser/Client** tier. The map instead clarifies which existing client-side subsystem owns each new capability, since that is the actual boundary risk in this codebase (canvas engine vs. DOM/CSS vs. build-time verification tooling).

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cloud sprite generation + blit | Browser/Client — Canvas engine (`scene.ts` tick, new `clouds.ts`) | — | Mirrors `starfield.ts`'s offscreen-generate-once pattern; must never touch DOM |
| Aurora curtain render + luminance cap | Browser/Client — Canvas engine (`scene.ts` tick, new `aurora.ts`) | Browser/Client — Verification tooling (`verify-contrast.mjs --aurora`) | Runtime render owned by the canvas engine; the luminance CEILING is enforced at build/verify time by a Node+CDP script, not at runtime — there is no in-browser assertion, only a gate script |
| Parallax on panel change | Browser/Client — DOM/CSS (`NightSky.astro`'s `.camper`, new `parallax.ts`) | — | Explicitly NOT canvas (locked decision: canvas is never CSS-transformed); compositor-only CSS keyframes, zero rAF involvement |
| Scintillation upgrade | Browser/Client — Canvas engine (`scene.ts`'s existing twinkle loop) | — | Pure per-star math change inside code that already exists; no new subsystem |
| Pause-machine wiring | Browser/Client — Canvas engine (`scene.ts` `updateRunState`) | — | All four systems must gate through the EXISTING three-flag machine; no new pause states |
| Contrast/luminance/banding gates | Browser/Client — Verification tooling (Node + headless CDP, `scripts/verify-contrast.mjs`, `scripts/verify-banding.mjs`) | — | Build/release-time gate, not runtime code; this is where "does the light source break WCAG" gets answered |

## Standard Stack

### Core
No new runtime dependency is required or permitted (Floors: "no new dependencies"). Everything below is native browser API + hand-written TypeScript inside the existing `src/lib/nightsky/` module set.

| Capability | API | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Cloud/aurora offscreen rendering | `HTMLCanvasElement` (detached, never DOM-attached) + `CanvasRenderingContext2D` | Pre-render sprites/curtain frames once, blit per frame | Identical to `starfield.ts`'s existing Layer-0 pattern — MDN's own canvas-optimization guidance (pre-render once, blit cheaply) is already the codebase's proven doctrine `[VERIFIED: codebase — src/lib/nightsky/starfield.ts]` |
| Idle-scheduled chunked generation | `requestIdleCallback` (feature-detected, `setTimeout` shim fallback) | Generate cloud/aurora sprites without blocking the main thread at boot | `starfield.ts` already implements `requestIdle`/`drainQueue` and its own header comment states it was "KEPT after 07-03 even though the queue is now tiny... Phase 9's ambient systems may plausibly reuse it" `[VERIFIED: codebase — starfield.ts lines 257-278]` |
| Parallax transition | CSS `@keyframes` + `transform: translate3d()` on `.camper` | Compositor-only, zero-JS-per-frame depth cue | Compositor-only-properties doctrine (`transform`/`opacity` are the only two CSS properties animatable without layout/paint) `[CITED: web.dev — Stick to Compositor-Only Properties]`; the codebase already uses this exact pattern for panel transitions (`deck.css` lines 77-90) |
| Value-noise table | Hand-rolled `Float32Array` lookup, generated once at init | Cheap, deterministic aurora undulation | No dependency; a small precomputed sine-sum table is sufficient (see §3) — MDN's general "precompute once, sample cheaply" doctrine `[CITED: MDN — Optimizing canvas]` |

### Supporting
None — this phase introduces zero new packages, per the locked Floor.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Canvas sprite clouds | CSS `<div>` layers with `background-image`/`transform` keyframes | Compositor-only in isolation, but adds a SECOND rendering/pause system to keep in sync with the existing rAF gate, and per `AMBIENT.md`'s finding the backdrop-filter re-blur cost is triggered by pixel-region overlap regardless of which technology painted those pixels — so CSS's isolated-cheapness advantage does not materialize here. Rejected. |
| `'lighter'` (additive) aurora compositing | Plain `source-over` alpha layering | `'lighter'` is the technique that caused the 05-06 Milky-Way near-white saturation failure (`05-06-SUMMARY.md` — "saturated `'lighter'` dust accumulation, raw up to full white"). `source-over` keeps luminance analytically bounded by `tokenBrightness × alpha`, which is exactly what the `auroraPeak < mwPeak` assertion needs to reason about. Use `source-over`. |
| Precomputed sine-sum table for aurora noise | True Perlin/simplex/value noise | Overkill for a slow (~20s cycle) breathing curtain; a 2-3-term mismatched-frequency sine sum is visually indistinguishable at this update rate and is trivially cheap — `AMBIENT.md`'s own survey found an existing implementation deliberately chose value noise over gradient noise purely for the performance win `[CITED: github.com/Btsan/Aurora-Effect]` |
| A persistent parallax "camera offset" | Bounded "nudge and settle to 0" `@keyframes` animation | A persistent offset accumulates unboundedly over many panel changes and requires explicit clamping/reset logic; a transient nudge is self-bounding, matches the "depth cue, not a slideshow effect" directive, and makes "reduced-motion = instant jump" trivially correct (start=end=0) |

**Installation:** None — zero new packages this phase.

**Version verification:** N/A — no packages to verify.

## Package Legitimacy Audit

**No external packages are installed in this phase** — the Floors section locks `package.json`/`package-lock.json`/`.planning/config.json` untouched, and every capability above is native browser API + hand-written TS. The Package Legitimacy Gate protocol is therefore not applicable.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | N/A — no installs this phase |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                     ┌────────────────────────────────────────────────────┐
                     │  document 'nightsky:panel-change' (deck.ts dispatch)│
                     └───────────────┬───────────────────┬────────────────┘
                                     │                    │
                     ┌───────────────▼─────┐   ┌──────────▼───────────────┐
                     │ scene.ts:onPanelChange│   │ parallax.ts:onPanelChange│  (NEW — independent listener,
                     │ (pause-gate ONLY,     │   │ toggles .camper's        │   mirrors constellations.ts's
                     │  unchanged)           │   │ nudge class, tracks      │   own independent-listener
                     └───────────────────────┘   │ lastIndex → direction    │   pattern)
                                                  └──────────┬────────────────┘
                                                             │  compositor-only CSS
                                                             ▼
                                                  ┌───────────────────────┐
                                                  │ .camper (DOM, NightSky │
                                                  │ .astro) — @keyframes   │
                                                  │ translate3d nudge,     │
                                                  │ 0 → peak → 0, ~480ms   │
                                                  └───────────────────────┘

  ┌─────────────────────────────── scene.ts drawFrame(ts) — THE single tick ───────────────────────────────┐
  │                                                                                                          │
  │  clearRect → drawImage(layer0)  [existing, unchanged: transparent bitmap + moon]                        │
  │       │                                                                                                  │
  │       ▼                                                                                                  │
  │  Layer 1.5 (NEW): cloudsHandle.advance(ts,dt) → cloudsHandle.draw(ctx,w,h)                               │
  │       — 2× (drawImage sprite@x, drawImage sprite@x±spriteW)  = 4 blits/frame, integer-rounded offsets    │
  │       │                                                                                                  │
  │       ▼                                                                                                  │
  │  Layer 2a: twinkle subset  [EXTENDED: 2-oscillator sum + rare chromatic nudge on brightest few]          │
  │       │                                                                                                  │
  │       ▼                                                                                                  │
  │  Layer 2b: fireflies  [unchanged]                                                                        │
  │       │                                                                                                  │
  │       ▼                                                                                                  │
  │  Layer 2c: constellations.advance/draw  [unchanged]                                                     │
  │       │                                                                                                  │
  │       ▼                                                                                                  │
  │  Layer 2d: meteor.advance/draw  [unchanged]                                                              │
  │       │                                                                                                  │
  │       ▼                                                                                                  │
  │  Layer 2e (NEW): auroraHandle.advance(ts) [internal frame-counter throttle, no setTimeout]               │
  │                  → auroraHandle.draw(ctx,w,h)  [draws pre-composited offscreen curtain, alpha source-over]│
  │                                                                                                          │
  └──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                     ▲
                                     │ gated by updateRunState() — UNCHANGED 3-flag machine
                                     │ {tabVisible, !fig01Active, !reducedMotion}
                                     │ clouds/aurora/scintillation get pause-for-free: their internal
                                     │ throttle counters simply stop advancing when drawFrame stops firing —
                                     │ NO new setTimeout/setInterval, NO new suppression wiring needed.
                                     │
                     ┌───────────────┴────────────────────┐
                     │ renderStaticFrame() — reduced motion │
                     │ paints Layer0 + clouds(fixed phase)  │
                     │ + aurora(fixed phase) + constellations│
                     │ ONCE. Twinkle/fireflies/meteor absent.│
                     └───────────────────────────────────────┘
```

### Recommended Project Structure
```
src/lib/nightsky/
├── scene.ts          # EXTENDED: two new handle fields (cloudsHandle, auroraHandle),
│                      #   two new lines in drawFrame()/renderStaticFrame(), zero new
│                      #   pause-signal listeners (existing updateRunState already covers them)
├── clouds.ts          # NEW — mirrors constellations.ts's { advance, draw, teardown } shape;
│                      #   owns sprite generation via the shared idle-queue util
├── aurora.ts           # NEW — same handle shape; owns the noise table + curtain offscreen canvas
├── parallax.ts          # NEW — independent 'nightsky:panel-change' listener, DOM-only,
│                      #   zero canvas/rAF involvement, zero import of deck.ts
├── idle-queue.ts        # NEW (extracted) — requestIdle()/drainQueue() lifted out of starfield.ts
│                      #   so clouds.ts/aurora.ts can reuse it without duplicating the shim
├── starfield.ts         # UNCHANGED except importing idle-queue.ts instead of owning it inline
├── constellations.ts    # UNCHANGED
├── meteors.ts            # UNCHANGED
└── tokens.ts              # EXTENDED: 1-2 new SkyTokens fields IF a dedicated aurora tint is
                          #   introduced (see §3 palette note) — otherwise unchanged
```

### Pattern 1: Handle-shaped subsystem, zero owned timers, pause-for-free
**What:** `clouds.ts` and `aurora.ts` each export `init*(options)` returning `{ advance(ts), draw(ctx, w, h), teardown() }` — no `setTimeout`, no `setInterval`, no own `requestAnimationFrame`. All internal throttling (aurora's every-3–5-frames update, clouds' wraparound offset advance) is driven by a frame counter or elapsed-`ts` check evaluated INSIDE `advance()`.
**When to use:** Any per-frame ambient work that only needs to run while the scene is animating.
**Why this matters for AMB-05:** Because `advance()`/`draw()` are only ever called from inside `drawFrame()`, and `drawFrame()` only runs while `rafId` is scheduled, and `rafId` is only scheduled while `updateRunState()`'s three-flag check passes — clouds/aurora get the ENTIRE pause machine for free. No new listener, no new suppression flag, no risk of a leaked timer surviving `{hidden, fig01-active, reduced-motion}` (the exact failure class `meteors.ts`/`constellations.ts` had to build explicit `setSuppressed()`/`clearFireTimer()` machinery to avoid, because THEIR spawn cadence genuinely needs a `setTimeout` that outlives a single tick — clouds/aurora do not need that, since their "cadence" is just "how often within a running tick do I redo the expensive part," not "when do I spawn something while the tick is stopped").
**Example:**
```typescript
// Source: mirrored from src/lib/nightsky/constellations.ts's ConstellationHandle shape
// and meteors.ts's MeteorHandle shape (both read directly, this session)
export interface CloudsHandle {
  advance(ts: number, dt: number): void;
  draw(ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number): void;
  teardown(): void;
}

export interface AuroraHandle {
  advance(ts: number): void;
  draw(ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number): void;
  teardown(): void;
}
```

### Pattern 2: Wraparound sprite blit (clouds)
**What:** Author each cloud layer's sprite as a horizontally-seamless tile at `spriteWidth = cssWidth * 1.6` (generous margin so the sprite never needs regeneration mid-drift before the next resize), advance a float `offsetPx += speed * (dt/1000)`, and on each draw compute the wrapped position so exactly two `drawImage()` calls always cover the full viewport with no seam.
**When to use:** Any infinite-scroll-style background layer.
**Example:**
```typescript
// Source: pattern synthesized from AMBIENT.md's cited sklambert/codetheory
// canvas-panning writeups + MDN's pre-render-once doctrine (this session's research)
function wrappedX(offsetPx: number, spriteWidth: number): number {
  // Always returns a value in (-spriteWidth, 0] — the "primary" draw position
  // just at/left of the origin; integer-round per AMBIENT.md's cited perf tip
  // (sub-pixel drawImage positions force a bilinear resample path).
  return Math.round((((offsetPx % spriteWidth) + spriteWidth) % spriteWidth) - spriteWidth);
}

function drawCloudLayer(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  spriteWidth: number,
  spriteHeight: number,
  offsetPx: number,
  destY: number
): void {
  const x = wrappedX(offsetPx, spriteWidth);
  ctx.drawImage(sprite, x, destY, spriteWidth, spriteHeight);
  ctx.drawImage(sprite, x + spriteWidth, destY, spriteWidth, spriteHeight);
}
```
This is **2 `drawImage()` calls per layer** — with 2 layers, **4 total per frame** (the prompt's "2 drawImage calls with offsets" describes one layer; confirm the actual per-frame total is 4, not 2, when sizing the budget). Per-call cost is a GPU texture blit of a pre-rendered bitmap — O(1) in scene complexity, no path/gradient recomputation, directly comparable in class to the existing single Layer-0 blit already inside the measured 6.10% baseline.

### Pattern 3: Cloud sprite generation recipe (procedural wisps, mirroring `starfield.ts`'s chunked queue)
**What:** Reuse `starfield.ts`'s `requestIdle`/`drainQueue` pair (extract to `idle-queue.ts`) to generate each cloud layer's sprite offscreen, once per Layer-0 regeneration cycle (same debounced-resize trigger), as a queue of small work units — mirroring the RETIRED procedural Milky-Way haze technique from `SPIKE.md` (kept as documented prior art, not reused as live code): layered soft-edged blobs with per-blob position/radius/alpha jitter, composited `source-over` (never `'lighter'` — see §3's rationale, which applies equally here as an anti-banding/anti-saturation measure).
**Recipe (per layer):**
1. Canvas sized `spriteWidth × spriteHeight` where `spriteWidth = cssWidth * 1.6`, `spriteHeight = cssHeight * 0.35` (a lower-sky band only, not full viewport height — saves generation + memory cost and matches the LOWER SKY placement bias).
2. For each of N wisps (far layer: ~8-12 wisps; near layer: ~5-8 wisps, fewer/bigger reads as "closer"): pick a horizontal band position `x ~ uniform(0, spriteWidth)`, `y` biased toward the sprite's lower half; draw 3-5 overlapping soft radial gradients (`createRadialGradient`, center full alpha → edge transparent) stretched horizontally via `ctx.scale()` (e.g., 3:1 x:y) to read as an elongated wisp rather than a circular puff, each blob's own alpha independently jittered within the layer's ceiling (see below), each blob offset from the wisp's nominal center by a small random jitter (mirrors the OLD MW haze's "±26px position jitter" anti-banding technique).
3. Left/right sprite edges must alpha-match (author wisps with a wraparound-safe margin, or simply avoid placing wisp centers within one wisp-radius of either edge) so the two-copy wraparound blit shows no seam.
4. Push each wisp as one `WorkUnit` into the SAME `drainQueue` used for Layer-0's twinkle-candidate metadata — this queue is idle-scheduled and self-adjusting regardless of unit cost, already proven infrastructure `[VERIFIED: codebase]`.

### Pattern 4: Aurora curtain (value-noise, `source-over`, throttled update)
**What:** A precomputed lookup table drives a wavy top edge for 1-2 vertical-gradient curtain strips; the table is regenerated once at init (or per resize), sampled cheaply per throttled update.
**Noise table:** `Float32Array` of ~64-128 samples, generated once as a sum of 2-3 sine waves at mismatched, non-harmonic frequencies (e.g., periods of 17, 29, 41 samples) plus a small random per-sample jitter — this avoids visible periodicity far more cheaply than a real Perlin/simplex implementation, and at a ~20s breathing cycle the difference is imperceptible. Precompute cost: negligible (one-time ~100-element loop).
**Curtain render:** For each of 1-2 curtain strips, sample the noise table (with linear interpolation between table entries) to get a wavy top-edge y-offset across the strip's width, then fill a vertical `createLinearGradient` (bright top → transparent bottom, clipped to the wavy top edge via a path) with `ctx.globalCompositeOperation = 'source-over'` (default — do NOT set `'lighter'`).
**Update cadence — no second rAF, no setTimeout:** a module-scope frame counter incremented once per `advance(ts)` call; only recompute the noise-table sample / wavy-edge geometry when `frameCounter % UPDATE_EVERY_N === 0` (N=4 normal tier, N=8-10 mobile-shed tier per the degradation ladder). The actual canvas `draw()` call can run every frame (compositing the last-computed geometry) since draw cost is cheap (a gradient-fill over a bounded region), or `draw()` can itself skip redrawing when the geometry hasn't changed — either is valid; the throttle is in the MATH, not necessarily the blit.
**Breathing cycle (~20s):** derive curtain brightness/height from a slow `sin(ts / (20000/TWO_PI))`-style envelope layered on top of the noise-driven shape, so the whole curtain visibly "breathes" in intensity over a ~20-second period, independent of the faster (3-5-frame) shape-update throttle.
**Offscreen sizing:** the curtain can be rendered directly to the visible canvas each `draw()` call (it is already a cheap gradient fill over a bounded vertical-strip region, not a full-viewport operation) — a separate smaller-then-upscaled offscreen buffer is an OPTIONAL further optimization if the soak shows pressure, not a starting requirement; start simple (direct draw), add the offscreen-upscale trick only if `§6`'s soak proves it necessary.
**Placement:** horizon-region margins (mirror `contentColumnEdges()` — same formula every other module in this file duplicates), vertical span roughly `y: 0.35–0.80` of viewport height (above the moon's `y:0.68H` anchor point at its lower edge, clear of the content column horizontally). Bias curtain density toward the LEFT margin (where the moon already anchors a faint feature) and keep the RIGHT margin (home of the photo's Milky-Way core, and the `mwBox` luminance-ceiling COMPARATOR region `x:0.80-0.98, y:0.30-0.60`) relatively clear, so the ceiling comparator stays representative of the photo's own brightness rather than being polluted by aurora's own pixels sitting inside the exact sampling box.

### Pattern 5: Physically-honest parallax — bounded nudge, not persistent offset
**What:** On `nightsky:panel-change`, toggle a CSS class on `.camper` that plays a short `@keyframes` animation from `translate3d(0,0,0)` → peak displacement (in the direction of travel) → back to `translate3d(0,0,0)`. State never accumulates across events.
**Direction mapping (Claude's Discretion — recommended convention, document in-code):** track `lastPanelIndex` inside `parallax.ts` (the `nightsky:panel-change` detail carries `{index, id, total}` but not a direction flag — derive it: `direction = Math.sign(detail.index - lastPanelIndex) || 1`). Convention: **forward navigation (index increasing) nudges the ground LEFT** (negative X — "the world drifts past you as you move forward through it"); **backward navigation nudges RIGHT**. This uses the horizontal axis exclusively, which never competes visually with the deck's own vertical `translateY` panel-swap motion (`deck.css` lines 64-75) — the two read as independent depth layers, not duplicate motion on the same axis.
**Amounts:** ground (`.camper`) peak displacement `24px` (the locked ceiling); clouds' canvas-internal offset nudge peak `12px`-equivalent (a temporary bump to the wraparound `offsetPx`, eased back over the same window) — ratio ground:clouds:sky = 2:1:0, "near things move, infinity doesn't."
**Timing:** total nudge duration recommended **480ms** — 60ms longer than the panel's own 420ms `transition` (`deck.css` line 79-81) so the two motions don't read as mechanically duplicated/synced, while starting SIMULTANEOUSLY with the panel-change event (same trigger, no artificial delay). Reuse the SAME easing family, `cubic-bezier(0.16, 1, 0.3, 1)`, for visual consistency with every other motion on the site.
**Reduced-motion mechanism:** under `prefers-reduced-motion: reduce`, either omit the `animation` property entirely via `@media (prefers-reduced-motion: reduce) { .camper.parallax-nudge { animation: none; } }`, or — since the animation's start and end states are IDENTICAL (`translate3d(0,0,0)`) — even an un-gated instant application would be visually indistinguishable from "zero motion" (the `@media` gate is still required for correctness/WCAG C39 compliance and to avoid a wasted compositor frame, but there is no risk of an unwanted VISIBLE jump because the settled state never changes). This is why the locked doctrine's phrase "parallax instant-jump — zero motion anywhere" is internally consistent: an instant transition between two identical states is trivially zero motion.
**DOM node — no new wrapper needed:** `NightSky.astro`'s `.camper` div (lines 92-110) is ALREADY the single atomic wrapper containing both the SVG silhouette (`.camper-svg`) and the glow (`.camper-glow`) — apply the transform directly to `.camper` itself. It is `position: absolute` with static `left`/`bottom` values (not itself animated), so layering a `transform` on top is purely additive and does not disturb its existing anchor math. **No new DOM element is required.**
**Example:**
```css
/* Source: pattern extends deck.css's existing transition family (cubic-bezier(0.16,1,0.3,1))
   — this project's own established easing, not an external citation */
@keyframes camper-parallax-nudge-fwd {
  0%   { transform: translate3d(0, 0, 0); }
  35%  { transform: translate3d(-24px, 0, 0); }
  100% { transform: translate3d(0, 0, 0); }
}
@keyframes camper-parallax-nudge-back {
  0%   { transform: translate3d(0, 0, 0); }
  35%  { transform: translate3d(24px, 0, 0); }
  100% { transform: translate3d(0, 0, 0); }
}
.camper.parallax-nudge-fwd  { animation: camper-parallax-nudge-fwd 480ms cubic-bezier(0.16, 1, 0.3, 1) 1; }
.camper.parallax-nudge-back { animation: camper-parallax-nudge-back 480ms cubic-bezier(0.16, 1, 0.3, 1) 1; }

@media (prefers-reduced-motion: reduce) {
  .camper.parallax-nudge-fwd,
  .camper.parallax-nudge-back {
    animation: none;
  }
}
```
```typescript
// parallax.ts — NEW module. Independent 'nightsky:panel-change' listener,
// mirroring constellations.ts's own independent-listener pattern (05-RESEARCH.md
// Pattern 6's "two independent listeners on the same event" note). Never
// imports deck.ts. Zero canvas/rAF involvement — pure DOM class toggling.
let lastPanelIndex = 0;
function onPanelChange(e: Event): void {
  const detail = (e as CustomEvent<{ index: number; id: string; total: number }>).detail;
  if (!detail) return;
  const direction = Math.sign(detail.index - lastPanelIndex) || 1;
  lastPanelIndex = detail.index;
  const camper = document.querySelector<HTMLElement>('.camper');
  if (!camper) return;
  const cls = direction >= 0 ? 'parallax-nudge-fwd' : 'parallax-nudge-back';
  const other = direction >= 0 ? 'parallax-nudge-back' : 'parallax-nudge-fwd';
  camper.classList.remove(other);
  // Force reflow to restart the animation on rapid repeated panel changes
  // (the standard "remove class, read a layout property, re-add class" trick).
  camper.classList.remove(cls);
  void camper.offsetWidth;
  camper.classList.add(cls);
}
document.addEventListener('nightsky:panel-change', onPanelChange);
```

### Anti-Patterns to Avoid
- **`'lighter'` compositing for aurora or cloud layers:** this is the exact technique that caused the 05-06 Milky-Way band's contrast failure (`05-06-SUMMARY.md`: "saturated `'lighter'` dust accumulation... raw up to full white"). It remains correct and safe for `constellations.ts`'s/`meteors.ts`'s thin, rare, single-pixel-wide beam strokes — it is NOT safe for a broad, low-alpha area fill like a cloud wisp or aurora curtain, where accumulation across a large pixel area is exactly the failure mode. Use `source-over`.
- **A persistent parallax camera offset:** accumulates unboundedly across many panel changes, requires manual clamping, and makes "reduced motion = instant jump" ambiguous (jump to WHERE?). Use the bounded nudge-and-settle pattern instead.
- **Any `setTimeout`/`setInterval` inside `clouds.ts`/`aurora.ts` for their update cadence:** defeats the "pause for free" property of Pattern 1 above and reintroduces the exact suppression-wiring complexity `constellations.ts`/`meteors.ts` had to build (and that those modules only need because THEY genuinely spawn across paused windows — clouds/aurora do not).
- **CSS-transforming `#nightsky-canvas` or `.nightsky-host` for ANY purpose:** locked decision — the canvas is at infinity in the parallax model; transforming it would shift margin-contained constellations/twinkle into the text column and re-blur every glass surface for the transition duration. This must remain a hard invariant, not a per-feature judgment call.
- **Confining clouds to the horizontal margins like twinkle/firefly/moon/constellations:** clouds are a broad atmospheric layer, not a point feature — confining them to margins would look artificially patchy directly behind a text column. The correct mitigation for cloud-under-text contrast risk is ALPHA and VERTICAL placement, not horizontal exclusion (this is an explicit, deliberate departure from every other ambient element's margin-confinement pattern — flag it clearly to the planner so it isn't "corrected" to match the other systems).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chunked idle-time canvas generation | A new bespoke idle-scheduling loop inside `clouds.ts`/`aurora.ts` | Extract `starfield.ts`'s existing `requestIdle`/`drainQueue` pair into `idle-queue.ts` and import it | Already written, already proven (handles the Safari-no-requestIdleCallback fallback correctly), and the codebase's own comment anticipates this exact reuse |
| WCAG relative-luminance / contrast-ratio math | Ad-hoc brightness comparisons for the aurora ceiling | `relativeLuminance()`/`contrastRatio()`/`peakLuminanceInRegion()` already defined in `scripts/verify-contrast.mjs` | These are the WCAG 2.2 SC 1.4.3 formulas verbatim, already selftested (fixture-proven) in this exact file — do not reimplement |
| Content-column edge geometry | A new formula for "where is the text-safe column at this viewport width" | The `contentColumnEdges()` formula already duplicated (deliberately, per the module-boundary doctrine) in `scene.ts`, `starfield.ts`, `constellations.ts`, and `meteors.ts` | Four independent modules already mirror this exact formula; a fifth mirror (in `aurora.ts` if margin-anchoring is needed) is the established pattern, not technical debt |
| Headless-Chrome CDP screenshot/luminance sampling scaffolding | A new browser-launch/CDP-connect harness for the `--aurora` mode | `launchChrome()`, `Cdp` class, `connectCdp()`, `forceDpr1()` already exist in `verify-contrast.mjs` | Zero-dependency, already proven (Windows DevToolsActivePort polling, DPR1 forcing, profile cleanup) — reuse verbatim, only the sampler function and CLI branch are new |

**Key insight:** every piece of infrastructure this phase needs — idle scheduling, luminance math, column-edge geometry, headless-browser sampling — already exists in this codebase from Phases 5-8. The actual net-new code surface is small: two rendering modules, one DOM-class-toggling module, and one new sampler function + CLI branch in an existing script.

## Common Pitfalls

### Pitfall 1: Cloud-under-text contrast at the exact spot the scrim is weakest
**What goes wrong:** Clouds are locked to a LOWER SKY bias, but the shipped scrim gradient (`deck.css` lines 152-160 / `SCRIM_STOPS` in `verify-contrast.mjs`) tapers from its `0.38` peak down to `0.15` at `92%` viewport height and `0` at `100%` — i.e., the scrim's weakest protection is in EXACTLY the region clouds are being asked to occupy.
**Why it happens:** The scrim was tuned (Phase 5/7) against a starfield+photo backdrop that has no bright feature in that exact bottom band; clouds are a NEW light-ish feature being added into a region the scrim was never asked to cover strongly.
**How to avoid:** Keep cloud alpha conservative at the low end of the researched range (far layer ~0.04-0.08, near layer ~0.06-0.14, tune down from `AMBIENT.md`'s upper suggestions), and treat `--cdp-screenshot` as the final arbiter (as the CONTEXT already mandates) — do not ship a fixed alpha value without running the gate.
**Warning signs:** `--cdp-screenshot` failures specifically in panels whose worst-case text rect lands at `y > 0.75` of viewport height.

### Pitfall 2: Tall-panel internal-scroll sweep can put ANY text at the cloud band's y-range
**What goes wrong:** `.panel` is `overflow: auto` and internally scrollable; `--cdp-screenshot`'s sweep logic re-discovers text rects at every scroll offset for panels where `scrollHeight > clientHeight`. The panels most likely to trigger this sweep are the long-content ones (experience, patents, skills — repeatedly referenced across `07-UI-SPEC.md`/`deck.css` comments as "tall panels"), and at narrower check widths (1280×800) more content wraps, making the sweep more likely to land arbitrary headings/paragraphs at low y-fractions.
**Why it happens:** Cloud placement geometry is computed against a FIXED viewport-fraction band, but text position is NOT fixed — it moves with scroll.
**How to avoid:** Run `--cdp-screenshot` at BOTH check viewports (1440×900 and 1280×800, per `07-UI-SPEC.md`'s own reference pair) AFTER clouds ship, specifically inspecting the tall panels' swept results for regressions, not just the non-scrolling panels' single-offset check.
**Warning signs:** A `failing[]` entry in the gate's JSON report whose `panel` is `experience`/`patents`/`skills` and whose rect sits at a high y-fraction that only appears at a non-zero scroll offset.

### Pitfall 3: Aurora luminance ceiling has no in-browser runtime enforcement — only a build-time gate
**What goes wrong:** Unlike the moon (whose `LIT_ALPHA` is a hard-coded ceiling constant plus a verify-time assertion), if aurora's brightness envelope is driven by a runtime formula (the ~20s breathing cycle) without ALSO hard-capping the peak multiplier in code, the verify-time `--aurora` assertion could pass during development (when the breathing phase happens to be sampled at a dim point) and fail later at a different phase of the cycle, or vice-versa.
**Why it happens:** A slowly-varying brightness envelope means "peak luminance" is time-dependent, not a fixed constant like the moon's.
**How to avoid:** Hard-code a ceiling multiplier IN CODE (mirroring the moon's `LIT_ALPHA = 0.45; // HARD ceiling 0.55` pattern) that the breathing envelope can never exceed regardless of its sine phase, then verify at the envelope's OWN peak phase (call `Date.now()`-independent — e.g., force the aurora module to expose a `peakPhaseSnapshot()` test hook, or simply sample the `--aurora` gate across enough time/interval that the envelope's peak is caught within the sampling window, mirroring `--cdp`'s existing multi-sample-over-interval approach for twinkle/beam coverage).
**Warning signs:** `--aurora` gate passes in CI but a human visually spots a brighter aurora moment during manual QA that wasn't caught by the sampling window.

### Pitfall 4: Second-rAF regression via an aurora/cloud module accidentally scheduling its own loop
**What goes wrong:** A contributor unfamiliar with the "handle shape, zero owned timers" doctrine (Pattern 1) adds a `requestAnimationFrame` call inside `clouds.ts`/`aurora.ts` for "smoother" updates, silently reintroducing a second animation driver that bypasses the pause machine.
**Why it happens:** It is the OBVIOUS naive implementation for anyone who hasn't internalized this specific codebase's single-rAF invariant.
**How to avoid:** Code review + grep gate (see §7 detection commands below) as a hard pre-merge check, not just a documentation comment.
**Warning signs:** Animation continues to visibly play (however faintly) after switching to a background tab or entering Fig. 01.

## Code Examples

### Aurora noise-table generation + sampling
```typescript
// Source: pattern synthesized this session from AMBIENT.md's cited value-noise
// rationale (github.com/Btsan/Aurora-Effect — "computationally cheaper than
// gradient noise") + MDN's general precompute-once doctrine. Not a direct
// code lift from any external source — hand-derived for this codebase's shape.
const NOISE_TABLE_SIZE = 96;
function buildNoiseTable(): Float32Array {
  const table = new Float32Array(NOISE_TABLE_SIZE);
  for (let i = 0; i < NOISE_TABLE_SIZE; i++) {
    const t = i / NOISE_TABLE_SIZE;
    // Three mismatched, non-harmonic periods avoid visible looping.
    const v =
      Math.sin(t * Math.PI * 2 * (NOISE_TABLE_SIZE / 17)) * 0.5 +
      Math.sin(t * Math.PI * 2 * (NOISE_TABLE_SIZE / 29) + 1.3) * 0.3 +
      Math.sin(t * Math.PI * 2 * (NOISE_TABLE_SIZE / 41) + 2.7) * 0.2;
    table[i] = v * 0.5 + 0.5; // normalize to [0,1]
  }
  return table;
}
function sampleNoise(table: Float32Array, u: number): number {
  const scaled = ((u % 1) + 1) % 1 * table.length;
  const i0 = Math.floor(scaled) % table.length;
  const i1 = (i0 + 1) % table.length;
  const frac = scaled - Math.floor(scaled);
  return table[i0] * (1 - frac) + table[i1] * frac;
}
```

### Extending `verify-contrast.mjs` with a sibling `--aurora` mode
```javascript
// Source: mirrors sampleMoonOnce()'s exact structure (scripts/verify-contrast.mjs
// lines 1075-1169, read directly this session) — factor compositedPeakOf/
// photoPeakOf to module scope so both sampleMoonOnce and the new
// sampleAuroraOnce can share them without duplication.
function sampleAuroraOnce(auroraBox) {
  // auroraBox: { x0, y0, x1, y1 } in CSS px — the aurora module's own
  // documented placement geometry, mirrored here per the module-boundary
  // "mirror, don't import" doctrine every other sampler already follows.
  const canvas = document.querySelector('#nightsky-canvas');
  const photoCtx = makePhotoCanvas(canvas.width, canvas.height);
  if (!photoCtx) return { error: 'no decoded .sky-photo img' };
  const w = window.innerWidth, h = window.innerHeight;
  const mwBox = { x0: 0.8 * w, y0: 0.3 * h, x1: 0.98 * w, y1: 0.6 * h };
  const aurora = compositedPeakOf(auroraBox.x0, auroraBox.y0, auroraBox.x1, auroraBox.y1);
  const mw = photoPeakOf(mwBox.x0, mwBox.y0, mwBox.x1, mwBox.y1);
  return { auroraPeak: aurora.peak, auroraPeakPixel: aurora.px, mwPeak: mw.peak, mwPeakPixel: mw.px };
}
// New CLI branch, mirroring moonMain()'s structure exactly:
//   } else if (args.includes("--aurora")) {
//     await auroraMain(args);   // same launchChrome/connectCdp/READY_PROBE flow,
//                                // asserts auroraPeak < mwPeak, exits non-zero on failure
//   }
// Run at BOTH check viewports explicitly: --width 1440 --height 900 AND
// --width 1280 --height 800 (the --moon mode's own default only covers 1440x900;
// CONTEXT.md's "verified both viewports" requirement means the planner must
// call this twice with explicit --width/--height, not rely on a default).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Procedural Milky-Way band baked into Layer 0 with `'lighter'`-composite haze passes | Real photo provides the sky wash; Layer 0 is transparent except the moon | Phase 7 (07-03, IMG-05) | The `'lighter'` accumulation failure mode that caused 05-06's contrast bug is HISTORICAL for the Milky Way itself, but the TECHNIQUE risk is still live for any NEW `'lighter'`-composited area fill — which is precisely why aurora/clouds must avoid it |
| SKY-05 alpha-cap governor (smoothstep attenuation of baked star alpha near the column) | Hard margin include/exclude at generation time (twinkle candidates simply aren't generated inside the column) | Phase 7 (07-03) | Establishes the "exclude at the geometry level, not the alpha level" pattern most ambient systems here follow — clouds are the deliberate exception (§ Anti-Patterns) |

**Deprecated/outdated:** N/A — no external library versions are in play this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cloud/aurora "realistic drift speed" and "believable breathing cycle" numeric ranges (px/s, alpha ceilings) are art-direction starting points, not sourced psychophysical thresholds — `AMBIENT.md` itself flags this LOW confidence, and this document further biases the recommended speeds DOWNWARD from `AMBIENT.md`'s own suggestion based on the CONTEXT's explicit "notice only on return-glance" intent | §1 Clouds, §3 Aurora | If wrong, motion reads as either too static (fails the "living" brief) or too active (fails "quiet/dignified") — low-severity, tune-by-eye risk, not a correctness risk |
| A2 | 480ms parallax nudge duration (60ms longer than the panel's own 420ms transition) is a reasoned but unverified design choice — no authoritative source pins an exact figure for this specific composited-depth-cue use case | §2 Parallax | Low risk — purely a feel/timing tuning knob, easily adjusted post-review |
| A3 | The claim that a `.camper`-only transform re-blur cost is "nearly free marginal cost" because the panel's own 420ms transition already forces a backdrop-filter re-composite during the same window is REASONED from `AMBIENT.md`'s general finding (re-blur cost is triggered by pixel-region overlap during a composite, not by which technique painted it) but has NOT been benchmarked for this specific 480ms/24px case | §2 Parallax, glass interaction | If wrong (i.e., if the marginal cost is meaningfully non-zero), the phase's own closing soak (already mandated in the Doctrine section) will catch it — this is exactly what that soak step exists to validate |
| A4 | Aurora's placement bias (dense left margin, sparse right margin near the `mwBox` comparator) is a design recommendation to keep the luminance-ceiling comparator representative — not derived from any external source, purely reasoned from reading `verify-contrast.mjs`'s `mwBox` geometry directly | §3 Aurora | If the aurora curtain still ends up overlapping `mwBox` meaningfully, the assertion becomes a self-referential near-tie rather than a real independent ceiling check — flag for the planner to verify the final geometry doesn't overlap `mwBox` before considering the gate meaningful |
| A5 | The §6 budget table's per-system pp estimates are UNBENCHMARKED projections reasoning by analogy to the existing measured 6.10% baseline's component costs (Layer-0 blit, twinkle, constellation draws) — no prototype was built or profiled this session | §6 Budget table | If actual costs are meaningfully higher (especially aurora, the least-precedented system here), the mobile degradation ladder and the phase's own mandated closing soak are the designed safety net — this is explicitly why the soak gate exists rather than trusting the estimate alone |

**If this table is empty:** N/A — see entries above.

## Open Questions

1. **Does the mobile-shed heuristic (viewport width vs. `deviceMemory`) actually correlate with real low-power devices in 2026?**
   - What we know: `AMBIENT.md` already flags `navigator.deviceMemory`/Battery API support as "poor/inconsistent" and recommends viewport width as the pragmatic, load-bearing signal instead.
   - What's unclear: the exact breakpoint (`AMBIENT.md` suggests "tablet-and-down" for tier 2, narrower for tier 3, but gives no specific px value).
   - Recommendation: planner picks a concrete breakpoint (e.g., `<= 768px` for tier 2, `<= 480px` for tier 3) matching this project's existing responsive tiers already visible in `NightSky.astro`'s `@media` object-position ladder (`639px`/`1023px`/`1800px` boundaries already established) — reuse those SAME breakpoints rather than inventing new ones, for consistency.

2. **Should the aurora curtain's offscreen-buffer-then-upscale optimization (mentioned as optional in Pattern 4) be built proactively or only if the soak shows pressure?**
   - What we know: direct-draw is simpler and is what the aurora module should start with; the AMBIENT.md milestone research flagged this as a possible cheaper alternative if needed.
   - What's unclear: whether the ~0.3-0.6pp estimated aurora cost (§6, unbenchmarked) will actually require it.
   - Recommendation: build direct-draw first (simpler, fewer moving parts), let the phase's own closing soak decide whether the optimization is warranted — do not pre-optimize against an unbenchmarked estimate.

3. **Does a dedicated `--aurora-hue`-type token belong in `tokens.css`, or should aurora simply reuse `--milkyway` (already documented as "unused-but-harmless, or repurposed as a reference hue")?**
   - What we know: `tokens.css`'s own comment on `--milkyway` explicitly flags it as available for exactly this kind of repurposing; CONTEXT's Specific Ideas section suggests "the faintest green-teal within tokens."
   - What's unclear: whether `--milkyway`'s existing hue (a pale blue-white, `#cfd9f2`) is close enough to a "cool green-teal" family, or whether a genuinely new token is warranted.
   - Recommendation: reuse `--milkyway` as the base and apply the aurora's own alpha/luminance envelope on top of it (zero new tokens, satisfies the Floor "new ambient tokens, if any, in tokens.css only" — the safest reading is "prefer zero new tokens over adding one" given an existing candidate already exists) — unless visual review during the CONTEXT's Claude's-Discretion pass determines the color read is wrong, in which case ONE new token (e.g., `--aurora`) is the fallback, still inside tokens.css per the Floor.

## Environment Availability

This phase has no external tool/service/runtime dependency beyond what Phases 5-8 already established and verified working in this exact repo (Node ≥22.12, headless Chrome for the CDP-based gates, `sharp` already present transitively). No new environment probe is needed.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Headless Chrome (CDP) | `--aurora` gate, `--cdp-screenshot` re-run | ✓ (already used by Phase 8's `real-soak.mjs`/`verify-contrast.mjs`) | — | — |
| `sharp` (transitive via astro:assets) | Screenshot decode in `--cdp-screenshot`/potential banding checks | ✓ (already present, `node_modules/@img/sharp-win32-x64`) | — | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

## Validation Architecture

Skipped — `.planning/config.json` has `workflow.nyquist_validation: false` (explicit).

## Security Domain

`security_enforcement` is enabled (`security_asvs_level: 1`) in `.planning/config.json`. This phase is entirely client-side, decorative, non-interactive canvas/CSS work with zero user input, zero network calls, zero authentication/session surface, and zero data persistence — the applicable ASVS surface is minimal, but the categories are addressed explicitly rather than silently skipped.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A — no auth surface anywhere on this static site |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | No | This phase adds zero new user-facing input; the only "input" is the existing `nightsky:panel-change` CustomEvent, which is same-origin, dispatched only by `deck.ts`'s own trusted code path (not attacker-influenceable), and the new `parallax.ts` listener only reads `detail.index` (a number, used solely to compute `Math.sign()`) — no string interpolation, no DOM injection surface |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unbounded CSS class toggling driven by a crafted/malformed CustomEvent detail | Denial of Service (main-thread) | `parallax.ts`'s `onPanelChange` must null-check `detail`/`detail.index` before use (mirrors `constellations.ts`'s/`scene.ts`'s own existing `(e as CustomEvent<...>).detail` optional-chaining pattern) — a missing/malformed detail should no-op, never throw |
| A new module accidentally reintroducing a second animation loop that never respects the pause machine | Availability (main-thread cost never actually stops, e.g. on a hidden tab) | Not a classic STRIDE security threat, but functionally equivalent to a resource-exhaustion bug — covered by Pattern 1's "handle shape, zero owned timers" doctrine and the Pitfall 4 detection command below |

## Sources

### Primary (HIGH confidence)
- Direct read of `src/lib/nightsky/scene.ts`, `starfield.ts`, `constellations.ts`, `meteors.ts`, `tokens.ts` (this session) — the single-rAF tick structure, pause machine, handle shapes, idle-queue infrastructure, and content-column formula are all read directly from the live codebase
- Direct read of `src/components/NightSky.astro` — DOM layer structure, `.camper` wrapper, stacking/z-index doctrine
- Direct read of `src/lib/nightsky/deck.ts` — the `nightsky:panel-change` event contract (`{index, id, total}`), module-boundary rule enforcement
- Direct read of `src/styles/deck.css` — the 420ms `cubic-bezier(0.16, 1, 0.3, 1)` transition family, the `SCRIM_STOPS`-matching gradient, glass-panel `@supports` scoping
- Direct read of `scripts/verify-contrast.mjs` (full file, both halves) — `sampleMoonOnce`'s exact luminance-comparator structure (the template for the new `--aurora` mode), the `--cdp-screenshot` gate's tall-panel scroll-sweep behavior, WCAG formula implementations
- Direct read of `.planning/phases/08-glass-system/glass-reproof/real-soak-output.txt` and `08-03-SUMMARY.md` — the measured 6.10% total / 3.9pp headroom figures this entire budget analysis is anchored to
- Direct read of `.planning/milestones/v2.0-phases/05-night-sky-scene/05-06-SUMMARY.md` and `SPIKE.md` — the historical `'lighter'`-composite contrast-failure root cause that directly informs the aurora/cloud compositing recommendation

### Secondary (MEDIUM confidence)
- `.planning/research/AMBIENT.md` (milestone-level research, 2026-07-18) — technique survey and per-system cost model for all four ambient systems; its own citations (MDN canvas optimization, web.dev compositor-only-properties doctrine, various canvas-parallax/aurora-effect blog writeups) are inherited at their own stated confidence levels, not re-verified independently this session

### Tertiary (LOW confidence)
- Specific numeric drift-speed/alpha/duration starting values throughout this document — explicitly flagged in the Assumptions Log (A1, A2) as tune-by-eye starting points, not sourced facts

## Metadata

**Confidence breakdown:**
- Standard stack / architecture patterns: HIGH — every recommended pattern mirrors code read directly from this repo this session; zero new dependencies means zero registry-verification risk
- Clouds/aurora technique choice (source-over vs lighter, sprite generation, noise table): MEDIUM-HIGH — the `'lighter'` avoidance is HIGH confidence (directly evidenced by this codebase's own 05-06 failure), the specific generation recipe is MEDIUM (synthesized, not benchmarked)
- Parallax DOM/timing design: MEDIUM — the "bounded nudge, not persistent offset" architecture is well-reasoned from the locked constraints, but the exact 480ms/24px/12px numbers are LOW-confidence tuning starting points
- Budget table (§6, below): LOW-MEDIUM — unbenchmarked, explicitly flagged; the phase's own mandated closing soak is the actual validation mechanism, not this estimate
- Pitfalls: MEDIUM-HIGH — Pitfalls 1/2 are directly evidenced by reading the live scrim gradient and gate-sweep code; Pitfall 3/4 are reasoned from the codebase's own established doctrine

**Research date:** 2026-07-19
**Valid until:** 30 days (stable — no external library versions in play; the only drift risk is if a future phase changes the scrim gradient, glass tokens, or panel structure this research reads directly)

---

## §6 Budget Table (AMB-05 — an honest a-priori estimate the soak then validates)

All figures below are **unbenchmarked projections** (Assumption A5) reasoned by analogy to the measured 6.10% baseline's known component costs (a single Layer-0 `drawImage`, ~40-star twinkle loop, 9 fireflies, constellation link/halo draws, occasional meteor/beam). They exist to give the planner an honest starting expectation, NOT to replace the phase's own mandated closing soak — that soak (already required in the Doctrine section: full soak with ALL ambient + glass, <10% total) is the actual gate.

| System | Per-frame work | Estimated marginal cost | Confidence |
|--------|-----------------|--------------------------|------------|
| Clouds (2 layers) | 4× `drawImage()` (2 per layer, wraparound pair), 2× float increment, integer rounding | ~0.05-0.15pp — comparable in class to, and smaller than, the existing single Layer-0 blit already inside the 6.10% baseline | LOW-MEDIUM |
| Parallax | Zero steady-state cost (compositor-only, event-triggered); only cost is the SAME backdrop-filter re-blur window the panel's own 420ms transition already pays for that event | ~0pp marginal main-thread (the re-blur is a compositor/GPU cost, not measured by `TaskDuration`, per the 08-03 soak's own finding that glass compositor cost is "blind" to the renderer `TaskDuration` metric and required a separate tree-CPU cross-check) | MEDIUM (grounded in 08-03's own documented tree-CPU blind spot) |
| Aurora | Noise-math update every 3-5 frames (throttled) + a bounded-region gradient fill every frame | ~0.2-0.5pp — the single least-precedented system here (no directly comparable existing draw at this area/complexity); budget the most contingency against this line | LOW |
| Scintillation | Same ~40-star loop, one extra `sin()` term per star + a rare (few-stars, occasional-frame) color nudge | ~0.02-0.05pp — negligible, explicitly framed by `AMBIENT.md` as a quality upgrade to existing bounded work, not new work at a new scale | MEDIUM-HIGH |
| **Total (all 4, normal tier)** | — | **~0.3-0.7pp** against the measured 3.9pp headroom | LOW-MEDIUM (sum of above) |

**Bottom line: projected FITS WITH SUBSTANTIAL ROOM, not tight** — even at the pessimistic end of the range (~0.7pp), the phase would land around 6.8% total, still ~3.2pp under the 10% floor. The mobile degradation ladder (far cloud layer shed, aurora throttled to every 8-10 frames, chromatic nudge dropped) provides further headroom on constrained devices without needing to be triggered on typical desktop/laptop hardware. **The one flagged uncertainty that could change this verdict is aurora's real cost** (LOW confidence, no comparable existing draw to anchor the estimate) and the **real-device (non-software-raster) glass re-blur interaction** carried forward unresolved from `AMBIENT.md` — both are exactly what the phase's mandated closing soak exists to settle.

**Mobile degradation ladder projected savings (unbenchmarked, LOW confidence, ordering logic is the load-bearing part):**
1. Shed far cloud layer → removes 2 of 4 `drawImage()` calls; absolute pp saving is small on desktop-class CPUs but likely matters disproportionately on constrained mobile GPU compositing, where blit/raster cost scales differently than the software-raster desktop soak measures
2. Throttle aurora 3-5 frames → 8-10 frames → roughly halves aurora's already-modest update-math frequency
3. Drop chromatic nudge → negligible additional saving (already framed as "occasional, brightest few only")
4. Parallax never sheds → correctly, since its marginal cost is already ~0pp regardless of device tier

## §7 Pitfall Checklist (ordered, with detection commands)

1. **Second-rAF regression** — a new module calls `requestAnimationFrame` itself instead of riding `scene.ts`'s tick.
   Detection: `grep -rn "requestAnimationFrame" src/lib/nightsky/` — expect matches ONLY in `scene.ts` (the `startAnimationLoop` function). Any match in `clouds.ts`/`aurora.ts`/`parallax.ts` is a hard fail.

2. **Canvas-transform accidents** — any CSS `transform`/`translate` rule or inline style targeting `#nightsky-canvas` or `.nightsky-host`.
   Detection: `grep -rn "nightsky-canvas\|nightsky-host" src/**/*.astro src/**/*.css` then manually confirm none of the matched rule blocks contain a `transform` declaration; also runtime-check via `getComputedStyle(document.querySelector('#nightsky-canvas')).transform` in a live page — expect `"none"` at all times, including mid-parallax-nudge.

3. **Aurora `'lighter'`/banding regression** — a future edit reintroduces `'lighter'` compositing for the curtain, or the curtain's gradient shows visible posterization banding.
   Detection: `grep -n "globalCompositeOperation" src/lib/nightsky/aurora.ts` — expect `'source-over'` or no explicit setting (the canvas default) at every curtain-fill call site; for visual banding, adapt `scripts/verify-banding.mjs`'s histogram comb-spike technique (`combSpikeScore`) against a headless-Chrome screenshot capture of the aurora region rather than a static image file (that script currently targets committed AVIF/WebP masters, not live canvas output — this is a NEW capture path to add, not a drop-in reuse).

4. **Aurora luminance-ceiling regression** — `auroraPeak >= mwPeak` at either check viewport.
   Detection: `node scripts/verify-contrast.mjs --aurora --width 1440 --height 900` AND `node scripts/verify-contrast.mjs --aurora --width 1280 --height 800` — both must exit 0.

5. **Cloud-over-text contrast regression** — any over-sky text region drops below its WCAG threshold once clouds are live, especially in the lower-sky y-range.
   Detection: `node scripts/verify-contrast.mjs --cdp-screenshot --width 1440 --height 900` AND `--width 1280 --height 800` — both must exit 0; specifically inspect the JSON report's `failing[]` array for entries in `experience`/`patents`/`skills` (the tall, scroll-swept panels).

6. **Pause-machine leaks for the new layers** — clouds/aurora continue advancing (visibly or via internal counters) while the tab is hidden, Fig. 01 is active, or reduced motion is set.
   Detection: `grep -rn "setTimeout\|setInterval" src/lib/nightsky/clouds.ts src/lib/nightsky/aurora.ts` — expect ZERO matches (Pattern 1's "zero owned timers" invariant); runtime-check by hiding the tab / navigating to Fig. 01 / toggling OS reduced-motion and confirming (via a temporary console log or the DevTools Performance panel) that `drawFrame` genuinely stops being called.

7. **Reduced-motion motion leaks** — clouds/aurora animate even once under `prefers-reduced-motion: reduce`, or the parallax nudge class is applied/animated under that preference.
   Detection: `node scripts/verify-contrast.mjs --cdp-screenshot` run with CDP's `Emulation.setEmulatedMedia({features:[{name:'prefers-reduced-motion',value:'reduce'}]})` (the same emulation mechanism `real-soak.mjs` already uses for `prefers-reduced-transparency`) — capture two screenshots ~2s apart and diff them; expect byte-identical (or near-identical, allowing for JPEG/PNG capture noise) frames. Also grep: `grep -n "prefers-reduced-motion" src/lib/nightsky/parallax.ts` — expect a `@media` gate present in the CSS and/or an `rm.matches` check before any `classList` mutation in the TS.
