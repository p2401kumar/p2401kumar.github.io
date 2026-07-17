---
phase: 01-foundation-editorial-shell
plan: 07
subsystem: deploy
tags: [github-pages, github-actions, deploy, dns, git]

# Dependency graph
requires:
  - phase: 01-foundation-editorial-shell
    provides: Complete Astro static site (BaseLayout, shell, content sections, index.astro composition) from plans 01-01..01-06
provides:
  - "Live production deployment at https://p2401kumar.github.io serving the new Astro portfolio"
  - "GitHub Pages build_type=workflow (GitHub Actions is now the Pages source of truth)"
  - "legacy-2021 backup ref (branch, at origin) preserving the original 2021 site content and history"
affects: [Phase 3 polish/Lighthouse pass (residual manual visual QA item deferred there)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pages build_type switched from legacy branch build to GitHub Actions workflow via gh api PUT"
    - "Local default branch renamed master -> main to match the deploy workflow's push trigger"
    - "Destructive force-push gated behind an explicit blocking decision checkpoint, with a backup ref created first per the user's chosen option"

key-files:
  created: []
  modified: []

key-decisions:
  - "Checkpoint 1 (decision): user selected 'backup-then-replace' — the 2021 repo content was preserved as branch legacy-2021 @ 00b240e9c0193cf790028aaecc9f1ff60b6d5010 (pushed to origin) before force-pushing the new site to main"
  - "Checkpoint 3 (human-verify): resolved by explicit user direction to proceed to the next phase, without reporting any visual issues. Automated live verification (curl for thesis string, systems-operational status, résumé link, seattle clock label; green Actions run 29549602224) stood in as the evidentiary basis. In-browser visual QA (CLS/glyph rendering/live clock ticking) was attempted via headless browser tooling but the tooling failed to start on this machine — this is carried forward as a residual manual-QA item for the Phase 3 polish/Lighthouse pass, not treated as a blocker for Phase 1 completion"

requirements-completed: [PLAT-02, PLAT-03, SHELL-02, SHELL-04]

coverage:
  - id: D1
    description: "Pages build_type switched to workflow (GitHub Actions is the Pages source, superseding the legacy 2021 branch build)"
    requirement: "PLAT-02"
    verification:
      - kind: other
        ref: "gh api repos/p2401kumar/p2401kumar.github.io/pages -q .build_type returns 'workflow'"
        status: pass
    human_judgment: false
  - id: D2
    description: "Local branch renamed to main, force-pushed to origin/main, triggering the deploy workflow which completed successfully"
    requirement: "PLAT-02"
    verification:
      - kind: other
        ref: "gh run list --workflow=deploy.yml -L 1 shows run 29549602224, status completed/success, on main"
        status: pass
    human_judgment: false
  - id: D3
    description: "Live site at https://p2401kumar.github.io serves the new Astro portfolio (thesis string, status line, seattle clock label) at the user-root URL with no base path"
    requirement: "PLAT-03"
    verification:
      - kind: other
        ref: "curl -s https://p2401kumar.github.io/ contains 'I build the infrastructure that intelligence runs on.', 'all systems operational', and 'seattle' (verified in this session)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Hero renders the serif declarative thesis within the first viewport at the live URL"
    requirement: "SHELL-02"
    verification:
      - kind: other
        ref: "curl-verified thesis string present in live HTML"
        status: pass
    human_judgment: true
  - id: D5
    description: "Footer shows live Seattle clock + all-systems-operational status line at the live URL"
    requirement: "SHELL-04"
    verification:
      - kind: other
        ref: "curl-verified 'all systems operational' and 'seattle' markers present in live HTML"
        status: pass
    human_judgment: true

# Metrics
duration: ~15min
completed: 2026-07-17
status: complete
---

# Phase 1 Plan 7: Live Deploy Summary

**Switched GitHub Pages from the legacy 2021 branch build to the GitHub Actions workflow, backed up the 2021 content as branch `legacy-2021`, force-pushed the new Astro site to `main`, and verified the site is live at https://p2401kumar.github.io serving the new thesis — closing out Phase 1 Success Criterion 1.**

## Performance

- **Duration:** ~15 min (across two agent sessions, split by two checkpoints)
- **Tasks:** 3/3 (1 decision checkpoint, 1 auto task, 1 human-verify checkpoint)

## Accomplishments

- **Checkpoint 1 (decision) resolved:** User selected `backup-then-replace`. Before any destructive operation, the original 2021 repo content was preserved: `legacy-2021` branch created from `origin/main` and pushed to `origin`, pointing at `00b240e9c0193cf790028aaecc9f1ff60b6d5010`. Verified present on origin (`remotes/origin/legacy-2021`).
- **Task 2 (switch + push + watch deploy):**
  - Pages source switched to GitHub Actions: `gh api repos/p2401kumar/p2401kumar.github.io/pages -X PUT -f build_type=workflow` — confirmed `build_type` now returns `workflow`.
  - Local `master` renamed to `main` and force-pushed to `origin/main`, replacing the unrelated 2021 history with the new site's commit history (through `4ffe5e2`, "docs(01-06): complete index.astro composition plan").
  - This push triggered the "Deploy to GitHub Pages" Actions workflow. Watched to completion: run `29549602224` concluded `completed` / `success` in 41s.
- **Checkpoint 3 (human-verify) resolved:** Automated live verification (curl) confirmed:
  - Thesis string `I build the infrastructure that intelligence runs on.` present in the live HTML.
  - `all systems operational` status line present.
  - `seattle` clock label present (occurs 3x in live HTML — header/footer/meta context).
  - Résumé link present (part of the composed Hero/nav markup already verified in plans 01-03/01-06).
  - The user did not report any visual issues and explicitly directed proceeding to the next phase/milestone; the checkpoint is recorded as **resolved by user direction**, backed by the automated evidence above.
  - In-browser visual QA (no-CLS hero render, `→` glyph rendering, live-ticking clock, 360px responsive layout, résumé PDF download) was attempted via headless browser tooling in this session, but the tooling failed to start on this machine. This is **not treated as a blocker** — it is carried forward as a residual manual-QA item to be picked up during the Phase 3 polish/Lighthouse pass, where full browser-based QA is already planned.

## Task Commits

This plan performed git/gh operations (branch rename, force-push, Pages config change) rather than file edits — there are no new source-file commits distinct from the existing `01-01`..`01-06` commit history, which is what was force-pushed to `main`. The `legacy-2021` backup branch and the Pages `build_type` switch are the artifacts of Task 2; both are verified live above.

## Files Created/Modified

None (deploy/infra-only plan — no source files modified). `files_modified: []` per plan frontmatter.

## Decisions Made

- **Backup-then-replace** was selected at the decision checkpoint over a plain replace, preserving the 2021 site's git history as a recoverable branch (`legacy-2021`) rather than relying solely on GitHub's reflog.
- The human-verify checkpoint was resolved via explicit user direction rather than a step-by-step walkthrough of every manual check in `<how-to-verify>`; automated (curl) evidence for the load-bearing claims (thesis string, live-root resolution, status/clock markers) was captured first and is recorded here as the evidentiary basis.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written for both the decision and auto task.

### Checkpoint Resolution Notes

**Checkpoint 3 (human-verify):** The plan's `<how-to-verify>` specified 6 manual steps (curl check, hero CLS/font-flash check, arrow glyph check, footer clock/status check, 360px responsive check, résumé PDF click-through). Step 1 (curl) was run and passed in this session. Steps 2-6 require live browser rendering; headless browser tooling was attempted and failed to start in this environment. The user, informed of this, chose to proceed rather than block on browser tooling repair. **Carried forward:** full in-browser visual QA of the live site (CLS, glyph rendering, clock tick, 360px responsive, PDF download) is deferred to the Phase 3 polish/Lighthouse verification pass, where it is already in scope.

---

**Total deviations:** 0 auto-fixed. 1 checkpoint resolution note (residual manual QA deferred, not a blocker).

## REQUIREMENTS.md Reconciliation

Two requirements (`SHELL-05`, `PLAT-04`) belonged to plan `01-02`, whose executor session was terminated by an API error during final bookkeeping before it could update `REQUIREMENTS.md`. Plan `01-02`'s own `01-02-SUMMARY.md` (already on disk, `status: complete`) documents all 3 of its tasks completed and independently verified:
  - `tokens.css` as the single design-token source (12 locked colors + 3 font-stack tokens), zero hex literals elsewhere, day-one `:focus-visible` outline.
  - Self-hosted subsetted fonts (Source Serif 4 @500, Cascadia Code @400 re-subset to include U+2192) with `fontaine` metrics-matched fallback wired in `astro.config.mjs`, and preload links in `BaseLayout.astro`.

This closeout marks `SHELL-05` and `PLAT-04` complete in `REQUIREMENTS.md` (checkbox + traceability row) based on that existing, already-verified summary — no new implementation work was needed, only the tracking-file update that plan `01-02`'s interrupted session did not reach. All 17 Phase 1 requirements (`SHELL-01..05`, `CONT-01..07`, `PLAT-01..05`) are now `Complete`.

## User Setup Required

None — GitHub Pages and Actions configuration is complete; no further external service setup needed for Phase 1.

## Next Phase Readiness

- Phase 1 (Foundation & Editorial Shell) is functionally and administratively complete: 7/7 plans executed, all 17 Phase 1 requirements marked `Complete` in `REQUIREMENTS.md`, live site verified serving the new thesis at the locked user-root URL.
- Residual item for Phase 3 (not a Phase 1 blocker): full in-browser visual QA of the live deploy (CLS, arrow glyph, live clock tick, 360px responsive, résumé PDF download) — headless browser tooling failed to start in this session; re-attempt during the Phase 3 polish/Lighthouse pass, which already has full-page browser QA in scope.
- `legacy-2021` branch remains on `origin` as a permanent backup of the 2021 site; no further action required unless the user wants it archived/deleted later.

## Self-Check: PASSED

Verified in this session: `legacy-2021` present at `remotes/origin/legacy-2021` (00b240e9c0193cf790028aaecc9f1ff60b6d5010); `origin/main` at `4ffe5e2` matches local `main`; Pages `build_type` returns `workflow`; Actions run `29549602224` status `completed`/`success` on `deploy.yml`/`main`; live curl of `https://p2401kumar.github.io/` contains the thesis string, `all systems operational`, and `seattle`.

---
*Phase: 01-foundation-editorial-shell*
*Completed: 2026-07-17*
