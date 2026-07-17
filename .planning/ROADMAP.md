# Roadmap: Prateek Kumar — Portfolio

## Overview

The site ships in three delivery boundaries. Phase 1 stands up the entire static skeleton — deploy pipeline, design tokens, fonts, and every text-content section (shell, systems list, experience, patents, skills, contact, résumé) — so a content-complete, deployed portfolio exists before any high-complexity work begins. Phase 2 layers in Fig. 01, the signature interactive cellularization demo, built against the now-stable tokens with its performance and accessibility floor (DPR cap, reduced motion, keyboard operability) as first-class from the start. Phase 3 promotes two systems-list entries into full case-study deep-dives and closes the project with the SEO/OG/Lighthouse verification pass that certifies the whole site meets its performance and honesty constraints before recruiters see the link.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Editorial Shell** - Deploy pipeline, design tokens, fonts, and every static content section land as a live, content-complete site (completed 2026-07-17)
- [ ] **Phase 2: Fig. 01 — Signature Interactive Figure** - The cellularization demo proves the résumé's distributed-systems claims through direct interaction
- [ ] **Phase 3: Case Studies & Launch Polish** - Deep-dive case studies plus the SEO/OG/Lighthouse verification pass that makes the site launch-ready

## Phase Details

### Phase 1: Foundation & Editorial Shell

**Goal**: A fully deployed, content-complete static portfolio exists — recruiters can read positioning, experience, systems, patents, and skills, and reach contact/résumé, on a live GitHub Pages URL.
**Depends on**: Nothing (first phase)
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05, CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05
**Success Criteria** (what must be TRUE):

  1. Visitor lands on the live GitHub Pages URL and sees the mono header (name · seattle · nav), serif declarative thesis hero, and one-line bio naming Microsoft/AWS/Samsung within the first viewport
  2. Visitor can reach the downloadable PDF résumé, LinkedIn, GitHub, and contact (mailto) via quiet text links in the header, hero, or footer
  3. Visitor can scan the selected-systems list (4 entries with date/name/one-liner/metric), read experience entries for Microsoft/AWS/MathWorks/Samsung, view patents & publications, and read skills as grouped prose/mono tags — every displayed metric carries a traceable `source` annotation in the content data
  4. Visitor sees a footer with a live Seattle clock and "all systems operational" status line on every page
  5. Site renders responsively from 360px through desktop using self-hosted subsetted fonts with no visible CLS/FOUT on the hero, all from a single design-token source, and auto-deploys to GitHub Pages on push to main

**Plans**: 7/7 plans complete
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Scaffold Astro 7, lock user-root config, deploy workflow, wire remote, place résumé/favicon (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Design tokens, self-hosted subsetted fonts (U+2192 resolved), global CSS, BaseLayout (wave 2)
- [x] 01-03-PLAN.md — Typed content data modules with honesty-gate source annotations (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-04-PLAN.md — Shell components: header, hero, footer with live Seattle clock (wave 3)
- [x] 01-05-PLAN.md — Content sections: systems, experience, patents, skills, contact (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-06-PLAN.md — Home page composition, 404, build + honesty + responsive verification (wave 4)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 01-07-PLAN.md — Gated live deploy to GitHub Pages + live-URL verification (wave 5)

**UI hint**: yes

### Phase 2: Fig. 01 — Signature Interactive Figure

**Goal**: Visitors experience the signature interactive systems demo that proves the résumé's real distributed-systems work through direct interaction rather than adjectives.
**Depends on**: Phase 1
**Requirements**: FIG-01, FIG-02, FIG-03, FIG-04, FIG-05, FIG-06, FIG-07
**Success Criteria** (what must be TRUE):

  1. Visitor sees the cellularized-region figure build in with staggered, dependency-ordered animation and ambient request beams on load
  2. Visitor can dispatch a request and watch it travel client → load balancer → healthy cell → pipelines → ML node, and can hover any node to see a real production fact (résumé-sourced metric)
  3. Visitor can inject a fault: a cell degrades (amber, dashed), traffic weighs away from it, the event log narrates the sequence, and the cell self-heals after ~8s
  4. Visitor with `prefers-reduced-motion` gets an informative static figure where fault injection still works via instant state changes; a keyboard-only visitor can operate every control with visible focus states and no keyboard trap
  5. The figure sustains ~60fps on average laptops (single rAF loop, DPR cap 2, batched draws) and the page holds Lighthouse ≥ 90 with the figure active

**Plans**: TBD
**UI hint**: yes

### Phase 3: Case Studies & Launch Polish

**Goal**: The site reaches launch-ready depth and quality — deep-dive case studies exist, and the whole site is verified for performance, accessibility, and SEO before recruiters see the link.
**Depends on**: Phase 1, Phase 2
**Requirements**: CASE-01, CASE-02, CASE-03, PLAT-06, PLAT-07
**Success Criteria** (what must be TRUE):

  1. Visitor can click from the systems list into two full case-study pages (DynamoDB cellularization, ELB auto-weight-away), each structured as problem → approach (with trade-offs considered) → impact
  2. Case studies are authored as a typed Astro content collection whose zod schema enforces the problem/approach/impact structure and rejects a malformed entry
  3. Every page (home + both case-study pages) ships title/description/OpenGraph meta, a static OG image, favicon, and a sitemap entry
  4. The home page (and the site overall) scores Lighthouse ≥ 90 in Performance, Accessibility, Best Practices, and SEO on the live deployed URL

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Editorial Shell | 7/7 | Complete   | 2026-07-17 |
| 2. Fig. 01 — Signature Interactive Figure | 0/TBD | Not started | - |
| 3. Case Studies & Launch Polish | 0/TBD | Not started | - |
