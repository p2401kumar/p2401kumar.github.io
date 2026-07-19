// constellations.ts — the 4 career-chapter constellations (CONST-01/02/03):
// star-node + sparse-link rendering, panel-reactive brighten/dim, and the
// quiet link-firing beam. Consumes the typed data module
// (src/data/constellations.ts) as its single source of truth — star
// coordinates, link graph, and the panelToConstellation mapping are never
// re-derived here.
//
// Module-boundary rule (05-CONTEXT.md, grep-enforced): this module NEVER
// imports deck.ts or any fig01 module. The active-panel signal arrives via
// the document-level 'nightsky:panel-change' CustomEvent subscribed by its
// LITERAL event name (an independent listener — scene.ts's pause-gate
// listener on the same event stays untouched). The Fig. 01 beam MATH
// pattern (point-at-distance sampler + head/gradient-tail 'lighter'
// treatment) is REIMPLEMENTED locally below for straight star-to-star
// segments — mirrored, never imported.
//
// Rendering discipline (05-RESEARCH.md / 05-UI-SPEC.md):
//   - Base rendering is cheap: pixel positions + link geometry are
//     precomputed once per viewport size (ensureLayout), never per frame.
//   - Brighten/dim is an alpha lerp toward per-state targets over ~400ms
//     ease-out, advanced inside scene.ts's single rAF tick (advance()).
//     Under prefers-reduced-motion the change is INSTANT: alphas snap and
//     one repaint is requested (mirroring fig01/interactions.ts's
//     createRedraw repaint-once-after-state-change shape).
//   - Link-firing is a sparse setTimeout-scheduled event (every 6–10s, at
//     most ONE beam at a time, ambient sky only) — never per-frame dice
//     (05-RESEARCH.md Anti-Patterns); fully suppressed while the scene is
//     paused or under reduced motion.
//   - All stars/links/halos/beams use --star exclusively (via the sky
//     token bridge) — never --milkyway, never --accent, zero hex here.
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
  /** Alpha for the radial halo (ambient rests faint, brightened peaks —
   * 07-UI-SPEC Overlay Harmony). */
  halo: number;
  /** Halo radius multiplier over the star radius — tweened with the
   * alphas so the resting 1.3× halo grows smoothly into the brightened
   * 1.5× halo (07-03). */
  haloScale: number;
}

const STATE_ALPHAS: Record<HighlightState, AlphaChannels> = {
  // Star 0.40–0.55, link 0.12–0.20. 07-03 (real-photo backdrop): a FAINT
  // resting halo (alpha 0.15 within the 0.12–0.18 band, radius 1.3×) so
  // authored stars read categorically apart from the photo's real star
  // specks — kept visibly quieter than the brightened 1.5×/0.25 halo.
  ambient: { starMid: 0.45, starBright: 0.55, link: 0.16, halo: 0.15, haloScale: 1.3 },
  // Star 0.85–1.00, link 0.45–0.55, halo alpha 0.20–0.30 at 1.5×.
  brightened: { starMid: 0.88, starBright: 1, link: 0.5, halo: 0.25, haloScale: 1.5 },
  // Star 0.25–0.35, link 0.08–0.12, no halo — deliberately recedes.
  dimmed: { starMid: 0.27, starBright: 0.34, link: 0.1, halo: 0, haloScale: 1.3 },
};

/** Brighten/dim tween duration (locked ~400ms ease-out, 05-CONTEXT.md). */
const TWEEN_MS = 400;
/** Constellation star radii — 07-03 raised to the UPPER half of the
 * 05-UI-SPEC 2.5–4px range (07-UI-SPEC Overlay Harmony: the delivered
 * photo's real stars resolve to ~1–2px specks, so 3.0/4.5px reads
 * categorically larger at every check width). */
const STAR_RADIUS_MID = 3.0;
const STAR_RADIUS_BRIGHT = 4.5;
/** Link hairline stroke (05-UI-SPEC.md: 0.75–1px — unchanged in 07-03; a
 * straight segment is a shape no real starfield produces). */
const LINK_STROKE_WIDTH = 0.85;
/** Alpha below which halo drawing is skipped entirely. */
const HALO_EPSILON = 0.01;

/** Frame-delta clamp (ms) — same 50ms clamp scene.ts/fig01 use, so a
 * background-tab gap never teleports the firing beam. */
const MAX_ADVANCE_DELTA_MS = 50;

// --- Link-firing tuning (05-UI-SPEC.md Spacing rows: the Fig. 01 beam
// treatment scaled down ~⅓ for shorter, quieter constellation links —
// head 1.5px vs 2.2, tail 40px vs 70, speed 0.18px/ms vs 0.22). ---
const BEAM_HEAD_RADIUS = 1.5;
const BEAM_TAIL_LEN = 40;
const BEAM_SPEED_PX_PER_MS = 0.18;
const BEAM_STROKE_WIDTH = 1.2;
/** Firing cadence: every 6–10s (locked formula 6000 + random()*4000). */
const FIRING_DELAY_BASE_MS = 6000;
const FIRING_DELAY_JITTER_MS = 4000;
/** Beam alpha treatment mirrored from fig01/render.ts drawBeams: the tail
 * gradient fades from 0 up to its head-end alpha; the head dot sits
 * brighter than the tail. */
const BEAM_TAIL_ALPHA = 0.85;
const BEAM_HEAD_ALPHA = 0.95;

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

/** The single in-flight firing beam (at most one exists at a time). */
interface FiringBeam {
  constellationIndex: number;
  linkIndex: number;
  /** Head distance travelled along the segment, CSS px. */
  d: number;
}

/**
 * Straight-line point-at-distance sampler — the local reimplementation of
 * fig01/model.ts's `pAt` for a single star-to-star segment (no 3-segment
 * elbow; constellation links are straight). Mirrored, never imported.
 */
export function pointAtDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  len: number,
  d: number
): [number, number] {
  const t = len > 0 ? Math.max(0, Math.min(len, d)) / len : 0;
  return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
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
   * alphas, plus the in-flight firing beam (if any). */
  draw(ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number, ts: number): void;
  /** Eases current alphas toward their targets (~400ms ease-out) and
   * advances the firing beam. Called once per frame before draw(). */
  advance(ts: number): void;
  /** true = clear any pending firing timeout, discard the in-flight beam,
   * and prevent new firings (paused / reduced motion); false = resume the
   * setTimeout firing schedule. */
  setFiringSuppressed(suppressed: boolean): void;
  /** Removes the panel-change + motion listeners and the firing timer. */
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
  const { tokens, getViewport, requestRepaint } = options;
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
  //
  // SKY-05 margin remap (05-06): the data module's x fractions describe the
  // left (0–0.20) and right (0.80–1.0) margin bands of the REFERENCE
  // 1440px viewport, but the text column is a FIXED 880px centered block
  // (deck.css .panel > * max-width), so raw fractional placement pushes
  // cluster stars (brightened alpha up to 1.0) and firing beams (0.95)
  // INSIDE the text column at narrower widths (e.g. 1280/1200px) —
  // measured worst-case ratios there break WCAG 1.4.3, and 05-UI-SPEC.md's
  // placement rule ("no cluster's bounding box may extend into the
  // content-safe column") is violated. ensureLayout therefore remaps each
  // side's x fractions linearly into the ACTUAL margin band (same column
  // formula as deck.css: min(880, width - 2*pad) centered, pad =
  // clamp(18px, 4vw, 32px), with an 8px cushion that also covers the
  // 1.5x-radius brightened halo). At the 1440px reference this shifts
  // stars by <=15px vs the approved smoke-test geometry; at every width
  // it keeps all constellation pixels out of the text column by
  // construction.
  const MARGIN_CUSHION = 8;
  function marginRemapX(fraction: number, cssWidth: number): number {
    const pad = Math.min(32, Math.max(18, cssWidth * 0.04));
    const half = Math.min(880, cssWidth - 2 * pad) / 2;
    const colLeft = cssWidth / 2 - half;
    const colRight = cssWidth / 2 + half;
    if (fraction <= 0.5) {
      const m0 = MARGIN_CUSHION;
      const m1 = Math.max(m0 + 24, colLeft - MARGIN_CUSHION);
      return m0 + (fraction / 0.2) * (m1 - m0);
    }
    const m1 = cssWidth - MARGIN_CUSHION;
    const m0 = Math.min(m1 - 24, colRight + MARGIN_CUSHION);
    return m0 + ((fraction - 0.8) / 0.2) * (m1 - m0);
  }
  let layoutWidth = -1;
  let layoutHeight = -1;
  function ensureLayout(cssWidth: number, cssHeight: number): void {
    if (cssWidth === layoutWidth && cssHeight === layoutHeight) return;
    layoutWidth = cssWidth;
    layoutHeight = cssHeight;
    for (const rt of runtimes) {
      rt.starX = rt.def.stars.map((s) => marginRemapX(s.x, cssWidth));
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

  // --- Link-firing state (CONST-03): at most ONE beam, setTimeout-
  // scheduled — never per-frame dice (05-RESEARCH.md Anti-Patterns).
  // Starts suppressed; scene.ts's run-state gate enables firing only
  // while the loop actually runs. ---
  let firingSuppressed = true;
  let fireTimer: ReturnType<typeof setTimeout> | null = null;
  let activeBeam: FiringBeam | null = null;
  let tornDown = false;

  function clearFireTimer(): void {
    if (fireTimer !== null) {
      clearTimeout(fireTimer);
      fireTimer = null;
    }
  }

  function scheduleNextFiring(): void {
    if (tornDown || firingSuppressed || rm.matches || fireTimer !== null) return;
    fireTimer = setTimeout(fire, FIRING_DELAY_BASE_MS + Math.random() * FIRING_DELAY_JITTER_MS);
  }

  /** One scheduled firing: spawn the single beam on a random link of the
   * AMBIENT (non-highlighted) sky, then schedule the next firing — the
   * only place a new beam is ever born. */
  function fire(): void {
    fireTimer = null;
    if (tornDown || firingSuppressed || rm.matches) return;
    if (activeBeam === null) {
      // The brightened constellation, if any, never fires.
      const candidates: Array<{ constellationIndex: number; linkIndex: number }> = [];
      runtimes.forEach((rt, constellationIndex) => {
        if (rt.state === 'brightened') return;
        rt.def.links.forEach((_link, linkIndex) => {
          candidates.push({ constellationIndex, linkIndex });
        });
      });
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        activeBeam = {
          constellationIndex: pick.constellationIndex,
          linkIndex: pick.linkIndex,
          d: 0,
        };
      }
    }
    scheduleNextFiring();
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

  let lastAdvanceTs: number | null = null;

  function advance(ts: number): void {
    const dt = lastAdvanceTs === null ? 0 : Math.min(ts - lastAdvanceTs, MAX_ADVANCE_DELTA_MS);
    lastAdvanceTs = ts;

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
          haloScale: lerp(rt.from.haloScale, rt.target.haloScale, e),
        };
      }
    }

    // Firing beam: the head advances at constant px/ms along its segment;
    // the beam is removed once the tail has fully exited the far star.
    if (activeBeam !== null) {
      const viewport = getViewport();
      if (viewport) {
        ensureLayout(viewport.width, viewport.height);
        activeBeam.d += dt * BEAM_SPEED_PX_PER_MS;
        const geom = runtimes[activeBeam.constellationIndex].linkGeoms[activeBeam.linkIndex];
        if (!geom || activeBeam.d >= geom.len + BEAM_TAIL_LEN) {
          activeBeam = null;
        }
      }
    }
  }

  /** Draws the in-flight beam: gradient tail → brighter head dot with the
   * 'lighter' additive composite — fig01/render.ts drawBeams's visual
   * treatment mirrored for a straight segment, in --star. */
  function drawBeam(ctx: CanvasRenderingContext2D): void {
    if (activeBeam === null) return;
    const geom = runtimes[activeBeam.constellationIndex].linkGeoms[activeBeam.linkIndex];
    if (!geom) return;
    const headD = Math.min(activeBeam.d, geom.len);
    if (headD <= 0) return;
    const tailD = Math.max(0, activeBeam.d - BEAM_TAIL_LEN);
    const head = pointAtDistance(geom.x1, geom.y1, geom.x2, geom.y2, geom.len, headD);
    const tail = pointAtDistance(geom.x1, geom.y1, geom.x2, geom.y2, geom.len, tailD);
    ctx.globalCompositeOperation = 'lighter';
    const gradient = ctx.createLinearGradient(tail[0], tail[1], head[0], head[1]);
    gradient.addColorStop(0, rgba(star, 0));
    gradient.addColorStop(1, rgba(star, BEAM_TAIL_ALPHA));
    ctx.strokeStyle = gradient;
    ctx.lineWidth = BEAM_STROKE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(tail[0], tail[1]);
    ctx.lineTo(head[0], head[1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(head[0], head[1], BEAM_HEAD_RADIUS, 0, TWO_PI);
    ctx.fillStyle = rgba(star, BEAM_HEAD_ALPHA);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
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
      // Halos under their star dots — resting (ambient) halos are faint
      // and 1.3×; brightened halos 1.5×/0.25; dimmed has none (07-03).
      if (cur.halo > HALO_EPSILON) {
        for (let i = 0; i < rt.starX.length; i++) {
          const haloRadius = rt.starRadius[i] * cur.haloScale;
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
    // The beam rides the same draw pass. It can never appear in a static
    // frame: suppression (paused/reduced-motion) discards it first.
    drawBeam(ctx);
  }

  function setFiringSuppressed(suppressed: boolean): void {
    if (suppressed === firingSuppressed) return;
    firingSuppressed = suppressed;
    if (suppressed) {
      // Pending firings are cancelled and the in-flight beam discarded, so
      // a paused/static frame can never contain a beam.
      clearFireTimer();
      activeBeam = null;
    } else {
      scheduleNextFiring();
    }
  }

  function teardown(): void {
    tornDown = true;
    clearFireTimer();
    activeBeam = null;
    document.removeEventListener('nightsky:panel-change', onPanelChange);
    rm.removeEventListener('change', onMotionChange);
  }

  return { draw, advance, setFiringSuppressed, teardown };
}
