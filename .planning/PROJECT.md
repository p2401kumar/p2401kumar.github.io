# Prateek Kumar — Portfolio

## What This Is

A personal portfolio site for Prateek Kumar (SDE 2 at Microsoft; previously AWS DynamoDB, Samsung SmartThings), positioning him as a senior distributed-systems/cloud engineer at the AI intersection. Static site hosted on GitHub Pages, aimed at recruiters and senior/staff-level hiring managers.

## Core Value

Within seconds of landing, a senior engineering leader should think "this person operates at our level" — credibility delivered through demonstrated craft (a live systems demo), not adjectives.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Editorial shell: mono header (name · seattle · nav), serif declarative thesis hero, one-line bio with named employers, quiet text links (résumé / LinkedIn / GitHub)
- [ ] **Fig. 01 — signature interactive figure**: canvas demo of a cellularized region with ambient request beams, `send request`, and `inject fault` → auto-weight-away rerouting + event log + self-heal (mirrors his real AWS work)
- [ ] Selected systems list: date + mono artifact name + one-line description + real metric (azure/health-snapshots, dynamodb/cellularization, elb/auto-weight-away, iot/contextual-widget)
- [ ] Experience section: Microsoft → AWS → MathWorks → Samsung with real scope/metrics from résumé
- [ ] 1–2 case-study pages (deep-dives): DynamoDB cellularization; auto-weight-away (problem → approach → impact)
- [ ] Patents & publications section (2 patents incl. Grade A1, Android Lint paper)
- [ ] Skills presented as prose/grouped mono tags (no skill bars)
- [ ] Contact + downloadable PDF résumé
- [ ] Footer with live Seattle clock + "all systems operational" status line
- [ ] GitHub Pages deployment via GitHub Actions (Astro static build)
- [ ] Responsive (mobile through desktop), `prefers-reduced-motion` fallbacks, keyboard-accessible
- [ ] SEO/meta: OpenGraph, title/description, favicon, sitemap

### Out of Scope

- Blog/writing section — v2; he publishes on LinkedIn today, adding a content pipeline now risks a stale section
- "AI twin" chatbot — top-tier engineer portfolios conspicuously avoid chatbots; restraint is the AI-era differentiator (may revisit as a /craft experiment later)
- CMS or backend — static site is a hard requirement (GitHub Pages)
- Light theme — the design system commits to the tinted-graphite dark editorial look; a toggle adds surface area without hiring value
- Analytics dashboards, testimonials, skill bars, tech-logo walls — anti-patterns per portfolio research

## Context

**Content sources:** résumé PDF (`Prateek_Kumar_resume_4_5.pdf`), LinkedIn profile export, existing site p2401kumar.github.io/home (superseded). All metrics on the site must be real: +30% reliability / −20% p99 (DynamoDB cellularization), 90% capacity ops automated (auto-weight-away), APK 150→90 MB, 2 patents, USC MS CS 3.9 GPA, IIT Dhanbad.

**Design direction (locked after 5 prototype iterations + 4-agent parallel research):**
- Rejected: generic AI-slop looks (terminal green, cream serif, gradient hero), playful neural-net toy (bugdroid, fake epoch HUD), flat service-map
- Locked: **editorial restraint + one signature motion metaphor** — the "Fig. 01" interactive cellularization demo framed like a paper figure
- Design tokens: bg `#0f1216` graphite, panel `#12161c`, ink `#e8ebef`, body `#aab2bd`, dim `#78818d`, hairline `#1e242d`, accent copper `#d99163` (<5% surface), good `#57b98a`, amber `#d9a441`
- Type: serif display for thesis (self-host, e.g. an Iowan/Palatino-class face or open equivalent), workhorse sans for body, mono for labels/metrics/nav (infrastructure texture)
- Motion doctrine: one moving thing per viewport; beams with linear easing on 1px hairline routes; staggered dependency-order build-ins (30–80ms, ease-out); dashed = unhealthy/ephemeral; hover responses ≤150ms; `prefers-reduced-motion` → static diagram
- Working prototype of shell + Fig. 01 exists (artifact `living-graph.html` in session scratchpad) — port to Astro components, do not regress interactions

**Research corpus (4 parallel agents, July 2026):** AI-infra design language (Anthropic/Modal/OpenAI et al.), devtools motion grammar (Vercel/Stripe/Linear/PlanetScale), elite engineer portfolios (rauno.me/paco.me/antfu.me), canvas technique catalog (dot-grid fields, routed beams, flow fields). Key findings embedded in decisions above.

**Deployment (decided 2026-07-15):** user-root GitHub Pages — repo `p2401kumar.github.io`, served at `https://p2401kumar.github.io`, no `base` path. The old `/home` repo is retired after launch (redirect or archive — post-launch task).

## Constraints

- **Hosting**: GitHub Pages (static only, free) — no server-side code; canvas/JS must be self-contained
- **Tech stack**: Astro + vanilla TS/canvas for Fig. 01 — component model + content collections without shipping a framework runtime
- **Fonts**: self-hosted (no CDN dependency); subset for performance
- **Performance**: Fig. 01 must hold 60fps on average laptops (DPR cap 2, batched draws); Lighthouse ≥ 90 across the board
- **Honesty**: every number displayed must trace to the résumé — no invented telemetry

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Lead positioning: distributed systems + cloud, AI as intersection | Deepest real track record (DynamoDB, ELB, Azure); AI claim is demonstrated, not asserted | — Pending |
| Astro static build | Modern DX, zero-JS-by-default, first-class GitHub Pages deploy, content collections for case studies | — Pending |
| Editorial-restraint design + single signature figure | 4-agent research: top-tier engineers signal seniority through restraint; one motion metaphor per viewport | — Pending |
| Fig. 01 demonstrates auto-weight-away/cellularization | Animation proves the résumé claim instead of decorating it — the site's memorable differentiator | — Pending |
| No blog, no chatbot in v1 | Stale-blog risk; top-tier portfolios avoid chatbots; both revisitable in v2 | — Pending |
| Dark-only tinted-graphite + copper system | Committed visual world reads more deliberate than a toggle; accent <5% per AI-infra research | — Pending |
| Deploy to user root `p2401kumar.github.io` (new repo), retire old `/home` after launch | Cleanest résumé URL, zero base-path risk (top research-flagged pitfall); user decision 2026-07-15 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-15 after initialization*
