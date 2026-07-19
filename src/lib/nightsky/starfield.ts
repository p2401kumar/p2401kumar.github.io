// starfield.ts — Layer 0 generator, post-photo-surgery (07-03, IMG-05): the
// real Milky-Way photo (NightSky.astro's .sky-photo <picture>, DOM-below the
// canvas) now provides the sky wash, the ambient starfield, and the Milky
// Way band, so Layer 0 is TRANSPARENT except the authored elements. This
// module bakes exactly ONE thing to the detached Layer-0 canvas — the
// crescent moon — and generates the margin-confined Mid+Bright twinkle
// candidate METADATA (array pushes only, no canvas draws) that scene.ts's
// Layer-2 twinkle subset samples. The removed passes (sky-wash gradient,
// ground fill, dither, 4-band bake, procedural Milky Way composite, SKY-05
// alpha-cap governor) are documented in 07-RESEARCH.md §5.1–5.2.
//
// This module draws nothing to any visible canvas and starts no per-frame
// animation loop — scene.ts (05-04) owns the per-frame drawImage() blit +
// Layer 2 twinkle/firefly/beam work on top of the bitmap this module
// produces. Blitting the now-mostly-transparent bitmap is unchanged: the
// photo <img> behind the canvas shows through transparent pixels via the
// browser compositor (07-RESEARCH.md §5.5).
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
// (05-04) applies the identical transform to its own visible canvas so
// star metadata positions/radii here are directly reusable without
// re-deriving a DPR factor per read.

import { drainQueue, type WorkUnit } from './idle-queue';
import { getSkyTokens, rgba, type RgbTriple } from './tokens';

/** DPR cap — identical doctrine to fig01/deck (PROJECT.md constraints):
 * never exceed 2, mirrored (not imported) per the nightsky/fig01
 * module-boundary rule (05-CONTEXT.md). */
export function capDpr(): number {
  return Math.min((typeof devicePixelRatio === 'number' ? devicePixelRatio : 1) || 1, 2);
}

/** Twinkle-candidate magnitude bands — the Mid + Bright rows of
 * 05-UI-SPEC.md's original 4-band table (the only twinkle-eligible bands).
 * The Faintest/Dim bands (87% of the old procedural field, never
 * twinkle-eligible) were REMOVED in 07-03: the photo provides the ambient
 * stars now (IMG-05). `share` keeps each band's original fraction of the
 * FULL field so the candidate count below stays calibrated to the same
 * ~13%-of-field pool the twinkle subset has always sampled from. */
type MagnitudeBand = 'mid' | 'bright';

interface BandSpec {
  band: MagnitudeBand;
  share: number; // fraction of the ORIGINAL total star count
  radius: [number, number]; // CSS-px range
  alpha: [number, number]; // alpha range
}

const BANDS: BandSpec[] = [
  { band: 'mid', share: 0.1, radius: [1.0, 1.4], alpha: [0.45, 0.65] },
  { band: 'bright', share: 0.03, radius: [1.4, 2.0], alpha: [0.7, 1.0] },
];

/** Sum of the remaining bands' shares — the fraction of the area-scaled
 * star count generated as twinkle candidates. */
const TWINKLE_CANDIDATE_SHARE = BANDS.reduce((acc, b) => acc + b.share, 0);

/** Power-law magnitude bias exponent (SPIKE.md: `Math.pow(rand, 2.2)`). */
const MAGNITUDE_BIAS = 2.2;

/** Reference viewport (1440x900) star count, and the floor/cap that keep
 * density visually consistent as viewport area scales (05-UI-SPEC.md).
 * Still the calibration base for the twinkle-candidate pool even though
 * the full field is no longer baked. */
const REFERENCE_AREA = 1440 * 900;
const REFERENCE_STAR_COUNT = 700;
const STAR_COUNT_FLOOR = 350;
const STAR_COUNT_CAP = 1200;

// --- 07-03 twinkle margin confinement (SKY-05 governor re-scope) ---------
// The SKY-05 governor's alpha-cap/attenuation halves are RETIRED — there
// is no baked field left to cap (the content-column exposure duty moved to
// the photo master's build-time column vignette, 07-SPIKE-BANDING.md).
// What survives is the governor's INCLUSION-GATING half, re-scoped from a
// smoothstep alpha cap to a hard margin include/exclude (07-RESEARCH.md
// §5.2): twinkle candidates are generated ONLY inside the horizontal
// margins outside the content column, mirroring scene.ts's firefly
// containment formula (contentColumnEdges + 8px cushion — research open
// question 2's recommended starting point). Narrow viewports where the
// column is effectively full-width yield an EMPTY candidate pool (zero
// twinkles — same behavior the governor's exclusion produced there).
const TWINKLE_MARGIN_CUSHION = 8;
const TWINKLE_MIN_MARGIN_WIDTH = 48;

interface MarginRange {
  x0: number;
  x1: number;
}

/** Content-column edges — mirrors deck.css (.panel padding clamp(18px,
 * 4vw, 32px) + .panel > * max-width 880px centered); mirrored, NOT
 * imported from scene.ts, per the module-boundary doctrine (the same
 * deliberate duplication scene.ts itself documents). */
function contentColumnEdges(cssWidth: number): { left: number; right: number } {
  const pad = Math.min(32, Math.max(18, cssWidth * 0.04));
  const half = Math.min(880, cssWidth - 2 * pad) / 2;
  return { left: cssWidth / 2 - half, right: cssWidth / 2 + half };
}

/** The margin bands twinkle candidates may occupy at this width, or an
 * empty list when both margins are too narrow to host stars. */
function twinkleMarginRanges(cssWidth: number): MarginRange[] {
  const { left, right } = contentColumnEdges(cssWidth);
  const ranges: MarginRange[] = [];
  const leftRange = { x0: TWINKLE_MARGIN_CUSHION, x1: left - TWINKLE_MARGIN_CUSHION };
  const rightRange = { x0: right + TWINKLE_MARGIN_CUSHION, x1: cssWidth - TWINKLE_MARGIN_CUSHION };
  if (leftRange.x1 - leftRange.x0 >= TWINKLE_MIN_MARGIN_WIDTH) ranges.push(leftRange);
  if (rightRange.x1 - rightRange.x0 >= TWINKLE_MIN_MARGIN_WIDTH) ranges.push(rightRange);
  return ranges;
}

// --- SKY-07 crescent moon (05.1-01) --------------------------------------
// A thin, dim, procedural waning crescent baked ONCE into Layer 0 as the
// final work unit — present in every blit including the reduced-motion
// static frame, at zero per-frame cost. It is the ONLY canvas bake left in
// Layer 0 after 07-03's surgery, and it composites source-over, so it
// reads correctly over the photo exactly as it did over the procedural
// wash. Tokens-only: lit crescent = --star at LIT_ALPHA, earthshine disk =
// --sky-horizon at EARTHSHINE_ALPHA; no image assets, no new token.
// Placed in the LEFT margin (the photo's Milky-Way core owns the right
// margin); its fixed LIT_ALPHA is its entire brightness governance (hard
// ceiling 0.55, verified by verify-contrast.mjs --moon, whose comparator
// now reads the PHOTO's galactic-core peak — 07-03 Task 3).
const MOON_RADIUS_COEFF = 0.018;
const MOON_RADIUS_FLOOR = 12;
const MOON_RADIUS_CAP = 22;
const MOON_X_MARGIN_FRACTION = 0.3;
const MOON_Y_FRACTION = 0.68;
const MASK_RADIUS_RATIO = 1.05;
/** Mask-circle center offset from the moon center, in units of R, along
 * +x. NOTE — deviates from the 05.1-UI-SPEC table's literal 1.85: with the
 * locked MASK_RADIUS_RATIO 1.05, lit-sliver width at the equator is
 * `R + offset − maskR`, so offset 1.85R yields a NEAR-FULL disk (mask left
 * edge at +0.80R — a 0.20R dark bite on the right), contradicting the same
 * spec section's locked visual outcome ("thin left-edge crescent ~0.20×R
 * at its widest, left-facing C, the conventional waning-crescent read")
 * and SKY-07 itself ("thin waning crescent" — a full moon IS light
 * pollution per 05.1-CONTEXT). offset 0.25R is the unique value giving
 * the described 0.20R sliver: 1 + 0.25 − 1.05 = 0.20. */
const MASK_OFFSET_RATIO = 0.25;
const LIT_ALPHA = 0.45; // tuning range 0.40–0.50; HARD ceiling 0.55
const EARTHSHINE_ALPHA = 0.08;

/** Left edge (CSS px) of the deck.css 880px content column — the moon's
 * margin-placement anchor (05.1-UI-SPEC). Shares contentColumnEdges'
 * mirrored deck.css formula. */
function moonColumnLeft(cssWidth: number): number {
  return contentColumnEdges(cssWidth).left;
}

/** Draws the waning crescent moon: earthshine disk + clipped even-odd
 * lit crescent. Background-safe — source-over only, never destination-out
 * on the shared layer0Ctx (no transparent hole is ever punched; over the
 * 07-03 transparent Layer 0 the crescent simply composites onto the
 * photo behind the canvas). */
function drawMoon(
  ctx: CanvasRenderingContext2D,
  cssWidth: number,
  cssHeight: number,
  star: RgbTriple,
  skyHorizon: RgbTriple
): void {
  const R = Math.min(
    MOON_RADIUS_CAP,
    Math.max(MOON_RADIUS_FLOOR, MOON_RADIUS_COEFF * Math.min(cssWidth, cssHeight))
  );
  const moonX = MOON_X_MARGIN_FRACTION * moonColumnLeft(cssWidth);
  const moonY = MOON_Y_FRACTION * cssHeight;

  // 1. Earthshine disk — the faint dark-limb glow.
  ctx.beginPath();
  ctx.fillStyle = rgba(skyHorizon, EARTHSHINE_ALPHA);
  ctx.arc(moonX, moonY, R, 0, Math.PI * 2);
  ctx.fill();

  // 2. Lit waning crescent via clip + even-odd fill: inside the lit-disk
  // clip, the even-odd rule fills rectangle-minus-mask — the thin
  // left-edge sliver (~0.20×R at its widest). The mask offset toward +x
  // carves the sliver on the LEFT, the conventional waning-crescent read.
  // No rotation — axis-aligned per the spec's reference geometry.
  ctx.save();
  ctx.beginPath();
  ctx.arc(moonX, moonY, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(moonX - R, moonY - R, 2 * R, 2 * R);
  ctx.arc(moonX + MASK_OFFSET_RATIO * R, moonY, MASK_RADIUS_RATIO * R, 0, Math.PI * 2);
  ctx.fillStyle = rgba(star, LIT_ALPHA);
  ctx.fill('evenodd');
  ctx.restore();
}

/** A single generated star's metadata — the subset Layer 2 (05-04) needs
 * to draw a twinkling star's alpha wobble over the photo. Positions/radius
 * are in CSS-pixel space (see module header). Since 07-03 these stars are
 * NEVER baked into Layer 0 — Layer 2's per-frame draw is their only
 * rendering (the wobble draws the star itself, not a brightening overlay
 * on a baked disk). */
export interface StarMeta {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  color: RgbTriple;
}

export interface Layer0Result {
  /** The detached, never-DOM-attached canvas holding the finished Layer 0
   * bitmap — since 07-03, TRANSPARENT everywhere except the crescent moon
   * (the photo behind the canvas provides sky/stars/Milky Way). Blit via
   * `visibleCtx.drawImage(layer0.canvas, 0, 0, ...)` — never draw into
   * this canvas's own context again after `onDone` fires. */
  canvas: HTMLCanvasElement;
  /** CSS-pixel width/height this bitmap was generated for, so callers can
   * size the visible canvas identically. */
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  /** Twinkle-eligible candidates (Mid + Bright bands, margin-confined) —
   * Layer 2's per-frame alpha wobble reads from this array. Metadata
   * only: nothing in this array is baked into the bitmap. */
  twinkleStars: StarMeta[];
}

// The idle scheduler (requestIdle/drainQueue + IdleDeadlineLike/WorkUnit)
// was extracted VERBATIM to idle-queue.ts in 09-01 so clouds.ts (AMB-01)
// can reuse it without duplicating the Safari-first-class setTimeout shim.
// Behavior-preserving: the imported functions are byte-identical to the
// former local ones; Layer-0 generation semantics are unchanged.

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamps viewport-area-scaled star count between the UI-SPEC floor/cap —
 * density reads consistent across viewport sizes rather than a literal
 * fixed count. The twinkle-candidate pool is TWINKLE_CANDIDATE_SHARE of
 * this figure. */
function starCountForArea(cssWidth: number, cssHeight: number): number {
  const area = cssWidth * cssHeight;
  const scaled = Math.round(REFERENCE_STAR_COUNT * (area / REFERENCE_AREA));
  return Math.min(STAR_COUNT_CAP, Math.max(STAR_COUNT_FLOOR, scaled));
}

/** Picks a magnitude band for one candidate, weighted by each band's
 * share (normalized over the remaining Mid+Bright bands). */
function pickBand(): BandSpec {
  const r = Math.random() * TWINKLE_CANDIDATE_SHARE;
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

/** Standard HSL -> sRGB conversion. Exported since 09-01 so scene.ts's
 * scintillation chromatic nudge (AMB-04) reuses this exact conversion
 * rather than re-deriving it. */
export function hslToRgb(h: number, s: number, l: number): RgbTriple {
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

/**
 * Generates Layer 0 ONCE to a detached, never-DOM-attached canvas via the
 * chunked, idle-scheduled queue. Post-07-03 contents: the crescent moon
 * (the single canvas bake) plus the margin-confined Mid+Bright twinkle
 * candidate metadata (array pushes, zero draw calls). The canvas is
 * otherwise fully transparent — the photo behind it provides the sky.
 * Never draws to any visible canvas and never starts an animation loop —
 * `onDone` fires once the queue drains, handing back the canvas to blit
 * plus the twinkle candidate pool.
 *
 * Safe to call again on resize (each call produces an independent
 * detached canvas + fresh candidate scatter) — debouncing repeated calls
 * during a resize gesture is scene.ts's (05-04) responsibility, not this
 * module's; this function itself has no shared mutable state across
 * calls.
 */
export function generateLayer0(cssWidth: number, cssHeight: number, onDone: (result: Layer0Result) => void): void {
  const dpr = capDpr();
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cssWidth * dpr));
  canvas.height = Math.max(1, Math.round(cssHeight * dpr));

  // Plain 2D context — the dither pass (the old getImageData workload
  // that justified willReadFrequently) was removed in 07-03; nothing
  // reads pixels back from this context anymore.
  const layer0Ctx = canvas.getContext('2d');
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

  const queue: WorkUnit[] = [];

  // --- Twinkle candidate metadata (Mid+Bright, margin-confined — 07-03).
  // No canvas draw calls: each unit computes {x, y, radius, baseAlpha,
  // color} and pushes it. Kept in the idle queue for uniformity (cheap
  // either way — 07-RESEARCH.md §5.4). ---
  const candidateCount = Math.round(starCountForArea(cssWidth, cssHeight) * TWINKLE_CANDIDATE_SHARE);
  const ranges = twinkleMarginRanges(cssWidth);
  const totalRangeWidth = ranges.reduce((acc, r) => acc + (r.x1 - r.x0), 0);
  const twinkleStars: StarMeta[] = [];
  if (ranges.length > 0) {
    for (let i = 0; i < candidateCount; i++) {
      queue.push(() => {
        const spec = pickBand();
        const biased = Math.random() ** MAGNITUDE_BIAS;
        const radius = lerp(spec.radius[0], spec.radius[1], biased);
        const baseAlpha = lerp(spec.alpha[0], spec.alpha[1], biased);
        // Weight side selection by margin width so a lone wide margin
        // hosts proportionally more candidates (mirrors the firefly
        // containment's weighting).
        let pick = Math.random() * totalRangeWidth;
        let range = ranges[0];
        for (const r of ranges) {
          pick -= r.x1 - r.x0;
          if (pick <= 0) {
            range = r;
            break;
          }
        }
        const x = lerp(range.x0, range.x1, Math.random());
        const y = Math.random() * cssHeight;
        twinkleStars.push({ x, y, radius, baseAlpha, color: jitterStarColor(tokens.star) });
      });
    }
  }

  // --- Crescent moon (SKY-07, 05.1-01) — the FINAL Layer-0 work unit and
  // the only canvas bake left after 07-03's surgery. ---
  queue.push(() => drawMoon(layer0Ctx, cssWidth, cssHeight, tokens.star, tokens.skyHorizon));

  drainQueue(queue, () => {
    onDone({ canvas, cssWidth, cssHeight, dpr, twinkleStars });
  });
}
