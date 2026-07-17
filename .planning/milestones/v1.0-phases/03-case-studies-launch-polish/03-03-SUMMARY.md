---
phase: 03-case-studies-launch-polish
plan: 03
subsystem: infra
tags: [astro, seo, opengraph, sitemap, sharp, svg]

requires:
  - phase: 03-case-studies-launch-polish (plan 02)
    provides: "/work/dynamodb-cellularization and /work/elb-auto-weight-away routes, so the sitemap's 'exactly 3 URLs' proof has both case-study pages to include"
provides:
  - "src/components/SEO.astro — reusable head partial (title/description/canonical/OG/twitter:card) wired into BaseLayout, so every page inherits full meta"
  - "og-source.svg + scripts/render-og.mjs — hand-authored 1200x630 OG image source and its rerunnable sharp rasterizer, producing public/og/og-default.png"
  - "@astrojs/sitemap@3.7.3 (pinned exact) wired with a /404-excluding filter — dist/sitemap-0.xml has exactly 3 <url> entries"
  - "public/robots.txt pointing at the sitemap index"
affects: [03-04-launch-verification]

tech-stack:
  added: ["@astrojs/sitemap@3.7.3"]
  patterns:
    - "SEO.astro builds absolute canonical/OG URLs via new URL(Astro.url.pathname, Astro.site) / new URL(ogImage, Astro.site) — never string-concatenated"
    - "OG image rasterization is a standalone, rerunnable Node script (scripts/render-og.mjs) outside the astro build graph, mirroring the project's existing font-subsetting convention"
    - "sitemap filter excludes /404 by suffix match; verified against the BUILT dist/sitemap-0.xml, not just the config (historical filter-not-filtering bug)"

key-files:
  created:
    - src/components/SEO.astro
    - og-source.svg
    - scripts/render-og.mjs
    - public/og/og-default.png
    - public/robots.txt
  modified:
    - src/layouts/BaseLayout.astro
    - astro.config.mjs
    - package.json
    - package-lock.json

key-decisions:
  - "SEO.astro uses the exact Astro.site/Astro.url idiom from 03-RESEARCH.md Pattern 3 rather than any hand-rolled string concatenation, per the plan's Don't-Hand-Roll guidance"
  - "OG SVG text uses the Georgia/Iowan Old Style fallback stack (the same fallback family FontaineTransform already maps Source Serif 4 to in astro.config.mjs) rather than embedding a base64 font, since sharp's SVG rasterizer needs a system-available family and this keeps visual continuity with the site's own serif fallback"
  - "package.json pins @astrojs/sitemap at the exact version string 3.7.3 (no caret) per the plan's explicit acceptance criterion that the pin must not be able to drift; ran a second npm install to sync package-lock.json's requires entry to the same exact string"

patterns-established:
  - "Build-time-only asset generation scripts (render-og.mjs) live under scripts/, are never imported into astro.config.mjs's integrations/vite graph, and their output artifact is committed directly to public/"

requirements-completed: [PLAT-06]

coverage:
  - id: D1
    description: "Every page (home + both case studies) ships title/description/canonical + full OpenGraph meta + twitter:card + favicon, with absolute og:image/og:url URLs, no duplicate title/description tags"
    requirement: "PLAT-06"
    verification:
      - kind: other
        ref: "npm run build; grep -o 'property=\"og:title\"|og:description|og:url|og:image|og:type|twitter:card|rel=\"canonical\"|<title>|name=\"description\"|rel=\"icon\"' against dist/index.html, dist/work/dynamodb-cellularization/index.html, dist/work/elb-auto-weight-away/index.html — each tag occurs exactly once per page; og:image and og:url resolve to https://p2401kumar.github.io/... absolute URLs"
        status: pass
    human_judgment: false
  - id: D2
    description: "A static 1200x630 OG image exists at public/og/og-default.png, produced by a retained, rerunnable sharp script from a hand-authored SVG source reusing the Fig. 01 aesthetic (dot-grid substrate, cell/route motif, locked token colors, name + thesis text)"
    requirement: "PLAT-06"
    verification:
      - kind: other
        ref: "node scripts/render-og.mjs (exit 0, logs width=1200 height=630); sharp metadata readback on public/og/og-default.png confirms format=png width=1200 height=630; render-og.mjs is not referenced by astro.config.mjs"
        status: pass
    human_judgment: false
  - id: D3
    description: "The generated sitemap lists exactly 3 URLs (home + 2 case studies), excludes /404, and robots.txt points at sitemap-index.xml; @astrojs/sitemap pinned exact at 3.7.3"
    requirement: "PLAT-06"
    verification:
      - kind: other
        ref: "npm run build; dist/sitemap-0.xml occurrence-count of '<url>' == 3 (verified via grep -o | wc -l, not grep -c, since the built XML is single-line/minified); zero '404' matches in dist/sitemap-0.xml; dist/robots.txt Sitemap line == https://p2401kumar.github.io/sitemap-index.xml; package.json/package-lock.json pin @astrojs/sitemap at exact string 3.7.3"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-07-17
status: complete
---

# Phase 3 Plan 3: SEO/OpenGraph, OG Image, and Sitemap Summary

**Reusable SEO head partial wired into BaseLayout, a hand-authored 1200x630 OG image rasterized via a retained sharp script, and a 3-URL sitemap + robots.txt via @astrojs/sitemap@3.7.3 — closing PLAT-06**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-17T01:02:26-07:00
- **Completed:** 2026-07-17T01:10:17-07:00
- **Tasks:** 3 completed
- **Files modified:** 9 (7 created, 4 modified — see Files Created/Modified)

## Accomplishments
- `src/components/SEO.astro` emits title/description/canonical/OG/twitter:card meta from `{title, description, ogImage?}` props, computing absolute canonical/OG-image URLs via `new URL(..., Astro.site)`; `BaseLayout.astro` now renders it in `<head>` and no longer emits its own duplicate `<title>`/`<meta description>` tags — verified zero duplication and absolute `https://p2401kumar.github.io/...` URLs across all three built pages (home + both case studies)
- Authored `og-source.svg` (1200x630, Fig. 01 dot-grid substrate + a panel2 cell/route motif with a reduced-weight accent elbow route + name/thesis text in the serif fallback family + a single accent underline) and `scripts/render-og.mjs` (standalone sharp rasterizer, not wired into the Astro build graph); ran it to produce and commit `public/og/og-default.png`, confirmed 1200x630 via sharp metadata readback
- Installed `@astrojs/sitemap@3.7.3` (re-confirmed via `npm view` immediately before install, pinned exact — no caret — in `package.json`/`package-lock.json`), wired a `/404`-excluding `filter` into `astro.config.mjs`, and added `public/robots.txt`; verified against the BUILT `dist/sitemap-0.xml` (not just config) that it contains exactly 3 `<url>` entries and zero `/404` matches

## Task Commits

Each task was committed atomically:

1. **Task 1: SEO head partial wired into BaseLayout (PLAT-06 meta, every page)** - `ab8b8e8` (feat)
2. **Task 2: Author the OG image (SVG) + sharp rasterizer -> public/og/og-default.png (PLAT-06)** - `4b77d87` (feat)
3. **Task 3: Install @astrojs/sitemap (pinned), wire the /404-excluding filter, add robots.txt (PLAT-06)** - `18cfc29` (feat)

**Plan metadata:** (recorded after this summary is written)

## Files Created/Modified
- `src/components/SEO.astro` - New head partial; `{title, description, ogImage='/og/og-default.png'}` props, emits canonical/OG/twitter meta with absolute URLs
- `src/layouts/BaseLayout.astro` - Imports and renders `<SEO>` in `<head>`; removed its own duplicate title/description tags; favicon + font preloads unchanged; retired the stale "OpenGraph is explicitly Phase 3 scope, do not add here" comment
- `og-source.svg` - Hand-authored 1200x630 OG image source (dot-grid + cell/route motif + name/thesis text), hex literals hardcoded from `tokens.css` since this file sits outside the `var(--token)` pipeline
- `scripts/render-og.mjs` - Standalone Node ESM script using the sharp already vendored by `astro:assets` to rasterize `og-source.svg` to `public/og/og-default.png`; logs width/height on success; rerunnable, not part of `astro build`
- `public/og/og-default.png` - Committed 1200x630 OG PNG, generated by the script above
- `astro.config.mjs` - Added `@astrojs/sitemap` integration with a `filter` excluding `/404`; `site`/`output`/`FontaineTransform` vite config untouched
- `public/robots.txt` - New file: `Allow: /` plus a `Sitemap:` line pointing at `https://p2401kumar.github.io/sitemap-index.xml`
- `package.json` / `package-lock.json` - `@astrojs/sitemap` pinned at exact `3.7.3` (devDependency)

## Decisions Made
- SEO.astro follows 03-RESEARCH.md Pattern 3 exactly (`new URL(Astro.url.pathname, Astro.site)` / `new URL(ogImage, Astro.site)`) rather than any string concatenation
- OG SVG text uses the `Iowan Old Style`/`Palatino Linotype`/Georgia fallback stack — the same family FontaineTransform already maps `Source Serif 4` to in `astro.config.mjs` — for visual continuity with the site's own serif fallback, since sharp's SVG rasterizer needs a system-available font family rather than the self-hosted woff2
- `@astrojs/sitemap` pinned as the literal string `3.7.3` (no `^`) in `package.json`, with a follow-up `npm install` to sync `package-lock.json`'s `requires` entry to the same exact string — the plan's acceptance criterion explicitly calls out "exact, not a caret range that could drift"

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `sharp.toFile()` requires a string path, not a `URL` object**
- **Found during:** Task 2, first run of `scripts/render-og.mjs`
- **Issue:** The plan's Pattern 4 example passes a `new URL(...)` directly to `.toFile()`; sharp's `toFile()` throws `Error: Missing output file path` when given a `URL` instance instead of a string.
- **Fix:** Converted the output URL to a filesystem path via `fileURLToPath()` before calling `.toFile()`.
- **Files modified:** `scripts/render-og.mjs`
- **Verification:** `node scripts/render-og.mjs` now exits 0 and writes the PNG
- **Committed in:** `4b77d87` (Task 2 commit)

**2. [Rule 1 - Bug] SVG header comment contained `--` inside an XML comment, which is invalid XML**
- **Found during:** Task 2, second run of `scripts/render-og.mjs`
- **Issue:** The first draft of `og-source.svg`'s header comment used `--token-name` notation (e.g. `--bg #0f1216`) inside an XML `<!-- -->` comment. XML forbids `--` inside comments; sharp's underlying SVG parser (glib/librsvg) rejected the file with `Comment must not contain '--' (double-hyphen)`.
- **Fix:** Rewrote the header comment to describe token names without the `--` CSS custom-property prefix (e.g. `bg #0f1216`).
- **Files modified:** `og-source.svg`
- **Verification:** `node scripts/render-og.mjs` parses and rasterizes successfully; output PNG confirmed 1200x630
- **Committed in:** `4b77d87` (Task 2 commit)

**3. [Rule 3 - Blocking, verification-only] Plan's literal `grep -c '<url>'` sitemap-count check undercounts on minified single-line XML**
- **Found during:** Task 3 verification
- **Issue:** Same class of issue documented in 03-02-SUMMARY.md: `@astrojs/sitemap` writes `dist/sitemap-0.xml` as a single line, so `grep -c '<url>'` (which counts matching *lines*, not occurrences) returns `1` instead of `3`, even though the sitemap correctly contains exactly 3 `<url>` entries.
- **Fix:** Verified with `grep -o '<url>' dist/sitemap-0.xml | wc -l` (occurrence count) → `3`, and confirmed the 3 distinct `<loc>` values (home, both case-study routes) plus zero `404` matches. No application code changed — this is a verification-methodology correction, not a behavior fix.
- **Files modified:** none (verification only)
- **Committed in:** n/a (no code change; documented here for traceability)

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bug fixes in the OG rasterizer script/SVG, 1 Rule 3 verification-methodology correction — no shipped-behavior impact)
**Impact on plan:** None on the shipped outcome — all three acceptance bars (SEO meta, OG image, sitemap+robots.txt) are met exactly as specified; the two Rule 1 fixes were necessary to make the OG script actually run, and the Rule 3 correction only affects how the "exactly 3 URLs" fact was proven, not the fact itself.

## Issues Encountered
None beyond the auto-fixed deviations above. `npm run build` and `npx astro check` (0 errors/warnings/hints) both passed after every task.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Every page now ships full SEO/OG/twitter meta, a static OG image, and a 3-URL sitemap + robots.txt — PLAT-06 fully delivered, ready for 03-04's live-URL SEO/Lighthouse checks
- `dist/sitemap-0.xml` and `dist/robots.txt` are generated fresh on every `npm run build`, so no further wiring is needed before deploy (plan 03-04)
- No blockers.

---
*Phase: 03-case-studies-launch-polish*
*Completed: 2026-07-17*

## Self-Check: PASSED

All created/modified files verified present on disk (`src/components/SEO.astro`, `og-source.svg`, `scripts/render-og.mjs`, `public/og/og-default.png`, `public/robots.txt`, `src/layouts/BaseLayout.astro`, `astro.config.mjs`, this SUMMARY.md). All three task commit hashes (`ab8b8e8`, `4b77d87`, `18cfc29`) verified present in `git log`. `npm run build` and `npx astro check` both pass with 0 errors after every task.
