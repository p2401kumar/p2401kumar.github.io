---
phase: 03-case-studies-launch-polish
plan: 04
subsystem: infra
tags: [deploy, github-pages, lighthouse, seo, accessibility, qa, browse]

requires:
  - phase: 03-case-studies-launch-polish (plan 03)
    provides: "SEO/OG/sitemap wired into every page, so the live-URL Lighthouse audit and route checks have real meta/sitemap/OG artifacts to verify"
provides:
  - "Live production deploy of the complete v1 site at https://p2401kumar.github.io (both case-study routes, sitemap, robots.txt, OG image all serving 200)"
  - ".planning/phases/03-case-studies-launch-polish/03-LIGHTHOUSE.md — recorded Lighthouse >=90 scores for home + a case-study page on the LIVE URL (PLAT-07)"
  - "Residual visual QA (hero CLS/FOUT, arrow glyph, footer clock, 360px collapse, Fig.01 interactions, case-study structure) closed via gstack /browse automation with concrete evidence — no human-verify halt needed"
affects: []

tech-stack:
  added: []
  patterns:
    - "For gstack /browse automation on this machine, long-running or multi-second waits (e.g. an 8s self-heal check) must be expressed as an in-page `js \"new Promise(r => setTimeout(...))\"` inside a single `chain` invocation, not as separate CLI calls with an external `sleep` in between — the browse daemon restarts (losing page state) if the gap between CLI invocations exceeds a few seconds"

key-files:
  created:
    - .planning/phases/03-case-studies-launch-polish/03-LIGHTHOUSE.md
    - .planning/phases/03-case-studies-launch-polish/lighthouse-home.json
    - .planning/phases/03-case-studies-launch-polish/lighthouse-casestudy.json
  modified: []

key-decisions:
  - "Task 1 (deploy + live-route verification) produced no commit — it is a verification-only task per the plan's own <files> declaration (no source changes were needed; all live checks passed on the first push)"
  - "Committed the raw Lighthouse JSON reports (lighthouse-home.json, lighthouse-casestudy.json) alongside 03-LIGHTHOUSE.md, beyond the plan's literal files_modified list of just the .md, for audit-trail traceability of the PLAT-07 gate"
  - "Task 3's residual visual QA was resolved via gstack /browse automation (which started successfully this session, unlike the known Phase 1-2 failure) — driving the full checklist with concrete DOM/screenshot evidence, per the plan's explicit instruction that this makes the checkpoint a confirm-only sign-off rather than a human-verify halt"

patterns-established: []

requirements-completed: [PLAT-07]

coverage:
  - id: D1
    description: "The two new case-study routes are live on GitHub Pages, return 200, and each contains its thesis/standfirst plus the site header and footer with 'all systems operational'; sitemap/robots/OG also live"
    requirement: "PLAT-07"
    verification:
      - kind: other
        ref: "curl -sf against https://p2401kumar.github.io/work/dynamodb-cellularization/, /work/elb-auto-weight-away/, /sitemap-index.xml, /robots.txt, /og/og-default.png — all 200; grep confirmed <header>, <footer>, 'all systems operational', H1 artifact name, and standfirst text on both case-study pages"
        status: pass
    human_judgment: false
  - id: D2
    description: "The home page and a case-study page score Lighthouse >= 90 in Performance, Accessibility, Best Practices, and SEO on the LIVE deployed URL"
    requirement: "PLAT-07"
    verification:
      - kind: other
        ref: "npx lighthouse v13.4.0 headless Chrome against https://p2401kumar.github.io/ and https://p2401kumar.github.io/work/dynamodb-cellularization/, scores recorded in 03-LIGHTHOUSE.md (home: 99/94/100/100; case study: 100/90/100/100) — all four categories >=90 on first run, no fix-forward needed"
        status: pass
    human_judgment: false
  - id: D3
    description: "Residual visual QA deferred from Phases 1-2 (hero CLS/font-flash, arrow glyph, footer clock ticking, 360px collapse, Fig.01 send/fault/heal/keyboard, case-study page structure) confirmed against the live site"
    requirement: "PLAT-07"
    verification:
      - kind: automated_ui
        ref: "gstack /browse session against the live URL: zero console errors + Lighthouse Performance 99/100 (CLS-inclusive) for hero CLS/FOUT; screenshot + accessible-name confirmation of the literal U+2192 arrow character for the glyph check; live Pacific-time render + setInterval(tick,30000) source verification for the footer clock; documentElement.scrollWidth===clientWidth at 360px viewport on home + both case-study pages for the collapse check; mid-animation screenshots of the beam (send request), dashed/amber cell-1 fault styling + log entry (inject fault), and healed cell-3 8.5s later (self-heal) for Fig.01; Tab-order snapshot through all 12 controls (send, fault, 10 node-proxy buttons) with a visible 2px copper (rgb(217,145,99)) focus outline and no trap, exiting cleanly into page content; full DOM/link assertions on both case-study pages for H1/standfirst/metrics-with-title-tooltip/problem/approach/trade-offs/impact/back-cross-links/header/footer"
        status: pass
    human_judgment: false

duration: 21min
completed: 2026-07-17
status: complete
---

# Phase 3 Plan 4: Deploy, Lighthouse Gate, and Residual Visual QA Summary

**Fast-forward deploy to production, live-URL Lighthouse audit (99/94/100/100 home, 100/90/100/100 case study — no fix-forward needed), and full residual visual QA closed via gstack /browse automation with concrete screenshot/DOM evidence — the final gate of v1 (PLAT-07)**

## Performance

- **Duration:** 21 min
- **Started:** 2026-07-17T08:16:12Z (push trigger)
- **Completed:** 2026-07-17T08:36:10Z
- **Tasks:** 3 completed (1 verification-only with no commit, 1 committed, 1 automated checkpoint resolved without a human halt)
- **Files modified:** 3 (all created — no source code changes)

## Accomplishments
- Fast-forward pushed `44d967b..4f4eb74` to `origin main` (no force); watched `deploy.yml` run `29565842811` to `completed/success` via `gh run watch` before running any live check
- Verified the full live every-page contract: both `/work/dynamodb-cellularization/` and `/work/elb-auto-weight-away/` return 200 with `<header`, `<footer`, `all systems operational`, their own H1 mono artifact name, and their standfirst text; `/sitemap-index.xml`, `/robots.txt`, and `/og/og-default.png` all return 200
- Ran `npx lighthouse` v13.4.0 (headless Chrome, auto-detected at the default Windows path, no `CHROME_PATH` override needed) against the live home page and the `dynamodb-cellularization` case-study page — all four categories passed >= 90 on the first run (home: Performance 99, Accessibility 94, Best Practices 100, SEO 100; case study: Performance 100, Accessibility 90, Best Practices 100, SEO 100), so no fix-forward cycle was needed; scores recorded in `03-LIGHTHOUSE.md` with raw JSON committed for traceability
- Closed all six items of the Phase 1-2 deferred residual visual QA checklist via gstack `/browse` automation (which started successfully this session): hero CLS/FOUT (zero console errors, Lighthouse Performance 99/100, preload tag present on the above-fold serif face), arrow-glyph rendering (screenshot + accessible-name confirmation of the actual `→` U+2192 character on hero and case-study links), footer clock (live correct Pacific time rendered, `setInterval(tick, 30000)` verified in source), 360px collapse (no horizontal scroll on home or either case-study page, clean visual stacking), Fig.01 interactions (mid-animation beam screenshot on send request, dashed/amber cell-1 styling + log entry on inject fault, healed cell-3 confirmed 8.5s later, full keyboard Tab order across all 12 controls with a visible copper focus ring and no trap), and case-study page structure (H1/standfirst/metrics-with-tooltip/problem/approach/trade-offs/impact/cross-links/header/footer confirmed on both pages)

## Task Commits

Each task was committed atomically (Task 1 required no commit — verification-only):

1. **Task 1: Fast-forward deploy + live-URL route verification** - no commit (no source changes; all live checks passed as-is)
2. **Task 2: Lighthouse >=90 audit on the live URL, recorded, with fix-forward (PLAT-07)** - `d520196` (docs)
3. **Task 3: Residual visual QA on the live site** - resolved via automation, no code changes to commit (verification-only, evidence recorded in this SUMMARY)

**Plan metadata:** (recorded after this summary is written)

## Files Created/Modified
- `.planning/phases/03-case-studies-launch-polish/03-LIGHTHOUSE.md` - Recorded Lighthouse audit method, URLs, timestamps, and all four category scores for home + case-study page; documents the Windows `chrome-launcher` temp-cleanup `EBUSY` crash (post-report-write, non-fatal) as a note
- `.planning/phases/03-case-studies-launch-polish/lighthouse-home.json` - Raw Lighthouse JSON report for the live home page (committed for audit-trail traceability)
- `.planning/phases/03-case-studies-launch-polish/lighthouse-casestudy.json` - Raw Lighthouse JSON report for the live `dynamodb-cellularization` case-study page

## Decisions Made
- No fix-forward was needed: all four Lighthouse categories passed >= 90 on the first audit run for both audited pages, so the plan's fix-forward budget (meta description, contrast on `--dim`/`--faint` text, image sizing) was not exercised
- Committed the raw Lighthouse JSON reports beyond the plan's literal `files_modified` (just `03-LIGHTHOUSE.md`) as supporting audit evidence for the PLAT-07 gate, rather than leaving generated files untracked or discarding them
- Residual visual QA (Task 3, a `checkpoint:human-verify` in the plan) was resolved without stopping for human input: gstack `/browse` started successfully this session (`status` returned healthy), so per the plan's explicit automation-first instruction, driving the checklist with recorded evidence makes this a confirm-only sign-off rather than a mid-flight halt

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking, tooling-only] `npx lighthouse` crashed with `EBUSY` during its own post-report temp-profile cleanup on Windows**
- **Found during:** Task 2, first `npx lighthouse` run against the live home page
- **Issue:** `chrome-launcher`'s cleanup of its temp Chrome profile directory (`C:\Users\...\Temp\lighthouse.XXXXXXXX\...`) hit a Windows file-lock race (`EBUSY: resource busy or locked, unlink ...Account Web Data`), crashing the Node process with a non-zero exit after the report had already been fully written to disk.
- **Fix:** Verified the JSON output file existed and was valid (`JSON.parse` succeeded, all four `categories` present) despite the crash — the audit itself completed successfully; the crash was purely in post-audit cleanup. No retry needed since the data was already captured. The second `npx lighthouse` run (case-study page) completed without the cleanup error.
- **Files modified:** none (tooling behavior only, not a code or config issue)
- **Verification:** `node -e "JSON.parse(fs.readFileSync(...))"` successfully parsed both reports and printed all four category scores
- **Committed in:** `d520196` (Task 2 commit) — documented in `03-LIGHTHOUSE.md`'s Notes section

**2. [Rule 3 - Blocking, tooling-only] gstack /browse daemon restarted mid-session on any gap >~5s between CLI invocations**
- **Found during:** Task 3, footer-clock and Fig.01 self-heal checks
- **Issue:** The browse daemon (PID changed across several calls: 26908 → 11504 → 29880 → ...) silently restarted and reset the page to `about:blank` whenever the gap between separate CLI invocations exceeded roughly 5 seconds (e.g. a `sleep 35` between two `$B js` calls, or a standalone `$B js` evaluate with a >5s in-page wait), losing all page/session state.
- **Fix:** Restructured multi-step waits (the 8.5s Fig.01 self-heal wait, the 360px + screenshot combo) as a single `$B chain <json>` invocation with an in-page `js "new Promise(r => setTimeout(..., 8500))"` step, so the wait happens inside one daemon call rather than spanning a gap between separate CLI invocations. This successfully captured the self-heal transition (fault injected → 8.5s wait → recovered) in one atomic call.
- **Files modified:** none (browse-tool usage pattern only; logged to `patterns-established`/tech-stack `patterns` in this SUMMARY's frontmatter for future sessions)
- **Verification:** The self-heal `chain` call returned both the "fault injected" and "recovered · weight restored" log lines and a healed-state screenshot in one successful invocation
- **Committed in:** n/a (no code change; verification-tooling technique only)

---

**Total deviations:** 2 auto-fixed (both Rule 3 blocking issues in verification tooling, not in shipped site code — no impact on the deployed artifact)
**Impact on plan:** None on the shipped outcome. Both deviations were entirely in the audit/QA tooling layer (Lighthouse's Windows cleanup crash, the browse daemon's idle-restart behavior) and were worked around without touching any site source code. The site itself required zero fixes — deploy, Lighthouse, and visual QA all passed cleanly on first attempt.

## Issues Encountered
None beyond the two tooling deviations documented above, both of which had clean workarounds that did not require touching site code.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- **v1 milestone is fully shipped and verified live**: all case-study content, SEO/OG/sitemap, and the Lighthouse >=90 gate (PLAT-07) are complete and confirmed on the production URL. No further v1 plans remain.
- **Post-launch reminder (from `.planning/STATE.md` Blockers/Concerns, already logged there since Phase 1's deploy decision):** the old `p2401kumar.github.io/home` repo should be retired or redirected now that the new site is live at `https://p2401kumar.github.io`. This is a milestone-wrap task, not built by this plan — surfacing it here per the plan's explicit instruction so it isn't lost when v1 closes.
- No blockers for a v2 milestone (deferred ideas already logged in `03-RESEARCH.md`: third case study `azure/health-snapshots` (CASE-04), JSON-LD Person structured data (PLAT-08), notes/blog/`/craft` experiments).

---
*Phase: 03-case-studies-launch-polish*
*Completed: 2026-07-17*

## Self-Check: PASSED

All created files verified present on disk (`03-LIGHTHOUSE.md`, `lighthouse-home.json`, `lighthouse-casestudy.json`, this `03-04-SUMMARY.md`). Task 2's commit hash (`d520196`) verified present in `git log`. Task 1 and Task 3 produced no commits (verification-only, as documented above).
