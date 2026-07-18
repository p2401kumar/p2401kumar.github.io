# Phase 4: Deck Mechanics - Research

**Researched:** 2026-07-17
**Domain:** Hand-rolled full-viewport panel-deck state machine (wheel/touch/keyboard/hash input normalization) over an existing Astro 7 static portfolio; no UI framework, no deck library
**Confidence:** HIGH for internal integration points (read directly from shipped source); MEDIUM for external wheel/touch/routing/a11y specifics (WebSearch cross-checked against MDN/W3C, no Context7/curated-registry MCP tool was available this run — all `config.*_search` flags are `false`)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Architecture patterns (LOCKED — from v2.0 ARCHITECTURE.md, HIGH confidence)**
- Panels hide via `transform` (translateY) — NEVER `display:none` / `visibility:hidden` / unmounting; all panel content stays in the DOM (SEO + fig01 IntersectionObserver stays valid)
- Progressive enhancement: base CSS = the v1 scrolling stack unchanged; `deck.ts` adds `.deck-active` to a root element ONLY after successful init; all deck layout CSS is scoped under `.deck-active`
- Engine at `src/lib/nightsky/deck.ts` (vanilla TS, mirrors fig01 module conventions: typed state, wire* functions, init returns teardown); component shells `PanelDeck.astro` + thin `Panel.astro` slot wrapper; existing section components pass through UNMODIFIED
- Event contract defined and dispatched NOW: `document.dispatchEvent(new CustomEvent('nightsky:panel-change', { detail: { index, id, total } }))` on every activation — Phase 5 subscribes later; nightsky/* and fig01/* never import each other
- Extract `src/lib/shared/css-tokens.ts` from fig01/tokens.ts generic logic ONLY if deck needs token reads; otherwise defer extraction to Phase 5 (planner's call — don't refactor fig01 gratuitously this phase)

**Input mechanics (LOCKED requirements, research-mandated details)**
- Wheel: delta ACCUMULATION against a threshold + transition lock (ignore input while animating) — one physical gesture = exactly one panel on both trackpad (fine deltas, momentum tail) and notched mouse (coarse deltas). Momentum-tail suppression after a fired transition
- Touch: VERTICAL swipe axis (iOS edge-swipe collision avoidance); threshold + velocity check; no preventDefault on horizontal moves
- Keyboard: ArrowUp/Down + PageUp/Down + Home/End move panels; Space NOT hijacked. Ground truth: `src/lib/fig01/interactions.ts` wireKeyboard binds only focus/blur/click on proxy buttons (comment at line ~245 confirms no keydown interception) — verify at planning time and document; if true, arrows are collision-free even when focus is inside Fig. 01's panel. Keys only act when no form/interactive element would consume them
- Progress index: mono index (e.g. `03 / 09`) + jump list — the v1 lowercase-mono idiom, NOT decorative dots; keyboard reachable, current panel aria-current
- First-visit affordance: quiet mono hint (e.g. `scroll · ↓ · swipe`), dismisses on first navigation, remembered via localStorage (no re-nag)

**Routing (DECISION owed this phase — decide in planning, default below)**
- Each home panel gets a hash (`#hero`, `#fig-01`, `#systems`, `#experience`, `#patents`, `#skills`, `#contact`); history entries per navigation (pushState), popstate drives the deck; cold-load with a hash jumps directly (no animation) to that panel
- Case studies REMAIN separate Astro routes at /work/* (v1 URLs, SEO intact) reachable via links from the systems panel — they are NOT deck panels; header/footer chrome unchanged there. This is the recommended resolution of the research's open routing question — planner may refine but not silently drop the decision
- "view classic": a quiet mono link (footer or index area) that disables the deck (`.deck-active` removed + preference persisted in localStorage) and restores native scrolling; a matching "deck view" link restores it

**Accessibility (floors)**
- Non-active panels get `inert` (+ `aria-hidden`); focus moves to the active panel container (tabindex="-1") on change; `aria-live="polite"` region announces "Panel N of M — {title}"
- `prefers-reduced-motion: reduce` → transitions are INSTANT (no transform animation); everything else identical
- No keyboard traps: Tab order flows within the active panel; Escape never trapped

**Quality gates (this phase)**
- `npx astro check` 0 errors; build green; zero hex literals outside tokens.css
- Lighthouse ≥ 90 all categories against a LOCAL preview (`npm run preview` + npx lighthouse against localhost) with the deck active — the live-URL run is Phase 6
- **Do NOT push to origin during this phase** — the live site stays v1 until Phase 6 deploys the complete v2 experience; commits accumulate locally on main
- Cross-device input testing: attempt automated verification (wheel-event simulation in browser tooling if it starts); real-device iPhone/Android testing is flagged as a checklist item that lands with Phase 6's checkpoint if tooling can't cover it — do NOT block Phase 4 on physical devices

### Claude's Discretion
- Exact wheel thresholds/lock duration, transition duration/easing (≤ ~500ms, ease-out per v1 doctrine), hint copy, index placement/styling details, localStorage key names, whether SiteHeader/SiteFooter become fixed chrome now or in Phase 6 (styling-only per research)

### Deferred Ideas (OUT OF SCOPE)
- Night-sky scene, constellations, event-contract consumers → Phase 5
- Fig. 01 embedded full re-verification, scrim/contrast work, live Lighthouse + deploy → Phase 6
- Panel-aware OG cards → future (OG-02)

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DECK-01 | Wheel: one gesture = one panel, delta accumulation + transition lock, no trackpad double-fire, no dead mouse feel | Common Pitfalls Pitfall 2, Code Examples "Wheel handler", recommended constants below |
| DECK-02 | Vertical touch swipe on mobile | Common Pitfalls Pitfall-touch, Code Examples "Touch handler", iOS edge-swipe verdict |
| DECK-03 | Full keyboard nav, no collision with Fig. 01 inner controls, hidden panels `inert`, `aria-live` announcements | Fig. 01 Keyboard Ground Truth section (definitive verdict), Code Examples "Keyboard handler" |
| DECK-04 | Mono progress index + jump list | Architecture Patterns "Panel manifest single source of truth" |
| DECK-05 | Per-panel URL hash, back/forward, cold-load deep link | Routing Architecture section (pushState vs location.hash, popstate/hashchange dual-listen, cold-load ordering) |
| DECK-06 | First-visit affordance, dismiss + remember | Code Examples "First-visit hint", localStorage pattern |
| DECK-07 | No-JS renders v1 scrolling layout; `.deck-active` added only after init; "view classic" escape hatch | Architecture Patterns Pattern 4 (carried from ARCHITECTURE.md), Code Examples "Progressive enhancement bootstrap" |
| DECK-08 | Instant transitions under `prefers-reduced-motion` | Common Pitfalls Pitfall-reduced-motion, Code Examples "Reduced motion branch" |

</phase_requirements>

## Summary

This phase builds `src/lib/nightsky/deck.ts` plus `PanelDeck.astro`/`Panel.astro` shells, converting `index.astro`'s single scrolling column into a full-viewport panel deck driven by wheel, touch, keyboard, and a jump index — all while keeping every existing section component (including Fig. 01) byte-for-byte unmodified. The two hardest technical problems are (1) normalizing wheel/touch input across wildly different hardware into a reliable "one gesture = one panel" rule, and (2) reconciling URL hash routing with a transform-based, non-scrolling layout without breaking the browser's native hash-anchor scroll behavior, back/forward, or cold-load deep links. Every other requirement (inert panels, aria-live, first-visit hint, progressive enhancement, reduced motion) is a well-documented, mechanically implementable pattern once those two are solved.

The codebase already validates the two riskiest architectural bets this phase depends on: `fig01/interactions.ts`'s `wireKeyboard` binds only `focus`/`blur`/`click` on proxy `<button>`s — zero `keydown`/`keyup` listeners anywhere in `lib/fig01/*` — so deck arrow-key handling is provably collision-free. And `fig01/interactions.ts`'s `wireLifecycle` gates its render loop purely on `IntersectionObserver` + `visibilitychange` + `matchMedia`, with no assumption about document flow, so `PanelDeck`'s transform-based (never `display:none`) inactive-panel technique keeps Fig. 01's lifecycle gating correct with zero changes to `lib/fig01/*`.

**Primary recommendation:** Build `deck.ts` as a single wheel-delta accumulator (reset on 150ms idle, ~50px pixel-normalized threshold) gated by a hard transition lock (matches the CSS transition duration, ~350-400ms) for wheel; a vertical-only touch-swipe detector (40px distance / 0.3px-ms velocity, matching the deck's `translateY` direction) for touch; native `focus`/`click`-based keyboard proxies exactly like Fig. 01 (no `keydown` capture needed beyond the deck root's own arrow/Home/End handler, scoped so it never fires when focus is inside a form control); and `history.pushState` (never `location.hash =`) for all deck-internal navigation, with a `popstate` listener for back/forward and a `hashchange` listener for real anchor-tag jump-list clicks that aren't intercepted in time — reading `location.hash` once, synchronously, before the very first `.deck-active` class is applied, so cold-loads never flash panel 0 before snapping to the deep-linked panel.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Panel state machine (index, next/prev/goTo) | Browser/Client | — | Pure client-side interaction state; no server exists (static site) |
| Wheel/touch/keyboard input normalization | Browser/Client | — | DOM event handling, must run in the browser; no build-time equivalent |
| Hash routing / history sync | Browser/Client | — | `history.pushState`/`popstate` are client-only APIs; Astro build produces static HTML, routing state lives entirely in the browser after load |
| Progressive-enhancement base layout | CDN/Static (build output) | Browser/Client | The no-JS scrolling layout is pure static HTML/CSS shipped by the Astro build; JS only *enhances* it post-load — this is the load-bearing reason DECK-07 works |
| Case-study routes (/work/*) | CDN/Static (build output) | — | Untouched separate Astro static routes; deck has zero involvement, only links out |
| Focus/inert/aria-live management | Browser/Client | — | DOM accessibility tree mutation, inherently runtime |
| Panel manifest (id/hash/title) | CDN/Static (build output) | Browser/Client | Authored as a typed TS module, bundled into the static JS payload at build time, read by both `PanelDeck.astro` (for markup) and `deck.ts` (for behavior) — single source of truth pattern from CONTEXT.md |

## Standard Stack

### Core

No new runtime libraries. This phase is 100% vanilla TypeScript + native browser APIs, consistent with the "no framework runtime" project constraint and the milestone's explicit "Out of Scope" list (`three.js`/`GSAP`/`fullPage.js`/`swiper` all rejected).

| API/Mechanism | Spec | Purpose | Why Standard |
|---------------|------|---------|--------------|
| `WheelEvent` (`wheel`, `deltaY`, `deltaMode`) | [W3C UI Events](https://w3c.github.io/uievents/split/wheel-events.html) / [MDN](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent) | Mouse-wheel/trackpad panel advance | The only standards-track wheel API; legacy `mousewheel`/`DOMMouseScroll` are dead in evergreen browsers as of 2026 and do not need polyfilling |
| `TouchEvent` (`touchstart`/`touchmove`/`touchend`) | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events) | Swipe detection | Native, zero-dependency; a gesture library (Hammer.js etc.) is explicitly out of scope per the milestone's anti-library stance |
| `history.pushState`/`popstate` | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) | Hash routing without native scroll-jump | See Routing Architecture below — the load-bearing reason to prefer this over `location.hash =` |
| `inert` (HTML global attribute) | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert) | Exclude off-screen panels from focus/AT | Supported across evergreen browsers since April 2023 [CITED: caniuse.com/mdn-html_global_attributes_inert] — no polyfill needed for a 2026 static-site audience |
| `aria-live="polite"` region | [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live) | Screen-reader panel-change announcement | Standard live-region pattern; matches Fig. 01's existing `#fig01-log` `aria-live="polite"` precedent in this same codebase |
| `matchMedia('(prefers-reduced-motion: reduce)')` | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) | Reduced-motion branch + live toggle | Identical pattern to `fig01/interactions.ts`'s module-scope `rm` constant + `change` listener — reuse the exact idiom, don't reinvent |

### Supporting

| Mechanism | Purpose | When to Use |
|-----------|---------|-------------|
| `localStorage` | Persist first-visit-hint-dismissed flag + "view classic" preference | Two independent keys (Claude's discretion on naming — e.g. `deck-hint-dismissed`, `deck-view-preference`); read once at init, write on the triggering user action |
| `ResizeObserver` | Only if panel layout needs re-measurement on viewport resize (font-load reflow parity with Fig. 01's own `ResizeObserver` in `wireLifecycle`) | Likely unnecessary for the deck itself since panels are `position:absolute;inset:0` (100% of viewport by definition) — flag as YAGNI unless a specific panel needs its own resize-driven recompute |
| `CustomEvent` on `document` | `nightsky:panel-change` dispatch (already locked in CONTEXT.md) | Every panel activation — Phase 5 subscribes, this phase only produces |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled wheel/touch normalization | Hammer.js, Swiper, fullPage.js | Explicitly rejected in REQUIREMENTS.md "Out of Scope" — bundle cost + paradigm mismatch with the zero-runtime-framework constraint; the vanilla approach below matches the exact defaults these libraries ship (Hammer.js: 10px threshold / 0.3 px-ms velocity for swipe) so nothing is lost by not depending on them |
| `history.pushState` for routing | `location.hash =` direct assignment | `location.hash =` triggers the browser's native "scroll element with matching id into view" behavior and fires `hashchange` — undesirable here since panels are transform-positioned, not scroll-positioned (see Routing Architecture) |
| CSS `scroll-snap-type` + native scroll | JS transform-based panel positioning (chosen, per locked ARCHITECTURE.md Pattern 1) | Scroll-snap is simpler to build but breaks Fig. 01's `IntersectionObserver`-based lifecycle gating differently (a snapped-but-scrolled-past panel may still report as intersecting depending on snap alignment) and doesn't cleanly support instant reduced-motion transitions without fighting the browser's native smooth-scroll timing |

**Installation:** None — no new `package.json` dependencies this phase.

**Version verification:** N/A (no packages).

## Package Legitimacy Audit

**No external packages are installed this phase.** All deck mechanics are hand-rolled vanilla TypeScript against native browser APIs (`WheelEvent`, `TouchEvent`, `history`, `inert`, `matchMedia`), consistent with REQUIREMENTS.md's explicit "Out of Scope" rejection of `three.js`/`GSAP`/`fullPage.js`/`swiper`. The Package Legitimacy Gate does not apply — there is nothing to run `gsd-tools query package-legitimacy check` against.

**Packages removed due to [SLOP] verdict:** none (n/a — no packages proposed)
**Packages flagged as suspicious [SUS]:** none (n/a — no packages proposed)

## Fig. 01 Keyboard Ground Truth (definitive verdict)

**Read the whole file `src/lib/fig01/interactions.ts` (384 lines) and `src/lib/fig01/index.ts` (88 lines) directly — [VERIFIED: local source, not web-sourced].**

Every DOM listener registered anywhere in `lib/fig01/*`:

| Listener | Target | Event | File:approx line |
|----------|--------|-------|-------------------|
| `wirePointer` | `.fig-stage` | `mousemove`, `mouseleave` | interactions.ts:131, 146 |
| `wirePointer` | `#fig01-canvas` | `click` | interactions.ts:154 |
| `wireButtons` | `#send`, `#fault` | `click` | interactions.ts:200, 206 |
| `wireKeyboard` | each `.node-proxy` button | `focus`, `blur`, `click` | interactions.ts:260, 266, 272 |
| `wireLifecycle` | `document` | `visibilitychange` | interactions.ts:355 |
| `wireLifecycle` | (new `IntersectionObserver`) | intersection | interactions.ts:357-364 |
| `wireLifecycle` | (new `ResizeObserver`) | resize | interactions.ts:366-370 |
| `wireLifecycle` | `rm` (`matchMedia` result) | `change` | interactions.ts:372-373 |

**There is no `keydown`, `keyup`, or `keypress` listener anywhere in `lib/fig01/*`.** The module's own doc comment at line 245-246 states explicitly: "native Enter/Space activation (the `click` event) dispatches a beam from that node — no keydown interception, so native sequential tab order is preserved and no keyboard trap is possible." Fig. 01's "keyboard support" is entirely native `<button>` semantics (Tab to focus, native Enter/Space triggers the browser's synthetic `click` event) plus `focus`/`blur` for tooltip/ring state — it does not intercept any key itself.

**Verdict:** `deck.ts`'s own `keydown` listener for ArrowUp/ArrowDown/PageUp/PageDown/Home/End is **collision-free** with Fig. 01, including while focus sits inside Fig. 01's panel on one of its `.node-proxy` buttons. There is no scenario where both modules attempt to handle the same keydown event. The one thing the deck's keyboard handler DOES need to guard against (not a Fig. 01 collision, a general-purpose guard) is: don't advance panels when the arrow/Home/End keypress originates from an `<input>`, `<textarea>`, `<select>`, or a `contenteditable` element, or when a modifier key (Ctrl/Cmd/Alt) is held — none of those exist in this phase's content, but the guard is cheap and future-proofs against Phase 5/6 additions (e.g. a future filter input). Space is explicitly excluded from the deck's keymap per CONTEXT.md, so it never needs a guard.

## Architecture Patterns

### System Architecture Diagram

```
user input (wheel / touch / keyboard / dot-list click / anchor-tag click)
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ deck.ts — module-scope state: currentIndex, panels[], locked │
│                                                                │
│  wireWheel(root)      — accumulate deltaY, threshold+lock     │
│  wireTouch(root)      — vertical distance+velocity, threshold │
│  wireKeyboard(root)   — Arrow/PageUp/Down/Home/End, guarded   │
│  wireJumpList(root)   — intercept <a href="#id"> clicks       │
│  wireHistory()        — popstate + hashchange listeners       │
│         │                                                     │
│         ▼                                                     │
│  goTo(index) ──► bounds-check against panels.length            │
│         │                                                     │
│         ├─► mutate each Panel's data-state + inert            │
│         ├─► move focus to active panel container (tabindex=-1)│
│         ├─► update aria-live region text                      │
│         ├─► history.pushState(null, '', '#' + panel.hash)      │
│         └─► document.dispatchEvent('nightsky:panel-change')   │
│                     │                          │              │
└─────────────────────┼──────────────────────────┼──────────────┘
                       ▼                          ▼
     IntersectionObserver on .fig-stage    Phase 5 consumers
     fires automatically (Pattern 1,       (constellations.ts,
     zero fig01/* changes needed)          scene.ts) — not built
                                            this phase, contract
                                            only

Cold load (page request arrives with #fig-01 in URL):
        │
        ▼
Astro static HTML ships (all panels present, normal doc flow,
no .deck-active yet — DECK-07 base case)
        │
        ▼
Browser's native hash-anchor behavior may momentarily scroll to
#fig-01's element (harmless — same content either way, pre-JS)
        │
        ▼
deck.ts module script runs synchronously:
  1. parse location.hash → validate against panels[] → compute index
     (invalid/absent hash → index 0, per Security Mistakes note below)
  2. set every panel's data-state to match that index (NO transition
     class active yet — this happens before paint)
  3. THEN add .deck-active to the root
        │
        ▼
First .deck-active paint already shows the correct panel — no
flash of panel 0 sliding to the deep-linked panel (satisfies the
"cold-load-with-hash flow BEFORE deck init" requirement)
```

### Recommended Project Structure

Matches the already-locked ARCHITECTURE.md v2.0 structure; this phase builds only the deck-relevant slice:

```
src/
├── components/
│   ├── PanelDeck.astro         # NEW — deck shell + progress index, default slot for <Panel>s
│   ├── Panel.astro             # NEW — thin per-panel wrapper (id + centering layout)
│   └── ...                     # SiteHeader/Hero/Figure01/etc. — UNCHANGED, become Panel content
├── lib/
│   └── nightsky/
│       ├── deck.ts             # NEW — panel state machine + input wiring + change-event dispatch
│       └── (scene.ts, constellations.ts, tokens.ts, index.ts — Phase 5, not this phase)
├── data/
│   └── panels.ts               # NEW — typed panel manifest: id, hash, title (single source of truth,
│                                #   shared by PanelDeck.astro markup and deck.ts behavior)
└── pages/
    └── index.astro              # RESTRUCTURED: wraps existing sections in <Panel id="...">
```

### Pattern: Panel manifest as single source of truth (DECK-04, DECK-05)

**What:** One typed module (e.g. `src/data/panels.ts`) exports an ordered array of `{ id: string; hash: string; title: string }`. `PanelDeck.astro` imports it at build time to render both the `<Panel>` wrappers' `id` attributes and the jump-list markup (`<a href="#{hash}">{title}</a>` per entry — real anchor tags, not `<button>`s, so the no-JS fallback keeps working as native in-page navigation). `deck.ts` imports the same array at runtime to drive `goTo(index)`, hash-parsing, and the `aria-live` panel-title text.
**When to use:** Anywhere the deck needs to know panel identity/order/count — never hardcode a panel count or duplicate the id list a second time.
**Trade-offs:** None significant — this is the same "one source of truth" discipline already established by `src/data/constellations.ts`/`fig01.ts` etc. in this codebase.

**Example:**
```typescript
// src/data/panels.ts
export interface PanelSpec {
  id: string;
  hash: string;
  title: string;
}

export const panels: PanelSpec[] = [
  { id: 'hero', hash: 'hero', title: 'Prateek Kumar' },
  { id: 'fig-01', hash: 'fig-01', title: 'Fig. 01 — System' },
  { id: 'systems', hash: 'systems', title: 'Selected Systems' },
  { id: 'experience', hash: 'experience', title: 'Experience' },
  { id: 'patents', hash: 'patents', title: 'Patents & Education' },
  { id: 'skills', hash: 'skills', title: 'Skills' },
  { id: 'contact', hash: 'contact', title: 'Contact' },
];
```
```astro
---
// PanelDeck.astro
import { panels } from '../data/panels';
---
<div class="deck">
  <slot />
  <nav class="deck-index" aria-label="Panel navigation">
    <ol>
      {panels.map((p, i) => (
        <li>
          <a href={`#${p.hash}`} data-panel-index={i}>{String(i + 1).padStart(2, '0')} / {String(panels.length).padStart(2, '0')} — {p.title}</a>
        </li>
      ))}
    </ol>
  </nav>
  <div id="deck-live" class="sr-only" aria-live="polite"></div>
</div>
```

### Pattern: Progressive-enhancement bootstrap ordering (DECK-07)

**What:** `deck.ts`'s exported `initDeck(root)` must, in this exact order: (1) query and validate all required DOM nodes (throw-on-missing, same `required()` idiom as `fig01/index.ts:38-43`), (2) resolve the initial panel index from `location.hash` (bounds-checked against `panels[]`), (3) synchronously set every panel's `data-state`/`inert` to match that index, (4) wire all input handlers, (5) add `.deck-active` to root as the LAST step, (6) return a teardown. If any step before (5) throws, `.deck-active` is never added and the page stays in its base (v1 scrolling) layout — this is what makes DECK-07's no-JS/init-failure fallback automatic rather than a separately-maintained code path (carried forward verbatim from ARCHITECTURE.md Pattern 4).
**When to use:** This is the deck's entire init contract — get this ordering right once, in one place.
**Trade-offs:** Requires discipline that nothing before step (5) can throw for a reason unrelated to "JS truly can't run here" (e.g. a malformed hash must degrade to index 0, never throw) — a thrown error from bad input data would incorrectly fall back to the no-JS layout for a user who does have working JS.

**Example:**
```typescript
// deck.ts
export function initDeck(root: HTMLElement): () => void {
  const panelEls = required(root.querySelectorAll<HTMLElement>('.panel'), '.panel');
  const liveEl = required(root.querySelector<HTMLElement>('#deck-live'), '#deck-live');
  // ... other required() lookups ...

  const initialIndex = resolveIndexFromHash(location.hash, panels); // never throws; clamps to 0
  applyPanelStates(panelEls, initialIndex, { animate: false });

  const teardownWheel = wireWheel(root, /* ... */);
  const teardownTouch = wireTouch(root, /* ... */);
  const teardownKeyboard = wireKeyboard(root, /* ... */);
  const teardownHistory = wireHistory(/* ... */);

  root.classList.add('deck-active'); // LAST — everything above must have succeeded

  return (): void => {
    teardownWheel(); teardownTouch(); teardownKeyboard(); teardownHistory();
  };
}
```

### Anti-Patterns to Avoid
- **Using `location.hash = '#id'` for internal deck navigation:** Triggers the browser's native "scroll element with id into view" behavior and does not fire `hashchange` when set via script in some engines' edge cases — use `history.pushState(null, '', '#id')` instead (see Routing Architecture).
- **Moving focus into the new panel on every wheel/swipe tick, matching a literal reading of the W3C APG carousel pattern:** The APG carousel pattern (fetched directly, see Sources) says slide-change controls "do not move focus" — but that guidance is written for *auto-rotating* carousels where the user isn't the direct cause of every transition. This deck has no auto-advance (explicitly out of scope per REQUIREMENTS.md) — every single transition, including wheel/swipe, is a direct result of an explicit user gesture, which is closer to the APG's own carousel guidance for direct slide-jump controls (where moving focus to the new panel's heading is "expected and helpful," per PITFALLS.md Pitfall 3). CONTEXT.md's locked decision (move focus to the active panel container on every change) is consistent with this reasoning — document it, don't silently deviate.
- **Debouncing (waiting for scroll to stop) instead of accumulating-then-locking:** A debounce-only wheel handler feels laggy (waits out the full quiet period before firing) — accumulate delta continuously, fire as soon as the threshold is crossed, THEN lock for the transition duration. These are different techniques; PITFALLS.md Pitfall 2 and the GitHub Swiper issue discussion (see Sources) both point at this distinction.

## Wheel Normalization

**Confidence: MEDIUM** — [CITED: MDN WheelEvent/deltaMode, W3C UI Events wheel-events spec] for the mechanism; specific constant values are [ASSUMED] (no single authoritative source publishes "the" correct threshold — every real implementation tunes empirically) but are grounded in real library defaults (Hammer.js) and the codebase's own existing transition-duration precedent.

**deltaMode variants:** `WheelEvent.deltaMode` is `0` (`DOM_DELTA_PIXEL`, the default on virtually all evergreen desktop browsers/trackpads today), `1` (`DOM_DELTA_LINE`, legacy line-based mice/some Firefox configurations), or `2` (`DOM_DELTA_PAGE`, rare). [CITED: developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode] Never assume `deltaY` is in pixels without checking `deltaMode` first — a `deltaMode === 1` event's `deltaY` of `3` means "3 lines," not "3 pixels," and treating it as pixels under-weights the input by roughly 15-30x (a typical line height).

**Recommended normalization + constants:**
```typescript
// deck.ts — wireWheel
const LINE_HEIGHT_PX = 16; // approximate; only matters for the rare DOM_DELTA_LINE case
const PAGE_HEIGHT_PX = window.innerHeight;
const ACCUMULATE_THRESHOLD = 50; // normalized px; crossing this fires one panel change
const ACCUMULATOR_IDLE_RESET_MS = 150; // gap since last wheel event before the accumulator resets to 0
const TRANSITION_LOCK_MS = 400; // must equal (or slightly exceed) the CSS transition-duration

let accumulator = 0;
let lastEventTime = 0;
let locked = false;

function normalizeDelta(e: WheelEvent): number {
  switch (e.deltaMode) {
    case 1: return e.deltaY * LINE_HEIGHT_PX;
    case 2: return e.deltaY * PAGE_HEIGHT_PX;
    default: return e.deltaY; // DOM_DELTA_PIXEL — the common case
  }
}

function onWheel(e: WheelEvent): void {
  e.preventDefault(); // requires the listener to be registered { passive: false }
  if (locked) return; // momentum-tail suppression: ignore everything while locked

  const now = performance.now();
  if (now - lastEventTime > ACCUMULATOR_IDLE_RESET_MS) accumulator = 0;
  lastEventTime = now;
  accumulator += normalizeDelta(e);

  if (Math.abs(accumulator) >= ACCUMULATE_THRESHOLD) {
    const direction = accumulator > 0 ? 1 : -1;
    accumulator = 0;
    locked = true;
    goTo(currentIndex + direction);
    setTimeout(() => { locked = false; }, TRANSITION_LOCK_MS);
  }
}

root.addEventListener('wheel', onWheel, { passive: false });
```

**Rationale for the constants:**
- `50px` accumulate threshold: mid-range between "fires too easily on a light trackpad brush" and "requires an unreasonably hard mouse-wheel flick." A notched mouse typically reports `deltaY` around ±100-120px per notch under `DOM_DELTA_PIXEL` mode in evergreen Chromium/Firefox [MEDIUM confidence — WebSearch synthesis, not independently benchmarked against real hardware in this session], so 50px means one notch reliably fires exactly one transition, never two. A trackpad's per-event deltas are much smaller (often single-digit to low-double-digit px per callback during a slow gesture) but arrive many times per gesture, so the *accumulation* (not a single event's magnitude) is what crosses 50px — this is precisely why accumulation, not raw-event-triggering, is required (PITFALLS.md Pitfall 2).
- `150ms` idle-reset: resets the accumulator if the user pauses (e.g., stops scrolling to read) so a later light nudge doesn't combine with a much-earlier one to accidentally cross the threshold. This value is a common debounce-window magnitude in scroll-handling code generally [ASSUMED — no single canonical source, matches PITFALLS.md's own "120-150ms" recommendation for the accumulation window].
- `400ms` transition lock: **must match `PLAN`'s chosen CSS transition duration** (CONTEXT.md caps this at "≤ ~500ms, ease-out"). This is the load-bearing suppression for a trackpad's momentum tail — after a fired transition, ALL wheel events (including the tail-end deceleration of the physical gesture that already fired one transition) are ignored until the lock expires, which is also roughly when the CSS transition finishes, so a queued second transition never "catches up" and plays after the user has stopped scrolling (PITFALLS.md Performance Traps table, row 5).
- Locking must be checked BEFORE accumulating (not after) — an event arriving during the lock window should be fully discarded, not accumulated for after the lock expires, or a fast continuous scroll would still queue multiple transitions.

**`{ passive: false }` requirement:** `e.preventDefault()` inside a wheel handler is required to stop the browser's own native scroll-to-parent-scrollport behavior while the deck root has captured wheel input; this only works if the listener is registered non-passively. CONTEXT.md's "Specific Ideas" section already locks this: `passive:false` ONLY on the deck root element, never on `window` — registering it on `window` would degrade scroll performance globally, including on `/work/*` case-study pages, which is exactly why deck code must not even load on those routes (already enforced structurally since `deck.ts` is only imported by `index.astro`).

## Touch Swipe

**Confidence: MEDIUM** — [CITED: MDN Touch Events] for the mechanism; thresholds are [ASSUMED], grounded in Hammer.js's shipped defaults (10px distance / 0.3 px-ms velocity) [MEDIUM confidence — WebSearch, not independently verified against the Hammer.js source] scaled up somewhat for a full-viewport panel-advance gesture rather than a small-element tap-vs-swipe disambiguation.

```typescript
// deck.ts — wireTouch
const SWIPE_DISTANCE_THRESHOLD = 40; // px, vertical
const SWIPE_VELOCITY_THRESHOLD = 0.3; // px/ms
const SWIPE_HORIZONTAL_TOLERANCE = 60; // px — if horizontal drift exceeds this, treat as a horizontal
                                        // gesture and do NOT preventDefault (browser back-swipe stays intact)

let touchStartY = 0;
let touchStartX = 0;
let touchStartTime = 0;

function onTouchStart(e: TouchEvent): void {
  const t = e.touches[0];
  touchStartY = t.clientY;
  touchStartX = t.clientX;
  touchStartTime = performance.now();
}

function onTouchMove(e: TouchEvent): void {
  const t = e.touches[0];
  const dy = Math.abs(t.clientY - touchStartY);
  const dx = Math.abs(t.clientX - touchStartX);
  if (dy > dx) e.preventDefault(); // vertical intent confirmed — block native scroll/bounce
  // horizontal or ambiguous moves: do NOT preventDefault, let iOS's own gesture win
}

function onTouchEnd(e: TouchEvent): void {
  if (locked) return;
  const t = e.changedTouches[0];
  const dy = t.clientY - touchStartY;
  const dx = t.clientX - touchStartX;
  const dt = performance.now() - touchStartTime;
  const velocity = Math.abs(dy) / dt;

  if (Math.abs(dx) > SWIPE_HORIZONTAL_TOLERANCE && Math.abs(dx) > Math.abs(dy)) return; // horizontal, ignore
  if (Math.abs(dy) < SWIPE_DISTANCE_THRESHOLD || velocity < SWIPE_VELOCITY_THRESHOLD) return; // too small/slow

  const direction = dy < 0 ? 1 : -1; // swipe up = next panel (matches "scroll down" metaphor)
  locked = true;
  goTo(currentIndex + direction);
  setTimeout(() => { locked = false; }, TRANSITION_LOCK_MS);
}

root.addEventListener('touchstart', onTouchStart, { passive: true });
root.addEventListener('touchmove', onTouchMove, { passive: false }); // must be non-passive to conditionally preventDefault
root.addEventListener('touchend', onTouchEnd, { passive: true });
```

**Passive listener strategy:** `touchstart` and `touchend` can stay `{ passive: true }` (they never call `preventDefault`) so the browser can start compositing/scrolling optimistically without waiting on JS — standard perf guidance for touch handlers. `touchmove` MUST be `{ passive: false }` because it conditionally calls `preventDefault()` once vertical intent is confirmed; a passive `touchmove` listener cannot call `preventDefault` at all (the call is silently ignored and logged as a console warning in most browsers). [CITED: developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener — passive option semantics]

**iOS edge-swipe / rubber-band interaction:** Because the axis is vertical-only (per CONTEXT.md, and matching PITFALLS.md Pitfall 10's recommended mitigation), the deck's touch handling never claims the horizontal gesture space iOS Safari reserves for its edge-swipe back-navigation — this is a structural non-collision, not something that needs a runtime check. `overscroll-behavior-y: none;` on the deck root (or `html`/`body`, scoped under `.deck-active` per CONTEXT.md's progressive-enhancement discipline) suppresses the vertical rubber-band bounce that would otherwise visually fight the deck's own transform-based transition; Safari added `overscroll-behavior` support in Safari 16 [MEDIUM confidence — WebSearch synthesis, single-source claim not independently cross-verified against a WebKit changelog in this session], which is safely below any reasonable 2026 baseline. As a defense-in-depth (not a replacement), the `touchmove` handler's conditional `preventDefault()` for confirmed-vertical gestures is what actually blocks the rubber-band effect on any engine, including older WebKit where `overscroll-behavior` support might be incomplete for edge cases.

## Routing Architecture (Hash Routing on a Static Astro Page)

**Confidence: MEDIUM-HIGH** — [CITED: MDN History/pushState, MDN Window/hashchange_event] for the core mechanism distinctions; the specific integration recommendation for this codebase is this agent's synthesis grounded in those primary sources.

### pushState vs. `location.hash =` — the load-bearing distinction

| | `history.pushState(null, '', '#id')` | `location.hash = 'id'` |
|---|---|---|
| Fires `hashchange`? | **No** — pushState/replaceState never fire `hashchange`, even when the resulting URL differs only in its hash [CITED: developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event] | **Yes** |
| Triggers native scroll-to-element? | **No** | **Yes** — the browser natively scrolls the element with a matching `id` into view [CITED: WebSearch synthesis of MDN pushState + community sources, see Sources] |
| Adds a history entry? | Yes (this is the whole point) | Yes, implicitly |
| Fires `popstate` on back/forward? | Yes | Yes (browser history navigation always fires `popstate`, regardless of how the entry was created) |

**Why this matters for the deck specifically:** Every panel wrapper (`Panel.astro`) renders `id={panelId}` — the same string used as the URL hash — because that `id` is also needed for the no-JS fallback (a real in-page anchor target) and for `aria-live`/manifest bookkeeping. If deck-internal navigation used `location.hash = 'fig-01'`, the browser would attempt its native "scroll `#fig-01` into view" behavior on every single deck-driven panel change — fighting the deck's own transform-based positioning and, worse, potentially yanking scroll position on the (locked, `overflow:hidden`) outer document in ways that don't compose cleanly with `inert`/focus management. Using `history.pushState` for every deck-internal `goTo()` call sidesteps this entirely: the URL updates, a history entry is created, but nothing scrolls and no `hashchange` fires — the deck's own `goTo()` function is the single place panel-visual-state changes, and it is called directly rather than through an event handler reacting to a hash mutation it itself caused.

### The dual-listener requirement: `popstate` AND `hashchange`

Because `pushState` never fires `hashchange`, and because two genuinely different user actions can change the hash, `deck.ts` needs **two** listeners, not one:

1. **`popstate`** — fires when the user presses the browser's Back/Forward button, navigating between `pushState`-created history entries. Handler: read `location.hash` (already updated by the browser by the time `popstate` fires), resolve to a panel index, call `goTo(index, { skipPushState: true })` (skip re-pushing state — the browser already moved the history pointer).
2. **`hashchange`** — fires when a hash mutation happens by some means OTHER than the deck's own `pushState` calls — concretely, this is the jump-list's real `<a href="#id">` anchor tags (Pattern: Panel manifest above) if a click somehow isn't intercepted before the browser's default navigation completes (e.g., a middle-click, or a screen-reader/keyboard activation path that bypasses a `click` listener's `preventDefault` timing), or an external link/bookmark pointing at `yoursite.com/#experience`. Handler: identical resolve-and-`goTo` logic, `skipPushState: true` (the hash already changed; don't push a duplicate/conflicting entry).

In practice, the jump-list anchors should have their `click` handled with `preventDefault()` + explicit `goTo()` + `pushState()` as the *primary* path (Pattern: Panel manifest example above) — the `hashchange` listener is a safety net for cases where that interception doesn't run in time, not the primary navigation mechanism. This dual-listen approach is standard advice for anything mixing real anchor-hash navigation with `pushState`-driven SPA-style routing [CITED: developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event, community synthesis in Sources].

### Cold-load-with-hash flow (progressive-enhancement ordering)

See the System Architecture Diagram's "Cold load" branch above for the full sequence. The key ordering constraint, restated: **resolve the target panel index from `location.hash` and apply that panel's visual state SYNCHRONOUSLY, before `.deck-active` is added to the root.** Because Astro ships this as a plain `<script>` (same bundling seam Fig. 01 already uses — no `client:load`/hydration directive, no async gap before the module executes), this ordering is naturally achievable within a single synchronous function call in `initDeck()` — there's no async boundary (no `await`, no `requestAnimationFrame`) between reading the hash and toggling the class, so there's no frame where an incorrect intermediate state could paint.

**Bounds-checking / validation (Security note, carried from PITFALLS.md "Security Mistakes"):** `location.hash` is attacker-influenceable (a crafted link with `#<script>` or a nonexistent panel id) and must never be used to index into `panels[]` without validation. Resolve via `panels.findIndex(p => p.hash === decodeURIComponent(location.hash.slice(1)))`, and treat a `-1` result (not found) identically to an absent hash — default to index `0`. Never `eval`, never use the raw hash string to construct a selector without escaping (irrelevant here since it's only ever compared against a known finite array, never interpolated into a DOM query or `innerHTML`).

### Astro's default anchor behavior (no ClientRouter)

This project's `astro.config.mjs` has no `<ClientRouter />`/`astro:transitions` (confirmed — not present in `BaseLayout.astro` or anywhere in `src/`), so every anchor tag, including hash-only `href="#id"` links, behaves as plain native MPA navigation unless a `click` listener explicitly calls `preventDefault()`. This is a clean slate: no framework-level anchor interception to account for, no `astro:page-load`/`astro:before-swap` re-init lifecycle to wire (that concern only applies if `ClientRouter` is adopted later — CLAUDE.md's own "What NOT to Use" table already flags this as skipped for v1 and there is no indication v2.0 changes that decision).

### Case-study routing (INTG-03, this phase's default per CONTEXT.md)

`/work/[slug].astro` stays a fully separate Astro static route, entirely outside the deck. A link from inside the systems panel (`<a href="/work/dynamodb-cellularization">`) is a normal full-page navigation — leaving the deck experience entirely is expected and correct (PITFALLS.md's own resolution: case studies are "full separate pages, not panels"). No hash-routing interaction exists between the deck and `/work/*` at all; this phase's routing work is scoped entirely to the home page's own panel hashes.

## Accessibility: inert, Focus, and aria-live

**Confidence: HIGH for `inert` browser support** [CITED: caniuse.com/mdn-html_global_attributes_inert — "well established... since April 2023"]; **MEDIUM for the W3C APG carousel-pattern specifics** [CITED: w3.org/WAI/ARIA/apg/patterns/carousel/ — fetched directly this session].

### `inert` support and fallback

`inert` (both the HTML attribute and the corresponding `HTMLElement.inert` IDL property) has shipped in all evergreen engines (Chromium, Firefox, Safari) since roughly April 2023 [CITED: caniuse.com]. Given this project's stated audience (recruiters/hiring managers on current-generation browsers, no stated legacy-browser support requirement anywhere in PROJECT.md/CLAUDE.md), **no polyfill is needed** — set `panelEl.inert = true` on every non-active panel directly. This single property assignment does three things natively: removes all descendants from the tab order, blocks programmatic `.focus()` calls on descendants, and (per most engines) excludes the subtree from "find in page." Pairing with `aria-hidden="true"` (also set/cleared alongside `inert`) is still good practice for the narrow set of assistive-technology combinations that may not yet fully honor `inert`'s AT-exclusion semantics — belt-and-suspenders, not strictly required by caniuse data alone.

### W3C APG carousel pattern (fetched directly)

Key findings [CITED: w3.org/WAI/ARIA/apg/patterns/carousel/]:
- Tab/Shift+Tab moves focus "through the interactive elements of the carousel as specified by the page tab sequence" — i.e., a linear, predictable tab order, which the `inert`-on-inactive-panels approach directly delivers (only the active panel's controls + the deck's own nav are ever in that sequence).
- Activating next/previous/rotation controls "do not move focus, so users may easily repetitively activate them" — this guidance is written for the specific case of a control the user repeatedly clicks (e.g., a "next" arrow button) without losing their place.
- `aria-live` on the slide container should be `off` for auto-rotating carousels, `polite` for non-rotating ones, with `aria-atomic="false"`.
- The pattern does not explicitly mandate focus movement to new slides; it neither forbids nor requires it for non-auto-rotating, user-driven panel changes.

**Reconciliation with CONTEXT.md's locked decision** (focus moves to the active panel container, `tabindex="-1"`, on every change): this deck has zero auto-advance (explicitly out of scope) and every transition — wheel, swipe, keyboard, or jump-list click — is a direct, deliberate user action, not an ambient rotation the user might be trying to read through. PITFALLS.md's own Pitfall 3 guidance already anticipates and resolves this: reserve focus-moves for "direct user activation of a nav control... where moving focus to the new panel's heading is expected and helpful" — and in a full-viewport deck with no persistent inline content, *every* navigation method is functionally "direct activation," unlike an inline product carousel where a background auto-rotate timer might also be firing changes. **Recommendation: implement the locked decision as specified (move focus to the active panel's container `tabindex="-1"` on every `goTo()`), but do NOT move focus into a specific descendant (e.g., first heading) — moving it to the panel's own container element, not into its content, is the middle ground that orients screen-reader/keyboard users (they land in a logical Tab-start position for that panel) without hijacking focus deep into unexpected content.** Set `aria-live="polite"` (never `off`, since this deck's changes are always user-driven, not ambient rotation) with `aria-atomic="false"` matching APG guidance, on a visually-hidden region that updates its text content on every `goTo()` — e.g. `"Panel 3 of 9 — Fig. 01: System"`.

### Focus-visible against a non-canvas background (this phase)

CONTEXT.md scopes visual scrim/contrast work to Phase 6 ("Fig. 01 embedded full re-verification, scrim/contrast work" is deferred) — this phase ships against the plain v1 background (per `<domain>` "The deck ships against the plain v1 background this phase"), so `global.css`'s existing `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` rule (already shipped, verified above) needs no new work here — it remains correctly visible against the existing `--bg: #0f1216` surface. Re-verify only becomes necessary once Phase 5's starfield renders behind panel content.

## Body Scroll Locking

**Confidence: MEDIUM** — [CITED: MDN overscroll-behavior; WebSearch synthesis for iOS-specific caveats, see Sources]

### Recommended approach: CSS scoped under `.deck-active`, never global

```css
/* global.css or PanelDeck.astro's <style> — scoped, NOT applied to html/body unconditionally */
:global(html.deck-active),
:global(html.deck-active body) {
  height: 100%;
  overflow: hidden;
  overscroll-behavior-y: none;
}
```

The class must be applied to `<html>` (or both `<html>` and `<body>`), not just a wrapper `<div>`, because the thing that needs to stop scrolling is the actual document viewport — a wrapper div with `overflow:hidden` does not prevent the outer page from scrolling if its content overflows the viewport height. Since `deck.ts` only ever adds `.deck-active` to a root element after successful init (DECK-07's progressive-enhancement contract), and this CSS rule is scoped to that class, `/work/*` routes — which never load `deck.ts` at all (it's only imported by `index.astro`) — are structurally unaffected; there is no risk of the scroll-lock CSS leaking onto case-study pages, because the selector requires a class that only ever exists on the home page's `<html>` element.

**Event-prevention as defense-in-depth, not the primary mechanism:** relying purely on `overflow: hidden` is sufficient in modern evergreen browsers; the `touchmove` handler's conditional `preventDefault()` (Touch Swipe section above) already provides the event-level backstop for touch specifically. No additional `wheel`/`scroll` event prevention is needed beyond what the wheel handler already does (`preventDefault()` inside `onWheel`, which is registered on the deck root, not `window` — per CONTEXT.md's explicit constraint).

**iOS-specific caveat:** older iOS Safari versions had known bugs where `overflow: hidden` on `body` alone was insufficient to prevent rubber-banding of the whole page (a longstanding WebKit quirk); the historically-recommended workaround pattern (`html { overflow: hidden; height: 100%; position: fixed }` + `body { overflow: auto; height: 100%; position: relative }`) [CITED: WebSearch synthesis, bram.us and multiple corroborating sources] predates `overscroll-behavior` support. Given `overscroll-behavior` reached Safari in version 16 [MEDIUM confidence, single-source claim], and this project has no stated legacy-iOS support requirement, the simpler `overflow: hidden` + `overscroll-behavior-y: none` approach above should be sufficient — but this is exactly the kind of claim PITFALLS.md flags as "invisible until real device testing," so treat real-iPhone verification (already flagged in CONTEXT.md as a Phase 6 checkpoint item if tooling can't cover it) as the actual confirmation, not this research.

**Deck-script-loads-only-on-index verification:** confirmed structurally — `src/lib/nightsky/deck.ts` will only ever be imported/bundled via `PanelDeck.astro`'s own `<script>` tag, and `PanelDeck.astro` is only used by `src/pages/index.astro` (per the locked ARCHITECTURE.md structure) — `src/pages/work/[slug].astro` has no reason to import either component. No build-time route exclusion mechanism is needed; this falls out of Astro's normal per-page script bundling (each page only bundles the components it actually imports).

## Lighthouse Local-Preview Invocation

**Confidence: HIGH** — [VERIFIED: local tool check, this session — `npx lighthouse --version` returned `13.4.0` without requiring installation; `npx astro --version` returned `v7.0.7`]

```bash
# 1. Build the production bundle
npm run build

# 2. Serve the built dist/ locally — astro preview defaults to port 4321
#    (no custom `server.port` is set in astro.config.mjs, confirmed by reading the file)
npm run preview
#   -> Local  http://localhost:4321/

# 3. In a second terminal, run Lighthouse against that local URL
npx lighthouse http://localhost:4321/ \
  --output=html --output-path=./lighthouse-report.html \
  --chrome-flags="--headless"

# Optional: run both mobile and desktop presets explicitly (Lighthouse defaults to a mobile
# emulation preset; add --preset=desktop for a second pass, matching PITFALLS.md's
# "test mobile AND desktop presets" guidance carried from v1)
npx lighthouse http://localhost:4321/ --preset=desktop \
  --output=html --output-path=./lighthouse-report-desktop.html --chrome-flags="--headless"
```

**TBT considerations from adding the deck script:** the deck's own init cost (querying DOM nodes, computing initial panel index, wiring 4-5 event listener sets) is orders of magnitude cheaper than the canvas-generation work PITFALLS.md Pitfall 6 warns about (that pitfall targets Phase 5's starfield/constellation generation, not this phase) — there is no procedural generation loop in `deck.ts`, only DOM queries and `addEventListener` calls, all synchronous and sub-millisecond for a 7-9 panel deck. The one thing worth a deliberate check post-implementation: confirm `initDeck()` runs and resolves before Lighthouse's Time-to-Interactive window closes, by keeping the deck's own `<script>` tag un-deferred and free of any `await`/dynamic `import()` that would push its execution past first paint. No async work is required for this phase's scope (no fetch, no dynamic imports), so this should hold by construction — but re-run Lighthouse specifically after this phase lands (not just once at the end of the milestone) per the project's own "measure immediately after each addition" discipline (PITFALLS.md Pitfall 6).

**Windows-specific note:** the WebFetch/WebSearch findings above and the `npm run preview` port default were verified directly against this repo's own `astro.config.mjs`/`package.json` in this session (no external claim needed) — the Bash tool in this environment runs Git Bash/POSIX sh per the environment notes, so the `npm run preview &` + `npx lighthouse ...` two-step above works unmodified; no PowerShell-specific syntax is required for either command.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Cross-browser wheel-delta unit normalization | A custom heuristic guessing pixels-vs-lines from magnitude alone | Explicit `deltaMode` branching (shown in Wheel Normalization above) | `deltaMode` is the standards-track signal for exactly this; guessing from magnitude is the historical footgun PITFALLS.md Pitfall 2 documents |
| Focus-trap prevention for hidden panels | Manually setting `tabindex="-1"` on every descendant of inactive panels and remembering to restore each one | The native `inert` attribute (single property set/unset per panel) | `inert` already handles tab-order exclusion, programmatic-focus blocking, and (per most engines) find-in-page exclusion atomically — manually chasing every focusable descendant is exactly the kind of thing that regresses when a new interactive element is added to a panel later |
| Swipe gesture recognition | A generic multi-touch gesture state machine (pinch/rotate/pan/swipe all handled) | A narrow, purpose-built vertical-swipe-only detector (Touch Swipe section above) | The deck needs exactly one gesture (vertical swipe); a general-purpose gesture library (Hammer.js class of tool) is explicitly out of scope per REQUIREMENTS.md, and building a general solver for a one-gesture need is over-engineering |
| SPA-style client-side router | A generic `path -> component` router table, route matching, nested routes | Direct `pushState`/`popstate`/`hashchange` wiring against a flat, known-at-build-time panel list (Routing Architecture section) | There are exactly 7 known panel destinations, statically known at build time from `src/data/panels.ts` — a general router is solving a problem this site doesn't have (no dynamic routes on the home page, case studies are separate real Astro pages) |

**Key insight:** every "don't hand-roll" temptation in this phase resolves the same way — the browser already ships the exact-fit primitive (`deltaMode`, `inert`, `pushState`/`popstate`/`hashchange`) for a narrowly-scoped, statically-known problem (7-9 fixed panels, one site). Reaching for a general-purpose library or a hand-rolled generic abstraction both cost more than using the platform API directly at this problem's actual scale.

## Common Pitfalls

### Pitfall 1: Naive one-wheel-event-equals-one-panel logic (carried forward from PITFALLS.md Pitfall 2)
**What goes wrong:** Mapping any `deltaY !== 0` directly to a panel change skips multiple panels on a fast trackpad swipe or feels dead on a light mouse-wheel nudge.
**Why it happens:** Developers test on one input device (usually their own trackpad or mouse, not both) and the bug is invisible on whichever device wasn't tested.
**How to avoid:** Delta accumulation against a threshold + transition lock, exactly as specified in Wheel Normalization above — implement this from the first version of the wheel handler, not as a post-QA patch.
**Warning signs:** QA on a trackpad skips 2-3 panels per swipe; QA on a mouse requires multiple wheel notches to advance once.

### Pitfall 2: `location.hash =` used for deck-internal navigation
**What goes wrong:** Every deck-driven panel change triggers the browser's native scroll-to-element behavior, fighting the transform-based layout, and fires a `hashchange` event that (if also handled) can cause a navigation loop or double-processing of the same panel change.
**Why it happens:** `location.hash = 'id'` is the more commonly reached-for API in tutorials/blog posts, and its native scroll-jump behavior is invisible/harmless on a normal scrolling page (that's what most tutorials are written for) — it only becomes a bug once panels are transform-positioned instead of scroll-positioned.
**How to avoid:** Use `history.pushState(null, '', '#hash')` for every deck-internal navigation; reserve `hashchange` handling for the non-deck-initiated cases (external links, jump-list interception fallback) per the dual-listener pattern above.
**Warning signs:** Panel transitions visibly "jump" or flicker before/during the transform animation; the browser's URL bar back button behaves unpredictably.

### Pitfall 3: Forgetting the `passive: false` + conditional-`preventDefault` split between `touchstart`/`touchend` (passive) and `touchmove` (non-passive)
**What goes wrong:** Registering all three touch listeners as `{ passive: false }` unconditionally hurts scroll-start responsiveness (browser can't optimistically begin compositing); registering `touchmove` as `{ passive: true }` silently breaks the ability to block iOS rubber-banding on confirmed-vertical swipes.
**Why it happens:** Copy-pasting one `addEventListener` options object across all three touch event types without considering each event's actual need.
**How to avoid:** `touchstart`/`touchend`: `{ passive: true }`. `touchmove`: `{ passive: false }`, with `preventDefault()` called only once vertical intent is confirmed (`dy > dx`), never unconditionally (unconditional prevention would also swallow legitimate horizontal gestures, including iOS edge-back).
**Warning signs:** Console warnings about ignored `preventDefault()` calls on passive listeners; visible rubber-band bounce during vertical swipes despite `overscroll-behavior` being set; sluggish initial touch response.

### Pitfall 4: Cold-load flash of panel 0 before snapping to the hash-targeted panel
**What goes wrong:** If `.deck-active` is added to the root before the target panel index is resolved and applied, users deep-linking to (e.g.) `#contact` briefly see panel 0 (hero) animate/snap to the correct panel — a visible, jarring flash that also fails the "cold-load-with-hash flow BEFORE deck init" requirement.
**Why it happens:** It's natural to write `initDeck()` as "set up everything, THEN figure out which panel to show" rather than resolving the target panel FIRST and treating that as part of the synchronous setup, before any class toggle that would make the deck layout visible.
**How to avoid:** Resolve `location.hash` → index → apply panel `data-state`/`inert` synchronously as steps 2-3 of `initDeck()` (see Progressive-enhancement bootstrap ordering pattern above), strictly before step 5 (`root.classList.add('deck-active')`).
**Warning signs:** Visually reloading a deep-linked URL and briefly seeing the wrong panel before it corrects itself; a flash of the wrong panel in a screen recording of a cold load.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| Legacy `mousewheel`/`DOMMouseScroll` event handling for cross-browser wheel support | Standard `wheel` event with `deltaMode` branching | `wheel` has been the standards-track event since the W3C UI Events spec matured (broadly supported for many years pre-2026) | No legacy-event polyfill is needed for this project's stated audience; simplifies the wheel handler to a single listener |
| `overscroll-behavior` unsupported on iOS Safari, requiring JS-based rubber-band suppression workarounds | `overscroll-behavior` supported from Safari 16 onward | Safari 16 release | For a 2026 audience with no stated legacy-iOS requirement, the CSS-only approach (Body Scroll Locking section) is sufficient as the primary mechanism, with the `touchmove` conditional-preventDefault as backstop rather than the sole mechanism |
| `display: none` / opacity crossfade for hiding inactive carousel/deck panels | Transform-based positioning (`translate`) + `inert` | Established accessibility/performance best practice, reinforced by this project's own already-locked ARCHITECTURE.md Pattern 1 | Keeps Fig. 01's `IntersectionObserver`-gated render loop correct without any changes to `lib/fig01/*` — this project-specific consequence is the deciding factor, independent of the general best-practice argument |

**Deprecated/outdated:**
- Manual `tabindex="-1"`-per-descendant focus trapping for hidden content: superseded by the native `inert` attribute, which has been broadly supported since April 2023 and handles the same problem atomically.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Notched mouse wheel typically reports ~100-120px `deltaY` per notch under `DOM_DELTA_PIXEL` in evergreen browsers | Wheel Normalization | If actual per-notch magnitude on the developer's test hardware differs significantly, the 50px accumulate threshold may need tuning during implementation/QA — low risk, easily adjusted, self-correcting during manual cross-device testing this phase already requires |
| A2 | Hammer.js's shipped defaults (10px distance / 0.3 px-ms velocity for swipe) are the current v2 values | Touch Swipe | Low risk — these values only informed the reasoning behind the chosen 40px/0.3px-ms constants (scaled up for full-viewport gestures), not used directly; even if Hammer's actual current defaults differ slightly, the chosen constants stand on their own reasoning |
| A3 | Safari added `overscroll-behavior` support in version 16 | Touch Swipe, Body Scroll Locking | If wrong (support landed later or with caveats), the `touchmove` conditional-`preventDefault()` backstop still independently blocks rubber-banding on confirmed-vertical gestures — this is why that backstop is specified as required, not optional, mitigating the risk either way |
| A4 | `history.pushState` never triggers native scroll-to-element behavior in any evergreen browser edge case | Routing Architecture | If some browser/version edge case does scroll on a `pushState`-only hash change, the deck's `overflow: hidden` body-lock (Body Scroll Locking) would make any such scroll attempt a visual no-op anyway (nothing to scroll), providing a structural safety net even if this specific claim has an edge case |
| A5 | This project has no stated requirement to support browsers predating `inert` (~April 2023) or `overscroll-behavior` (Safari 16) | Accessibility, Touch Swipe | If the target recruiter/hiring-manager audience genuinely includes meaningfully older browsers, `inert` degrading ungracefully (older browsers simply ignore the attribute, panels remain focusable/AT-visible while transformed off-screen) would be a real accessibility regression — worth a `checkpoint:human-verify`-style confirmation if browser-support data becomes available, but no PROJECT.md/CLAUDE.md constraint suggests this is a real risk for this specific audience |

**If this table is empty:** N/A — assumptions listed above.

## Open Questions

1. **Exact wheel/touch threshold tuning**
   - What we know: The mechanism (accumulation + lock, vertical distance+velocity) is well-established; the specific numeric constants proposed above are reasoned estimates, not measured against this project's actual target hardware.
   - What's unclear: Whether 50px/400ms (wheel) and 40px/0.3px-ms (touch) feel exactly right on the planner's actual test devices.
   - Recommendation: Treat these as starting values (already marked Claude's Discretion in CONTEXT.md); implement with the constants as named exports at the top of `deck.ts` so they're trivially tunable during the cross-device QA pass this phase already requires, without touching handler logic.

2. **Whether SiteHeader/SiteFooter become fixed chrome this phase or Phase 6**
   - What we know: CONTEXT.md explicitly leaves this to Claude's discretion, describing it as "styling-only per research."
   - What's unclear: Whether making them `position: fixed` this phase changes any layout math the deck's panel positioning depends on (e.g., does a fixed header need to be excluded from each panel's `inset: 0` sizing, requiring `top: {header-height}` instead of `inset: 0`?).
   - Recommendation: Planner should decide based on whether Phase 4's `PanelDeck.astro` needs the header/footer treated as chrome outside the deck loop from day one (structurally simpler, avoids a Phase 6 refactor of the CSS grid/positioning) versus deferring purely visual fixed-positioning to Phase 6. Given ARCHITECTURE.md's System Overview already diagrams SiteHeader/SiteFooter rendering "OUTSIDE the panel loop, as fixed chrome" as the target end-state, doing the structural placement now (even if final visual polish lands in Phase 6) avoids a later DOM-restructuring pass.

## Security Domain

`security_enforcement` is enabled (`security_asvs_level: 1` in `.planning/config.json`) but this is a static, backend-less personal site with no authentication, no user data, and no server. Most ASVS categories are structurally not applicable.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|--------------------|
| V2 Authentication | No | No auth system exists or is planned |
| V3 Session Management | No | No sessions — fully static site |
| V4 Access Control | No | No access-controlled resources |
| V5 Input Validation | **Yes** — narrowly | `location.hash` is the only "external input" this phase processes; validate/bound it against the known `panels[]` array before using it to derive any rendering state (see Routing Architecture "Bounds-checking / validation" above) — never trust it as a raw index or interpolate it into a DOM query/`innerHTML` |
| V6 Cryptography | No | No cryptographic operations in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|------------------------|
| Crafted URL hash (`#<script>...`, or a non-existent panel id) used to drive rendering | Tampering (of client-side state, not server data) | Bounds-check against the static, build-time-known `panels[]` array; fall back to index 0 on no-match; never use the raw hash string in `innerHTML`, `eval`, or as a raw array index without a `findIndex`-style lookup (already specified above) |
| `aria-live` region or panel-title text sourced from anything other than the build-time `panels[]` manifest | Tampering/Information Disclosure (low severity — all content is already public résumé data per the project's honesty-gate discipline) | Keep all panel titles/manifest content in the typed, build-time `src/data/panels.ts` module — never derive announced text from URL-controlled input directly |

## Sources

### Primary (HIGH confidence)
- `src/pages/index.astro`, `src/layouts/BaseLayout.astro`, `src/lib/fig01/interactions.ts` (full file), `src/lib/fig01/index.ts` (full file), `src/styles/global.css`, `src/styles/tokens.css`, `astro.config.mjs`, `package.json` — read directly from this repository this session
- `npx astro --version` (`v7.0.7`), `npx lighthouse --version` (`13.4.0`), `node --version` (`v22.22.2`) — verified directly in this session against this environment
- [W3C ARIA Authoring Practices Guide — Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) — fetched directly this session (WebFetch)

### Secondary (MEDIUM confidence)
- [WheelEvent: deltaMode property — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode)
- [WheelEvent: deltaY property — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaY)
- [Wheel Events — W3C UI Events spec](https://w3c.github.io/uievents/split/wheel-events.html)
- [History: pushState() method — MDN](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)
- [Window: hashchange event — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event)
- [HTML attribute: inert — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert) / [caniuse: mdn-html_global_attributes_inert](https://caniuse.com/mdn-html_global_attributes_inert)
- [Prevent overscroll/bounce in iOS MobileSafari and Chrome (CSS only) — Bram.us](https://www.bram.us/2016/05/02/prevent-overscroll-bounce-in-ios-mobilesafari-pure-css/)
- [Hammer.js Swipe recognizer docs](https://hammerjs.github.io/recognizer-swipe/)
- [Change URL hash without page jump — Lea Verou](https://lea.verou.me/blog/2011/05/change-url-hash-without-page-jump/)
- `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md` (v2.0, this milestone, 2026-07-17) — project's own prior research, carried forward and extended

### Tertiary (LOW confidence)
- Specific numeric constants (50px wheel threshold, 400ms lock, 40px/0.3px-ms touch swipe) — this agent's synthesis from the above sources plus this project's own transition-duration doctrine; not independently benchmarked against real hardware in this session, flagged in Assumptions Log A1/A2 and marked Claude's Discretion in CONTEXT.md
- Safari 16 as the exact `overscroll-behavior` support landing version — single-source WebSearch synthesis, not cross-verified against a WebKit release-notes fetch (Assumptions Log A3)

## Metadata

**Confidence breakdown:**
- Standard stack (no new packages, native APIs only): HIGH — verified against the actual shipped codebase and MDN/W3C primary sources
- Architecture (panel manifest, progressive-enhancement ordering, event contract): HIGH — internal patterns directly extend already-locked, already-verified ARCHITECTURE.md decisions and directly-read fig01 source
- Wheel/touch constants: MEDIUM — mechanism HIGH confidence, specific numeric values LOW/ASSUMED (flagged explicitly, tunable, gated behind this phase's own required cross-device QA pass)
- Routing (pushState/popstate/hashchange): HIGH — directly sourced from MDN primary docs, cross-checked against the actual DOM contract (`id={panelId}` matching hash) read from this repo
- Accessibility (inert, APG carousel): HIGH for inert support data (caniuse), MEDIUM for APG pattern applicability reasoning (this agent's synthesis reconciling APG's carousel guidance with this deck's no-auto-advance design)
- Pitfalls: MEDIUM — carried forward from the milestone's own dedicated PITFALLS.md research pass (2026-07-17), which was itself WebSearch-cross-verified against W3C/Chrome DevRel sources

**Research date:** 2026-07-17
**Valid until:** 30 days for the platform-API mechanism claims (stable, unlikely to change); the specific numeric constants should be treated as living values tuned during this phase's own implementation/QA, not re-researched
