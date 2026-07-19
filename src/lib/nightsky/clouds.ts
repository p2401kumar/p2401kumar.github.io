// clouds.ts — AMB-01: two drifting lower-sky cloud layers (far "wisps" +
// near "banks"), pre-rendered as seamless sprite tiles via the shared idle
// queue and wraparound-blitted inside scene.ts's single rAF tick. Mirrors
// the constellations.ts/meteors.ts handle idiom: this module owns ZERO
// animation-frame scheduling and ZERO timers — all cadence rides advance(ts, dt),
// so the clouds get scene.ts's entire pause machine (tab-hidden /
// fig-01-active / reduced-motion) for free (09-RESEARCH.md Pattern 1).
//
// Contrast-by-construction (09-UI-SPEC.md "Column governor"): both layers
// are composited into ONE reusable offscreen band buffer, then a
// viewport-fixed horizontal alpha stencil is applied with destination-in —
// alpha 1.0 across the margins, 0.15 across the content column, with an
// 80px smoothstep ramp at each column boundary (the same
// contentColumnEdges formula scene.ts/starfield.ts already mirror). Far
// peak 0.08 -> ~0.012 under text; near peak 0.13 -> ~0.0195 under text.
// The stencil is applied LIVE at blit time, never baked into the sprites —
// clouds drift, the column stays fixed.
//
// Compositing discipline: every fill in this module uses the DEFAULT
// source-over compositing (the additive blend mode caused the 05-06
// near-white failure and is banned here); destination-in is used ONLY for
// the alpha stencil, and the buffer context is reset to source-over
// immediately after. Every radial-gradient blob carries >= 4 stops (never
// a bare 0%/100% pair) per the anti-banding discipline (09-UI-SPEC.md).
//
// Module-boundary rule (05-CONTEXT.md, grep-enforced): never imports
// deck.ts — the parallax cloud-nudge hook (AMB-02 mid layer) subscribes to
// the LITERAL 'nightsky:panel-change' document event (deck.ts documents
// the detail shape { index, id, total }), mirroring constellations.ts's
// independent-listener pattern. Zero hex literals: all fills come from the
// SkyTokens bridge (--milkyway fill, --sky-horizon cooler outer falloff).

import { drainQueue, type WorkUnit } from './idle-queue';
import { rgba, type SkyTokens } from './tokens';

const TWO_PI = Math.PI * 2;

// --- Band geometry (09-UI-SPEC.md Clouds Placement — viewport-height
// fractions; canvas-internal composition geometry, exempt from the DOM
// spacing grid). The buffer band is the UNION of both layers' spreads. ---
const BAND_TOP_FRAC = 0.64; // union band top (far spread top)
const BAND_BOTTOM_FRAC = 0.85; // horizon line (near spread bottom)
/** Far ("wisps") vertical placement, as fractions of viewport height. */
const FAR_SPREAD_TOP_FRAC = 0.64;
const FAR_SPREAD_BOTTOM_FRAC = 0.8;
/** Near ("banks") vertical placement. */
const NEAR_SPREAD_TOP_FRAC = 0.71;
const NEAR_SPREAD_BOTTOM_FRAC = 0.85;

// --- Alpha ceilings (margins, full strength — 09-UI-SPEC.md table).
// Applied at blit time via the buffer's globalAlpha (sprite content is
// authored at internal alpha <= 1, so these ARE the hard peaks). ---
const FAR_PEAK_ALPHA = 0.08; // tuning range 0.05–0.10
const NEAR_PEAK_ALPHA = 0.13; // tuning range 0.10–0.16, HARD ceiling 0.18

// --- Drift (fixed CSS-px/s, matching the firefly px/s convention). ---
const FAR_SPEED_PX_S = 3;
const NEAR_SPEED_PX_S = 6;

// --- Column governor (09-UI-SPEC.md: same spirit/ramp width as the
// photo's build-time column vignette, applied live). ---
const COLUMN_ATTENUATION = 0.15;
const COLUMN_RAMP_PX = 80;

// --- Parallax cloud nudge (AMB-02 mid layer): peak 9px against the
// direction of travel (advance/index-increasing nudges LEFT), starting
// 60ms after the panel-change event, settling back to 0 over 480ms with
// the deck's own cubic-bezier(0.16, 1, 0.3, 1) ease-out — the "slightly
// offset" depth cue behind the camper's 18px/420ms ground nudge. Peak at
// the same 35% keyframe fraction as the .camper CSS animation. ---
const NUDGE_PEAK_PX = 9;
const NUDGE_DELAY_MS = 60;
const NUDGE_DURATION_MS = 480;
const NUDGE_PEAK_FRAC = 0.35;

// --- Sprite shape language (09-UI-SPEC.md "Sprite softness / scale"). ---
const FAR_BLOB_COUNT_MIN = 4;
const FAR_BLOB_COUNT_MAX = 6;
const FAR_ASPECT_MIN = 6;
const FAR_ASPECT_MAX = 10;
const NEAR_CLUSTER_COUNT_MIN = 3;
const NEAR_CLUSTER_COUNT_MAX = 5;
const NEAR_BLOBS_PER_CLUSTER_MIN = 3;
const NEAR_BLOBS_PER_CLUSTER_MAX = 4;
const NEAR_ASPECT_MIN = 2;
const NEAR_ASPECT_MAX = 3;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function randIn(min: number, max: number): number {
  return lerp(min, max, Math.random());
}

function randIntIn(min: number, max: number): number {
  return Math.round(randIn(min, max));
}

/** Content-column edges — mirrors deck.css (.panel padding clamp(18px,
 * 4vw, 32px) + .panel > * max-width 880px centered); mirrored, NOT
 * imported, per the module-boundary doctrine (the same deliberate
 * duplication scene.ts/starfield.ts document). */
function contentColumnEdges(cssWidth: number): { left: number; right: number } {
  const pad = Math.min(32, Math.max(18, cssWidth * 0.04));
  const half = Math.min(880, cssWidth - 2 * pad) / 2;
  return { left: cssWidth / 2 - half, right: cssWidth / 2 + half };
}

/** Hermite smoothstep on [0,1]. */
function smoothstep(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
}

/**
 * CSS cubic-bezier(p1x, p1y, p2x, p2y) evaluator (Newton-Raphson on the
 * x-polynomial, then sample y) — the same curve family deck.css's panel
 * transition and the .camper parallax keyframes use, evaluated in JS for
 * the canvas-internal cloud offset (a CSS transform can never touch the
 * canvas — locked invariant).
 */
function cubicBezierEase(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number
): (x: number) => number {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number): number => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number): number => ((ay * t + by) * t + cy) * t;
  const sampleDx = (t: number): number => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-5) break;
      const d = sampleDx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    return sampleY(Math.min(1, Math.max(0, t)));
  };
}

/** The deck easing family — cubic-bezier(0.16, 1, 0.3, 1) ease-out. */
const settleEase = cubicBezierEase(0.16, 1, 0.3, 1);

/** What initClouds needs from scene.ts (and nothing more). */
export interface CloudsInitOptions {
  /** The scene's parsed sky tokens — milkyway fill + skyHorizon falloff. */
  tokens: SkyTokens;
  /** Current CSS-pixel viewport size, or null while none is adopted —
   * used as a lazy-geometry fallback if draw() ever runs before the first
   * resize() adoption. */
  getViewport: () => { width: number; height: number } | null;
}

/** The handle scene.ts drives from its single rAF tick (Layer 1.5). */
export interface CloudsHandle {
  /** Advances drift offsets + the eased parallax nudge. Called once per
   * frame before draw(). */
  advance(ts: number, dt: number): void;
  /** Wraparound-blits both layers through the column-governed band buffer
   * onto the visible canvas (~4 sprite drawImage calls + one masked-buffer
   * blit — no per-frame sprite recomputation). */
  draw(ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number): void;
  /** Reduced-motion / paused "beautiful still": both layers ONCE at
   * offset 0, peak margin alpha, column-governed, nudge forced to 0. */
  drawStatic(ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number): void;
  /** Regenerates both sprites + the buffer/column geometry for a new
   * size. Last-good sprites stay on screen until the new pair drains. */
  resize(cssWidth: number, cssHeight: number): void;
  /** Mobile-ladder tier-1 seam (wired by 09-03; default false): when true,
   * draw()/drawStatic() skip the far layer. */
  setFarShed(shed: boolean): void;
  /** Removes the panel-change listener and drops sprites/buffer. */
  teardown(): void;
}

/**
 * Boots the cloud subsystem. Sprite generation is chunked through the
 * shared idle queue (one work unit per wisp/cluster) and happens ONLY on
 * resize(w, h) — never per tick. Registers an INDEPENDENT document
 * listener on the literal 'nightsky:panel-change' event for the AMB-02
 * mid-layer nudge (deck.ts is never imported).
 */
export function initClouds(options: CloudsInitOptions): CloudsHandle {
  const { tokens, getViewport } = options;
  const milkyway = tokens.milkyway;
  const skyHorizon = tokens.skyHorizon;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');

  // --- Geometry + sprite state (all CSS-pixel space, 1x buffers — cloud
  // content is soft gradient haze; the dpr upscale at the final visible
  // blit is imperceptible on it and halves the memory/fill cost). ---
  let cssWidth = 0;
  let cssHeight = 0;
  let bandHeight = 0;
  let farSprite: HTMLCanvasElement | null = null;
  let nearSprite: HTMLCanvasElement | null = null;
  let buffer: HTMLCanvasElement | null = null;
  let bufferCtx: CanvasRenderingContext2D | null = null;
  let stencil: CanvasGradient | null = null;
  /** Monotonic generation counter — a resize mid-generation invalidates
   * the in-flight sprite pair instead of adopting a stale size. */
  let generation = 0;
  let tornDown = false;
  let farShed = false;

  // --- Drift + nudge state. ---
  let farOffset = 0;
  let nearOffset = 0;
  /** Screen-space nudge px this frame (negative = left), 0 at rest. */
  let currentNudge = 0;
  /** Nudge start timestamp (event time + 60ms delay), null = settled. */
  let nudgeStartTs: number | null = null;
  /** Signed nudge peak: 9 * -direction (advance nudges LEFT). */
  let nudgePeak = 0;
  let lastPanelIndex = 0;

  /** One blob: a >=4-stop radial gradient ellipse (aspect via transform),
   * source-over onto the sprite. Drawn at x, x-W, and x+W so any content
   * overhanging either edge reappears on the other side — the general
   * form of the "rightmost ~120px repeated at the left edge" seamless-
   * tile technique (lossless wraparound at every offset). */
  function drawBlob(
    ctx: CanvasRenderingContext2D,
    spriteW: number,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    coreAlpha: number,
    stops: ReadonlyArray<readonly [number, number]>
  ): void {
    for (const x of [cx, cx - spriteW, cx + spriteW]) {
      ctx.save();
      ctx.translate(x, cy);
      ctx.scale(rx / ry, 1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
      for (const [offset, mul] of stops) {
        g.addColorStop(offset, rgba(milkyway, coreAlpha * mul));
      }
      // Cooler OUTER falloff stop only — the one sanctioned skyHorizon use.
      g.addColorStop(1, rgba(skyHorizon, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, ry, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Far-wisp gradient shape: soft falloff spread over ~65–70% of the
   * radius (5 stops incl. the skyHorizon terminator — never 0%/100%). */
  const FAR_STOPS: ReadonlyArray<readonly [number, number]> = [
    [0, 1],
    [0.32, 0.72],
    [0.68, 0.3],
    [0.88, 0.08],
  ];
  /** Near-bank gradient shape: slightly more defined (~55–65% falloff). */
  const NEAR_STOPS: ReadonlyArray<readonly [number, number]> = [
    [0, 1],
    [0.3, 0.8],
    [0.62, 0.36],
    [0.86, 0.1],
  ];

  /** Queues the far layer's elongated horizontal cirrus streaks. */
  function queueFarLayer(queue: WorkUnit[], ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const bandTopPx = BAND_TOP_FRAC * h;
    const y0 = FAR_SPREAD_TOP_FRAC * h - bandTopPx;
    const y1 = FAR_SPREAD_BOTTOM_FRAC * h - bandTopPx;
    const count = randIntIn(FAR_BLOB_COUNT_MIN, FAR_BLOB_COUNT_MAX);
    for (let i = 0; i < count; i++) {
      queue.push(() => {
        const ry = randIn(0.018, 0.034) * h;
        const aspect = randIn(FAR_ASPECT_MIN, FAR_ASPECT_MAX);
        const cx = Math.random() * w;
        const cy = lerp(y0 + ry, y1 - ry, Math.random());
        drawBlob(ctx, w, cx, cy, ry * aspect, ry, randIn(0.55, 0.75), FAR_STOPS);
      });
    }
  }

  /** Queues the near layer's rounder overlapping cloud-bank clusters. */
  function queueNearLayer(queue: WorkUnit[], ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const bandTopPx = BAND_TOP_FRAC * h;
    const y0 = NEAR_SPREAD_TOP_FRAC * h - bandTopPx;
    const y1 = NEAR_SPREAD_BOTTOM_FRAC * h - bandTopPx;
    const clusters = randIntIn(NEAR_CLUSTER_COUNT_MIN, NEAR_CLUSTER_COUNT_MAX);
    for (let i = 0; i < clusters; i++) {
      queue.push(() => {
        const clusterX = Math.random() * w;
        const clusterY = lerp(y0, y1, 0.35 + Math.random() * 0.5);
        const blobs = randIntIn(NEAR_BLOBS_PER_CLUSTER_MIN, NEAR_BLOBS_PER_CLUSTER_MAX);
        for (let b = 0; b < blobs; b++) {
          const ry = randIn(0.024, 0.042) * h;
          const aspect = randIn(NEAR_ASPECT_MIN, NEAR_ASPECT_MAX);
          const rx = ry * aspect;
          const cx = clusterX + (Math.random() - 0.5) * rx * 1.6;
          const cy = Math.min(y1 - ry * 0.4, clusterY + (Math.random() - 0.5) * ry * 1.2);
          drawBlob(ctx, w, cx, cy, rx, ry, randIn(0.5, 0.7), NEAR_STOPS);
        }
      });
    }
  }

  /** Builds the viewport-fixed column stencil: alpha 1.0 in the margins,
   * COLUMN_ATTENUATION across the content column, 80px smoothstep ramps
   * at each boundary (linear-gradient stops shaped to the smoothstep
   * curve). Only the alpha channel is load-bearing under destination-in;
   * the color stays token-sourced (zero hex). */
  function buildStencil(ctx: CanvasRenderingContext2D, w: number): CanvasGradient {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    const { left, right } = contentColumnEdges(w);
    const stopAt = (px: number, alpha: number): void => {
      g.addColorStop(Math.min(1, Math.max(0, px / w)), rgba(milkyway, alpha));
    };
    const rampAlpha = (t: number): number =>
      lerp(1, COLUMN_ATTENUATION, smoothstep(t));
    stopAt(0, 1);
    // Left boundary: full margin alpha until (left - 80), smoothstep down
    // to the column attenuation at `left`.
    stopAt(left - COLUMN_RAMP_PX, 1);
    for (const t of [0.25, 0.5, 0.75]) {
      stopAt(left - COLUMN_RAMP_PX + t * COLUMN_RAMP_PX, rampAlpha(t));
    }
    stopAt(left, COLUMN_ATTENUATION);
    // Flat attenuation across the column, then the mirrored right ramp.
    stopAt(right, COLUMN_ATTENUATION);
    for (const t of [0.25, 0.5, 0.75]) {
      stopAt(right + t * COLUMN_RAMP_PX, rampAlpha(1 - t));
    }
    stopAt(right + COLUMN_RAMP_PX, 1);
    stopAt(w, 1);
    return g;
  }

  /** (Re)creates the band buffer + stencil and kicks a chunked sprite
   * regeneration for the given size. Last-good sprites remain in use
   * until the NEW pair fully drains (never a blank cloud band). */
  function applySize(w: number, h: number): void {
    cssWidth = w;
    cssHeight = h;
    bandHeight = Math.max(1, Math.round((BAND_BOTTOM_FRAC - BAND_TOP_FRAC) * h));
    buffer = document.createElement('canvas');
    buffer.width = Math.max(1, Math.round(w));
    buffer.height = bandHeight;
    bufferCtx = buffer.getContext('2d');
    stencil = bufferCtx ? buildStencil(bufferCtx, w) : null;

    // Chunked regeneration through the shared idle queue (mirrors
    // starfield.ts's Layer-0 pattern; one work unit per wisp/cluster).
    const gen = ++generation;
    const farCanvas = document.createElement('canvas');
    farCanvas.width = Math.max(1, Math.round(w));
    farCanvas.height = bandHeight;
    const nearCanvas = document.createElement('canvas');
    nearCanvas.width = Math.max(1, Math.round(w));
    nearCanvas.height = bandHeight;
    const farCtx = farCanvas.getContext('2d');
    const nearCtx = nearCanvas.getContext('2d');
    if (!farCtx || !nearCtx) return; // no 2D context — fail silently (no-apology doctrine)
    const queue: WorkUnit[] = [];
    queueFarLayer(queue, farCtx, w, h);
    queueNearLayer(queue, nearCtx, w, h);
    drainQueue(queue, () => {
      if (gen !== generation || tornDown) return; // superseded / torn down
      farSprite = farCanvas;
      nearSprite = nearCanvas;
    });
  }

  /** Lazy-geometry fallback: adopt the scene viewport if draw() ever runs
   * before the first explicit resize() adoption. */
  function ensureGeometry(): void {
    if (buffer) return;
    const viewport = getViewport();
    if (viewport) applySize(viewport.width, viewport.height);
  }

  /** Eased nudge value (screen px, negative = left) at timestamp ts:
   * rises to the signed peak over the first 35% of the 480ms window and
   * settles back to 0 over the rest — both segments on the deck's
   * cubic-bezier(0.16, 1, 0.3, 1) curve, mirroring the .camper keyframes. */
  function nudgeAt(ts: number): number {
    if (nudgeStartTs === null) return 0;
    const elapsed = ts - nudgeStartTs;
    if (elapsed < 0) return 0; // 60ms depth-cue delay still pending
    const t = elapsed / NUDGE_DURATION_MS;
    if (t >= 1) {
      nudgeStartTs = null; // settled — bounded by construction (T-09-03)
      return 0;
    }
    const env =
      t < NUDGE_PEAK_FRAC
        ? settleEase(t / NUDGE_PEAK_FRAC)
        : 1 - settleEase((t - NUDGE_PEAK_FRAC) / (1 - NUDGE_PEAK_FRAC));
    return nudgePeak * env;
  }

  // --- AMB-02 mid-layer hook: independent panel-change listener (detail
  // shape { index, id, total } — null-checked, malformed events no-op,
  // never throw: T-09-01). ---
  const onPanelChange = (e: Event): void => {
    const detail = (e as CustomEvent<{ index: number; id: string; total: number }>).detail;
    if (!detail || typeof detail.index !== 'number') return;
    const direction = Math.sign(detail.index - lastPanelIndex) || 1;
    lastPanelIndex = detail.index;
    if (rm.matches) {
      // Reduced motion: apply the settle instantly — the nudge target is
      // 0, so instant == no visible motion; never animate.
      nudgeStartTs = null;
      currentNudge = 0;
      return;
    }
    nudgePeak = NUDGE_PEAK_PX * -direction; // advance (index up) nudges LEFT
    nudgeStartTs = performance.now() + NUDGE_DELAY_MS;
  };
  document.addEventListener('nightsky:panel-change', onPanelChange);

  /** Wraparound blit of one layer into the band buffer: the SAME tile
   * drawn twice at integer-rounded offsets (sub-pixel drawImage positions
   * would force the bilinear-resample path). `nudge` is a transient
   * screen-space displacement ADDED on top of the persistent drift offset
   * (the drift itself is never mutated by parallax). */
  function blitLayer(
    ctx: CanvasRenderingContext2D,
    sprite: HTMLCanvasElement,
    alpha: number,
    offset: number,
    nudge: number
  ): void {
    const w = buffer ? buffer.width : 0;
    if (w <= 0) return;
    // Screen shift left = offset increase; a left nudge (negative px)
    // therefore ADDS to the effective offset before wrapping, keeping the
    // two-copy blit gap-free at every nudge value.
    const eff = offset - nudge;
    const x = Math.round(((eff % w) + w) % w) - w;
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, x, 0, w, bandHeight);
    ctx.drawImage(sprite, x + w, 0, w, bandHeight);
    ctx.globalAlpha = 1;
  }

  /** Shared render body: compose layers into the band buffer, apply the
   * destination-in column stencil, blit the governed band to the visible
   * canvas. ~4 sprite drawImage calls + 1 stencil fill + 1 buffer blit. */
  function render(
    ctx: CanvasRenderingContext2D,
    cssH: number,
    farOff: number,
    nearOff: number,
    nudge: number
  ): void {
    ensureGeometry();
    if (!buffer || !bufferCtx || !stencil) return;
    bufferCtx.clearRect(0, 0, buffer.width, buffer.height);
    if (!farShed && farSprite) blitLayer(bufferCtx, farSprite, FAR_PEAK_ALPHA, farOff, nudge);
    if (nearSprite) blitLayer(bufferCtx, nearSprite, NEAR_PEAK_ALPHA, nearOff, nudge);
    // Column governor — destination-in alpha stencil, then IMMEDIATELY
    // back to the source-over default (compositing-state hygiene).
    bufferCtx.globalCompositeOperation = 'destination-in';
    bufferCtx.fillStyle = stencil;
    bufferCtx.fillRect(0, 0, buffer.width, buffer.height);
    bufferCtx.globalCompositeOperation = 'source-over';
    ctx.drawImage(buffer, 0, Math.round(BAND_TOP_FRAC * cssH));
  }

  function advance(ts: number, dt: number): void {
    const dtS = dt / 1000;
    farOffset += FAR_SPEED_PX_S * dtS;
    nearOffset += NEAR_SPEED_PX_S * dtS;
    // Keep the persistent offsets bounded (wrap-equivalent — the blit
    // wraps modulo tile width anyway, this just prevents float growth).
    const w = buffer ? buffer.width : 0;
    if (w > 0) {
      farOffset %= w;
      nearOffset %= w;
    }
    currentNudge = nudgeAt(ts);
  }

  function draw(ctx: CanvasRenderingContext2D, _cssWidth: number, cssH: number): void {
    render(ctx, cssH, farOffset, nearOffset, currentNudge);
  }

  function drawStatic(ctx: CanvasRenderingContext2D, _cssWidth: number, cssH: number): void {
    // The reduced-motion "beautiful still": offset 0, peak margin alpha,
    // column-governed, nudge contribution forced to 0.
    render(ctx, cssH, 0, 0, 0);
  }

  function resize(w: number, h: number): void {
    if (w === cssWidth && h === cssHeight && buffer) return;
    applySize(w, h);
  }

  function setFarShed(shed: boolean): void {
    farShed = shed;
  }

  function teardown(): void {
    tornDown = true;
    generation++; // invalidate any in-flight sprite generation
    document.removeEventListener('nightsky:panel-change', onPanelChange);
    farSprite = null;
    nearSprite = null;
    buffer = null;
    bufferCtx = null;
    stencil = null;
    nudgeStartTs = null;
    currentNudge = 0;
  }

  return { advance, draw, drawStatic, resize, setFarShed, teardown };
}
