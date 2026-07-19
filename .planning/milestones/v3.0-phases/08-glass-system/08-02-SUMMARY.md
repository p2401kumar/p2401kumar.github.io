---
phase: 08-glass-system
plan: 02
subsystem: glass-chrome
tags: [glassmorphism, backdrop-filter, tokens, contrast-gate, degradation, has-sky, lightningcss]
requires:
  - "08-01: --cdp-screenshot gate + pre-glass baseline (incl. the two pre-existing failures this plan had to clear)"
  - "07-SPIKE-GLASS: blur(12px) default / 16px ceiling / <=4 simultaneous surfaces budget"
provides:
  - "13 --glass-* tokens in tokens.css (tier-1 optical / chrome / tier-2 protected / shared edge) — values gate-certified"
  - "Glass on .panel[data-state=active] + html.classic-active .panel, header/footer (body.has-sky-scoped), jump-index pill+list"
  - "Degradation ladders: @supports + prefers-reduced-transparency additive gates (declare-nothing fallback), !important print strip"
  - "08-02-glass-gate.md: full gate record — every surface >= 4.5:1 both viewports, zero escalations"
affects:
  - "08-03: CPU re-proof + Lighthouse re-run inherit this exact glass CSS"
tech-stack:
  added: []
  patterns:
    - "background-color longhand for glass fills so the classic-mode scrim gradient (background shorthand) survives"
    - "vite.build.cssTarget pinned — lightningcss otherwise collapses -webkit-/standard backdrop-filter pairs (last-wins)"
    - "DeckIndex as root-level sibling of .deck — fixed sub-chrome must not live inside a lower stacking context than glass chrome"
key-files:
  created:
    - .planning/phases/08-glass-system/08-02-glass-gate.md
    - .planning/phases/08-glass-system/glass-evidence/ (gate JSONs, screenshot pairs, computed-style checks)
  modified:
    - src/styles/tokens.css
    - src/styles/deck.css
    - src/components/SiteHeader.astro
    - src/components/SiteFooter.astro
    - src/components/DeckIndex.astro
    - src/components/PanelDeck.astro
    - src/layouts/BaseLayout.astro
    - src/pages/index.astro
    - src/lib/nightsky/deck.ts
    - astro.config.mjs
decisions:
  - "Tier assignment shipped exactly as the UI-SPEC starting classification — the gate demanded zero escalations"
  - "Glass fills use background-color longhand (not shorthand) to preserve the classic-mode scrim per the UI-SPEC scrim lock"
  - "Print strip carries !important (sole use in codebase) — scoped glass rules out-specify any plain print rule"
  - "vite build.cssTarget pinned to chrome110/edge110/firefox115/safari15.4/ios15.4 so shipped CSS keeps BOTH backdrop-filter forms"
  - "DeckIndex relocated outside .deck: fixed z-21 sub-chrome was trapped under z-20 chrome by .deck's stacking context"
metrics:
  duration: "~85 min"
  completed: "2026-07-19"
  tasks: 2
  files: 12
status: complete
---

# Phase 8 Plan 02: Glass System — Tokens, Application, Screenshot Gate Summary

**One-liner:** 13 gate-certified `--glass-*` tokens + frosted glass on active panels/header/footer/jump-index with full degradation ladders — the screenshot gate passed both true viewports with ZERO tier escalations, clearing both 08-01 pre-existing failures (experience 3.636→12.115, header 4.335→6.234), plus two real bugs found and fixed that the plan didn't anticipate (lightningcss prefix-stripping, DeckIndex stacking trap).

## What was built

### Task 1 — 13 tokens + glass CSS (943baea)
- **tokens.css:** the 13-token manifest pasted verbatim (tier-1 `rgb(255 255 255 / 0.06)`/12px/150%/0.90 · chrome `rgb(255 255 255 / 0.05)`/10px/140%/0.92 · tier-2 `rgb(15 18 23 / 0.55)`/10px/130%/0.96 · `--glass-edge rgb(255 255 255 / 0.10)`), 16px ceiling as prose only, zero hex.
- **deck.css:** additive `@supports (backdrop-filter…) or (-webkit-…)` → `@media (prefers-reduced-transparency: no-preference)` nest. Tier-1 on `html.deck-active .panel[data-state="active"]` + `html.classic-active .panel`; tier-2 override keyed by `data-panel-id` (experience/patents/skills) in both modes. Never bare `.panel`, never inactive, never a descendant. 1px `border-top` light edge (no second blurred element). Print strip for panel+chrome.
- **SiteHeader/SiteFooter:** chrome recipe under `body.has-sky` — /work/* and /404 match no rule (verified in dist: their `<body>` carries no class).
- **DeckIndex:** chrome recipe overrides the pill + jump list (desktop popover and mobile sheet); base `--bg`/`--hair2` rules kept as the declare-nothing fallback; only the top border swaps to the glass edge.
- **BaseLayout/index:** `hasSky` prop → `<body class="has-sky">` on index only.
- **Fig. 01:** Figure01.astro untouched; `.fig` keeps opaque `var(--panel)` (grep-asserted zero `var(--glass`).

### Task 2 — screenshot gate + evidence (2e1d213, fix a8191db)
Gate PASS at both true viewports on the starting tier assignment — full table, worst-region identities, escalation log (empty), classic spot check, and degradation evidence in `08-02-glass-gate.md`. Final numbers: hero 13.40/13.55 · systems 13.22/13.37 · experience 12.12/15.06 · patents 15.55/15.55 · skills 15.55/15.58 · contact 14.02/14.02 · header 6.33/6.23 · footer 12.11/12.28 · jump-index 10.29/10.60.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Vite/lightningcss stripped the backdrop-filter pair from shipped CSS**
- **Found during:** Task 1 dist inspection (research assumption A2's mandated build check)
- **Issue:** Vite 8 minifies CSS with lightningcss and passes it `convertTargets(build.cssTarget)`; with no explicit target it collapses a `-webkit-backdrop-filter`+`backdrop-filter` pair to the LAST declaration only — the shipped CSS carried only one form, defeating the Pitfall-6 dual-write floor in production (source greps would still pass). Empirically reproduced against the installed lightningcss; `css.lightningcss.targets` is ignored by the minify pass.
- **Fix:** source order flipped to prefix-first/standard-last (canonical convention) + explicit `vite.build.cssTarget: ['chrome110','edge110','firefox115','safari15.4','ios15.4']` in astro.config.mjs. Dist now ships BOTH forms and the full two-branch `@supports` condition; scrim RCS gradient verified unaffected.
- **Files modified:** astro.config.mjs (outside plan's files_modified — build config, floors untouched), deck.css, SiteHeader/SiteFooter/DeckIndex.astro
- **Commit:** 943baea

**2. [Rule 1 - Bug] Print strip lost the cascade without !important**
- **Found during:** Task 1 (specificity analysis, confirmed by print-emulation computed-style checks)
- **Issue:** the plan's verbatim `@media print { .panel, header, footer, … }` rule (specificity (0,1,0)/(0,0,1)) silently loses to the glass rules (state-qualified + Astro `[data-astro-cid-*]` attribute scoping, (0,2,x)) — it would have stripped nothing.
- **Fix:** `!important` on the four print declarations (sole use in the codebase; print is a terminal state no cascade participant should beat). CDP print-emulation verifies `backdrop-filter: none` on panel/header/pill.
- **Files modified:** src/styles/deck.css · **Commit:** 943baea

**3. [Rule 2 - Missing critical correctness] Glass fill as background-color longhand to preserve the classic scrim**
- **Found during:** Task 1 design
- **Issue:** the plan says "sets background var(--glass-bg)" — the shorthand would reset `background-image` and delete the SKY-05 scrim gradient in classic mode (where the scrim lives on `html.classic-active .panel`'s background), contradicting the UI-SPEC Scrim Interaction lock ("KEEP … in both modes").
- **Fix:** panel glass fills use `background-color` longhand; classic mode verifiably composites scrim gradient + glass fill together (computed-style evidence). Chrome surfaces keep the shorthand (they must replace the pill's solid `--bg`).
- **Files modified:** src/styles/deck.css · **Commit:** 943baea

**4. [Rule 1 - Bug] Footer glass smeared the jump-index pill — DeckIndex trapped in .deck's stacking context**
- **Found during:** Task 2 visual evidence review (the gate itself PASSED — it hides glyphs pre-capture and measures contrast, not glyph integrity, so it is architecturally blind to this)
- **Issue:** `.deck` (position:fixed, z-index:1) is a stacking context; the fixed pill/hint/mode-links (z-index 21) inside it painted BELOW the z-index-20 footer, so the footer's new backdrop-filter blurred them into its backdrop — "01 / 07" rendered as an illegible smudge. Latent since Phase 4, invisible while the chrome painted nothing.
- **Fix:** `<DeckIndex />` moved outside `.deck` in PanelDeck.astro (relocation, zero new DOM, zero geometry change — fixed elements are viewport-anchored); deck.ts's six DeckIndex hook queries widened to document scope (all ids/classes globally unique). Pill verified sharp above the footer glass; gate re-run both widths post-fix (final table is the post-fix record).
- **Files modified:** src/components/PanelDeck.astro, src/lib/nightsky/deck.ts (both outside plan's files_modified) · **Commit:** a8191db

### Not exercised
- The contemplated has-sky-scoped camper-glow alpha reduction (Rule 2 candidate flagged in the orchestrator brief) was NOT needed — tier-2 cleared experience@1280 at 12.115.
- No tier escalations; no stop-and-escalate; `content-visibility: auto` classic lever documented but not applied.

## Authentication gates
None.

## Known Stubs
None — all glass rules are wired to shipped tokens; no placeholders.

## Threat Flags
None — T-08-02 mitigated (gate ≥4.5 everywhere before values locked); T-08-SC held (zero installs, package.json byte-identical); no new endpoints/auth/trust boundaries. deck.ts change is query-scope only (no new input handling).

## Verification summary
- `astro check` 0 errors/warnings/hints; build green (4 pages + sitemap)
- Exactly 13 `--glass-*` tokens; zero hex outside tokens.css (identifier-boundary regex for DeckIndex `#deck-*` ids)
- Bare `html.deck-active .panel {` opener count unchanged (3); inactive block glass-free; backdrop-filter/-webkit 2:1 substring parity holds in source AND both forms verified in dist
- `--cdp-screenshot` exit 0 at 1280×800 and 1440×900 (final runs post-stacking-fix)
- `--selftest` PASS (scrim 0.38 sync check green); Figure01.astro untouched
- Reduced-transparency CDP emulation verified working (`matchMedia` true) — no manual-flag protocol needed
- package.json / package-lock / .planning/config.json untouched; single-rAF counts unchanged (scene.ts untouched); no push

## Commits

| # | Commit | Description |
|---|---|---|
| Task 1 | 943baea | 13 glass tokens + glass CSS + hasSky wiring + cssTarget fix |
| fix | a8191db | DeckIndex out of .deck stacking context (footer-glass smear) |
| Task 2 | 2e1d213 | Gate PASS record + escalation log + full evidence set |

## Self-Check: PASSED
