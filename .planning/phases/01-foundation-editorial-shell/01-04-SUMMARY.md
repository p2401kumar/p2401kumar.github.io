---
phase: 01-foundation-editorial-shell
plan: 04
subsystem: ui
tags: [astro, components, editorial-shell, header, hero, footer]

# Dependency graph
requires:
  - phase: 01-foundation-editorial-shell
    provides: "tokens.css/global.css/fonts.css + BaseLayout.astro (plan 01-02); typed profile data module (plan 01-03)"
provides:
  - "src/components/SiteHeader.astro: mono identity (name · seattle) + nav (work/résumé/contact)"
  - "src/components/Hero.astro: eyebrow, serif thesis h1, bio, 3 quiet links (résumé/linkedin/github)"
  - "src/components/SiteFooter.astro: status line + live Seattle clock (tick() inline script, ≤30s)"
affects: [01-05-PLAN (remaining section components follow same profile-sourcing + var(--token) pattern), 01-06-PLAN (index.astro composes BaseLayout + SiteHeader + Hero + sections + SiteFooter)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Components source all locked copy/links from src/data/*.ts via imported objects (e.g. {profile.name}), never hardcoding strings that duplicate data-module content — structural/navigational text (nav labels, in-page anchor hrefs like #work/#contact) may be hardcoded since it does not exist in any data module"
    - "Scoped <style> blocks read exclusively via var(--token) — zero hex literals in any component"
    - "Live elements use plain inline <script> module tags (no client:* directives, no hydration framework) — SiteFooter's clock is the first instance of this pattern"

key-files:
  created:
    - src/components/SiteHeader.astro
    - src/components/Hero.astro
    - src/components/SiteFooter.astro
  modified: []

key-decisions:
  - "SiteHeader's résumé nav link intentionally omits the `download` attribute (only Hero's résumé link has `download`, per the plan's task-1 action text, which does not mention it for the header nav) — the header nav résumé link opens/navigates like a normal anchor, while the hero's is the explicit download CTA"
  - "SiteFooter's inline clock script has no `is:inline` or client directive; Astro bundles a plain <script> tag as a standard ES module by default, matching 01-RESEARCH.md Pattern 2 (no hydration framework needed for a setInterval-driven DOM update)"

requirements-completed: [SHELL-01, SHELL-02, SHELL-03, SHELL-04, CONT-05, CONT-06]

coverage:
  - id: D1
    description: "SiteHeader.astro renders the mono identity (profile.name bold + profile.location) and a 3-link nav (work → #work, résumé → profile.links.resume.href, contact → #contact), lowercase, mono, var(--token)-only styles, no outline:none"
    requirement: "SHELL-01"
    verification:
      - kind: other
        ref: "grep -c '#contact' src/components/SiteHeader.astro (1); grep for hex literals/outline:none in style block (0 matches); npx astro check (0 errors/0 warnings/0 hints)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Hero.astro renders the eyebrow (accent on 'applied ai'), the exact serif thesis h1 (clamp(30px,4.6vw,44px), 21ch max-width), the verbatim bio, and 3 mono links (résumé → with download, linkedin →/github → with target=_blank rel=noopener noreferrer)"
    requirement: "SHELL-02, SHELL-03, CONT-05"
    verification:
      - kind: other
        ref: "grep -c 'noopener noreferrer' src/components/Hero.astro (3); grep for hex literals in style block (0 matches); npx astro check (0 errors/0 warnings/0 hints)"
        status: pass
    human_judgment: false
  - id: D3
    description: "SiteFooter.astro renders a --good status dot + 'all systems operational' and a #clock span; inline script computes Seattle time via Intl.DateTimeFormat (America/Los_Angeles, 24h), guards a missing #clock element, calls tick() once, and re-ticks via setInterval(tick, 30000)"
    requirement: "SHELL-04"
    verification:
      - kind: other
        ref: "grep -c 'America/Los_Angeles' (1) and grep -c setInterval (1) in src/components/SiteFooter.astro; npx astro check (0 errors/0 warnings/0 hints); npm run build exits 0"
        status: pass
    human_judgment: false

# Metrics
duration: ~12min
completed: 2026-07-16
status: complete
---

# Phase 1 Plan 4: SiteHeader, Hero, SiteFooter Components Summary

**Three editorial-shell `.astro` components (mono header, serif hero, footer with a live `Intl.DateTimeFormat`-driven Seattle clock) porting the approved prototype's markup/spacing/type exactly, with all copy/links sourced from `src/data/profile.ts`.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-16 (session continuation from plan 01-03)
- **Completed:** 2026-07-16
- **Tasks:** 3/3
- **Files modified:** 3 (all new: SiteHeader.astro, Hero.astro, SiteFooter.astro)

## Accomplishments

- `src/components/SiteHeader.astro` reproduces the prototype's flex-row header exactly (`justify-content:space-between; align-items:baseline; padding:30px 0 0`), a mono `.id` block (`<b>{profile.name}</b> · {profile.location}`, name weight 600 `--ink`, rest `--dim`, 12.5px, `.04em` tracking), and a 22px-gap nav (`work` → `#work`, `résumé` → `profile.links.resume.href`, `contact` → `#contact`), all lowercase mono, `--dim` hovering `--ink`, no border override on `outline` (keyboard focus inherits the global `:focus-visible` ring)
- `src/components/Hero.astro` reproduces the prototype's `.hero` section exactly (`padding:88px 0 30px`): eyebrow (`profile.eyebrowPrefix` + accent `<em>{profile.accentEyebrow}</em>`), the serif `<h1>` thesis (`clamp(30px,4.6vw,44px)`, weight 500, line-height 1.18, `-0.005em` tracking, `max-width:21ch`, `text-wrap:balance`), the `.sub` bio paragraph (`max-width:58ch`), and a 20px-gap `.links` row with `résumé →` (`download`), `linkedin →` and `github →` (`target="_blank" rel="noopener noreferrer"` — T-01-03 mitigation)
- `src/components/SiteFooter.astro` reproduces the prototype's footer flex row exactly (`padding:48px 0 40px; border-top:1px solid var(--hair); margin-top:40px`), a 6×6px `--good` status dot + `all systems operational`, and a `#clock` span driven by a plain inline `<script>` `tick()` function (`Intl.DateTimeFormat('en-US', {hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'America/Los_Angeles'})`), guarded against a missing `#clock` element, calling `tick()` once then `setInterval(tick, 30000)`
- All three scoped `<style>` blocks read exclusively via `var(--token)` — zero hex literals
- `npx astro check` reports 0 errors/0 warnings/0 hints after every task; `npm run build` exits 0 with all three components present in the project (not yet wired into `index.astro` — that composition is plan 01-06's scope)

## Task Commits

Each task was committed atomically:

1. **Task 1: SiteHeader.astro** - `9580573` (feat)
2. **Task 2: Hero.astro** - `fa3cab2` (feat)
3. **Task 3: SiteFooter.astro with live Seattle clock** - `f06618b` (feat)

_Plan-metadata commit added after this SUMMARY and STATE.md update._

## Files Created/Modified

- `src/components/SiteHeader.astro` - mono identity block + 3-link nav (work/résumé/contact), sourced from `profile`
- `src/components/Hero.astro` - eyebrow/thesis/bio + 3 quiet links (résumé/linkedin/github), sourced from `profile`
- `src/components/SiteFooter.astro` - status line + live Seattle clock via inline `tick()` script

## Decisions Made

- SiteHeader's `résumé` nav link does not carry `download` (only Hero's résumé link does) — matches the plan's task-1 action text, which specifies `download` only for the Hero link, keeping the header nav link a normal navigational anchor while the hero link is the explicit download CTA
- The footer clock uses a plain, unattributed `<script>` tag (Astro bundles it as a standard ES module at build time) rather than `is:inline` or any `client:*` hydration directive, matching 01-RESEARCH.md Pattern 2 — no framework runtime needed for a `setInterval`-driven text update

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking, verification-method adjustment] Task verify greps for literal copy strings do not match component source (by design)**
- **Found during:** Task 1 (SiteHeader) and Task 2 (Hero)
- **Issue:** Each task's `<automated>` verify command greps `src/components/*.astro` for literal strings that exist in `src/data/profile.ts` (e.g. `"prateek kumar"`, `"intelligence runs on"`, `"applied ai"`). Per this project's explicit convention (CLAUDE.md / environment notes: "All copy comes from `src/data/profile.ts` (locked verbatim) — components render data, never hardcode strings that exist in data modules") and per plan 01-03's established pattern, these components correctly reference `profile.name`, `profile.thesis`, `profile.eyebrowPrefix`/`profile.accentEyebrow` etc. as variables rather than duplicating the literal text — so the literal-string greps against the `.astro` source necessarily return 0, even though the rendered output (and the underlying data) is correct and verbatim.
- **Fix:** No code change needed — sourcing from `profile` is correct per project convention and the plan's own read_first/action text ("Source name/location from profile where practical"). Verified correctness instead by (a) confirming `src/data/profile.ts` contains the exact locked strings (already true per plan 01-03), (b) confirming the component's JSX expressions reference the correct `profile.*` fields, and (c) running `npx astro check` (0 errors) and `npm run build` (exit 0) to confirm the templates compile and would render the sourced values correctly. Structural/navigational strings not present in any data module (`#contact`, `noopener noreferrer`, nav route targets) do match their grep checks as written, confirming the greps run correctly — only the data-sourced literal-copy checks are affected by this convention.
- **Files modified:** None beyond the planned component files.
- **Verification:** `npx astro check` clean on both tasks; `profile.ts` values inspected and confirmed to match every sourced field.
- **Committed in:** `9580573` (Task 1), `fa3cab2` (Task 2)

---

**Total deviations:** 1 auto-fixed (verification-method adjustment, Rule 3 — no code change, only a documentation of why two automated grep checks don't apply literally under the project's data-sourcing convention)
**Impact on plan:** No scope creep. All acceptance criteria (rendered identity/thesis/bio/links, correct hrefs, `rel="noopener noreferrer"`, zero hex literals, `astro check` clean) are independently satisfied; only the literal-string grep sub-checks for profile-sourced copy don't apply as written, by design.

## Issues Encountered

None beyond the verification-method note above.

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

- SiteHeader, Hero, and SiteFooter are complete, type-check clean, and building successfully — ready for plan 01-05 (remaining section components: selected systems, experience, patents & publications, skills, contact) to follow the same profile-sourcing + `var(--token)` pattern
- Plan 01-06 will compose `BaseLayout` + `SiteHeader` + `Hero` + all section components + `SiteFooter` into `index.astro` (currently still the Astro scaffold placeholder, unchanged this plan, per scope)
- No blockers carried forward

## Self-Check: PASSED

All 3 created files verified present on disk (`src/components/SiteHeader.astro`, `Hero.astro`, `SiteFooter.astro`); all 3 task commit hashes (`9580573`, `fa3cab2`, `f06618b`) verified present in `git log`; `npx astro check` and `npm run build` both verified passing in this session.

---
*Phase: 01-foundation-editorial-shell*
*Completed: 2026-07-16*
