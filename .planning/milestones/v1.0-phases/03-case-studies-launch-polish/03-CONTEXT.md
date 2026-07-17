# Phase 3: Case Studies & Launch Polish - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning
**Source:** Session design lock + résumé content extraction (single source of truth for all claims)

<domain>
## Phase Boundary

Launch-ready depth and quality: two case-study deep-dives (DynamoDB cellularization, ELB auto-weight-away) as a schema-enforced Astro content collection with pages linked from the systems list; full SEO/OG/meta/sitemap coverage; a static OG image; and the site-wide Lighthouse ≥ 90 gate on the live URL — plus the residual in-browser visual QA deferred from Phases 1–2. Covers CASE-01..03, PLAT-06, PLAT-07. This is the FINAL phase of v1.

</domain>

<decisions>
## Implementation Decisions

### Case-study content (honesty constraint is ABSOLUTE)
- Two entries: `dynamodb-cellularization` and `elb-auto-weight-away`, each structured problem → approach (with an explicit "trade-offs considered" subsection — the research-corroborated seniority signal) → impact
- **Fact discipline:** every named number comes from the résumé: cellularization = compute/storage segregation into isolated failure domains in US-EAST-1, up to +30% reliability, −20% latency, AWS SDK Java v1/v2 extended for the new architecture. Auto-weight-away = LB-management service pre-allocating dedicated capacity for anticipated traffic and automatically weighing out affected LBs, −10% peak-hour latency, 90% of capacity adjustments automated.
- **Trade-off sections** must be framed as general engineering considerations of the pattern (cellular isolation: blast-radius reduction vs capacity-pooling efficiency, routing/placement complexity, migration sequencing; weight-away: automation speed vs false-positive weigh-outs, pre-allocation cost vs surge readiness) — NEVER presented as insider Amazon specifics beyond the résumé. No confidential architecture details, no invented team sizes/dates/internal names.
- Voice: same as the site — first person, plain, no adjectives about self, mono labels for artifact names. Each page ends with a quiet link back to `/#work` and cross-links the other case study.
- Frontmatter carries `source` annotations for metrics (extends the honesty gate into the collection schema).

### Content collection (CASE-03)
- `src/content.config.ts` (Astro 7 Content Layer, glob loader) with a zod schema REQUIRING: title, systemId (must match a systems.ts id), date range, metrics array ({label, value, source}), and the three body sections enforced structurally — either as required frontmatter section markers or a documented heading contract validated at build (planner's choice; the success criterion is "rejects a malformed entry", so include a negative test: a deliberately malformed fixture must fail `astro check`/build, then be removed)
- Pages at `/work/dynamodb-cellularization` and `/work/elb-auto-weight-away` via `src/pages/work/[slug].astro`, composed with BaseLayout + SiteHeader + SiteFooter (the "every page" lesson from Phase 1's verification gap — bake it in from the start)
- Systems list rows for these two systems become links (the other two rows stay unlinked); hover idiom unchanged

### SEO / OG / meta (PLAT-06)
- Reusable `<SEO>` head partial in BaseLayout: per-page title/description, canonical URL, OpenGraph (og:title/description/image/url/type) + twitter:card summary_large_image
- ONE hand-authored static OG image (1200×630) reusing the Fig. 01 aesthetic per STACK.md: graphite ground, copper accent, name + thesis + a simplified cell/route motif. Author as SVG in-repo, rasterize to PNG at build or commit the PNG directly — `sharp` is already available via astro:assets (no new deps); a tiny node script using sharp is acceptable
- `@astrojs/sitemap` integration (version per `npm view` at install; requires `site` which is already set); robots.txt pointing at the sitemap
- Favicon already exists (Phase 1) — verify it ships on all pages

### Lighthouse ≥ 90 gate + residual QA (PLAT-07)
- Formal audit against the LIVE deployed URL, all four categories, using `npx lighthouse` (Chrome available on this Windows machine) or PageSpeed Insights API as fallback — record scores in the phase verification artifacts
- Residual visual QA from Phases 1–2 (font-flash/CLS on hero, arrow glyph rendering, live clock ticking, 360px collapse, figure interactions in a real browser): attempt browser automation first (Claude's built-in browser pane or gstack browse if it starts); if tooling still fails, this becomes a human-verify checkpoint with a checklist — the ONLY acceptable human gate in this phase
- Fix-forward budget: if Lighthouse lands below 90 anywhere, diagnose and fix within this phase (common suspects: image sizing, meta description presence, color-contrast on dim text)

### Claude's Discretion
- Case-study page typography/layout details (within UI-SPEC extension), exact zod schema shape, OG image composition details, whether robots.txt needs anything beyond the sitemap line, lighthouse invocation specifics

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `C:\Users\prateekkumar\Downloads\Prateek_Kumar_resume_4_5.pdf` — the ONLY source for case-study facts (its extracted claims are quoted in the decisions above and in src/data/systems.ts sources)
- `src/data/systems.ts` — existing metric + source strings the case studies must stay consistent with
- `.planning/research/STACK.md` — OG image approach (one static image), @astrojs/sitemap notes
- `.planning/phases/01-foundation-editorial-shell/01-UI-SPEC.md` — the design contract case-study pages extend (type roles, spacing, link idiom)
- `.planning/phases/01-foundation-editorial-shell/01-VERIFICATION.md` — the "every page needs header/footer" gap lesson
- `src/pages/index.astro`, `src/components/SystemsList.astro` — composition patterns + where links get added
- `.planning/ROADMAP.md` Phase 3 section — success criteria incl. the malformed-entry rejection test

</canonical_refs>

<specifics>
## Specific Ideas

- Case-study H1s use the mono artifact name (`dynamodb/cellularization`) with a serif standfirst sentence beneath — the systems-list idiom promoted to page scale
- Each case study opens with a compact metrics strip (the résumé numbers with their `source` tooltips/annotations) before the prose
- OG image text: "Prateek Kumar" + "I build the infrastructure that intelligence runs on." — nothing else competing
- Sitemap should include exactly 3 pages (home + 2 case studies); 404 excluded

</specifics>

<deferred>
## Deferred Ideas

- Third case study (azure/health-snapshots) → v2 (CASE-04)
- JSON-LD Person structured data → v2 (PLAT-08)
- Notes/blog, /craft experiments → v2
- Old `/home` repo retirement/redirect → post-launch task (surface in the phase-complete summary as a reminder)

</deferred>

---

*Phase: 03-case-studies-launch-polish*
*Context gathered: 2026-07-17 via session design lock*
