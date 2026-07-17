---
phase: 03-case-studies-launch-polish
plan: 02
subsystem: ui
tags: [astro, content-layer, getStaticPaths, dynamic-routes]

requires:
  - phase: 03-case-studies-launch-polish (plan 01)
    provides: Typed `case-studies` Content Layer collection (src/content.config.ts) with 2 fact-disciplined entries
provides:
  - "src/pages/work/[slug].astro — one template rendering both /work/dynamodb-cellularization and /work/elb-auto-weight-away, composed with BaseLayout + SiteHeader + SiteFooter (every-page contract)"
  - "Case-study article structure: mono H1, serif standfirst, metrics strip with native title= source annotations, problem/approach(+trade-offs considered)/impact sections, back-to-work + next cross-links"
  - "SystemsList.astro rows for dynamodb/cellularization and elb/auto-weight-away are now data-driven links into their case-study pages; the other two rows stay plain text"
affects: [03-03-seo-og-sitemap, 03-04-launch-verification]

tech-stack:
  added: []
  patterns:
    - "getStaticPaths maps getCollection('case-studies') to { params: { slug: entry.id }, props: { entry, other } } — entry.id is the route key, no reserved slug frontmatter field"
    - "Metric source provenance surfaced via native title= attribute, not a custom tooltip widget"
    - "Systems-list row linkage derived from a systemId -> entry.id Map built from the collection at render time, not a hardcoded slug list"

key-files:
  created:
    - src/pages/work/[slug].astro
  modified:
    - src/components/SystemsList.astro

key-decisions:
  - "Rendered metric label/value as a two-line stat column (label above, value below) rather than an inline 'label: value' string, since the UI-SPEC's typography table gives label and value distinct font sizes/weights/colors (11px --dim vs 15px --accent) that read better stacked than concatenated inline"
  - "Cross-link block uses justify-content: space-between (back-link left, next-link right) — UI-SPEC specifies the block's border/margin but not its internal layout, filling the true gap conservatively"
  - "Added new a.row / a.row:hover CSS rules rather than editing the existing .row rule, keeping .row/.row:hover/the 640px collapse byte-identical to before per the plan's acceptance criteria"

patterns-established:
  - "Case-study page frontmatter section strings (problem/approach/tradeoffs/impact) are split into paragraphs via a local paragraphs() helper (split on blank lines) rather than rendered through render()/<Content /> — schema fields, not Markdown body"

requirements-completed: [CASE-01, CASE-02]

coverage:
  - id: D1
    description: "Case-study page template renders both routes with the full site shell (header/footer) and article structure (H1, standfirst, metrics strip with source annotations, problem/approach+trade-offs/impact, cross-links)"
    requirement: "CASE-01"
    verification:
      - kind: other
        ref: "npm run build (exit 0); grep -l 'all systems operational' dist/work/{dynamodb-cellularization,elb-auto-weight-away}/index.html; grep -oE '<h1|h2|h3[^>]*>...' confirms mono H1 artifact name, problem/approach/impact headings, trade-offs considered sub-heading, and metric title= source attributes present in both built pages"
        status: pass
    human_judgment: false
  - id: D2
    description: "Systems-list rows for dynamodb/cellularization and elb/auto-weight-away become clickable links into their case-study pages; the other two rows (azure/health-snapshots, iot/contextual-widget) stay unlinked plain text; .row grid/spacing/hover/640px collapse unchanged"
    requirement: "CASE-02"
    verification:
      - kind: other
        ref: "npm run build (exit 0); grep -o 'href=\"/work/' dist/index.html | wc -l -> 2; grep for <div class=\"row\" vs <a class=\"row\" confirms exactly 2 of each; git diff shows .row/.row:hover/media-query rules untouched, only new a.row rules added"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-07-17
status: complete
---

# Phase 3 Plan 2: Case-Study Pages + Systems-List Entry Points Summary

**One `src/pages/work/[slug].astro` template renders both case-study routes from the collection, and the two matching SystemsList rows become data-driven links into them**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-17T00:56:19-07:00
- **Completed:** 2026-07-17T00:59:37-07:00
- **Tasks:** 2 completed
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments
- `src/pages/work/[slug].astro` builds both `/work/dynamodb-cellularization` and `/work/elb-auto-weight-away` from `getCollection('case-studies')` via `getStaticPaths`, composed exactly like `404.astro` (BaseLayout + SiteHeader + SiteFooter) so the every-page "all systems operational" contract from Phase 1's verification gap holds on the new routes
- Each page renders the mono H1 (artifact name), serif standfirst, a metrics strip whose values carry native `title=` source-provenance attributes, the `problem` → `approach` (with a `trade-offs considered` sub-heading) → `impact` sections, and a `back to work →` / `next: {other} →` cross-link block
- `SystemsList.astro` now builds a `systemId -> entry.id` map from the case-studies collection at render time; the 2 matching rows render as `<a class="row" href="/work/{slug}">`, the other 2 stay `<div class="row">` — data-driven, not hardcoded, so a future case study auto-links its row

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the case-study page template src/pages/work/[slug].astro (CASE-01, CASE-02)** - `0afed37` (feat)
2. **Task 2: Link the two matching systems-list rows (CASE-01, CASE-02 entry points)** - `6a77058` (feat)

**Plan metadata:** (recorded after this summary is written)

## Files Created/Modified
- `src/pages/work/[slug].astro` - Case-study article template: getStaticPaths from the collection, mono H1/serif standfirst/metrics strip/problem-approach-impact sections/cross-links, scoped CSS using only `var(--token)` colors
- `src/components/SystemsList.astro` - Rows for dynamodb/cellularization and elb/auto-weight-away become `<a class="row" href="/work/{slug}">` (data-driven from the case-studies collection); other 2 rows unchanged; `.row`/`.row:hover`/640px collapse CSS byte-identical to before, only new `a.row`/`a.row:hover` rules added to neutralize the global anchor underline

## Decisions Made
- Rendered metrics as a stacked label/value column (not an inline "label: value" string) since the UI-SPEC typography table assigns label and value distinct sizes/weights/colors that read better stacked
- Cross-link block laid out with `justify-content: space-between` (UI-SPEC specified the block's border/margin but not internal alignment — a true gap filled conservatively)
- Kept `.row`/`.row:hover`/640px-collapse rules in `SystemsList.astro` completely untouched; added `a.row`/`a.row:hover` as new rules to reset the global `a` underline/color, satisfying the plan's "byte-identical" acceptance criterion

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking, verification-only] Corrected the exactly-2-links check from `grep -c` to occurrence counting**
- **Found during:** Task 2 verification
- **Issue:** The plan's literal verify command (`test "$(grep -c 'href="/work/' dist/index.html)" = "2"`) uses `grep -c`, which counts matching *lines*, not occurrences. Astro's build output minifies `dist/index.html` to a single line, so both `href="/work/..."` links land on the same line and `grep -c` returns `1`, producing a false failure even though the actual acceptance criterion (exactly 2 links) is met.
- **Fix:** Verified with `grep -o 'href="/work/' dist/index.html | wc -l` (occurrence count) → `2`, confirmed independently via `grep -oE 'href="/work/[^"]*"'` listing both distinct hrefs, and via row-type counts (`<a class="row"` × 2, `<div class="row"` × 2). No application code changed — this is a verification-methodology correction, not a behavior fix.
- **Files modified:** none (verification only)
- **Verification:** `grep -o 'href="/work/' dist/index.html | wc -l` → 2; both hrefs are `/work/dynamodb-cellularization` and `/work/elb-auto-weight-away`; the other two rows render as `<div class="row">` with no `/work/` link
- **Committed in:** n/a (no code change; documented here for traceability)

---

**Total deviations:** 1 auto-fixed (1 verification-methodology correction, no code impact)
**Impact on plan:** None on shipped behavior — the build output already satisfied the plan's actual acceptance criterion (exactly 2 `/work/` links); only the literal grep invocation in the plan's verify block undercounts on minified single-line HTML.

## Issues Encountered
None beyond the verify-command false-negative documented above — both tasks built and passed `astro check` (0 errors/warnings/hints) on the first pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both `/work/*` routes exist and build cleanly; plan 03-03 (sitemap) can include them immediately (both discoverable via `getCollection('case-studies')`)
- Each page's `description={entry.data.standfirst}` is already threaded through `BaseLayout`, ready for 03-03's SEO/OG meta wiring
- No blockers.

---
*Phase: 03-case-studies-launch-polish*
*Completed: 2026-07-17*

## Self-Check: PASSED

All created/modified files verified present on disk (`src/pages/work/[slug].astro`, `src/components/SystemsList.astro`, this SUMMARY.md). Both task commit hashes (`0afed37`, `6a77058`) verified present in `git log`. `npm run build` and `npx astro check` both pass with 0 errors.
