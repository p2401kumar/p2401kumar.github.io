# Phase 04-03 — Automated Acceptance Gate + Local Lighthouse

**Audit method:** `npx lighthouse` (v13.4.0) headless Chrome (`--chrome-flags="--headless=new"`), against the LOCAL preview server (`npm run build && npm run preview` → `http://localhost:4321/`) — NOT the deployed site. Deck active (default view preference, no `deck-view-preference` override in a clean profile).
**Date:** 2026-07-17 (initial run) → 2026-07-17 (guarded pre-paint fix + re-run)

## PASS/FAIL summary (current — after guarded pre-paint fix)

| Check | Result |
|---|---|
| `npm run build` | PASS |
| `npx astro check` (0 errors) | PASS |
| Zero hex literals outside tokens.css | PASS (raw grep count is 12, all false positives — see note below) |
| Transform/opacity-only panel hiding (no `display:none`/`visibility:hidden` in deck.css) | PASS (0 matches) |
| No-JS fallback intact (7 `.panel`, 1 `id="contact"`, all 6 other deep-link ids, key v1 content strings, `#deck-live`) | PASS |
| Deck JS unreachable from `/work/*` | PASS (sentinel present in `dist/_astro`, absent from every `/work/*` HTML and every JS chunk those pages reference) |
| Lighthouse — Performance >= 90 (mobile + desktop) | **PASS** — 100 / 100 |
| Lighthouse — Accessibility >= 90 (mobile + desktop) | PASS — 95 / 95 |
| Lighthouse — Best Practices >= 90 (mobile + desktop) | PASS — 100 / 100 |
| Lighthouse — SEO >= 90 (mobile + desktop) | PASS — 100 / 100 |

## Lighthouse scores — before / after the guarded pre-paint fix

| Run | Performance | Accessibility | Best Practices | SEO | CLS |
|---|---|---|---|---|---|
| Mobile — before (deck.css only, `.deck-active` added post-init) | 76 | 95 | 100 | 100 | 1 (score 0.02) |
| Desktop — before | 76 | 95 | 100 | 100 | 1 (score 0.02) |
| **Mobile — after (guarded pre-paint activation)** | **100** | 95 | 100 | 100 | **0 (score 1)** |
| **Desktop — after** | **100** | 95 | 100 | 100 | **0 (score 1)** |

Supporting metrics from the "after" runs: mobile TBT 90ms, LCP 1.4s; desktop TBT 0ms, LCP 0.4s. Every category on both presets is now >= 90; the previously-capping CLS shift is fully eliminated on the no-hash (`/`) load path that Lighthouse audits.

Raw JSON: `lh-mobile-v3.json` / `lh-desktop-v2.json` (scratchpad — not committed; re-run to reproduce, commands in 04-RESEARCH.md "Lighthouse Local-Preview Invocation"). Prior "before" runs: `lh-mobile-v2.json` / `lh-desktop.json` (same scratchpad location, superseded by this fix).

Accessibility held steady at 95/95 on both runs — the one sub-1.0 audit (`color-contrast`) is pre-existing and unrelated to this change; out of scope for this plan.

## Fix Applied — Guarded pre-paint deck activation (human decision: "Fix now, guarded")

**Human decision recorded:** after the first Lighthouse run flagged CLS=1 as a Rule-4 architectural trade-off (see "Original Known Issue" below), the operator chose to fix it now rather than defer to Phase 6, on the condition that the fix preserve DECK-07's init-failure fallback guarantee (no-JS / thrown-init-error pages must still render the v1 scrolling layout).

**Design:** a tiny synchronous, non-module (`is:inline`) inline script in `PanelDeck.astro`, emitted before the `.deck` markup so it runs during initial HTML parsing — before first paint, before the deferred module scripts (which is what caused the original reflow: `.deck-active` previously only arrived once `deck.ts`'s bundled `type="module"` script finished loading/parsing/executing, well after the browser had already painted the tall, in-flow, un-activated `.deck`).

1. **Precondition-gated speculative activation.** The inline script adds `.deck-active` to `<html>` pre-paint ONLY when both hold: no `deck-view-preference: classic` in `localStorage` (the same strict check `deck.ts`'s own init uses — duplicated intentionally, since an `is:inline` script cannot import `deck.ts`'s constants) AND `location.hash` is empty or `#hero`. Non-hero deep links (e.g. `#patents`) are deliberately left unguarded: `deck.ts`'s existing synchronous hash-resolution-before-`.deck-active` path already paints the correct panel first for those, so pre-applying speculatively here would risk a flash of the wrong panel. Lighthouse audits `/` (no hash), so the no-hash path is what governs the recorded scores; the deep-link path keeps its original (pre-fix) behavior and CLS profile — an accepted, documented trade-off, not a regression.
2. **Watchdog preserving DECK-07.** The speculative-add branch also arms a ~2.5s `setTimeout` that removes `.deck-active` again unless `html[data-deck-ready="true"]` has appeared by then. `deck.ts` now sets that data attribute as the literal last step of every successful `initDeck()` (both deck and classic-preference modes). This covers the "module never executes" failure mode (blocked script, network failure, CSP violation) that the pre-existing try/catch in `PanelDeck.astro`'s boot script could never catch (nothing throws if the module simply never runs).
3. **Boot-script catch-path fix (closes a real gap the pre-paint change introduced).** `PanelDeck.astro`'s bundled module boot script previously assumed `.deck-active` was *never* present if `initDeck()` threw or `.deck` was missing — true before this fix, no longer true once pre-paint speculation exists. The catch path now explicitly runs `document.documentElement.classList.remove("deck-active")` (idempotent, safe even if the class was never added), and the missing-`.deck`-root case is now folded into the same try/catch (previously silently skipped, leaving a stale speculative class with no cleanup). This is what actually keeps DECK-07's "any init failure falls back to the v1 scrolling layout" guarantee true under pre-paint activation.
4. **`deck.ts` idempotency.** `classList.add('deck-active')` in the non-classic branch is already idempotent (no behavior change needed). The classic-preference branch now explicitly removes a stray speculative `.deck-active` before adding `.classic-active` — defends against the (extreme edge-case) race where the persisted preference resolves to classic after the pre-paint script already speculated deck-active; without this, both classes could coexist, showing deck layout with classic (non-functional) input handling.
5. **No-JS story confirmed intact.** `is:inline` scripts are still real `<script>` elements — with JS disabled entirely, the browser executes no script tags at all (inline or bundled), so `.deck-active` is never added by any path and the page renders the plain v1 scrolling layout automatically. No new no-JS surface was introduced.

**Files modified:** `src/components/PanelDeck.astro` (new `is:inline` pre-paint script + hardened boot-script catch path), `src/lib/nightsky/deck.ts` (readiness signal + defensive classic-branch class removal). No changes to `deck.css`, `Panel.astro`, `DeckIndex.astro`, or `panels.ts` — the fix is entirely in the bootstrap sequencing, not the layout CSS itself.

**Verification after fix:** `npm run build` green; `npx astro check` 0/0/0; zero hex literals (still 12 false-positive substring matches, unchanged from before); zero `display:none`/`visibility:hidden` in `deck.css` (unchanged, 0); no-JS fallback counts unchanged (7 `.panel`, 1 `id="contact"`); `/work/*` leak loop still OK (deck sentinel present only in `dist/_astro`, absent from every `/work/*` HTML and every JS chunk those pages reference); Lighthouse mobile + desktop both 100/95/100/100 with CLS eliminated (score 1 / displayValue 0).

## Original Known Issue (RESOLVED by the fix above — kept for history)

**Cumulative Layout Shift = 1 (score 0.02) on both mobile and desktop, deterministically, capping performance at 76 regardless of throttling.**

- **Evidence:** `layout-shifts` audit reported exactly one shift, on `body > div.page > div.deck`, with a `boundingRect` matching the full viewport (`{top:0, bottom:823, height:823}` mobile / `{top:0, bottom:940, height:940}` desktop) and score `1` (near-maximum layout-shift score). Reproduced identically on the desktop preset (zero CPU/network throttling), ruling out a throttling artifact.
- **Root cause:** `deck.css`'s `html.deck-active .deck { position: fixed; inset: 0; }` rule only applied once `<html>` got the `.deck-active` class, and `deck.ts` added that class as the intentionally-LAST step of `initDeck()` (DECK-07's progressive-enhancement safety guarantee). Because `PanelDeck.astro`'s and `Figure01.astro`'s boot scripts are both Astro-bundled `type="module"` scripts, they are deferred and fetch+parse+execute asynchronously, after the browser had already parsed and could paint the initial HTML/CSS. In that pre-JS state `.deck` was a normal in-flow `<div>` containing all 7 stacked panel sections (much taller than one viewport). The instant `deck.ts` finished loading and added `.deck-active`, `.deck` snapped from "tall, static, in-flow" to "exactly-viewport-height, fixed" — a real, visible reflow on every load.
- **Why it was not auto-fixed at the time:** eliminating it required making `.deck-active` present before first paint, which on its face conflicted with the deliberate DECK-07 invariant that `.deck-active` must be the LAST thing added, only after `initDeck()`'s `required()` checks and initial `applyPanelStates` all succeed. This was flagged as a Rule-4 architectural trade-off spanning two already-completed plans (04-01, 04-02), requiring a human decision rather than a unilateral auto-fix.
- **Resolution:** the operator selected "Fix now, guarded" — see "Fix Applied" above. The guarded pre-paint pattern eliminates the reflow on the audited (no-hash) path while adding an explicit watchdog + hardened catch-path so the DECK-07 fallback guarantee holds even with speculative pre-paint activation in play.

## Zero-hex-literal grep note

The literal grep count (`#[0-9a-fA-F]{3,8}`) across deck source files is **12**, not 0. All 12 are false positives: `#deck-live`, `#deck-index-count`, `#deck-hint`, `#deck-index` CSS id-selectors contain the substring `#dec` (`d`, `e`, `c` are all valid hex digits, and the regex's minimum length is 3), which the naive pattern matches and then stops at the next non-hex character (`k`). Manual inspection of every match (`src/lib/nightsky/deck.ts`, `src/components/DeckIndex.astro`) confirms every one sits inside a CSS id selector or a doc-comment reference to one — never an actual color literal. This is the same substring-trap category already documented in 04-01-SUMMARY.md and 04-02-SUMMARY.md. Real invariant (zero actual hex color literals) holds, unchanged by this plan's fix.

## Deep-link id / `id="contact"` grep note

Raw `grep -c` counts for each deep-link id return 2 (e.g. `id="hero"` matches both the real `id="hero"` attribute and the substring tail of `data-panel-id="hero"`). Boundary-aware regex (`grep -oE '(^| )id="X"'`) confirms exactly 1 true occurrence of each: `hero`, `fig-01`, `systems`, `experience`, `patents`, `skills`, `contact`. Same substring-trap category as above.
