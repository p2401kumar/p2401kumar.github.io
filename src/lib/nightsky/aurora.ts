// aurora.ts — AMB-03: the one sanctioned added light source. Three
// left-margin curtains with noise-driven undulating top edges breathe
// together in alpha (0.07–0.17) and height (0.49H–0.55H) over a ~20s
// cycle, hard-capped in code at AURORA_ALPHA_CEILING (0.20) regardless
// of breathing phase. Mirrors the clouds.ts/constellations.ts handle
// idiom: this module owns ZERO animation-frame scheduling and ZERO
// timers — all cadence rides advance(ts), so the aurora gets scene.ts's
// entire pause machine (tab-hidden / fig-01-active / reduced-motion)
// for free (09-RESEARCH.md Pattern 1).
//
// Contrast-by-construction (09-UI-SPEC.md Aurora Placement): curtains
// never move horizontally, so a HARD margin boundary is invisible and
// safe — every path x-coordinate is bounded inside
// [8, columnLeft - 8] (the mirrored contentColumnEdges formula), so the
// aurora renders ZERO pixels inside the content column at every frame,
// by construction. The RIGHT margin (the photo's Milky-Way core and the
// mwBox luminance comparator, x:0.80–0.98) stays entirely clear so the
// verify-contrast --aurora ceiling check compares against the photo's
// own brightness, never the aurora's.
//
// Compositing discipline: every fill uses the DEFAULT source-over
// compositing (the additive blend mode caused the 05-06 near-white
// failure and is banned for broad low-alpha area fills). The vertical
// gradient carries 5 stops (never a bare 0%/100% pair) per the
// anti-banding discipline, and the live breathing alpha is applied via
// globalAlpha at fill time — so the composited contribution of any
// aurora pixel is analytically bounded by tokenBrightness x 0.20, which
// is exactly what the verify-time auroraPeak < mwPeak assertion needs.
//
// Update cadence — the anti-stutter spec (09-UI-SPEC.md): the alpha is
// a pure sine evaluated fresh EVERY frame (smooth, effectively free);
// the curtain SHAPE (noise repaint / top-edge geometry) is throttled to
// every `shapeEveryN` frames (default 4; setShapeThrottle is 09-03's
// mobile-ladder tier-2 seam) via a module frame counter. Each repaint
// advances the noise phase by a drift bounded to <= 1.5px of
// curtain-edge x-displacement per repaint step at the 1440 reference
// width — the shape ripples continuously and slowly; it never jumps.
//
// Draw order (09-UI-SPEC Aurora Placement): scene.ts composites the
// aurora AFTER the Layer-0 blit (which bakes the moon) and BEFORE the
// clouds — physically correct (the aurora, ~100km up, is vastly closer
// than the moon), so the moon dims very slightly through the curtain at
// breathing peaks. Intentional, not a defect.
//
// Module-boundary rule (05-CONTEXT.md, grep-enforced): never imports
// deck.ts or any fig01 module. Zero hex literals: the sole fill color
// is tokens.aurora, read through the SkyTokens bridge.

import { rgba, type SkyTokens } from './tokens';

const TWO_PI = Math.PI * 2;

// --- Breathing envelope (09-UI-SPEC.md Aurora: midpoint 0.12,
// amplitude ±0.05 → range 0.07–0.17, period ~20s locked). ---
const AURORA_BREATH_MID = 0.12;
const AURORA_BREATH_AMP = 0.05;
const AURORA_BREATH_PERIOD_MS = 20000;
/** THE hard in-code luminance cap (mirrors the moon's LIT_ALPHA ceiling
 * doctrine): the breathing envelope can never exceed this regardless of
 * tuning — it is what makes the verify-time auroraPeak < mwPeak
 * assertion stable across breathing phases (09-RESEARCH.md Pitfall 3). */
const AURORA_ALPHA_CEILING = 0.20;

// --- Vertical box (09-UI-SPEC.md Aurora Vertical box): base fixed at
// the 0.85H horizon; top oscillates 0.49H (bright/tall) to 0.55H
// (dim/short) IN PHASE with the alpha breath — one coherent swell. ---
const AURORA_BASE_FRAC = 0.85;
const AURORA_TOP_MID_FRAC = 0.52;
const AURORA_TOP_AMP_FRAC = 0.03;

// --- Margin placement (mirrors contentColumnEdges + the twinkle pool's
// 8px cushion; below the same 48px minimum margin width the aurora
// simply does not render — the twinkle pool's graceful-empty rule,
// same governing constant value, 09-UI-SPEC.md). ---
const AURORA_MARGIN_CUSHION = 8;
const AURORA_MIN_MARGIN_WIDTH = 48;

// --- Noise table (09-RESEARCH.md Pattern 4): 96 samples, a sum of
// three mismatched non-harmonic sines (periods ~17/29/41 samples)
// normalized to [0,1], sampled with linear interpolation. Fully
// DETERMINISTIC (no random jitter) so the reduced-motion static frame
// is identical every render. Built once at init; size-independent
// (the table indexes curtain-edge px through NOISE_PX_PER_SAMPLE). ---
const NOISE_SAMPLES = 96;
const NOISE_PERIODS = [17, 29, 41];
/** Curtain-edge px represented by one noise-table sample step. */
const NOISE_PX_PER_SAMPLE = 8;
/** Max curtain-edge x-displacement per shape repaint (CSS px at the
 * 1440 reference width) — 09-UI-SPEC.md's anti-stutter step ceiling. */
const MAX_EDGE_STEP_PX = 1.5;
/** Noise-phase drift per repaint, in table samples: bounded so the edge
 * pattern translates exactly MAX_EDGE_STEP_PX per repaint step. */
const SHAPE_DRIFT_PER_REPAINT = MAX_EDGE_STEP_PX / NOISE_PX_PER_SAMPLE;

/** Vertical waviness of each curtain's top edge (fraction of viewport
 * height — ~±22px at 900). Small vs the 0.49H–0.55H breathing span so
 * the undulation reads as ribbon texture, not a second breath. */
const EDGE_WAVE_AMP_FRAC = 0.025;
/** Horizontal sampling step for the top-edge path (CSS px). */
const EDGE_SAMPLE_STEP_PX = 6;

/** Three curtains of varying widths/heights (fractions of the margin
 * box width), each with an INDEPENDENT noise phase offset so the three
 * never undulate in lockstep (09-UI-SPEC.md Curtain count / geometry).
 * All values fixed — deterministic layout for a deterministic still. */
const CURTAINS = [
  { x0Frac: 0.02, x1Frac: 0.36, topExtraFrac: 0.0, phaseOffset: 0 },
  { x0Frac: 0.42, x1Frac: 0.64, topExtraFrac: 0.018, phaseOffset: 37.3 },
  { x0Frac: 0.7, x1Frac: 0.98, topExtraFrac: 0.008, phaseOffset: 71.9 },
] as const;

/** Vertical falloff stops (5 — anti-banding, never a bare pair): soft
 * fade-in at the wavy top edge, brightest in the upper body, blending
 * to zero exactly at the 0.85H horizon base (09-UI-SPEC.md Palette).
 * Stop alphas are RELATIVE — the live breathing alpha multiplies them
 * via globalAlpha at fill time, keeping the 0.20 cap analytic. */
const GRADIENT_STOPS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.15, 1],
  [0.5, 0.62],
  [0.8, 0.28],
  [1, 0],
];

export interface AuroraHandle {
  advance(ts: number): void;
  draw(ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number): void;
  drawStatic(ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number): void;
  resize(cssWidth: number, cssHeight: number): void;
  setShapeThrottle(everyN: number): void;
  teardown(): void;
}

export interface AuroraOptions {
  tokens: SkyTokens;
  getViewport: () => { width: number; height: number } | null;
}

/** Content-column edges — mirrors deck.css (.panel padding clamp(18px,
 * 4vw, 32px) + .panel > * max-width 880px centered); mirrored, NOT
 * imported, per the module-boundary doctrine (the same deliberate
 * duplication scene.ts/starfield.ts/clouds.ts document). */
function contentColumnEdges(cssWidth: number): { left: number; right: number } {
  const pad = Math.min(32, Math.max(18, cssWidth * 0.04));
  const half = Math.min(880, cssWidth - 2 * pad) / 2;
  return { left: cssWidth / 2 - half, right: cssWidth / 2 + half };
}

interface CurtainGeometry {
  path: Path2D;
  gradient: CanvasGradient;
}

export function initAurora(options: AuroraOptions): AuroraHandle {
  const { tokens } = options;

  // Deterministic noise table — built once (size-independent).
  const noise = new Float32Array(NOISE_SAMPLES);
  {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < NOISE_SAMPLES; i++) {
      let v = 0;
      for (const p of NOISE_PERIODS) v += Math.sin((i / p) * TWO_PI);
      noise[i] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const span = max - min || 1;
    for (let i = 0; i < NOISE_SAMPLES; i++) noise[i] = (noise[i] - min) / span;
  }

  /** Wrapped linear-interpolated table lookup at a fractional index. */
  const noiseAt = (idx: number): number => {
    const wrapped = ((idx % NOISE_SAMPLES) + NOISE_SAMPLES) % NOISE_SAMPLES;
    const i0 = Math.floor(wrapped);
    const i1 = (i0 + 1) % NOISE_SAMPLES;
    const t = wrapped - i0;
    return noise[i0] + (noise[i1] - noise[i0]) * t;
  };

  let shapeEveryN = 4;
  let frameCounter = 0;
  /** Accumulated noise-phase drift (table samples) — advances by the
   * bounded SHAPE_DRIFT_PER_REPAINT on each scheduled repaint only. */
  let drift = 0;
  /** Breathing sine captured at the last shape repaint (the SHAPE rides
   * the throttle; the alpha sine below is evaluated every frame). */
  let shapeSin = 0;
  /** Last advance() timestamp — draw() evaluates the live alpha at it. */
  let lastTs = 0;
  let geometry: CurtainGeometry[] | null = null;
  let needsRebuild = true;
  let torndown = false;

  /** Breathing sine at ts — shared by alpha and curtain-top height so
   * the inhale/exhale reads as ONE coherent swell (09-UI-SPEC.md). */
  const breathSin = (ts: number): number => Math.sin((ts / AURORA_BREATH_PERIOD_MS) * TWO_PI);

  /** Live alpha: envelope 0.07–0.17, then the HARD cap — the envelope
   * can never exceed AURORA_ALPHA_CEILING regardless of phase. */
  const liveAlpha = (ts: number): number => {
    const envelope = AURORA_BREATH_MID + AURORA_BREATH_AMP * breathSin(ts);
    return Math.max(0, Math.min(envelope, AURORA_ALPHA_CEILING));
  };

  /** Builds the three curtain paths + gradients for the given breathing
   * sine value (s = +1 bright/tall, -1 dim/short) and noise drift.
   * Returns null when the left margin is too narrow to host anything
   * (graceful empty — same rule as the twinkle margin pool). */
  const buildGeometry = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    s: number,
    driftSamples: number
  ): CurtainGeometry[] | null => {
    const { left: columnLeft } = contentColumnEdges(w);
    const boxX0 = AURORA_MARGIN_CUSHION;
    const boxX1 = columnLeft - AURORA_MARGIN_CUSHION;
    if (boxX1 - boxX0 < AURORA_MIN_MARGIN_WIDTH) return null;

    const boxWidth = boxX1 - boxX0;
    const baseY = AURORA_BASE_FRAC * h;
    // In-phase height breath: bright (s=+1) → tall (top 0.49H);
    // dim (s=-1) → short (top 0.55H).
    const topFrac = AURORA_TOP_MID_FRAC - AURORA_TOP_AMP_FRAC * s;
    const waveAmp = EDGE_WAVE_AMP_FRAC * h;

    const out: CurtainGeometry[] = [];
    for (const c of CURTAINS) {
      const x0 = boxX0 + c.x0Frac * boxWidth;
      const x1 = boxX0 + c.x1Frac * boxWidth;
      const topBase = (topFrac + c.topExtraFrac) * h;
      const path = new Path2D();
      path.moveTo(x0, baseY);
      let minTop = baseY;
      for (let x = x0; ; x += EDGE_SAMPLE_STEP_PX) {
        const xc = Math.min(x, x1);
        const idx = (xc - x0) / NOISE_PX_PER_SAMPLE + c.phaseOffset + driftSamples;
        const y = topBase + (noiseAt(idx) - 0.5) * 2 * waveAmp;
        path.lineTo(xc, y);
        if (y < minTop) minTop = y;
        if (xc >= x1) break;
      }
      path.lineTo(x1, baseY);
      path.closePath();
      const gradient = ctx.createLinearGradient(0, minTop, 0, baseY);
      for (const [pos, a] of GRADIENT_STOPS) gradient.addColorStop(pos, rgba(tokens.aurora, a));
      out.push({ path, gradient });
    }
    return out;
  };

  /** Fills the curtains with the DEFAULT source-over compositing at the
   * given (already-capped) alpha via globalAlpha — reset on restore. */
  const fillCurtains = (
    ctx: CanvasRenderingContext2D,
    curtains: CurtainGeometry[],
    alpha: number
  ): void => {
    ctx.save();
    ctx.globalAlpha = alpha;
    for (const c of curtains) {
      ctx.fillStyle = c.gradient;
      ctx.fill(c.path);
    }
    ctx.restore();
  };

  return {
    advance(ts: number): void {
      if (torndown) return;
      lastTs = ts;
      frameCounter++;
      if (frameCounter % shapeEveryN === 0) {
        // Scheduled shape repaint: advance the bounded drift and rebuild
        // the geometry at the current breathing phase on the next draw.
        drift += SHAPE_DRIFT_PER_REPAINT;
        shapeSin = breathSin(ts);
        needsRebuild = true;
      } else if (needsRebuild) {
        // Resize-forced rebuild between repaint ticks: use the current
        // breathing phase (drift untouched — no extra edge step).
        shapeSin = breathSin(ts);
      }
    },
    draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
      if (torndown) return;
      if (needsRebuild || !geometry) {
        geometry = buildGeometry(ctx, w, h, shapeSin, drift);
        needsRebuild = false;
      }
      if (!geometry) return; // margin too narrow — graceful empty
      fillCurtains(ctx, geometry, liveAlpha(lastTs));
    },
    drawStatic(ctx: CanvasRenderingContext2D, w: number, h: number): void {
      if (torndown) return;
      // The reduced-motion fixed phase (09-UI-SPEC.md Reduced-Motion
      // table): mid-breath EXACTLY — alpha 0.12, top 0.52H, drift 0.
      // Deterministic: same still every render.
      const staticGeometry = buildGeometry(ctx, w, h, 0, 0);
      if (!staticGeometry) return;
      fillCurtains(ctx, staticGeometry, AURORA_BREATH_MID);
    },
    resize(_cssWidth: number, _cssHeight: number): void {
      if (torndown) return;
      // Curtain x-positions/widths/box derive from the draw-time
      // viewport — dropping the cached geometry is sufficient (the
      // noise table persists; it is size-independent).
      geometry = null;
      needsRebuild = true;
    },
    setShapeThrottle(everyN: number): void {
      // 09-03's mobile-ladder tier-2 seam: shape repaints space out
      // (same per-step drift ceiling — slower, never choppier); the
      // brightness sine stays per-frame regardless.
      shapeEveryN = Math.max(1, Math.round(everyN));
    },
    teardown(): void {
      torndown = true;
      geometry = null;
    },
  };
}
