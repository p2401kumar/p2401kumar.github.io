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
//   - Layer 2 (twinkle subset + fireflies + constellations): the ONLY
//     per-frame canvas work in this module. ~half of the Mid/Bright
//     twinkle-eligible metadata (≈5–8% of the total field, ~40 stars at
//     the reference viewport), ≤15 fireflies, and the constellation
//     draw/advance hook (05-05). Link-firing is a setTimeout-scheduled
//     sparse event owned by constellations.ts (at most one beam, every
//     6–10s), never per-frame dice (05-RESEARCH.md Anti-Patterns).
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

import { initAurora, type AuroraHandle } from './aurora';
import { initClouds, type CloudsHandle } from './clouds';
import { initConstellations, type ConstellationHandle } from './constellations';
import { initMeteors, type MeteorHandle } from './meteors';
import { generateLayer0, hslToRgb, type Layer0Result, type StarMeta } from './starfield';
import { getSkyTokens, rgba, type RgbTriple, type SkyTokens } from './tokens';

const TWO_PI = Math.PI * 2;

// --- Twinkle tuning (05-UI-SPEC.md "Ambient loop": ~40 stars, period
// 2–4s random per star, unsynchronized phases per 05-RESEARCH.md
// Pattern 2 — never a hard flicker). 09-01 (AMB-04): upgraded to a
// 2-oscillator atmospheric-scintillation sum — the primary (slow)
// amplitude is trimmed from 0.15–0.25 to 0.12–0.18 to make room for the
// new fast flutter term (0.04–0.07 at 400–700ms), keeping the combined
// peak envelope (~0.16–0.25) statistically inside today's total range:
// more textured, not brighter or busier (09-UI-SPEC.md Scintillation). ---
const TWINKLE_PERIOD_MIN_MS = 2000;
const TWINKLE_PERIOD_MAX_MS = 4000;
const TWINKLE_AMPLITUDE_MIN = 0.12;
const TWINKLE_AMPLITUDE_MAX = 0.18;
/** Secondary oscillator — the sub-second atmospheric flutter (AMB-04). */
const TWINKLE_SEC_PERIOD_MIN_MS = 400;
const TWINKLE_SEC_PERIOD_MAX_MS = 700;
const TWINKLE_SEC_AMPLITUDE_MIN = 0.04;
const TWINKLE_SEC_AMPLITUDE_MAX = 0.07;
/** Chromatic nudge (AMB-04): ±8% absolute HSL-S delta on the 3 brightest
 * pool entries ONLY, modulated at the SAME period/phase as each star's
 * primary oscillator so color and brightness pulse together — real
 * chromatic dispersion, never an independent color cycle. Saturation is
 * clamped to jitterStarColor's own 0.3 cap, so the nudge stays a nudge,
 * never a saturated color flash. */
const CHROMATIC_S_DELTA = 0.08;
/** Saturation ceiling for the chromatic nudge — mirrors starfield.ts's
 * jitterStarColor cap (0.3), the existing "subtle tint, never strong
 * color" bound. */
const CHROMATIC_S_MAX = 0.3;
/** 09-03's mobile-ladder tier-3 seam: dropping the chromatic nudge keeps
 * the 2-oscillator amplitude wobble but holds color neutral. Default on. */
let chromaticNudgeEnabled = true;
/** Fraction of the Mid/Bright twinkle-eligible metadata actually animated.
 * Mid+Bright bands are ~13% of the total field (starfield.ts BANDS), so
 * halving lands at ~6.5% of all stars — inside the locked 5–8% window,
 * ~40–45 stars at the 1440×900 reference viewport (05-UI-SPEC.md). */
const TWINKLE_SUBSET_FRACTION = 0.5;

// --- Firefly tuning (05-UI-SPEC.md Spacing + "Ambient loop" tables:
// count 9 of the ≤15 locked ceiling, radius 1.5–2.5px, bottom-25% ground
// band, 4–8px/s gentle wander, alpha pulse 0.4–0.9 over 3–5s, --accent
// copper tint — the ONLY Layer-2 use of the accent. 05-06 (SKY-05):
// horizontally confined to the margins outside the text column — see the
// firefly-containment block below. ---
const FIREFLY_COUNT = 9;
const FIREFLY_RADIUS_MIN = 1.5;
const FIREFLY_RADIUS_MAX = 2.5;
const FIREFLY_SPEED_MIN = 4; // CSS px/s
const FIREFLY_SPEED_MAX = 8;
const FIREFLY_PULSE_MIN_MS = 3000;
const FIREFLY_PULSE_MAX_MS = 5000;
/** 11-02 BOLD-05: the copper fireflies must still read over the brighter
 * 11-01 field. Lift the pulse FLOOR only (0.4 -> 0.5) so they spend less time
 * near-invisible; the PEAK stays 0.9 deliberately — the SKY-05 contrast math
 * (narrow-viewport fallback peak = 0.9 * FIREFLY_SAFE_ALPHA_SCALE = 0.45,
 * still >= 4.5:1 vs --ink at zero scrim) is anchored to that ceiling and must
 * not move. Alpha-only, no new draws; --accent copper stays the sole Layer-2
 * accent. */
const FIREFLY_ALPHA_MIN = 0.5;
const FIREFLY_ALPHA_MAX = 0.9;
/** Ground band top edge (CSS px) — the bottom-25% ground band per
 * 05-UI-SPEC.md's ambient-loop table. */
function fireflyBandTop(cssHeight: number): number {
  return cssHeight * FIREFLY_BAND_TOP;
}
const FIREFLY_BAND_TOP = 0.75;

// --- SKY-05 firefly containment (05-06). Panels overflow and scroll
// internally, so text can render at ANY viewport y — including the
// low-opacity bottom taper of the scrim, where a peak-pulse (0.9 alpha)
// copper firefly core under a text line measured as low as 3.4:1 vs
// --ink in the worst-case canvas-readback verification. Fireflies are
// therefore confined to the HORIZONTAL MARGINS outside the content
// column (the same min(880px, width - 2*pad) centered formula as
// deck.css) — the one place text can never be — wandering/reflecting
// inside their own side's margin. When the margins are too narrow to
// roam (narrow viewports where the column is effectively full-width),
// the flock falls back to full-width wander with its alpha halved
// (peak 0.45), which stays >= 4.5:1 vs --ink even at ZERO scrim. ---
const FIREFLY_MARGIN_CUSHION = 8;
const FIREFLY_MIN_MARGIN_WIDTH = 48;
/** Alpha multiplier applied in the narrow-viewport fallback mode. */
const FIREFLY_SAFE_ALPHA_SCALE = 0.5;

interface FireflyRange {
  x0: number;
  x1: number;
}

/** Content-column edges — mirrors deck.css (.panel padding clamp(18px,
 * 4vw, 32px) + .panel > * max-width 880px centered); mirrored, not
 * shared, per the module-boundary doctrine. */
function contentColumnEdges(cssWidth: number): { left: number; right: number } {
  const pad = Math.min(32, Math.max(18, cssWidth * 0.04));
  const half = Math.min(880, cssWidth - 2 * pad) / 2;
  return { left: cssWidth / 2 - half, right: cssWidth / 2 + half };
}

/** The roamable margin ranges for the flock at this width, or an empty
 * list when both margins are too narrow (fallback mode). */
function fireflyRanges(cssWidth: number): FireflyRange[] {
  const { left, right } = contentColumnEdges(cssWidth);
  const ranges: FireflyRange[] = [];
  const leftRange = { x0: FIREFLY_MARGIN_CUSHION, x1: left - FIREFLY_MARGIN_CUSHION };
  const rightRange = { x0: right + FIREFLY_MARGIN_CUSHION, x1: cssWidth - FIREFLY_MARGIN_CUSHION };
  if (leftRange.x1 - leftRange.x0 >= FIREFLY_MIN_MARGIN_WIDTH) ranges.push(leftRange);
  if (rightRange.x1 - rightRange.x0 >= FIREFLY_MIN_MARGIN_WIDTH) ranges.push(rightRange);
  return ranges;
}
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
  /** Secondary (fast flutter) oscillator — AMB-04. */
  secPeriodMs: number;
  secPhase: number;
  secAmplitude: number;
  /** Present ONLY on the 3 largest-radius pool entries (deterministic per
   * generation, never reselected per frame): the star's own base HSL, the
   * anchor the ±8% saturation nudge swings around. */
  chromatic?: { baseH: number; baseS: number; baseL: number };
}

interface Firefly {
  x: number;
  y: number;
  heading: number; // radians
  speed: number; // CSS px/s
  radius: number;
  pulsePeriodMs: number;
  pulsePhase: number;
  /** Horizontal roam range (a margin band, or full width in fallback). */
  range: FireflyRange;
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
/** 1 normally; FIREFLY_SAFE_ALPHA_SCALE in the narrow-viewport fallback
 * where the flock roams full-width (SKY-05 containment above). */
let fireflyAlphaScale = 1;
let tokens: SkyTokens | null = null;
/** 05-05's constellation subsystem handle — its advance/draw ride THIS
 * module's single rAF tick (drawFrame Layer 2c); it never owns a loop. */
let constellationsHandle: ConstellationHandle | null = null;
/** 05.1-01's meteor subsystem handle (SKY-06) — advance/draw ride the
 * same single tick (drawFrame Layer 2d); spawn cadence is setTimeout-
 * scheduled inside meteors.ts. It never owns a loop either. */
let meteorsHandle: MeteorHandle | null = null;
/** 09-01's cloud subsystem handle (AMB-01) — advance/draw ride the same
 * single tick as Layer 1.5 (after the Layer-0 blit, before the twinkle
 * subset). Zero owned timers/rAF: sprite generation is idle-queued on
 * resize only; the pause machine covers it for free. */
let cloudsHandle: CloudsHandle | null = null;
/** 09-02's aurora subsystem handle (AMB-03) — advance/draw ride the same
 * single tick as Layer 1.25 (after the Layer-0 blit, before the clouds).
 * Zero owned timers/rAF: all cadence (the 4-frame shape throttle
 * included) is an internal frame counter inside advance(); the pause
 * machine covers it for free. */
let auroraHandle: AuroraHandle | null = null;
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
/** One-shot guard for the init-time DOM seed of fig01Active (06-02 Fix B) —
 * set true by the first adoptLayer0; resize re-adoptions never re-seed, so
 * post-init state stays owned by the panel-change event contract. */
let fig01Seeded = false;

/**
 * 06-02 Fix B — cold-deep-link pause seed (SKY-04 edge): `nightsky:panel-
 * change` only fires from deck.ts's goTo() NAVIGATION, never from initDeck's
 * synchronous hash resolution, so a cold `/#fig-01` load left the scene
 * animating behind the figure until the first navigation. Seed fig01Active
 * once, at first Layer-0 adoption, by reading the deck's OWN DOM state — a
 * literal-attribute read, never a deck.ts import (module-boundary rule):
 *   - `html.deck-active` must be present (on a classic-pref boot, initDeck
 *     still applies panel data-state before branching to classic — reading
 *     data-state alone would newly pause the scene in classic mode, where
 *     today it animates; classic/no-deck must stay `false`, same as before);
 *   - the active panel's data-panel-id must be 'fig-01'.
 * TIMING: this runs inside adoptLayer0, whose only caller is generateLayer0's
 * completion callback — always idle-scheduled (requestIdle chunked queue),
 * strictly after every load-time module script (deck.ts's synchronous init
 * included) has finished. No listener-attach-order proof needed.
 */
function seedFig01ActiveFromDom(): void {
  if (fig01Seeded) return;
  fig01Seeded = true;
  fig01Active =
    document.documentElement.classList.contains('deck-active') &&
    document.querySelector('.panel[data-state="active"]')?.getAttribute('data-panel-id') === 'fig-01';
}

/**
 * 09-03 (AMB-05) — the documented mobile degradation ladder. Computed here
 * (scene.ts owns adopt/resize) and PUSHED to the seams 09-01/09-02 exposed;
 * recomputed on every Layer-0 adoption (init + every debounced resize).
 *
 * LOCKED ladder order (09-UI-SPEC.md Composition Doctrine):
 *   Tier 1 — shed the far cloud layer entirely (cloudsHandle.setFarShed)
 *   Tier 2 — additionally throttle the aurora SHAPE repaint from every 4
 *            frames to every 9 (the 8–10 window's midpoint); the aurora
 *            brightness sine stays per-frame, unaffected
 *   Tier 3 — additionally drop the scintillation chromatic nudge (the
 *            2-oscillator amplitude wobble stays; color stays neutral)
 *
 * PARALLAX NEVER SHEDS at any tier (locked, 09-CONTEXT.md) — it is
 * event-driven and compositor-only, effectively free; deliberately NOT
 * referenced anywhere in this function or its call site.
 *
 * Triggers (width OR feature-detected navigator.deviceMemory; deviceMemory
 * is absent on Safari/iOS, which falls back cleanly to width-only — the
 * same fallback-as-first-class-path precedent as starfield.ts's
 * requestIdleCallback shim):
 *   Tier >= 1: cssWidth < 640  OR deviceMemory <= 4
 *   Tier >= 2: cssWidth < 480  OR deviceMemory <= 2
 *   Tier >= 3: cssWidth < 390  OR (deviceMemory <= 2 AND tier 2 active)
 */
function computeAmbientTier(cssWidth: number): number {
  const dmRaw = (navigator as Navigator & { deviceMemory?: unknown }).deviceMemory;
  const dm = typeof dmRaw === 'number' ? dmRaw : null;
  let tier = 0;
  if (cssWidth < 640 || (dm !== null && dm <= 4)) tier = 1;
  if (cssWidth < 480 || (dm !== null && dm <= 2)) tier = 2;
  if (cssWidth < 390 || (dm !== null && dm <= 2 && tier >= 2)) tier = 3;
  return tier;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** Standard sRGB -> HSL (local helper for the chromatic nudge, AMB-04):
 * derives a chromatic star's base HSL anchor from its own already-
 * jittered color. The inverse conversion is starfield.ts's exported
 * hslToRgb — reused verbatim, never re-derived (09-01-PLAN). */
function rgbToHsl({ r, g, b }: RgbTriple): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}

/** Draws the Mid/Bright twinkle subset from the Layer-0 star metadata:
 * per-star `alpha = baseAlpha + amplitude * sin(ts/period + phase)`
 * composited over the star's own baked-in disk (one sin + one arc per
 * twinkling star per frame — the whole twinkle budget). */
function seedTwinkles(twinkleStars: StarMeta[]): void {
  // Narrow viewports can yield ZERO twinkle-eligible stars (the SKY-05
  // column governor excludes capped in-column stars, and on small screens
  // the column spans the whole width) — an empty pool must mean an empty
  // subset, not an out-of-bounds [-1] read.
  if (!twinkleStars.length) {
    twinkles = [];
    return;
  }
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
      secPeriodMs: lerp(TWINKLE_SEC_PERIOD_MIN_MS, TWINKLE_SEC_PERIOD_MAX_MS, Math.random()),
      secPhase: Math.random() * TWO_PI,
      secAmplitude: lerp(TWINKLE_SEC_AMPLITUDE_MIN, TWINKLE_SEC_AMPLITUDE_MAX, Math.random()),
    });
  }
  // Chromatic nudge selection (AMB-04): the 3 largest-radius entries,
  // picked ONCE per generation — deterministic for this pool, never
  // reselected per frame (avoids a "which star is doing it" flicker).
  // If a star is effectively neutral (S near 0), it borrows a hue from
  // starfield's existing jitterStarColor cool/warm pair (210° / 35°),
  // alternated across the 3 so the trio never pulses one temperature.
  const byRadiusDesc = twinkles
    .map((_, i) => i)
    .sort((a, b) => twinkles[b].radius - twinkles[a].radius)
    .slice(0, 3);
  byRadiusDesc.forEach((idx, k) => {
    const star = twinkles[idx];
    const { h, s, l } = rgbToHsl(star.color);
    const neutral = s < 0.02;
    star.chromatic = {
      baseH: neutral ? (k % 2 === 0 ? 210 : 35) : h,
      baseS: s,
      baseL: l,
    };
  });
}

/** (Re)seeds the firefly flock inside the bottom-25% ground band, confined
 * to the margin roam ranges (SKY-05 containment), for the given CSS-pixel
 * viewport size. */
function seedFireflies(cssWidth: number, cssHeight: number): void {
  const bandTop = fireflyBandTop(cssHeight);
  const ranges = fireflyRanges(cssWidth);
  // Narrow-viewport fallback: full-width roam at halved alpha (SKY-05 —
  // stays >= 4.5:1 vs --ink even where the scrim tapers to zero).
  fireflyAlphaScale = ranges.length ? 1 : FIREFLY_SAFE_ALPHA_SCALE;
  const totalWidth = ranges.reduce((acc, r) => acc + (r.x1 - r.x0), 0);
  fireflies = [];
  for (let i = 0; i < FIREFLY_COUNT; i++) {
    let range: FireflyRange;
    if (!ranges.length) {
      range = { x0: 0, x1: cssWidth };
    } else {
      // Weight side selection by margin width so a lone wide margin
      // hosts proportionally more of the flock.
      let pick = Math.random() * totalWidth;
      range = ranges[0];
      for (const r of ranges) {
        pick -= r.x1 - r.x0;
        if (pick <= 0) {
          range = r;
          break;
        }
      }
    }
    fireflies.push({
      x: lerp(range.x0, range.x1, Math.random()),
      y: lerp(bandTop, cssHeight, Math.random()),
      heading: Math.random() * TWO_PI,
      speed: lerp(FIREFLY_SPEED_MIN, FIREFLY_SPEED_MAX, Math.random()),
      radius: lerp(FIREFLY_RADIUS_MIN, FIREFLY_RADIUS_MAX, Math.random()),
      pulsePeriodMs: lerp(FIREFLY_PULSE_MIN_MS, FIREFLY_PULSE_MAX_MS, Math.random()),
      pulsePhase: Math.random() * TWO_PI,
      range,
    });
  }
}

/** Advances one firefly by `dtMs`: gentle heading random-walk + constant
 * slow speed, reflected back into the ground band at its edges. */
function advanceFirefly(f: Firefly, dtMs: number, cssHeight: number): void {
  const dtS = dtMs / 1000;
  f.heading += (Math.random() - 0.5) * 2 * FIREFLY_TURN_RATE * dtS;
  f.x += Math.cos(f.heading) * f.speed * dtS;
  f.y += Math.sin(f.heading) * f.speed * dtS;
  const bandTop = fireflyBandTop(cssHeight);
  if (f.x < f.range.x0 || f.x > f.range.x1) {
    f.x = Math.min(f.range.x1, Math.max(f.range.x0, f.x));
    f.heading = Math.PI - f.heading;
  }
  if (f.y < bandTop || f.y > cssHeight) {
    f.y = Math.min(cssHeight, Math.max(bandTop, f.y));
    f.heading = -f.heading;
  }
}

/**
 * One animated frame: blit Layer 0 FIRST, then Layer-2 work ONLY —
 * the twinkle subset, the firefly flock, and the constellation hook
 * (05-05: alpha tween + draw, riding this same tick — the constellation
 * module never owns its own loop). Nothing else may ever be added to
 * the per-frame path.
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

  // --- Layer 1.25: aurora (09-02, AMB-03) — composites OVER the moon
  // (baked into Layer 0) and BEFORE the clouds, per 09-UI-SPEC Aurora
  // Placement (supersedes the RESEARCH diagram's tentative last-layer
  // placement): physically correct — the aurora (~100km up) is vastly
  // closer than the moon, so the moon dims very slightly through the
  // curtain at breathing peaks. Intentional, not a defect. ---
  if (auroraHandle) {
    auroraHandle.advance(ts);
    auroraHandle.draw(visibleCtx, w, h);
  }

  // --- Layer 1.5: clouds (09-01, AMB-01) — wraparound sprite blit of the
  // two drifting lower-sky layers, column-governed inside clouds.ts.
  // Drawn after the Layer-0 blit and before the twinkle subset so the
  // crisp point features (stars, fireflies, constellations) sit ON TOP
  // of the haze. ---
  if (cloudsHandle) {
    cloudsHandle.advance(ts, dt);
    cloudsHandle.draw(visibleCtx, w, h);
  }

  // --- Layer 2a: twinkle subset — 2-oscillator atmospheric scintillation
  // (09-01, AMB-04): slow wobble + fast flutter summed per star, plus the
  // bounded chromatic saturation nudge on the 3 brightest only. Same
  // count, same margin containment, no new draw calls or arcs. ---
  for (const s of twinkles) {
    const alpha = clamp01(
      s.baseAlpha +
        s.amplitude * Math.sin(ts / s.periodMs + s.phase) +
        s.secAmplitude * Math.sin(ts / s.secPeriodMs + s.secPhase)
    );
    let color = s.color;
    if (chromaticNudgeEnabled && s.chromatic) {
      // SAME period/phase as the primary oscillator — color and
      // brightness pulse together (chromatic dispersion, not a cycle).
      const sat = Math.min(
        CHROMATIC_S_MAX,
        Math.max(0, s.chromatic.baseS + CHROMATIC_S_DELTA * Math.sin(ts / s.periodMs + s.phase))
      );
      color = hslToRgb(s.chromatic.baseH, sat, s.chromatic.baseL);
    }
    visibleCtx.beginPath();
    visibleCtx.fillStyle = rgba(color, alpha);
    visibleCtx.arc(s.x, s.y, s.radius, 0, TWO_PI);
    visibleCtx.fill();
  }

  // --- Layer 2b: fireflies (drift + soft copper pulse; layered radial
  // gradient halo, never shadowBlur — fig01's glow doctrine). ---
  const accent = tokens.accent;
  for (const f of fireflies) {
    advanceFirefly(f, dt, h);
    const pulse = 0.5 + 0.5 * Math.sin((ts / f.pulsePeriodMs) * TWO_PI + f.pulsePhase);
    const alpha = lerp(FIREFLY_ALPHA_MIN, FIREFLY_ALPHA_MAX, pulse) * fireflyAlphaScale;
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

  // --- Layer 2c: constellations (05-05) — advance the brighten/dim
  // tween + the single firing beam, then draw stars + links + beam at
  // their current state. ---
  if (constellationsHandle) {
    constellationsHandle.advance(ts);
    constellationsHandle.draw(visibleCtx, w, h, ts);
  }

  // --- Layer 2d: meteor (05.1-01, SKY-06) — at most ONE, setTimeout-
  // spawned inside meteors.ts; when idle this is a single null-check
  // per call (zero extra draws — hard invariant 2). ---
  if (meteorsHandle) {
    meteorsHandle.advance(ts);
    meteorsHandle.draw(visibleCtx, w, h);
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
 * Layer 0 bakes the moon (07-03: the photo provides the ambient stars),
 * so the blit is the static sky base; Layer 1 (camper + glow) is DOM/CSS
 * in NightSky.astro. Clouds (09-01, AMB-01) ARE drawn here — once, at a
 * fixed phase (offset 0, peak margin alpha, nudge 0): a beautiful still,
 * not a dimmed one. The twinkle subset and fireflies stay fully OFF —
 * removed, not dampened (05-UI-SPEC.md reduced-motion table, WCAG C39;
 * the photo's own stars provide the base). Constellations DO appear,
 * drawn at their instant current state (brighten/dim is essential
 * wayfinding and still occurs under reduced motion, collapsed to a 0ms
 * change — 05-05).
 */
function renderStaticFrame(): void {
  if (!visibleCtx || !layer0) return;
  visibleCtx.clearRect(0, 0, layer0.cssWidth, layer0.cssHeight);
  visibleCtx.drawImage(layer0.canvas, 0, 0, layer0.cssWidth, layer0.cssHeight);
  // Aurora (09-02, AMB-03) at its FIXED mid-breath phase — over the
  // moon, before the clouds, same order as the live tick.
  auroraHandle?.drawStatic(visibleCtx, layer0.cssWidth, layer0.cssHeight);
  cloudsHandle?.drawStatic(visibleCtx, layer0.cssWidth, layer0.cssHeight);
  if (constellationsHandle) {
    constellationsHandle.draw(visibleCtx, layer0.cssWidth, layer0.cssHeight, performance.now());
  }
}

/**
 * The run-state gate (05-RESEARCH.md Pattern 6, mirroring
 * fig01/interactions.ts's updateRunState): the loop runs only while the
 * tab is visible AND fig-01 is not the active panel AND reduced motion
 * is not requested. Idempotent — safe to call from every signal source.
 */
function updateRunState(): void {
  const shouldRun = tabVisible && !fig01Active && !rm.matches;
  // Link-firing (05-05) follows the loop exactly: suppressed whenever the
  // scene is paused (tab hidden / fig-01 active) or under reduced motion —
  // suppression also discards any in-flight beam, so no paused or static
  // frame can ever contain one.
  constellationsHandle?.setFiringSuppressed(!shouldRun);
  // Meteors (05.1-01) follow the identical gate: suppression clears the
  // pending spawn timer AND discards the in-flight meteor, so paused /
  // reduced-motion / static frames are structurally meteor-free.
  meteorsHandle?.setSuppressed(!shouldRun);
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
  // Clouds + aurora adopt the new size BEFORE the static paint so the
  // very first (and every reduced-motion) frame already carries them.
  cloudsHandle?.resize(result.cssWidth, result.cssHeight);
  auroraHandle?.resize(result.cssWidth, result.cssHeight);
  // 09-03 (AMB-05): apply the mobile degradation ladder for this size —
  // far-cloud shed (tier 1) -> aurora shape throttle 9 (tier 2) ->
  // chromatic-nudge drop (tier 3). Parallax is never touched here (it
  // NEVER sheds — see computeAmbientTier's doctrine block).
  const tier = computeAmbientTier(result.cssWidth);
  cloudsHandle?.setFarShed(tier >= 1);
  auroraHandle?.setShapeThrottle(tier >= 2 ? 9 : 4);
  chromaticNudgeEnabled = tier < 3;
  renderStaticFrame();
  seedFig01ActiveFromDom(); // 06-02 Fix B — one-shot, before the loop can start
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
  const skyTokens = getSkyTokens();
  tokens = skyTokens;

  // --- Cloud subsystem (09-01, AMB-01): handle-shaped, zero owned
  // timers/rAF — sprite generation rides the shared idle queue on
  // resize(); advance/draw ride this module's single tick (Layer 1.5).
  // Its AMB-02 mid-layer nudge listener subscribes to the literal
  // 'nightsky:panel-change' event independently (never deck.ts). ---
  cloudsHandle = initClouds({
    tokens: skyTokens,
    getViewport: () => (layer0 ? { width: layer0.cssWidth, height: layer0.cssHeight } : null),
    // 09-03 (AMB-05): sprite drains are idle-queued, so they always land
    // AFTER adoptLayer0's synchronous static paint. When no loop is
    // running (reduced-motion / hidden / fig-01-active), repaint the
    // static frame once so the still gains its clouds; a running loop
    // repaints on its next tick anyway (gate keeps this a paused-only
    // repaint — never an extra frame mid-animation).
    requestRepaint: () => {
      if (rafId === null) renderStaticFrame();
    },
  });

  // --- Aurora subsystem (09-02, AMB-03): handle-shaped, zero owned
  // timers/rAF — the noise table builds once at init; advance/draw ride
  // this module's single tick (Layer 1.25, over the moon / before the
  // clouds). Hard-capped at 0.20 alpha in-code; left margin only. ---
  auroraHandle = initAurora({
    tokens: skyTokens,
    getViewport: () => (layer0 ? { width: layer0.cssWidth, height: layer0.cssHeight } : null),
  });

  // --- Constellation subsystem (05-05): initialized BEFORE this module's
  // own listeners so its reduced-motion snap runs ahead of the scene's
  // static repaint on an OS motion-preference flip. It registers its OWN
  // independent 'nightsky:panel-change' listener for brighten/dim — the
  // pause-gate listener below stays untouched. requestRepaint feeds the
  // reduced-motion instant brighten/dim path one static frame. ---
  constellationsHandle = initConstellations({
    tokens: skyTokens,
    getViewport: () => (layer0 ? { width: layer0.cssWidth, height: layer0.cssHeight } : null),
    requestRepaint: renderStaticFrame,
  });

  // --- Meteor subsystem (05.1-01, SKY-06): initialized after the
  // constellations, mirroring their wiring — starts suppressed; the
  // updateRunState gate un-suppresses it only while the loop runs. ---
  meteorsHandle = initMeteors({
    tokens: skyTokens,
    getViewport: () => (layer0 ? { width: layer0.cssWidth, height: layer0.cssHeight } : null),
  });

  // --- Pause-signal listeners (SKY-04). The panel-change subscription is
  // by LITERAL event name — deck.ts is never imported (module-boundary
  // rule; deck.ts documents the detail shape { index, id, total }). This
  // listener owns ONLY the pause gate — 05-05's constellation brighten/
  // dim registers its own independent listener on the same event
  // (05-RESEARCH.md Pattern 6's two-independent-listeners note). ---
  const onVisibilityChange = (): void => {
    tabVisible = !document.hidden;
    updateRunState();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  const onPanelChange = (e: Event): void => {
    const detail = (e as CustomEvent<{ id: string }>).detail;
    fig01Active = detail?.id === 'fig-01';
    updateRunState();
  };
  document.addEventListener('nightsky:panel-change', onPanelChange);

  // Reduced-motion re-branch (live OS toggle): always stop first, then
  // either paint the one static frame or re-enter the normal gate — the
  // loop is never reachable while rm.matches (05-RESEARCH.md Pattern 6 /
  // Anti-Patterns: reduced motion is stop, not dampen).
  const onMotionChange = (): void => {
    stopAnimationLoop();
    // updateRunState re-applies both the loop gate and the firing
    // suppression for the new preference (under reduced motion it keeps
    // the loop stopped and suppresses firing).
    updateRunState();
    if (rm.matches) {
      renderStaticFrame();
    }
  };
  rm.addEventListener('change', onMotionChange);

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
  fig01Seeded = false; // re-arm the one-shot Fix B seed for this init
  fig01Active = false;
  regenerateLayer0();

  return function teardown(): void {
    generation++; // invalidate any in-flight generation
    stopAnimationLoop();
    constellationsHandle?.teardown();
    constellationsHandle = null;
    meteorsHandle?.teardown();
    meteorsHandle = null;
    cloudsHandle?.teardown();
    cloudsHandle = null;
    auroraHandle?.teardown();
    auroraHandle = null;
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('nightsky:panel-change', onPanelChange);
    rm.removeEventListener('change', onMotionChange);
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
