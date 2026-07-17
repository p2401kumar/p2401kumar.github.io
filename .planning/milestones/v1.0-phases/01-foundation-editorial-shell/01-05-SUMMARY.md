---
phase: 01-foundation-editorial-shell
plan: 05
subsystem: content
tags: [astro, components, content-sections, editorial-shell, responsive]

# Dependency graph
requires:
  - phase: 01-foundation-editorial-shell
    provides: "tokens.css/global.css/fonts.css + BaseLayout.astro (plan 01-02); typed data modules — systems/experience/patents/skills/profile (plan 01-03)"
provides:
  - "src/components/SystemsList.astro: selected systems (4 rows, 640px responsive grid, PLAT-05)"
  - "src/components/ExperienceSection.astro: experience (4 entries)"
  - "src/components/PatentsSection.astro: patents & publications (2 patents + 1 publication)"
  - "src/components/SkillsSection.astro: skills (prose intro + 4 grouped mono tag sets, no skill bars)"
  - "src/components/ContactSection.astro: contact (id=\"contact\", mailto + LinkedIn, no phone)"
affects: [01-06-PLAN (index.astro composes BaseLayout + SiteHeader + Hero + these 5 sections + SiteFooter)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Continued the 01-03/01-04 convention: components render exclusively from src/data/*.ts (systems, experience, patents/publications, skillsIntro/skillGroups, profile.links) — no hardcoded copy that duplicates a data module"
    - "ExperienceSection and PatentsSection reuse SystemsList's row idiom (mono title/meta + sans description, hairline top-border, no card chrome) for visual consistency across all list-shaped sections, even though only SystemsList's exact row grid was locked verbatim by the prototype"
    - "SkillsSection tags rendered as quiet mono pills (var(--panel2) bg, var(--hair2) border) — explicitly not a proficiency bar or logo wall"

key-files:
  created:
    - src/components/SystemsList.astro
    - src/components/ExperienceSection.astro
    - src/components/PatentsSection.astro
    - src/components/SkillsSection.astro
    - src/components/ContactSection.astro
  modified: []

key-decisions:
  - "ExperienceSection and PatentsSection are not specified verbatim in the prototype (only SystemsList's .row grid is canonical CSS) — designed their row-based layout (mono meta line + sans description, hairline top-border-separated entries) to match the same quiet editorial idiom as SystemsList, per the plan's action text: \"following the same quiet editorial idiom as the systems section (reuse the section spacing/heading pattern)\""
  - "ContactSection's mailto link uses visible copy \"email →\" (matching the hero/contact mono-link idiom \"resume →\"/\"linkedin →\") rather than rendering the raw email address as link text — the mailto: URL itself (profile.links.email.href) carries the address"
  - "SkillsSection tags render as bordered mono pills (var(--panel2) background, var(--hair2) border, 6px radius) — a Claude's-discretion visual choice for \"grouped mono tags\" (01-UI-SPEC.md leaves exact tag styling unspecified beyond \"no skill bars/logos\"), consistent with the token system and reusing the existing --panel2/--hair2 tokens rather than inventing new ones"

requirements-completed: [CONT-01, CONT-02, CONT-03, CONT-04, CONT-06, PLAT-05]

coverage:
  - id: D1
    description: "SystemsList.astro renders an <h2>selected systems</h2> label and one .row per systems entry (4 rows, grid 64px 1fr auto, row-hover --panel2 background); a max-width:640px media query collapses the grid to 52px 1fr and hides .mt (display:none)"
    requirement: "CONT-01, PLAT-05"
    verification:
      - kind: other
        ref: "grep -c 'selected systems' src/components/SystemsList.astro (2); grep -c 'max-width: 640px' (1); npx astro check (0 errors/0 warnings/0 hints); npm run build exit 0; hex-literal grep across all 5 new components (0 matches)"
        status: pass
    human_judgment: false
  - id: D2
    description: "ExperienceSection.astro renders <h2>experience</h2> and 4 entries (Microsoft/AWS/MathWorks/Samsung) mapped from data; PatentsSection.astro renders <h2>patents & publications</h2>, 2 patents (Grade A1, IN 201631007292) and 1 publication (Android Lint) mapped from data"
    requirement: "CONT-02, CONT-03"
    verification:
      - kind: other
        ref: "grep -c experience src/components/ExperienceSection.astro (8); grep -c 'patents & publications' src/components/PatentsSection.astro (2); npx astro check (0 errors)"
        status: pass
    human_judgment: false
  - id: D3
    description: "SkillsSection.astro renders <h2>skills</h2>, a prose intro, and 4 groups as mono tags with no proficiency bars/percentages/logo images; ContactSection.astro has a wrapper with id=\"contact\", a mailto link (profile.links.email.href), and a LinkedIn link with rel=\"noopener noreferrer\", with no phone number rendered anywhere"
    requirement: "CONT-04, CONT-06"
    verification:
      - kind: other
        ref: "grep -c 'id=\"contact\"' src/components/ContactSection.astro (1... see deviation note); grep -in phone across both files matches only code-comment mentions of the exclusion, not a rendered phone string; npx astro check (0 errors)"
        status: pass
    human_judgment: false

# Metrics
duration: ~9min
completed: 2026-07-16
status: complete
---

# Phase 1 Plan 5: Content Section Components Summary

**Five content-section `.astro` components (SystemsList, ExperienceSection, PatentsSection, SkillsSection, ContactSection), each rendering from its typed `src/data/*.ts` module in the locked lowercase-mono-label editorial idiom, with the 640px responsive systems-row collapse (PLAT-05).**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-07-16 (session continuation from plan 01-04)
- **Completed:** 2026-07-16
- **Tasks:** 3/3
- **Files modified:** 5 (all new: SystemsList.astro, ExperienceSection.astro, PatentsSection.astro, SkillsSection.astro, ContactSection.astro)

## Accomplishments

- `src/components/SystemsList.astro` reproduces the prototype's `.work` section exactly: `<h2>selected systems</h2>` mono label, one `.row` per `systems` entry (4 rows) with grid `64px 1fr auto`, `18px` gap, `--panel2` hover background, and the locked `max-width:640px` media query collapsing to `52px 1fr` and hiding `.mt` (PLAT-05)
- `src/components/ExperienceSection.astro` renders `<h2>experience</h2>` and 4 entries (Microsoft → AWS → MathWorks → Samsung) mapped from `experience`, each with company/role (mono, `--ink`/`--dim`) + dates (mono, `--faint`) + scope bullets (sans, `--dim`)
- `src/components/PatentsSection.astro` renders `<h2>patents & publications</h2>` and 3 entries (2 patents + 1 publication) mapped from `patents`/`publications` — title/year in mono, note/filing-number/metric description in sans
- `src/components/SkillsSection.astro` renders `<h2>skills</h2>`, the `skillsIntro` prose paragraph, and 4 `skillGroups` as bordered mono pill tags — no proficiency bars, no percentages, no logo images (explicit anti-pattern exclusion honored)
- `src/components/ContactSection.astro` renders `<h2>contact</h2>` inside a `<section id="contact">` wrapper (so header/nav `#contact` anchors resolve), with an `email →` mailto link and a `linkedin →` link (`target="_blank" rel="noopener noreferrer"` — T-01-03 mitigation); no phone number rendered
- All five components read only `var(--token)` in scoped styles — confirmed 0 hex-literal matches across all 5 files
- `npx astro check` reports 0 errors/0 warnings/0 hints after every task; `npm run build` exits 0 with all 5 components compiling cleanly (not yet composed into `index.astro` — that's plan 01-06's scope)

## Task Commits

Each task was committed atomically:

1. **Task 1: SystemsList.astro** - `d450347` (feat)
2. **Task 2: ExperienceSection.astro + PatentsSection.astro** - `ebe1c79` (feat)
3. **Task 3: SkillsSection.astro + ContactSection.astro** - `4843624` (feat)

_Plan-metadata commit added after this SUMMARY and STATE.md update._

## Files Created/Modified

- `src/components/SystemsList.astro` - `selected systems` section, 4 rows from `systems` data, 640px responsive grid (PLAT-05)
- `src/components/ExperienceSection.astro` - `experience` section, 4 entries from `experience` data
- `src/components/PatentsSection.astro` - `patents & publications` section, 2 patents + 1 publication from `patents`/`publications` data
- `src/components/SkillsSection.astro` - `skills` section, prose intro + 4 grouped mono tag sets from `skillsIntro`/`skillGroups` data
- `src/components/ContactSection.astro` - `contact` section (`id="contact"`), mailto + LinkedIn links from `profile.links`

## Decisions Made

- ExperienceSection and PatentsSection layouts are not specified verbatim by the prototype (only `SystemsList`'s `.row` grid is canonical, locked CSS) — designed their row-based markup (mono meta line + sans description, hairline top-border between entries) to match the same quiet editorial idiom as `SystemsList`, per the plan's own instruction to "reuse the section spacing/heading pattern"
- `ContactSection`'s mailto link renders as `email →` (matching the mono quiet-link idiom used by `résumé →`/`linkedin →` elsewhere) rather than printing the raw address as link text; the address itself lives in the `mailto:` href sourced from `profile.links.email.href`
- `SkillsSection` tags render as bordered mono pills (`--panel2` background, `--hair2` border, 6px radius) — a Claude's-discretion visual choice since 01-UI-SPEC.md specifies "grouped mono tags" without prescribing exact chrome, reusing existing tokens rather than inventing new ones

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking, verification-method adjustment] Task verify greps for literal copy strings do not match component source (by design)**
- **Found during:** Task 3 (ContactSection)
- **Issue:** The task's `<automated>` verify command greps `src/components/ContactSection.astro` for the literal string `mailto:p2401kumar@gmail.com`. Per the established project convention (confirmed in plan 01-04's SUMMARY and 01-03's data-module design), the component correctly references `profile.links.email.href` as a variable rather than hardcoding the mailto string, so the literal-string grep against the `.astro` source returns 0 even though the rendered output (and underlying data in `src/data/profile.ts`) contains the exact locked address.
- **Fix:** No code change needed — sourcing from `profile.links.email` is correct per the project's data-sourcing convention and matches the pattern already established and documented in 01-04's SUMMARY. Verified correctness instead by (a) confirming `src/data/profile.ts` contains the exact `mailto:p2401kumar@gmail.com` href (established in plan 01-03), (b) confirming `ContactSection.astro`'s JSX expression references `profile.links.email.href` correctly, and (c) running `npx astro check` (0 errors) and `npm run build` (exit 0) to confirm the component compiles and renders the sourced value correctly. The `id="contact"` and `rel="noopener noreferrer"` sub-checks (structural/navigational, not data-sourced) pass their greps as written.
- **Files modified:** None beyond the planned component file.
- **Verification:** `npx astro check` clean; `npm run build` exit 0; `profile.ts` inspected and confirmed to contain the exact mailto href.
- **Committed in:** `4843624` (Task 3)

---

**Total deviations:** 1 auto-fixed (verification-method adjustment, Rule 3 — no code change, only a documentation of why one automated grep check doesn't apply literally under the project's established data-sourcing convention, consistent with the same class of deviation documented in plan 01-04)
**Impact on plan:** No scope creep. All acceptance criteria (rendered sections, correct data mapping, responsive collapse, no skill bars/logos, no phone number, `rel="noopener noreferrer"`, zero hex literals, `astro check` clean, `npm run build` exit 0) are independently satisfied; only the literal-mailto-string grep sub-check doesn't apply as written, by design.

## Known Stubs

None. All five sections render live data from their respective typed modules — no placeholder text, no hardcoded empty values, no unwired props.

## Threat Flags

None. `ContactSection`'s LinkedIn link is already covered by the plan's threat model (T-01-03, mitigated with `rel="noopener noreferrer"`); no new network endpoints, auth paths, or schema changes were introduced.

## Issues Encountered

None beyond the verification-method note above.

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

- All 5 content-section components are complete, type-check clean, and building successfully — ready for plan 01-06 to compose `BaseLayout` + `SiteHeader` + `Hero` + `SystemsList` + `ExperienceSection` + `PatentsSection` + `SkillsSection` + `ContactSection` + `SiteFooter` into `index.astro`
- No blockers carried forward

## Self-Check: PASSED

All 5 created files verified present on disk (`src/components/SystemsList.astro`, `ExperienceSection.astro`, `PatentsSection.astro`, `SkillsSection.astro`, `ContactSection.astro`); all 3 task commit hashes (`d450347`, `ebe1c79`, `4843624`) verified present in `git log`; `npx astro check` and `npm run build` both verified passing in this session.

---
*Phase: 01-foundation-editorial-shell*
*Completed: 2026-07-16*
