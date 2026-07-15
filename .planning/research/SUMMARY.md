# Project Research Summary

**Project:** Prateek Kumar — Portfolio
**Domain:** High-craft static personal portfolio (Astro → GitHub Pages) with one signature interactive canvas figure, for a senior distributed-systems/cloud/AI engineer targeting recruiter/hiring-manager audiences
**Researched:** 2026-07-15
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a small (~6 page) static content site whose entire competitive edge rides on execution quality, not feature breadth. Experts building this class of site (elite engineer portfolios: rauno.me/paco.me/antfu.me) converge on the same pattern this project has already locked: a single-scroll editorial shell, restrained motion (one signature interaction, not decorative effects), prose over gamified skill bars, and depth (2 real case studies with problem→approach→impact) over breadth (a grid of shallow project cards). The recommended stack — Astro with `output: 'static'`, zero UI-framework runtime, a hand-written vanilla TypeScript canvas module for Fig. 01, self-hosted subsetted fonts, and the official `withastro/action`/`actions/deploy-pages` GitHub Pages pipeline — is a direct, low-risk match for every explicit constraint (no server, no CDN fonts, Lighthouse ≥90, zero-JS-by-default except one hand-rolled figure).

The recommended approach: build the static editorial shell and deployment pipeline first (this is where the highest-cost-to-retrofit decisions live — GitHub Pages base path, font fallback metrics, design tokens), then build Fig. 01 as an isolated, modular vanilla-TS engine that reads its colors from CSS custom properties at runtime (never duplicated literals), then pour in content via Astro content collections (case studies) and typed data modules (experience/patents/skills), with SEO/OG treated as a first-class early deliverable rather than late polish, since this audience arrives entirely via shared links.

The key risks cluster around three things that are individually cheap to prevent but expensive to retrofit: (1) GitHub Pages base-path mistakes that silently break every internal link/asset if hosting target (user root vs. project path) isn't decided before scaffolding; (2) Fig. 01's canvas loop tanking Lighthouse/battery if it isn't built with DPR capping, a single consolidated rAF loop, and a genuine (not cosmetic) `prefers-reduced-motion` static-fallback from its first commit; and (3) content "AI slop" / overclaiming drift, which the project's own honesty constraint explicitly guards against but which requires an active per-metric traceability check, not just good intentions. All three are addressed by sequencing: settle deploy/token/font decisions in a Foundation phase before any component is built, build Fig. 01's performance and accessibility floor together (not animation-then-accessibility-later), and bake metric traceability into the content-authoring workflow itself.

## Key Findings

### Recommended Stack

Astro `^7.0` (Node ≥22.12) is the clear pick: static output by default, typed content collections for the two case-study pages, and an official, well-documented GitHub Pages Actions deploy path (`withastro/action@v6` + `actions/checkout@v7` + `actions/deploy-pages@v5`). No UI framework (React/Vue/Svelte) and no Tailwind — the design system is already locked with specific token values, and both would add abstraction/runtime cost against a "zero framework runtime" constraint and a bespoke, fixed token set. Plain CSS with `:root` custom properties is the styling approach.

**Core technologies:**
- **Astro `^7.0`** — static site generator with typed content collections — matches "no framework runtime" and gives typed frontmatter for case studies without a CMS
- **TypeScript `^5.7`+** — type safety for content schemas and the Fig. 01 canvas state machine — Astro ships first-class TS support at zero config
- **GitHub Actions + GitHub Pages (Actions deploy mode)** — `withastro/action@v6`/`actions/deploy-pages@v5` — this is Astro's own officially documented deploy workflow, cross-verified against docs.astro.build

Supporting choices: `@astrojs/sitemap` for the required sitemap; manually subsetted self-hosted `.woff2` fonts (not CDN, not full Fontsource families) for performance and the no-CDN constraint; a single hand-authored static OG image rather than build-time OG generation (too few pages to justify Satori); `sharp`/`astro:assets` for any raster images; Biome (or Prettier+`prettier-plugin-astro` as fallback) for lint/format; `astro check` in CI.

### Expected Features

Research strongly validates PROJECT.md's existing requirement list almost exactly — no missing table-stakes feature was surfaced, and every already-rejected anti-feature (skill bars, chatbot, tech-logo wall, testimonials, blog, light-theme toggle) is independently confirmed as a negative signal for this specific senior-engineer audience.

**Must have (table stakes):**
- One-line positioning statement above the fold (recruiters decide in 6-8 seconds)
- 3-6 real projects/systems with role, stack, specific metrics (not adjectives)
- Experience history with scope, one-click contact, downloadable PDF résumé kept in sync with the site
- LinkedIn/GitHub links, fast load with no broken links, working SEO/OG preview cards
- Mobile-responsive, keyboard-accessible baseline

**Should have (competitive differentiators):**
- Fig. 01 — live interactive systems demo (the single biggest differentiator; no comparable portfolio in the research corpus shows a domain-accurate live re-enactment of real production work)
- Case studies with explicit Problem → Approach → Impact structure, with a named "trade-offs considered" subsection — this is what signals seniority over junior "outcomes only" portfolios
- Patents & publications section (rare, legitimate seniority signal for this candidate)
- Named metric in the systems-list label itself (not buried in prose)

**Defer (v2+):**
- Additional case studies beyond the initial 2 (add only once usage signal justifies it)
- Minimal Person/Organization JSON-LD (low-cost, genuinely optional)
- Blog/writing section, `/craft` chatbot experiment, light theme (all explicitly deferred, each with a documented reason not to rush it)

### Architecture Approach

A flat, single-scroll component structure mirrors the content outline directly: `BaseLayout.astro` (shell/meta/OG) composes one-file-per-section components (`Hero`, `Figure01`, `SystemsList`, `ExperienceSection`, etc.), all reading design tokens from a single `tokens.css` source of truth. Fig. 01 is deliberately split into `model.ts`/`render.ts`/`interactions.ts`/`tokens.ts` under `src/lib/fig01/`, imported via a plain `<script type="module">` (no framework island, no `client:*` directive) — this is the one piece of real client-side logic on the site and it must not duplicate the CSS token values as literals (a bug already present in the throwaway prototype). Content collections (with a zod schema) are reserved for the two long-form case-study pages; short structured lists (experience, patents, skills) stay as plain typed data modules — collection ceremony isn't worth it for four-item arrays.

**Major components:**
1. `Figure01.astro` + `src/lib/fig01/*` — the signature canvas engine, framework-free, tokens read at runtime via `getComputedStyle`
2. `src/content/case-studies/*.md` + `content.config.ts` + `src/pages/work/[slug].astro` — schema-validated long-form deep-dives
3. `src/styles/tokens.css` — single source of truth for every color/spacing value in both CSS and canvas code
4. `src/data/*.ts` — typed data modules (profile, experience, patents, skills) feeding static section components
5. `.github/workflows/deploy.yml` — CI build+deploy via the official Astro/GitHub Pages Actions pipeline

### Critical Pitfalls

1. **GitHub Pages base-path breakage** — decide user-root vs. project-path hosting *before* scaffolding Astro and set `site`/`base` accordingly; retrofitting touches every internal link. Verify by clicking every link and the 404 page on the live deployed URL, not localhost.
2. **Fig. 01 tanks Lighthouse/battery** — build DPR capping (max 2), a single consolidated rAF loop, and visibility-gated animation from the canvas engine's first commit, not as a later optimization pass.
3. **`prefers-reduced-motion` treated as a checkbox** — for Fig. 01 the beams *are* the content; reduced motion needs a genuine static-diagram fallback conveying the fault-injection story, not just "slower," and must also listen for the `change` event.
4. **Serif hero font FOUT/CLS** — preload the above-the-fold serif face, use metrics-matched fallback (`size-adjust`/`ascent-override`), and verify with Lighthouse CLS — this directly undermines the "seconds" first-impression Core Value if unaddressed.
5. **Content drift into overclaiming/"AI slop"** — every displayed metric must trace to the résumé; build a traceability check (e.g., a `source:` frontmatter field) into content authoring, not just a hopeful memory-based review.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Foundation (scaffold, deploy pipeline, tokens, fonts)
**Rationale:** Every pitfall research flags this phase as where retrofit-expensive decisions live — GitHub Pages base path, design tokens, font fallback metrics — must be settled before any component or content work lands.
**Delivers:** Astro project scaffold, `astro.config.mjs` with `site`/`base` decided, `tokens.css` with the locked palette, self-hosted subsetted fonts with preload + metrics-matched fallback, working GitHub Actions deploy to a live (even empty) GitHub Pages URL.
**Addresses:** Fast load / no broken links (table stakes), SEO/OG scaffolding
**Avoids:** Pitfall 1 (base-path breakage), Pitfall 4 (font FOUT/CLS)

### Phase 2: Editorial Shell + Content Sections
**Rationale:** The bulk of table-stakes features are static markup with no dependency on Fig. 01; building them next validates the layout/typography system end-to-end on real content before the highest-complexity piece (Fig. 01) is layered in.
**Delivers:** `BaseLayout`, `SiteHeader`, `Hero`, `SystemsList`, `ExperienceSection`, `PatentsSection`, `SkillsSection`, `ContactSection`, `SiteFooter`, typed `src/data/*.ts` modules, résumé PDF linked.
**Addresses:** One-line positioning statement, experience section, systems list w/ metrics, patents section, contact + résumé PDF, skills-as-prose (all P1 table stakes/differentiators from FEATURES.md)
**Avoids:** Pitfall 5 (content overclaiming) — build the metric-traceability discipline into this phase's authoring workflow, not retroactively

### Phase 3: Fig. 01 — Signature Interactive Figure
**Rationale:** The single highest-complexity, highest-differentiator piece; research is unanimous that its performance and accessibility floor (DPR cap, consolidated rAF, reduced-motion static fallback, keyboard operability) must be built alongside the animation, not after — sequencing it after the shell is settled means the canvas module can read finalized CSS tokens rather than guessing at values still in flux.
**Delivers:** `src/lib/fig01/{model,render,interactions,tokens}.ts`, `Figure01.astro`, full send-request/inject-fault/reroute/self-heal interaction loop, static-diagram reduced-motion fallback, keyboard-operable controls.
**Uses:** Vanilla TypeScript, `<script type="module">` pattern (Architecture Pattern 1), runtime CSS-var token reads (Architecture Pattern 2)
**Implements:** `src/lib/fig01/*` module split; DPR/rAF/IntersectionObserver performance patterns from PITFALLS.md

### Phase 4: Case Studies (Content Collections)
**Rationale:** Case studies are the deep-dive of specific systems-list entries — the list (Phase 2) must exist first as the index before promoting two entries to full depth; this also lets the content collection schema be validated against real prose rather than placeholder text.
**Delivers:** `content.config.ts` zod schema, two case-study Markdown files (DynamoDB cellularization, auto-weight-away), `src/pages/work/[slug].astro` template.
**Addresses:** Case-study deep-dives (P1 differentiator) with explicit Problem→Approach→Impact structure
**Avoids:** Pitfall 5 (overclaiming) and Pitfall 6 (staleness) — content collections keep future updates low-friction

### Phase 5: Polish, SEO/OG, Performance Verification
**Rationale:** SEO/OG has outsized leverage for this audience (link-shared, not search-discovered) and should not be a true afterthought, but final og:image generation and full Lighthouse verification (post-Fig.01, post-fonts, post-content) can only happen once all prior phases are content-complete.
**Delivers:** Final og:image(s) per route, sitemap verification, full-site Lighthouse run (mobile+desktop) at ≥90, reduced-motion audit across every animated element (not just Fig. 01), metric traceability line-by-line check against the résumé PDF, live-link click-through on the deployed URL.
**Delivers:** Launch-ready site meeting every constraint in PROJECT.md

### Phase Ordering Rationale

- Foundation-first ordering exists specifically because GitHub Pages base-path and font-fallback decisions are the two most expensive-to-retrofit items identified across both ARCHITECTURE.md and PITFALLS.md — sequencing them last would mean touching every component already written.
- Fig. 01 is deliberately sequenced *after* the shell/tokens are locked (not first, despite being the "hero" feature) so its runtime CSS-var token reads (Pattern 2) have a stable source to read from, avoiding token/canvas drift from day one.
- Case studies come after the systems list because FEATURES.md's dependency graph explicitly states the list is the index and case studies are promoted entries — building case-study pages before the list exists has no natural entry point to link from.
- Polish is last but SEO/OG scaffolding (meta tags, sitemap integration) is pulled into Phase 1 rather than deferred entirely, since research flags OG as high-leverage/low-cost and this audience's acquisition channel is exclusively shared links.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Fig. 01):** Canvas performance engineering (dirty-rect rendering, DPR handling edge cases, rAF timestamp throttling) is a narrower, more implementation-specific domain than the other phases — `/gsd-plan-phase --research-phase 3` is worth running to nail exact dirty-rect/layering technique before writing `render.ts`.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (Foundation):** Astro scaffold + GitHub Pages deploy is Astro's own officially documented workflow, already cross-verified in STACK.md/ARCHITECTURE.md.
- **Phase 2 (Editorial Shell):** Standard Astro component composition, no novel patterns.
- **Phase 4 (Case Studies):** Astro content collections are a documented, stable Astro 5+ feature; the schema shape is already specified in ARCHITECTURE.md.
- **Phase 5 (Polish):** Lighthouse/SEO verification is standard practice, well covered by PITFALLS.md's checklist.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core Astro/GitHub Pages deploy facts cross-verified against official docs via two independent fetches; exact patch versions and some supporting-library picks (Fontsource vs. manual subsetting, Biome Astro support) are MEDIUM — web-search synthesis, no context7/registry MCP available this run |
| Features | MEDIUM | Cross-corroborated across 9 web queries; no single authoritative spec exists for portfolio "best practice" — it's practitioner consensus, not a standards body. WCAG/OG/performance sub-claims are higher confidence than aesthetic/structural ones |
| Architecture | MEDIUM | Astro mechanics corroborated across docs.astro.build and official withastro repos; project-specific structure is this research's synthesis against the existing HTML prototype and PROJECT.md constraints, not an external authority |
| Pitfalls | MEDIUM | Web-sourced, unverified against primary docs in a couple of cases; GitHub Pages/Astro deploy behavior and canvas performance guidance are stable/standard practice, portfolio-positioning findings are pattern-matched across independent sources |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Exact npm package versions** (e.g., `@astrojs/sitemap@3.7.3`, Astro's Node 22.12 floor) were derived from web-search synthesis, not a direct registry fetch (a TLS error blocked direct npm registry access this run) — re-verify with `npm view <pkg> version` and `npm create astro@latest`'s own engine check at scaffold time in Phase 1, don't hard-pin from this research alone.
- **GitHub Pages hosting target (user root vs. project path)** is explicitly still an open decision per PROJECT.md — this must be resolved as the first concrete decision of Phase 1, not deferred, since it gates `astro.config.mjs` and every subsequent internal link.
- **Biome's `.astro` file support** is newer/narrower than its JS/TS/CSS coverage — verify directly on real `.astro` markup early in Phase 1/2; fall back to Prettier + `prettier-plugin-astro` if gaps appear rather than fighting the tool.
- **Canvas dirty-rect/layering technique specifics** for Fig. 01 weren't deeply specified beyond general guidance — flagged above as the Phase 3 research flag.

## Sources

### Primary (HIGH confidence)
- https://docs.astro.build/en/guides/deploy/github/ — official GitHub Pages deploy guide, fetched twice and cross-verified
- https://docs.astro.build/en/guides/typescript/ + `astro/tsconfigs/strict.json` — official TS preset docs
- https://docs.astro.build/en/guides/view-transitions/ + client-side-scripts docs — `astro:page-load` re-init semantics
- Existing working prototype `living-graph.html` (session scratchpad artifact) — read directly, primary source for Fig. 01 module split and the token/canvas drift anti-pattern
- `.planning/PROJECT.md` — project's own locked decisions (tokens, constraints, deployment note)

### Secondary (MEDIUM confidence)
- https://astro.build/blog/astro-7/ — Astro 7.0 release announcement (fetched directly)
- docs.astro.build project-structure/layouts/content-collections/islands/styling guides (web-search corroborated, official domain)
- https://github.com/withastro/action, https://github.com/withastro/docs/issues/8247 — deploy action behavior and known flakiness reports
- Elite portfolio comparables (rauno.me / antfu.me / paco.me) and multiple software-engineer-portfolio guides (careerfoundry.com, sitesplaced.com, killerportfolio.com)
- WCAG/accessibility sources: WebAIM keyboard accessibility, W3C WAI animation-from-interactions, Pope Tech accessible-animation guide
- Performance sources: web.dev Lighthouse scoring/CLS docs, DebugBear font-CLS and performance-budget articles, MDN canvas optimization tutorial
- GitHub issue reports on Astro base-path bugs (withastro/astro #2452, #2561)

### Tertiary (LOW-MEDIUM confidence)
- npm registry version figures (`@astrojs/sitemap@3.7.3`, Astro 7 Node floor) — web-search synthesis only, direct registry fetch failed this run; re-verify at scaffold time
- Fontsource vs. manual-subsetting size-reduction percentages — illustrative blog-sourced numbers, not verified benchmarks
- "AI slop" / generic-content pattern findings — multiple independent blog sources, consistent directionally but not authoritative

---
*Research completed: 2026-07-15*
*Ready for roadmap: yes*
