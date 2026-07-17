---
phase: 03-case-studies-launch-polish
plan: 01
subsystem: content
tags: [astro, content-layer, zod, glob-loader, case-studies]

requires:
  - phase: 02-fig01-signature-figure
    provides: locked shell/design tokens and systems.ts data that case-study frontmatter reuses (standfirst text, metric source strings)
provides:
  - Typed `case-studies` Astro Content Layer collection (`src/content.config.ts`) with a zod schema requiring title/systemId/dateRange/standfirst/metrics plus problem/approach/tradeoffs/impact
  - Two fact-disciplined content entries (dynamodb-cellularization, elb-auto-weight-away) satisfying that schema
  - Build-time proof that the schema rejects a malformed entry (captured Zod error + exit code)
affects: [03-02-case-study-pages, 03-03-seo-og-sitemap]

tech-stack:
  added: []
  patterns:
    - "Content Layer collection config lives at src/content.config.ts (not src/content/config.ts)"
    - "Import z from astro/zod rather than the deprecated astro:content re-export"
    - "Problem/approach/tradeoffs/impact enforced as required typed frontmatter fields, not heading-text parsing"

key-files:
  created:
    - src/content.config.ts
    - src/content/case-studies/dynamodb-cellularization.md
    - src/content/case-studies/elb-auto-weight-away.md
  modified: []

key-decisions:
  - "Imported z from astro/zod instead of the astro:content re-export shown in RESEARCH.md's example, since astro check flagged the astro:content re-export as deprecated (0 hints after the switch vs 15 before)"
  - "Case-study title fields use the mono artifact-name string (e.g. dynamodb/cellularization) rather than inventing separate prose titles, keeping the H1/page-title copy factual and consistent with the systems-list idiom"
  - "ELB metric source strings combine both resume numbers (-10% peak-hour latency, 90% capacity ops automated) per the plan's literal action text, extending beyond systems.ts's existing single-metric source annotation for that row"

patterns-established:
  - "Pattern: negative-test content fixtures are created, proven to fail npm run build, then deleted in the same task — never committed to the repo"

requirements-completed: [CASE-01, CASE-02, CASE-03]

coverage:
  - id: D1
    description: "Typed case-studies Content Layer collection registered with a zod schema requiring the four problem/approach/tradeoffs/impact structure fields plus title/systemId/dateRange/standfirst/metrics"
    requirement: "CASE-03"
    verification:
      - kind: other
        ref: "npx astro sync && npx astro check (0 errors, 0 warnings, 0 hints)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both case-study entries authored and build-valid, containing only résumé-traceable percentage figures"
    requirement: "CASE-01, CASE-02"
    verification:
      - kind: other
        ref: "npm run build (exit 0); grep -hoE '[0-9]+%' src/content/case-studies/*.md | sort -u -> 10%, 20%, 30%, 90% only"
        status: pass
    human_judgment: false
  - id: D3
    description: "Schema rejection of a malformed entry proven via failing build, then reverted to a clean build"
    requirement: "CASE-03"
    verification:
      - kind: other
        ref: "npm run build with zzz-malformed-fixture.md present -> exit 1, InvalidContentEntryDataError naming all 8 missing fields; after deletion, npm run build -> exit 0"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-07-17
status: complete
---

# Phase 3 Plan 1: Case-Studies Content Collection Summary

**Schema-enforced Astro Content Layer collection (zod, glob loader) backing two fact-disciplined case-study entries, with a captured build-failure proof that malformed entries are rejected**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-17T07:43:32Z
- **Completed:** 2026-07-17T07:50:28Z
- **Tasks:** 3 completed
- **Files modified:** 3 (all created; 1 temporary fixture created and deleted within Task 3, no lasting change)

## Accomplishments
- `src/content.config.ts` defines the `case-studies` collection at the Content Layer root location with a zod schema requiring 9 fields, including the four structure fields (`problem`/`approach`/`tradeoffs`/`impact`) that mechanically enforce CASE-03's problem→approach→impact contract
- Both case studies (`dynamodb-cellularization`, `elb-auto-weight-away`) authored with standfirst text copied verbatim from `src/data/systems.ts`, metrics tagged with `source` provenance strings, and trade-off prose framed as general engineering considerations of each pattern (never insider Amazon specifics)
- Proved the schema's rejection mechanism: a malformed fixture (title only, 8 required fields omitted) made `npm run build` exit non-zero with an `InvalidContentEntryDataError` naming every missing field; deleting the fixture restored a clean, exit-0 build

## Task Commits

Each task was committed atomically:

1. **Task 1: Define the case-studies Content Layer collection + zod schema (CASE-03)** - `ca662f1` (feat)
2. **Task 2: Author both case-study entries under absolute fact discipline (CASE-01, CASE-02)** - `d527d4c` (feat)
3. **Task 3: Prove the schema rejects a malformed entry via a failing build (CASE-03 proof)** - no commit (fixture created, build failure captured, fixture deleted — no lasting file change to commit; see evidence below)

**Plan metadata:** (recorded after this summary is written)

## Files Created/Modified
- `src/content.config.ts` - Content Layer `case-studies` collection: `glob()` loader over `src/content/case-studies`, zod schema requiring title/systemId/dateRange/standfirst/metrics[]{label,value,source} plus problem/approach/tradeoffs/impact
- `src/content/case-studies/dynamodb-cellularization.md` - Case-study entry; standfirst verbatim from systems.ts; metrics `+30%` reliability / `-20%` p99 latency; trade-offs framed as blast-radius-vs-capacity-pooling and routing/placement/migration-sequencing considerations
- `src/content/case-studies/elb-auto-weight-away.md` - Case-study entry; standfirst verbatim from systems.ts; metrics `-10%` peak-hour latency / `90%` ops automated; trade-offs framed as automation-speed-vs-false-positive-weigh-outs and pre-allocation-cost-vs-surge-readiness considerations

## Decisions Made
- Switched the zod import from `astro:content`'s `z` re-export to `astro/zod` directly — `astro check` flagged the former as deprecated (15 hints); the switch produced a fully clean check (0 errors/warnings/hints). This is a Rule 1 (bug/correctness) auto-fix, not a deviation from intent.
- Used the mono artifact-name string (`dynamodb/cellularization`, `elb/auto-weight-away`) as the frontmatter `title` field, matching the plan's "plain factual title" instruction and the systems-list naming idiom (03-CONTEXT.md: "the systems-list idiom promoted to page scale").
- Followed the plan's literal `source` string instructions for ELB metrics (combining both résumé numbers into one shared source annotation across both metrics), even though `src/data/systems.ts`'s existing `elb/auto-weight-away` row only annotates the 90%-automation figure — the plan's action text for this task explicitly specifies the combined string, and 03-CONTEXT.md's decisions block independently corroborates both numbers as résumé facts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug/correctness] Imported z from astro/zod instead of the deprecated astro:content re-export**
- **Found during:** Task 1 (`npx astro check` verification step)
- **Issue:** RESEARCH.md's Pattern 1 code example imports `{ defineCollection, z }` from `'astro:content'`; `astro check` on this project's Astro 7.0.7 flags that `z` re-export as deprecated (`ts(6385)`), producing 15 hints
- **Fix:** Changed the import to `import { defineCollection } from 'astro:content'; import { z } from 'astro/zod';`
- **Files modified:** src/content.config.ts
- **Verification:** Re-ran `npx astro sync && npx astro check` — 0 errors, 0 warnings, 0 hints
- **Committed in:** ca662f1 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — correctness/deprecation cleanup)
**Impact on plan:** No scope creep; the fix keeps the schema on Astro's current recommended import surface without changing any schema shape or field name from the plan.

## Issues Encountered
None — all three tasks executed and verified on the first pass (after the Rule 1 import fix in Task 1).

## Malformed-Fixture Build-Failure Evidence (Task 3, CASE-03 proof)

**With `src/content/case-studies/zzz-malformed-fixture.md` present** (frontmatter: `title` only, all 8 other required fields omitted), `npm run build` exited with code **1**:

```
[InvalidContentEntryDataError] case-studies → zzz-malformed-fixture data does not match collection schema.

  systemId: Required
  dateRange: Required
  standfirst: Required
  metrics: Required
  problem: Required
  approach: Required
  tradeoffs: Required
  impact: Required

  Location:
    C:\Development\Dump\Portfolio\src\content\case-studies\zzz-malformed-fixture.md:0:0
```

After deleting the fixture, `npm run build` completed with exit code **0** (2 pages built, `dist/index.html` and `dist/404.html`). The fixture does not exist in the repo (confirmed via `test ! -f` and `git status --short`, which shows no trace of it).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The `case-studies` collection is registered and returns 2 valid entries — plan 03-02 can call `getCollection('case-studies')` inside `getStaticPaths()` for `src/pages/work/[slug].astro` immediately.
- Both entries' `standfirst` fields are ready to feed the SEO `description` meta tag in plan 03-03.
- No blockers. The malformed-fixture proof and the honesty-gate percentage check are both re-runnable verification commands (`npm run build`; `grep -hoE '[0-9]+%' src/content/case-studies/*.md`) if regression checking is needed later in the phase.

---
*Phase: 03-case-studies-launch-polish*
*Completed: 2026-07-17*

## Self-Check: PASSED

All created files verified present on disk (src/content.config.ts, src/content/case-studies/dynamodb-cellularization.md, src/content/case-studies/elb-auto-weight-away.md, this SUMMARY.md). Both task commit hashes (ca662f1, d527d4c) verified present in git log. Malformed fixture confirmed absent from the repo.
