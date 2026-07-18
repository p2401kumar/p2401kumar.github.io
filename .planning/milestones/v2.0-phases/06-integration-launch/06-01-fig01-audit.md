# 06-01 Fig. 01 Embedded Audit — INTG-02 (the Pitfall 11 re-verification)

**Method:** scripted headless Chrome over CDP (scratchpad `fig01-embedded-audit.mjs`, reusing
the repo's zero-dep `verify-contrast.mjs` harness pattern) against the local preview
(`npm run build && npx astro preview` → `http://localhost:4321/`). Four independent cold
browser instances: (A) cold `/#fig-01` + full v1 interaction checklist + one-active-animation,
(B) resize-while-inactive → activate, (C) classic mode, (D) reduced motion
(`--force-prefers-reduced-motion`). Result: **36 PASS / 0 FAIL** → `FIG01 EMBEDDED AUDIT PASS`.
**Date:** 2026-07-18. No push, no deploy.

**Ground truth anchoring (files read live, not from summaries):** `render.ts layout()` computes
`W = .fig-stage getBoundingClientRect().width`, `H = canvas.clientHeight` (CSS 380px / 300px
≤640w), `canvas.width = W × getDpr()` where `getDpr() = min(devicePixelRatio, 2)`.
`interactions.ts wireLifecycle()` observes `.panel[data-state]` via MutationObserver
(→ `panelActive` gate) and re-layouts on EVERY `.fig-stage` resize via a ResizeObserver that
is **not** gated on `panelActive`. `deck.css` hides inactive panels via transform/opacity/
pointer-events only, so `.fig-stage` keeps a nonzero box while hidden. `PanelDeck.astro`'s
pre-paint script speculates ONLY for `''`/`#hero` hashes; `deck.ts initDeck` resolves other
hashes synchronously. `scene.ts` subscribes `nightsky:panel-change` by literal name;
`detail.id === 'fig-01'` → `fig01Active` → `updateRunState()` stops the scene loop.

---

## Deck-reality additions (the four new INTG-02 gates)

| # | Check | Result | Evidence |
|---|---|---|---|
| D1 | **Cold deep-link `/#fig-01` — no 0×0 init** | **PASS** | `#fig01-canvas` backing store **878×380** at init (nonzero both axes); `= round(clientWidth 878 × min(dpr 1, 2))` exactly |
| D1a | Cold `/#fig-01` — fig-01 panel active | **PASS** | `[data-panel-id="fig-01"]` `data-state="active"` after load |
| D1b | Cold `/#fig-01` — NO pre-paint speculation (Phase 4's documented trade-off: post-load activation is the expected path) | **PASS** | In-page MutationObserver timeline on `<html> class`: `.deck-active` added exactly once, at `readyState: "interactive"` — never at `"loading"` |
| D2 | **Resize while fig-01 INACTIVE → activate re-measures** (no 0×0, no stale DPR) | **PASS** | At `/#hero` (fig-01 inactive, rAF paused): canvas 878×380 @ dpr 1. CDP `Emulation.setDeviceMetricsOverride` 800×700 @ deviceScaleFactor **2** while inactive → ResizeObserver re-layouts (not gated on panelActive) → activate via ArrowDown → canvas **1468×760** = round(clientWidth 734 × 2) / round(380 × 2); backing store changed 878→1468 (re-measured, not stale) |
| D3 | **Classic mode keeps Fig. 01 functional** | **PASS** | With `deck-view-preference: classic` persisted, cold reload: `<html>` is `classic-active` and NOT `deck-active`; page is a native scrolling layout; `.fig` has a nonzero box; `#send` click writes "request dispatched → region" to the log |
| D3a | No-JS floor (built output) | **PASS** | `dist/index.html` carries the full figure chrome: 10 `class="node-proxy"` buttons, `role="img"` canvas, `id="fig01-log"` (verify-block greps) |
| D4 | **One-active-animation** | **PASS** | Hero active: two `#nightsky-canvas` captures 500ms apart **differ** (scene running). ArrowDown → fig-01 active (`nightsky:panel-change` fires): two scene captures 500ms apart **identical** (scene paused) while two `#fig01-canvas` captures during a dispatched beam **differ** (fig01 animating). Exactly one canvas animates at a time |

## The v1 checklist re-pass (maps 1:1 to 02-VERIFICATION.md — 5 truths + FIG-01..07), embedded in the deck

| v1 item | Embedded re-check | Result | Assertion evidence |
|---|---|---|---|
| Truth 1 / FIG-01 — build-in animation + ambient beams on load | Cold `/#fig-01` paints the full topology; fig01 canvas captures differ over time (loop running); screenshot shows built-in figure with beam mid-flight | **PASS** | `06-01-fig01-coldload.png`; animation-differ capture pair in D4 |
| Truth 2 / FIG-02 — dispatch a request, watch it travel | `#send` click → log prepends "request dispatched → region"; beam animates (capture pair differs during dispatch) | **PASS** | log firstChild `"21:41:52  request dispatched → region"` |
| Truth 2 / FIG-04 — hover/focus any node shows a real production fact | Focusing `.node-proxy[data-node]` shows `#fig01-tip` (computed opacity **1**, non-empty innerHTML — real fact: "auto-weight-away · 90% capacity ops automated" visible in the degraded screenshot) | **PASS** | tooltip opacity=1 + non-empty on focus of proxy #4 |
| Truth 3 / FIG-03 — fault: degrade (amber/dashed), weigh away, narrate, self-heal ~8s | `#fault` click → log line `"cell3 fault injected → weighed away · traffic rerouting · p99 stable"` with class `hl`; `#fault` disabled; after ~8.6s log gains `"cell3 recovered · weight restored"` class `ok`; `#fault` re-enabled | **PASS** | timestamps 21:41:52 fault → 21:42:01 heal (~8s + narration); `06-01-fig01-degraded.png` shows amber dashed cell-3 + dead-end dashed routes |
| Truth 4 / FIG-05 — reduced-motion: informative static figure, fault still works | Under `--force-prefers-reduced-motion` at cold `/#fig-01`: two canvas captures 400ms apart **identical** (static frame, no loop); `#fault` click still narrates (class `hl`) AND repaints the static frame exactly once; post-fault captures identical again (redraw never starts a loop) | **PASS** | capture-pair equality before/after; fault log line present |
| Truth 4 / FIG-06 — keyboard operable, no trap | All 10 `.node-proxy` buttons present with non-empty aria-labels; focus shows tooltip; native click (Enter/Space path) dispatches "request dispatched"; blur/refocus behaves (no keydown interception in lib/fig01 — unchanged since v1) | **PASS** | count=10, allLabeled=true; proxy click log line |
| sr-only degraded narration (02-UI-SPEC accessibility copy) | On fault, exactly ONE proxy's aria-label gains the `· degraded, rerouting` suffix (the faulted cell); suffix cleared after heal | **PASS** | `"cell-3 — isolated failure domain · compute/storage split · degraded, rerouting"`; 0 degraded labels after heal |
| Truth 5 / FIG-07 — single rAF, DPR cap 2, lifecycle gating | DPR cap proven live in D2 (deviceScaleFactor 2 → backing exactly ×2, capped path exercised); pause gating proven by D4 (panel-change) and the pre-resize state (fig-01 inactive at `/#hero` = rAF paused per MutationObserver); static source invariants re-verified in Task 3 (render.ts rAF=2, interactions.ts rAF=0) | **PASS** | D2/D4 rows above + 06-01-lighthouse-scores-local.md battery |

## Recorded observation (not a gate failure — event-contract edge)

**Cold `/#fig-01` scene state:** the scene↔fig01 pause contract is **event-driven**
(`nightsky:panel-change`, dispatched by `deck.ts goTo()` on navigation). A cold deep-link to
`/#fig-01` applies panel states synchronously at init **without dispatching the event** (init
calls `applyPanelStates`, not `goTo`), so the scene canvas keeps animating behind the active
fig-01 panel until the first deck navigation fires the event — measured live: scene capture
pair differed on cold `/#fig-01` before any navigation; identical immediately after
hero→fig-01 navigation. Impact: cold-deep-link-only, self-corrects on the visitor's first
navigation, no effect on Lighthouse (`/` audits the hero path) and none on the v1 checklist.
Recorded as a **fix-forward item** in 06-01-LAUNCH-READINESS.md (a one-line init dispatch or
DOM-read in scene.ts would close it post-launch); per plan scope, product code is not patched
in this plan.

## Screenshots (committed to this phase dir)

| File | Shows |
|---|---|
| `06-01-fig01-coldload.png` | Cold `/#fig-01`: canvas painted (nonzero, full topology + beam), fig-01 panel active, deck chrome (02/07), scene + constellations behind |
| `06-01-fig01-degraded.png` | Post-fault: cell-3 amber + dashed, dead-end dashed routes, amber `hl` log narration, `#fault` disabled, focused-proxy tooltip with production fact |
| `06-01-fig01-resize-activate.png` | Post-resize (800×700) + activate: figure re-measured to the narrower stage, correctly laid out, no 0×0/blank canvas |

## Audit-tooling note (deviation, tooling-side only)

First audit run failed ONE check (tooltip-on-focus) because headless-Chrome documents are
unfocused: `element.focus()` set `document.activeElement` but never **dispatched** the focus
event, so the tooltip listener never ran. Verified in isolation (focus fired=false without,
fired=true with), then fixed by enabling CDP `Emulation.setFocusEmulationEnabled` in the audit
harness. Product code untouched — keyboard focus behaves correctly under real focus semantics.

---

**Result: INTG-02 PASS — the full v1 Fig. 01 checklist re-passes embedded in the deck, plus
all four deck-reality additions (no 0×0 cold init / nonzero canvas, resize-while-inactive
re-measure, classic mode, one-active-animation).** Raw run log: scratchpad `fig01-audit.out`.
