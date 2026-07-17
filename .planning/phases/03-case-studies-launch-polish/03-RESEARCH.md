# Phase 3: Case Studies & Launch Polish - Research

**Researched:** 2026-07-17
**Domain:** Astro 7 Content Layer collections, SEO/OG meta, sitemap, static OG image generation, Lighthouse auditing
**Confidence:** HIGH (core Astro Content Layer syntax, sitemap filter API, and local environment probes all directly verified this session; Lighthouse/PSI guidance is MEDIUM — websearch-corroborated, not officially fetched)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Case-study content (honesty constraint is ABSOLUTE)**
- Two entries: `dynamodb-cellularization` and `elb-auto-weight-away`, each structured problem → approach (with an explicit "trade-offs considered" subsection — the research-corroborated seniority signal) → impact
- **Fact discipline:** every named number comes from the résumé: cellularization = compute/storage segregation into isolated failure domains in US-EAST-1, up to +30% reliability, −20% latency, AWS SDK Java v1/v2 extended for the new architecture. Auto-weight-away = LB-management service pre-allocating dedicated capacity for anticipated traffic and automatically weighing out affected LBs, −10% peak-hour latency, 90% of capacity adjustments automated.
- **Trade-off sections** must be framed as general engineering considerations of the pattern (cellular isolation: blast-radius reduction vs capacity-pooling efficiency, routing/placement complexity, migration sequencing; weight-away: automation speed vs false-positive weigh-outs, pre-allocation cost vs surge readiness) — NEVER presented as insider Amazon specifics beyond the résumé. No confidential architecture details, no invented team sizes/dates/internal names.
- Voice: same as the site — first person, plain, no adjectives about self, mono labels for artifact names. Each page ends with a quiet link back to `/#work` and cross-links the other case study.
- Frontmatter carries `source` annotations for metrics (extends the honesty gate into the collection schema).

**Content collection (CASE-03)**
- `src/content.config.ts` (Astro 7 Content Layer, glob loader) with a zod schema REQUIRING: title, systemId (must match a systems.ts id), date range, metrics array ({label, value, source}), and the three body sections enforced structurally — either as required frontmatter section markers or a documented heading contract validated at build (planner's choice; the success criterion is "rejects a malformed entry", so include a negative test: a deliberately malformed fixture must fail `astro check`/build, then be removed)
- Pages at `/work/dynamodb-cellularization` and `/work/elb-auto-weight-away` via `src/pages/work/[slug].astro`, composed with BaseLayout + SiteHeader + SiteFooter (the "every page" lesson from Phase 1's verification gap — bake it in from the start)
- Systems list rows for these two systems become links (the other two rows stay unlinked); hover idiom unchanged

**SEO / OG / meta (PLAT-06)**
- Reusable `<SEO>` head partial in BaseLayout: per-page title/description, canonical URL, OpenGraph (og:title/description/image/url/type) + twitter:card summary_large_image
- ONE hand-authored static OG image (1200×630) reusing the Fig. 01 aesthetic per STACK.md: graphite ground, copper accent, name + thesis + a simplified cell/route motif. Author as SVG in-repo, rasterize to PNG at build or commit the PNG directly — `sharp` is already available via astro:assets (no new deps); a tiny node script using sharp is acceptable
- `@astrojs/sitemap` integration (version per `npm view` at install; requires `site` which is already set); robots.txt pointing at the sitemap
- Favicon already exists (Phase 1) — verify it ships on all pages

**Lighthouse ≥ 90 gate + residual QA (PLAT-07)**
- Formal audit against the LIVE deployed URL, all four categories, using `npx lighthouse` (Chrome available on this Windows machine) or PageSpeed Insights API as fallback — record scores in the phase verification artifacts
- Residual visual QA from Phases 1–2 (font-flash/CLS on hero, arrow glyph rendering, live clock ticking, 360px collapse, figure interactions in a real browser): attempt browser automation first (Claude's built-in browser pane or gstack browse if it starts); if tooling still fails, this becomes a human-verify checkpoint with a checklist — the ONLY acceptable human gate in this phase
- Fix-forward budget: if Lighthouse lands below 90 anywhere, diagnose and fix within this phase (common suspects: image sizing, meta description presence, color-contrast on dim text)

### Claude's Discretion
- Case-study page typography/layout details (within UI-SPEC extension), exact zod schema shape, OG image composition details, whether robots.txt needs anything beyond the sitemap line, lighthouse invocation specifics

### Deferred Ideas (OUT OF SCOPE)
- Third case study (azure/health-snapshots) → v2 (CASE-04)
- JSON-LD Person structured data → v2 (PLAT-08)
- Notes/blog, /craft experiments → v2
- Old `/home` repo retirement/redirect → post-launch task (surface in the phase-complete summary as a reminder)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|--------------------|
| CASE-01 | Visitor can read the DynamoDB cellularization case study (problem → approach with trade-offs considered → impact) | Pattern 1 (Content Layer schema shape enforcing problem/approach/tradeoffs/impact as required fields) + Pattern 2 (`[slug].astro` render pipeline) + `<user_constraints>` fact-discipline list for exact résumé numbers to use |
| CASE-02 | Visitor can read the ELB auto-weight-away case study (same structure) | Same as CASE-01 — same schema, same page template, second content entry |
| CASE-03 | Case studies are a typed Astro content collection whose schema enforces the problem/approach/impact structure | Pattern 1 (`content.config.ts` + Zod schema), Pitfall 1 (why the negative-test proof must gate on `astro build`, not `astro check` alone), Code Examples "Negative-test fixture for schema rejection" |
| PLAT-06 | Every page ships title/description/OG meta, a static OG image, favicon, and sitemap | Pattern 3 (SEO partial with `Astro.site`/`Astro.url`), Pattern 4 (sharp-based OG rasterization script), Code Examples "Sitemap integration with 404 excluded" + "robots.txt", Pitfall 2 (verify sitemap filter actually excludes /404), Pitfall 4 (every new page needs header/footer too) |
| PLAT-07 | Home page scores Lighthouse ≥ 90 in Performance, Accessibility, Best Practices, and SEO | Environment Availability (Chrome confirmed present, `npx lighthouse` resolvable), Pitfall 5 (Chrome auto-detection fallback via `CHROME_PATH`), Summary's primary/fallback audit recommendation (`npx lighthouse` vs PageSpeed Insights API) |
</phase_requirements>

## Summary

This phase adds exactly two new pages (`/work/dynamodb-cellularization`, `/work/elb-auto-weight-away`) backed by a schema-enforced Astro Content Layer collection, a reusable SEO head partial, one static OG image, a sitemap, and a Lighthouse ≥ 90 gate on the live site. No UI framework, no new runtime dependency beyond `@astrojs/sitemap` — everything else (schema validation, image rasterization, meta tags) uses tooling already in `node_modules` (`astro/zod`, `astro/loaders`, `sharp`) or the OS-level Chrome install already present on this machine.

The single highest-risk finding this session: **`astro check` does not reliably catch content-collection schema violations** — it was a known silent-pass bug in Astro <5.0.6, fixed by making `astro check` run an implicit `astro sync` first. On Astro 7.0.7 (well past the fix) this should work, but the *provable* signal the phase's success criterion needs ("rejects a malformed entry") is safest demonstrated with **`npm run build` failing non-zero on a malformed fixture**, not `astro check` alone — build-time collection sync is where Zod actually runs, and a failed build is an unambiguous, CI-provable signal. Treat `astro check` as a secondary/IDE-time signal, not the proof.

Second finding: this Windows machine has Chrome installed at the default `Program Files` path and `npx lighthouse` (v13.4.0 latest, not yet installed) is resolvable — headless Lighthouse CLI against the live URL is viable as the primary audit method, with PageSpeed Insights API (no key required for occasional/manual use) as a documented fallback if local Chrome launch fails in this environment.

**Primary recommendation:** Model case studies as a Content Layer collection (`src/content.config.ts` + `glob()` loader + Zod schema), enforce the problem/approach/impact structure via **required, separately-typed frontmatter fields** (not freeform heading-parsing) since that is the simplest mechanism a Zod schema can reject deterministically at build time. Prove rejection with a malformed fixture that fails `npm run build`, then delete it. Ship one hand-authored SVG → PNG OG image via a tiny build-time Node script using the `sharp` already vendored by Astro. Audit the live URL with `npx lighthouse --output json --chrome-flags="--headless=new"`, falling back to the PageSpeed Insights API v5 (no-key) if local Chrome launch fails.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Case-study content storage/validation | Build tier (Astro Content Layer, compile-time) | — | No server exists (static output); content is validated and baked into HTML at `astro build` time, not runtime |
| Case-study page rendering | Static/CDN (pre-rendered HTML served by GitHub Pages) | — | `output: 'static'` — every route is a flat file at deploy time |
| SEO/OG meta tags | Build tier (Astro component, per-page props) | Static/CDN (served as static `<head>` markup) | Meta tags are computed once at build from frontmatter/props, not runtime-generated |
| OG image | Build tier (one-time raster via `sharp` in a Node script, or hand-committed PNG) | Static/CDN (served as a static asset) | No image CDN available on GitHub Pages; must be a finished artifact before deploy |
| Sitemap generation | Build tier (`@astrojs/sitemap` integration hook) | Static/CDN | Runs during `astro build`, output committed to `dist/`, served statically |
| Lighthouse audit | External tooling (dev machine / CI, out-of-band) | — | Not part of the site's runtime or build graph — a verification step run against the deployed URL |

## Project Constraints (from CLAUDE.md)

Extracted from `./.claude/CLAUDE.md` — the planner must not recommend approaches that contradict these:

- **Hosting is GitHub Pages, static-only** — no server-side code; `output: 'static'` only. All Phase 3 additions (collection rendering, SEO partial, sitemap, OG image) must resolve entirely at build time, never at request time.
- **No UI framework** (React/Vue/Svelte) as an Astro integration — case-study pages and the SEO partial must be plain `.astro` components, no client-side framework runtime added for this phase.
- **No Tailwind** — any new CSS for case-study pages/SEO partial uses plain CSS with `:root` custom properties from the existing token system (`src/styles/tokens.css`), matching the pattern already used by `SystemsList.astro`/`Hero.astro`.
- **Fonts self-hosted, no CDN dependency** — not directly implicated by this phase (no new fonts), but the OG image and any new typography on case-study pages must reuse the existing self-hosted `Source Serif 4`/`Cascadia Code` faces, never a Google Fonts `<link>`.
- **`@astrojs/sitemap` is the locked sitemap integration** (per CLAUDE.md's own Recommended Stack table) — confirms this research's independent version-verification finding (`3.7.3`).
- **`sharp` (via `astro:assets`) is the locked image-optimization approach**, explicitly called out in CLAUDE.md as available "for free" on the GitHub Actions Node runner — matches this research's OG-image rasterization recommendation (Pattern 4).
- **One hand-authored/bespoke OG image is the locked approach** over `astro-og-canvas`/Satori automation, per CLAUDE.md's Supporting Libraries table — matches CONTEXT.md and this research's recommendation exactly; do not introduce `astro-og-canvas` or any Satori-based dynamic OG generation.
- **`astro/tsconfigs/strict`** (not `strictest`) is the locked base tsconfig — no action needed this phase (already configured), but new `.ts`/`.astro` files (content.config.ts, SEO.astro) must comply, not introduce `any` types or unused locals/params.
- **`astro:transitions`/`ClientRouter` must not be adopted** — case-study pages are plain MPA navigation targets, consistent with the rest of the site; do not add view-transition wrappers around the new `/work/[slug]` routes.
- **GitHub Actions "Actions" deployment mode (not legacy branch deploy)** — no changes needed this phase; the existing `withastro/action@v6` + `actions/deploy-pages@v5` workflow already builds and deploys any new static routes automatically.
- **Every internal href/asset path must respect `site`/`base`** — this project deploys at the GitHub Pages **user root** (`p2401kumar.github.io`, no `base` set, confirmed in `astro.config.mjs`), so plain root-relative paths (`/work/dynamodb-cellularization`, `/og/og-default.png`) are correct as-is; no `import.meta.env.BASE_URL` prefixing needed for this variant (that requirement only applies to the project-site variant, which this repo is not using).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` (already installed) | `7.0.7` [VERIFIED: package.json + `node -e require('astro/package.json').version`] | Content Layer API (`defineCollection`, `glob()` loader, `getCollection`, `render`), `astro/zod` re-export | Already the project's core framework; Content Layer is stable since Astro 5, current in 7.0.7 |
| `@astrojs/sitemap` | `3.7.3` [VERIFIED: `npm view @astrojs/sitemap version`, matches STACK.md] | Generates `sitemap-index.xml`/`sitemap-0.xml` at build time; `filter` option to exclude the 404 route | Astro-core-maintained (`github.com/withastro/astro` monorepo), official integration documented at `docs.astro.build/en/guides/integrations-guide/sitemap/` |
| `sharp` (already vendored, `node_modules/sharp`) | `0.35.3` [VERIFIED: `node_modules/sharp/package.json`] | Rasterize the hand-authored OG SVG to a 1200×630 PNG at build time via a small standalone Node script | Already present as an `astro:assets` transitive dependency — confirmed importable (`./dist/index.cjs` entry point exists in `node_modules/sharp`); no new dependency needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `astro/zod` (re-export, no separate install) | matches `astro@7.0.7`'s bundled zod | Content collection schema definitions | Import `z` from `'astro:content'`'s companion `'astro/zod'` (or `astro:content` re-export per Astro version) — do NOT add a standalone `zod` devDependency; Astro pins its own compatible version internally |
| `astro/loaders` (bundled) | matches `astro@7.0.7` | `glob()` loader for the case-study Markdown files | Standard loader for local Markdown/MDX collections since Astro 5's Content Layer |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Frontmatter-flag structure enforcement (required typed fields per section) | Remark/rehype plugin validating H2 heading text in the Markdown body | Heading-text validation is fragile (string matching on prose headings, breaks on rewording) and much harder to unit-test/"rejects a malformed entry" cleanly; frontmatter fields get native Zod validation for free |
| One static OG image (SVG→PNG via `sharp` script) | `astro-og-canvas` or Satori build-time generation | Only 3 pages need an OG image and all three share the same image (per CONTEXT.md); automation is overkill and adds a dependency for zero marginal benefit at this content volume |
| `npx lighthouse` CLI against live URL | Lighthouse CI (`@lhci/cli`) with `lighthouserc.json` budgets | LHCI is built for repeated CI runs with historical tracking; this phase needs one manual audit-and-fix pass against a live URL, not a CI gate — reach for LHCI only if Lighthouse becomes a recurring regression-tracking need post-launch |

**Installation:**
```bash
npm install @astrojs/sitemap
```

**Version verification:** `npm view @astrojs/sitemap version` → `3.7.3`, confirmed directly in this session (2026-07-17). `sharp@0.35.3` already present in `node_modules` (installed transitively — no explicit install needed; confirm it resolves inside a plain Node script before relying on it, since Astro may only guarantee its own internal use of it).

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@astrojs/sitemap` | npm | 83 published versions, earliest listed 2023 (via `npm view` version history) | not resolved by seam (network signal gap in `package-legitimacy check`) | `github.com/withastro/astro` [VERIFIED: `npm view @astrojs/sitemap repository.url`] | seam returned `SUS` (reasons: `unknown-age`, `unknown-downloads`, `no-repository` — all due to the seam's own registry-fetch signals being null, not evidence of an actual problem) | **Approved — manual override.** Directly verified via `npm view`: 83 published versions, official `withastro/astro` monorepo repo, no `postinstall` script (`npm view @astrojs/sitemap scripts.postinstall` → empty), and it is the exact package named in Astro's own official sitemap integration docs (already used as the project's locked recommendation in `.planning/research/STACK.md`). Treat the seam's `SUS` verdict as a tooling/network limitation in this session, not a legitimacy signal — do not re-flag in planning. |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `@astrojs/sitemap` — flagged by the automated seam due to inconclusive registry signals in this session's network environment, not by any actual suspicious characteristic (see manual override above). No `checkpoint:human-verify` needed given the direct `npm view` cross-check and prior STACK.md approval, but the planner may still add a lightweight `npm view` confirmation step immediately before `npm install` as cheap insurance.

No other new packages are introduced by this phase (no `zod`, no OG library, no Lighthouse devDependency — `npx lighthouse` runs ad hoc without a persistent install).

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────┐
│ src/content/case-studies/│  (Markdown files: dynamodb-cellularization.md,
│  *.md                    │   elb-auto-weight-away.md)
└────────────┬─────────────┘
             │ glob() loader reads files at build/dev-sync time
             ▼
┌─────────────────────────┐      ┌────────────────────────┐
│ src/content.config.ts    │──────▶ astro sync / astro build│
│  defineCollection +      │      │  Zod schema validation  │
│  zod schema               │      │  FAILS build if invalid │
└────────────┬─────────────┘      └────────────────────────┘
             │ getCollection('case-studies') inside getStaticPaths()
             ▼
┌─────────────────────────┐
│ src/pages/work/[slug].astro│
│  render(entry) → <Content/> │
│  composed with:             │
│   BaseLayout + SEO partial  │
│   + SiteHeader + SiteFooter │  (every-page lesson, Phase 1 gap)
└────────────┬─────────────┘
             │ astro build (static output)
             ▼
┌─────────────────────────┐     ┌──────────────────────────┐
│ dist/work/<slug>/index.html│──▶│ @astrojs/sitemap hook      │
│ dist/index.html             │   │ writes sitemap-index.xml   │
│                              │   │ filter() excludes /404/    │
└──────────────────────────┘     └──────────────────────────┘
             │
             ▼ GitHub Pages deploy (existing Actions workflow)
┌─────────────────────────┐
│ Live URL                  │──▶ npx lighthouse (headless Chrome,
│ p2401kumar.github.io      │     already installed) OR PageSpeed
│                            │     Insights API (no-key fallback)
└─────────────────────────┘
```

Entry point: a Markdown file under `src/content/case-studies/`. Processing stages: Zod schema validation at sync/build → static route generation via `getStaticPaths()` → HTML composition through the shared layout/SEO chain → sitemap hook appends the route → GitHub Pages serves the static file → Lighthouse audits the deployed result out-of-band.

### Recommended Project Structure
```
src/
├── content.config.ts          # defineCollection + zod schema (NEW — root of src/, not src/content/)
├── content/
│   └── case-studies/
│       ├── dynamodb-cellularization.md
│       └── elb-auto-weight-away.md
├── components/
│   └── SEO.astro              # NEW — reusable head partial (title/desc/canonical/OG/twitter)
├── pages/
│   └── work/
│       └── [slug].astro       # NEW — case-study route (getStaticPaths + render)
public/
├── og/
│   └── og-default.png         # NEW — 1200×630, committed static asset
├── og-source.svg               # NEW (repo-root or scripts/, not served) — hand-authored source for the OG PNG
└── robots.txt                  # NEW — points at the sitemap
scripts/
└── render-og.mjs                # NEW — one-time/rerunnable sharp SVG→PNG rasterizer
```

**Note on `content.config.ts` location:** Astro 5+ Content Layer expects this file at `src/content.config.ts` (project root of `src/`, sibling to `content/`), **not** inside `src/content/config.ts` (the pre-Content-Layer legacy location). Confirm this path exactly when scaffolding — a misplaced config file is a common migration-era mistake in current blog posts/StackOverflow answers that predate the Content Layer API.

### Pattern 1: Content Layer collection with glob() loader
**What:** Define the case-studies collection with a `glob()` loader pointed at `src/content/case-studies/`, schema-validated with Zod.
**When to use:** Any locally-authored Markdown collection (this is the standard as of Astro 5+; the old `src/content/config.ts` + implicit-type-by-folder pattern is legacy).
**Example:**
```typescript
// Source: docs.astro.build/en/guides/content-collections/ (fetched this session)
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: z.object({
    title: z.string(),
    systemId: z.string(), // must match a src/data/systems.ts `name`
    dateRange: z.string(),
    standfirst: z.string(),
    metrics: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
        source: z.string(), // honesty-gate provenance, per-metric
      })
    ).min(1),
    // Structural enforcement of problem/approach/impact — see Pitfall 1
    problem: z.string().min(1),
    approach: z.string().min(1),
    tradeoffs: z.string().min(1),
    impact: z.string().min(1),
  }),
});

export const collections = { 'case-studies': caseStudies };
```

### Pattern 2: getStaticPaths + render() in [slug].astro
**What:** Generate one static route per collection entry and render its Markdown body.
**When to use:** Standard pattern for any statically-pre-rendered collection-backed route.
**Example:**
```typescript
// Source: docs.astro.build/en/guides/content-collections/ (fetched this session)
// src/pages/work/[slug].astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SiteHeader from '../../components/SiteHeader.astro';
import SiteFooter from '../../components/SiteFooter.astro';
import SEO from '../../components/SEO.astro';

export async function getStaticPaths() {
  const entries = await getCollection('case-studies');
  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<BaseLayout title={entry.data.title}>
  <SEO
    title={entry.data.title}
    description={entry.data.standfirst}
    ogImage="/og/og-default.png"
  />
  <SiteHeader />
  <!-- case-study chrome: metrics strip, Content, cross-link -->
  <SiteFooter />
</BaseLayout>
```
Note: `entry.id` is the Content Layer identifier (there is **no** separate reserved `slug` field on glob-loaded collections — the filename-derived `id` is what you route on).

### Pattern 3: Canonical URL + OG meta via Astro.site / Astro.url
**What:** Build absolute canonical/OG URLs from the configured `site` and the current request path.
**When to use:** Every page that ships OG/canonical meta (i.e. every page, via `BaseLayout` → `SEO` partial).
**Example:**
```astro
---
// Source: websearch synthesis of Astro official pattern (Astro.url/Astro.site), cross-referenced
// against docs.astro.build/en/reference/api-reference/ conventions — MEDIUM confidence, standard idiom
interface Props {
  title: string;
  description: string;
  ogImage?: string;
}
const { title, description, ogImage = '/og/og-default.png' } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const ogImageURL = new URL(ogImage, Astro.site);
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:image" content={ogImageURL} />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```
`Astro.site` returns `undefined` if `site` is unset in `astro.config.mjs` — already set (`https://p2401kumar.github.io`), so this resolves correctly. [CITED: docs.astro.build/en/reference/api-reference/]

### Pattern 4: Build-time OG image rasterization with sharp
**What:** A standalone Node script (not part of the Astro build graph, run manually or as an npm pre-build step) that reads the hand-authored SVG and rasterizes it to a 1200×630 PNG with `sharp`.
**When to use:** Once per OG image design; rerun only when the design changes.
```javascript
// scripts/render-og.mjs — Node script using the sharp already vendored in node_modules
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync(new URL('../og-source.svg', import.meta.url));
await sharp(svg, { density: 144 })
  .resize(1200, 630)
  .png()
  .toFile(new URL('../public/og/og-default.png', import.meta.url));
```
Run with `node scripts/render-og.mjs` and commit the resulting PNG to `public/og/` — do not wire this into `astro build` (matches the project's existing font-subsetting pattern of "one-time build step, commit the artifact," per STACK.md).

### Anti-Patterns to Avoid
- **Heading-text parsing for structure validation:** don't validate "does the Markdown body contain an H2 called Problem/Approach/Impact" via a remark plugin — brittle, hard to unit-test, and the error message on failure is worse than a Zod field error. Use required typed frontmatter fields instead (Pattern 1).
- **Trusting `astro check` alone to prove schema rejection:** demonstrate the "rejects a malformed entry" success criterion with a failed `npm run build`/`astro build` exit code, not just `astro check` output (see Pitfall 1).
- **Wiring OG rasterization into the Astro build graph:** keep it a separate, rerunnable script — mirrors the existing font-subsetting convention and avoids adding `sharp` as an explicit build-time dependency risk if Astro's internal vendoring of it ever changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Sitemap XML generation | Hand-written `sitemap.xml` in `public/` | `@astrojs/sitemap` | Auto-updates as routes are added/removed; hand-written sitemaps silently drift when a page is added or the 404 route changes shape |
| Content schema validation | Custom frontmatter-parsing + hand-rolled assertions in the page component | Zod schema in `content.config.ts` | Zod gives typed inference, build-time failure, and a single source of truth for "what a valid case study looks like" — hand-rolled checks in the page template run too late (after the page already tried to render) |
| Canonical/OG URL construction | String-concatenating `"https://p2401kumar.github.io" + Astro.url.pathname` | `new URL(Astro.url.pathname, Astro.site)` | Handles trailing slashes, query-string stripping, and protocol/host correctness consistently; string concatenation is a classic source of double-slash or missing-slash bugs |

**Key insight:** every "don't hand-roll" here is really the same insight once — Astro's Content Layer + its own URL/meta conventions already solve the exact problems this phase has (validated structured content, correct absolute URLs); the risk is reaching for ad hoc string/regex solutions that duplicate what the framework already does more reliably.

## Common Pitfalls

### Pitfall 1: `astro check` silently passing on schema violations
**What goes wrong:** A malformed case-study entry (e.g., missing `metrics` array) is committed, `astro check` exits green, and the team believes the schema gate works — until `astro build` (or worse, the live deploy) fails or silently renders broken content.
**Why it happens:** Historically (`withastro/language-tools` discussion #982), `astro check`'s TypeScript-checking pass was distinct from the Content Layer's Zod validation pass, and didn't trigger a sync that would surface schema errors. This was fixed in Astro 5.0.6+ (implicit sync now runs during `astro check`), and the project is on 7.0.7 — but the safest, CI-provable signal remains the build itself. [CITED: github.com/withastro/language-tools/discussions/982]
**How to avoid:** The phase's negative test (a deliberately malformed fixture) MUST assert that `npm run build` (i.e. `astro build`) exits non-zero — not just that `astro check` reports an error. Run both if convenient, but gate on the build.
**Warning signs:** A "passing" `astro check` on a branch that later fails `astro build` in CI.

### Pitfall 2: Sitemap filter not actually filtering (known historical bug)
**What goes wrong:** A `filter` function is configured in `@astrojs/sitemap` but the excluded page still appears in the generated sitemap.
**Why it happens:** `withastro/astro` issue #7256 documented a case where `filter` did not behave as expected in certain integration-ordering scenarios.
**How to avoid:** After adding the sitemap integration with a `filter: (page) => !page.includes('/404')`-style exclusion, actually open `dist/sitemap-0.xml` post-build and grep for `/404` — don't just trust the config. This is a cheap, concrete verification step (matches CONTEXT.md's "exactly 3 pages" acceptance bar).
**Warning signs:** Sitemap entry count doesn't match the expected page count.

### Pitfall 3: `content.config.ts` in the wrong location
**What goes wrong:** Following an outdated tutorial, the collection config is placed at `src/content/config.ts` (pre-Content-Layer convention) instead of `src/content.config.ts`, and the collection silently fails to register or `astro:content` types don't generate.
**Why it happens:** The Content Layer API (stable since Astro 5) moved the config file location; many still-indexed blog posts and Stack Overflow answers predate this and show the old path.
**How to avoid:** Create the file at `src/content.config.ts` exactly (sibling to `src/content/`, not inside it).
**Warning signs:** `getCollection()` returns an empty array, or TS types for the collection never appear.

### Pitfall 4: Missing `<SiteHeader />`/`<SiteFooter />` on new pages (repeat of the Phase 1 gap)
**What goes wrong:** `src/pages/work/[slug].astro` wraps content in `BaseLayout` only, omitting the header/footer — exactly the gap documented in `01-VERIFICATION.md` for `404.astro`.
**Why it happens:** `BaseLayout` intentionally does not include header/footer (they're page-composed, per `index.astro`'s pattern), so it's easy to forget them on a new page type.
**How to avoid:** Compose `[slug].astro` explicitly with `SiteHeader` + `SiteFooter` exactly like `index.astro` does; verify by grepping the built `dist/work/*/index.html` for `<header` and `all systems operational`, mirroring the exact verification method already used to catch this gap in Phase 1.
**Warning signs:** A rendered case-study page missing the nav bar or the live-clock footer.

### Pitfall 5: `npx lighthouse` failing to auto-detect Chrome
**What goes wrong:** `npx lighthouse <url>` throws `CHROME_PATH must be set` even though Chrome is installed, because `chrome-launcher`'s auto-detection can miss non-default install locations or PATH quirks on Windows.
**Why it happens:** `chrome-launcher` (Lighthouse's dependency) probes a list of common Windows install paths; if Chrome was installed via a non-standard method it may not be found automatically. [CITED: github.com/GoogleChrome/lighthouse/issues/5424, #6105]
**How to avoid:** This machine has Chrome at the default path (`C:\Program Files\Google\Chrome\Application\chrome.exe`, confirmed present this session), so auto-detection should work. If `npx lighthouse` fails with a `CHROME_PATH` error anyway, set it explicitly: `CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npx lighthouse ...` (bash) or `$env:CHROME_PATH=...` (PowerShell). Fall back to the PageSpeed Insights API v5 (no key required for a handful of manual checks) if local Chrome launch cannot be made to work at all.
**Warning signs:** Lighthouse CLI exits immediately with a Chrome-not-found error.

## Code Examples

### Sitemap integration with 404 excluded
```javascript
// Source: docs.astro.build/en/guides/integrations-guide/sitemap/ (websearch-corroborated this session)
// astro.config.mjs — add alongside existing FontaineTransform plugin config
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://p2401kumar.github.io',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/404/') && !page.endsWith('/404'),
    }),
  ],
  // ...existing vite/FontaineTransform config unchanged
});
```
Verify post-build: `grep -c '<url>' dist/sitemap-0.xml` should report exactly 3 (home + 2 case studies), and `grep 404 dist/sitemap-0.xml` should report zero matches (Pitfall 2).

### robots.txt
```
# public/robots.txt — new file, none exists yet in this repo (confirmed this session)
User-agent: *
Allow: /

Sitemap: https://p2401kumar.github.io/sitemap-index.xml
```

### Negative-test fixture for schema rejection (CASE-03 acceptance proof)
```markdown
<!-- src/content/case-studies/__malformed-fixture.md (TEMPORARY — create, prove failure, then delete) -->
---
title: "Malformed test entry"
systemId: "dynamodb/cellularization"
# missing dateRange, standfirst, metrics, problem, approach, tradeoffs, impact
---
This entry is deliberately incomplete to prove the schema rejects it.
```
Run `npm run build`; expect non-zero exit with a Zod validation error naming the missing fields. Delete the fixture immediately after capturing the failing-build evidence (do not leave it in the repo — it would break the real build).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| `src/content/config.ts` + folder-based implicit collections (Astro 2–4) | `src/content.config.ts` + explicit `loader:` (Content Layer API) | Astro 5.0 (Dec 2024) | Old tutorials/blog posts showing the pre-5.0 path or a reserved `slug` field are outdated for this project's Astro 7.0.7 |
| `astro check` silently passing schema errors | Implicit `astro sync` during `astro check`, surfaces schema errors | Astro 5.0.6 | Reduces (but per this research, does not eliminate the need to verify via) `astro check` reliability — still gate the negative test on `astro build`, the unambiguous signal |

**Deprecated/outdated:**
- Reserved `slug` frontmatter field: Content Layer collections use `id` (derived from filename or loader), not a special `slug` field — do not add a `slug: ...` frontmatter key expecting Astro to treat it specially.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Astro.site`/`Astro.url` canonical-URL pattern (`new URL(Astro.url.pathname, Astro.site)`) is the current idiomatic approach in Astro 7 | Architecture Patterns, Pattern 3 | Low — this is a long-standing, stable Astro API surface; even if a newer helper exists, this pattern still produces correct absolute URLs |
| A2 | PageSpeed Insights API v5 works without an API key for a handful of manual/ad hoc audits (no hard documented rate limit found for keyless use) | Environment Availability, Pitfall 5 | Low-medium — if keyless requests are rate-limited more aggressively than assumed, the fallback audit path may need a free API key (trivial to obtain, no cost) |
| A3 | `chrome-launcher`'s Windows auto-detection will find Chrome at the confirmed default path without needing `CHROME_PATH` set | Pitfall 5, Environment Availability | Low — if wrong, the documented `CHROME_PATH` env-var override is a one-line fix already provided |

**If this table is empty:** N/A — see entries above; none block planning, all have documented low-risk fallbacks.

## Open Questions

1. **Exact frontmatter field names for problem/approach/impact enforcement**
   - What we know: CONTEXT.md leaves the exact schema shape to Claude's discretion; the structural requirement is that all three sections (plus the trade-offs subsection) are required and independently validatable.
   - What's unclear: Whether to store each section as a single `z.string()` (rendered as sanitized-HTML-from-markdown-string via a helper) or as distinct Markdown body regions marked by comments/components. This research recommends distinct typed frontmatter fields (Pattern 1) as the simplest, most provably-testable shape, but the exact key names (`problem` vs `problemStatement`, etc.) are a planning-time naming decision, not a research blocker.
   - Recommendation: Planner should lock the exact field names in the plan; this doesn't need further research.

2. **Whether `sharp` is safe to import directly in a standalone Node script outside Astro's own build**
   - What we know: `sharp@0.35.3` is present in `node_modules` with a `main` entry (`./dist/index.cjs`) that resolves; this is how `astro:assets` uses it internally.
   - What's unclear: `sharp` ships native platform binaries — it wasn't executed (only its manifest was inspected) in this research session, so actual rasterization success on this Windows machine is unconfirmed.
   - Recommendation: Planner should have the OG-image task run `node scripts/render-og.mjs` as its own verification step (produces a real PNG or fails loudly) rather than assuming success from this research.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Google Chrome | `npx lighthouse` headless audit | ✓ [VERIFIED: `C:\Program Files\Google\Chrome\Application\chrome.exe` present] | not probed (executable found, version not queried) | PageSpeed Insights API v5 (no key, keyless quota undocumented but suitable for occasional manual checks) |
| `npx` / npm registry access | `npx lighthouse` (not pre-installed as a devDependency) | ✓ [VERIFIED: `npx --version` → 10.9.7; `npm view lighthouse version` → 13.4.0 resolves] | npx 10.9.7, lighthouse 13.4.0 latest | If offline/registry-blocked at audit time, use PageSpeed Insights API instead (no local install needed) |
| `sharp` native binary | OG image rasterization script | ✓ present in `node_modules` (manifest-confirmed) | 0.35.3 | Hand-rasterize the SVG with any external tool (e.g. Inkscape CLI, an online converter) and commit the PNG directly — CONTEXT.md explicitly allows "commit the PNG directly" as an equally valid path |
| Node.js ≥ 22.12 | project engines requirement, OG script, all tooling | ✓ [VERIFIED: `node --version` → v22.22.2] | v22.22.2 | — |

**Missing dependencies with no fallback:** none identified.
**Missing dependencies with fallback:** Chrome-launch failure for `npx lighthouse` → PageSpeed Insights API; `sharp` rasterization failure → hand-committed PNG (already an approved path per CONTEXT.md).

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` per `.planning/config.json`. This is a fully static site with no authentication, no session, no server-side execution, and no user input collected or processed at runtime — most ASVS categories are structurally inapplicable.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No login/auth surface exists anywhere on this static site |
| V3 Session Management | No | No sessions — fully static, stateless pages |
| V4 Access Control | No | All pages are public by design (portfolio site) |
| V5 Input Validation | Yes — build-time only, not runtime | Zod schema on the case-study content collection (Pattern 1) is the input-validation boundary; it validates *content authored into the repo*, not end-user input (there is no form/input surface on the site) |
| V6 Cryptography | No | No secrets, no crypto operations in this phase's scope |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Malformed/incomplete case-study content shipping to production (breaks the honesty gate — CONT-07/CASE-03) | Tampering (content integrity, not a security exploit in the traditional sense) | Zod schema validation failing the build (Pattern 1, Pitfall 1) — treat content correctness as the phase's actual "input validation" concern given there is no attacker-controlled runtime input |
| OG/meta tag injection via unescaped frontmatter strings | Tampering/Spoofing (if content were ever externally sourced) | Not applicable this phase — all content is developer-authored in the repo, not user-submitted; Astro's templating auto-escapes interpolated values by default regardless |

No further security surface is introduced by this phase — the entire threat model reduces to "does the build correctly refuse to ship content that violates the honesty/structure contract," which is covered by the Content Layer schema gate above.

## Sources

### Primary (HIGH confidence)
- `docs.astro.build/en/guides/content-collections/` — fetched directly this session (WebFetch); confirmed `content.config.ts` location, `glob()` loader syntax, `getCollection`/`render`/`getStaticPaths` pattern
- Direct environment probes this session: `npm view @astrojs/sitemap version` (3.7.3), `npm view @astrojs/sitemap repository.url`, `node --version` (v22.22.2), `npx --version` (10.9.7), `npm view lighthouse version` (13.4.0), Chrome executable existence check, `node_modules/sharp/package.json` inspection, `node -e require('astro/package.json').version` (7.0.7)

### Secondary (MEDIUM confidence)
- `github.com/withastro/language-tools/discussions/982` (fetched via WebFetch) — `astro check` vs `astro sync` schema-validation behavior, fixed in Astro 5.0.6
- WebSearch synthesis: `@astrojs/sitemap` `filter` option syntax (`docs.astro.build/en/guides/integrations-guide/sitemap/`), corroborated against `github.com/withastro/astro/issues/7256` (historical filter bug)
- WebSearch synthesis: `Astro.site`/`Astro.url` canonical-URL construction pattern — standard idiom, multiple independent sources agree
- WebSearch synthesis: `npx lighthouse` Chrome auto-detection and `CHROME_PATH` fallback (`github.com/GoogleChrome/lighthouse` issues #5424, #6105)
- WebSearch synthesis: PageSpeed Insights API v5 keyless usage viability (`developers.google.com/speed/docs/insights/v5/get-started` referenced, not directly fetched)

### Tertiary (LOW confidence)
- None retained as authoritative — all findings above were either directly verified in this environment or corroborated against an official/semi-official source (Astro docs, GitHub issues in the relevant repos).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version claim directly verified via `npm view`/local filesystem inspection this session, not carried over from training data
- Architecture: HIGH — Content Layer syntax fetched directly from official docs this session
- Pitfalls: MEDIUM-HIGH — the `astro check` silent-pass issue and sitemap `filter` bug are sourced from real GitHub issues, cross-referenced against the specific fix version; Lighthouse/Chrome-detection guidance is MEDIUM (websearch-only, standard/well-known behavior, not fetched from Google's own Lighthouse docs)

**Research date:** 2026-07-17
**Valid until:** 2026-08-17 (30 days — stable APIs, but Astro's fast release cadence and Lighthouse's frequent version bumps warrant re-verification if this phase's execution slips past a month)
