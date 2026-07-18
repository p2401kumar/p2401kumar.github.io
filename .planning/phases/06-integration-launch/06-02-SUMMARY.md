---
phase: 06-integration-launch
plan: 02
subsystem: launch-deploy
tags: [launch, deploy, github-pages, lighthouse, fix-forward, hash-alias, pause-seed]
requires:
  - phase: 06-integration-launch
    plan: 01
    provides: launch-readiness pack (18/19 gates green local) + the two fix-forward items
provides:
  - v2.0 "Night Sky" LIVE at https://p2401kumar.github.io/ (replaces v1)
  - INTG-04 authoritative live Lighthouse evidence (mobile 98/100/100/100, desktop 100x4)
  - both fix-forward items fixed pre-launch and re-proven in production (11/11 live CDP)
  - INTG-01..04 Complete; Phase 6 complete; milestone v2.0 execution complete
affects: [live site, milestone completion]
tech-stack:
  added: []
  patterns:
    - legacy hash aliasing via Map lookup ahead of the manifest resolver (deck.ts)
    - init-time DOM-state seed for event-driven pause contracts (scene.ts, timing-safe via idle-scheduled adoption)
key-files:
  created:
    - .planning/phases/06-integration-launch/06-02-fix-verification.md
    - .planning/phases/06-integration-launch/06-02-lighthouse-scores-live.md
    - .planning/phases/06-integration-launch/06-02-SUMMARY.md
  modified:
    - src/lib/nightsky/deck.ts
    - src/lib/nightsky/scene.ts
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/STATE.md
decisions:
  - "Fix-then-launch: both 06-01 fix-forward items fixed BEFORE the deploy per the user's contingent approval, instead of shipping with known edges"
  - "Fix B implemented as a DOM read (html.deck-active + active panel data-panel-id) seeded at first Layer-0 adoption — timing-safe without listener-order proofs, zero deck imports"
  - "Fix B seed gated on html.deck-active so classic-pref boots keep animating (initDeck applies data-state even on its classic branch)"
metrics:
  duration: ~50 min
  completed: 2026-07-18
  tasks: 2
  commits: 4
status: complete
---

# Phase 6 Plan 02: Launch Summary

**One-liner:** v2.0 "Night Sky" is LIVE — two pre-approved one-line fixes (`/#work` → systems
alias; cold `/#fig-01` pause seed), full gate battery re-run green, 68-commit fast-forward push
deployed via Actions run 29637043211, live Lighthouse mobile 98/100/100/100 + desktop 100×4
recorded as INTG-04's authoritative evidence, both fixes re-proven 11/11 against production.

## Checkpoint resolution (Task 1 — blocking human-verify)

06-02 Task 1 (blocking human-verify) was resolved by EXPLICIT USER APPROVAL IN CHAT on
2026-07-18 — the user chose "Fix 2 edges, then launch" from the go/no-go: apply the two
documented fix-forward items, re-run the full gate battery, then push and deploy without
asking again. The approval is CONTINGENT on all gates green: if ANY gate fails after the
fixes, STOP — do NOT push — and report the failure instead.

The contingency was satisfied: every gate passed after the fixes (see battery below), so the
push proceeded under the standing approval with no further prompt. No push existed anywhere
before this approval (T-06-01 honored).

## The two pre-launch fixes

| Fix | Commit | What changed |
|---|---|---|
| A — `/#work` → systems | `185be56` | `HASH_ALIASES` Map (`work` → `systems`) consulted before the manifest lookup in `resolveIndexFromHash` (deck.ts). v1 bookmarks and the case-study "back to work →" crosslink now land on the systems panel instead of falling back to hero. Map (not object) so crafted hashes never walk the prototype (T-04-01 preserved); panel ids untouched; classic/no-JS native anchor (`SystemsList` `id="work"`) untouched; hash preserved as `#work` (no rewrite). |
| B — cold `/#fig-01` pause | `c9c6148` | `seedFig01ActiveFromDom()` (scene.ts): one-shot seed of `fig01Active` from `html.deck-active` + the active panel's `data-panel-id`, run inside `adoptLayer0` before the loop can start. Timing-safe by construction: `adoptLayer0` is only reachable from `generateLayer0`'s idle-scheduled completion, strictly after deck.ts's synchronous init — no listener-attach-order dependency (the alternative event-dispatch-at-deck-init approach was rejected for exactly that proof burden). DOM read only — the zero-deck-imports module boundary holds (re-grepped: 0). The `deck-active` gate keeps classic-pref boots animating exactly as before. |

Verification: scripted CDP audit (scratchpad `verify-fixes.mjs`, 06-01 harness technique,
genuine cold loads via about:blank hop) — **11/11 PASS locally, then 11/11 PASS re-run against
the live origin post-deploy.** Full check list in `06-02-fix-verification.md`.

## Gate battery re-run (post-fix, pre-push) — all green

check 0/0/0 · build exit 0 (4 pages) · zero-hex boundary-aware 0 · rAF 2/2/0/0 (dir totals
2+2) · scene-module cross-boundary imports 0 · contrast `--cdp` worst 8.51:1 @1440×900 /
7.72:1 @1280×800 (0 failing regions ×7 panels) · `--moon` 0.1949<0.7540 / 0.1939<0.4472 ·
local Lighthouse mobile 98/100/100/100, desktop 100/100/100/100. Details:
`06-02-fix-verification.md`.

## The deploy

- **Fast-forward proof:** `git merge-base --is-ancestor origin/main main` exit 0 before the
  push (and again before the docs push). Never `--force`/`--force-with-lease`.
- **Push (THE deploy):** `725f265..793c370` — 68 commits, plain fast-forward, pushed HEAD
  `793c37013e6dc2c2100df922295052fb1dd725f8`.
- **Actions:** run `29637043211` ("Deploy to GitHub Pages") — build `success`, deploy
  `success`, watched to completion with `gh run watch --exit-status` (exit 0).
- **Second push (docs-only):** the closeout docs commit below was pushed as a second plain
  fast-forward push after re-verifying the ancestor check; it contains no site code — the
  built site was already live from `793c370`.

## Live verification (https://p2401kumar.github.io/)

- **View-source sanity:** `id="deck-live"` present; `class="panel"` = 7; `data-panel-id` = 7;
  `#nightsky-canvas` + `.nightsky-host` present; `nightsky:panel-change` sentinel resolves in
  the referenced `/_astro/` NightSky + PanelDeck chunks.
- **Live Lighthouse (INTG-04 authoritative, `06-02-lighthouse-scores-live.md`):**

| Run | Performance | Accessibility | Best Practices | SEO | TBT | LCP | CLS |
|---|---|---|---|---|---|---|---|
| Mobile (default preset) | **98** | 100 | 100 | 100 | 180 ms | 1.3 s | 0.003 |
| Desktop (`--preset=desktop`) | **100** | 100 | 100 | 100 | 10 ms | 0.4 s | 0 |

  Every category ≥ 90 on both presets → **INTG-04 COMPLETE**.
- **Live smoke:** `/` 200 · `/work/dynamodb-cellularization/` 200 (title + `/#work` crosslink) ·
  `/work/elb-auto-weight-away/` 200 · nonexistent path → 404 (custom 404 page) · sitemap = 3
  real routes · headless live cold-loads of `/#work` and `/#fig-01` re-prove both fixes in
  production (11/11).

## Task commits

| # | Commit | Type | What |
|---|---|---|---|
| 1 | `185be56` | fix | `/#work` hash alias → systems panel (deck.ts) |
| 2 | `c9c6148` | fix | cold `/#fig-01` scene pause seed (scene.ts) |
| 3 | `793c370` | test | fix verification (11/11 CDP) + gate battery record |
| 4 | (docs commit) | docs | live Lighthouse evidence + requirements/roadmap/state closeout + this summary |

## Deviations from Plan

**1. [Approved scope addition] Two fix-forward items fixed BEFORE the deploy**
- The plan's Task 2 as written deploys the 06-01 tree as-is; the user's Task-1 approval
  explicitly chose "Fix 2 edges, then launch," making the two fixes + battery re-run part of
  the approved launch sequence. Both fixes verified locally and live; battery fully green
  before the push, satisfying the approval's contingency.

**2. [Rule 1 - Bug, audit tooling only] CDP cold-load harness same-document navigation**
- **Found during:** first local fix-audit run (C2 false FAIL)
- **Issue:** `Page.navigate` between URLs differing only by fragment is a same-document
  navigation — the "cold load" never reloaded, so the classic-pref check tested a stale document.
- **Fix:** about:blank hop inside the harness's `coldLoad()`. Product code untouched; re-run 11/11.
- **Files modified:** scratchpad `verify-fixes.mjs` only (not committed)

Otherwise executed as approved: fast-forward-only pushes, Actions watched green, live evidence
recorded, no reverts, `.planning/config.json` never staged.

## Rollback path (still available, not needed)

`git revert --no-edit <first-v2-commit>..HEAD && git push origin main` (plain FF push
re-triggers deploy.yml and republishes v1 output). Safety nets on origin: tag `v1.0`, branch
`legacy-2021`. Post-launch: the user's real-device touch checklist + 5-min idle-CPU check
(sections 5–6 of `06-01-LAUNCH-READINESS.md`) remain open as at-leisure live checks.

## Known Stubs

None — both fixes are complete wired behavior; no placeholder values or unwired components
were introduced.

## Threat model compliance

- **T-06-01:** push occurred ONLY after the explicit chat approval (recorded verbatim above).
- **T-06-02:** both pushes ancestor-verified plain fast-forwards; no force anywhere; v1.0
  tag + legacy-2021 branch intact.
- **T-06-03:** live view-source + smoke + Lighthouse all green post-deploy; no silent ship.
- **T-06-04:** `.planning/config.json` untouched (orchestrator-owned unstaged edit never staged).
- **T-06-SC:** `npx lighthouse` + `gh` used transiently; no new package.json dependency.
- No new threat surface introduced (the hash alias is an input mapping inside the existing
  bounds-checked resolver; the pause seed is a read-only DOM query).

## Self-Check: PASSED

All 3 claimed artifacts exist on disk (`06-02-fix-verification.md`,
`06-02-lighthouse-scores-live.md`, `06-02-SUMMARY.md`); fix/evidence commits `185be56`,
`c9c6148`, `793c370` present in git log and touching exactly the claimed files; the plan's
automated Task-2 verification block ran end-to-end → TASK 2 PASS; `.planning/config.json`
never staged.
