---
phase: 01-foundation-editorial-shell
plan: 03
subsystem: content
tags: [typescript, data-modules, honesty-gate, content]

# Dependency graph
requires:
  - phase: 01-foundation-editorial-shell
    provides: Buildable Astro 7 static project skeleton (plan 01-01)
provides:
  - "src/data/types.ts: SystemEntry, ExperienceEntry, Patent, Publication, SkillGroup, ProfileLink interfaces, each with a `source: string`"
  - "src/data/profile.ts: profile object (name, location, eyebrow, thesis, bio, links)"
  - "src/data/systems.ts: systems (4 SystemEntry rows)"
  - "src/data/experience.ts: experience (4 ExperienceEntry rows)"
  - "src/data/patents.ts: patents (2), publications (1)"
  - "src/data/skills.ts: skillsIntro + skillGroups (4)"
affects: [01-04-PLAN (Header/Hero components import types+profile+systems), 01-05-PLAN (Experience/Patents/Skills/Contact section components import remaining data modules), 01-06-PLAN (verification pass asserts source coverage / honesty gate)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "src/data/*.ts as plain typed TS modules (not Astro content collections) — every metric-bearing entry carries a `source: string` field tracing it to the résumé (CONT-07 honesty gate), consumed by verification in plan 01-06"
    - "ProfileLink wrapper type ({ href, source }) used for all external/contact links so provenance travels with every link, not just metric entries"

key-files:
  created:
    - src/data/types.ts
    - src/data/profile.ts
    - src/data/systems.ts
    - src/data/experience.ts
    - src/data/patents.ts
    - src/data/skills.ts
  modified: []

key-decisions:
  - "Added a `ProfileLink` interface ({ href, source }) beyond the plan's minimum spec, so profile.links entries (resume/linkedin/github/email) each carry explicit provenance consistent with the metric-bearing entries elsewhere (Rule 2 — missing critical functionality for full honesty-gate coverage)"
  - "Patent interface includes an optional `number` field (only the second patent has a filing number, IN 201631007292; the first is Grade A1 with no filing number in the résumé)"
  - "skills.ts exports a module-level `skillsSource` string (not a per-group field) since 01-CONTEXT.md scopes skills as capability tags, not individual metric claims — one provenance annotation for the whole grouped set, per the plan's own guidance ('include a source on the group set for provenance consistency')"

requirements-completed: [CONT-01, CONT-02, CONT-03, CONT-04, CONT-07]

coverage:
  - id: D1
    description: "types.ts defines SystemEntry (and ExperienceEntry/Patent/Publication/SkillGroup) each with a required source: string; profile.ts exports the locked thesis/bio/links; systems.ts exports exactly 4 entries with the locked names/metrics"
    requirement: "CONT-01, CONT-07"
    verification:
      - kind: other
        ref: "npx astro check (0 errors); grep -c dynamodb/cellularization src/data/systems.ts (1); grep -c prateek-kumar-7b11321b3 src/data/profile.ts (1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "experience.ts exports 4 entries (Microsoft, AWS, MathWorks, Samsung) with real scope/metrics and a source each; patents.ts exports 2 patents (Grade A1, IN 201631007292) and 1 publication (Android Lint), each with a source"
    requirement: "CONT-02, CONT-03, CONT-07"
    verification:
      - kind: other
        ref: "npx astro check (0 errors); grep -c MathWorks src/data/experience.ts (2); grep -c 201631007292 src/data/patents.ts (2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "skills.ts exports 4 skill groups (Languages, Cloud & Distributed, Data, Mobile) as {label, tags}, a prose intro, and no proficiency/percentage fields (no skill-bar anti-pattern)"
    requirement: "CONT-04"
    verification:
      - kind: other
        ref: "npx astro check (0 errors); grep -c 'Cloud & Distributed' src/data/skills.ts (2, label + provenance comment); grep -c Kubernetes src/data/skills.ts (1); grep for percent/proficiency/level: returns none"
        status: pass
    human_judgment: false

# Metrics
duration: ~15min
completed: 2026-07-16
status: complete
---

# Phase 1 Plan 3: Typed Content Data Modules Summary

**Six typed TypeScript data modules (types/profile/systems/experience/patents/skills) single-sourcing all page content, with a `source` field on every metric-bearing entry tracing it to the résumé — the CONT-07 honesty gate.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-16 (session continuation from plan 01-02)
- **Completed:** 2026-07-16
- **Tasks:** 3/3
- **Files modified:** 6 (all new: types.ts, profile.ts, systems.ts, experience.ts, patents.ts, skills.ts)

## Accomplishments

- `src/data/types.ts` defines `SystemEntry`, `ExperienceEntry`, `Patent`, `Publication`, `SkillGroup`, and `ProfileLink` — every metric-bearing interface carries a required `source: string` field
- `src/data/profile.ts` exports `profile`: name (`prateek kumar`), location (`seattle`), eyebrow (`distributed systems · cloud · ` + accent `applied ai`), the locked hero thesis, the verbatim bio line naming Microsoft/AWS/Samsung, and a `links` object (resume/linkedin/github/email) where each link carries its own `source`
- `src/data/systems.ts` exports the 4 locked selected-systems rows (`azure/health-snapshots`, `dynamodb/cellularization`, `elb/auto-weight-away`, `iot/contextual-widget`) with descriptions ported verbatim from the approved prototype's `.row` blocks and real metrics
- `src/data/experience.ts` exports 4 entries in order (Microsoft → AWS → MathWorks → Samsung) with real scope/metrics from the résumé, including the AWS entry's `−10% peak latency`/`90% ops automated` (auto-weight-away) and the Samsung entry's `APK 150→90MB`
- `src/data/patents.ts` exports 2 patents (IoT room identification via device-type watermarks, Grade A1, 2020; automated position & latch locking control via mobile, IN 201631007292, 2016) and 1 publication (Android Lint tool optimization, ~30% faster dead-code/unused-resource detection)
- `src/data/skills.ts` exports a prose intro plus 4 grouped mono skill-tag sets (Languages, Cloud & Distributed, Data, Mobile) — no proficiency/percentage fields, avoiding the skill-bar anti-pattern
- `npx astro check` reports 0 errors/0 warnings/0 hints after each task
- Phone number does not appear in any data module (confirmed by grep)

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared types + profile.ts + systems.ts** - `bb34e19` (feat)
2. **Task 2: experience.ts + patents.ts** - `6105838` (feat)
3. **Task 3: skills.ts** - `5979045` (feat)

_Plan-metadata commit added after this SUMMARY and STATE.md update._

## Files Created/Modified

- `src/data/types.ts` - shared interfaces (`SystemEntry`, `ExperienceEntry`, `Patent`, `Publication`, `SkillGroup`, `ProfileLink`), each metric-bearing type requires `source: string`
- `src/data/profile.ts` - `profile` object: identity, eyebrow, thesis, bio, links (each link with its own `source`)
- `src/data/systems.ts` - `systems: SystemEntry[]` (4 entries)
- `src/data/experience.ts` - `experience: ExperienceEntry[]` (4 entries)
- `src/data/patents.ts` - `patents: Patent[]` (2), `publications: Publication[]` (1)
- `src/data/skills.ts` - `skillsIntro`, `skillGroups: SkillGroup[]` (4), `skillsSource`

## Decisions Made

- Added a `ProfileLink` wrapper type (`{ href, source }`) beyond the plan's literal minimum spec, so every link in `profile.links` carries explicit résumé/profile provenance consistent with the metric-bearing entries elsewhere in the data layer — this extends CONT-07 honesty-gate coverage to links, not just metrics (Rule 2, missing critical functionality for full coverage)
- `Patent` interface includes an optional `number` field, since only the second patent (automated position & latch locking control) has a filing number (`IN 201631007292`) in the résumé — the first (Grade A1) does not
- `skills.ts` uses one module-level `skillsSource` string rather than a per-group `source` field, since skills are capability tags (not individual metric claims) per 01-CONTEXT.md — matches the plan's own guidance to "include a source on the group set for provenance consistency"

## Deviations from Plan

None - plan executed exactly as written, with one Rule 2 addition (the `ProfileLink` type/per-link `source` fields) that extends honesty-gate coverage beyond the plan's literal minimum without changing any locked copy or metric.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

- All 6 typed data modules are complete, type-check clean, and ready for plans 01-04 (Header/Hero components) and 01-05 (Experience/Patents/Skills/Contact section components) to import
- The honesty-gate mechanism (`source` field on every metric-bearing entry, plus on every profile link) is in place for plan 01-06's verification pass to assert coverage against
- No blockers carried forward

## Self-Check: PASSED

All 6 created files verified present on disk (`src/data/types.ts`, `profile.ts`, `systems.ts`, `experience.ts`, `patents.ts`, `skills.ts`); all 3 task commit hashes (`bb34e19`, `6105838`, `5979045`) verified present in `git log`.

---
*Phase: 01-foundation-editorial-shell*
*Completed: 2026-07-16*
