# Architecture Research

**Domain:** Static personal portfolio site (Astro, GitHub Pages) with one signature canvas-driven interactive figure
**Researched:** 2026-07-15
**Confidence:** MEDIUM (Astro mechanics corroborated across docs.astro.build + official withastro repos via web search; project-specific structure is this agent's synthesis against the existing HTML prototype and PROJECT.md constraints)

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                         CONTENT LAYER (source of truth)                │
├───────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────┐   ┌────────────────────┐   ┌─────────────────┐ │
│  │ src/content/       │   │ résumé PDF /        │   │ design tokens   │ │
│  │ case-studies/*.md  │   │ LinkedIn export      │   │ (locked palette,│ │
│  │ (+ zod schema)      │   │ (manual transcription)│  │ type, motion)   │ │
│  └─────────┬───────────┘   └──────────┬───────────┘   └────────┬───────┘ │
│            │ getCollection()/render()  │ hand-copied into        │ CSS custom│
│            ▼                           ▼ .astro data/frontmatter │ properties│
├───────────────────────────────────────────────────────────────────────┤
│                          COMPONENT LAYER (Astro, build-time)           │
│  ┌──────────┐ ┌───────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐ │
│  │BaseLayout│ │Header │ │Hero        │ │SystemsList │ │Experience/     │ │
│  │(shell)   │ │/Nav   │ │(thesis)    │ │(work rows) │ │Patents/Skills  │ │
│  └────┬─────┘ └───┬───┘ └─────┬──────┘ └─────┬──────┘ └───────┬───────┘ │
│       │           │           │              │                │         │
│       │      ┌────┴───────────┴──────────────┴────────────────┴──┐     │
│       │      │              Figure01.astro (markup + script tag)  │     │
│       │      └───────────────────────┬─────────────────────────────┘     │
├───────┴─────────────────────────────┼─────────────────────────────────┤
│                    ISOLATED TS MODULE LAYER (client, no framework)      │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  src/lib/fig01/  (model.ts · render.ts · interactions.ts ·       │  │
│  │  index.ts)  — imperative canvas engine, imported via a plain     │  │
│  │  <script type="module"> so Astro bundles/type-checks it but      │  │
│  │  ships zero framework runtime                                    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────────────┤
│                        BUILD / DEPLOY LAYER                            │
│  ┌──────────────┐   ┌───────────────────┐   ┌───────────────────────┐ │
│  │ astro build  │→  │ dist/ static HTML  │→  │ withastro/action →     │ │
│  │ (SSG, no SSR)│   │ + hashed assets     │   │ GitHub Pages           │ │
│  └──────────────┘   └───────────────────┘   └───────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `BaseLayout.astro` | `<html>`/`<head>` shell: meta, OpenGraph, favicon, imports `tokens.css`/`fonts.css`/`global.css` once, defines the `<slot/>` every page fills | Single layout for this site (no marketing vs. app split needed) |
| `SiteHeader.astro` | Mono identity line (`name · seattle`) + nav links | Static markup, no client JS beyond CSS hover |
| `Hero.astro` | Eyebrow, serif thesis `<h1>`, one-line bio, quiet text links | Static markup; bio/links sourced from a small typed data file (`src/data/profile.ts`) so résumé/LinkedIn/GitHub URLs live in one place |
| `Figure01.astro` | DOM shell for the signature figure: canvas element, action buttons, tooltip node, log panel, caption; imports and calls the `fig01` module's `init()` | Astro component template + a scoped `<script>` that imports `src/lib/fig01/index.ts` and calls `initFig01(root)` on `DOMContentLoaded` |
| `src/lib/fig01/*` | The actual interactive engine: node/route topology, render loop, pointer/click handlers, fault-injection state machine, log writer | Vanilla TypeScript, framework-agnostic, unit-testable in isolation from Astro |
| `SystemsList.astro` | Selected-systems rows (date, mono artifact name, description, metric) | Reads from the **same** case-study/metrics data source as `Figure01`'s tooltips, to keep every displayed number single-sourced |
| `ExperienceSection.astro`, `PatentsSection.astro`, `SkillsSection.astro`, `ContactSection.astro` | Remaining static content sections | Static markup driven by small typed data files (`src/data/*.ts`), not content collections (content collections are for the 1–2 long-form case-study pages, not short structured lists) |
| `SiteFooter.astro` | Live Seattle clock + "all systems operational" status | Trivial client script (`setInterval`), can stay inline or in `src/lib/clock.ts` |
| `src/content/case-studies/*.md` + `content.config.ts` | Long-form deep-dive pages (DynamoDB cellularization, auto-weight-away) | Astro content collection with a `glob()` loader + zod schema (title, date, summary, metric, order) |
| `src/pages/work/[slug].astro` | Renders one case study per collection entry | `getStaticPaths()` + `getCollection('case-studies')`, fully prerendered |
| `src/styles/tokens.css` | Single source of truth for the locked design tokens (color, spacing, motion timing) as `:root` custom properties | Imported once in `BaseLayout`; every component reads via `var(--token)` |
| `.github/workflows/deploy.yml` | CI build + deploy to GitHub Pages | `withastro/action@v6`, triggered on push to main |

## Recommended Project Structure

```
src/
├── components/
│   ├── SiteHeader.astro       # identity + nav
│   ├── Hero.astro             # eyebrow, thesis h1, bio, links
│   ├── Figure01.astro         # canvas shell + script import (the signature piece)
│   ├── SystemsList.astro      # selected-systems rows
│   ├── ExperienceSection.astro
│   ├── PatentsSection.astro
│   ├── SkillsSection.astro
│   ├── ContactSection.astro
│   └── SiteFooter.astro       # clock + status line
├── layouts/
│   └── BaseLayout.astro       # head/meta/OG, token+font imports, slot
├── content/
│   ├── case-studies/
│   │   ├── dynamodb-cellularization.md
│   │   └── auto-weight-away.md
│   └── config.ts              # defineCollection + zod schema (content.config.ts)
├── data/
│   ├── profile.ts              # name, bio, résumé/LinkedIn/GitHub URLs
│   ├── experience.ts            # Microsoft → AWS → MathWorks → Samsung entries
│   ├── patents.ts
│   └── skills.ts
├── lib/
│   ├── fig01/
│   │   ├── index.ts            # public initFig01(root: HTMLElement): () => void (teardown)
│   │   ├── model.ts            # node/route topology + cell/beam data structures
│   │   ├── render.ts           # rAF draw loop, drawNode/drawBeam/drawGrid
│   │   ├── interactions.ts     # pointer/hover/click, send/fault button wiring, log writer
│   │   └── tokens.ts           # reads CSS custom properties at runtime (see Pattern 2 below)
│   └── clock.ts                # Seattle time formatter
├── pages/
│   ├── index.astro             # composes Header/Hero/Figure01/SystemsList/.../Footer
│   ├── work/
│   │   └── [slug].astro        # case study detail page
│   └── 404.astro
├── styles/
│   ├── tokens.css              # :root custom properties — THE palette from PROJECT.md
│   ├── fonts.css               # @font-face, self-hosted, subsetted
│   └── global.css              # reset + base typography (serif/sans/mono stacks)
└── content.config.ts           # (Astro 5 location) — or src/content/config.ts depending on version
public/
├── fonts/                      # woff2 subsets
├── resume.pdf
├── favicon.svg
└── og-image.png
.github/
└── workflows/
    └── deploy.yml               # withastro/action
```

### Structure Rationale

- **`components/` is flat, one file per section:** the page is a single long-scroll composition (per PROJECT.md's requirement list), not a component tree with deep nesting — flat mirrors the content outline and keeps `index.astro` readable as a table of contents.
- **`lib/fig01/` is deliberately split, not a single file:** the working prototype (`living-graph.html`) is one 200-line IIFE mixing topology, drawing, and interaction. That's fine for a throwaway artifact but risky for "must not regress" — splitting into `model` / `render` / `interactions` gives each concern an independent, diffable surface and lets future changes to one (e.g. adding a fifth cell) not risk breaking another (e.g. tooltip positioning).
- **`data/` (not content collections) for short structured lists:** experience, patents, and skills are small, fixed-shape arrays that don't need Markdown bodies or a collection schema — content collections should be reserved for the two long-form case-study pages where Markdown body + frontmatter genuinely helps.
- **`styles/tokens.css` is the only place colors/spacing are declared as literals:** everything else — CSS *and* the canvas TS module — reads through `var(--token)` or a runtime CSS-var lookup, never a duplicated hex string (see Anti-Pattern 2).

## Architectural Patterns

### Pattern 1: Canvas engine as a plain client `<script type="module">`, not a framework island

**What:** Astro processes unattributed `<script>` tags as TypeScript, bundles and dedupes them, but ships no framework runtime. `Figure01.astro` contains only markup (canvas, buttons, tooltip div, log div) plus a `<script>` that imports `initFig01` from `src/lib/fig01/index.ts` and calls it against the component's root element.
**When to use:** Any interactive piece that is pure DOM/canvas imperative code with no reactive component tree — exactly Fig. 01's shape (a render loop + a few event listeners, no state library needed).
**Trade-offs:** No `client:load`/`client:visible` directive overhead or hydration mismatch risk; the cost is that Astro won't re-run the script on client-side navigation (irrelevant here — this is a single-page, no view-transitions site) and you must handle your own teardown/idempotency if the script could ever run twice.

**Example:**
```astro
---
// src/components/Figure01.astro
---
<figure class="fig">
  <div class="fig-bar">…buttons id="send"/"fault"…</div>
  <div class="fig-stage"><canvas id="fig01-canvas"></canvas><div class="tip" id="fig01-tip"></div></div>
  <div class="fig-log" id="fig01-log"></div>
</figure>
<script>
  import { initFig01 } from '../lib/fig01/index';
  const root = document.currentScript!.parentElement!;
  initFig01(root);
</script>
```

### Pattern 2: Design tokens read at runtime by canvas code, never duplicated as literals

**What:** The existing prototype hardcodes `A='#d99163'`, `GOOD='#57b98a'`, `AMBER='#d9a441'` directly in the canvas JS, separate from the CSS custom properties. That's a drift risk the moment the palette is tuned in one place and not the other. Instead, `src/lib/fig01/tokens.ts` reads the same values from the DOM once at `initFig01()` time via `getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()`, so `tokens.css` stays the single source of truth for every color in both CSS and canvas.
**When to use:** Always, for this project — it directly serves the "every number/value displayed must trace to one source" discipline already established for résumé metrics, extended to visual tokens.
**Trade-offs:** One extra read at init time (negligible cost); requires tokens to be declared on `:root` (already the plan) rather than scoped to a component.

**Example:**
```typescript
// src/lib/fig01/tokens.ts
const css = getComputedStyle(document.documentElement);
export const COLORS = {
  accent: css.getPropertyValue('--accent').trim(),
  good: css.getPropertyValue('--good').trim(),
  amber: css.getPropertyValue('--amber').trim(),
  hairline: css.getPropertyValue('--hair').trim(),
};
```

### Pattern 3: Content collections for long-form pages, typed data modules for short lists

**What:** `defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }), schema: z.object({...}) })` in `content.config.ts`, then `getCollection('case-studies')` + `getStaticPaths()` in `src/pages/work/[slug].astro`, and `render(entry)` to get the `<Content/>` component. Experience/patents/skills stay as plain exported arrays in `src/data/*.ts` consumed directly by their section components — no schema validation needed for data this small and stable.
**When to use:** Reach for a collection only when content has a Markdown body and benefits from schema validation across multiple similar entries (the two case studies now, more later). Don't create a collection for a four-item skills list.
**Trade-offs:** Collections add a small amount of config ceremony; worth it here because case studies are the artifacts most likely to grow in number and need consistent shape (problem → approach → impact, metric).

## Data Flow

### Content Flow (build-time, static)

```
src/content/case-studies/*.md (frontmatter: title, date, summary, metric)
    ↓ validated by zod schema in content.config.ts
getCollection('case-studies')  →  used in SystemsList.astro (summary rows)
    ↓                              and src/pages/work/[slug].astro (getStaticPaths)
render(entry) → <Content/> + headings
    ↓
astro build (SSG)  →  dist/**/*.html (fully static, no server)
    ↓
withastro/action  →  GitHub Pages
```

### Token Flow (one-way, CSS is authoritative)

```
src/styles/tokens.css  (:root { --bg; --panel; --ink; --accent; --good; --amber; --hair; ... })
    ↓ imported once in BaseLayout.astro
    ├── every component's scoped <style> block reads var(--token)
    └── src/lib/fig01/tokens.ts reads the same custom properties via getComputedStyle() at init
```

### Fig. 01 Internal Flow (client-side, after hydrationless mount)

```
model.ts (static node/route topology; ideally metric strings imported from
          the same case-study data used by SystemsList, not re-typed)
    ↓
interactions.ts (send/fault button clicks, pointer hover) → mutates shared state
    (beams[], degraded cell id, hoverNode)
    ↓
render.ts requestAnimationFrame loop reads current state each frame → draws to canvas,
    writes to the DOM log panel and tooltip element as a side channel
```

### Key Data Flows

1. **Résumé truth → content collections/data files → rendered numbers:** every metric shown (in `SystemsList`, case-study pages, and Fig. 01's tooltips) should trace back to one typed source, not be retyped in three places — this is both an architecture concern and a direct requirement from PROJECT.md's "Honesty" constraint.
2. **Tokens → CSS and canvas:** single CSS file is source of truth; canvas module reads, never redeclares.
3. **Markdown → static HTML:** fully build-time, zero runtime content fetching — appropriate for a GitHub Pages static host with no server.

## Scaling Considerations

This is a static personal site, not a multi-tenant app — "scale" here means *content growth* and *interactive-figure growth*, not traffic.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| v1: 2 case studies, 1 figure | Current structure as designed above is sufficient; no pagination, no filtering needed |
| 3–10 case studies (still v1-adjacent) | `SystemsList` may want a "view all" link to a `/work/` index page generated from the same collection; no structural change |
| v2: additional signature figures (e.g. a `/craft` experiments page, explicitly out of scope for v1 per PROJECT.md) | Extract `render.ts`'s draw-loop primitives (rounded-rect nodes, elbow routing, beam gradients, dot-grid substrate) into a small shared `src/lib/canvas-kit/` so a second figure doesn't copy-paste Fig. 01's engine |

### Scaling Priorities

1. **First risk:** token/canvas drift as the palette gets tuned during design polish — mitigated up front by Pattern 2 (runtime CSS-var reads), not something to fix later.
2. **Second risk:** Lighthouse budget erosion as fonts/images are added — mitigated by subsetting fonts at the foundation phase and using `astro:assets` for any raster images (screenshots, OG image) rather than raw `<img>` tags.

## Anti-Patterns

### Anti-Pattern 1: Wrapping Figure01 in a UI framework component with `client:load`

**What people do:** Reach for React/Vue/Svelte + Astro islands out of habit for "the interactive part," adding `client:load` and a framework runtime.
**Why it's wrong:** There's no component state/props tree to justify a framework — it's a canvas render loop plus a handful of DOM listeners. A framework runtime here is pure download/parse cost against a Lighthouse ≥ 90 constraint, for zero DX benefit.
**Do this instead:** Plain `<script type="module">` importing the vanilla TS engine (Pattern 1).

### Anti-Pattern 2: Duplicating design-token values as literals in the canvas module

**What people do:** Hardcode hex strings in the TS/JS drawing code (exactly what the current prototype does: `A='#d99163'`).
**Why it's wrong:** Two sources of truth for the same value inevitably drift the first time the palette is adjusted during polish, and nothing catches it — the canvas figure is the single most visible element on the page, so a drifted accent color there is maximally noticeable.
**Do this instead:** Read CSS custom properties at runtime (Pattern 2).

### Anti-Pattern 3: Hand-writing case-study pages as one-off `.astro` files

**What people do:** Skip content collections and just write `src/pages/work/dynamodb.astro`, `src/pages/work/weight-away.astro` with inline JSX-like markup for each.
**Why it's wrong:** No schema validation means the "problem → approach → impact + metric" shape can silently drift between the two pages, and adding a third case study means copy-pasting a whole page template instead of dropping in a Markdown file.
**Do this instead:** One `case-studies` collection with a zod schema enforcing the shape, one `[slug].astro` template.

### Anti-Pattern 4: Deciding the GitHub Pages base path late

**What people do:** Build out all internal links and asset references, then discover at deploy time whether the site lives at `p2401kumar.github.io` (root) or a project path (`/portfolio/`), requiring `astro.config.mjs`'s `site`/`base` to be retrofitted and every root-relative link/asset checked.
**Why it's wrong:** Root-vs-project-path changes how `Astro.url`, internal `<a href>`s, and asset URLs resolve; catching this after building 10 components means touching all of them.
**Do this instead:** Decide root vs. project path (PROJECT.md already flags this as an open deploy-phase decision) and set `site`/`base` in `astro.config.mjs` during the foundation phase, before any component links are written.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Pages | Static file hosting, no server | Decide root (`p2401kumar.github.io`) vs. project path before wiring links (Anti-Pattern 4); existing `.../home` repo must be retired or redirected |
| GitHub Actions (`withastro/action`) | CI: build + deploy on push to main | Requires repo Settings → Pages → Source = "GitHub Actions"; commit the lockfile so the action detects the package manager |
| Self-hosted fonts | Static assets in `public/fonts/`, `@font-face` in `fonts.css` | No CDN dependency (constraint); subset to the glyphs actually used (serif display + mono + sans) to protect the Lighthouse/perf budget |
| Résumé PDF | Static asset in `public/resume.pdf` | Linked directly; no generation pipeline needed |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `BaseLayout.astro` ↔ page components | `<slot/>` | One layout for the whole site; no nested layouts needed at this scale |
| `tokens.css` ↔ every component/module | CSS custom properties, read-only from the consumer side | One-way: nothing outside `tokens.css` declares a new color/spacing literal |
| `Figure01.astro` ↔ `lib/fig01/*` | DOM query (`document.currentScript!.parentElement` or a `data-fig01-root` attribute) + one `initFig01(root)` call | No Astro props cross this boundary — it's plain DOM, matching the existing prototype's approach, just modularized |
| Content collection ↔ `SystemsList`/`work/[slug]` | `getCollection()` / `getStaticPaths()` | Both consumers read the same entries — no separate "summary" data duplicated elsewhere |

## Sources

- [Project structure — Astro Docs](https://docs.astro.build/en/basics/project-structure/) — MEDIUM confidence (official docs, corroborated across multiple search results)
- [Layouts — Astro Docs](https://docs.astro.build/en/basics/layouts/) — MEDIUM confidence
- [Content collections — Astro Docs](https://docs.astro.build/en/guides/content-collections/) — MEDIUM confidence
- [Content Collections API Reference — Astro Docs](https://docs.astro.build/en/reference/modules/astro-content/) — MEDIUM confidence
- [Scripts and event handling — Astro Docs](https://docs.astro.build/en/guides/client-side-scripts/) — MEDIUM confidence
- [Islands architecture — Astro Docs](https://docs.astro.build/en/concepts/islands/) — MEDIUM confidence
- [withastro/action (official GitHub Pages deploy action)](https://github.com/withastro/action) — MEDIUM confidence
- [Deploy your Astro Site to GitHub Pages — Astro Docs](https://docs.astro.build/en/guides/deploy/github/) — MEDIUM confidence
- [Styles and CSS — Astro Docs](https://docs.astro.build/en/guides/styling/) — MEDIUM confidence
- Existing working prototype `living-graph.html` (session scratchpad artifact referenced in PROJECT.md) — HIGH confidence as a primary source; read directly by this agent to derive the `lib/fig01/` module split and Anti-Pattern 2 (token/canvas drift already present in the prototype today)
- `.planning/PROJECT.md` — HIGH confidence, project's own locked decisions (design tokens, constraints, deployment note)

---
*Architecture research for: Astro portfolio site (static, GitHub Pages, signature canvas figure)*
*Researched: 2026-07-15*
