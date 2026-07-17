// model.ts — pure, DOM-free topology, route geometry, and beam/fault state
// machine for Fig. 01. Ported verbatim (math/logic) from the approved
// prototype (.planning/reference/prototype-shell-and-fig01.html lines
// 149-216, 233-297), restructured into typed, testable functions.
//
// This module has NO DOM/canvas dependency — render.ts draws from
// FigureState, interactions.ts mutates it; this file only computes.

/** The 10 node identifiers in topology order. */
export type NodeId =
  | 'c0'
  | 'c1'
  | 'c2'
  | 'lb'
  | 'cell0'
  | 'cell1'
  | 'cell2'
  | 'cell3'
  | 'dp'
  | 'ml';

/**
 * A node's geometry + runtime paint state. Kind-specific fields (glyph/
 * cell/ml/lab) are optional so every node literal type-checks under strict
 * TS without `as any` (02-RESEARCH.md Pitfall 4); common fields (position/
 * size + computed px/py/glow) are required.
 */
export interface NodeSpec {
  /** Fractional x position (0-1) of stage width */
  x: number;
  /** Fractional y position (0-1) of stage height */
  y: number;
  /** Width in px */
  w: number;
  /** Height in px */
  h: number;
  /** Computed pixel x (set by computeLayout) */
  px: number;
  /** Computed pixel y (set by computeLayout) */
  py: number;
  /** Beam-arrival glow intensity, decays each frame in render.ts */
  glow: number;
  /** Device-glyph client node marker */
  glyph?: 'dev';
  /** True for the 4 cell nodes (fault-eligible) */
  cell?: boolean;
  /** True for the ml/snapshots node (breathing-ring treatment) */
  ml?: boolean;
  /** Mono label drawn inside/below the node (empty string = no label) */
  lab?: string;
}

/** Elbow (3-segment Manhattan) route geometry between two nodes. */
export interface RouteGeom {
  pts: [number, number][];
  segs: number[];
  len: number;
}

/** An in-flight request beam traveling a multi-leg route. */
export interface Beam {
  /** Route keys to traverse in order, e.g. ['c1>lb','lb>cell2','cell2>dp','dp>ml'] */
  legs: string[];
  /** Index into legs of the leg currently being traversed */
  leg: number;
  /** Distance traveled along the current leg, in px */
  d: number;
}

/** The full runtime state of the figure — the single contract render.ts draws from and interactions.ts mutates. */
export interface FigureState {
  nodes: Record<NodeId, NodeSpec>;
  routes: Record<string, RouteGeom>;
  beams: Beam[];
  degraded: NodeId | null;
  mouse: { x: number; y: number };
  hoverN: NodeId | null;
  focusedNode: NodeId | null;
  /** Intro build-in progress clock, in ms since first frame (0 pre-start) */
  intro: number;
  /** First-frame timestamp, null until the rAF loop has run once */
  t0: number | null;
}

/** Topology order — also the build-in stagger order (01-UI-SPEC.md). */
export const order: NodeId[] = [
  'c0',
  'c1',
  'c2',
  'lb',
  'cell0',
  'cell1',
  'cell2',
  'cell3',
  'dp',
  'ml',
];

/** The 4 isolated-failure-domain cell nodes, in order (cell0 never fault-eligible). */
export const cells: NodeId[] = ['cell0', 'cell1', 'cell2', 'cell3'];

/** The 3 client nodes ambient/manual beams may originate from. */
const clientIds: NodeId[] = ['c0', 'c1', 'c2'];

function isClientId(id: NodeId): boolean {
  return (clientIds as string[]).includes(id);
}

/**
 * Canonical node topology (fractional position + size + kind markers),
 * verbatim from the prototype's `nodes` object. This is the shared template
 * `createState()` clones into each FigureState — px/py/glow here are
 * placeholders (0), recomputed per-state by computeLayout/advanceBeams.
 */
export const nodes: Record<NodeId, NodeSpec> = {
  c0: { x: 0.06, y: 0.3, w: 34, h: 24, px: 0, py: 0, glow: 0, glyph: 'dev', lab: '' },
  c1: { x: 0.06, y: 0.5, w: 34, h: 24, px: 0, py: 0, glow: 0, glyph: 'dev', lab: 'clients' },
  c2: { x: 0.06, y: 0.7, w: 34, h: 24, px: 0, py: 0, glow: 0, glyph: 'dev', lab: '' },
  lb: { x: 0.245, y: 0.5, w: 120, h: 34, px: 0, py: 0, glow: 0, lab: 'elb/weight-away' },
  cell0: { x: 0.475, y: 0.14, w: 96, h: 32, px: 0, py: 0, glow: 0, cell: true, lab: 'cell-0' },
  cell1: { x: 0.475, y: 0.38, w: 96, h: 32, px: 0, py: 0, glow: 0, cell: true, lab: 'cell-1' },
  cell2: { x: 0.475, y: 0.62, w: 96, h: 32, px: 0, py: 0, glow: 0, cell: true, lab: 'cell-2' },
  cell3: { x: 0.475, y: 0.86, w: 96, h: 32, px: 0, py: 0, glow: 0, cell: true, lab: 'cell-3' },
  dp: { x: 0.7, y: 0.5, w: 110, h: 34, px: 0, py: 0, glow: 0, lab: 'data-pipelines' },
  ml: { x: 0.905, y: 0.5, w: 104, h: 34, px: 0, py: 0, glow: 0, ml: true, lab: 'ml/snapshots' },
};

/** The 12 topology edges: 3 client->lb, 4 lb->cellN, 4 cellN->dp, 1 dp->ml. */
export const routeDefs: [NodeId, NodeId][] = [
  ['c0', 'lb'],
  ['c1', 'lb'],
  ['c2', 'lb'],
  ['lb', 'cell0'],
  ['lb', 'cell1'],
  ['lb', 'cell2'],
  ['lb', 'cell3'],
  ['cell0', 'dp'],
  ['cell1', 'dp'],
  ['cell2', 'dp'],
  ['cell3', 'dp'],
  ['dp', 'ml'],
];

function cloneNodes(): Record<NodeId, NodeSpec> {
  const cloned = {} as Record<NodeId, NodeSpec>;
  for (const id of order) {
    cloned[id] = { ...nodes[id], px: 0, py: 0, glow: 0 };
  }
  return cloned;
}

/** Creates a fresh, independent FigureState (own node/route/beam data — no shared mutable module state). */
export function createState(): FigureState {
  return {
    nodes: cloneNodes(),
    routes: {},
    beams: [],
    degraded: null,
    mouse: { x: -1, y: -1 },
    hoverN: null,
    focusedNode: null,
    intro: 0,
    t0: null,
  };
}

/**
 * Computes each node's pixel position and each route's elbow geometry for
 * the given stage size. Ported verbatim from the prototype's `layout()`
 * (minus the canvas-sizing DOM calls, which belong to render.ts).
 */
export function computeLayout(state: FigureState, W: number, H: number): void {
  for (const id of order) {
    const n = state.nodes[id];
    n.px = n.x * W;
    n.py = n.y * H;
  }
  const routes: Record<string, RouteGeom> = {};
  for (const [fromId, toId] of routeDefs) {
    const a = state.nodes[fromId];
    const b = state.nodes[toId];
    const x1 = a.px + a.w / 2;
    const y1 = a.py;
    const x2 = b.px - b.w / 2;
    const y2 = b.py;
    const mx = (x1 + x2) / 2;
    const pts: [number, number][] = [
      [x1, y1],
      [mx, y1],
      [mx, y2],
      [x2, y2],
    ];
    const segs: number[] = [];
    let len = 0;
    for (let i = 0; i < 3; i++) {
      const l = Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]);
      segs.push(l);
      len += l;
    }
    routes[`${fromId}>${toId}`] = { pts, segs, len };
  }
  state.routes = routes;
}

/** Pure point-at-distance sampler along a route's elbow path (prototype `pAt`). */
export function pAt(route: RouteGeom, d: number): [number, number] {
  let dist = Math.max(0, Math.min(route.len, d));
  for (let i = 0; i < 3; i++) {
    if (dist <= route.segs[i]) {
      const t = route.segs[i] ? dist / route.segs[i] : 0;
      const P = route.pts[i];
      const Q = route.pts[i + 1];
      return [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
    }
    dist -= route.segs[i];
  }
  return route.pts[3];
}

/** Returns all cells still routable (excludes the currently-degraded cell, if any). */
export function healthyCells(state: FigureState): NodeId[] {
  return cells.filter((c) => c !== state.degraded);
}

/** Picks a random fault-eligible cell — cell0 is never eligible (matches prototype `1+Math.floor(Math.random()*3)`). */
export function pickFaultCell(): NodeId {
  const eligible = cells.slice(1);
  return eligible[Math.floor(Math.random() * eligible.length)];
}

/** Degrades a random non-cell0 cell. No-op if a cell is already degraded. */
export function injectFault(state: FigureState): void {
  if (state.degraded) return;
  state.degraded = pickFaultCell();
}

/** Clears the currently-degraded cell, restoring full routing. */
export function healFault(state: FigureState): void {
  state.degraded = null;
}

/**
 * Spawns a beam that travels `from -> lb -> healthyCell -> dp -> ml`.
 * Defaults to a random client when `fromId` is omitted or is not a client
 * node (ambient dispatch); dispatches from `fromId` directly when it is a
 * client node (manual click/keyboard dispatch).
 */
export function spawnBeam(state: FigureState, fromId?: NodeId): void {
  const from = fromId && isClientId(fromId) ? fromId : clientIds[Math.floor(Math.random() * clientIds.length)];
  const hc = healthyCells(state);
  const cell = hc[Math.floor(Math.random() * hc.length)];
  state.beams.push({
    legs: [`${from}>lb`, `lb>${cell}`, `${cell}>dp`, 'dp>ml'],
    leg: 0,
    d: 0,
  });
}

/**
 * Advances every in-flight beam by `dt * 0.22` px. On reaching a leg's end,
 * sets the arrival node's glow to 1 and advances to the next leg; removes
 * the beam once its final leg completes (prototype `frame()` beam block).
 */
export function advanceBeams(state: FigureState, dt: number): void {
  for (let i = state.beams.length - 1; i >= 0; i--) {
    const b = state.beams[i];
    let rt = state.routes[b.legs[b.leg]];
    if (!rt) {
      state.beams.splice(i, 1);
      continue;
    }
    b.d += dt * 0.22;
    if (b.d >= rt.len) {
      const toId = b.legs[b.leg].split('>')[1] as NodeId;
      state.nodes[toId].glow = 1;
      b.leg++;
      b.d = 0;
      if (b.leg >= b.legs.length) {
        state.beams.splice(i, 1);
        continue;
      }
      rt = state.routes[b.legs[b.leg]];
      if (!rt) {
        state.beams.splice(i, 1);
      }
    }
  }
}
