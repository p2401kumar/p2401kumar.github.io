// scene.ts — the night-sky scene engine: the SINGLE animation-frame driver
// for the whole scene (05-04). Mirrors fig01/render.ts's proven driver
// shape (single module-scope rafId, idempotent start/stop, a drawFrame
// with clearly-sectioned layers, a renderStaticFrame reduced-motion path)
// — MIRRORED, never imported, per the nightsky/fig01 module-boundary rule
// (05-CONTEXT.md; the two engines stay independently removable).
//
// Layer-by-frequency discipline (05-RESEARCH.md Pattern 4):
//   - Layer 0 (starfield + Milky Way): generated ONCE per size by
//     starfield.ts to a detached canvas; this module only ever
//     `visibleCtx.drawImage()`-blits the finished bitmap. Layer 0 is
//     regenerated ONLY by init and the debounced resize handler — never
//     inside the per-frame tick.
//   - Layer 1 (camper silhouette + copper glow): pure DOM/CSS in
//     NightSky.astro — zero involvement here.
//   - Layer 2 (twinkle subset + fireflies): the ONLY per-frame canvas
//     work in this module. ~half of the Mid/Bright twinkle-eligible
//     metadata (≈5–8% of the total field, ~40 stars at the reference
//     viewport) plus ≤15 fireflies. Nothing else runs per frame —
//     link-firing arrives in 05-05 as a setTimeout-scheduled sparse
//     event, never per-frame dice (05-RESEARCH.md Anti-Patterns).
//
// Pitfall 3 guard (05-RESEARCH.md): this module never holds a reference
// to starfield.ts's offscreen generation context — only the finished
// detached canvas (`layer0.canvas`), blitted via the distinctly-named
// `visibleCtx`. No per-frame code path can touch Layer 0's bitmap.
//
// Pause state machine (SKY-04, wired in initNightSky below): the loop
// runs only while the tab is visible AND the fig-01 panel is NOT active
// AND the visitor has NOT requested reduced motion. The fig-01 signal
// arrives via the document-level 'nightsky:panel-change' CustomEvent
// (deck.ts's shipped Phase-4 contract) subscribed by its LITERAL event
// name — this module never imports deck.ts or any fig01 module.
//
// Coordinate convention: identical to starfield.ts/fig01 — the visible
// canvas backing store is sized cssSize * dpr (dpr capped at 2), then
// setTransform(dpr,0,0,dpr,0,0) is applied once so all draw calls below
// (including the Layer-0 blit destination rect and the star metadata
// positions) use plain CSS-pixel coordinates.

import { generateLayer0, type Layer0Result, type StarMeta } from './starfield';
import { getSkyTokens, rgba, type SkyTokens } from './tokens';

const TWO_PI = Math.PI * 2;

// --- Twinkle tuning (05-UI-SPEC.md "Ambient loop": ~40 stars, period
// 2–4s random per star, amplitude ±0.15–0.25 around base alpha — never a
// hard flicker; unsynchronized phases per 05-RESEARCH.md Pattern 2). ---
const TWINKLE_PERIOD_MIN_MS = 2000;
const TWINKLE_PERIOD_MAX_MS = 4000;
const TWINKLE_AMPLITUDE_MIN = 0.15;
const TWINKLE_AMPLITUDE_MAX = 0.25;
/** Fraction of the Mid/Bright twinkle-eligible metadata actually animated.
 * Mid+Bright bands are ~13% of the total field (starfield.ts BANDS), so
 * halving lands at ~6.5% of all stars — inside the locked 5–8% window,
 * ~40–45 stars at the 1440×900 reference viewport (05-UI-SPEC.md). */
const TWINKLE_SUBSET_FRACTION = 0.5;

// --- Firefly tuning (05-UI-SPEC.md Spacing + "Ambient loop" tables:
// count 9 of the ≤15 locked ceiling, radius 1.5–2.5px, bottom-25% ground
// band, 4–8px/s gentle wander, alpha pulse 0.4–0.9 over 3–5s, --accent
// copper tint — the ONLY Layer-2 use of the accent). ---
const FIREFLY_COUNT = 9;
const FIREFLY_RADIUS_MIN = 1.5;
const FIREFLY_RADIUS_MAX = 2.5;
const FIREFLY_SPEED_MIN = 4; // CSS px/s
const FIREFLY_SPEED_MAX = 8;
const FIREFLY_PULSE_MIN_MS = 3000;
const FIREFLY_PULSE_MAX_MS = 5000;
const FIREFLY_ALPHA_MIN = 0.4;
const FIREFLY_ALPHA_MAX = 0.9;
/** Ground band top edge as a fraction of viewport height (bottom 25%). */
const FIREFLY_BAND_TOP = 0.75;
/** Heading wander rate, radians/s — a gentle random walk of the heading
 * so drift never reads as a straight line (05-UI-SPEC.md). */
const FIREFLY_TURN_RATE = 1.4;
/** Soft halo radius multiplier over the core dot (layered-gradient glow,
 * mirroring fig01's no-shadowBlur doctrine). */
const FIREFLY_HALO_SCALE = 3;

/** Debounce settle (ms) before a resize regenerates Layer 0
 * (05-RESEARCH.md Pattern 3: 200–300ms; never regenerate per tick). */
const RESIZE_DEBOUNCE_MS = 250;

/** Frame-delta clamp (ms) so a background-tab gap never teleports
 * fireflies (same 50ms clamp fig01/render.ts uses). */
const MAX_FRAME_DELTA_MS = 50;

interface TwinkleStar extends StarMeta {
  periodMs: number;
  phase: number;
  amplitude: number;
}

interface Firefly {
  x: number;
  y: number;
  heading: number; // radians
  speed: number; // CSS px/s
  radius: number;
  pulsePeriodMs: number;
  pulsePhase: number;
}

// --- Module-scope engine state (single scene instance per page, same
// convention as fig01/render.ts's module-level driver state). ---
let rafId: number | null = null;
let lastFrameTs = 0;
let visibleCanvas: HTMLCanvasElement | null = null;
let visibleCtx: CanvasRenderingContext2D | null = null;
let layer0: Layer0Result | null = null;
let twinkles: TwinkleStar[] = [];
let fireflies: Firefly[] = [];
let tokens: SkyTokens | null = null;
/** Monotonic generation counter — a resize that lands mid-generation
 * invalidates the in-flight result instead of adopting a stale size. */
let generation = 0;

// --- Pause-signal state (05-RESEARCH.md Pattern 6, mirroring
// fig01/interactions.ts's updateRunState shape — mirrored, not imported).
// Listeners are registered per-init inside initNightSky; these flags and
// the media query live at module scope like fig01's equivalents. ---
const rm = matchMedia('(prefers-reduced-motion: reduce)');
let tabVisible = !document.hidden;
let fig01Active = false;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** Draws the Mid/Bright twinkle subset from the Layer-0 star metadata:
 * per-star `alpha = baseAlpha + amplitude * sin(ts/period + phase)`
 * composited over the star's own baked-in disk (one sin + one arc per
 * twinkling star per frame — the whole twinkle budget). */
function seedTwinkles(twinkleStars: StarMeta[]): void {
  const target = Math.max(1, Math.round(twinkleStars.length * TWINKLE_SUBSET_FRACTION));
  // Uniform stride sampling keeps the subset spatially spread without a
  // shuffle allocation; metadata order is already random scatter order.
  const stride = twinkleStars.length / target;
  twinkles = [];
  for (let i = 0; i < target; i++) {
    const star = twinkleStars[Math.min(twinkleStars.length - 1, Math.floor(i * stride))];
    twinkles.push({
      ...star,
      periodMs: lerp(TWINKLE_PERIOD_MIN_MS, TWINKLE_PERIOD_MAX_MS, Math.random()),
      phase: Math.random() * TWO_PI,
      amplitude: lerp(TWINKLE_AMPLITUDE_MIN, TWINKLE_AMPLITUDE_MAX, Math.random()),
    });
  }
}

/** (Re)seeds the firefly flock inside the bottom-25% ground band for the
 * given CSS-pixel viewport size. */
function seedFireflies(cssWidth: number, cssHeight: number): void {
  const bandTop = cssHeight * FIREFLY_BAND_TOP;
  fireflies = [];
  for (let i = 0; i < FIREFLY_COUNT; i++) {
    fireflies.push({
      x: Math.random() * cssWidth,
      y: lerp(bandTop, cssHeight, Math.random()),
      heading: Math.random() * TWO_PI,
      speed: lerp(FIREFLY_SPEED_MIN, FIREFLY_SPEED_MAX, Math.random()),
      radius: lerp(FIREFLY_RADIUS_MIN, FIREFLY_RADIUS_MAX, Math.random()),
      pulsePeriodMs: lerp(FIREFLY_PULSE_MIN_MS, FIREFLY_PULSE_MAX_MS, Math.random()),
      pulsePhase: Math.random() * TWO_PI,
    });
  }
}

/** Advances one firefly by `dtMs`: gentle heading random-walk + constant
 * slow speed, reflected back into the ground band at its edges. */
function advanceFirefly(f: Firefly, dtMs: number, cssWidth: number, cssHeight: number): void {
  const dtS = dtMs / 1000;
  f.heading += (Math.random() - 0.5) * 2 * FIREFLY_TURN_RATE * dtS;
  f.x += Math.cos(f.heading) * f.speed * dtS;
  f.y += Math.sin(f.heading) * f.speed * dtS;
  const bandTop = cssHeight * FIREFLY_BAND_TOP;
  if (f.x < 0 || f.x > cssWidth) {
    f.x = Math.min(cssWidth, Math.max(0, f.x));
    f.heading = Math.PI - f.heading;
  }
  if (f.y < bandTop || f.y > cssHeight) {
    f.y = Math.min(cssHeight, Math.max(bandTop, f.y));
    f.heading = -f.heading;
  }
}

/**
 * One animated frame: blit Layer 0 FIRST, then Layer-2 work ONLY —
 * the twinkle subset and the firefly flock. Nothing else may ever be
 * added to the per-frame path except 05-05's constellation rendering
 * (which slots between the blit and the fireflies).
 */
function drawFrame(ts: number): void {
  if (!visibleCtx || !layer0 || !tokens) return;
  const dt = Math.min(ts - lastFrameTs, MAX_FRAME_DELTA_MS);
  lastFrameTs = ts;
  const w = layer0.cssWidth;
  const h = layer0.cssHeight;

  // --- Layer 0: blit the pre-rendered bitmap (never regenerate here;
  // the destination rect is CSS-pixel space thanks to the dpr transform,
  // so the device-pixel bitmap lands 1:1 on device pixels — crisp). ---
  visibleCtx.clearRect(0, 0, w, h);
  visibleCtx.drawImage(layer0.canvas, 0, 0, w, h);

  // --- Layer 2a: twinkle subset (unsynchronized sine alpha wobble). ---
  for (const s of twinkles) {
    const alpha = clamp01(s.baseAlpha + s.amplitude * Math.sin(ts / s.periodMs + s.phase));
    visibleCtx.beginPath();
    visibleCtx.fillStyle = rgba(s.color, alpha);
    visibleCtx.arc(s.x, s.y, s.radius, 0, TWO_PI);
    visibleCtx.fill();
  }

  // --- Layer 2b: fireflies (drift + soft copper pulse; layered radial
  // gradient halo, never shadowBlur — fig01's glow doctrine). ---
  const accent = tokens.accent;
  for (const f of fireflies) {
    advanceFirefly(f, dt, w, h);
    const pulse = 0.5 + 0.5 * Math.sin((ts / f.pulsePeriodMs) * TWO_PI + f.pulsePhase);
    const alpha = lerp(FIREFLY_ALPHA_MIN, FIREFLY_ALPHA_MAX, pulse);
    const haloR = f.radius * FIREFLY_HALO_SCALE;
    const halo = visibleCtx.createRadialGradient(f.x, f.y, 0, f.x, f.y, haloR);
    halo.addColorStop(0, rgba(accent, alpha * 0.35));
    halo.addColorStop(1, rgba(accent, 0));
    visibleCtx.fillStyle = halo;
    visibleCtx.beginPath();
    visibleCtx.arc(f.x, f.y, haloR, 0, TWO_PI);
    visibleCtx.fill();
    visibleCtx.beginPath();
    visibleCtx.fillStyle = rgba(accent, alpha);
    visibleCtx.arc(f.x, f.y, f.radius, 0, TWO_PI);
    visibleCtx.fill();
  }
}

/**
 * Starts the single consolidated animation loop. Idempotent: a no-op
 * while already running (guarded by the single module-scope `rafId`) —
 * exactly fig01/render.ts's startAnimationLoop shape.
 */
function startAnimationLoop(): void {
  if (rafId !== null) return;
  lastFrameTs = performance.now();
  const tick = (ts: number): void => {
    drawFrame(ts);
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

/** Cancels the pending frame, if any, and leaves no frame scheduled. */
function stopAnimationLoop(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/**
 * Renders exactly ONE complete static frame with no loop scheduled — the
 * SKY-04 reduced-motion composition and the paused/interim repaint path.
 * Layer 0 already bakes EVERY star (including the twinkle-eligible ones)
 * at its fixed base alpha, so the blit alone IS "all stars at base
 * alpha"; Layer 1 (camper + glow) is DOM/CSS in NightSky.astro. Twinkle
 * and fireflies are fully OFF here — removed, not dampened
 * (05-UI-SPEC.md reduced-motion table, WCAG C39).
 */
function renderStaticFrame(): void {
  if (!visibleCtx || !layer0) return;
  visibleCtx.clearRect(0, 0, layer0.cssWidth, layer0.cssHeight);
  visibleCtx.drawImage(layer0.canvas, 0, 0, layer0.cssWidth, layer0.cssHeight);
}

/**
 * The run-state gate (05-RESEARCH.md Pattern 6, mirroring
 * fig01/interactions.ts's updateRunState): the loop runs only while the
 * tab is visible AND fig-01 is not the active panel AND reduced motion
 * is not requested. Idempotent — safe to call from every signal source.
 */
function updateRunState(): void {
  const shouldRun = tabVisible && !fig01Active && !rm.matches;
  if (shouldRun) {
    startAnimationLoop();
  } else {
    stopAnimationLoop();
  }
}

/** Sizes the visible canvas backing store to the adopted Layer-0 result's
 * device-pixel dimensions and re-applies the CSS-pixel transform (setting
 * width/height resets any prior transform). */
function sizeVisibleCanvas(result: Layer0Result): void {
  if (!visibleCanvas || !visibleCtx) return;
  visibleCanvas.width = result.canvas.width;
  visibleCanvas.height = result.canvas.height;
  visibleCtx.setTransform(result.dpr, 0, 0, result.dpr, 0, 0);
}

/** Adopts a freshly generated Layer-0 result: resize the visible backing
 * store, reseed Layer-2 state for the new bounds, paint one frame
 * immediately (so paused/reduced-motion states never show a stale or
 * blank scene), then re-evaluate the run state. */
function adoptLayer0(result: Layer0Result): void {
  layer0 = result;
  sizeVisibleCanvas(result);
  seedTwinkles(result.twinkleStars);
  seedFireflies(result.cssWidth, result.cssHeight);
  renderStaticFrame();
  updateRunState();
}

/** Kicks off a (re)generation of Layer 0 at the current viewport size,
 * discarding the result if a newer generation supersedes it or the scene
 * has been torn down. */
function regenerateLayer0(): void {
  const gen = ++generation;
  generateLayer0(window.innerWidth, window.innerHeight, (result) => {
    if (gen !== generation) return; // superseded by a newer resize/init
    adoptLayer0(result);
  });
}

/**
 * Boots the night-sky scene engine on the given host element (the
 * `.nightsky-host` div NightSky.astro renders; the visible canvas is its
 * `#nightsky-canvas` child — a stable DOM contract since 05-03).
 *
 * Reads sky tokens once, generates Layer 0 via starfield.ts (chunked,
 * idle-scheduled), and — motion preference permitting — runs the single
 * animation loop. Under prefers-reduced-motion the loop NEVER starts:
 * one static complete frame is painted instead, and the live matchMedia
 * 'change' listener re-branches if the OS setting flips mid-session.
 *
 * Returns a teardown that stops the loop and removes every listener this
 * init registered.
 */
export function initNightSky(root: HTMLElement): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>('#nightsky-canvas');
  const ctx = canvas?.getContext('2d') ?? null;
  if (!canvas || !ctx) {
    // No canvas / no 2D context — fail silently (the documented
    // no-apology fallback: the page simply keeps its flat background).
    return () => {};
  }
  visibleCanvas = canvas;
  visibleCtx = ctx;
  tokens = getSkyTokens();

  // --- Debounced resize → regenerate Layer 0 once the gesture settles
  // (never per resize tick; the loop itself is left untouched here). ---
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  const onResize = (): void => {
    if (resizeTimer !== null) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      regenerateLayer0();
    }, RESIZE_DEBOUNCE_MS);
  };
  window.addEventListener('resize', onResize);

  // Initial state + generation. Motion preference is applied first: under
  // reduced motion adoptLayer0's completion path paints the static frame
  // and updateRunState refuses to start the loop (rm.matches gates it).
  tabVisible = !document.hidden;
  regenerateLayer0();

  return function teardown(): void {
    generation++; // invalidate any in-flight generation
    stopAnimationLoop();
    window.removeEventListener('resize', onResize);
    if (resizeTimer !== null) {
      clearTimeout(resizeTimer);
      resizeTimer = null;
    }
    visibleCanvas = null;
    visibleCtx = null;
    layer0 = null;
    twinkles = [];
    fireflies = [];
  };
}
