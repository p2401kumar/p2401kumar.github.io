// index.ts — the single public entry point for Fig. 01. Wires model/render/
// interactions together against a DOM root (the `<figure class="fig">`
// element Figure01.astro renders — that markup arrives in plan 02-04; this
// module wires against the selector/id contract documented below) and
// returns a teardown function (ARCHITECTURE.md "Figure01.astro ↔ lib/fig01/*"
// boundary — plain DOM query + one `initFig01(root)` call, no Astro props
// cross the boundary).
//
// DOM contract this module queries from `root` (Figure01.astro, plan 02-04,
// must render exactly these selectors):
//   .fig-stage        — the pointer/IntersectionObserver/ResizeObserver target
//   #fig01-canvas     — the canvas element
//   #fig01-tip        — the tooltip overlay
//   #fig01-log        — the event log container (aria-live="polite" on the
//                        markup side; this module only appends text)
//   #send / #fault    — the two chrome buttons
//   .node-proxy        — one per node, `data-node="<id>"`, visually-hidden
//                        keyboard-proxy buttons (FIG-06)

import { createState } from './model';
import { getDpr, getTokens, layout, stopAnimationLoop } from './render';
import {
  applyMotionPreference,
  createRedraw,
  scheduleHeal,
  syncProxyFaultLabels,
  wireButtons,
  wireKeyboard,
  wireLifecycle,
  wirePointer,
  writeLog,
} from './interactions';

/** Startup log line — the figure always begins in a healthy, ambient-traffic state (02-UI-SPEC "Log: startup"). */
const STARTUP_LOG = 'region healthy · 4 cells · ambient traffic';

/** Null-checks a required DOM lookup without a non-null assertion (02-RESEARCH.md Pitfall 4). */
function required<T>(value: T | null, name: string): T {
  if (value === null) {
    throw new Error(`initFig01: missing required element "${name}"`);
  }
  return value;
}

/**
 * Wires the Fig. 01 canvas engine to a DOM root. Reads tokens, creates
 * fresh state, lays out the canvas once, wires pointer/button/keyboard
 * interaction, applies the initial reduced-motion branch, and registers
 * the intersection/visibility/resize/motion-preference lifecycle gates.
 * Returns a teardown that stops the loop, removes listeners, and
 * disconnects every observer.
 */
export function initFig01(root: HTMLElement): () => void {
  const stage = required(root.querySelector<HTMLElement>('.fig-stage'), '.fig-stage');
  const canvas = required(root.querySelector<HTMLCanvasElement>('#fig01-canvas'), '#fig01-canvas');
  const tipEl = required(root.querySelector<HTMLElement>('#fig01-tip'), '#fig01-tip');
  const logEl = required(root.querySelector<HTMLElement>('#fig01-log'), '#fig01-log');
  const sendBtn = required(root.querySelector<HTMLButtonElement>('#send'), '#send');
  const faultBtn = required(root.querySelector<HTMLButtonElement>('#fault'), '#fault');
  const proxyButtons = root.querySelectorAll<HTMLButtonElement>('.node-proxy');
  const ctx = required(canvas.getContext('2d'), '2d context');

  const tokens = getTokens();
  const state = createState();
  layout(ctx, canvas, stage, state, getDpr());

  writeLog(logEl, STARTUP_LOG);

  const redraw = createRedraw(ctx, state, tokens);
  const faultRedraw = (): void => {
    syncProxyFaultLabels(proxyButtons, state.degraded);
    redraw();
  };
  syncProxyFaultLabels(proxyButtons, state.degraded);

  wirePointer(state, canvas, stage, tipEl, redraw);
  const triggerHeal = scheduleHeal(state, faultBtn, logEl, faultRedraw);
  wireButtons(state, sendBtn, faultBtn, logEl, faultRedraw, triggerHeal);
  wireKeyboard(state, proxyButtons, tipEl, logEl, canvas, redraw);

  const lifecycle = wireLifecycle(ctx, canvas, stage, state, tokens, redraw);
  applyMotionPreference(state, ctx, tokens, redraw);

  return (): void => {
    stopAnimationLoop();
    lifecycle.teardown();
  };
}
