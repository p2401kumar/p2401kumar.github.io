// meteors.ts — the SKY-06 shooting-star subsystem (05.1-01): occasional
// single meteor streaks across the UPPER-sky margins, mirroring
// constellations.ts's self-contained handle shape. This module owns NO
// frame loop of any kind — advance()/draw() ride scene.ts's existing
// single tick (drawFrame Layer 2d), and the spawn cadence is a plain
// setTimeout scheduler (mirroring constellations.ts's firing scheduler).
//
// Module-boundary rule (05-CONTEXT.md, grep-enforced): never imports
// deck.ts or any fig01 module. The head/gradient-tail 'lighter' beam
// treatment is REIMPLEMENTED locally (mirrored from the fig01/
// constellation idiom, never imported). Color is getSkyTokens().star
// EXCLUSIVELY (head + trail) — no --milkyway, no --accent, zero hex.
//
// Zero idle cost (hard invariant 2): when no meteor is active, draw()
// returns after ONE reference null-check — no draws, no allocation, no
// advance math beyond the same null-check in advance().
//
// Suppression contract (hard invariant 4): setSuppressed(true) — wired
// through scene.ts's updateRunState beside the constellation firing gate
// — clears the pending spawn timer AND discards any in-flight meteor, so
// a paused / reduced-motion / static frame can never contain one. Under
// prefers-reduced-motion meteors are absent entirely (WCAG C39), never
// dampened.

import { rgba, type SkyTokens } from './tokens';

const TWO_PI = Math.PI * 2;

// --- Locked parameters (05.1-UI-SPEC "METEOR (SKY-06)") ------------------
/** Spawn-to-spawn cadence: 20000 + (rand ** 0.6) * 25000 ms — range
 * [20s, 45s], skewed toward the long end (exponent < 1 biases upward) per
 * 05.1-CONTEXT's "err toward the long end": a meteor is RARE and lucky. */
const CADENCE_BASE_MS = 20000;
const CADENCE_JITTER_MS = 25000;
const CADENCE_SKEW_EXP = 0.6;
/** Streak lifetime, seconds (uniform). */
const LIFE_MIN_S = 0.6;
const LIFE_MAX_S = 1.0;
/** Head travel distance as a fraction of cssHeight (uniform). */
const PATH_LEN_MIN_FRAC = 0.12;
const PATH_LEN_MAX_FRAC = 0.2;
/** Angle below horizontal, degrees (uniform), tilted toward the outer
 * viewport edge (away from the content column). */
const ANGLE_MIN_DEG = 20;
const ANGLE_MAX_DEG = 35;
/** Fading trail length as a fraction of cssHeight (uniform) — shorter
 * than the path, so the tail visibly trails a moving head (comet look). */
const TRAIL_LEN_MIN_FRAC = 0.06;
const TRAIL_LEN_MAX_FRAC = 0.1;
/** Head dot radius (CSS px) + peak alpha (never exceeds --star's max). */
const HEAD_RADIUS = 2.0;
const HEAD_ALPHA = 0.95;
/** Trail stroke width (CSS px). */
const TRAIL_STROKE_WIDTH = 1.4;
/** Trail gradient stops, head end -> tail end (tip-to-tail fade, head
 * brightest — same physics-feel as the fig01 beams). */
const TRAIL_STOPS: ReadonlyArray<readonly [number, number]> = [
  [0, 0.95],
  [0.45, 0.45],
  [0.8, 0.12],
  [1, 0],
];
/** Spawn-y band: upper sky only (uniform 0.03–0.20 of cssHeight; worst-
 * case path bottom ≈ 0.315·cssHeight — clears the camper by ≥0.36). */
const SPAWN_Y_MIN_FRAC = 0.03;
const SPAWN_Y_MAX_FRAC = 0.2;
/** Margins-only spawn construction: both margins below this width means
 * the spawn is skipped entirely (narrow-viewport fallback — no meteor). */
const MIN_MARGIN_PX = 60;
/** Buffers off the viewport edge / column edge (the codebase's existing
 * FIREFLY_MARGIN_CUSHION-style convention). */
const EDGE_BUFFER_PX = 16;
const COLUMN_BUFFER_PX = 12;
/** Frame-delta clamp (ms) — same 50ms clamp scene.ts/constellations use,
 * so a background-tab gap never teleports the streak. */
const MAX_ADVANCE_DELTA_MS = 50;

/** The single in-flight meteor (at most one exists at a time). */
interface ActiveMeteor {
  /** Spawn origin, CSS px. */
  x0: number;
  y0: number;
  /** Unit direction of travel (down-and-away from the column). */
  ux: number;
  uy: number;
  /** Head travel distance + trail length, CSS px. */
  pathLength: number;
  trailLength: number;
  /** Head speed, CSS px/s (pathLength / life — derived per spawn). */
  velocity: number;
  /** Head distance travelled so far along the path, CSS px. */
  d: number;
}

/** What initMeteors needs from scene.ts (and nothing more) — mirrors
 * ConstellationInitOptions' shape. */
export interface MeteorInitOptions {
  /** The scene's parsed sky tokens — only `--star` is used here. */
  tokens: SkyTokens;
  /** Current CSS-pixel viewport size, or null while none is adopted. */
  getViewport: () => { width: number; height: number } | null;
}

/** The handle scene.ts drives from its single tick. */
export interface MeteorHandle {
  /** Advances the in-flight meteor (one null-check when idle). */
  advance(ts: number): void;
  /** Draws the in-flight meteor (one null-check when idle — the zero-
   * idle-cost path). */
  draw(ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number): void;
  /** true = clear the pending spawn timer AND discard any in-flight
   * meteor (paused / reduced motion); false = resume the spawn schedule. */
  setSuppressed(suppressed: boolean): void;
  /** Clears the timer, discards state, removes listeners. */
  teardown(): void;
}

function uniform(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Boots the meteor subsystem. Starts suppressed — scene.ts's run-state
 * gate (updateRunState) enables spawning only while the loop actually
 * runs, exactly like the constellation firing gate.
 */
export function initMeteors(options: MeteorInitOptions): MeteorHandle {
  const { tokens, getViewport } = options;
  const star = tokens.star;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');

  let suppressed = true;
  let spawnTimer: ReturnType<typeof setTimeout> | null = null;
  let activeMeteor: ActiveMeteor | null = null;
  let tornDown = false;
  let lastAdvanceTs: number | null = null;

  function clearSpawnTimer(): void {
    if (spawnTimer !== null) {
      clearTimeout(spawnTimer);
      spawnTimer = null;
    }
  }

  function scheduleNextSpawn(): void {
    if (tornDown || suppressed || rm.matches || spawnTimer !== null) return;
    spawnTimer = setTimeout(spawn, CADENCE_BASE_MS + Math.random() ** CADENCE_SKEW_EXP * CADENCE_JITTER_MS);
  }

  /** One scheduled fire: attempt a single spawn (margins-only geometry),
   * then ALWAYS reschedule — spawn-to-spawn cadence, never
   * completion-to-spawn. The only place a meteor is ever born. */
  function spawn(): void {
    spawnTimer = null;
    if (tornDown || suppressed || rm.matches) return;
    // Defensive: if a fire lands while a meteor is still active (cadence
    // >= 20s >> life <= 1s, so this should never occur), skip and just
    // reschedule.
    if (activeMeteor === null) {
      const viewport = getViewport();
      if (viewport) {
        const w = viewport.width;
        const h = viewport.height;
        // Content column via the mirrored deck.css pad/half formula
        // (same doctrine as fireflies/constellations/moon — mirrored,
        // never imported).
        const pad = Math.min(32, Math.max(18, w * 0.04));
        const half = Math.min(880, w - 2 * pad) / 2;
        const columnLeft = w / 2 - half;
        const columnRight = w / 2 + half;
        const marginLeftPx = columnLeft;
        const marginRightPx = w - columnRight;
        const leftOk = marginLeftPx >= MIN_MARGIN_PX;
        const rightOk = marginRightPx >= MIN_MARGIN_PX;
        // Both margins too narrow: skip this spawn entirely (narrow-
        // viewport fallback — meteors simply don't appear) and let the
        // tail call below reschedule.
        if (leftOk || rightOk) {
          const goLeft = leftOk && rightOk ? Math.random() < 0.5 : leftOk;
          const angle = (uniform(ANGLE_MIN_DEG, ANGLE_MAX_DEG) * Math.PI) / 180;
          const pathLength = uniform(PATH_LEN_MIN_FRAC, PATH_LEN_MAX_FRAC) * h;
          const life = uniform(LIFE_MIN_S, LIFE_MAX_S);
          const trailLength = uniform(TRAIL_LEN_MIN_FRAC, TRAIL_LEN_MAX_FRAC) * h;
          // Down-and-AWAY travel: the path only ever moves further from
          // the column (clipped naturally at the viewport edge).
          const ux = (goLeft ? -1 : 1) * Math.cos(angle);
          const uy = Math.sin(angle);
          const x0 = goLeft
            ? uniform(EDGE_BUFFER_PX, marginLeftPx - COLUMN_BUFFER_PX)
            : w - uniform(EDGE_BUFFER_PX, marginRightPx - COLUMN_BUFFER_PX);
          const y0 = uniform(SPAWN_Y_MIN_FRAC, SPAWN_Y_MAX_FRAC) * h;
          activeMeteor = {
            x0,
            y0,
            ux,
            uy,
            pathLength,
            trailLength,
            velocity: pathLength / life,
            d: 0,
          };
        }
      }
    }
    scheduleNextSpawn();
  }

  function advance(ts: number): void {
    const dt = lastAdvanceTs === null ? 0 : Math.min(ts - lastAdvanceTs, MAX_ADVANCE_DELTA_MS);
    lastAdvanceTs = ts;
    if (activeMeteor === null) return; // idle: one null-check, nothing else
    activeMeteor.d += (activeMeteor.velocity * dt) / 1000;
    // Clean exit once the TAIL has fully cleared the path end (mirrors
    // the constellation beam's `d >= len + BEAM_TAIL_LEN` — the trail
    // visibly drains off rather than popping).
    if (activeMeteor.d >= activeMeteor.pathLength + activeMeteor.trailLength) {
      activeMeteor = null;
    }
  }

  function draw(ctx: CanvasRenderingContext2D, _cssWidth: number, _cssHeight: number): void {
    if (activeMeteor === null) return; // the zero-idle-cost path
    const m = activeMeteor;
    const headD = Math.min(m.d, m.pathLength);
    const tailD = Math.max(0, m.d - m.trailLength);
    if (headD <= tailD) return; // degenerate segment (spawn instant)
    const headX = m.x0 + m.ux * headD;
    const headY = m.y0 + m.uy * headD;
    const tailX = m.x0 + m.ux * tailD;
    const tailY = m.y0 + m.uy * tailD;
    // Mirror the fig01/constellation beam treatment: additive composite,
    // gradient trail (head end brightest), then the head dot on top.
    ctx.globalCompositeOperation = 'lighter';
    const gradient = ctx.createLinearGradient(headX, headY, tailX, tailY);
    for (const [stop, alpha] of TRAIL_STOPS) {
      gradient.addColorStop(stop, rgba(star, alpha));
    }
    ctx.strokeStyle = gradient;
    ctx.lineWidth = TRAIL_STROKE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(headX, headY);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(headX, headY, HEAD_RADIUS, 0, TWO_PI);
    ctx.fillStyle = rgba(star, HEAD_ALPHA);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function setSuppressed(next: boolean): void {
    if (next === suppressed) return;
    suppressed = next;
    if (next) {
      // Pending spawns are cancelled and the in-flight meteor discarded,
      // so a paused / reduced-motion / static frame can never contain one.
      clearSpawnTimer();
      activeMeteor = null;
    } else {
      scheduleNextSpawn();
    }
  }

  // If the OS preference flips to reduced motion mid-flight, clear the
  // active meteor instantly (same onMotionChange re-branch pattern
  // scene.ts uses) — scene.ts's updateRunState will also suppress via
  // the gate, but this local guard never depends on wiring order.
  const onMotionChange = (): void => {
    if (!rm.matches) return;
    clearSpawnTimer();
    activeMeteor = null;
  };
  rm.addEventListener('change', onMotionChange);

  function teardown(): void {
    tornDown = true;
    clearSpawnTimer();
    activeMeteor = null;
    rm.removeEventListener('change', onMotionChange);
  }

  return { advance, draw, setSuppressed, teardown };
}
