---
phase: 01-foundation-editorial-shell
verified: 2026-07-17T03:42:22Z
status: gaps_found
score: 4/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "A footer with a live Seattle clock and 'all systems operational' status line, and the mono header (name · seattle · nav), appear on every page (ROADMAP Phase 1 Success Criterion 4; REQUIREMENTS.md SHELL-01 explicitly says 'on every page')"
    status: failed
    reason: "src/pages/404.astro wraps its content only in BaseLayout — it does not import or render <SiteHeader /> or <SiteFooter />. The built dist/404.html and the equivalent source contain zero matches for <header>, <footer>, 'all systems operational', or 'seattle'. The header/footer/clock only exist on index.astro. Since the site currently has exactly two pages (home, 404), 'every page' is a two-page contract and one of the two pages fails it."
    artifacts:
      - path: "src/pages/404.astro"
        issue: "Missing <SiteHeader /> and <SiteFooter /> imports/usage — only BaseLayout wraps a standalone 404 message block (404 label, 'this route doesn't exist.', 'back to work →' link)"
    missing:
      - "Import and render <SiteHeader /> and <SiteFooter /> in src/pages/404.astro so the header nav and the live-clock/status footer appear on every page, matching ROADMAP SC4 and REQUIREMENTS.md SHELL-01 verbatim"
deferred:
  - truth: "In-browser visual QA: hero renders with no visible CLS/FOUT, the → glyph renders cleanly, the footer clock visibly ticks, layout holds at 360px, and the résumé PDF click-through works on the live URL"
    addressed_in: "Phase 3"
    evidence: "01-07-SUMMARY.md documents this was attempted via headless browser tooling which failed to start on the executor's machine, and explicitly defers it to 'the Phase 3 polish/Lighthouse verification pass, where full browser-based QA is already planned.' Phase 3's ROADMAP goal is 'the whole site is verified for performance, accessibility, and SEO before recruiters see the link,' which covers this. Per the orchestrator's explicit verification_notes for this run, this deferral is pre-accepted and is not scored as a gap here."
  - truth: "OG image, sitemap, full page meta, Lighthouse ≥ 90 gate"
    addressed_in: "Phase 3"
    evidence: "ROADMAP Phase 3 Success Criteria 3-4 (PLAT-06/PLAT-07) explicitly own this scope; 01-CONTEXT.md's own Phase Boundary explicitly excludes it from Phase 1."
---

# Phase 1: Foundation & Editorial Shell Verification Report

**Phase Goal:** A fully deployed, content-complete static portfolio exists — recruiters can read positioning, experience, systems, patents, and skills, and reach contact/résumé, on a live GitHub Pages URL.
**Verified:** 2026-07-17T03:42:22Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Phase 1 Success Criteria — authoritative contract)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor lands on the live GitHub Pages URL and sees the mono header (name · seattle · nav), serif thesis hero, and one-line bio naming Microsoft/AWS/Samsung within the first viewport | ✓ VERIFIED | `curl https://p2401kumar.github.io/` returns 200; live HTML contains `<header>` with `prateek kumar · seattle` + nav (work/résumé/contact), `<h1>I build the infrastructure that intelligence runs on.</h1>`, and the bio paragraph naming Microsoft/AWS/Samsung — matches `dist/index.html` built locally byte-for-byte in content |
| 2 | Visitor can reach the downloadable PDF résumé, LinkedIn, GitHub, and contact (mailto) via quiet text links in the header, hero, or footer | ✓ VERIFIED | Live: `/prateek-kumar-resume.pdf` → 200, begins with `%PDF-`; Hero links `résumé →` (download attr), `linkedin →`/`github →` (`target="_blank" rel="noopener noreferrer"`); ContactSection `mailto:p2401kumar@gmail.com` + LinkedIn, both present in built/live HTML |
| 3 | Visitor can scan the selected-systems list (4 entries with date/name/one-liner/metric), read experience entries for Microsoft/AWS/MathWorks/Samsung, view patents & publications, and read skills as grouped prose/mono tags — every displayed metric carries a traceable `source` annotation | ✓ VERIFIED | `dist/index.html` contains all 4 system rows (`azure/health-snapshots`, `dynamodb/cellularization`, `elb/auto-weight-away`, `iot/contextual-widget`) with metrics; 4 experience entries (Microsoft/AWS/MathWorks/Samsung); 2 patents + 1 publication; 4 skill groups as plain mono tags (no bars/logos, confirmed by hex/percent grep = 0). Honesty gate: `grep -c "source:"` = 4 (systems.ts) + 4 (experience.ts) + 3 (patents.ts) = 11, matching 11 metric-bearing entries; every `source:` string is a substantive résumé pointer (e.g. `resume-4.5 §AWS — DynamoDB cellularization (+30% reliability, −20% p99 latency)`), not a placeholder |
| 4 | Visitor sees a footer with a live Seattle clock and "all systems operational" status line **on every page** | ✗ FAILED | `src/pages/index.astro` renders `<SiteFooter />` correctly (verified live: `all systems operational` + `seattle` + inline `tick()` script present). But `src/pages/404.astro` renders **only** `BaseLayout` + a bare notfound block — no `<SiteHeader />`/`<SiteFooter />` import or usage. `dist/404.html` has 0 matches for `<header`, `<footer`, `all systems operational`, `seattle`. See Gap 1. |
| 5 | Site renders responsively from 360px through desktop using self-hosted subsetted fonts with no visible CLS/FOUT on the hero, all from a single design-token source, and auto-deploys to GitHub Pages on push to main | ✓ VERIFIED | `src/styles/tokens.css` is the sole file declaring the 12 locked color tokens + 3 font-stack tokens; 0 hex literals across every other CSS/`.astro` scoped style (component-by-component grep); both faces self-hosted under `public/fonts/*.woff2`, Cascadia cmap confirmed to include U+2192 via fontTools; `fontaine`'s `FontaineTransform` registered in `astro.config.mjs` for metrics-matched fallback (CLS mitigation); built CSS contains `@media (width<=640px){.row{grid-template-columns:52px 1fr}.row .mt{display:none}}` (PLAT-05); `.github/workflows/deploy.yml` triggers on push to `main`, uses the verified `checkout@v7`/`withastro/action@v6`/`deploy-pages@v5` trio with minimal permissions; live Pages `build_type` = `workflow`; latest Actions run `29549602224` on `deploy.yml`/`main` is `completed`/`success` |

**Score:** 4/5 truths verified (0 present, behavior-unverified)

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases (per this run's orchestrator-provided accepted deferrals and ROADMAP Phase 3 scope).

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | In-browser visual QA (CLS, arrow-glyph rendering, live clock tick, 360px responsive, résumé PDF click-through) on the live URL | Phase 3 | 01-07-SUMMARY.md: headless browser tooling failed to start; explicitly deferred to "the Phase 3 polish/Lighthouse verification pass." Orchestrator verification_notes for this run pre-accept this deferral. |
| 2 | OG image, sitemap, full page meta, Lighthouse ≥ 90 gate | Phase 3 | ROADMAP Phase 3 Success Criteria 3–4 (PLAT-06/PLAT-07); 01-CONTEXT.md Phase Boundary explicitly excludes this from Phase 1. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `astro.config.mjs` | `site` set, no `base`, `output: 'static'`, FontaineTransform registered | ✓ VERIFIED | Exactly 3 top-level keys + vite.plugins; grep confirms no active `base:` key |
| `.github/workflows/deploy.yml` | checkout@v7 → withastro/action@v6 → deploy-pages@v5, minimal permissions | ✓ VERIFIED | Exact trio present; permissions = `contents:read, pages:write, id-token:write` only |
| `public/prateek-kumar-resume.pdf` | Valid PDF, downloadable | ✓ VERIFIED | `%PDF-` signature; live 200 |
| `public/favicon.svg` | Locked palette mark | ✓ VERIFIED | Present, referenced from BaseLayout, live 200 |
| `src/styles/tokens.css` | Sole literal color/font-stack source | ✓ VERIFIED | 12 colors + 3 stacks, exact locked hex values |
| `src/styles/fonts.css` / `global.css` | Font-face + reset, zero hex literals | ✓ VERIFIED | 0 hex literals; `:focus-visible` present |
| `public/fonts/*.woff2` (2 files) | Self-hosted subsetted fonts, U+2192 resolved | ✓ VERIFIED | Both present; Cascadia cmap includes U+2192 (fontTools-confirmed) |
| `src/layouts/BaseLayout.astro` | Head shell, preloads, single style-import point, slot | ✓ VERIFIED | 2 preload links, 3 style imports, 1 slot |
| `src/data/*.ts` (6 files) | Typed content w/ `source` annotations | ✓ VERIFIED | All present, substantive (27–73 lines each), 11 `source:` fields covering 11 metric-bearing entries |
| `src/components/*.astro` (8 files) | SiteHeader, Hero, SiteFooter, SystemsList, ExperienceSection, PatentsSection, SkillsSection, ContactSection | ✓ VERIFIED | All present, substantive (54–95 lines each), all render from data, wired into index.astro, live-confirmed |
| `src/pages/index.astro` | Composes 8 components + Fig.01 slot comment in BaseLayout | ✓ VERIFIED | Locked order confirmed in both dist/index.html and live HTML |
| `src/pages/404.astro` | Factual 404 in site voice | ⚠️ PARTIAL | Renders correct copy (`404` / `this route doesn't exist.` / `back to work →`) but is missing `<SiteHeader />`/`<SiteFooter />` — see Gap 1 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `astro.config.mjs` site+no-base | asset/link resolution | user-root deploy | ✓ WIRED | Live asset paths are root-relative (`/fonts/...`, `/_astro/...`), no base prefix, confirmed on live URL |
| `deploy.yml` | GitHub Pages | push to `main` → Actions → Pages | ✓ WIRED | Pages `build_type=workflow`; run `29549602224` completed/success |
| `tokens.css` | all components | `var(--token)` reads, imported once via BaseLayout | ✓ WIRED | 0 hex literals outside tokens.css across all component/layout files |
| `src/data/profile.ts` | Hero/SiteHeader copy+links | typed import | ✓ WIRED | Rendered thesis/bio/links match `profile.ts` exactly in dist and live HTML |
| `src/data/systems.ts`/`experience.ts`/`patents.ts`/`skills.ts` | section components | typed import, mapped render | ✓ WIRED | All entries render; no hardcoded duplicate copy |
| footer clock script | `#clock` DOM element | `Intl.DateTimeFormat` + `setInterval(tick,30000)` | ✓ WIRED (index only) | Present and correct on index.astro; **absent entirely on 404.astro** (no `<SiteFooter />` there) |
| `index.astro` | 8 components + BaseLayout | imports + locked render order | ✓ WIRED | Confirmed order in dist/index.html: header → hero → Fig.01 comment → systems → experience → patents → skills → contact → footer |
| `404.astro` | BaseLayout only | header/footer NOT imported | ✗ NOT WIRED | `404.astro` does not import `SiteHeader` or `SiteFooter` — see Gap 1 |

### Data-Flow Trace (Level 4)

Not applicable in the traditional client/API sense — this is a static-data, build-time-rendered site. All data flows from `src/data/*.ts` typed modules directly into component templates at build time; there is no client fetch layer. Traced and confirmed real (non-empty, non-static-placeholder) data at every section: systems (4/4 real entries), experience (4/4), patents (2)+publications(1), skills (4 groups, all populated). No component renders a hardcoded-empty prop or an unpopulated state variable.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Local build succeeds, zero framework runtime | `npm run build` | Exit 0, 2 pages built (`/index.html`, `/404.html`); no React/Vue/Svelte in `package.json` | ✓ PASS |
| Type-check clean | `npx astro check` | 0 errors / 0 warnings / 0 hints (19 files) | ✓ PASS |
| Live site reachable and serves new content | `curl -s https://p2401kumar.github.io/` | 200, contains thesis/bio/systems/footer status; no 2021-era content | ✓ PASS |
| Résumé PDF, favicon, fonts, CSS reachable live | `curl -o /dev/null -w '%{http_code}'` on each asset | All 200 | ✓ PASS |
| Live 404 route returns 404 | `curl .../nonexistent-route-xyz` | 404 | ✓ PASS |
| Deploy workflow's latest run | `gh run list --workflow=deploy.yml -L 3` | `completed` / `success`, run `29549602224` | ✓ PASS |
| Footer clock actually ticks in a real browser | — | Not run (headless browser tooling unavailable in this environment) | ? SKIP — pre-accepted deferral to Phase 3 per orchestrator notes |

### Probe Execution

No `scripts/*/tests/probe-*.sh` convention or phase-declared probes found in this project. Step 7c: SKIPPED (no probes declared or discovered).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SHELL-01 | 01-04 | Mono header (name·seattle·nav) **on every page** | ⚠️ PARTIAL | Present and correct on index.astro; absent on 404.astro (Gap 1) |
| SHELL-02 | 01-04, 01-06 | Serif thesis + bio in first viewport | ✓ SATISFIED | Verified live + dist |
| SHELL-03 | 01-04 | Résumé/LinkedIn/GitHub links in hero | ✓ SATISFIED | Verified live + dist |
| SHELL-04 | 01-04 | Footer w/ live clock + status line | ✓ SATISFIED (index only; REQUIREMENTS.md text does not say "every page" for this ID, unlike ROADMAP SC4) | Verified on index; absent on 404 (see ROADMAP SC4 gap) |
| SHELL-05 | 01-02 | Single design-token source | ✓ SATISFIED | tokens.css sole literal source, 0 hex elsewhere |
| CONT-01 | 01-03, 01-05 | 4 selected-systems entries | ✓ SATISFIED | Verified |
| CONT-02 | 01-03, 01-05 | Microsoft/AWS/MathWorks/Samsung experience | ✓ SATISFIED | Verified |
| CONT-03 | 01-03, 01-05 | Patents & publications (2+1) | ✓ SATISFIED | Verified |
| CONT-04 | 01-03, 01-05 | Grouped mono skill tags, no bars | ✓ SATISFIED | Verified, no proficiency/percent markup |
| CONT-05 | 01-01, 01-04 | Downloadable PDF résumé | ✓ SATISFIED | Live 200, valid PDF signature |
| CONT-06 | 01-04, 01-05 | Contact via mailto/LinkedIn, header/footer | ✓ SATISFIED | Verified |
| CONT-07 | 01-03, 01-06 | Every metric traces to a `source` (honesty gate) | ✓ SATISFIED | 11 `source:` fields = 11 metric-bearing entries, all substantive |
| PLAT-01 | 01-01 | Static Astro 7, zero framework runtime | ✓ SATISFIED | No UI-framework integration in package.json |
| PLAT-02 | 01-01, 01-07 | Auto-deploy via GitHub Actions | ✓ SATISFIED | Live Pages build_type=workflow, latest run success |
| PLAT-03 | 01-01, 01-07 | Correct site/base link resolution | ✓ SATISFIED | Live asset paths root-relative, no base prefix |
| PLAT-04 | 01-02 | Self-hosted subsetted fonts, no CLS | ✓ SATISFIED (structural evidence; visual CLS check deferred to Phase 3 per accepted deferral) | Fonts self-hosted, U+2192 resolved, fontaine wired |
| PLAT-05 | 01-05, 01-06 | Responsive 360px–desktop | ✓ SATISFIED | 640px media rule confirmed in built CSS |

**Orphaned requirements:** None — all 17 Phase 1 requirement IDs traced to a plan and independently verified above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/pages/index.astro` | 7 | Comment: "Fig. 01 slot... Phase 2 fills it in" | ℹ️ Info | Intentional, explicitly-scoped forward reference to a planned Phase 2 insertion point — not a debt marker (no TBD/FIXME/XXX/TODO/HACK token used; references a real, roadmapped future phase). Not a gap. |
| — | — | No TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER tokens found in any `src/**/*.astro` or `src/**/*.ts` file | — | — |

No blocking anti-patterns found in the source. `PORTFOLIO-HANDOFF.md` (a stray, gitignored file at repo root, flagged for user attention in 01-01-SUMMARY.md) remains present but is excluded from the build and from version control — informational only, not a Phase 1 deliverable and not a gap.

### Human Verification Required

None required to resolve status — the only open item (Gap 1) is deterministically verifiable and fixable in source. The previously-identified visual-QA items (CLS, glyph render, clock tick, 360px in-browser, PDF click-through) are pre-accepted deferrals to Phase 3 per this run's orchestrator instructions, not open human-verification items for Phase 1 sign-off.

### Gaps Summary

One real gap: **`src/pages/404.astro` does not include the site header or footer**, so the mono header (name/seattle/nav) and the footer (live Seattle clock + "all systems operational" status line) do not appear "on every page" as both ROADMAP Phase 1 Success Criterion 4 and REQUIREMENTS.md SHELL-01 require verbatim. This was not caught by plan 01-06's own narrower must-haves (which only required the 404 page to render its own factual copy, not the shared shell), so it slipped past every plan-level acceptance gate and into a phase marked "17/17 requirements Complete." The fix is small and mechanical: import and render `<SiteHeader />` and `<SiteFooter />` in `404.astro` (matching `index.astro`'s composition pattern), then re-verify.

All four other roadmap success criteria are genuinely, substantively achieved: the site is live at the locked user-root URL, serves the correct new content (verified via live `curl`, not just local build), the honesty gate holds with real résumé-traceable source strings (not placeholder markers), the design-token/font pipeline is a single clean source with the U+2192 glyph gap actually resolved (fontTools-verified), and the GitHub Actions deploy pipeline is live and green.

---

_Verified: 2026-07-17T03:42:22Z_
_Verifier: Claude (gsd-verifier)_
