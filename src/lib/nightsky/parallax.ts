// parallax.ts — AMB-02 ground layer: the physically-honest panel-change
// parallax nudge on the .camper DOM element (the sole foreground element,
// therefore the entire "ground" layer). Compositor-only: this module
// toggles CSS classes whose @keyframes (NightSky.astro, co-located with
// the .camper rule for Astro-scoping consistency) play a bounded
// translate3d nudge-and-settle — 0 -> ±18px -> 0 over 420ms on the deck's
// own cubic-bezier(0.16, 1, 0.3, 1). State never accumulates across
// events (T-09-03: bounded by construction, never a persistent camera
// offset), which is also why reduced-motion collapses cleanly to zero
// motion: the start and end state are the same point, 0.
//
// The canvas is at infinity in the locked depth model — #nightsky-canvas
// and .nightsky-host are NEVER CSS-transformed; this module touches
// .camper's classList ONLY. Zero animation-frame scheduling, zero timers,
// zero canvas involvement.
//
// Module-boundary rule (05-CONTEXT.md, grep-enforced): never imports
// deck.ts — the direction signal is derived from the LITERAL
// 'nightsky:panel-change' document event (deck.ts documents the detail
// shape { index, id, total }), mirroring constellations.ts's independent-
// listener pattern.

/** Last seen deck panel index — direction is derived, not carried by the
 * event (Math.sign of the index delta; a same-index or first event
 * defaults to forward). */
let lastPanelIndex = 0;

/**
 * Boots the ground-layer parallax. Registers the independent panel-change
 * listener and returns a teardown that removes it. Under
 * prefers-reduced-motion the handler returns BEFORE touching classList
 * (no wasted compositor frame; the @media animation:none gate in
 * NightSky.astro already neutralizes the classes as defense-in-depth —
 * an instant, zero-motion result either way).
 */
export function initParallax(): () => void {
  const rm = matchMedia('(prefers-reduced-motion: reduce)');

  const onPanelChange = (e: Event): void => {
    const detail = (e as CustomEvent<{ index: number; id: string; total: number }>).detail;
    if (!detail || typeof detail.index !== 'number') return; // malformed — no-op, never throw (T-09-01)
    const direction = Math.sign(detail.index - lastPanelIndex) || 1;
    lastPanelIndex = detail.index;
    if (rm.matches) return;
    const camper = document.querySelector<HTMLElement>('.camper');
    if (!camper) return;
    // Remove both nudge classes, force a reflow, then re-add — the
    // standard restart trick so rapid repeated panel changes replay the
    // animation cleanly instead of being swallowed mid-flight.
    camper.classList.remove('parallax-nudge-fwd', 'parallax-nudge-back');
    void camper.offsetWidth;
    camper.classList.add(direction >= 0 ? 'parallax-nudge-fwd' : 'parallax-nudge-back');
  };
  document.addEventListener('nightsky:panel-change', onPanelChange);

  return function teardown(): void {
    document.removeEventListener('nightsky:panel-change', onPanelChange);
  };
}
