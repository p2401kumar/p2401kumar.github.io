// deck.ts — vanilla-TS panel-deck state machine: hash routing, accessibility
// (inert/aria-hidden/aria-live), and the nightsky:panel-change event
// contract this module dispatches on every activation (Phase 5 consumes).
//
// Mirrors src/lib/fig01/index.ts's conventions: a `required()` throw-on-
// missing DOM lookup helper, module-scope state, `initDeck` returning a
// teardown. `nightsky/*` and `fig01/*` never import each other (CONTEXT.md).
//
// DOM contract this module queries (Panel.astro / PanelDeck.astro /
// DeckIndex.astro, 04-01-PLAN.md):
//   .panel[data-panel-id]          — one per manifest entry, PANEL_COUNT total
//   #deck-live                     — aria-live="polite" announcement region
//   #deck-index-count              — "NN / NN" progress text
//   #deck-hint                     — first-visit hint
//   .deck-jump a[data-panel-index] — jump-list anchors
//   .deck-view-classic / .deck-view-deck — mode-toggle links

import { panels, PANEL_COUNT } from '../../data/panels';

/**
 * Tunable input constants — the whole wheel/touch tuning surface lives here
 * (04-RESEARCH.md Open Question 1) so cross-device QA never has to touch
 * handler logic, only these values.
 */
export const WHEEL_THRESHOLD = 50;
export const IDLE_RESET_MS = 150;
export const TRANSITION_LOCK_MS = 400;
export const SWIPE_DISTANCE = 40;
export const SWIPE_VELOCITY = 0.3;
export const SWIPE_HORIZONTAL_TOLERANCE = 60;

/** Event contract dispatched on `document` on every panel activation (CONTEXT.md — Phase 5 consumes, this phase only produces). */
export const PANEL_CHANGE_EVENT = 'nightsky:panel-change';

const HINT_SEEN_KEY = 'deck-hint-seen';
const VIEW_PREF_KEY = 'deck-view-preference';

/** Null-checks a required DOM lookup without a non-null assertion (mirrors fig01/index.ts's `required()`). */
function required<T>(value: T | null, name: string): T {
  if (value === null) {
    throw new Error(`initDeck: missing required element "${name}"`);
  }
  return value;
}

/** Defensive localStorage read — private mode / disabled storage must never throw and break init (T-04-03). */
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Defensive localStorage write — same private-mode guard as readStorage. */
function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / disabled storage — silently no-op */
  }
}

// Module-scope deck state — single deck instance per page, matching
// lib/fig01/interactions.ts's own single-instance-per-module precedent.
const htmlEl = document.documentElement;
// Read once at module scope — same idiom as lib/fig01/interactions.ts's own
// module-scope `rm` constant.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let currentIndex = 0;
let locked = false;
let firstNavDone = false;
let panelEls: HTMLElement[] = [];
let jumpAnchorEls: HTMLAnchorElement[] = [];
let liveEl: HTMLElement;
let indexCountEl: HTMLElement;
let hintEl: HTMLElement;

/** Under prefers-reduced-motion, transitions are instant (deck.css's own reduced-motion branch) — the transition lock window collapses to 0 so input isn't needlessly blocked. */
function lockDuration(): number {
  return reducedMotion.matches ? 0 : TRANSITION_LOCK_MS;
}

/** `.classic-active` disables all deck input handling — wheel/touch/keyboard/jump-list defer to native scrolling/anchor behavior while it's set. */
function isClassicActive(): boolean {
  return htmlEl.classList.contains('classic-active');
}

/**
 * Resolves a URL hash to a panel index. Bounds-checked against the
 * build-time `panels[]` manifest — a crafted or nonexistent hash (T-04-01)
 * always falls back to index 0, never throws, and is never used as a raw
 * array index, a selector, or `innerHTML` input.
 */
export function resolveIndexFromHash(hash: string): number {
  const key = decodeURIComponent(hash.replace(/^#/, ''));
  const index = panels.findIndex((p) => p.hash === key);
  return index === -1 ? 0 : index;
}

/** Sets each panel's data-state/inert/aria-hidden to match `index`. Never touches focus or history — `goTo` composes those separately. */
function applyPanelStates(index: number): void {
  panelEls.forEach((el, i) => {
    const active = i === index;
    el.dataset.state = active ? 'active' : 'inactive';
    el.inert = !active;
    if (active) {
      el.removeAttribute('aria-hidden');
    } else {
      el.setAttribute('aria-hidden', 'true');
    }
  });
  updateJumpList(index);
}

/** Moves aria-current across the jump-list anchors so the expanded index always reports the real current panel (the ▸ marker follows via CSS `[aria-current="true"] .marker`). */
function updateJumpList(index: number): void {
  jumpAnchorEls.forEach((a, i) => {
    if (i === index) {
      a.setAttribute('aria-current', 'true');
    } else {
      a.removeAttribute('aria-current');
    }
  });
}

/** Updates the aria-live announcement + progress-index text. `textContent` only (T-04-02) — never `innerHTML`. */
function announce(index: number): void {
  liveEl.textContent = `Panel ${index + 1} of ${PANEL_COUNT} — ${panels[index].title}`;
  indexCountEl.textContent = `${String(index + 1).padStart(2, '0')} / ${String(PANEL_COUNT).padStart(2, '0')}`;
}

/** Fades out the first-visit hint on the first successful navigation and remembers the dismissal so it never re-nags. */
function dismissHint(): void {
  if (firstNavDone) return;
  firstNavDone = true;
  hintEl.style.opacity = '0';
  hintEl.style.pointerEvents = 'none';
  writeStorage(HINT_SEEN_KEY, '1');
}

/**
 * Advances/retreats/jumps the deck to `target`, clamped to
 * `[0, PANEL_COUNT - 1]`. Composes the full panel-change contract:
 * data-state/inert/aria-hidden, focus, aria-live, the
 * `nightsky:panel-change` event, and (unless `skipHistory`) a pushState
 * hash update.
 */
function goTo(target: number, opts?: { skipHistory?: boolean }): void {
  const clamped = Math.min(Math.max(target, 0), PANEL_COUNT - 1);
  if (clamped === currentIndex) return;

  currentIndex = clamped;
  applyPanelStates(currentIndex);
  panelEls[currentIndex].focus({ preventScroll: true });
  announce(currentIndex);
  dismissHint();

  document.dispatchEvent(
    new CustomEvent(PANEL_CHANGE_EVENT, {
      detail: { index: currentIndex, id: panels[currentIndex].id, total: PANEL_COUNT },
    }),
  );

  if (!opts?.skipHistory) {
    history.pushState(null, '', `#${panels[currentIndex].hash}`);
  }
}

/**
 * `popstate` (Back/Forward through pushState-created entries) and
 * `hashchange` (the jump-list interception safety net — a real
 * `<a href="#hash">` navigation that wasn't caught in time) both resolve
 * `location.hash` to an index and replay it without re-pushing history
 * (04-RESEARCH.md "Routing Architecture" dual-listen requirement).
 */
function wireHistory(): () => void {
  const onHashChange = (): void => goTo(resolveIndexFromHash(location.hash), { skipHistory: true });
  window.addEventListener('popstate', onHashChange);
  window.addEventListener('hashchange', onHashChange);
  return (): void => {
    window.removeEventListener('popstate', onHashChange);
    window.removeEventListener('hashchange', onHashChange);
  };
}

/** Normalizes a WheelEvent's deltaY to px, branching on deltaMode (04-RESEARCH.md "Wheel Normalization") — never assume deltaY is already in pixels. */
function normalizeWheelDelta(e: WheelEvent): number {
  switch (e.deltaMode) {
    case 1:
      return e.deltaY * 16; // DOM_DELTA_LINE — approximate line height
    case 2:
      return e.deltaY * window.innerHeight; // DOM_DELTA_PAGE
    default:
      return e.deltaY; // DOM_DELTA_PIXEL — the common case
  }
}

/**
 * Fine trackpad deltas accumulate across events; crossing WHEEL_THRESHOLD
 * fires exactly one goTo, then locks input for the transition duration
 * (momentum-tail suppression — checked BEFORE accumulating, so a queued
 * tail never fires a second transition after the user has stopped
 * scrolling). Registered `{ passive: false }` on the deck root ONLY, never
 * `window` — never degrades /work/* scroll (DECK-01).
 */
function wireWheel(root: HTMLElement): () => void {
  let accumulator = 0;
  let lastEventTime = 0;

  const onWheel = (e: WheelEvent): void => {
    if (isClassicActive()) return; // let native scroll handle classic mode
    e.preventDefault();
    if (locked) return;

    const now = performance.now();
    if (now - lastEventTime > IDLE_RESET_MS) accumulator = 0;
    lastEventTime = now;
    accumulator += normalizeWheelDelta(e);

    if (Math.abs(accumulator) >= WHEEL_THRESHOLD) {
      const direction = accumulator > 0 ? 1 : -1;
      accumulator = 0;
      locked = true;
      goTo(currentIndex + direction);
      setTimeout(() => {
        locked = false;
      }, lockDuration());
    }
  };

  root.addEventListener('wheel', onWheel, { passive: false });
  return (): void => root.removeEventListener('wheel', onWheel);
}

/**
 * Vertical-axis-only swipe detector (iOS edge-back collision avoidance,
 * DECK-02): touchmove preventDefaults only once vertical intent is
 * confirmed; horizontal-dominant gestures are never prevented, leaving the
 * browser's own edge-swipe/back-navigation intact.
 */
function wireTouch(root: HTMLElement): () => void {
  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartTime = 0;

  const onTouchStart = (e: TouchEvent): void => {
    const t = e.touches[0];
    touchStartY = t.clientY;
    touchStartX = t.clientX;
    touchStartTime = performance.now();
  };

  const onTouchMove = (e: TouchEvent): void => {
    if (isClassicActive()) return;
    const t = e.touches[0];
    const dy = Math.abs(t.clientY - touchStartY);
    const dx = Math.abs(t.clientX - touchStartX);
    if (dy > dx) e.preventDefault(); // vertical intent confirmed — block native scroll/bounce
  };

  const onTouchEnd = (e: TouchEvent): void => {
    if (isClassicActive() || locked) return;
    const t = e.changedTouches[0];
    const dy = t.clientY - touchStartY;
    const dx = t.clientX - touchStartX;
    const dt = performance.now() - touchStartTime;
    const velocity = Math.abs(dy) / dt;

    if (Math.abs(dx) > SWIPE_HORIZONTAL_TOLERANCE && Math.abs(dx) > Math.abs(dy)) return; // horizontal, ignore
    if (Math.abs(dy) < SWIPE_DISTANCE || velocity < SWIPE_VELOCITY) return; // too small/slow

    const direction = dy < 0 ? 1 : -1; // swipe up = next panel
    locked = true;
    goTo(currentIndex + direction);
    setTimeout(() => {
      locked = false;
    }, lockDuration());
  };

  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchmove', onTouchMove, { passive: false });
  root.addEventListener('touchend', onTouchEnd, { passive: true });

  return (): void => {
    root.removeEventListener('touchstart', onTouchStart);
    root.removeEventListener('touchmove', onTouchMove);
    root.removeEventListener('touchend', onTouchEnd);
  };
}

/**
 * ArrowDown/PageDown → next, ArrowUp/PageUp → prev, Home → first, End →
 * last. Ignored inside form controls/contenteditable or with a modifier
 * held; Space is never hijacked (DECK-03). Collision-free with Fig. 01:
 * lib/fig01/interactions.ts's wireKeyboard binds only focus/blur/click on
 * .node-proxy buttons — zero keydown listeners anywhere in lib/fig01/*
 * (04-RESEARCH.md "Fig. 01 Keyboard Ground Truth") — so this handler never
 * collides, even when focus sits inside Fig. 01's panel.
 */
function wireKeyboard(): () => void {
  const onKeyDown = (e: KeyboardEvent): void => {
    if (isClassicActive()) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        goTo(currentIndex + 1);
        break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        goTo(currentIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(PANEL_COUNT - 1);
        break;
      default:
        break;
    }
  };

  document.addEventListener('keydown', onKeyDown);
  return (): void => document.removeEventListener('keydown', onKeyDown);
}

/**
 * Intercepts jump-list anchor clicks and routes them through goTo (the
 * primary jump path; wireHistory's hashchange listener is the safety net
 * for clicks that aren't intercepted in time). In classic mode, defers to
 * the anchor's native in-page navigation instead (DECK-04, DECK-05).
 */
function wireJumpList(anchors: NodeListOf<HTMLAnchorElement>): () => void {
  const onClick = (e: MouseEvent): void => {
    if (isClassicActive()) return;
    const anchor = e.currentTarget as HTMLAnchorElement;
    const index = Number(anchor.dataset.panelIndex);
    if (Number.isNaN(index)) return;
    e.preventDefault();
    goTo(index);
  };

  anchors.forEach((a) => a.addEventListener('click', onClick));
  return (): void => anchors.forEach((a) => a.removeEventListener('click', onClick));
}

/**
 * First-visit hint (DECK-06): if `deck-hint-seen` is already set, hide it
 * immediately at init (no fade — it should never have been visible for a
 * returning visitor). Otherwise it stays visible until `dismissHint` (called
 * from the first successful `goTo`) fades it out and remembers the
 * dismissal. No listeners of its own — returns a no-op teardown to match
 * every other wire* function's shape.
 */
function wireHint(): () => void {
  if (readStorage(HINT_SEEN_KEY) === '1') {
    hintEl.style.opacity = '0';
    hintEl.style.pointerEvents = 'none';
    firstNavDone = true;
  }
  return (): void => {};
}

/**
 * "view classic" disables the deck (removes .deck-active, restores native
 * scrolling) and persists the choice; "deck view" reverses it. Both
 * re-apply the current panel's inert/aria-hidden state so the visible
 * content stays coherent after the mode flip (DECK-07).
 */
function wireViewToggle(viewClassicLink: HTMLAnchorElement, viewDeckLink: HTMLAnchorElement): () => void {
  const enterClassic = (e: MouseEvent): void => {
    e.preventDefault();
    htmlEl.classList.remove('deck-active');
    htmlEl.classList.add('classic-active');
    panelEls.forEach((el) => {
      el.inert = false;
      el.removeAttribute('aria-hidden');
    });
    writeStorage(VIEW_PREF_KEY, 'classic');
  };

  const enterDeck = (e: MouseEvent): void => {
    e.preventDefault();
    htmlEl.classList.remove('classic-active');
    htmlEl.classList.add('deck-active');
    applyPanelStates(currentIndex);
    writeStorage(VIEW_PREF_KEY, 'deck');
  };

  viewClassicLink.addEventListener('click', enterClassic);
  viewDeckLink.addEventListener('click', enterDeck);

  return (): void => {
    viewClassicLink.removeEventListener('click', enterClassic);
    viewDeckLink.removeEventListener('click', enterDeck);
  };
}

/**
 * Boots the deck against `root` in the exact progressive-enhancement order
 * (04-RESEARCH.md "Progressive-enhancement bootstrap ordering", DECK-07):
 * `required()` every DOM node first, resolve + apply the initial panel
 * state SYNCHRONOUSLY, wire input, THEN add `.deck-active` as the very
 * last step. Nothing before that last step may throw for any reason other
 * than "JS truly cannot run" — a bad hash degrades to index 0, it never
 * throws.
 *
 * Coordinates with PanelDeck.astro's guarded pre-paint `is:inline` script
 * (04-03): that script may have already speculatively added `.deck-active`
 * to <html> before this module even loaded, so `classList.add` here must
 * stay idempotent (it already is) and the classic-mode branch below must
 * explicitly clear that speculative class rather than assume it was never
 * set. `data-deck-ready="true"` is set as the final step of every
 * successful init (either mode) — the pre-paint script's watchdog uses its
 * absence to detect and undo a speculative add when init never completes.
 */
export function initDeck(root: HTMLElement): () => void {
  // 1. required() every DOM node this task uses up front.
  const nodeList = root.querySelectorAll<HTMLElement>('.panel');
  if (nodeList.length !== PANEL_COUNT) {
    throw new Error(`initDeck: expected ${PANEL_COUNT} .panel elements, found ${nodeList.length}`);
  }
  panelEls = Array.from(nodeList);
  liveEl = required(root.querySelector<HTMLElement>('#deck-live'), '#deck-live');
  indexCountEl = required(root.querySelector<HTMLElement>('#deck-index-count'), '#deck-index-count');
  hintEl = required(root.querySelector<HTMLElement>('#deck-hint'), '#deck-hint');
  const jumpAnchors = root.querySelectorAll<HTMLAnchorElement>('.deck-jump a[data-panel-index]');
  if (jumpAnchors.length !== PANEL_COUNT) {
    throw new Error(`initDeck: expected ${PANEL_COUNT} jump-list anchors, found ${jumpAnchors.length}`);
  }
  jumpAnchorEls = Array.from(jumpAnchors);
  const viewClassicLink = required(
    root.querySelector<HTMLAnchorElement>('.deck-view-classic'),
    '.deck-view-classic',
  );
  const viewDeckLink = required(root.querySelector<HTMLAnchorElement>('.deck-view-deck'), '.deck-view-deck');

  // 2-3. Resolve + apply the initial panel state SYNCHRONOUSLY — a
  // cold-load to #patents paints #patents first, never panel 0.
  const initialIndex = resolveIndexFromHash(location.hash);
  applyPanelStates(initialIndex);
  currentIndex = initialIndex;
  announce(initialIndex);

  // 4. Wire input.
  const teardownHistory = wireHistory();
  const teardownWheel = wireWheel(root);
  const teardownTouch = wireTouch(root);
  const teardownKeyboard = wireKeyboard();
  const teardownJumpList = wireJumpList(jumpAnchors);
  const teardownHint = wireHint();
  const teardownViewToggle = wireViewToggle(viewClassicLink, viewDeckLink);

  // 5. LAST — decide starting mode from the persisted view preference.
  // Everything above must have succeeded for this line to run at all.
  if (readStorage(VIEW_PREF_KEY) === 'classic') {
    // Defensive: PanelDeck.astro's pre-paint script may have already
    // speculatively added .deck-active before this module executed. If the
    // persisted preference actually resolves to classic here, clear that
    // speculative class so the two modes never coexist — deck.css's layout
    // rules are gated on .deck-active alone, so leaving it set would show
    // the deck layout while every input handler behaves as classic via
    // isClassicActive().
    htmlEl.classList.remove('deck-active');
    htmlEl.classList.add('classic-active');
    panelEls.forEach((el) => {
      el.inert = false;
      el.removeAttribute('aria-hidden');
    });
  } else {
    htmlEl.classList.add('deck-active');
  }

  // Signals successful init to PanelDeck.astro's pre-paint watchdog (see
  // that component's own comments) — set regardless of which mode was
  // resolved above, since it only means "JS booted successfully."
  htmlEl.dataset.deckReady = 'true';

  // 6. Teardown.
  return (): void => {
    teardownHistory();
    teardownWheel();
    teardownTouch();
    teardownKeyboard();
    teardownJumpList();
    teardownHint();
    teardownViewToggle();
  };
}
