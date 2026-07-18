# 06-02 — Pre-launch fix verification + full gate battery re-run

**Context:** the two fix-forward items from `06-01-LAUNCH-READINESS.md` were approved for
fix-then-launch by the user's explicit go decision ("Fix 2 edges, then launch", 2026-07-18).
Both fixes applied, verified by scripted CDP audit (11/11), and the full 06-01 gate battery
re-run green before any push. **Date:** 2026-07-18 (local, pre-deploy).

## The two fixes

| Fix | Commit | Change |
|---|---|---|
| A — `/#work` → systems | `185be56` | `HASH_ALIASES` Map (`work` → `systems`) consulted before the manifest lookup in `resolveIndexFromHash` (deck.ts). Map, not object, so crafted hashes never walk the prototype (T-04-01). Panel ids untouched; classic/no-JS native anchor (`SystemsList` `id="work"`) untouched. |
| B — cold `/#fig-01` pause | `c9c6148` | `seedFig01ActiveFromDom()` (scene.ts): one-shot init seed of `fig01Active` from `html.deck-active` + the active panel's `data-panel-id`, run inside `adoptLayer0` before the loop can start. Timing-safe without listener-order proof: `adoptLayer0` is only reachable from `generateLayer0`'s idle-scheduled completion, strictly after deck.ts's synchronous init. DOM read only — zero deck/fig01 imports. The `deck-active` gate keeps classic-pref boots animating exactly as before (initDeck applies `data-state` even on its classic branch). |

## Scripted CDP fix audit — 11/11 PASS

Zero-dep CDP harness (scratchpad `verify-fixes.mjs`, same shape as the 06-01 audit), headless
Chrome 1440×900 against the local preview build. All cold loads are REAL document loads
(about:blank hop — a fragment-only `Page.navigate` is otherwise a same-document navigation).

| # | Check | Result |
|---|---|---|
| A1 | Cold `/#work` → systems panel `data-state="active"`, deck mode | PASS |
| A1b | Cold `/#work` → hash preserved as `#work` (no rewrite — existing resolver behavior) | PASS |
| A2 | Cold `/#systems` → systems panel active (regression) | PASS |
| A3 | In-page hashchange → `#work` (crosslink path) routes to systems | PASS |
| A4 | Crafted `/#toString` → falls back to hero (T-04-01 unchanged) | PASS |
| B1a | Cold `/#fig-01` → fig-01 panel active | PASS |
| B1b | Cold `/#fig-01` → scene PAUSED at init (2 canvas captures ~700 ms apart identical) | PASS |
| B1c | Navigate away to `#hero` → scene RESUMES (captures differ) | PASS |
| B1d | Navigate back to `#fig-01` (event path) → paused again (event contract intact) | PASS |
| C1 | Hero cold-load → scene ANIMATES at init (captures differ — no new regression) | PASS |
| C2 | Classic-pref cold `/#fig-01` → classic mode + scene still animates (unchanged) | PASS |

## Full gate battery re-run (post-fix, pre-push)

Convention: counts via `grep -o … | wc -l`, never `grep -c`.

| Check | Result |
|---|---|
| `npx astro check` | PASS (0 errors / 0 warnings / 0 hints) |
| `npm run build` | PASS (exit 0, 4 pages) |
| Zero hex outside tokens.css, boundary-aware `#[0-9a-fA-F]{3,8}\b` (src/lib/nightsky, src/lib/fig01, src/lib/shared, NightSky.astro, constellations.ts, deck.css) | PASS (0) |
| rAF: fig01/render.ts = 2 · scene.ts = 2 · starfield.ts = 0 · meteors.ts = 0 · nightsky total = 2 · fig01 total = 2 | PASS |
| Zero deck/fig01 imports in scene modules (scene/constellations/starfield/meteors) — Fix B's DOM read survives | PASS (0) |
| Contrast `--cdp` 1440×900 | PASS — worst **8.51:1** vs --ink, 0 failing regions, 7 panels (06-01: 7.89 — sampling noise, floor 4.5) |
| Contrast `--cdp` 1280×800 | PASS — worst **7.72:1** vs --ink, 0 failing regions, 7 panels (06-01: 8.39) |
| Moon dimness `--moon` 1440×900 | PASS — moonPeak 0.1949 < mwPeak 0.7540 |
| Moon dimness `--moon` 1280×800 | PASS — moonPeak 0.1939 < mwPeak 0.4472 |
| Local Lighthouse mobile (default preset) | PASS — **98 / 100 / 100 / 100** (TBT 170 ms, LCP 1.4 s, CLS 0.003; 06-01 pre-flight was 96 — TBT noise recovered) |
| Local Lighthouse desktop (`--preset=desktop`) | PASS — **100 / 100 / 100 / 100** (TBT 10 ms, LCP 0.4 s, CLS 0) |

**All gates green — the contingent launch approval's condition is satisfied. Proceeding to the
fast-forward push (THE deploy). `.planning/config.json` untouched.**
