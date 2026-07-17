# Phase 04-03 — Automated Acceptance Gate + Local Lighthouse

**Audit method:** `npx lighthouse` (v13.4.0) headless Chrome (`--chrome-flags="--headless=new"`), against the LOCAL preview server (`npm run build && npm run preview` → `http://localhost:4321/`) — NOT the deployed site. Deck active (default view preference, no `deck-view-preference` override in a clean profile).
**Date:** 2026-07-17

## PASS/FAIL summary

| Check | Result |
|---|---|
| `npm run build` | PASS |
| `npx astro check` (0 errors) | PASS |
| Zero hex literals outside tokens.css | PASS (see note below — raw grep count is 12, all false positives) |
| Transform/opacity-only panel hiding (no `display:none`/`visibility:hidden` in deck.css) | PASS (0 matches) |
| No-JS fallback intact (7 `.panel`, 1 `id="contact"`, all 6 other deep-link ids, key v1 content strings, `#deck-live`) | PASS |
| Deck JS unreachable from `/work/*` | PASS (sentinel present in `dist/_astro`, absent from every `/work/*` HTML and every JS chunk those pages reference) |
| Lighthouse — Performance >= 90 (mobile + desktop) | **FAIL** — 76 / 76 (see Known Issue below) |
| Lighthouse — Accessibility >= 90 (mobile + desktop) | PASS — 95 / 95 |
| Lighthouse — Best Practices >= 90 (mobile + desktop) | PASS — 100 / 100 |
| Lighthouse — SEO >= 90 (mobile + desktop) | PASS — 100 / 100 |

## Lighthouse scores

| Run | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Mobile (default preset) | **76** | 95 | 100 | 100 |
| Desktop (`--preset=desktop`) | **76** | 95 | 100 | 100 |

Raw JSON: `lh-mobile-v2.json` / `lh-desktop.json` (scratchpad — not committed; re-run to reproduce, commands in 04-RESEARCH.md "Lighthouse Local-Preview Invocation").

## In-scope bug found and fixed during this gate (Rule 1)

**Fig. 01's animation loop ran continuously regardless of panel visibility, burning ~2.6s of main-thread blocking time on every load.**

- **Root cause:** `src/lib/fig01/interactions.ts`'s `wireLifecycle` pauses the canvas rAF loop via an `IntersectionObserver` on `.fig-stage` (`updateRunState`: `shouldRun = intersecting && !document.hidden && !rm.matches`). `deck.css` hides inactive panels via `opacity`/`pointer-events` ONLY (never a box-suppression technique, by design — see deck.css's own header comment and DECK-08's transform-only requirement) — every panel, active or not, stays `position:absolute;inset:0`, i.e. geometrically full-viewport at all times. `IntersectionObserver` measures geometry, not opacity, so `entry.isIntersecting` never goes `false` for Fig. 01's panel once the deck is active — the animation loop never paused, even when the Fig. 01 panel was fully transparent and un-interactive.
- **First-run evidence:** mobile Lighthouse Total Blocking Time = 2,630ms (score 0.04), `mainthread-work-breakdown` "other" = 6.8s, 20 long tasks all attributed to `Figure01.astro_astro_type_script...js` spanning the entire trace window (693ms–5620ms+). Mobile performance score: **47**.
- **Fix:** Added a fourth pause signal to `wireLifecycle` — a `MutationObserver` watching the ancestor `.panel[data-state]` attribute (the same DOM contract `deck.ts` already writes on every activation), gating a new `panelActive` flag into `updateRunState`'s `shouldRun` check. Deck-agnostic: reads only the documented `.panel[data-state]` contract, never imports `nightsky/*` (respects the `nightsky/*` ↔ `fig01/*` module boundary from CONTEXT.md), defaults `panelActive = true` so behavior outside a deck context (no `.panel` ancestor) is unchanged.
- **Verification after fix:** mobile TBT = 20ms (score 1.0); `npm run build` green; `npx astro check` 0/0/0. Mobile performance score: 47 → **76**.
- **Files modified:** `src/lib/fig01/interactions.ts`
- **Committed separately** from this file (see task commit).

## Known Issue — NOT fixed, flagged for a human decision (Rule 4)

**Cumulative Layout Shift = 1 (score 0.02) on both mobile and desktop, deterministically, capping performance at 76 regardless of throttling.**

- **Evidence:** `layout-shifts` audit reports exactly one shift, on `body > div.page > div.deck`, with a `boundingRect` matching the full viewport (`{top:0, bottom:823, height:823}` mobile / `{top:0, bottom:940, height:940}` desktop) and score `1` (near-maximum layout-shift score). Reproduced identically on the desktop preset (zero CPU/network throttling), ruling out a throttling artifact — this is a deterministic shift that happens on every page load.
- **Root cause:** `deck.css`'s `html.deck-active .deck { position: fixed; inset: 0; }` rule only applies once `<html>` gets the `.deck-active` class, and `deck.ts` adds that class as the intentionally-LAST step of `initDeck()` (04-02-SUMMARY: "the exact locked order... `.deck-active`/`.classic-active` added last, so any pre-activation throw leaves the page in its v1 scrolling layout" — DECK-07's progressive-enhancement safety guarantee). Because `PanelDeck.astro`'s boot script and `Figure01.astro`'s boot script are both Astro-bundled `type="module"` scripts (confirmed via `dist/index.html`), they are deferred and fetch+parse+execute asynchronously, after the browser has already parsed and can paint the initial HTML/CSS. In that pre-JS state `.deck` is a normal in-flow `<div>` containing all 7 stacked panel sections (much taller than one viewport — the intentional DECK-07 "byte-equivalent to v1 scrolling layout" floor). The instant `deck.ts` finishes loading and adds `.deck-active`, `.deck` snaps from "tall, static, in-flow" to "exactly-viewport-height, fixed" — a real, visible reflow on every load, not just a Lighthouse artifact.
- **Why this was not auto-fixed:** The only way to eliminate this shift is to make `.deck-active` present before first paint (e.g. a synchronous, non-module inline script in `<head>`, the standard FOUC-prevention pattern). That directly conflicts with the *deliberate, already-committed* DECK-07 safety invariant from 04-02: `.deck-active` must be the LAST thing added, only after `initDeck()`'s `required()` DOM checks and initial `applyPanelStates` all succeed, specifically so a thrown init error never leaves the page in a broken deck-active-but-unwired state — it must gracefully fall back to the v1 scrolling layout instead. Pre-emptively adding `.deck-active` before that verification would trade away that documented fallback guarantee for a performance metric. This is a structural/boot-sequence trade-off spanning two already-completed plans (04-01, 04-02), not a same-file bug fix — per the executor's deviation rules this requires a human decision (Rule 4), not a unilateral auto-fix.
- **Options for resolution** (for human decision, not yet chosen):
  1. **Accept as a known limitation**, carry it into Phase 6 (pre-launch/deploy phase) as a scoped follow-up item — the deck is fully functional, accessible (95/100), and correct; only the CLS metric (and the associated one-time visible reflow on cold load) is affected.
  2. **Design a safe FOUC-prevention fix** that preserves the DECK-07 fallback guarantee — e.g. a minimal synchronous inline script that speculatively adds `.deck-active` AND flips `deck.css`'s default (no-`data-state`) panel treatment to `opacity:0`/hidden (so an unresolved panel state never shows overlapping content), with `deck.ts`'s existing `required()` failure path removing `.deck-active` again on a thrown init error (a genuine fallback-on-failure path, not just omission-of-add). This is a real design/implementation task, not a one-line change, and should go through its own plan.
  3. **Accept the 76 score** as-is if the must_haves.truths threshold is renegotiated for this phase (least preferred — the plan's explicit acceptance criteria requires >= 90 across all four categories).
- **Not fixed in this plan.** Flagged in the checkpoint return for a human decision.

## Zero-hex-literal grep note

The literal grep count (`#[0-9a-fA-F]{3,8}`) across deck source files is **12**, not 0. All 12 are false positives: `#deck-live`, `#deck-index-count`, `#deck-hint`, `#deck-index` CSS id-selectors contain the substring `#dec` (`d`, `e`, `c` are all valid hex digits, and the regex's minimum length is 3), which the naive pattern matches and then stops at the next non-hex character (`k`). Manual inspection of every match (`src/lib/nightsky/deck.ts` lines 12-14, 420-422; `src/components/DeckIndex.astro` lines 16, 18) confirms every one sits inside a CSS id selector or a doc-comment reference to one — never an actual color literal. This is the same substring-trap category already documented in 04-01-SUMMARY.md (`id="contact"` vs `data-panel-id="contact"`) and 04-02-SUMMARY.md (`innerHTML` inside doc comments). Real invariant (zero actual hex color literals) holds.

## Deep-link id / `id="contact"` grep note

Raw `grep -c` counts for each deep-link id return 2 (e.g. `id="hero"` matches both the real `id="hero"` attribute and the substring tail of `data-panel-id="hero"`). Boundary-aware regex (`grep -oE '(^| )id="X"'`) confirms exactly 1 true occurrence of each: `hero`, `fig-01`, `systems`, `experience`, `patents`, `skills`, `contact`. Same substring-trap category as above.
