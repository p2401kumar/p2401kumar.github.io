---
phase: 04-deck-mechanics
verified: 2026-07-17T22:45:09Z
status: gaps_found
score: 5/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "The mono progress index (jump list) reflects the current panel — every jump-list entry gets aria-current + a leading ▸ marker + accent text color when it is the active panel (04-UI-SPEC.md line 158, CONTEXT.md 'current panel aria-current' locked decision)"
    status: partial
    reason: "DeckIndex.astro's build-time markup sets aria-current=\"true\" + the ▸ marker only on the first (`hero`) jump-list entry (`aria-current={i === 0 ? 'true' : undefined}`). deck.ts's goTo()/announce() update the '#deck-index-count' NN/07 text correctly on every navigation, but never touch the jump-list anchors' aria-current attribute or the accent-colored marker. After the first navigation away from the hero panel, the jump list permanently and incorrectly indicates 'hero' as the current panel — both visually (stuck accent-colored ▸) and to assistive technology (aria-current='true' never moves). Grepped deck.ts for every aria-current/marker/jumpAnchors reference outside the initial required()/click-handler wiring — zero writes found."
    artifacts:
      - path: "src/lib/nightsky/deck.ts"
        issue: "goTo()/announce() never update aria-current or the .marker element on .deck-jump anchors when the active panel changes"
      - path: "src/components/DeckIndex.astro"
        issue: "Renders aria-current + the accent marker only for index 0 at build time; nothing re-renders it client-side"
    missing:
      - "A jump-list sync step (e.g. inside applyPanelStates or a new updateJumpList(index) called from goTo) that sets aria-current=\"true\" on the anchor matching currentIndex, removes it from all others, and moves/toggles the ▸ marker to match"
---

# Phase 4: Deck Mechanics Verification Report

**Phase Goal:** Visitors navigate the full CV as a no-scroll deck — every input path works one-gesture-one-panel, panels are deep-linkable and back-button-safe, and the page degrades cleanly to the v1 scrolling layout when JS is unavailable.
**Verified:** 2026-07-17T22:45:09Z
**Status:** gaps_found
**Re-verification:** No — initial verification (a prior run was killed by an auth error before writing any VERIFICATION.md; this is a clean run)

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP Success Criteria) | Status | Evidence |
|---|---|---|---|
| 1 | Visitor can advance/retreat exactly one panel at a time via mouse wheel, vertical touch swipe, keyboard, and the mono progress index (with direct jump-to-panel) — no trackpad double-fire, no dead mouse feel | ⚠️ PARTIAL | `wireWheel`/`wireTouch`/`wireKeyboard`/`wireJumpList` all present in `src/lib/nightsky/deck.ts`, correctly gated by `locked`/`TRANSITION_LOCK_MS`/accumulator+`IDLE_RESET_MS` (wheel), `SWIPE_DISTANCE`/`SWIPE_VELOCITY`/horizontal-tolerance (touch), guarded key map (keyboard), `data-panel-index` click interception (jump). Human-verify checkpoint (04-03 Task 2) explicitly approved feel/no-double-fire. **But** the jump list's own "current panel" indicator (aria-current + accent marker) never updates after init — see Gaps. |
| 2 | Every panel has a URL hash: browser back/forward move between panels and a deep link cold-loads to the correct panel | ✓ VERIFIED | `goTo()` calls `history.pushState(null, '', '#'+hash)`; `wireHistory()` listens to both `popstate` and `hashchange` and resolves via `resolveIndexFromHash` (bounds-checked, `findIndex`+`decodeURIComponent`, `-1→0`); `initDeck` resolves `location.hash` and calls `applyPanelStates`/`announce` synchronously *before* `.deck-active` is added (no flash of panel 0). Human-verify checkpoint approved deep-link cold-load + back/forward. |
| 3 | Keyboard navigation is fully operable with a keymap that does not collide with Fig. 01's inner controls; hidden panels are `inert` and panel changes announce via `aria-live` | ✓ VERIFIED | `grep` of `src/lib/fig01/interactions.ts` confirms zero `keydown` listeners anywhere in fig01 (only `focus`/`blur`/`click` on `.node-proxy` buttons) — deck.ts's `document`-level `keydown` handler is provably collision-free. `applyPanelStates` sets `.inert`/`aria-hidden` on every non-active panel; `announce()` writes `#deck-live` via `textContent` only (never `innerHTML`). |
| 4 | A first-visit affordance hints how to navigate then recedes; a quiet "view classic" link exposes the scrolling view at any time | ✓ VERIFIED | `DeckIndex.astro` renders `.deck-hint` + `.deck-view-classic`/`.deck-view-deck` links unconditionally; `wireHint()` hides immediately if `deck-hint-seen` already set, otherwise `dismissHint()` fires (fade + localStorage write) on the first `goTo`; `wireViewToggle()` toggles `deck-active`/`classic-active` + persists `deck-view-preference`. |
| 5 | With JS disabled the page renders the v1 scrolling layout (`.deck-active` added only after successful init); under `prefers-reduced-motion` panel transitions are instant | ✓ VERIFIED | Every selector in `src/styles/deck.css` is scoped under `html.deck-active` (manual read: zero unscoped top-level rules). `dist/index.html` (built) confirms structural no-JS output: 7 `class="panel"`, exactly 1 true `id="contact"` (boundary-aware regex), all 6 other deep-link ids present exactly once, `#deck-live`/`aria-live="polite"` present, `href="#work"` count 0 / `href="#systems"` count ≥1. `deck.css` `@media (prefers-reduced-motion: reduce) { transition: none; }` is the only reduced branch; `deck.ts`'s `lockDuration()` also collapses the transition-lock window to 0 under reduced motion. Init-failure path (`PanelDeck.astro`'s boot `<script>` try/catch) explicitly removes `.deck-active` on any `initDeck()` throw or missing `.deck` root — including undoing the guarded pre-paint speculative add (04-03 CLS fix). |
| 6 | (Supporting/derived) `nightsky:panel-change` event contract dispatched with `{index, id, total}` on every activation, for Phase 5 to consume | ✓ VERIFIED | `goTo()` dispatches `document.dispatchEvent(new CustomEvent(PANEL_CHANGE_EVENT, { detail: { index, id, total } }))` on every change; sentinel confirmed present in `dist/_astro/*.js` (home bundle) and absent from every `dist/work/*` HTML page and every JS chunk those pages reference (leak loop: `OK`). |

**Score:** 5/6 truths fully verified (1 marked PARTIAL — jump-list current-panel indicator wiring is incomplete; see Gaps).

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/data/panels.ts` | `PanelSpec` + 7-entry `panels[]` + `PANEL_COUNT` | ✓ VERIFIED | 7 entries confirmed (hero/fig-01/systems/experience/patents/skills/contact); no other file hardcodes the panel list. |
| `src/components/Panel.astro` | Thin wrapper, `.panel`, `data-panel-id`, `tabindex="-1"`, conditional `id` | ✓ VERIFIED | Matches spec exactly; `emitId={false}` used once (contact) to avoid duplicate `id="contact"`. |
| `src/components/PanelDeck.astro` | Deck shell + boots `initDeck` + guarded pre-paint script | ✓ VERIFIED | Imports `deck.css`; renders `.deck` wrapping `<slot/>` + `<DeckIndex/>`; bare bundled `<script>` boots `initDeck` in try/catch; `is:inline` pre-paint script added in 04-03 (CLS fix) is correctly gated + watchdog-backed. |
| `src/components/DeckIndex.astro` | Progress index, jump list, hint, view-classic/deck-view links, aria-live region | ✓ VERIFIED (existence/wiring) — ⚠️ current-panel marker not live-updated (see Gaps) | All hooks present (`#deck-index`, `#deck-index-count`, `.deck-jump`, `#deck-hint`, `.deck-view-classic`, `.deck-view-deck`, `#deck-live`); manifest-driven (`panels.map`); all chrome `display:none` by default, shown only under `.deck-active`/`.classic-active`. |
| `src/styles/deck.css` | Transform-only layout, fixed chrome, scroll-lock, reduced-motion, zero hex | ✓ VERIFIED | 0 `display:none`/`visibility:hidden`; ≥2 `translateY`; `prefers-reduced-motion`+`transition: none` present; `position: fixed` on both `header`/`footer` under `.deck-active`; 0 real hex literals (raw grep hits are `#deck-*` id-selector substrings only — confirmed false positive); every selector scoped under `html.deck-active`. |
| `src/lib/nightsky/deck.ts` | State machine, input wiring, hash routing, a11y, event dispatch | ✓ VERIFIED (existence/wiring) — ⚠️ jump-list aria-current gap (see Gaps) | `initDeck`, `WHEEL_THRESHOLD`/`IDLE_RESET_MS`/`TRANSITION_LOCK_MS` (+ swipe constants) all exported; no import from `src/lib/fig01/*`; `innerHTML` count 0; `.inert`, `aria-hidden`, `textContent`, `preventScroll`, `history.pushState`, `findIndex`+`decodeURIComponent` all present. |
| `src/pages/index.astro` | Restructured composition wrapping each section in `<Panel>` | ✓ VERIFIED | All 7 v1 sections wrapped in order; `SiteHeader`/`SiteFooter` remain outside `<PanelDeck>`. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `src/pages/index.astro` | `src/components/Panel.astro` | 7× `<Panel id=...>` | ✓ WIRED | Confirmed in source and in built `dist/index.html` (7 `class="panel"`). |
| `src/components/DeckIndex.astro` | `src/data/panels.ts` | `panels.map` | ✓ WIRED | Import + map confirmed; jump list + index derive from the manifest. |
| `src/components/PanelDeck.astro` | `src/styles/deck.css` | frontmatter `import` | ✓ WIRED | Confirmed; deck CSS only bundles where `PanelDeck` is used (home page). |
| `src/components/PanelDeck.astro` | `src/lib/nightsky/deck.ts` | bare `<script>` → `initDeck(root)` | ✓ WIRED | Confirmed, wrapped in try/catch with `.deck-active` cleanup on failure. |
| `src/lib/nightsky/deck.ts` | `src/data/panels.ts` | `import { panels, PANEL_COUNT }` | ✓ WIRED | Confirmed. |
| `src/lib/nightsky/deck.ts` | `document` | `nightsky:panel-change` CustomEvent | ✓ WIRED | Confirmed dispatched on every `goTo`; sentinel present only in home bundle (`dist/_astro`), absent from every `/work/*` page/chunk. |
| `src/lib/nightsky/deck.ts` (`goTo`/`announce`) | `.deck-jump a[aria-current]` / `.marker` | expected: sync current-panel indicator | ✗ NOT WIRED | No code path in `deck.ts` ever writes `aria-current` or touches the marker on the jump-list anchors after `initDeck`'s one-time `required()` lookup. `DeckIndex.astro`'s build-time `aria-current={i===0 ? 'true' : undefined}` is never revised. |

### Data-Flow Trace (Level 4)

Not applicable — the deck renders build-time-authored panel manifest data (no DB/API-backed dynamic content this phase); the single dynamic "data" concern (current-panel state) is covered under Key Link Verification above.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Production build succeeds | `npm run build` | 4 pages built, sitemap generated, no errors | ✓ PASS |
| Zero TS/Astro errors | `npx astro check` | 35 files, 0 errors / 0 warnings / 0 hints | ✓ PASS |
| No fig01 keydown collision | `grep -n keydown src/lib/fig01/interactions.ts` | no matches | ✓ PASS |
| Fig. 01 rAF pause wiring (04-03 fix) | `grep -n MutationObserver src/lib/fig01/interactions.ts` | `panelObserver` present, observes `.panel[data-state]`, gates `panelActive` into `updateRunState`/`shouldRun` | ✓ PASS |
| Deck sentinel absent from /work/* | leak loop over `dist/work/*/index.html` + every referenced `/_astro/*.js` | `loop done` (no LEAK lines) | ✓ PASS |
| Claimed commits exist with matching diffs | `git show --stat 598f171 / 74beb1d / c168bfd` | all three found, messages match SUMMARY.md narrative | ✓ PASS |
| Jump-list `aria-current` updates on navigation | `grep -n aria-current src/lib/nightsky/deck.ts` | zero matches | ✗ FAIL (see Gaps) |

Lighthouse (mobile/desktop, all four categories) was not independently re-run in this verification pass — `npx lighthouse` is not pre-installed in this environment and installing it live was out of scope for a read/build/grep-based verification; per the task's explicit instruction, the recorded scores in `.planning/phases/04-deck-mechanics/lighthouse-scores.md` (100/95/100/100 both presets, after the documented guarded pre-paint CLS fix) are accepted as evidence. The commit `c168bfd` implementing that fix was independently confirmed to exist and match its stated diff (pre-paint `is:inline` script + hardened catch path in `PanelDeck.astro`, `data-deck-ready` readiness signal in `deck.ts`).

### Probe Execution

No `scripts/*/tests/probe-*.sh` convention or phase-declared probes found in this repository. Skipped.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| DECK-01 | 04-02 | Wheel one-gesture-one-panel | ✓ SATISFIED | Accumulator + threshold + lock in `wireWheel`; human-verified feel. |
| DECK-02 | 04-02 | Touch swipe one-gesture-one-panel | ✓ SATISFIED | `wireTouch` vertical-intent gating; human-verified (device-emulation); real hardware explicitly and acceptably deferred to Phase 6 per 04-CONTEXT.md. |
| DECK-03 | 04-02 | Keyboard nav, no Fig.01 collision, inert, aria-live | ✓ SATISFIED | Confirmed via source read of both modules. |
| DECK-04 | 04-01/04-02 | Progress indicator + direct jump-to-panel | ⚠️ PARTIALLY SATISFIED | Jump-to-panel and the `NN/07` counter work; the jump list's own current-panel marker/aria-current never updates post-init — see Gaps. |
| DECK-05 | 04-01/04-02 | URL hash per panel, back/forward, deep-link cold-load | ✓ SATISFIED | `pushState`, dual `popstate`/`hashchange` listeners, synchronous pre-`.deck-active` hash resolution. |
| DECK-06 | 04-01/04-02 | First-visit hint, dismiss + remember | ✓ SATISFIED | `wireHint`/`dismissHint` + `deck-hint-seen` localStorage key. |
| DECK-07 | 04-01/04-02/04-03 | No-JS fallback; `.deck-active` added only after successful init; view-classic escape hatch | ✓ SATISFIED | All deck CSS `.deck-active`-scoped; init-failure path (incl. pre-paint watchdog) removes the class; view-classic/deck-view toggle persists via localStorage. |
| DECK-08 | 04-01/04-02 | Reduced-motion instant transitions | ✓ SATISFIED | `deck.css`'s sole reduced branch + `deck.ts`'s `lockDuration()` collapse. |

No orphaned requirements — REQUIREMENTS.md's DECK-01..08 all trace to plans in this phase.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| — | — | No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers found in any deck-related source file (`panels.ts`, `Panel.astro`, `PanelDeck.astro`, `DeckIndex.astro`, `deck.css`, `deck.ts`, `index.astro`, `SiteHeader.astro`, `fig01/interactions.ts`, `fig01/index.ts`) | — | — |
| `src/lib/nightsky/deck.ts` | `goTo`/`applyPanelStates` | Missing jump-list `aria-current`/marker sync (documented above as a Key Link + Requirements gap, not a debt-marker) | ⚠️ Warning | Jump list gives assistive tech and sighted users incorrect "current panel" information after the first navigation |

### Human Verification Required

None new. The phase's own blocking human-verify checkpoint (04-03-PLAN.md Task 2) was already resolved during execution — the operator typed "approved" against all 8 feel-and-flow criteria (wheel, keyboard, jump index, hash/history, first-visit hint, view-classic, reduced-motion, touch), with real-device touch/swipe testing explicitly and acceptably carried forward to Phase 6's checkpoint (pre-agreed, not a blocker). This verification pass accepts that resolution as recorded in `04-03-SUMMARY.md` rather than re-soliciting it. The newly-found jump-list `aria-current` gap was not part of that checklist's explicit wording ("clicking/keyboard-activating an entry jumps directly to that panel and updates the index" — satisfied by the `NN/07` counter) and was only surfaced by direct source inspection in this verification pass; it does not require a new human checkpoint, only a code fix.

### Gaps Summary

One genuine implementation gap, found via direct source inspection (not disclosed in SUMMARY.md): the jump list's "current panel" indicator — `aria-current="true"` plus the accent-colored `▸` marker, both explicitly specified in `04-UI-SPEC.md` ("Current panel gets `aria-current="true"` + a leading `▸` marker + `--accent` text color") and in `04-CONTEXT.md`'s locked decision ("current panel aria-current") — is only ever set at build time for the initial `hero` panel (`DeckIndex.astro`: `aria-current={i === 0 ? 'true' : undefined}`). `deck.ts`'s `goTo()`/`announce()` correctly update the `#deck-index-count` `NN/07` text and the `aria-live` announcement on every navigation, but never touch the jump-list anchors themselves. The practical effect: open the jump list after navigating anywhere past the hero panel, and it still visually and semantically claims "hero" is current — a real, user-visible and screen-reader-visible defect against a locked design decision, not a cosmetic nit. Everything else in the phase — wheel/touch/keyboard/jump navigation, hash routing + cold-load + back/forward, inert/aria-live, first-visit hint, view-classic/no-JS fallback, and reduced-motion — is present, correctly wired, and (where automatable) passes; where not automatable, it was confirmed via the phase's own already-resolved human-verify checkpoint. Recommended fix: add an `updateJumpList(index)` step (wired into `applyPanelStates` or called alongside `announce()` inside `goTo`) that toggles `aria-current` and the `.marker` span across the `.deck-jump` anchors to match `currentIndex`.

---

_Verified: 2026-07-17T22:45:09Z_
_Verifier: Claude (gsd-verifier)_
