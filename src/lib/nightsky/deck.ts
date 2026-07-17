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
let currentIndex = 0;
let locked = false;
let firstNavDone = false;
let panelEls: HTMLElement[] = [];
let liveEl: HTMLElement;
let indexCountEl: HTMLElement;
let hintEl: HTMLElement;

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

/**
 * Boots the deck against `root` in the exact progressive-enhancement order
 * (04-RESEARCH.md "Progressive-enhancement bootstrap ordering", DECK-07):
 * `required()` every DOM node first, resolve + apply the initial panel
 * state SYNCHRONOUSLY, wire input, THEN add `.deck-active` as the very
 * last step. Nothing before that last step may throw for any reason other
 * than "JS truly cannot run" — a bad hash degrades to index 0, it never
 * throws.
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

  // 2-3. Resolve + apply the initial panel state SYNCHRONOUSLY — a
  // cold-load to #patents paints #patents first, never panel 0.
  const initialIndex = resolveIndexFromHash(location.hash);
  applyPanelStates(initialIndex);
  currentIndex = initialIndex;
  announce(initialIndex);

  // 4. Wire input. History routing lands in this task; wheel/touch/
  // keyboard/jump-list/hint/view-toggle wiring lands in 04-02 Task 2.
  const teardownHistory = wireHistory();

  // 5. LAST — decide starting mode from the persisted view preference.
  // Everything above must have succeeded for this line to run at all.
  if (readStorage(VIEW_PREF_KEY) === 'classic') {
    htmlEl.classList.add('classic-active');
    panelEls.forEach((el) => {
      el.inert = false;
      el.removeAttribute('aria-hidden');
    });
  } else {
    htmlEl.classList.add('deck-active');
  }

  // 6. Teardown.
  return (): void => {
    teardownHistory();
  };
}
