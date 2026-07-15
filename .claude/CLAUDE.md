<!-- GSD:project-start source:PROJECT.md -->

## Project

**Prateek Kumar — Portfolio**

A personal portfolio site for Prateek Kumar (SDE 2 at Microsoft; previously AWS DynamoDB, Samsung SmartThings), positioning him as a senior distributed-systems/cloud engineer at the AI intersection. Static site hosted on GitHub Pages, aimed at recruiters and senior/staff-level hiring managers.

**Core Value:** Within seconds of landing, a senior engineering leader should think "this person operates at our level" — credibility delivered through demonstrated craft (a live systems demo), not adjectives.

### Constraints

- **Hosting**: GitHub Pages (static only, free) — no server-side code; canvas/JS must be self-contained
- **Tech stack**: Astro + vanilla TS/canvas for Fig. 01 — component model + content collections without shipping a framework runtime
- **Fonts**: self-hosted (no CDN dependency); subset for performance
- **Performance**: Fig. 01 must hold 60fps on average laptops (DPR cap 2, batched draws); Lighthouse ≥ 90 across the board
- **Honesty**: every number displayed must trace to the résumé — no invented telemetry

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Astro** | `^7.0` (7.0.9 latest as of 2026-07-13; requires **Node.js ≥ 22.12**) | Static site generator / component framework | Zero-JS-by-default output matches the "no framework runtime" constraint exactly. Astro 7.0 (June 2026) rewrote the core compiler in Rust — 15–61% faster builds — and stabilized route caching; none of that matters much for a ~6-page site, but it means you're not adopting a stagnant tool. Content Collections (stable since v5, now on the Content Layer API) give typed frontmatter for the 1–2 case-study pages and the "selected systems" list without a CMS. `output: 'static'` (the only mode GitHub Pages supports) is Astro's default. |
| **TypeScript** | `^5.7`+ (whatever `astro`'s peer range pulls; do not pin below Astro's own floor) | Type safety for content schemas + the canvas module | Astro ships first-class `.ts`/`.astro` TS support with zero config. The canvas demo (Fig. 01) is the one piece of real interactive logic on the site — typed state machines (node/beam/fault types) are worth it there even though the rest of the site is close to zero script. |
| **GitHub Actions + GitHub Pages (Actions deployment mode, not the legacy branch-based mode)** | `withastro/action@v6`, `actions/checkout@v7`, `actions/deploy-pages@v5` | Build + deploy pipeline | This is Astro's own officially documented workflow (docs.astro.build/en/guides/deploy/github/), fetched and cross-verified twice. `withastro/action` auto-detects your package manager from the lockfile, runs the build, and uploads the Pages artifact; `actions/deploy-pages` then publishes it. This replaces hand-rolling `npm ci && npm run build && actions/upload-pages-artifact` — less to maintain, and it's what Astro's own docs point to as "the recommended way to deploy to GitHub Pages." |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@astrojs/sitemap` | `^3.7` (3.7.3 latest, Astro-core-maintained) | Auto-generates `sitemap-index.xml` / `sitemap-0.xml` at build time | Always — one requirement is explicit ("sitemap"). Requires `site` to be set in `astro.config.mjs` (see below); zero runtime cost since it only runs at build. |
| `@fontsource-variable/<font>` **or manually subsetted `.woff2`** | latest on npm (fontsource packages are per-font, versioned independently) | Self-hosted font files with no CDN dependency | Use **manual subsetting** (see rationale below) for the serif display face and mono face, since the glyph set is small and fixed (Latin + numerals + a handful of symbols: `·`, arrows for the beam diagram, etc.) and file-size control matters for a Lighthouse-90+ target. Fall back to Fontsource only if the chosen open-source face isn't easily subsettable in-house or you want faster iteration during design lock-in. |
| `pyftsubset` (fonttools) or `glyphhanger` | fonttools ≥ 4.x (Python) | Font subsetting to woff2 | One-time build step (not part of the Astro build graph) — run manually or as an npm `postinstall`/pre-commit script, commit the resulting `.woff2` files to `public/fonts/`. Don't wire live subsetting into the Astro build; it adds a Python dependency to CI for no benefit on a site whose fonts never change. |
| `astro-og-canvas` **or a single hand-authored static OG image** | `^0.6` (astro-og-canvas) | Open Graph / social preview image | GitHub Pages only serves static output (`output: 'static'`), so any *dynamic* OG generation (Satori/`@vercel/og`/Playwright screenshots) must run **at build time**, not as a server endpoint — Astro's server-endpoint OG examples assume `output: 'server'`/SSR, which Pages cannot do. Given this site has ~4–6 pages total, prefer **one bespoke, hand-designed OG image** matching the tinted-graphite/copper system (reuse the Fig.01 aesthetic as a static frame) over wiring in Satori for a handful of pages — less moving parts, guaranteed on-brand output, no extra build dependency. Revisit `astro-og-canvas` only if the case-study count grows enough to justify automation. |
| `sharp` | pulled in automatically by `astro:assets` | Image optimization (resume photo, OG image, any raster assets) | Astro uses `sharp` under the hood for its built-in `<Image />`/`astro:assets` pipeline by default on Node-based builds (GitHub Actions runner is Node, so this is free). Use `<Image />` for any raster imagery; skip it entirely for the canvas figure, which is pure vector/procedural drawing, not an image asset. |
| `astro/tsconfigs/strict` | bundled with `astro` | Base `tsconfig.json` | Extend `astro/tsconfigs/strict` (not `strictest`, which is often overkill for a content-driven site and fights `.astro` frontmatter ergonomics). Adds `strict`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`. |
| `astro check` (via `@astrojs/check` + `typescript`) | bundled | CI type-checking of `.astro` + `.ts` files | Run as a CI step (or pre-commit) before `astro build`; catches template-level type errors the TS compiler alone won't see. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Biome** | Formatting + linting (JS/TS/JSON/CSS, and — as of Biome 2.5 — `.astro` frontmatter/lint rules) | Recommended for greenfield 2026 Astro projects over the ESLint+Prettier combo: single Rust-based toolchain, one config file, faster CI. `.astro` support is newer/narrower than Prettier's, so if you hit gaps formatting `.astro` markup specifically, layer in `prettier` + `prettier-plugin-astro` for just that file type rather than reverting the whole toolchain. |
| `prettier` + `prettier-plugin-astro` | Fallback/companion formatter for `.astro` files if Biome's Astro support proves too experimental | Official Astro-maintained plugin; the VS Code Astro extension itself uses this combo, so it's the safest choice if Biome's Astro formatting misbehaves on your specific markup. |
| Astro official VS Code extension | Editor `.astro` syntax highlighting, IntelliSense, TS plugin auto-wiring | Not required for CI but strongly recommended for local dev — auto-installs the Astro TS plugin so editor and `astro check` stay in sync. |
| `npm create astro@latest -- --template minimal` | Project scaffold | Start from the `minimal` template (empty `src/pages/index.astro`, no starter blog cruft) rather than the blog template — this project has a bespoke shell, not a blog layout, and stripping starter content wastes a step. |

## Installation

# Scaffold (Node >= 22.12 required by Astro 7)

# Core integrations

# Dev dependencies

# One-time font tooling (not a runtime/build dependency — used to produce the woff2 files you commit)

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Astro | Next.js (static export) | Only if you needed React Server Components, a framework-native image CDN, or planned client-heavy interactivity across many pages. This project has exactly one interactive island (Fig. 01) and everything else is prose/layout — shipping React's runtime for that is pure overhead against the "zero-JS-by-default" constraint. |
| Astro | 11ty (Eleventy) | 11ty is arguably even lighter for a pure content site, but Astro's component model (`.astro` files with scoped CSS + typed props) is a meaningfully better authoring experience for a hand-crafted, non-templated design system like this one, and its GitHub Pages story (official action, docs) is more turnkey than 11ty's. |
| Manual font subsetting | `@fontsource-variable/*` | Use Fontsource if the chosen serif/mono faces change during design iteration and you want to `npm install` a new face in seconds rather than re-run subsetting — convenience over the last few KB. Also use it if you end up wanting the *full* variable-font axis range (e.g., optical size) rather than 2–3 fixed weights. |
| Biome | ESLint + Prettier | If you hit real gaps in Biome's `.astro` linting (still narrower than its JS/TS coverage as of mid-2026) and want mature, battle-tested `.astro`-aware lint rules, fall back to `eslint-plugin-astro` + `prettier-plugin-astro`. For a project this small, either choice is low-risk. |
| One static OG image | `astro-og-canvas` / Satori build-time generation | Switch to automated OG generation only if the case-study count grows past a handful and hand-updating images per page becomes real toil. |
| GitHub Actions "Actions" deployment source | Legacy "Deploy from a branch" (`gh-pages` branch + `peaceiris/actions-gh-pages` or similar) | Avoid for a new project — it's the older mechanism GitHub is steering people away from; the native Pages Actions flow (`upload-pages-artifact` / `deploy-pages`) is simpler, needs no extra branch, and is what Astro's own docs recommend. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Any UI framework (React/Vue/Svelte) as an Astro integration | Adds a client-side runtime for a site whose only interactive piece is a hand-written canvas module; violates the explicit "component model without shipping a framework runtime" constraint | Plain `.astro` components for structure + a single vanilla TypeScript module (`<script>` / `client:load`-free plain `<canvas>` + module script) for Fig. 01 |
| Tailwind CSS | The design system is already locked with specific token values (bg `#0f1216`, accent `#d99163`, etc.) — Tailwind's utility-class model adds a build step and a class-name abstraction layer that fights a small, bespoke, already-designed token set rather than helping it | Plain CSS with `:root` custom properties for the token system; optionally CSS nesting (native, Astro/PostCSS support it) for component-scoped styles inside `.astro` files, which already get automatic scoping |
| `output: 'server'` / SSR adapters (`@astrojs/node`, `@astrojs/vercel`, etc.) | GitHub Pages cannot run server code at all — any config that assumes a server endpoint (e.g., dynamic OG image routes, on-demand rendering) will fail to deploy there | `output: 'static'` (Astro's default) for everything, including build-time-only OG image generation |
| Legacy `gh-pages` branch deploy scripts (`gh-pages` npm package, manual `git subtree push`) | Extra branch to manage, no artifact provenance, superseded by the native Pages-as-Actions-target flow | `actions/upload-pages-artifact` (implicit inside `withastro/action`) + `actions/deploy-pages` |
| Google Fonts `<link>` / CDN-hosted fonts | Explicit constraint: "self-hosted (no CDN dependency)" | Fontsource npm packages or manually subsetted `.woff2` files under `public/fonts/`, loaded via `@font-face` with `font-display: swap` |
| `astro:transitions`/`ClientRouter` (view transitions) applied blindly across the whole site | Astro's bundled module scripts run once per full page load; with the router enabled, navigating between pages does **not** re-run them, so the Fig. 01 canvas module needs explicit re-init logic on the `astro:page-load` document event, and any code assuming elements persist across navigations will throw if the element isn't on the new page. For a handful of statically-linked pages, this is complexity without much payoff | Skip `ClientRouter` for v1 (plain MPA navigation, which is instant anyway on a static Pages site); if adopted later, gate all Fig. 01 setup/teardown behind `astro:page-load`/`astro:before-swap` listeners with existence checks |

## Stack Patterns by Variant

- Omit `base` in `astro.config.mjs` entirely; `site` alone is enough.
- Retire/archive the old `p2401kumar.github.io/home` repo content (per the open deploy-phase decision in PROJECT.md) rather than running two sites in parallel.
- Set `base: '/<repo>'` and keep `site: 'https://p2401kumar.github.io'`.
- Every internal `href`/`src` that isn't going through Astro's `base`-aware helpers (e.g., raw strings in the canvas module or hand-written links) must be prefixed with `import.meta.env.BASE_URL` — this is the single most common GitHub Pages footgun (broken assets/links after first deploy) and worth flagging explicitly for the deploy phase.
- Manually subsetted static `.woff2` (not variable) per weight, `font-display: swap`, and `<link rel="preload">` for the above-the-fold serif display face only — do not preload every weight/style used across the whole site.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `astro@^7.0` | `@astrojs/sitemap@^3.7` | Astro-core-maintained integration; tracks Astro major releases closely, no known incompatibility as of Astro 5–7. |
| `astro@^7.0` | Node.js `>= 22.12` | Hard floor as of Astro 7.0; GitHub Actions `ubuntu-latest` runners ship a recent Node by default, but pin the Node version explicitly in the workflow (or rely on `withastro/action`'s auto-detection) to avoid drift if the runner image's default changes. |
| `withastro/action@v6` | `actions/deploy-pages@v5`, `actions/checkout@v7` | This exact trio is what Astro's own docs currently publish together; don't mix `withastro/action@v6` with an old `actions/deploy-pages@v2/v3` (older majors used a different artifact contract and Node 20, which GitHub is deprecating through 2026). |
| Biome (Astro `.astro` lint/format support) | Astro `^5`–`^7` | Support is newer and narrower than Biome's JS/TS/CSS coverage — verify formatting output on real `.astro` files early rather than assuming parity with Prettier's plugin. |

## Sources

- https://docs.astro.build/en/guides/deploy/github/ — official GitHub Pages deploy guide; fetched twice (via WebFetch), config shape and exact workflow YAML cross-verified identically both times — HIGH confidence for this specific claim
- https://github.com/withastro/action — official Astro GitHub Action repo — MEDIUM confidence (websearch-sourced summary, not directly fetched)
- https://astro.build/blog/astro-7/ — Astro 7.0 release announcement (fetched directly), release date June 22, 2026, performance/compiler rewrite claims — MEDIUM confidence (page didn't state Node floor directly; floor corroborated by a separate GitHub PR/commit search)
- https://github.com/withastro/astro/commit/3c3b492 ("fix: increase minimum Node version to 18.20.8") and related PR #13809 — used to corroborate Node floor discussion, though the 22.12 figure for Astro 7 came from search-result synthesis, not a directly fetched primary source — MEDIUM confidence, worth re-verifying at project scaffold time with `npm create astro@latest` and reading its own engine check output
- https://www.npmjs.com/package/@astrojs/sitemap — version 3.7.3 — MEDIUM confidence (websearch synthesis, npm registry API fetch itself failed with a TLS error in this environment; re-verify with `npm view @astrojs/sitemap version` locally before pinning)
- https://docs.astro.build/en/guides/typescript/ and https://github.com/withastro/astro/blob/main/packages/astro/tsconfigs/strict.json — official docs, TS preset behavior — HIGH confidence
- https://docs.astro.build/en/guides/view-transitions/ and https://docs.astro.build/en/guides/client-side-scripts/ — official docs on `astro:page-load` re-init semantics — HIGH confidence (this shaped the "skip ClientRouter for v1" recommendation)
- Web search synthesis on Fontsource vs. manual subsetting (multiple independent blog/guide sources, no single authoritative spec) — MEDIUM confidence, directionally solid but treat specific "60–70% size reduction" style numbers as illustrative, not verified benchmarks
- Web search synthesis on Biome vs. ESLint+Prettier for Astro in 2026 (multiple dev-blog sources) — MEDIUM confidence; this is a preference-level tooling call, not a hard technical dependency, so lower confidence here is low-risk
- OG image generation approach (Satori/@vercel/og require `output: 'server'`) synthesized from multiple community blog posts on dynamic OG images with Astro — MEDIUM confidence; the core constraint (GitHub Pages = static only, so build-time-only) is a straightforward logical inference from Astro's own static/server docs, independently HIGH confidence
- No context7 or other curated-registry MCP tool was available in this run (all `config.*_search` flags were `false` and no `mcp__context7__*` tool was exposed); all fetches used the built-in `WebSearch`/`WebFetch` fallback path per the tool-strategy seam

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
