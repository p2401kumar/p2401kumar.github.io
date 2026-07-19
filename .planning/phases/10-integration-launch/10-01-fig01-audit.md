# 10-01 Fig. 01 Composited Audit — the embedded 36-check re-run with FULL ambient behind it (FLR-02)

**Method:** scripted headless Chrome over CDP (scratchpad `fig01-composited-audit.mjs`, reusing
the repo's zero-dep `verify-contrast.mjs` / `capture-battery.mjs` harness pattern) against the
local composited preview (`npm run build && npm run preview` → `http://localhost:4321/`).
Result: **30 runtime PASS / 0 FAIL** → sentinel `FIG01 COMPOSITED AUDIT PASS` (raw log:
scratchpad `fig01-audit.out`, report JSON `fig01-audit-report.json`). Plus the 6 static no-JS
floor greps recorded in `10-01-integration-evidence.md` §B — 36 checks total.
**Date:** 2026-07-19. No push, no deploy, no product source touched.

**Ground truth anchoring (files read live this plan, never from summaries):**
`render.ts getDpr() = min(devicePixelRatio, 2)`; `layout()` sizes the backing store from
`.fig-stage` bounds. `interactions.ts wireLifecycle()` re-layouts on EVERY `.fig-stage` resize
via a ResizeObserver **not** gated on `panelActive` (MutationObserver on `.panel[data-state]`
owns the pause gate); `HEAL_DELAY_MS = 8000`. `scene.ts` subscribes `nightsky:panel-change` by
literal name → `fig01Active` → `updateRunState()` stops the SINGLE ambient rAF that drives
clouds + aurora + parallax + scintillation together, AND `seedFig01ActiveFromDom()` (06-02
Fix B, line 257) seeds the pause from the deck's own DOM on cold deep-links — the v2 carried
note is CLOSED in source and proven live below (A3). `deck.ts HASH_ALIASES = Map([['work',
'systems']])` (line 98) — v2 fix-forward CLOSED, proven live in the integration evidence (B7).

---

## The v3 composited additions (what v2's audit could not prove)

| # | Check | Result | Evidence |
|---|---|---|---|
| A3 | **One-active-animation with FULL AMBIENT — COLD `/#fig-01`** (clouds + aurora + parallax + scintillation all frozen because they share the single ambient rAF the pause machine stops; Fix B seeds the pause with NO navigation event) | **PASS** | two whole-`#nightsky-canvas` dataURL hashes ~2s apart **identical** (len 173618, hash 1051661350 both) — canvas-hash instrument per the Phase-9 battery (camper-glow CSS pulse legitimately animates outside reduced motion; the pause contract is the canvas) |
| A4 | fig-01's OWN canvas animates during a dispatched beam while the scene is frozen | **PASS** | `#fig01-canvas` capture pair during beam **differs** (hash 3631649164 → 3313760039) |
| A11 | Hero: the SAME `#nightsky-canvas` pair **differs** (ambient live) | **PASS** | hash 2458803825 → 2252842108 across ~2s |
| A12 | Navigation-driven pause (hero → fig-01 via `nightsky:panel-change`) still freezes the scene | **PASS** | pair identical (len 182006, hash 2683945232 both) |

**Exactly one canvas animates at a time, with all four ambient systems in the frame — on both
the cold-deep-link path (Fix B) and the event path.** This is the composited-parity proof.

## Deck-reality checks (carried from v2's INTG-02, re-passed on the composite)

| # | Check | Result | Evidence |
|---|---|---|---|
| A1 | Cold `/#fig-01` — no 0×0 init | **PASS** | backing store **878×380** = round(clientWidth 878 × min(dpr 1, 2)) exactly |
| A2 | Cold `/#fig-01` — panel active + hash | **PASS** | `[data-panel-id="fig-01"]` `data-state="active"`, `location.hash === '#fig-01'`, `deck-active` |
| C0/C1 | **Resize while INACTIVE → activate re-measures** (DPR cap 2, no stale store) | **PASS** | at `/#hero` (fig-01 inactive) 878×380 @dpr1 → CDP metrics 800×700 @deviceScaleFactor **2** while inactive → ArrowDown activate → **1468×760** = round(734×2)/round(380×2); both dims > 0, changed from 878 (re-measured, not stale). Screenshot captured at DSF1 (machine constraint: capture hangs at DSF2 — assert done at DSF2, evidence shot at DSF1 same CSS size) |
| E1/E2 | **Classic mode keeps Fig. 01 functional on the composite** | **PASS** | `classic-active` (not `deck-active`), `.fig-stage` 814×380, sky photo `<img>` loaded (naturalWidth 1440, avif), CC BY 4.0 + NOIRLab credit rendered, `#send` click writes "request dispatched → region" |
| D1 | Reduced-motion: ONE static frame **of the whole composite** | **PASS** | two FULL screenshots ~2s apart **byte-identical** (272,628 bytes); photo + moon + constellations + **clouds** (cover4 0.73 margin band) + **aurora** (mean 12.94, cover4 0.50) all present in the still |
| D2 | Reduced-motion: fault still narrates + exactly one redraw | **PASS** | fig01 canvas pair identical → `#fault` click → `hl` line "cell1 fault injected → weighed away · traffic rerouting · p99 stable" + hash changed once (98826971) → post-fault pair identical again (no loop started) |

## The v1 checklist re-pass (maps 1:1 to 02-VERIFICATION.md — 5 truths + FIG-01..07), embedded in the composite

| v1 item | Embedded re-check | Result | Assertion evidence |
|---|---|---|---|
| Truth 1 / FIG-01 — build-in + ambient beams | Cold `/#fig-01` paints full topology; fig01 canvas pair differs over time (loop running) | **PASS** | `10-01-fig01-coldload.png`; A4 pair |
| Truth 2 / FIG-02 — dispatch a request | `#send` click → log prepends "request dispatched → region"; beam animates | **PASS** | A5 log line `14:42:18  request dispatched → region` |
| Truth 2 / FIG-04 — hover/focus shows a real production fact | Focus `.node-proxy[data-node]` → `#fig01-tip` computed opacity **1**, non-empty (fact visible in both screenshots) | **PASS** | A7 (with `Emulation.setFocusEmulationEnabled` — the proven v2 harness technique) |
| Truth 3 / FIG-03 — fault: degrade, weigh away, narrate, self-heal ~8s | `#fault` → `hl` line "cell3 fault injected → weighed away · traffic rerouting · p99 stable"; `#fault` disabled; **~8s later** `ok` line "cell3 recovered · weight restored"; re-enabled | **PASS** | A9/A10, timestamps 14:42:19 → 14:42:27 (8s); `10-01-fig01-degraded.png` shows amber/dashed cell-3 + dead-end routes |
| Truth 4 / FIG-05 — reduced-motion informative static figure, fault works | D1/D2 above | **PASS** | byte-identical full pairs; fault narration under RM |
| Truth 4 / FIG-06 — keyboard operable, no trap | 10 `.node-proxy` buttons, all aria-labeled + data-node; focus → tooltip; native click dispatches | **PASS** | A6/A7/A8; zero keydown listeners in lib/fig01 (unchanged — deck arrow keys never collide) |
| sr-only degraded narration | On fault, exactly ONE proxy label gains "· degraded, rerouting" (the faulted cell); cleared after heal | **PASS** | A9 degradedCount 1 ("cell-3 — isolated failure domain · compute/storage split · degraded, rerouting"); A10 degradedCount 0 |
| Truth 5 / FIG-07 — single rAF, DPR cap 2, lifecycle gating | DPR cap proven live in C1 (DSF 2 → backing exactly ×2); pause gating by A3/A11/A12; static rAF invariants re-verified in `10-01-battery.md` (render.ts rAF=2) | **PASS** | C1 + A3/A11/A12 + battery greps |

## Deviations (audit tooling only — product code untouched, Rule 1)

1. **Tooltip opacity read too early:** the tooltip is CSS-transitioned; reading computed
   opacity in the same `Runtime.evaluate` as `focus()` returns the pre-transition 0. Fixed by
   reading after a 450ms settle. (The focus handler provably ran — `innerHTML` non-empty.)
2. **Fragment-only `Page.navigate` is a same-document navigation:** "cold" deep-links were not
   cold and the classic-mode page never reloaded. Fixed with an `about:blank` interposition
   before every cold load (`coldNav`).
3. **`addScriptToEvaluateOnNewDocument` observer on `document.documentElement` at
   document-start:** `documentElement` is null at injection time, so the no-hero-flash timeline
   never recorded. Fixed by observing `document` with `subtree` + filtering to html-class
   mutations. Result: `deck-active` added exactly once, at `readyState: "interactive"`, with
   **patents already the active panel** (no flash of hero).

## Screenshots (committed to this phase dir)

| File | Shows |
|---|---|
| `10-01-fig01-coldload.png` | Cold `/#fig-01` on the composite: figure painted + tooltip fact, glass panel + header/footer chrome, photo + clouds behind (frozen), 02/07 pill |
| `10-01-fig01-degraded.png` | Post-fault: cell-3 amber/dashed + dead-end routes, amber `hl` narration, `#fault` disabled, focused-proxy tooltip |
| `10-01-fig01-resize-activate.png` | Post-resize (800×700) + activate: figure re-measured to the narrower stage, no 0×0/blank canvas |
| `10-01-classic-mode.png` | Classic mode on the composite: native scroll layout, photo + credit, Fig. 01 interactive |

---

**Result: the full v1 Fig. 01 checklist re-passes embedded in the FULLY COMPOSITED page, plus
all deck-reality checks AND the v3 composited-parity proof (one-active-animation with all four
ambient systems frozen, cold AND event paths). 30/30 runtime + 6/6 static = 36/36.**
