// render.ts — canvas drawing primitives for Fig. 01. Ported verbatim
// (geometry) from the approved prototype
// (.planning/reference/prototype-shell-and-fig01.html lines 171-339),
// restructured into typed functions that read FigureState (model.ts) and
// source every brand color from tokens.ts — never a hex literal.
//
// This module owns pixels only: it reads FigureState; the single rAF
// driver and reduced-motion static path are added in a later task of this
// same plan. model.ts owns all topology/route/beam/fault logic.

import {
  computeLayout,
  pAt,
  type FigureState,
  type NodeId,
  type NodeSpec,
  type RouteGeom,
} from './model';
import { getTokens, rgba, type FigTokens } from './tokens';

/** Dot-grid pitch, in px (prototype `gs=22`). */
const GRID_PITCH = 22;
/** Dot size, in px (prototype `.fillRect(gx,gy,1.4,1.4)`). */
const GRID_DOT_SIZE = 1.4;
/** Cursor-lens radius squared, in px^2 (prototype `dd<14400` -> radius 120). */
const LENS_RADIUS_SQ = 14400;
/** Cursor-lens falloff radius, in px (prototype `Math.sqrt(dd)/120`). */
const LENS_RADIUS = 120;

/** Route build-in: start offset (ms) before route 0 begins drawing on. */
const ROUTE_STAGGER_START = 500;
/** Route build-in: per-route stagger delay (ms). */
const ROUTE_STAGGER_STEP = 55;
/** Route build-in: per-route ease-in duration (ms). */
const ROUTE_STAGGER_DURATION = 420;

/** Beam: gradient tail length, in px. */
const BEAM_TAIL_LEN = 70;
/** Beam: stroke width, in px. */
const BEAM_STROKE_WIDTH = 1.6;
/** Beam: head dot radius, in px. */
const BEAM_HEAD_RADIUS = 2.2;

/** ML node breathing ring: oscillation period, in ms. */
const ML_RING_PERIOD = 1200;

/** Canvas-only structural grey (hairline family) — 02-UI-SPEC-blessed inline rgba, not a brand token. */
const HAIRLINE = 'rgba(122, 138, 160, 0.16)';
/** Canvas-only very-faint resting node border at glow~=0 — 02-UI-SPEC "Hairline (dim)" row. */
const HAIRLINE_DIM_BASE = 'rgba(122, 138, 160,';
/** Canvas-only device-glyph stroke/fill — structural grey, prototype-verbatim, not a brand token. */
const DEVICE_GLYPH = 'rgba(170, 180, 195, 0.7)';
/** Canvas-only lightened-accent beam head dot — 02-UI-SPEC-blessed inline rgba (same hue family as --accent). */
const BEAM_HEAD_COLOR = 'rgba(240, 190, 150, 0.9)';

/** Computes the capped device pixel ratio (FIG-07 DPR cap: never exceed 2). */
export function getDpr(): number {
  return Math.min(devicePixelRatio || 1, 2);
}

/**
 * Sizes the canvas backing store for HiDPI and delegates geometry to
 * model's `computeLayout`. DOM sizing lives here; pure geometry lives in
 * model.ts (02-UI-SPEC "Canvas stage dimensions").
 */
export function layout(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  stage: Element,
  state: FigureState,
  dpr: number
): { W: number; H: number } {
  const r = stage.getBoundingClientRect();
  const W = r.width;
  const H = canvas.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  computeLayout(state, W, H);
  return { W, H };
}

/** Rounded-rect path helper via arcTo (prototype `rr`, lines 337-339). */
export function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Draws the elbow path of `route` up to `frac` (0-1) of its total length — used for route draw-on (prototype `pathTo`, lines 185-191). */
export function pathTo(ctx: CanvasRenderingContext2D, route: RouteGeom, frac: number): void {
  const target = route.len * frac;
  const p = route.pts;
  ctx.beginPath();
  ctx.moveTo(p[0][0], p[0][1]);
  let acc = 0;
  for (let i = 0; i < 3; i++) {
    const sl = route.segs[i];
    if (target >= acc + sl) {
      ctx.lineTo(p[i + 1][0], p[i + 1][1]);
    } else {
      const t = (target - acc) / (sl || 1);
      const P = p[i];
      const Q = p[i + 1];
      ctx.lineTo(P[0] + (Q[0] - P[0]) * Math.max(0, t), P[1] + (Q[1] - P[1]) * Math.max(0, t));
      break;
    }
    acc += sl;
  }
}

/** Dot-grid substrate + cursor lens (prototype lines 238-244). Structural greys are canvas-only per 02-UI-SPEC's Color table, expressed as rgba() — never hex. */
export function drawGrid(ctx: CanvasRenderingContext2D, state: FigureState, W: number, H: number): void {
  const base = 'rgba(140, 155, 175, 0.055)';
  ctx.fillStyle = base;
  for (let gy = GRID_PITCH; gy < H; gy += GRID_PITCH) {
    for (let gx = GRID_PITCH; gx < W; gx += GRID_PITCH) {
      if (state.mouse.x >= 0) {
        const dx = gx - state.mouse.x;
        const dy = gy - state.mouse.y;
        const dd = dx * dx + dy * dy;
        if (dd < LENS_RADIUS_SQ) {
          const a = 0.055 + 0.1 * (1 - Math.sqrt(dd) / LENS_RADIUS);
          ctx.fillStyle = `rgba(140, 155, 175, ${a})`;
          ctx.fillRect(gx, gy, GRID_DOT_SIZE, GRID_DOT_SIZE);
          ctx.fillStyle = base;
          continue;
        }
      }
      ctx.fillRect(gx, gy, GRID_DOT_SIZE, GRID_DOT_SIZE);
    }
  }
}

/** Draws every route at build-in progress `progFor(key,i)` with dead-end dashing for a degraded cell (shared by the animated draw-on path and the later static/reduced-motion path). */
export function drawRoutesAtProgress(
  ctx: CanvasRenderingContext2D,
  state: FigureState,
  tokens: FigTokens,
  progFor: (key: string, i: number) => number
): void {
  const deadEndStroke = rgba(tokens.amber, 0.2);
  const keys = Object.keys(state.routes);
  keys.forEach((key, i) => {
    const rt = state.routes[key];
    const prog = progFor(key, i);
    if (prog <= 0) return;
    const deadEnd = state.degraded !== null && key.indexOf(state.degraded) >= 0;
    ctx.strokeStyle = deadEnd ? deadEndStroke : HAIRLINE;
    ctx.lineWidth = 1;
    if (deadEnd) ctx.setLineDash([3, 4]);
    pathTo(ctx, rt, prog);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

/** Draws every route with build-in stagger draw-on and dead-end dashing for a degraded cell (prototype lines 250-256). `T` is the intro clock in ms. */
export function drawRoutes(
  ctx: CanvasRenderingContext2D,
  state: FigureState,
  tokens: FigTokens,
  T: number
): void {
  drawRoutesAtProgress(ctx, state, tokens, (_key, i) => {
    const start = ROUTE_STAGGER_START + i * ROUTE_STAGGER_STEP;
    return Math.min(1, Math.max(0, (T - start) / ROUTE_STAGGER_DURATION));
  });
}

/** Additive-blend gradient beams — tail + head dot, walking the elbow precisely between tail and head (prototype lines 260-282). Beam advance/glow state is owned by model's `advanceBeams`, called from `drawFrame` (added in this plan's next task) before this. */
export function drawBeams(ctx: CanvasRenderingContext2D, state: FigureState, tokens: FigTokens): void {
  ctx.globalCompositeOperation = 'lighter';
  for (const b of state.beams) {
    const rt = state.routes[b.legs[b.leg]];
    if (!rt) continue;
    const tail = Math.max(0, b.d - BEAM_TAIL_LEN);
    const hp = pAt(rt, b.d);
    const tp = pAt(rt, tail);
    const g = ctx.createLinearGradient(tp[0], tp[1], hp[0], hp[1]);
    g.addColorStop(0, rgba(tokens.accent, 0));
    g.addColorStop(1, rgba(tokens.accent, 0.85));
    ctx.strokeStyle = g;
    ctx.lineWidth = BEAM_STROKE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(tp[0], tp[1]);
    let acc = 0;
    for (let s = 0; s < 3; s++) {
      const sl = rt.segs[s];
      const s0 = acc;
      const s1 = acc + sl;
      acc += sl;
      if (s1 <= tail || s0 >= b.d) continue;
      const P = rt.pts[s];
      const Q = rt.pts[s + 1];
      const f2 = Math.min(1, (b.d - s0) / (sl || 1));
      ctx.lineTo(P[0] + (Q[0] - P[0]) * f2, P[1] + (Q[1] - P[1]) * f2);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hp[0], hp[1], BEAM_HEAD_RADIUS, 0, 6.28);
    ctx.fillStyle = BEAM_HEAD_COLOR;
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

/** Draws one node — body/glyph/label/status-dot/glow/breathing-ring/fault/focus styling (prototype `drawNode`, lines 299-336). */
export function drawNode(
  ctx: CanvasRenderingContext2D,
  id: NodeId,
  node: NodeSpec,
  rise: number,
  alpha: number,
  T: number,
  state: FigureState,
  tokens: FigTokens
): void {
  const x = node.px - node.w / 2;
  const y = node.py - node.h / 2 + rise;
  const bad = id === state.degraded;
  const hovered = state.hoverN === id;
  const focused = state.focusedNode === id;
  ctx.globalAlpha = alpha;

  // Glow halo when active
  if (node.glow > 0.05) {
    const hg = ctx.createRadialGradient(node.px, node.py + rise, 2, node.px, node.py + rise, node.w);
    hg.addColorStop(0, rgba(tokens.accent, 0.14 * node.glow));
    hg.addColorStop(1, rgba(tokens.accent, 0));
    ctx.fillStyle = hg;
    ctx.fillRect(node.px - node.w, node.py + rise - node.w, node.w * 2, node.w * 2);
  }

  ctx.fillStyle = rgba(tokens.panel2, 1);
  rr(ctx, x, y, node.w, node.h, 6);
  ctx.fill();
  ctx.lineWidth = 1;
  let border = bad
    ? rgba(tokens.amber, 1)
    : hovered
      ? rgba(tokens.accent, 1)
      : `${HAIRLINE_DIM_BASE} ${0.28 + 0.5 * node.glow})`;
  if (node.glow > 0.4 && !bad) border = rgba(tokens.accent, 0.3 + 0.55 * node.glow);
  ctx.strokeStyle = border;
  if (bad) ctx.setLineDash([3, 3]);
  rr(ctx, x, y, node.w, node.h, 6);
  ctx.stroke();
  ctx.setLineDash([]);

  // Content
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (node.glyph === 'dev') {
    ctx.strokeStyle = DEVICE_GLYPH;
    ctx.lineWidth = 1;
    rr(ctx, node.px - 5, node.py + rise - 7, 10, 14, 2);
    ctx.stroke();
    ctx.fillStyle = DEVICE_GLYPH;
    ctx.fillRect(node.px - 1.5, node.py + rise + 4, 3, 1.2);
  } else {
    // Canvas-drawn node label — the canvas rendering of the --ink role at
    // two alphas (~.86 default, 1.0 on hover), per 02-UI-SPEC "Canvas-drawn
    // text": never a hardcoded hex, always sourced from tokens.ink.
    ctx.font = '11px ui-monospace,Consolas,monospace';
    ctx.fillStyle = rgba(tokens.ink, hovered ? 1 : 0.86);
    ctx.fillText(node.lab ?? '', node.px, node.py + rise + 0.5);
  }

  // Status dot
  if (!node.glyph) {
    ctx.beginPath();
    ctx.arc(x + node.w - 7, y + 7, 2, 0, 6.28);
    ctx.fillStyle = bad ? rgba(tokens.amber, 1) : rgba(tokens.good, 1);
    ctx.globalAlpha = alpha * (bad ? 1 : 0.8);
    ctx.fill();
  }

  // Labels under (client dev nodes) — canvas rendering of --dim, sourced
  // from tokens.dim (never hardcoded), per 02-UI-SPEC.
  if (node.lab && node.glyph) {
    ctx.font = '10.5px ui-monospace,Consolas,monospace';
    ctx.fillStyle = rgba(tokens.dim, 0.9);
    ctx.fillText(node.lab, node.px, y + node.h + 12);
  }

  // Soft breathing ring on the AI node
  if (node.ml) {
    const b2 = 0.5 + 0.5 * Math.sin(T / ML_RING_PERIOD);
    ctx.beginPath();
    ctx.arc(node.px, node.py + rise, node.h * 0.9 + b2 * 2, 0, 6.28);
    ctx.strokeStyle = rgba(tokens.accent, 0.1 + 0.08 * b2);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Keyboard focus ring — on-canvas indicator mirroring the hover border
  // (02-UI-SPEC "Keyboard" row: 2px accent stroke, offset 2px outward).
  if (focused) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = rgba(tokens.accent, 1);
    ctx.lineWidth = 2;
    rr(ctx, x - 2, y - 2, node.w + 4, node.h + 4, 8);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

// Re-exported so callers wiring up the figure only need to import from
// render.ts for both drawing primitives and token access during setup.
export { getTokens };
