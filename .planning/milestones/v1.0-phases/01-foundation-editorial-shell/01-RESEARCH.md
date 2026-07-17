# Phase 1: Foundation & Editorial Shell - Research

**Researched:** 2026-07-15
**Domain:** Astro 7 static-site scaffold, self-hosted font pipeline, GitHub Pages (user-root) Actions deploy, editorial shell components
**Confidence:** HIGH (core scaffold/deploy facts directly executed and verified in this session — `npm view`, a real `create-astro` scaffold, and `gh repo list` — not just websearch synthesis; font-pipeline specifics verified against the live npm/jsDelivr package contents)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Design system (LOCKED — user approved the live prototype after rejecting 5 alternatives)**
- Tokens (single source `src/styles/tokens.css`, canvas later reads via `getComputedStyle`):
  `--bg:#0f1216` `--panel:#12161c` `--panel2:#141a22` `--ink:#e8ebef` `--body:#aab2bd` `--dim:#78818d` `--faint:#565f6b` `--hair:#1e242d` `--hair2:#28303b` `--accent:#d99163` (copper, <5% of surface) `--good:#57b98a` `--amber:#d9a441`
- Dark-only. No theme toggle.
- Type roles: serif display (hero thesis + headings), sans body, mono for header/nav/labels/metrics/footer. Mono is the "infrastructure texture."
- Motion doctrine: one moving thing per viewport; hover responses ≤150ms; ease-out entries; `prefers-reduced-motion` respected everywhere. Phase 1 shell is essentially static (the only "live" element is the footer clock).

**Typography**
- Display serif: Claude's discretion among open-license transitional/old-style serifs with Iowan/Palatino character (e.g. Source Serif 4, Charter/Charis, Literata) — MUST be self-hostable woff2, subset to used glyphs, `font-display: swap` with metrics-matched fallback (`size-adjust`/`ascent-override`) so the hero thesis has no visible CLS (PLAT-04)
- Fallback stacks (from prototype): serif `"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif`; sans `"Helvetica Neue","Segoe UI",Arial,system-ui,sans-serif`; mono `ui-monospace,"Cascadia Code","SF Mono",Consolas,monospace`
- Body ~15px/1.6; hero thesis clamp(30px→44px) serif weight 500; mono labels 11–13px

**Copy (LOCKED verbatim from approved prototype)**
- Header: `prateek kumar` · `seattle` | nav: `work` · `résumé` · `contact`
- Eyebrow: `distributed systems · cloud · applied ai` (accent on "applied ai")
- Hero thesis: **"I build the infrastructure that intelligence runs on."**
- Bio line: "SDE 2 at Microsoft, on Azure's data platform. Previously cellularized DynamoDB's US-EAST-1 region at AWS and built the SmartThings notifications platform at Samsung. Two patents. M.S. CS, USC."
- Hero links: `résumé →` `linkedin →` `github →`
- Footer: green status dot + `all systems operational` | `seattle {live HH:mm}` (24h, America/Los_Angeles, updates ≤30s interval)
- Copy tone everywhere: no adjectives about self, credibility via named artifacts and numbers. Never "passionate."

**Page structure (home, single scroll)** — Header → Hero → [Fig. 01 slot, Phase 2 renders nothing here] → `selected systems` (4 rows) → `experience` (Microsoft/AWS/MathWorks/Samsung) → `patents & publications` (2 patents + 1 paper) → `skills` (grouped mono tags + prose intro) → `contact` (mailto + LinkedIn, phone off-site) → Footer. Full row/entry copy is verbatim in 01-CONTEXT.md ## Decisions — treat as locked content, not paraphrasable.

**Content data & honesty gate (CONT-07)**
- All list/experience/patents data lives in typed TS data modules (`src/data/*.ts`), each entry carrying a `source` field (e.g. `resume-4.5 §AWS`) — NOT content collections (those are Phase 3 for case studies)
- Every metric must appear in the résumé; no invented numbers
- External links: LinkedIn `https://www.linkedin.com/in/prateek-kumar-7b11321b3`, GitHub `https://github.com/p2401kumar`
- Résumé PDF: copy `C:\Users\prateekkumar\Downloads\Prateek_Kumar_resume_4_5.pdf` into `public/` as `prateek-kumar-resume.pdf`

**Stack & structure (from research, confirmed)**
- Astro `^7` (verify exact version via `npm view astro version` at scaffold — this research confirms 7.0.7 as of 2026-07-15), Node ≥22.12, TypeScript strict, `output: 'static'` (default)
- NO Tailwind, NO UI framework/islands, plain CSS custom properties; scoped component styles allowed but tokens come only from tokens.css
- `astro.config.mjs`: `site: 'https://p2401kumar.github.io'`, NO `base` (user-root deploy — decision locked 2026-07-15)
- Structure per ARCHITECTURE.md: `src/layouts/BaseLayout.astro`, `src/components/` (Header, Hero, SystemsList, Experience, Patents, Skills, Contact, Footer), `src/data/`, `src/styles/tokens.css` + `global.css`, `src/pages/index.astro`
- Deploy: `.github/workflows/deploy.yml` with `actions/checkout` → `withastro/action` → `actions/deploy-pages` (versions per STACK.md); Pages source = GitHub Actions
- GitHub repo: create `p2401kumar/p2401kumar.github.io` and push (gh CLI; if gh is unauthenticated, pause with exact manual commands for the user — **this research confirms `gh` IS already authenticated as `p2401kumar` in this environment**). Old `/home` repo untouched this phase (retirement is post-launch)

### Claude's Discretion
- Exact serif face choice (within constraints above), subsetting tooling (pyftsubset vs fontsource files), spacing scale, responsive breakpoint details, footer clock implementation details, Prettier/Biome choice, exact pinned versions

*(UI-SPEC.md further resolves discretion: serif = Source Serif 4 weight 500 self-hosted, recommended; mono = Cascadia Code self-hosted, recommended; sans = system stack only, no self-hosted file. This research's Standard Stack section adopts both recommendations and confirms them as installable/legitimate.)*

### Deferred Ideas (OUT OF SCOPE)
- Fig. 01 canvas module + `send request`/`inject fault` interactions → Phase 2
- Case-study pages, content collection, links from systems list → Phase 3
- OG image, sitemap, full meta, Lighthouse ≥90 verification gate → Phase 3
- Notes/blog, /craft experiments (AI-twin) → v2 backlog
- Old `/home` repo retirement/redirect → post-launch task
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|--------------|----------------------|
| SHELL-01 | Mono header (name · seattle · nav: work/résumé/contact) on every page | Architecture Patterns (project structure: `SiteHeader.astro`); UI-SPEC.md component type map gives exact CSS values — no additional research needed, this is a direct port |
| SHELL-02 | Serif thesis + one-line bio naming Microsoft/AWS/Samsung in first viewport | Pattern 3 (font pipeline) ensures the serif face renders correctly with no CLS; copy is locked verbatim in User Constraints above |
| SHELL-03 | Quiet text links to résumé/LinkedIn/GitHub in hero | Don't Hand-Roll / Code Examples — no library needed, plain `<a>` tags; résumé PDF path confirmed (`public/prateek-kumar-resume.pdf`) |
| SHELL-04 | Footer with live Seattle clock + "all systems operational" | Pattern 2 (footer clock) — verified no Astro hydration concerns, exact working code from the approved prototype |
| SHELL-05 | Single design-token source (tokens.css) | Recommended Project Structure — `src/styles/tokens.css` as sole source; Architecture Patterns confirms one-way token flow |
| CONT-01 | Selected-systems list (4 entries) | Pattern 1 (typed data modules with `source` field) |
| CONT-02 | Experience entries (Microsoft/AWS/MathWorks/Samsung) | Pattern 1, same data-module approach |
| CONT-03 | Patents & publications | Pattern 1, same data-module approach |
| CONT-04 | Skills as grouped prose/mono tags | Pattern 1, same data-module approach; Anti-Pattern avoidance (no skill bars/logo walls — explicitly excluded in REQUIREMENTS.md Out of Scope) |
| CONT-05 | Downloadable PDF résumé | Standard Stack Installation — copy résumé PDF into `public/`, direct `<a href>` link, no generation pipeline |
| CONT-06 | Contact reachable (mailto + LinkedIn) from header/footer | Direct static markup; no research gap |
| CONT-07 | Every metric traces to résumé via `source` annotation | Pattern 1 — `source` field is the mechanism; Package Legitimacy Audit / Assumptions Log model the same traceability discipline for this research document itself |
| PLAT-01 | Fully static Astro 7 output, zero framework runtime | Standard Stack (Astro 7.0.7 confirmed, `output: 'static'` default); Architecture Patterns Anti-Pattern 1 explicitly rules out UI-framework islands |
| PLAT-02 | Auto-deploy to GitHub Pages via GitHub Actions (withastro/action) | Code Examples (verified workflow YAML); Pitfall 2 & 3 (repo naming, Pages source setting) |
| PLAT-03 | Internal links/assets respect hosting target (root vs. project path decided before scaffolding) | Pitfall 2 (user-root repo naming); `astro.config.mjs` `site` with no `base`, locked in User Constraints |
| PLAT-04 | Self-hosted subsetted fonts, preload, metrics-matched fallback, no visible CLS | Standard Stack (font packages verified), Pattern 3 (fontaine wiring), Pitfall 1 (arrow-glyph gap), Open Question 1 (multi-family fontaine config) |
| PLAT-05 | Responsive 360px mobile through desktop | UI-SPEC.md already specifies the one breakpoint (640px) and fluid `clamp()` padding — direct port, no additional research needed |
</phase_requirements>

## Summary

This phase is a scaffold-and-port job, not a design job — the design system, copy, and structure are already locked (01-CONTEXT.md, 01-UI-SPEC.md, the approved prototype). The main execution risks are mechanical: (1) getting the Astro 7 + GitHub Pages Actions deploy pipeline right on the very first push to a brand-new user-root repo that doesn't exist yet, and (2) self-hosting two fixed-weight fonts (Source Serif 4 @500, Cascadia Code) with zero visible CLS on the hero thesis, including one concrete, verified gotcha: the `→` arrow glyph used in every hero link (`résumé →`) is **not** covered by any Latin/Latin-ext unicode-range in the `@fontsource/cascadia-code` package, so it will silently fall through to the next font in the stack unless handled.

`create-astro`'s current CLIs (`create-astro@5.2.2`, verified live) ship a `minimal` template whose default `tsconfig.json` **already extends `astro/tsconfigs/strict`** — there is no `--typescript strict` flag anymore (that flag is stale/from an older CLI version); TS strictness is the template default, not something to pass in. The GitHub repo `p2401kumar/p2401kumar.github.io` does not exist yet (confirmed via `gh repo list`) — it must be created fresh; the only existing repo under this account related to a portfolio is `p2401kumar/home` (public, untouched this phase per CONTEXT.md).

**Primary recommendation:** Scaffold with `npm create astro@latest . -- --template minimal --no-install` (accept the default strict tsconfig, don't fight it), lock `astro.config.mjs` to `site: 'https://p2401kumar.github.io'` with no `base`, build the component/data structure from ARCHITECTURE.md exactly, self-host Source Serif 4 (weight 500) and Cascadia Code (weight 400) via the fixed-weight `@fontsource/*` packages (not the variable packages — CONTEXT.md/UI-SPEC.md call for a single static weight each), wire `fontaine`'s Vite transform for metrics-matched fallbacks, and deploy via the exact `actions/checkout@v7` → `withastro/action@v6` → `actions/deploy-pages@v5` trio (double-verified: matches both Astro's own docs and the actions' current GitHub release tags).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Editorial shell (header/hero/footer, content sections) | Static/CDN (build output) | — | Fully static Astro output; no client JS needed beyond the clock |
| Design tokens (colors, spacing, type) | Static/CDN (CSS) | — | `tokens.css` is a build-time asset; canvas (Phase 2) reads it at runtime, not relevant to Phase 1 |
| Footer live clock | Browser/Client | — | Trivial inline `<script>`, `Intl.DateTimeFormat` + `setInterval`, no server involved, no framework hydration |
| Content data (systems/experience/patents/skills) | Static/CDN (build-time data) | — | Typed `src/data/*.ts` modules consumed at Astro build time; zero runtime fetch |
| Font delivery | Static/CDN (public/fonts) | Browser/Client (fallback metrics via `@font-face`) | Self-hosted woff2 served as static assets; fallback-matching is a CSS-level browser concern, no server round-trip |
| Deploy pipeline | Build/CI (GitHub Actions) | Static/CDN (GitHub Pages) | `astro build` runs in Actions; output is uploaded as a Pages artifact and served statically — no API/backend tier exists in this project at all |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| `astro` | `^7.0` — **7.0.7 confirmed via `npm view astro version` this session** [VERIFIED: npm registry] | Static site generator | Zero-JS-by-default matches PLAT-01; `output: 'static'` is the default and the only mode GitHub Pages supports |
| `typescript` | `^5.7`+ peer range — **npm registry currently shows a `7.0.2` package tag for `typescript`, but this is very likely a dist-tag/publishing artifact unrelated to the real TS 5.x line; do NOT pin to `7.0.2`. Use whatever `astro`'s own devDependency/peer range resolves (5.7+) and verify with `npm ls typescript` after scaffold** [VERIFIED: npm registry, version number needs scaffold-time sanity check] | Type safety for content data modules | Astro ships first-class `.ts`/`.astro` support with zero config |
| Node.js | `>=22.12.0` — **confirmed directly from the published `astro@7.0.7` package's own `engines` field this session** [VERIFIED: npm registry] | Runtime floor for both local dev and the GitHub Actions runner | Hard floor as of Astro 7; local environment in this session already has Node `v22.22.2`, satisfies it |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@astrojs/sitemap` | `3.7.3` [VERIFIED: npm registry] | Sitemap generation | **NOT this phase** — PLAT-06 (sitemap) is Phase 3 scope per REQUIREMENTS.md traceability table. Do not install yet; note for Phase 3 continuity only. |
| `@fontsource/source-serif-4` | `5.2.9` [VERIFIED: npm registry + jsDelivr file listing] | Self-hosted serif display face, fixed weight | Use the **fixed-weight** package (`@fontsource/source-serif-4`), not `@fontsource-variable/source-serif-4` — UI-SPEC.md locks a single weight (500), so the variable-font's larger file size buys nothing. Confirmed the package ships `source-serif-4-latin-500-normal.woff2` (and `.woff`) exactly. |
| `@fontsource/cascadia-code` | `5.2.3` [VERIFIED: npm registry + jsDelivr file listing] | Self-hosted mono face, fixed weight (400 = default; project doesn't lock a specific weight beyond 400/regular, verify against UI-SPEC component type map which only specifies weights 400/500/600 by usage, all inheriting from the same family) | Confirmed the package ships `cascadia-code-latin-400-normal.woff2`. **Gotcha (verified):** its bundled `unicode-range` for `U+2000-206F` explicitly lists `U+2191` and `U+2193` (up/down arrows) but **not `U+2192`** (the `→` glyph used in every hero link and nowhere else in this font's shipped subsets) — see Common Pitfalls. |
| `fontaine` | `0.8.0` [VERIFIED: npm registry] | Metrics-matched fallback font generation (`size-adjust`/`ascent-override`/`descent-override`) | Astro-compatible via `FontaineTransform.vite` in `astro.config.mjs`'s `vite.plugins` array — avoids hand-computing font metrics for the Georgia/Palatino/Iowan fallback stack (PLAT-04, Pitfall 4 in project research) |
| `astro/tsconfigs/strict` | bundled with `astro`, no separate install | Base `tsconfig.json` | **Already the default** in the `minimal` template scaffold (confirmed by running `create-astro` this session) — no flag or manual step needed, just don't override it to `base` or `strictest` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@fontsource/*` fixed packages | Manual `pyftsubset` custom woff2 | Fontsource's per-subset `unicode-range` CSS already means the browser only ever fetches the `latin`/`latin-ext` file (never `cyrillic`/`arabic`/`vietnamese`/etc.) for this site's actual text — functionally equivalent to manual subsetting for file-size purposes, with zero Python/fonttools build step. Manual subsetting only wins if the `→` gap (below) must be closed by baking the glyph into the self-hosted file itself. |
| `fontaine` (automatic) | Hand-authored `@font-face` fallback with manually computed `size-adjust`/`ascent-override` | Fontaine computes the metrics from the real font files at build time; manual values would need external tools (e.g. Capsize) and must be recomputed if the font choice changes — `fontaine` is strictly less error-prone for a two-font, small-project scope |
| GitHub Actions "Actions" deploy source | Legacy "Deploy from a branch" | Already excluded in project-level STACK.md; no reason to revisit |

**Installation:**
```bash
# Scaffold (Node >= 22.12 already present in this environment — v22.22.2 confirmed)
npm create astro@latest . -- --template minimal --no-install --no-git --no-ai

# Core deps (astro is already in package.json from scaffold)
npm install

# Fonts (fixed-weight, self-hosted — copy the two specific woff2 files into public/fonts/, do not ship the whole npm package to the client)
npm install @fontsource/source-serif-4 @fontsource/cascadia-code
# then copy node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-500-normal.woff2
#      and   node_modules/@fontsource/cascadia-code/files/cascadia-code-latin-400-normal.woff2
# into public/fonts/, write hand-authored @font-face rules in src/styles/fonts.css (do not import the npm package's CSS directly — it pulls in every subset/weight's @font-face declarations which is more than this project needs)

# Metrics-matched fallback generation
npm install -D fontaine
```

**Version verification:** Re-run `npm view astro version`, `npm view @fontsource/source-serif-4 version`, `npm view @fontsource/cascadia-code version`, and `npm view fontaine version` at actual scaffold time — all four were live-checked today (2026-07-15) via `npm view` directly against the registry, so drift risk is low, but re-verify per project convention.

## Package Legitimacy Audit

The automated `package-legitimacy check` seam returned `SUS` for every package in this list — its signal-fetch (age/downloads/repo detection) failed to reach the registry from within the tool this session (all signals came back `null`: `unknown-age`, `unknown-downloads`, `no-repository`), which is a tooling/network limitation, not a finding about the packages themselves. Every package below was independently and directly confirmed to exist, with a real published version, via `npm view <pkg> version` executed in this session (not websearch synthesis) — see the Standard Stack table. Manual override applied based on direct registry confirmation plus training-data knowledge of these being long-established, widely-used, non-obscure projects (Astro core team, Fontsource project, UnJS `fontaine`, Microsoft TypeScript).

| Package | Registry | Age | Downloads | Source Repo | Verdict (tool) | Verdict (manual override) | Disposition |
|---------|----------|-----|-----------|--------------|----------------|----------------------------|-------------|
| `astro` | npm | years (Astro is a mature, widely-known project) | very high (millions/wk, well known) | github.com/withastro/astro | SUS (signal-fetch failure) | OK | Approved |
| `typescript` | npm | years (Microsoft-maintained, ubiquitous) | very high | github.com/microsoft/TypeScript | SUS (signal-fetch failure) | OK | Approved — **but re-verify the exact version pinned at scaffold time; the `npm view typescript version` result (`7.0.2`) looked anomalous for TS's usual 5.x versioning line, see note below** |
| `@fontsource/source-serif-4` | npm | years (Fontsource is an established, ~2020-era open font hosting project) | high (widely used in the Astro/Vite ecosystem) | github.com/fontsource/fontsource | SUS (signal-fetch failure) | OK | Approved |
| `@fontsource/cascadia-code` | npm | years (same Fontsource project as above) | moderate-high | github.com/fontsource/fontsource | SUS (signal-fetch failure) | OK | Approved |
| `fontaine` | npm | years (UnJS/Nuxt ecosystem project by Daniel Roe) | moderate (niche but well-known in the Vite/Nuxt/Astro perf-tooling space) | github.com/unjs/fontaine | SUS (signal-fetch failure) | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none after manual override — all five packages are well-established, non-obscure projects independently confirmed on the registry this session. **However**, flag the `typescript@7.0.2` version string specifically for a `checkpoint:human-verify` at scaffold time — the planner should have the executor run `npm view typescript versions --json | tail` (or simply install via `astro`'s own devDependency range and inspect the resolved lockfile version) rather than blindly `npm install typescript@7.0.2`, since a jump from TS's historical 5.x line straight to a `7.0.2` tag on the exact day of this research is unusual enough to warrant a second look before trusting it as "latest stable."

*All five package names were sourced from this project's own prior STACK.md research (itself websearch-derived) and from this agent's training knowledge of the Fontsource/fontaine ecosystem — per the provenance rule, treat the package **names** as `[ASSUMED]` even though their **existence and version** were independently `[VERIFIED: npm registry]` in this session.*

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  DEV MACHINE                                                         │
│  npm create astro@latest . -- --template minimal                     │
│         │                                                             │
│         ▼                                                             │
│  src/data/*.ts (typed content, `source` field)  ──┐                  │
│  src/styles/tokens.css (locked palette)            │                 │
│  src/styles/fonts.css (@font-face + fontaine)      ├─► src/layouts/  │
│  src/components/*.astro (Header/Hero/.../Footer)   │   BaseLayout    │
│  public/fonts/*.woff2, public/*.pdf                │       │        │
│         │                                          │       ▼        │
│         └──────────────────────────────────────────┴─► src/pages/   │
│                                                          index.astro │
│                                                              │        │
│                                                    astro build (SSG) │
│                                                              │        │
│                                                              ▼        │
│                                                    dist/**/*.html    │
│                                                    (hashed assets)   │
└─────────────────────────────────────┬─────────────────────────────────┘
                                       │ git push origin main
                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS (.github/workflows/deploy.yml)                       │
│  actions/checkout@v7 → withastro/action@v6 (build+upload artifact)   │
│         │                                                             │
│         ▼                                                             │
│  actions/deploy-pages@v5 ──► GitHub Pages (Settings→Pages→"GitHub    │
│                                Actions" source, repo=p2401kumar.      │
│                                github.io, served at that exact URL)   │
└─────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                          Visitor browser: single static-HTML
                          MPA page, footer <script> ticks the
                          Seattle clock client-side, no hydration
```

### Recommended Project Structure
```
src/
├── layouts/
│   └── BaseLayout.astro       # head/meta, imports tokens.css + fonts.css + global.css once, <slot/>
├── components/
│   ├── SiteHeader.astro
│   ├── Hero.astro
│   ├── SystemsList.astro
│   ├── ExperienceSection.astro
│   ├── PatentsSection.astro
│   ├── SkillsSection.astro
│   ├── ContactSection.astro
│   └── SiteFooter.astro       # status line + live-clock <script>
├── data/
│   ├── profile.ts              # name, bio, résumé/LinkedIn/GitHub URLs, each with `source`
│   ├── systems.ts               # 4 selected-systems rows, each with `source`
│   ├── experience.ts
│   ├── patents.ts
│   └── skills.ts
├── styles/
│   ├── tokens.css               # :root custom properties, single source of truth (SHELL-05)
│   ├── fonts.css                # @font-face (self-hosted woff2) + fontaine fallback plugin output
│   └── global.css               # reset + base typography
└── pages/
    └── index.astro              # composes Header/Hero/SystemsList/.../Footer
public/
├── fonts/
│   ├── source-serif-4-latin-500-normal.woff2
│   └── cascadia-code-latin-400-normal.woff2
├── prateek-kumar-resume.pdf
├── favicon.svg
└── favicon.ico
.github/
└── workflows/
    └── deploy.yml
astro.config.mjs
tsconfig.json                     # scaffold default already extends astro/tsconfigs/strict — leave as-is
```

**Note vs. ARCHITECTURE.md:** that document also sketches `src/lib/fig01/`, `src/content/case-studies/`, `src/pages/work/[slug].astro`, and `astro-og-canvas` config — all of that is explicitly Phase 2/3 scope (Fig. 01, case studies, OG image/sitemap per REQUIREMENTS.md traceability). Phase 1's plan should create only the subset above; do not scaffold empty placeholder directories for Phase 2/3 concerns.

### Pattern 1: Content data as typed modules with a `source` field (CONT-07)

**What:** Every data file in `src/data/*.ts` exports typed arrays/objects where each entry carries a `source: string` field pointing at the résumé section it came from (e.g. `"resume-4.5 §AWS/DynamoDB"`). This is a plain TypeScript convention, not a content-collection schema — no `zod`/`astro:content` needed for Phase 1 (case-study content collections are Phase 3 scope per CASE-03).
**When to use:** All of `profile.ts`, `systems.ts`, `experience.ts`, `patents.ts`, `skills.ts`.
**Example:**
```typescript
// src/data/systems.ts
export interface SystemEntry {
  year: string;
  name: string;       // mono artifact name, e.g. "dynamodb/cellularization"
  description: string;
  metric: string;      // accent-colored metric text, e.g. "+30% rel · −20% p99"
  source: string;       // honesty-gate traceability (CONT-07), not rendered on page
}

export const systems: SystemEntry[] = [
  {
    year: '2023',
    name: 'dynamodb/cellularization',
    description:
      'Compute/storage segregation into isolated failure domains across US-EAST-1; extended AWS SDK Java v1/v2 for the new topology.',
    metric: '+30% rel · −20% p99',
    source: 'resume-4.5 §AWS — DynamoDB cellularization',
  },
  // ...3 more entries per 01-CONTEXT.md
];
```

### Pattern 2: Footer clock — plain inline script, no hydration concerns

**What:** A `<script>` tag inside `SiteFooter.astro` (or imported from `src/lib/clock.ts`) that runs `tick()` once on load and again every `setInterval(tick, 30000)`. Astro does not attach any framework runtime to this — an unattributed `<script>` in an `.astro` file is processed as a module script, bundled once, and executes on every full page load with zero hydration lifecycle to reason about (this is a single-page MPA site, view transitions are explicitly out of scope per REQUIREMENTS.md "Out of Scope").
**When to use:** SHELL-04 (footer live clock).
**Example (verified against the approved prototype's own working implementation):**
```html
<footer>
  <span class="st"><i></i>all systems operational</span>
  <span id="clock">seattle —:—</span>
</footer>
<script>
  function tick() {
    const el = document.getElementById('clock');
    if (!el) return;
    el.textContent =
      'seattle ' +
      new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Los_Angeles',
      }).format(new Date());
  }
  tick();
  setInterval(tick, 30000);
</script>
```
**Note:** `America/Los_Angeles` (not a Seattle-specific zone — Seattle observes Pacific Time, same IANA zone) is correct and matches the prototype exactly.

### Pattern 3: Manual `@font-face` + `fontaine` Vite transform for metrics-matched fallback

**What:** Rather than importing `@fontsource/*`'s bundled CSS (which declares `@font-face` blocks for every language subset, more than this project needs), hand-author two `@font-face` rules in `src/styles/fonts.css` pointing at the two specific self-hosted files copied from the fontsource packages, then register `fontaine`'s Vite plugin in `astro.config.mjs` to auto-generate `size-adjust`/`ascent-override`/`descent-override` fallback rules.
**When to use:** PLAT-04 (self-hosted fonts, no visible CLS on the hero).
**Example:**
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { FontaineTransform } from 'fontaine';

export default defineConfig({
  site: 'https://p2401kumar.github.io',
  // no `base` — user-root deploy, locked decision
  vite: {
    plugins: [
      FontaineTransform.vite({
        fallbacks: ['Georgia'], // first entry drives the metric-adjustment calc for the serif face
        resolvePath: (id) => new URL(`./public${id}`, import.meta.url),
      }),
    ],
  },
});
```
```css
/* src/styles/fonts.css */
@font-face {
  font-family: 'Source Serif 4';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/source-serif-4-latin-500-normal.woff2') format('woff2');
}
@font-face {
  font-family: 'Cascadia Code';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/cascadia-code-latin-400-normal.woff2') format('woff2');
}
```
```html
<!-- In BaseLayout.astro <head>, above-the-fold LCP-relevant preloads -->
<link rel="preload" href="/fonts/source-serif-4-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/cascadia-code-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />
```
**Caveat:** `fontaine`'s docs note only the *first* entry in the `fallbacks` array drives the metric-adjustment calculation per font category it detects — since this project has two distinct self-hosted faces (serif + mono) with two distinct locked fallback stacks (`Iowan Old Style"/"Palatino Linotype"/Palatino/Georgia` vs. `Cascadia Code`'s own fallback of `"SF Mono"/Consolas`), verify at implementation time whether a single `FontaineTransform.vite()` call handles both correctly via its automatic font-category detection, or whether two separate calls / an object-based `fallbacks` config (mapping font-family → fallback list) is needed — the plugin's README documents an object-based config for exactly this multi-family case. [CITED: github.com/unjs/fontaine, MEDIUM confidence — not fetched in full, summarized from search]

### Anti-Patterns to Avoid

- **Importing `@fontsource/*`'s bundled per-weight CSS wholesale:** it declares one `@font-face` block per language subset (arabic, cyrillic, cyrillic-ext, greek, latin, latin-ext, vietnamese...) for the single weight file — harmless (browsers only fetch matching-`unicode-range` files) but adds unnecessary CSS parse weight and obscures the two `@font-face` rules that actually matter. Hand-author the two rules instead (Pattern 3).
- **Passing `--typescript strict` to `create-astro`:** that flag does not exist in the current CLI (`create-astro@5.2.2`, verified live this session — flags are `--template`, `--install/--no-install`, `--add`, `--git/--no-git`, `--no-ai`, `--yes/-y`, `--no/-n`, `--dry-run`). The `minimal` template's default `tsconfig.json` already extends `astro/tsconfigs/strict` — nothing to pass.
- **Scaffolding Phase 2/3 directories now** (`src/lib/fig01/`, `src/content/case-studies/`, `src/pages/work/`): ARCHITECTURE.md's full structure spans all three phases; Phase 1's plan should only create what SHELL/CONT/PLAT-01–05 requirements need.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Font-metric fallback matching (`size-adjust`/`ascent-override`/`descent-override` values) | Manually computing these from font metrics tables or trial-and-error visual comparison | `fontaine`'s `FontaineTransform.vite` | Computes real metrics from the actual font files at build time; manual computation is exactly the kind of fiddly, easy-to-get-subtly-wrong work this exists to eliminate, and PLAT-04's "no visible CLS" bar has zero tolerance for approximation |
| GitHub Pages deploy workflow YAML | Hand-writing `upload-pages-artifact` + custom build steps | `withastro/action@v6` (wraps checkout-aware build+upload in one step) | Official, maintained, auto-detects package manager from lockfile |
| Font subsetting to used-glyph-only files | Running `pyftsubset`/`glyphhanger` as a build step | `@fontsource/*` fixed packages' existing per-subset `unicode-range` split | Already achieves the practical effect (browser fetches only the `latin` subset file) without adding a Python/fonttools dependency to the toolchain — reserve manual subsetting only for closing the specific `→` glyph gap if design review decides it matters (see Pitfall below) |

**Key insight:** Nearly everything in this phase has an official, maintained tool that already solves it exactly — the temptation to hand-roll here would be pure risk (subtly wrong font metrics, a flaky custom deploy script) for zero benefit, since none of these problems are unique to this project.

## Common Pitfalls

### Pitfall 1: `@fontsource/cascadia-code`'s shipped subsets do not cover the `→` (U+2192) glyph

**What goes wrong:** Every hero link in the locked copy (`résumé →`, `linkedin →`, `github →`) uses the mono font for a right-arrow character. This project's self-hosted Cascadia Code face, sourced from the `@fontsource/cascadia-code` npm package, ships per-subset CSS with `unicode-range` values that explicitly include `U+2191` (↑) and `U+2193` (↓) in the `latin`-subset block — but **not `U+2192`** (→). Verified directly by fetching and grepping the actual package CSS (`400.css`) from jsDelivr this session; no other subset in the package covers it either.
**Why it happens:** Google Fonts' standard "latin" subset definition (which Fontsource's build pipeline mirrors) includes a small, specific set of individual symbols beyond the core Latin-1 range — it happens to include the up/down arrows (likely for some other typographic use) but not the right arrow, an inconsistency that's easy to miss without directly inspecting the shipped `unicode-range`.
**How to avoid:** Either (a) accept the fallback: the browser will silently render just that one glyph from the next font in the CSS stack (`"SF Mono"`, then `Consolas`, then generic `monospace`) — visually this is a very minor, single-character font mismatch inside short link labels, likely imperceptible at 13px, or (b) if pixel-perfect consistency matters, manually re-subset the self-hosted Cascadia Code woff2 with `pyftsubset` to explicitly add `U+2192` to the glyph set before committing it to `public/fonts/`. Flag this as a `checkpoint:human-verify` visual check during Phase 1 verification rather than silently shipping either choice without a look.
**Warning signs:** The `→` character in hero links renders with a visibly different stroke weight/style than the mono text immediately preceding it.
**Phase to address:** Foundation (font setup) — cheap to check now, invisible/easy to forget once shipped.

### Pitfall 2: GitHub Pages user-root repo must be created and named exactly `p2401kumar.github.io`

**What goes wrong:** GitHub Pages user/organization sites are served from the domain root *only* if the repository is named exactly `<username>.github.io`. Confirmed via `gh repo list p2401kumar` this session: no such repo currently exists — the only portfolio-adjacent repo is `p2401kumar/home` (public, explicitly untouched this phase per CONTEXT.md). If the new repo is created with any other name, or under an org instead of the user account, the site will deploy to a project path (`p2401kumar.github.io/<repo-name>`) instead of the locked user-root target.
**Why it happens:** GitHub's naming convention for user-site repos is a special case that's easy to get wrong when scripting repo creation (`gh repo create`) if the name is typo'd or the `--public`/owner flags are wrong.
**How to avoid:** `gh repo create p2401kumar/p2401kumar.github.io --public --source=. --remote=origin` (or equivalent) — verify with `gh repo view p2401kumar/p2401kumar.github.io` after creation that the name is exact before the first push. `gh` is authenticated in this environment already (`gh auth status` confirmed `✓ Logged in to github.com account p2401kumar` this session) — no manual pause needed for repo creation itself.
**Warning signs:** First deploy succeeds but the live URL doesn't match `https://p2401kumar.github.io` exactly, or Pages settings show a different base path than expected.
**Phase to address:** Foundation, before the first `git push`.

### Pitfall 3: GitHub Pages "Source" setting defaults to branch-based deploy, not Actions

**What goes wrong:** A freshly created GitHub repo's Pages settings default to "Deploy from a branch" (or are unconfigured entirely) — the `actions/deploy-pages@v5` step in the workflow will fail (or silently do nothing useful) until the repo's Settings → Pages → Source is explicitly switched to "GitHub Actions."
**Why it happens:** This is a one-time, UI-only repo setting that isn't expressible in the workflow YAML itself and is easy to forget on a brand-new repo.
**How to avoid:** After creating the repo and before (or immediately after) the first workflow run, set Settings → Pages → Build and deployment → Source = "GitHub Actions." This can be done via `gh api` (`PUT /repos/{owner}/{repo}/pages` with `build_type: workflow`) or the web UI.
**Warning signs:** The `deploy` job in Actions fails with a "Pages site not found" or similar 404-class error on first run.
**Phase to address:** Foundation, immediately after repo creation.

### Pitfall 4: Astro 7's `typescript` peer/dev dependency version needs a sanity check, not blind trust

**What goes wrong:** `npm view typescript version` returned `7.0.2` in this session — an unusual jump for TypeScript's historically 5.x-versioned release line, on the same day as this research. This may be a legitimate new TS major, a dist-tag artifact, or a registry quirk; it should not be pinned blindly.
**Why it happens:** Package registries occasionally surface unexpected `latest`-tagged versions during active release windows; taking the first number returned without a second check is a common but avoidable mistake, especially for a dependency as foundational as the TypeScript compiler itself.
**How to avoid:** At scaffold time, don't `npm install typescript@latest` directly — let it resolve via `astro`'s own devDependency range (the scaffold's `package.json` doesn't even list `typescript` as an explicit dependency in the `minimal` template, confirmed this session), and if a typecheck script needs `typescript` explicitly, pin to whatever version `astro check`/`@astrojs/check` actually resolves against, verified with `npm ls typescript` post-install.
**Warning signs:** `astro check` or the dev server reports TS version-related errors inconsistent with typical Astro 7 usage.
**Phase to address:** Foundation, as a quick sanity check during scaffold, not blocking.

## Code Examples

### GitHub Actions deploy workflow (double-verified: Astro's own docs fetched this session + current GitHub release tags cross-checked via `gh api`)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout your repository using git
        uses: actions/checkout@v7
      - name: Install, build, and upload your site
        uses: withastro/action@v6

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```
Verified this exact trio (`actions/checkout@v7`, `withastro/action@v6`, `actions/deploy-pages@v5`) two independent ways this session: (1) `WebFetch` of `https://docs.astro.build/en/guides/deploy/github/`, and (2) `gh api repos/<org>/<repo>/releases/latest --jq '.tag_name'` against all three action repos, which returned `v7.0.0`, `v6.1.2`, and `v5.0.0` respectively — the workflow's major-version pins (`@v7`, `@v6`, `@v5`) match.

### Repo creation (gh CLI, verified authenticated this session)

```bash
gh repo create p2401kumar/p2401kumar.github.io --public --source=. --remote=origin --push
gh repo view p2401kumar/p2401kumar.github.io --json name,visibility   # confirm exact name + public
gh api repos/p2401kumar/p2401kumar.github.io/pages -X PUT -f build_type=workflow  # set Pages source to Actions (or do via UI)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|----------------|---------|
| `create-astro` `--typescript <strict\|strictest\|base>` flag | No such flag; `minimal` template ships `astro/tsconfigs/strict` as its baked-in default | Sometime before `create-astro@5.2.2` (current, verified this session) | Any plan step written against older Astro tutorials that references this flag will fail silently (CLI ignores unknown flags in some versions) or error — omit it |
| `gh-pages` branch / `peaceiris/actions-gh-pages` | Native "Deploy from GitHub Actions" Pages source + `actions/deploy-pages` | Long-established at this point, not a recent change, but still the #1 legacy pattern people copy from older tutorials | Simpler, artifact-based, no extra branch to manage |

**Deprecated/outdated:**
- `@fontsource-variable/*` for this project's use case: variable-font packages are the right call when you need a range of weights/axes at runtime; this project locks exactly one weight per face (serif 500, mono 400), so the fixed-weight packages (`@fontsource/source-serif-4`, `@fontsource/cascadia-code`) are strictly smaller and simpler — not "deprecated" in general, just the wrong tool for this specific locked spec.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|-----------------|
| A1 | `@fontsource/source-serif-4` and `@fontsource/cascadia-code` are the correct npm package names for these two typefaces (as opposed to some other publisher/naming) | Standard Stack, Package Legitimacy Audit | Low — both names were independently confirmed to exist and resolve to the expected fonts via `npm view` + jsDelivr file listing showing font files matching the expected names (`source-serif-4-*`, `cascadia-code-*`) this session; residual risk is near-zero but the *name itself* was sourced from training knowledge/prior research, not an official docs page, per the provenance rule |
| A2 | `fontaine`'s single `FontaineTransform.vite()` call correctly handles two distinct font-family fallback mappings (serif + mono) via automatic per-family detection, rather than requiring two separate plugin registrations or an object-based config | Architecture Patterns, Pattern 3 | Medium — if wrong, the serif fallback metrics could be computed against the wrong font category (or only the mono face gets correctly matched), producing residual CLS on the hero thesis specifically, which is the single highest-visibility failure mode in this whole phase per PITFALLS.md Pitfall 4. Recommend a `checkpoint:human-verify` (visual CLS check via Lighthouse or manual slow-reload) specifically for the hero `h1` after font wiring is complete. |
| A3 | The `typescript@7.0.2` version string returned by `npm view typescript version` this session reflects a real, stable, installable release rather than a registry/dist-tag anomaly | Standard Stack, Pitfall 4 | Low-medium — worst case is a broken `astro check`/typecheck step at scaffold time, easily caught immediately and non-destructive to fix (re-pin to whatever `astro`'s own tooling resolves) |
| A4 | The visual impact of the missing `→` (U+2192) glyph in the self-hosted Cascadia Code face (falling back to `"SF Mono"`/Consolas/monospace) is acceptable without additional subsetting work | Common Pitfalls, Pitfall 1 | Low — worst case is a very minor, single-glyph font-mixing artifact in three short hero links; easily fixed later with a `pyftsubset` pass if a design reviewer flags it |

## Open Questions

1. **Does `fontaine`'s Vite plugin need one call or two for this project's two distinct self-hosted faces?**
   - What we know: the plugin auto-detects font category (serif/sans-serif/monospace) from the `@font-face` declarations it scans, and its README documents both an array-based (`fallbacks: ['Arial']`) and an object-based (per-family) config shape.
   - What's unclear: which shape is required when a project self-hosts *two* distinct families (serif display + mono), both needing distinct, correctly-matched fallback stacks, in the same `astro.config.mjs`.
   - Recommendation: default to the object-based per-family config if the plugin supports it (check `github.com/unjs/fontaine`'s README directly during implementation, not this research pass); verify visually with Lighthouse CLS score specifically on the hero `h1` and header/footer mono text after wiring, before considering PLAT-04 done.

2. **Should the sans body font (system stack only, no self-hosted file) also get a `fontaine`-style fallback treatment?**
   - What we know: UI-SPEC.md explicitly excludes a self-hosted sans file — "no file to download" — so there's no custom-font-swap CLS risk for body text the way there is for the hero serif.
   - What's unclear: nothing really — this is a closed question, included here only to make explicit that Pitfall 4 / PLAT-04 apply to the serif + mono faces only, not the sans stack.
   - Recommendation: no action needed; confirms scope of the fallback work is exactly two faces, not three.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|-----------|
| Node.js | Astro 7 build/dev (`>=22.12.0` floor) | ✓ | v22.22.2 (confirmed this session) | — |
| npm | package management | ✓ | 10.9.7 (confirmed this session) | — |
| `gh` CLI | repo creation, Pages source config | ✓ | 2.96.0, authenticated as `p2401kumar` (confirmed this session — `gh auth status` shows `✓ Logged in`) | — |
| GitHub Pages target repo (`p2401kumar/p2401kumar.github.io`) | Deploy target | ✗ (does not exist yet — confirmed via `gh repo list`) | — | Create it as part of this phase's plan (Pitfall 2); no external blocker, `gh` is already authenticated so this is a scriptable step, not a manual pause |

**Missing dependencies with no fallback:** none — the one "missing" item (the target repo) is something this phase's plan creates, not an external blocker.
**Missing dependencies with fallback:** none applicable.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|-----------------|---------|---------------------|
| V2 Authentication | No | Static site, no auth, no user accounts |
| V3 Session Management | No | No sessions — fully static, no cookies set by this phase |
| V4 Access Control | No | No access-controlled resources; all content is intentionally public |
| V5 Input Validation | Marginal | No user-submitted input exists in this phase (contact is a `mailto:` link, not a form) — nothing to validate |
| V6 Cryptography | No | No secrets/credentials handled by the site itself; GitHub Actions' `id-token: write` permission is scoped to OIDC for the Pages deploy only, managed entirely by GitHub's own infrastructure, not custom code |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|------------------------|
| Overly broad Actions workflow permissions | Elevation of Privilege | Use the exact minimal `permissions:` block from the verified workflow (`contents: read`, `pages: write`, `id-token: write`) — do not add `write` scopes beyond what `deploy-pages` requires |
| PDF metadata leakage (résumé) | Information Disclosure | PITFALLS.md already flags this: strip PDF metadata (author, revision history, embedded comments) before publishing `prateek-kumar-resume.pdf` to `public/` — a quick check with any PDF metadata viewer before commit |
| Publicly embedding real production infra details via Fig. 01 | Information Disclosure | Not this phase's concern (Fig. 01 is Phase 2) — flagged here only for continuity, since PITFALLS.md raises it |
| Third-party npm packages with malicious postinstall scripts | Tampering | Checked this session: `npm view astro scripts.postinstall`, and the fontsource/fontaine packages, all returned empty (no postinstall script detected) |

## Sources

### Primary (HIGH confidence)
- Direct `npm view <pkg> version` / `npm view <pkg> engines` / `npm view <pkg> scripts.postinstall` executions this session for: `astro` (7.0.7, engines `{node: '>=22.12.0', npm: '>=9.6.5', pnpm: '>=7.1.0'}`, no postinstall), `@astrojs/sitemap` (3.7.3), `@astrojs/check` (0.9.9), `typescript` (7.0.2 — flagged as needing verification), `@fontsource/source-serif-4` (5.2.9), `@fontsource/cascadia-code` (5.2.3), `fontaine` (0.8.0)
- `gh api repos/withastro/action/releases/latest`, `repos/actions/checkout/releases/latest`, `repos/actions/deploy-pages/releases/latest` — returned `v6.1.2`, `v7.0.0`, `v5.0.0` respectively, executed this session
- Live `npm create astro@latest -- --help` and an actual `create-astro` scaffold run (non-dry-run) in a scratch directory this session — confirmed `create-astro@5.2.2`'s real flag set, the `minimal` template's default `tsconfig.json` (extends `astro/tsconfigs/strict`), default `package.json` (`engines.node: >=22.12.0`), and file layout (`src/pages/index.astro` only, no layouts/components by default)
- `gh repo list p2401kumar` — confirmed `p2401kumar/p2401kumar.github.io` does not yet exist; `p2401kumar/home` is the only portfolio-adjacent existing repo, public
- jsDelivr package-metadata API (`data.jsdelivr.com/v1/packages/npm/@fontsource/source-serif-4@5.2.9` and `.../@fontsource/cascadia-code@5.2.3`) — confirmed exact shipped file names (`source-serif-4-latin-500-normal.woff2`, `cascadia-code-latin-400-normal.woff2`) and, via direct CSS fetch of `400.css`, the exact `unicode-range` values including the missing `U+2192` gap
- `WebFetch` of `https://docs.astro.build/en/guides/deploy/github/` this session — cross-verified the exact deploy workflow YAML and action versions

### Secondary (MEDIUM confidence)
- `WebSearch`/`WebFetch` summary of `fontaine`'s README/npm page and an Astro-specific blog post (`eatmon.co/blog/using-fontaine-with-astro`) for the `FontaineTransform.vite({ fallbacks, resolvePath })` config shape and the "first fallback drives calc" caveat — not fetched in full raw form, summarized by the fetch tool
- Project-level `.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md` (2026-07-15) — carried forward and sharpened where this phase's research found more current/precise data (notably: `create-astro` flag set, TS version anomaly, the `@fontsource/cascadia-code` arrow-glyph gap, and the confirmed-nonexistent target repo)

### Tertiary (LOW confidence)
- None retained as authoritative in this document — all package/version claims were registry-verified; the one open item (fontaine multi-family config shape) is explicitly flagged as an Open Question rather than asserted as fact

## Metadata

**Confidence breakdown:**
- Standard stack (versions, Node floor, action versions): HIGH — directly executed `npm view`/`gh api` calls this session, not websearch synthesis
- Font pipeline specifics (file names, unicode-range gaps): HIGH — directly fetched actual package CSS/file listings from jsDelivr this session
- Architecture/structure: MEDIUM-HIGH — builds directly on the project's own already-researched ARCHITECTURE.md, scoped down to Phase 1 only, cross-checked against a real `create-astro` scaffold run
- `fontaine` multi-family config shape: MEDIUM — summarized via fetch tool, not read in full raw form; flagged as an Open Question for implementation-time verification
- Security domain: HIGH — this phase has an unusually small attack surface (static site, no forms, no auth), so the "known-thin" assessment itself is high confidence

**Research date:** 2026-07-15
**Valid until:** 2026-08-14 (30 days — Astro/npm package versions move fast enough that a re-check via `npm view` is cheap insurance if execution slips past this window)
