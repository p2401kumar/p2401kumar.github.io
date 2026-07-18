// constellations.ts — the 4 career-chapter constellations (CONST-01/02):
// star-node + sparse-link rendering and panel-reactive brighten/dim.
// Consumes the typed data module (src/data/constellations.ts) as its
// single source of truth — star coordinates, link graph, and the
// panelToConstellation mapping are never re-derived here.
//
// Module-boundary rule (05-CONTEXT.md, grep-enforced): this module NEVER
// imports deck.ts or any fig01 module. The active-panel signal arrives via
// the document-level 'nightsky:panel-change' CustomEvent subscribed by its
// LITERAL event name (an independent listener — scene.ts's pause-gate
// listener on the same event stays untouched).
//
// Rendering discipline (05-RESEARCH.md / 05-UI-SPEC.md):
//   - Base rendering is cheap: pixel positions + link geometry are
//     precomputed once per viewport size (ensureLayout), never per frame.
//   - Brighten/dim is an alpha lerp toward per-state targets over ~400ms
//     ease-out, advanced inside scene.ts's single rAF tick (advance()).
//     Under prefers-reduced-motion the change is INSTANT: alphas snap and
//     one repaint is requested (mirroring fig01/interactions.ts's
//     createRedraw repaint-once-after-state-change shape).
//   - All stars/links/halos use --star exclusively (via the sky token
//     bridge) — never --milkyway, never --accent, zero hex here.
//   - Labels are DATA-ONLY this phase: no constellation label string is
//     ever rendered as canvas text (05-UI-SPEC.md Copywriting Contract).

import { constellations, panelToConstellation } from '../../data/constellations';
import type { Constellation } from '../../data/constellations';
import { rgba, type SkyTokens } from './tokens';

const TWO_PI = Math.PI * 2;

// --- Highlight-state alpha targets (05-UI-SPEC.md "Ambient/brightened/
// dimmed alpha states" table). Star alphas carry a small magnitude split
// (bright anchors sit at the top of each locked range, mid connectors
// lower) so clusters keep internal hierarchy in every state. ---
type HighlightState = 'ambient' | 'brightened' | 'dimmed';

interface AlphaChannels {
  /** Alpha for `mid`-magnitude connecting stars. */
  starMid: number;
  /** Alpha for `bright`-magnitude anchor stars. */
  starBright: number;
  /** Alpha for the hairline link segments. */
  link: number;
  /** Alpha for the radial halo (brightened state only). */
  halo: number;
}

const STATE_ALPHAS: Record<HighlightState, AlphaChannels> = {
  // Star 0.40–0.55, link 0.12–0.20, no halo.
  ambient: { starMid: 0.45, starBright: 0.55, link: 0.16, halo: 0 },
  // Star 0.85–1.00, link 0.45–0.55, halo alpha 0.20–0.30.
  brightened: { starMid: 0.88, starBright: 1, link: 0.5, halo: 0.25 },
  // Star 0.25–0.35, link 0.08–0.12, no halo.
  dimmed: { starMid: 0.27, starBright: 0.34, link: 0.1, halo: 0 },
};

/** Brighten/dim tween duration (locked ~400ms ease-out, 05-CONTEXT.md). */
const TWEEN_MS = 400;
/** Constellation star radii (05-UI-SPEC.md: 2.5–4px, always larger than
 * the ambient field's 2px cap so clusters are findable at rest). */
const STAR_RADIUS_MID = 2.75;
const STAR_RADIUS_BRIGHT = 4;
/** Link hairline stroke (05-UI-SPEC.md: 0.75–1px). */
const LINK_STROKE_WIDTH = 0.85;
/** Brightened halo radius multiplier over the star radius (≈1.5×). */
const HALO_SCALE = 1.5;
/** Alpha below which halo drawing is skipped entirely. */
const HALO_EPSILON = 0.01;

/** Straight-segment pixel geometry for one link (precomputed per size). */
interface LinkGeom {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  len: number;
}

/** Per-constellation runtime state: highlight state, current/tween alphas,
 * and the precomputed pixel layout for the current viewport size. */
interface ConstellationRuntime {
  def: Constellation;
  state: HighlightState;
  current: AlphaChannels;
  from: AlphaChannels;
  target: AlphaChannels;
  /** Tween start timestamp (performance.now() timeline), null = settled. */
  tweenStart: number | null;
  starX: number[];
  starY: number[];
  starRadius: number[];
  starIsBright: boolean[];
  linkGeoms: LinkGeom[];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  const u = 1 - Math.max(0, Math.min(1, t));
  return 1 - u * u * u;
}

/** What initConstellations needs from scene.ts (and nothing more). */
export interface ConstellationInitOptions {
  /** The scene's parsed sky tokens — only `--star` is used here. */
  tokens: SkyTokens;
  /** Current CSS-pixel viewport size, or null while none is adopted. */
  getViewport: () => { width: number; height: number } | null;
  /** Repaint-once hook for the reduced-motion instant brighten/dim path
   * (scene.ts passes renderStaticFrame). */
  requestRepaint: () => void;
}

/** The handle scene.ts drives from its single rAF tick. */
export interface ConstellationHandle {
  /** Renders every constellation's links + halos + stars at their current
   * alphas. */
  draw(ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number, ts: number): void;
  /** Eases current alphas toward their targets (~400ms ease-out). Called
   * once per frame before draw(). */
  advance(ts: number): void;
  /** Removes the panel-change + motion listeners. */
  teardown(): void;
}

/**
 * Boots the constellation subsystem. Registers an INDEPENDENT document
 * listener on the literal 'nightsky:panel-change' event (deck.ts is never
 * imported) that resolves detail.id → constellation id through the data
 * module's panelToConstellation mapping: that constellation targets
 * Brightened, its siblings Dimmed; a panel that maps to none (hero/
 * contact) sends all four to Ambient. At most one is ever Brightened.
 */
export function initConstellations(options: ConstellationInitOptions): ConstellationHandle {
  const { tokens, requestRepaint } = options;
  const star = tokens.star;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');

  const runtimes: ConstellationRuntime[] = constellations.map((def) => ({
    def,
    state: 'ambient',
    current: { ...STATE_ALPHAS.ambient },
    from: { ...STATE_ALPHAS.ambient },
    target: { ...STATE_ALPHAS.ambient },
    tweenStart: null,
    starX: [],
    starY: [],
    starRadius: [],
    starIsBright: [],
    linkGeoms: [],
  }));

  // --- Precomputed pixel layout (recomputed ONLY when the viewport size
  // changes — base rendering does no per-frame layout math). ---
  let layoutWidth = -1;
  let layoutHeight = -1;
  function ensureLayout(cssWidth: number, cssHeight: number): void {
    if (cssWidth === layoutWidth && cssHeight === layoutHeight) return;
    layoutWidth = cssWidth;
    layoutHeight = cssHeight;
    for (const rt of runtimes) {
      rt.starX = rt.def.stars.map((s) => s.x * cssWidth);
      rt.starY = rt.def.stars.map((s) => s.y * cssHeight);
      rt.starRadius = rt.def.stars.map((s) =>
        s.magnitude === 'bright' ? STAR_RADIUS_BRIGHT : STAR_RADIUS_MID
      );
      rt.starIsBright = rt.def.stars.map((s) => s.magnitude === 'bright');
      rt.linkGeoms = rt.def.links.map((link) => {
        const x1 = rt.starX[link.from];
        const y1 = rt.starY[link.from];
        const x2 = rt.starX[link.to];
        const y2 = rt.starY[link.to];
        return { x1, y1, x2, y2, len: Math.hypot(x2 - x1, y2 - y1) };
      });
    }
  }

  // --- Panel-reactive brighten/dim (CONST-02). ---
  function setTargets(activeConstellationId: string | null): void {
    let changed = false;
    const now = performance.now();
    for (const rt of runtimes) {
      const state: HighlightState =
        activeConstellationId === null
          ? 'ambient'
          : rt.def.id === activeConstellationId
            ? 'brightened'
            : 'dimmed';
      if (state === rt.state) continue; // target already correct (settled or mid-tween)
      rt.state = state;
      rt.target = { ...STATE_ALPHAS[state] };
      if (rm.matches) {
        // Instant state change — no tween (essential wayfinding still
        // occurs under reduced motion, collapsed to 0ms).
        rt.current = { ...rt.target };
        rt.tweenStart = null;
      } else {
        rt.from = { ...rt.current };
        rt.tweenStart = now;
      }
      changed = true;
    }
    // Reduced motion: the loop never runs, so request exactly ONE repaint
    // (mirrors fig01/interactions.ts createRedraw's repaint-once shape).
    if (changed && rm.matches) requestRepaint();
  }

  const onPanelChange = (e: Event): void => {
    const detail = (e as CustomEvent<{ id: string }>).detail;
    const activeId = detail?.id ? (panelToConstellation[detail.id] ?? null) : null;
    setTargets(activeId);
  };
  document.addEventListener('nightsky:panel-change', onPanelChange);

  // If the OS preference flips to reduced motion mid-tween, snap every
  // in-flight tween to its target so the static frame scene.ts paints
  // next shows the settled state, never a frozen mid-fade.
  const onMotionChange = (): void => {
    if (!rm.matches) return;
    for (const rt of runtimes) {
      rt.current = { ...rt.target };
      rt.tweenStart = null;
    }
  };
  rm.addEventListener('change', onMotionChange);

  function advance(ts: number): void {
    // Alpha tween: ~400ms ease-out toward each constellation's target.
    for (const rt of runtimes) {
      if (rt.tweenStart === null) continue;
      const t = (ts - rt.tweenStart) / TWEEN_MS;
      if (t >= 1) {
        rt.current = { ...rt.target };
        rt.tweenStart = null;
      } else {
        const e = easeOutCubic(t);
        rt.current = {
          starMid: lerp(rt.from.starMid, rt.target.starMid, e),
          starBright: lerp(rt.from.starBright, rt.target.starBright, e),
          link: lerp(rt.from.link, rt.target.link, e),
          halo: lerp(rt.from.halo, rt.target.halo, e),
        };
      }
    }
  }

  function draw(
    ctx: CanvasRenderingContext2D,
    cssWidth: number,
    cssHeight: number,
    _ts: number
  ): void {
    ensureLayout(cssWidth, cssHeight);
    for (const rt of runtimes) {
      const cur = rt.current;
      // Links: one batched path per constellation at its current alpha.
      ctx.strokeStyle = rgba(star, cur.link);
      ctx.lineWidth = LINK_STROKE_WIDTH;
      ctx.beginPath();
      for (const geom of rt.linkGeoms) {
        ctx.moveTo(geom.x1, geom.y1);
        ctx.lineTo(geom.x2, geom.y2);
      }
      ctx.stroke();
      // Halos (brightened only) under their star dots.
      if (cur.halo > HALO_EPSILON) {
        for (let i = 0; i < rt.starX.length; i++) {
          const haloRadius = rt.starRadius[i] * HALO_SCALE;
          const halo = ctx.createRadialGradient(
            rt.starX[i],
            rt.starY[i],
            0,
            rt.starX[i],
            rt.starY[i],
            haloRadius
          );
          halo.addColorStop(0, rgba(star, cur.halo));
          halo.addColorStop(1, rgba(star, 0));
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(rt.starX[i], rt.starY[i], haloRadius, 0, TWO_PI);
          ctx.fill();
        }
      }
      // Star dots (2.5–4px — always above the ambient field's 2px cap).
      for (let i = 0; i < rt.starX.length; i++) {
        ctx.fillStyle = rgba(star, rt.starIsBright[i] ? cur.starBright : cur.starMid);
        ctx.beginPath();
        ctx.arc(rt.starX[i], rt.starY[i], rt.starRadius[i], 0, TWO_PI);
        ctx.fill();
      }
    }
  }

  function teardown(): void {
    document.removeEventListener('nightsky:panel-change', onPanelChange);
    rm.removeEventListener('change', onMotionChange);
  }

  return { draw, advance, teardown };
}
