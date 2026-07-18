// starfield.ts — Layer 0 generator: power-law starfield + Milky Way band
// (SPIKE.md's spike-validated zero-dependency scatter+gradient technique),
// pre-rendered ONCE per size to a DETACHED, never-DOM-attached canvas via
// chunked, idle-scheduled generation (05-RESEARCH.md Pattern 3). This
// module draws nothing to any visible canvas and starts no per-frame
// animation loop — scene.ts (05-04) owns the per-frame drawImage() blit +
// Layer 2 twinkle/firefly/beam work on top of the bitmap this module
// produces.
//
// Pitfall 3 (05-RESEARCH.md): the offscreen generation context below is
// named distinctly (`layer0Ctx`), never returned or exposed to any
// per-frame code path — callers only ever receive the finished detached
// <canvas> to drawImage()-blit, never this module's own context reference.
//
// Coordinate convention mirrors fig01/render.ts's `layout()`: the canvas
// backing store is sized to cssSize * dpr, then `ctx.setTransform(dpr, 0,
// 0, dpr, 0, 0)` is applied once so every subsequent draw call below uses
// plain CSS-pixel coordinates (0..cssWidth, 0..cssHeight) — Layer 2
// (05-04) should apply the identical transform to its own visible canvas
// so star metadata positions/radii here are directly reusable without
// re-deriving a DPR factor per read.

import { getSkyTokens, rgba, type RgbTriple } from './tokens';

/** DPR cap — identical doctrine to fig01/deck (PROJECT.md constraints):
 * never exceed 2, mirrored (not imported) per the nightsky/fig01
 * module-boundary rule (05-CONTEXT.md). */
export function capDpr(): number {
  return Math.min((typeof devicePixelRatio === 'number' ? devicePixelRatio : 1) || 1, 2);
}

/** Star magnitude bands, per 05-UI-SPEC.md's "Star density & magnitude
 * bands" table — a power-law distribution (many faint, few bright). */
type MagnitudeBand = 'faintest' | 'dim' | 'mid' | 'bright';

interface BandSpec {
  band: MagnitudeBand;
  share: number; // fraction of total star count
  radius: [number, number]; // CSS-px range
  alpha: [number, number]; // alpha range
  /** Only Mid + Bright bands are ever twinkle-eligible (05-UI-SPEC.md —
   * the faint majority never twinkles, imperceptible + wasteful cost). */
  twinkleEligible: boolean;
}

const BANDS: BandSpec[] = [
  { band: 'faintest', share: 0.65, radius: [0.5, 0.7], alpha: [0.1, 0.2], twinkleEligible: false },
  { band: 'dim', share: 0.22, radius: [0.7, 1.0], alpha: [0.25, 0.4], twinkleEligible: false },
  { band: 'mid', share: 0.1, radius: [1.0, 1.4], alpha: [0.45, 0.65], twinkleEligible: true },
  { band: 'bright', share: 0.03, radius: [1.4, 2.0], alpha: [0.7, 1.0], twinkleEligible: true },
];

/** Power-law magnitude bias exponent (SPIKE.md: `Math.pow(rand, 2.2)`). */
const MAGNITUDE_BIAS = 2.2;

/** Reference viewport (1440x900) star count, and the floor/cap that keep
 * density visually consistent as viewport area scales (05-UI-SPEC.md). */
const REFERENCE_AREA = 1440 * 900;
const REFERENCE_STAR_COUNT = 700;
const STAR_COUNT_FLOOR = 350;
const STAR_COUNT_CAP = 1200;

/** Milky Way band geometry + composite params — SPIKE.md's "Contract for
 * 05-03" section, transcribed verbatim (not re-derived). */
const MW_TOP_X_FRACTION = 0.63;
const MW_HORIZON_X_FRACTION = 0.87;
const MW_HAZE_PASSES: number = 4;
const MW_HAZE_BLOBS_PER_PASS = 22;
const MW_FINE_DUST_COUNT = 1400;
const MW_COARSE_DUST_COUNT = 260;
/** Reference viewport height the haze radius/jitter constants below were
 * spike-tuned against (SPIKE.md screenshots were captured at 900 CSS px
 * height) — scaled per-generation by the actual cssHeight. */
const MW_REFERENCE_HEIGHT = 900;
const MW_REFERENCE_WIDTH = 1440;

/** A single generated star's metadata — the subset Layer 2 (05-04) needs
 * to redraw a twinkling star's alpha wobble on top of the Layer 0 blit.
 * Positions/radius are in CSS-pixel space (see module header). */
export interface StarMeta {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  color: RgbTriple;
}

export interface Layer0Result {
  /** The detached, never-DOM-attached canvas holding the finished Layer 0
   * bitmap (sky wash + dither + starfield + Milky Way band), sized to the
   * backing store (cssWidth/cssHeight * dpr). Blit via
   * `visibleCtx.drawImage(layer0.canvas, 0, 0, layer0.canvas.width,
   * layer0.canvas.height)` — never draw into this canvas's own context
   * again after `onDone` fires. */
  canvas: HTMLCanvasElement;
  /** CSS-pixel width/height this bitmap was generated for, so callers can
   * size the visible canvas identically. */
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  /** Twinkle-eligible star subset (Mid + Bright bands only), ~5-8% of the
   * ambient field per 05-UI-SPEC.md — Layer 2's per-frame alpha wobble
   * reads from this array, never from the full star list. */
  twinkleStars: StarMeta[];
}

type IdleDeadlineLike = { timeRemaining: () => number; didTimeout: boolean };
type WorkUnit = () => void;

/** Feature-detects requestIdleCallback, falling back to a setTimeout shim
 * that mimics its deadline.timeRemaining() contract (05-RESEARCH.md
 * Pattern 3 / Pitfall 2 — Safari ships no requestIdleCallback at all, so
 * this fallback is the PRIMARY path for a meaningful audience slice on
 * this project, not a rare edge case — built and exercised as a first-
 * class path, not an afterthought). */
function requestIdle(cb: (deadline: IdleDeadlineLike) => void): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (
      window as unknown as {
        requestIdleCallback: (cb: (d: IdleDeadlineLike) => void) => void;
      }
    ).requestIdleCallback(cb);
    return;
  }
  const start = Date.now();
  setTimeout(() => {
    cb({ timeRemaining: () => Math.max(0, 50 - (Date.now() - start)), didTimeout: false });
  }, 1);
}

/** Drains a queue of work units across idle callbacks, checking
 * `deadline.timeRemaining() > 0` before each unit — self-adjusting
 * regardless of per-unit cost, per 05-RESEARCH.md's Open Questions
 * recommendation (no fixed batch-size constant needed). */
function drainQueue(queue: WorkUnit[], onDone: () => void): void {
  let i = 0;
  function step(deadline: IdleDeadlineLike): void {
    while (i < queue.length && deadline.timeRemaining() > 0) {
      queue[i]();
      i++;
    }
    if (i < queue.length) {
      requestIdle(step);
    } else {
      onDone();
    }
  }
  requestIdle(step);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clampByte(v: number): number {
  return Math.min(255, Math.max(0, v));
}

/** Clamps viewport-area-scaled star count between the UI-SPEC floor/cap —
 * density reads consistent across viewport sizes rather than a literal
 * fixed count. */
function starCountForArea(cssWidth: number, cssHeight: number): number {
  const area = cssWidth * cssHeight;
  const scaled = Math.round(REFERENCE_STAR_COUNT * (area / REFERENCE_AREA));
  return Math.min(STAR_COUNT_CAP, Math.max(STAR_COUNT_FLOOR, scaled));
}

/** Picks a magnitude band for one star, weighted by each band's `share`. */
function pickBand(): BandSpec {
  const r = Math.random();
  let acc = 0;
  for (const spec of BANDS) {
    acc += spec.share;
    if (r <= acc) return spec;
  }
  return BANDS[BANDS.length - 1];
}

/** Standard sRGB -> HSL lightness extraction (no external dependency) —
 * used only to read the --star token's own lightness so the hue-jitter
 * helper below can preserve it exactly. */
function rgbLightness({ r, g, b }: RgbTriple): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  return (max + min) / 2;
}

function hslToRgb(h: number, s: number, l: number): RgbTriple {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hn = h / 360;
  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

/** Applies a SUBTLE, mostly-neutral hue jitter around the base --star
 * color — most stars keep the base neutral white; a small weighted
 * fraction drift cool (blue, ~210°) or warm (amber, ~35°), matching
 * 05-RESEARCH.md Pattern 2's "strong color is rare, subtle tint is
 * common" guidance. The base color always originates from
 * getSkyTokens().star (zero hex literals anywhere in this module). */
function jitterStarColor(base: RgbTriple): RgbTriple {
  const baseL = rgbLightness(base);
  // Cubing a signed unit random clusters most values near 0 (neutral),
  // with occasional larger excursions toward the cool/warm ends.
  const signed = Math.random() * 2 - 1;
  const weighted = Math.sign(signed) * Math.abs(signed) ** 3;
  if (Math.abs(weighted) < 0.02) return base; // effectively neutral — skip HSL round-trip
  const hue = weighted < 0 ? 210 : 35;
  const saturation = Math.min(0.3, Math.abs(weighted) * 0.3);
  return hslToRgb(hue, saturation, baseL);
}

/** Per-pixel luminance dither (±3 levels) over a device-pixel row-slice of
 * the sky wash — SPIKE.md's specific anti-banding technique (a genuine
 * per-pixel getImageData/putImageData noise pass, never a tiled
 * createPattern, which produced a visible periodic artifact during the
 * spike — see SPIKE.md's ditherSky() note). Operates in device-pixel
 * space directly (getImageData/putImageData ignore the CSS-space
 * transform), so `rowStart`/`rowEnd`/`deviceWidth` are device pixels. */
function ditherRows(ctx: CanvasRenderingContext2D, deviceWidth: number, rowStart: number, rowEnd: number): void {
  const height = rowEnd - rowStart;
  if (height <= 0 || deviceWidth <= 0) return;
  const imageData = ctx.getImageData(0, rowStart, deviceWidth, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.round((Math.random() - 0.5) * 6); // +/-3 levels
    data[i] = clampByte(data[i] + noise);
    data[i + 1] = clampByte(data[i + 1] + noise);
    data[i + 2] = clampByte(data[i + 2] + noise);
  }
  ctx.putImageData(imageData, 0, rowStart);
}

/** Centerline x (CSS px) of the Milky Way band at a given normalized y
 * (0=top edge, 1=horizon) — SPIKE.md Contract: enters near the top around
 * x:0.63, sweeps to x:0.87 near the horizon (~24° from vertical). */
function milkyWayCenterlineX(normalizedY: number, cssWidth: number): number {
  return lerp(MW_TOP_X_FRACTION, MW_HORIZON_X_FRACTION, normalizedY) * cssWidth;
}

interface DustParams {
  minR: number;
  maxR: number;
  alphaScale: number;
  spread: number;
}

/** One Milky Way dust dot — used for both the fine and coarse passes
 * (SPIKE.md Contract steps 2/3), differing only in size/alpha/spread. */
function drawDustDot(
  ctx: CanvasRenderingContext2D,
  cssWidth: number,
  horizonY: number,
  milkyway: RgbTriple,
  { minR, maxR, alphaScale, spread }: DustParams
): void {
  const t = Math.random(); // position along the band, top -> horizon
  const cx = milkyWayCenterlineX(t, cssWidth);
  const cy = t * horizonY;
  // Gaussian-like perpendicular falloff via sum-of-4-uniforms (cheap
  // approximation adequate for a purely visual scatter — SPIKE.md's own
  // description of the technique).
  const gauss = (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2; // ~[-1,1], peak at 0
  const perpOffset = gauss * spread * (cssWidth / MW_REFERENCE_WIDTH);
  // Along-band intensity: brighter toward the horizon/right (t -> 1), per
  // the "core through the right margin" placement rule.
  const intensity = lerp(0.35, 1, t);
  const alpha = alphaScale * intensity * lerp(0.4, 1, Math.random());
  const radius = lerp(minR, maxR, Math.random());
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba(milkyway, alpha);
  ctx.beginPath();
  ctx.arc(cx + perpOffset, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Queues the full 3-layer Milky Way composite (haze -> fine dust ->
 * coarse dust) as individual work units — SPIKE.md's "Contract for 05-03"
 * transcribed exactly (angle/placement/pass counts/alpha ranges). */
function queueMilkyWay(queue: WorkUnit[], ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number, milkyway: RgbTriple): void {
  const horizonY = cssHeight * 0.85;
  const heightScale = cssHeight / MW_REFERENCE_HEIGHT;

  // 1. Haze layer — 4 passes of ~22 soft radial blobs, each pass a
  //    different base radius/alpha, per-blob position + alpha jitter
  //    (05-RESEARCH.md Pattern 1 recovery-ladder steps 1+2, baked in as
  //    the spike-validated default technique, not a fallback retry).
  for (let pass = 0; pass < MW_HAZE_PASSES; pass++) {
    const passT = MW_HAZE_PASSES === 1 ? 0 : pass / (MW_HAZE_PASSES - 1);
    const baseRadius = lerp(90, 166, passT) * heightScale;
    const baseAlpha = lerp(0.071, 0.035, passT);
    for (let b = 0; b < MW_HAZE_BLOBS_PER_PASS; b++) {
      queue.push(() => {
        const t = Math.random();
        const cx = milkyWayCenterlineX(t, cssWidth) + (Math.random() * 2 - 1) * 26 * (cssWidth / MW_REFERENCE_WIDTH);
        const cy = t * horizonY + (Math.random() * 2 - 1) * 26 * heightScale;
        const radius = baseRadius * lerp(0.7, 1.3, Math.random());
        const alpha = baseAlpha * lerp(0.6, 1.4, Math.random());
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, rgba(milkyway, alpha));
        grad.addColorStop(1, rgba(milkyway, 0));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
  }

  // 2. Fine dust pass — ~1400 small translucent dots.
  for (let i = 0; i < MW_FINE_DUST_COUNT; i++) {
    queue.push(() => drawDustDot(ctx, cssWidth, horizonY, milkyway, { minR: 0.4, maxR: 1.1, alphaScale: 0.3, spread: 70 }));
  }

  // 3. Coarse dust pass — ~260 larger, dimmer dots (texture-breaking).
  for (let i = 0; i < MW_COARSE_DUST_COUNT; i++) {
    queue.push(() => drawDustDot(ctx, cssWidth, horizonY, milkyway, { minR: 1.2, maxR: 2.4, alphaScale: 0.16, spread: 110 }));
  }
}

/** Device-pixel row-count processed per dither work unit — small enough
 * that even a wide DPR-2 canvas stays well under the idle-callback budget
 * per unit. */
const DITHER_ROWS_PER_UNIT = 24;

/**
 * Generates Layer 0 (sky wash + dither + power-law starfield + Milky Way
 * band) ONCE to a detached, never-DOM-attached canvas via chunked,
 * idle-scheduled work. Never draws to any visible canvas and never starts
 * an animation loop — `onDone` fires once the whole bitmap is finished,
 * handing back the canvas to blit plus the twinkle-eligible star subset.
 *
 * Safe to call again on resize (each call produces an independent
 * detached canvas + fresh star scatter) — debouncing repeated calls
 * during a resize gesture is scene.ts's (05-04) responsibility, not this
 * module's; this function itself has no shared mutable state across
 * calls.
 */
export function generateLayer0(cssWidth: number, cssHeight: number, onDone: (result: Layer0Result) => void): void {
  const dpr = capDpr();
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cssWidth * dpr));
  canvas.height = Math.max(1, Math.round(cssHeight * dpr));

  // willReadFrequently: true — the dither pass below issues many
  // getImageData/putImageData round-trips over this same context; hinting
  // the browser up front avoids a runtime warning and lets it pick a
  // readback-optimized backing store instead of re-guessing per call.
  const layer0Ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!layer0Ctx) {
    // No 2D context available — fail silently (05-UI-SPEC.md's documented
    // no-apology fallback, matching fig01's own precedent): hand back an
    // empty bitmap the caller simply won't blit, rather than throwing.
    onDone({ canvas, cssWidth, cssHeight, dpr, twinkleStars: [] });
    return;
  }

  // From here on, every draw call uses CSS-pixel coordinates — mirrors
  // fig01/render.ts's layout() convention exactly.
  layer0Ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const tokens = getSkyTokens();
  const horizonYCss = cssHeight * 0.85;

  // --- Sky wash + ground fill (cheap, single synchronous ops — never
  // worth chunking one gradient fill). ---
  const gradient = layer0Ctx.createLinearGradient(0, 0, 0, horizonYCss);
  gradient.addColorStop(0, rgba(tokens.skyZenith, 1));
  gradient.addColorStop(1, rgba(tokens.skyHorizon, 1));
  layer0Ctx.fillStyle = gradient;
  layer0Ctx.fillRect(0, 0, cssWidth, horizonYCss);
  layer0Ctx.fillStyle = rgba(tokens.skyZenith, 1);
  layer0Ctx.fillRect(0, horizonYCss, cssWidth, cssHeight - horizonYCss);

  const queue: WorkUnit[] = [];

  // --- Sky dither (SPIKE.md contract: per-pixel getImageData/
  // putImageData noise, NOT a tiled pattern — folded into the chunked
  // queue as its own set of row-slice units, operating in device-pixel
  // space over just the above-horizon sky region). ---
  const deviceHorizonY = Math.round(canvas.height * 0.85);
  for (let rowStart = 0; rowStart < deviceHorizonY; rowStart += DITHER_ROWS_PER_UNIT) {
    const rowEnd = Math.min(deviceHorizonY, rowStart + DITHER_ROWS_PER_UNIT);
    queue.push(() => ditherRows(layer0Ctx, canvas.width, rowStart, rowEnd));
  }

  // --- Starfield (power-law, 4 magnitude bands) ---
  const starCount = starCountForArea(cssWidth, cssHeight);
  const twinkleStars: StarMeta[] = [];
  for (let i = 0; i < starCount; i++) {
    queue.push(() => {
      const spec = pickBand();
      const biased = Math.random() ** MAGNITUDE_BIAS;
      const radius = lerp(spec.radius[0], spec.radius[1], biased);
      const alpha = lerp(spec.alpha[0], spec.alpha[1], biased);
      const x = Math.random() * cssWidth;
      const y = Math.random() * cssHeight;
      const color = jitterStarColor(tokens.star);
      layer0Ctx.beginPath();
      layer0Ctx.fillStyle = rgba(color, alpha);
      layer0Ctx.arc(x, y, radius, 0, Math.PI * 2);
      layer0Ctx.fill();
      if (spec.twinkleEligible) {
        twinkleStars.push({ x, y, radius, baseAlpha: alpha, color });
      }
    });
  }

  // --- Milky Way band (SPIKE.md Contract for 05-03) ---
  queueMilkyWay(queue, layer0Ctx, cssWidth, cssHeight, tokens.milkyway);

  drainQueue(queue, () => {
    onDone({ canvas, cssWidth, cssHeight, dpr, twinkleStars });
  });
}
