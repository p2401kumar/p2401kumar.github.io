// interactions.ts — DOM wiring for Fig. 01: pointer hover/click, the
// send/fault buttons, and the timestamped aria-live event log. Ported
// verbatim from the approved prototype
// (.planning/reference/prototype-shell-and-fig01.html lines 202-229) plus a
// setTimeout-based fault self-heal, deliberately decoupled from the
// animation loop (02-RESEARCH.md Pitfall 3) so it still fires under
// reduced motion. The reduced-motion branch point and the dual-gate
// lifecycle (IntersectionObserver + visibilitychange) are added in this
// plan's next task; keyboard proxy wiring in the task after that.
//
// This module owns DOM events only; model.ts owns state mutation, render.ts
// owns pixels.

import {
  healFault,
  injectFault,
  order,
  spawnBeam,
  type FigureState,
  type NodeId,
  type NodeSpec,
} from './model';
import { fig01Facts } from '../../data/fig01';

/** Node id -> hover/keyboard-proxy fact, keyed for O(1) lookup during pointer/keyboard wiring. */
const factsByNode = new Map(fig01Facts.map((fact) => [fact.nodeId, fact]));

/** Self-heal window for an injected fault, in ms (FIG-03/FIG-05 — verbatim from prototype's 8000ms heal delay). */
const HEAL_DELAY_MS = 8000;

/** Pointer hit-slop beyond a node's visual bounds, in px (02-UI-SPEC "Hover hit-box"). */
const HIT_SLOP_X = 6;
const HIT_SLOP_Y = 8;

/** Tooltip vertical offset above a node's center, in px (prototype `h.py-h.h/2-38`). */
const TIP_OFFSET_Y = 38;
/** Tooltip clamp margin from the stage edges, in px. */
const TIP_EDGE_MARGIN = 8;

/** Formats "now" as HH:mm:ss, 24h, America/Los_Angeles — the same Intl.DateTimeFormat shape as SiteFooter.astro's clock (02-UI-SPEC "Log timestamp format"). */
function formatLogTimestamp(): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Los_Angeles',
  }).format(new Date());
}

/**
 * Writes one timestamped line to the event log, newest first, trimmed to
 * the newest 2 lines (02-UI-SPEC "Log retention"). `cls` selects the
 * fault (`hl`) or recovery (`ok`) styling; omitted for neutral lines. Only
 * appends text via `textContent` — never `innerHTML` (T-02-05 XSS gate).
 */
export function writeLog(logEl: HTMLElement, msg: string, cls?: 'hl' | 'ok'): void {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = `${formatLogTimestamp()}  ${msg}`;
  logEl.prepend(line);
  while (logEl.children.length > 2) {
    const last = logEl.lastElementChild;
    if (!last) break;
    logEl.removeChild(last);
  }
}

/** Hit-tests every node against a canvas-space point, returning the first match in topology order (prototype's mousemove hit-test, lines 219-223). */
function hitTestNode(state: FigureState, x: number, y: number): NodeId | null {
  for (const id of order) {
    const n = state.nodes[id];
    if (Math.abs(x - n.px) < n.w / 2 + HIT_SLOP_X && Math.abs(y - n.py) < n.h / 2 + HIT_SLOP_Y) {
      return id;
    }
  }
  return null;
}

/** Positions the tooltip element above a node's center, clamped within the stage width (shared by mouse hover and keyboard focus — same math both paths). */
function positionTip(tipEl: HTMLElement, node: Pick<NodeSpec, 'px' | 'py' | 'h'>, stageWidth: number): void {
  const tx = Math.min(Math.max(node.px - tipEl.offsetWidth / 2, TIP_EDGE_MARGIN), stageWidth - tipEl.offsetWidth - TIP_EDGE_MARGIN);
  const ty = node.py - node.h / 2 - TIP_OFFSET_Y;
  tipEl.style.left = `${tx}px`;
  tipEl.style.top = `${ty}px`;
}

/** Shows a node's tooltip fact (developer-authored, build-time content only — T-02-05: never wire this to external/user input) and positions it. */
function showTip(tipEl: HTMLElement, id: NodeId, node: NodeSpec, stageWidth: number): void {
  const fact = factsByNode.get(id);
  if (!fact) {
    hideTip(tipEl);
    return;
  }
  tipEl.innerHTML = fact.tooltipHtml;
  tipEl.style.opacity = '1';
  positionTip(tipEl, node, stageWidth);
}

/** Hides the tooltip. */
function hideTip(tipEl: HTMLElement): void {
  tipEl.style.opacity = '0';
}

/**
 * Wires hover hit-testing (mousemove -> tooltip) and click-to-dispatch on
 * the canvas stage (prototype lines 219-229). `redraw` repaints under
 * reduced motion so the hovered node's border updates immediately; under
 * animation it is a no-op because the running loop already repaints.
 */
export function wirePointer(
  state: FigureState,
  canvas: HTMLCanvasElement,
  stage: HTMLElement,
  tipEl: HTMLElement,
  redraw: () => void
): void {
  stage.addEventListener('mousemove', (e: MouseEvent) => {
    const r = canvas.getBoundingClientRect();
    state.mouse.x = e.clientX - r.left;
    state.mouse.y = e.clientY - r.top;
    const hit = hitTestNode(state, state.mouse.x, state.mouse.y);
    state.hoverN = hit;
    canvas.style.cursor = hit ? 'pointer' : 'default';
    if (hit) {
      showTip(tipEl, hit, state.nodes[hit], canvas.clientWidth);
    } else {
      hideTip(tipEl);
    }
    redraw();
  });

  stage.addEventListener('mouseleave', () => {
    state.mouse.x = -1;
    state.mouse.y = -1;
    state.hoverN = null;
    hideTip(tipEl);
    redraw();
  });

  canvas.addEventListener('click', () => {
    if (state.hoverN) {
      spawnBeam(state, state.hoverN);
      redraw();
    }
  });
}

/**
 * Schedules the fault self-heal as a setTimeout — NOT an rAF-driven
 * `performance.now()` comparison (02-RESEARCH.md Pitfall 3) — so a fault
 * injected under reduced motion still heals and narrates. Returns a
 * zero-arg trigger for `wireButtons` to invoke when a fault is injected.
 */
export function scheduleHeal(
  state: FigureState,
  faultBtn: HTMLButtonElement,
  logEl: HTMLElement,
  redraw: () => void
): () => void {
  return (): void => {
    const healingCell = state.degraded;
    setTimeout(() => {
      healFault(state);
      if (healingCell) {
        writeLog(logEl, `${healingCell} recovered · weight restored`, 'ok');
      }
      faultBtn.disabled = false;
      redraw();
    }, HEAL_DELAY_MS);
  };
}

/**
 * Wires the `send request` / `inject fault` chrome buttons (prototype
 * lines 209-216). `triggerHeal` is the zero-arg callback returned by this
 * module's `scheduleHeal()` factory, invoked once a fault is injected.
 */
export function wireButtons(
  state: FigureState,
  sendBtn: HTMLButtonElement,
  faultBtn: HTMLButtonElement,
  logEl: HTMLElement,
  redraw: () => void,
  triggerHeal: () => void
): void {
  sendBtn.addEventListener('click', () => {
    spawnBeam(state);
    writeLog(logEl, 'request dispatched → region');
    redraw();
  });

  faultBtn.addEventListener('click', () => {
    if (state.degraded) return;
    injectFault(state);
    const cell = state.degraded;
    if (cell) {
      writeLog(logEl, `${cell} fault injected → weighed away · traffic rerouting · p99 stable`, 'hl');
    }
    faultBtn.disabled = true;
    redraw();
    triggerHeal();
  });
}
