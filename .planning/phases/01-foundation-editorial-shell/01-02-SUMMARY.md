---
phase: 01-foundation-editorial-shell
plan: 02
subsystem: ui
tags: [css, custom-properties, astro, fontsource, fontaine, fonttools, self-hosted-fonts]

# Dependency graph
requires:
  - phase: 01-foundation-editorial-shell
    provides: Buildable Astro 7 static project skeleton, astro.config.mjs (site/output locked)
provides:
  - "Single design-token source: src/styles/tokens.css (12 locked colors + 3 font stacks)"
  - "src/styles/global.css: reset, body/link base rules, day-one :focus-visible outline"
  - "Self-hosted subsetted fonts: Source Serif 4 @500 (unchanged fontsource file), Cascadia Code @400 (re-subset from local Windows font to include U+2192)"
  - "src/styles/fonts.css: two hand-authored @font-face rules, font-display:swap"
  - "astro.config.mjs vite.plugins: FontaineTransform with per-family fallback map (metrics-matched CLS-free fallback)"
  - "src/layouts/BaseLayout.astro: head shell, font preloads, single import point for the three stylesheets, slot"
affects: [01-03-PLAN (SiteHeader/Hero components read tokens.css + wrap in BaseLayout), 01-06-PLAN (index.astro composes BaseLayout with sections), all subsequent Phase 1 component plans]

# Tech tracking
tech-stack:
  added:
    - "@fontsource/source-serif-4@5.2.9 (dev dep — file copied to public/, package itself not shipped)"
    - "@fontsource/cascadia-code@5.2.3 (dev dep, installed for reference/version-audit only — the actual shipped woff2 was re-subset from a different source, see decisions)"
    - "fontaine@0.8.0 (Vite plugin, metrics-matched font fallback generation)"
    - "brotli@1.3.3 (fontaine peer/optional dep for woff2 compression during metrics calc)"
    - "@astrojs/check@0.9.9 + typescript@6.0.3 (dev deps — required for `astro check`, not previously installed)"
    - "fonttools (Python, via `py -m pip install fonttools brotli`) — one-time build-time tool, not an npm/project runtime dependency"
  patterns:
    - "tokens.css is the sole file allowed to declare hex/font-stack literals; every other CSS file (and, later, the Fig.01 canvas module) reads via var(--token)"
    - "fonts.css hand-authors @font-face rules directly rather than importing @fontsource's per-subset CSS bundle"
    - "fontaine registered with an explicit per-family fallback object ({'Source Serif 4': ['Georgia'], 'Cascadia Code': ['Consolas']}), not the array shape — resolves 01-RESEARCH.md Open Question 1"
    - "BaseLayout.astro is the single import point for tokens.css/fonts.css/global.css — no other file may import them"

key-files:
  created:
    - src/styles/tokens.css
    - src/styles/global.css
    - src/styles/fonts.css
    - public/fonts/source-serif-4-latin-500-normal.woff2
    - public/fonts/cascadia-code-latin-400-normal.woff2
    - src/layouts/BaseLayout.astro
  modified:
    - astro.config.mjs
    - package.json
    - package-lock.json

key-decisions:
  - "Re-subset Cascadia Code from the locally installed C:\\Windows\\Fonts\\CascadiaCode.ttf rather than the @fontsource/cascadia-code npm package, since the fontsource package's shipped latin subset verifiably lacks U+2192 (the right-arrow glyph used in every hero link) while the local Windows font's cmap includes it"
  - "Used fontaine's object-based per-family fallback config ({'Source Serif 4': ['Georgia'], 'Cascadia Code': ['Consolas']}) rather than the single-array shape, resolving 01-RESEARCH.md's Open Question 1 by reading fontaine's own README directly (confirms object config is the documented mechanism for multi-family fallback matching)"
  - "Confirmed typescript@7.0.2 is a real, current release (not a dist-tag anomaly as research flagged) via `npm view typescript versions --json`, which shows a genuine 5.x -> 6.0.x -> 7.0.x progression; let npm/astro's own dependency range resolve the installed version rather than pinning 7.0.2 directly — it resolved to typescript@6.0.3"

requirements-completed: [SHELL-05, PLAT-04]

coverage:
  - id: D1
    description: "tokens.css declares all 12 locked color tokens (exact hex) + 3 font-stack tokens as the sole literal source; global.css reads only var(--token), zero hex literals, includes a day-one :focus-visible outline"
    requirement: "SHELL-05"
    verification:
      - kind: other
        ref: "grep checks for each locked color/stack value in tokens.css; grep -cE '#[0-9a-fA-F]{6}' global.css returns 0; grep for focus-visible in global.css"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both faces self-hosted as subsetted woff2 in public/fonts/; Cascadia Code cmap verified (via fontTools) to include U+2192, closing the researched glyph gap; fonts.css hand-authors two @font-face rules with font-display:swap and does not import @fontsource CSS"
    requirement: "PLAT-04"
    verification:
      - kind: other
        ref: "test -f on both woff2 paths; py fontTools cmap check for 0x2192 in cascadia-code-latin-400-normal.woff2 (passed, U+2192 present); grep checks on fonts.css for two @font-face blocks + font-display:swap"
        status: pass
    human_judgment: false
  - id: D3
    description: "fontaine's FontaineTransform registered in astro.config.mjs vite.plugins with a per-family fallback map (serif -> Georgia, mono -> Consolas); npm run build exits 0 with the transform active"
    requirement: "PLAT-04"
    verification:
      - kind: other
        ref: "grep -c FontaineTransform astro.config.mjs; npm run build exit code 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "BaseLayout.astro imports tokens.css/fonts.css/global.css exactly once, preloads both self-hosted fonts, has html lang=en/charset/viewport/title/description/favicon, renders a single slot; astro check reports 0 errors"
    requirement: "SHELL-05"
    verification:
      - kind: other
        ref: "grep checks on BaseLayout.astro for preload links, stylesheet imports, slot count; `npx astro check` output (0 errors, 0 warnings, 0 hints)"
        status: pass
    human_judgment: false

# Metrics
duration: ~20min
completed: 2026-07-16
status: complete
---

# Phase 1 Plan 2: Design Tokens, Font Pipeline & Base Layout Summary

**Single-source `tokens.css` (12 locked colors + 3 font stacks), a self-hosted/re-subset font pipeline (Source Serif 4 @500, Cascadia Code @400 with the U+2192 arrow glyph gap closed via a local-font re-subset), fontaine-generated metrics-matched fallbacks, and the `BaseLayout.astro` shell that preloads both fonts and imports all three stylesheets once.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-16T22:57:41Z
- **Completed:** 2026-07-16T23:06:17Z
- **Tasks:** 3/3
- **Files modified:** 9 (3 new CSS/layout files, 2 new woff2 assets, astro.config.mjs, package.json/package-lock.json, plus dev-dep additions for `astro check`)

## Accomplishments

- `src/styles/tokens.css` declares all 12 locked colors (`--bg`, `--panel`, `--panel2`, `--ink`, `--body`, `--dim`, `--faint`, `--hair`, `--hair2`, `--accent`, `--good`, `--amber`) and the 3 font-stack tokens (`--mono`, `--serif`, `--sans`) verbatim from the approved prototype — the single literal source for the whole site
- `src/styles/global.css` applies the base reset/typography (box-sizing, body 15px/1.6 sans, link underline/hover) reading exclusively via `var(--token)`, plus a visible `:focus-visible` outline (day-one keyboard accessibility)
- Self-hosted both faces: Source Serif 4 @500 copied unchanged from `@fontsource/source-serif-4`; Cascadia Code @400 **re-subset from the locally installed `C:\Windows\Fonts\CascadiaCode.ttf`** (not the npm package) specifically to include U+2192 — verified present in the shipped woff2's cmap via fontTools, closing the researched arrow-glyph gap for `résumé →` / `linkedin →` / `github →`
- `src/styles/fonts.css` hand-authors both `@font-face` rules (`font-display: swap`), no `@fontsource/*` CSS import
- `astro.config.mjs` registers `FontaineTransform.vite()` with a per-family fallback map (`Source Serif 4` → `Georgia`, `Cascadia Code` → `Consolas`), resolving the multi-family config open question directly from fontaine's own README
- `src/layouts/BaseLayout.astro` is the single site shell: preloads both woff2 fonts, imports all three stylesheets exactly once, sets factual-tone default title/description, links the SVG favicon, and renders one `<slot />`
- `npx astro check` reports 0 errors/0 warnings/0 hints; `npm run build` exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Author tokens.css (single source) and global.css (reset + base type)** - `ae94801` (feat)
2. **Task 2: Self-host fonts, resolve U+2192, wire fontaine fallback metrics** - `e7e95d7` (feat)
3. **Task 3: Author BaseLayout.astro (head shell, font preloads, style imports, slot)** - `ad09d39` (feat)

_Plan-metadata commit added after this SUMMARY and STATE.md update._

## Files Created/Modified

- `src/styles/tokens.css` - `:root` block, 12 color tokens + 3 font-stack tokens, sole literal source
- `src/styles/global.css` - reset, body/link base rules, `:focus-visible` outline
- `src/styles/fonts.css` - two hand-authored `@font-face` rules (Source Serif 4 @500, Cascadia Code @400)
- `public/fonts/source-serif-4-latin-500-normal.woff2` - unchanged copy from `@fontsource/source-serif-4`
- `public/fonts/cascadia-code-latin-400-normal.woff2` - re-subset via `pyftsubset` from local Windows Cascadia Code TTF, includes U+2192
- `src/layouts/BaseLayout.astro` - site shell: head/meta/favicon/preloads, style imports, slot
- `astro.config.mjs` - added `vite.plugins: [FontaineTransform.vite({...})]`
- `package.json` / `package-lock.json` - added `@fontsource/source-serif-4`, `@fontsource/cascadia-code`, `fontaine`, `brotli`, `@astrojs/check`, `typescript` as dev deps

## Decisions Made

- Re-subset Cascadia Code from a locally installed Windows font rather than the `@fontsource/cascadia-code` npm package, because the fontsource package's shipped `latin` subset verifiably excludes U+2192 (confirmed via fontTools cmap inspection of both sources) — the local TTF's cmap does include it
- Used fontaine's object-based per-family `fallbacks` config (`{'Source Serif 4': ['Georgia'], 'Cascadia Code': ['Consolas']}`) rather than the single-array shape, per fontaine's own README ("Category-Aware Fallbacks" / "Per-family override" priority) — resolves 01-RESEARCH.md Open Question 1 definitively rather than guessing
- Verified `typescript@7.0.2` is a genuine current release (via `npm view typescript versions --json`, showing a real 5.x→6.0.x→7.0.x progression), so it is not the dist-tag anomaly research flagged; let npm resolve the installed version through astro's own dependency range instead of pinning it directly — resolved to `typescript@6.0.3`
- Installed `@astrojs/check` + `typescript` as dev dependencies (not explicitly listed in the plan's `files_modified`, but required for the plan's own acceptance criterion "`npx astro check` reports 0 errors" — Rule 3, blocking)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed `@astrojs/check` + `typescript` dev dependencies to run `astro check`**
- **Found during:** Task 3 (BaseLayout.astro verification)
- **Issue:** The plan's Task 3 verify step runs `npx astro check`, but neither `@astrojs/check` nor `typescript` were installed in the project (scaffolded in plan 01-01 without them) — running it triggered an interactive install prompt
- **Fix:** Installed both directly (`npm install -D @astrojs/check typescript`) to avoid an interactive prompt in a non-interactive execution context; verified the resolved `typescript` version (6.0.3) is not the anomalous `7.0.2` `latest` tag flagged in 01-RESEARCH.md Pitfall 4, by inspecting the full version history (`npm view typescript versions --json`) and confirming a genuine incremental release progression
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** `npx astro check` now runs non-interactively and reports 0 errors/0 warnings/0 hints
- **Committed in:** `ad09d39` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Necessary to satisfy the plan's own Task 3 acceptance criterion ("`npx astro check` reports 0 errors"); no scope creep beyond what the plan's verify step already required.

## Issues Encountered

- The `@fontsource/cascadia-code` npm package's shipped `latin` subset does not cover U+2192 (confirmed directly, matching 01-RESEARCH.md Pitfall 1) — resolved via option (b) from the research (re-subset with `pyftsubset` to include the glyph explicitly), using a locally available Windows Cascadia Code TTF as the source rather than downloading the OFL release, since the local font's cmap already contained the needed glyph and its family/style metadata matched (`Cascadia Code`, `Regular`).
- `fonttools` was not pre-installed in the Python environment; installed via `py -m pip install fonttools brotli` as a one-time build-time tool per the plan's explicit instruction (not a project runtime dependency, not committed to package.json).

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

- Design tokens, fonts, and the base layout shell are complete and verified (`astro check` clean, `npm run build` exits 0) — ready for plan 01-03 (SiteHeader/Hero components) to read `tokens.css` and wrap content in `BaseLayout`
- `index.astro` still holds the scaffold placeholder markup (unchanged this plan, per scope — plan 01-06 replaces it with the full page composition)
- No blockers carried forward; the U+2192 fallback path was not needed since the primary (in-family glyph) resolution succeeded
- Note for future font-pipeline maintenance: the shipped Cascadia Code woff2 was subset from a local Windows system font rather than a pinned upstream OFL release artifact — if this font pipeline is ever rebuilt on a machine without that exact system font installed, the subsetting step will need an alternative source (the official microsoft/cascadia-code OFL release), per 01-RESEARCH.md's documented fallback path

## Self-Check: PASSED

All created files verified present on disk (tokens.css, global.css, fonts.css, both woff2 fonts, BaseLayout.astro); all 3 task commit hashes (ae94801, e7e95d7, ad09d39) verified present in git log; `npx astro check` and `npm run build` both verified passing in this session.

---
*Phase: 01-foundation-editorial-shell*
*Completed: 2026-07-16*
