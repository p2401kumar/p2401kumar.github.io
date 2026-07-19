---
phase: 10-integration-launch
plan: 02
subsystem: launch-deploy
tags: [launch, deploy, github-actions, lighthouse-live, smoke, human-gate, rollback]
requires:
  - phase: 10-integration-launch (10-01)
    provides: launch-readiness pack (20/21 gates green locally; LIVE Lighthouse the sole deferral) + the go/no-go decision surface
  - phase: 06-integration-launch (v2.0)
    provides: the proven gated-launch flow (blocking human gate → FF push → Actions watch → live verify → live LH evidence format)
provides:
  - v3.0 "Real Sky" LIVE at https://p2401kumar.github.io/ (Actions run 29708118111, pushed HEAD 0dbe46f)
  - FLR-01 authoritative LIVE Lighthouse evidence — 100×8 (mobile 100/100/100/100, desktop 100/100/100/100)
  - live smoke 13/13 (view-source, scene alive, cold /#fig-01 frozen, /#work alias, scene-free case studies, 404, credit links, OG byte-identical)
  - FLR-01..03 + LNC-01 Complete; ROADMAP Phase 10 + v3.0 milestone closed
affects: [post-launch real-device checklist, v3.0 milestone archive]
tech-stack:
  added: []
  patterns:
    - live-origin CDP smoke with about:blank interposition (10-01 coldNav technique pointed at production)
    - byte-identity proof live-vs-dist (cmp of curl'd HTML against the locally verified build) as the strongest live floor
key-files:
  created:
    - .planning/phases/10-integration-launch/10-02-lighthouse-scores-live.md
    - .planning/phases/10-integration-launch/10-02-SUMMARY.md
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/STATE.md
decisions:
  - "Launch approved by the user's explicit 'Launch now' in chat (2026-07-19) after reviewing 10-01-LAUNCH-READINESS.md — the blocking gate was human-resolved, never auto-advanced"
  - "Live smoke harness FAILs on the active-panel probe traced to a stale .is-active selector; corrected to the product's real data-state=\"active\" marker (deck.ts:118) — instrument-only, same class as 10-01's recorded harness deviations"
  - "Second FF push (docs-only) carries the launch evidence + closeout to origin, keeping remote planning history current"
metrics:
  duration: ~25 min
  completed: 2026-07-19
  tasks: 2
  commits: 2
status: complete
---

# Phase 10 Plan 02: Gated Launch — v3.0 "Real Sky" Deploy + Live Verification Summary

**One-liner:** v3.0 Real Sky is LIVE — user-gated FF push of 67 commits (`15e6742..0dbe46f`,
never --force), Actions build+deploy green in 33s, live pages byte-identical to the
10-01-verified dist, live smoke 13/13, and a perfect **100×8 LIVE Lighthouse** (mobile beats
the local 99 pre-flight) recorded as FLR-01's authoritative evidence; FLR-01..03 + LNC-01
Complete, Phase 10 and the v3.0 milestone closed.

## Checkpoint-Resolution Record (Task 1 — verbatim, the audit trail)

> 10-02 Task 1 (blocking human-verify) was resolved by EXPLICIT USER APPROVAL IN CHAT on
> 2026-07-19 — the user chose "Launch now" from the go/no-go after reviewing
> 10-01-LAUNCH-READINESS.md (20/21 gates green; no user-facing defects on the fix-forward
> list). Proceed directly to Task 2.

The gate was human-resolved, not auto-advanced: no `git push` existed anywhere before this
approval (10-01's verify asserted origin/main strictly behind local main), and the only two
pushes in the phase both live in Task 2, after the affirmative. LNC-01's "explicit user go"
clause is satisfied by the user's own message.

## The deploy (Task 2, steps 1–3)

| Step | Result |
|---|---|
| FF safety gate | `git merge-base --is-ancestor origin/main main` exit 0 — origin/main `15e6742` an ancestor of local `0dbe46f`, 67 commits ahead |
| Push | `git push origin main` — plain fast-forward `15e6742..0dbe46f`; NO --force anywhere |
| Actions | Run **29708118111** ("Deploy to GitHub Pages"), headSha matched pushed HEAD; `gh run watch --exit-status` exit 0 — **build ✓ 25s + deploy ✓ 8s, both `success`** |

## Live verification (Task 2, step 4)

**View-source (curl, live origin):** `body class="has-sky"` · `id="deck-live"` ·
`class="panel"` ×7 · `data-panel-id` ×7 · sky `<picture>` + `/sky/milky-way-1920.avif`
preload with `imagesrcset` · `.nightsky-host` + `#nightsky-canvas` · deck sentinel
`nightsky:panel-change` resolves in the referenced NightSky `/_astro/*.js` chunk · credit
line verbatim `Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0`. v3 was live on the
FIRST poll after the Actions run — no CDN lag observed.

**Byte-identity floor (strongest live proof):** live `/`, `/work/dynamodb-cellularization/`,
and `/work/elb-auto-weight-away/` HTML are each **byte-identical (`cmp`) to the local
`dist/` build** that passed 10-01's full 21-gate battery.

**Live CDP smoke (headless Chrome against production, about:blank coldNav): 13/13 PASS**

| Check | Result |
|---|---|
| `/` scene ALIVE at hero (nightsky canvas hash differs across ~1.6s pair) | PASS |
| `/` glass rendering (`backdrop-filter: blur(12px) saturate(1.5) brightness(0.9)`) | PASS |
| `/` has-sky + deck-active + 7 panels + canvas 1424×805 | PASS |
| cold `/#fig-01`: fig-01 panel `data-state="active"`, figure canvas 878×380 (= 10-01 exact) | PASS |
| cold `/#fig-01`: ambient FROZEN (canvas hash identical ×2: `165590:1409298720`) — 06-02 Fix B pause seed live | PASS |
| cold `/#work`: alias → systems active, hash preserved `#work`, 6 panels inert | PASS |
| `/work/*` ×2: scene-free in-browser (no nightsky canvas, no has-sky body) | PASS |
| `/this-path-does-not-exist`: 404, custom page renders | PASS |
| Credit links: noirlab.edu image page 200, creativecommons.org/licenses/by/4.0/ 200 | PASS |
| Live OG `/og/og-default.png`: 309,377 B, sha256 `c4f5a921…` byte-identical to the 10-01 capture | PASS |

## LIVE Lighthouse (FLR-01 authoritative — `10-02-lighthouse-scores-live.md`)

| Run | Perf | A11y | BP | SEO | TBT | LCP | CLS |
|---|---|---|---|---|---|---|---|
| Mobile (default preset) | **100** | 100 | 100 | 100 | 0 ms | 1.5 s | 0.003 |
| Desktop (`--preset=desktop`) | **100** | 100 | 100 | 100 | 0 ms | 0.4 s | 0 |

Every category ≥90 on both presets → **FLR-01 COMPLETE** with a perfect 100×8. Live mobile
EXCEEDS the local pre-flight (99→100; LCP 1.9s→1.5s over the CDN), and v3's real-photo
composite ships with less blocking time than v2's live launch (06-02 mobile: 98, TBT 180ms).

## Task commits

| Task | Name | Commit | Type |
|---|---|---|---|
| 1 | Blocking human go/no-go | — (chat resolution, recorded above) | checkpoint |
| 2 | Live evidence (LH 100×8 + smoke 13/13) | `e481e63` | test |
| 2 | Closeout docs (REQUIREMENTS/ROADMAP/STATE/SUMMARY) | final docs commit | docs |

Plus the deploy push itself (`15e6742..0dbe46f`, 67 pre-existing commits — no new code
authored in this plan) and the docs-only second FF push carrying the evidence + closeout.

## Deviations from Plan

**1. [Instrument-only] Live smoke active-panel selector**
- **Found during:** Task 2 first smoke run (2 FAILs: `activeId: null` on both hash routes)
- **Issue:** the fresh scratchpad harness probed `.panel.is-active`; the product marks the
  active panel via `data-state="active"` (deck.ts:118). The substantive checks in the same
  run already passed (fig canvas 878×380 painted, ambient frozen hash-identical).
- **Fix:** corrected selector, re-ran both probes — PASS. Product untouched; same class of
  harness fix as 10-01's four recorded instrument deviations.

**2. `state.advance-plan` gsd-tools handler** cannot parse this project's custom STATE.md
layout (pre-existing; prior plans updated position via scoped edits) — position/status
updated via scoped `Edit` instead; `state.update-progress` / `record-metric` /
`add-decision` / `record-session` all ran normally.

No product deviations: zero source files changed in this plan; the deployed bytes are
exactly the 10-01-verified build.

## Rollback path (left available, NOT executed)

Tags `v1.0` and `v2.0` on origin mark both prior generations. If v3.0 must come down:
`git revert --no-commit 3fbbcd2..0dbe46f && git commit && git push origin main` (plain FF
push — never --force); the push re-triggers deploy.yml and republishes v2.0 in ~1 Actions
run (~2 min). No server/database/DNS to unwind.

## Threat model compliance

- **T-10-01 (critical):** the push happened ONLY after the user's explicit "Launch now" in
  chat — recorded verbatim above; no auto-resolution.
- **T-10-02:** `merge-base --is-ancestor` verified before BOTH pushes; plain FF only; tags
  v1.0/v2.0 intact on origin.
- **T-10-03:** Actions green watched to completion; live smoke + byte-identity + LH 100×8 —
  no shortfall, so the no-auto-revert branch was never needed.
- **T-10-04/SC:** `package.json` / `package-lock.json` / `.planning/config.json`
  byte-identical (git diff empty); `npx lighthouse` + CDP driver transient, zero installs.

## Known Stubs

None — no product code created or modified; launch + evidence + closeout only.

## Post-launch (user, at leisure)

- Real-device touch checklist (10-01-LAUNCH-READINESS.md §6): carried v2 items + 5 v3
  additions (cellular photo load, iOS Safari glass, parallax feel, scroll jank, 5-min
  idle warmth). Rollback stays one revert away.
- Carried deferred items: retire/redirect the old `/home` repo; fix-forward list §7
  (aurora lateral-softening lever, shed-ladder instrument) — none user-facing.

## Self-Check: PASSED

- `10-02-lighthouse-scores-live.md` + `10-02-SUMMARY.md` exist on disk; REQUIREMENTS /
  ROADMAP / STATE updated.
- Commit `e481e63` in git log; deploy push `15e6742..0dbe46f` on origin (run 29708118111
  success).
- Live origin serving v3 (byte-identical to verified dist); LH 100×8 recorded.
- `package.json` / `package-lock.json` / `.planning/config.json` untouched.
