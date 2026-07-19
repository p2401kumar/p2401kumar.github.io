// idle-queue.ts — the shared idle-scheduled chunked work queue, extracted
// VERBATIM from starfield.ts in 09-01 (the extraction starfield.ts's own
// doctrine comment anticipated: "Phase 9's ambient systems may plausibly
// reuse it"). Behavior-preserving move: requestIdle/drainQueue and their
// types are byte-identical to the starfield.ts originals — only the
// `export` keywords are new. starfield.ts (Layer 0), clouds.ts (AMB-01),
// and any future ambient generator import from here instead of owning a
// duplicate shim.
//
// NOTE on the setTimeout below: it is the Safari-first-class
// requestIdleCallback FALLBACK SHIM (05-RESEARCH.md Pattern 3 / Pitfall 2),
// not an animation/cadence timer — this module schedules one-shot idle
// work only and owns zero per-frame or recurring timers. The single-rAF
// invariant greps therefore exempt this file's shim while still asserting
// zero rAF/timers in clouds.ts/parallax.ts (09-01-PLAN verification).

export type IdleDeadlineLike = { timeRemaining: () => number; didTimeout: boolean };
export type WorkUnit = () => void;

/** Feature-detects requestIdleCallback, falling back to a setTimeout shim
 * that mimics its deadline.timeRemaining() contract (05-RESEARCH.md
 * Pattern 3 / Pitfall 2 — Safari ships no requestIdleCallback at all, so
 * this fallback is the PRIMARY path for a meaningful audience slice on
 * this project, not a rare edge case — built and exercised as a first-
 * class path, not an afterthought). */
export function requestIdle(cb: (deadline: IdleDeadlineLike) => void): void {
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
 * recommendation (no fixed batch-size constant needed). KEPT after 07-03
 * even though the queue is now tiny (~90 metadata pushes + 1 moon draw
 * vs ~2,000+ draw calls before): it is cheap infrastructure when
 * near-empty, and Phase 9's ambient systems may plausibly reuse it. */
export function drainQueue(queue: WorkUnit[], onDone: () => void): void {
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
