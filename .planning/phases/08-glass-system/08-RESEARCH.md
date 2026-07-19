# Phase 8: Glass System - Research

**Researched:** 2026-07-19
**Domain:** CSS `backdrop-filter` glassmorphism over a real animating scene (Astro static site) + a verifier-tooling re-architecture (CDP screenshot sampling + `sharp` raw decode)
**Confidence:** MEDIUM-HIGH — the milestone-level research (GLASS.md/PITFALLS.md) is well-corroborated; the codebase-specific architecture decisions below are HIGH confidence (grounded in direct reads of the live files, cited by path:line) since this phase is almost entirely "wire a known CSS grammar into a specific, already-read codebase" rather than open technology selection

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Measured foundation (Spike 2, 07-SPIKE-GLASS.md — the numbers that govern this phase)**
- Marginal cost of 4 production-geometry blur(12px) surfaces over the animating scene: +0.47pp CPU (total 4.52% < 10% floor), 60fps, 0 long tasks — full glass PASS, no mitigation ladder required
- Blur sensitivity: 12→16px = +0.68pp main-thread — LOCKED budget rule: **blur(12px) default, 16px hard ceiling**, ≤4 simultaneous surfaces (exactly: panel, header, footer, jump index)

**GLS-03 verifier re-architecture (FIRST task of the phase — hard precondition)**
- verify-contrast.mjs gains a screenshot-sampling mode: in-page glyph-run rect discovery stays (it already computes text rects), but pixel sampling moves to CDP `Page.captureScreenshot` → decode in Node via the ALREADY-INSTALLED sharp (`sharp(png).raw().toBuffer()` — no hand-rolled decoder, no new dependency) → worst-case per-pixel ratio over the text rects. This is the only honest way to measure through a real blur kernel
- Keep the analytic mode for fast pre-glass iteration; the screenshot mode is the GATE. Selftest: a known-ratio fixture (solid panel over solid bg) must agree between modes within tolerance pre-blur; DPR1 only (known DSF-2 CDP screenshot hang on this machine — use --force-device-scale-factor CLI capture only for visual evidence, never for the gate)
- Windows note: sharp is a devDependency via Astro — import it in the script from the project's node_modules

**Glass recipe (research baseline; UI-SPEC finalizes numbers, contrast gate arbitrates)**
- Panels: translucent fill (white ~5-10% alpha family), `backdrop-filter: blur(12px) saturate(150%)` (brightness nudge optional per GLASS.md), 1px top light edge (white ~10%)
- Chrome (header/footer/jump index): lighter — blur(10px), fill ~5%
- TIERING SANCTIONED within the glass grammar (roadmap deliberation): text-dense panels (experience/patents/skills prose) may take a higher-opacity/lower-blur variant if the screenshot-sampled floor demands it; the hero/contact can run glassier. The 4.5:1 worst-case floor is the arbiter — not taste, not uniformity dogma. The existing scrim (deck::before 0.38 peak) may be reduced or retired IF glass fills replace its duty — measured, not assumed; classic mode keeps a working scrim/fallback regardless
- All values as `--glass-*` tokens in tokens.css ONLY (fill alphas, blur radii, edge alpha) — zero hex elsewhere, zero magic numbers in component CSS

**Degradation ladders (GLS-02)**
- `@supports (backdrop-filter: blur(1px))` gates ALL glass; baseline = current opaque `--panel` look (the site as it works today — no visual regression for non-supporting browsers)
- `prefers-reduced-transparency: reduce` → solid surfaces (additive pattern: opaque default in that branch, glass only under no-preference)
- Print: solid, no filters
- No-JS classic mode: glass is pure CSS so it CAN apply — but verify the classic scrolling layout with glass panels stays legible against the static photo (the screenshot gate covers deck mode; classic gets a spot-check at both viewports)

**GLS-04 real-page budget re-proof**
- After glass lands: 60s CDP idle soak on the REAL preview page (05-06/07-02 methodology) — expect ~baseline+0.5pp; total must stay <10% with 60fps and 0 long tasks; record alongside Spike-2's projection
- Lighthouse both presets ≥90 re-run (glass adds compositing but no JS — expect scores held; TBT must stay ~0)

**Floors (all carried)**
- astro check 0; build green; zero hex outside tokens.css; single-rAF counts unchanged; zero deck/fig01 imports in scene modules; leak gate (no glass CSS bleeding into /work/* beyond the shared token file — case studies stay editorial; if SiteHeader/Footer are shared, their glass must degrade to the solid look on photo-free pages — decide explicitly and verify); sitemap; no push; no new dependencies; .planning/config.json untouched

### Claude's Discretion
- Exact fill alphas per tier, saturate/brightness values, edge-highlight construction, focus-visible treatment on glass, whether the scrim reduces or stays, hover/active glass states

### Deferred Ideas (OUT OF SCOPE)
- Ambient systems (Phase 9); glass hover-parallax micro-effects → /craft; light-refraction easter eggs → never (restraint)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GLS-01 | Full glass chrome — panels, header/footer, jump index render as frosted-glass (`--glass-*` tokens), tiering permitted for text-dense panels if the contrast floor demands it | §2 (Glass CSS implementation map), §3 (backdrop-root audit — dictates WHICH selector may safely carry glass), §6 (Tiering framework) |
| GLS-02 | Clean degradation: `@supports` → opaque `--panel` baseline; `prefers-reduced-transparency` → solid (additive); print sane | §2.6 (fallback ladder placement), §5 (prefers-reduced-transparency + CDP emulation test method) |
| GLS-03 | Verifier re-architected to sample real post-composite screenshots BEFORE glass values lock; every panel × both viewports ≥4.5:1 worst-case | §1 (full verifier design — the phase's hardest piece) |
| GLS-04 | Glass + scene idle CPU stays under 10% total floor; marginal re-blur cost measured first, mitigation ladder applied as measured | Carried from 07-SPIKE-GLASS.md (already PASS, no ladder needed) — §8 pitfall #3 covers the one NEW risk this phase introduces (backdrop-filter on ALL 7 panels instead of the measured 4 surfaces) |
</phase_requirements>

## Summary

This phase has one hard precondition (GLS-03, the verifier re-architecture) and one hard architectural constraint that the codebase itself imposes and that the phase prompt didn't fully anticipate: **glass must be applied to `.panel[data-state="active"]` only — never the bare `.panel` selector, and never a descendant of `.panel`.** Two independent, codebase-grounded reasons converge on this: (1) inactive panels are hidden via `opacity:0` + `pointer-events:none`, **never `display:none`** (deck.css:10-15, 71-75) — meaning if `backdrop-filter` were applied to bare `.panel`, all 7 panels (not the 4 measured in Spike 2) would run a blur pass every frame, blowing past the measured ≤4-surface budget the whole CPU proof rests on; (2) `.panel` is the element that carries the `opacity`/`transform` transition (deck.css:64-82) — per the CSS Backdrop Filter spec, an element with `opacity < 1` becomes a backdrop root, which would silently clip a **descendant's** `backdrop-filter` sampling scope to `.panel`'s own (empty) subtree instead of the true sky during every 420ms transition. Both risks vanish if the glass declaration lives on `.panel[data-state="active"]` itself (self-referential opacity+backdrop-filter is spec-safe) and never on a nested child.

The second hard finding: **header/footer contrast has never been measured by this codebase's verifier at all.** `samplePageOnce()`'s element query is scoped to `panel.querySelectorAll(...)` (verify-contrast.mjs:456) — only the active `.panel`'s text is sampled; `<header>`, `<footer>`, and `#deck-index` are siblings of `.deck`, never visited. Header/footer currently have **no background of their own** (SiteHeader.astro, SiteFooter.astro — no `background` property in either `<style>` block) and pass today purely because the sky is dark enough at their fixed position — an assumption that has never been gated. Any white-tinted glass fill added to header/footer will, by construction, raise the background luminance under light-colored nav/status text, which *reduces* contrast margin, not improves it. GLS-03's re-architected verifier must therefore widen its rect-discovery scope to include `<header>`, `<footer>`, and `#deck-index`, not just extend the existing per-panel loop.

Third: the 07-04 baseline the whole phase inherits is **razor-thin at the narrow check width** — 4.58:1 at 1280×800 (only +0.08 above the 4.5 floor; 07-04-SUMMARY.md:149-150 flags this explicitly), vs. 12.22:1 at 1440×900. This dictates the scrim decision protocol in §2.7: never retire or reduce the scrim speculatively before measuring glass-on-top-of-unchanged-scrim first.

**Primary recommendation:** Build the CDP-screenshot verifier mode first (GLS-03 hard precondition), scope its rect discovery to header/footer/jump-index in addition to panels, run it once with the CURRENT unblurred `--panel` baseline as a sanity check, then land glass on `.panel[data-state="active"]` (full-bleed, never a child), header, footer, and `.deck-index-toggle`, gated by `@supports`/`prefers-reduced-transparency`/`print`, keeping the scrim unchanged for the first pass and only reducing it in a second, measured step if headroom allows.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Glass fill/blur/saturate rendering | Browser/Client (CSS compositor) | — | Pure `backdrop-filter`/`background` CSS, no JS, no server — GitHub Pages static hosting has no other tier available |
| `@supports`/`prefers-reduced-transparency`/`print` degradation ladders | Browser/Client (CSS media/feature queries) | — | Evaluated entirely by the browser at paint time; zero JS needed (`html.classic-active`/no-JS floor requires this) |
| Contrast verification (screenshot sampling) | Build/Verification tooling (Node CLI, dev-time only) | — | Not part of the shipped site — a `.mjs` script run manually/in CI before values lock (verify-contrast.mjs header comment: "NOT wired into `astro build`") |
| `--glass-*` token definitions | CDN/Static (compiled CSS asset) | Browser/Client (consumes via `var()`) | tokens.css ships as a static asset; the browser resolves the custom properties at paint time — no runtime computation |
| Idle-CPU re-proof (GLS-04) | Browser/Client (rendering/compositor engine) | Build/Verification tooling (the CDP soak harness measuring it) | The cost lives in the browser's compositor; the *measurement* is a dev-time Node/CDP tool, same split as contrast verification |
| Home-scoping of shared chrome glass (`body.has-sky`) | Browser/Client (CSS `body.has-sky header {}` selector) | CDN/Static (Astro emits the class server-side at build time) | The class itself is baked into static HTML at build time (Astro SSG, no runtime server) but the visual effect it gates is resolved by the browser |

*(Frontend-Server/SSR and API/Backend tiers are structurally absent — this is a `output: 'static'` GitHub Pages site with no server-side code, per STACK.md's locked constraints.)*

## Standard Stack

### Core (no new dependencies — floor-locked)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `sharp` | `0.35.3` [VERIFIED: local `node_modules/sharp/package.json` read + `node -e "require(...).version"`, 2026-07-19] | Decode CDP `Page.captureScreenshot`'s base64 PNG into raw RGBA pixels (`sharp(buf).raw().ensureAlpha().toBuffer({resolveWithObject:true})`) | Already a transitive devDependency (pulled in by `astro:assets`/`@astrojs/sitemap`'s image pipeline — confirmed present at `node_modules/sharp` and `node_modules/@img/sharp-win32-x64`), so using it for screenshot decode adds **zero new install** — exactly the CONTEXT.md-locked approach and the "no new dependencies" floor |
| Node.js built-in `WebSocket` (CDP client) | Node `v22.22.2` [VERIFIED: local `node --version`] | Drive headless Chrome over the DevTools Protocol | Already the pattern in `verify-contrast.mjs` (`Cdp` class, lines 743-780) — reused verbatim for the new screenshot mode, no new transport needed |
| Node.js built-in `Buffer`/`fs` | bundled | Decode base64 PNG payload, read tokens.css | Zero new dependency |

**Version verification:** `node --version` → `v22.22.2` (exceeds `package.json`'s `engines.node: ">=22.12.0"`); `npx astro --version` → `v7.0.7`, matching `package.json`'s pinned `astro: "^7.0.7"`. Both [VERIFIED: local shell, 2026-07-19].

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CDP `Page.captureScreenshot` | (browser-native, not an npm package) | Full-page raster capture at DPR1 | The GLS-03 gate's pixel source — replaces the analytic `getImageData` composite |
| CDP `Emulation.setDeviceMetricsOverride` | (browser-native) | Force an exact `deviceScaleFactor: 1` viewport before navigation | Removes the window-chrome-height ambiguity `--window-size` has (already the pattern in `spike-glass/soak.mjs:434-439`) AND guarantees the 1:1 CSS-px ↔ screenshot-px coordinate mapping the new sampler depends on |
| CDP `Emulation.setEmulatedMedia` | (browser-native) | Automated `prefers-reduced-transparency: reduce` test | Supported since Chrome 118 for this specific media feature [CITED: developer.chrome.com/blog/css-prefers-reduced-transparency; corroborated by chromedevtools.github.io/devtools-protocol Emulation domain docs] — see §5 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|-------------|-----------|----------|
| CDP `Page.captureScreenshot` + `sharp` decode | A hand-rolled PNG zlib-inflate + unfilter decoder | Already rejected once, correctly, in 07-RESEARCH.md's own Don't-Hand-Roll table ("PNG/screenshot pixel decoding... Don't Build... Use `sharp`... The browser has already decoded the image for you; screenshot-based sampling only earns its complexity once there's a blur kernel to approximate (Phase 8)") — that phase-8-deferred item is THIS phase; `sharp` remains the correct, zero-new-dep answer |
| Applying glass to `.panel[data-state="active"]` | Applying glass to bare `.panel` (all 7, state-agnostic) | Bare `.panel` blows the ≤4-simultaneous-surface budget (inactive panels never leave the render tree — opacity:0 only, deck.css:71-75) — see §3 |
| Applying glass to `.panel` itself | Applying glass to `.panel > *` (the 880px inner column, for a "floating card over visible sky margins" look) | `.panel > *` is a **descendant** of `.panel`, which carries the opacity transition — this is the textbook backdrop-root trap (§3.1); the inner-column look is not safely achievable without first changing the transition mechanism itself, which is out of this phase's scope |

**Installation:** none — zero new packages this phase (floor-locked).

## Package Legitimacy Audit

**No new external packages are installed by this phase** (`sharp` is already present transitively via Astro's image pipeline; no new `npm install` is required or permitted per the phase's locked "no new dependencies" floor). The Package Legitimacy Gate protocol is therefore not applicable — there is nothing to run `gsd-tools query package-legitimacy check` against. If a future planner is tempted to add any charting/animation/blur-polyfill library for this phase, that would violate the locked floor; flag it rather than adding it.

**Packages removed due to [SLOP] verdict:** none (N/A — no packages evaluated)
**Packages flagged as suspicious [SUS]:** none (N/A)

## Architecture Patterns

### System Architecture Diagram

```
                     ┌─────────────────────────────────────────┐
                     │  BUILD TIME (Astro SSG, no server)       │
                     │  index.astro          → hasSky=true      │
                     │  work/[slug].astro    → hasSky=false     │
                     │  404.astro            → hasSky=false     │
                     │        │                                  │
                     │        ▼                                  │
                     │  BaseLayout.astro  <body class={hasSky    │
                     │                     ? "has-sky" : ""}>   │
                     └─────────────────────────────────────────┘
                                        │  static HTML/CSS emitted
                                        ▼
┌───────────────────────────── BROWSER (runtime) ─────────────────────────────┐
│                                                                               │
│  NightSky.astro host (z-index:-1)                                           │
│   ├─ .sky-photo <img>  (static AVIF/WebP, never repaints once loaded)       │
│   └─ #nightsky-canvas  (rAF-driven: twinkle, moon, fireflies, beams —        │
│         the ONLY recurring-cost layer under glass, per GLASS.md §1.4)        │
│                          │                                                    │
│                          │  composited "behind" every glass surface          │
│                          ▼                                                    │
│  body.has-sky header { @supports(...) glass }  ◄── fixed, top                │
│  html.deck-active .panel[data-state="active"]  ◄── ONLY this selector        │
│     { @supports(...) glass }                        may carry backdrop-      │
│                          │                            filter (§3)            │
│  #deck-index .deck-index-toggle { @supports(...) glass } ◄── jump pill       │
│  body.has-sky footer { @supports(...) glass }  ◄── fixed, bottom             │
│                                                                               │
│  Degradation gates (evaluated by the browser, no JS):                       │
│    @supports not (backdrop-filter) → opaque --panel baseline                │
│    prefers-reduced-transparency: reduce → opaque (additive pattern)         │
│    @media print → backdrop-filter:none, opaque                              │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │  captured, not rendered-to-user
                                        ▼
┌────────────────────── DEV-TIME VERIFICATION (Node CLI) ─────────────────────┐
│  verify-contrast.mjs --cdp-screenshot                                       │
│   1. launchChrome() + Emulation.setDeviceMetricsOverride(dpr:1)   (reused)  │
│   2. Page.navigate → READY_PROBE wait                             (reused)  │
│   3. FOR each panel id in PANELS:                                           │
│        location.hash = "#id"; sleep(800)         (reused nav loop, L1009-13)│
│        FOR each internal-scroll offset (tall panels only, NEW §1.5):        │
│          discoverTextRegions() — in-page, NO pixel read (NEW, trimmed       │
│              from samplePageOnce's rect-walk, L461-524)                     │
│          cdp.send("Page.captureScreenshot", {format:"png", fromSurface:true})│
│          sharp(buf).raw().ensureAlpha().toBuffer({resolveWithObject:true})  │
│          FOR each discovered rect: extractSubImage() (NEW, stride math)     │
│              worstCaseContrastInRegion(subImage, inkL)      (reused verbatim)│
│   4. ALSO sample <header>, <footer>, #deck-index            (NEW scope, §1.6)│
│   5. Emit same JSON report shape as --cdp, tagged mode:"screenshot"          │
└───────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

No new directories. Changes land in existing files:

```
src/styles/
├── tokens.css        # + --glass-* tokens (fill/blur/saturate/edge per tier)
└── deck.css          # glass on .panel[data-state="active"], scrim decision (§2.7)
src/components/
├── SiteHeader.astro  # glass border/background, scoped under body.has-sky
├── SiteFooter.astro  # glass border/background, scoped under body.has-sky
├── DeckIndex.astro   # glass on .deck-index-toggle
└── (Figure01.astro — UNCHANGED; .fig's own `background: var(--panel)` already exempts it, §2.5)
src/layouts/
└── BaseLayout.astro  # + hasSky prop → body class
src/pages/
└── index.astro       # passes <BaseLayout hasSky>
scripts/
└── verify-contrast.mjs  # + --cdp-screenshot mode, + --agreement-selftest mode
scripts/fixtures/        # NEW (small) — static HTML fixtures for the agreement selftest
```

### Pattern 1: State-scoped glass (never bare `.panel`)

**What:** Attach `background`/`backdrop-filter`/`border-top` only to `html.deck-active .panel[data-state="active"]`, inside an `@supports` block layered on top of an unconditional opaque baseline for the same selector.

**When to use:** Every content-panel glass surface. Non-negotiable given the CPU budget and backdrop-root findings in §3.

**Example:**
```css
/* Baseline (deck.css, extends the EXISTING rule at lines 64-69 —
   add these two lines to it, unconditional): */
html.deck-active .panel[data-state="active"] {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
  background: var(--glass-fallback-bg); /* = var(--panel), today's look */
}

/* Enhancement (NEW rule, same selector, gated): */
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html.deck-active .panel[data-state="active"] {
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    border-top: 1px solid var(--glass-edge);
  }
}

/* Reduced-transparency re-collapse (additive pattern, §5): */
@media (prefers-reduced-transparency: reduce) {
  html.deck-active .panel[data-state="active"] {
    background: var(--glass-fallback-bg);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

/* Inactive panels: explicitly NO background/backdrop-filter declared at all —
   deck.css:71-75's existing [data-state="inactive"] rule is left untouched
   (opacity:0, pointer-events:none) — this is what keeps the surface count at
   exactly the measured 4, not 7. */
```

### Pattern 2: Home-scoped shared chrome (`body.has-sky`)

**What:** Wrap ALL new glass CSS for `<header>`/`<footer>` under a `body.has-sky` ancestor selector so photo-free pages (`/work/*`, `/404`) never match any new rule at all — zero-leak by construction, not by a fallback value.

**When to use:** SiteHeader.astro, SiteFooter.astro (shared across index/work/404). NOT needed for `DeckIndex.astro` — it only renders on `index.astro` (imported exclusively by `PanelDeck.astro`, confirmed: no other `.astro` page imports `DeckIndex`), so it structurally cannot leak.

**Example:**
```astro
---
// src/layouts/BaseLayout.astro
interface Props {
  title?: string;
  description?: string;
  hasSky?: boolean;
}
const { title = "...", description = "...", hasSky = false } = Astro.props;
---
<body class={hasSky ? "has-sky" : undefined}>
```
```astro
<!-- src/pages/index.astro -->
<BaseLayout hasSky>
```
```css
/* src/components/SiteHeader.astro <style> block — Astro's per-component
   scoping appends [data-astro-cid-xxx] to the LAST compound selector that
   targets an element this component renders (header). The ancestor
   `body.has-sky` selector still works normally since it's outside the
   component's own DOM. Verified pattern — Astro scoped-CSS docs. */
body.has-sky header {
  background: var(--glass-fallback-bg);
}
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  body.has-sky header {
    background: var(--glass-bg-chrome);
    backdrop-filter: blur(var(--glass-blur-chrome)) saturate(var(--glass-saturate-chrome));
    -webkit-backdrop-filter: blur(var(--glass-blur-chrome)) saturate(var(--glass-saturate-chrome));
    border-top: 1px solid var(--glass-edge-chrome);
  }
}
```
Result: on `/work/*` and `/404`, `body` has no `has-sky` class → the selector never matches → `<header>`/`<footer>` render EXACTLY as they do today (no `background` property at all, confirmed absent in both files' current `<style>` blocks) — true zero-visual-diff on those pages, not a "solid fallback that looks slightly different."

### Anti-Patterns to Avoid

- **Bare `.panel` glass selector:** silently applies `backdrop-filter` to all 7 panels (inactive ones included, since they're `opacity:0` not `display:none`) — blows the measured ≤4-surface budget. Always scope to `[data-state="active"]`.
- **Nested backdrop-filter (a Comeau-style separate blurred edge element inside `.panel`):** trapped by `.panel`'s own transient `opacity<1` backdrop-root during transitions (§3.1). Use a plain `border-top` for the light edge on every surface, never a second filtered element.
- **`will-change: backdrop-filter` applied blanket:** Spike 2 already proved `display:none`-style removal (here: state-scoping) is sufficient to hit budget with zero mitigation; `will-change` permanently reserves GPU memory and was never validated in the spike. Do not add it speculatively.
- **Reducing the scrim before measuring glass on top of it:** the 1280×800 baseline (4.58:1) has only +0.08 headroom (07-04-SUMMARY.md:149-150) — see §2.7's measured-order protocol.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PNG decode from `Page.captureScreenshot`'s base64 output | A zlib-inflate + PNG-unfilter decoder | `sharp(buf).raw().ensureAlpha().toBuffer({resolveWithObject:true})` | Already rejected once for Phase 7 with the exact reasoning "screenshot-based sampling only earns its complexity once there's a blur kernel to approximate (Phase 8)" — that phase is now; `sharp` is already installed, zero new dependency |
| `object-fit: cover` source-rect math for a NEW fixture harness (if the agreement-selftest fixture reuses a photo) | Re-deriving the cover-crop formula from scratch | The already-verified `coverSourceRect()` (verify-contrast.mjs:137-142, has its own selftest fixture at lines 371-395) | It's exported and unit-tested already — reuse verbatim if the fixture needs an image |
| WCAG luminance/contrast math for the new screenshot-sampled pixels | A second contrast formula for "screenshot mode" | `relativeLuminance()`/`contrastRatio()`/`worstCaseContrastInRegion()` (verify-contrast.mjs:91-126) — these already accept a generic `{data,width,height}` ImageData-like object, they don't care whether the buffer came from `getImageData` or a decoded screenshot | Zero changes needed to these three functions — the ONLY new code is producing a compatible `{data,width,height}` object from the sharp-decoded screenshot buffer (a small `extractSubImage()` stride-math helper) |
| Detecting `prefers-reduced-transparency` in an automated test | Manually toggling an OS accessibility setting for every CI/local run | CDP `Emulation.setEmulatedMedia({features:[{name:"prefers-reduced-transparency", value:"reduce"}]})` | Supported since Chrome 118 specifically for DevTools/CDP emulation of this feature — no OS-level toggle needed for automated verification |
| A generic glassmorphism CSS "recipe" pulled from a design-blog template | Copying alpha/blur numbers verbatim from GLASS.md's synthesized recipe without re-measuring | The screenshot-sampled contrast gate (GLS-03) as the arbiter of any specific numeric value | GLASS.md itself frames its numbers as "MEDIUM confidence... a starting point to tune, not a locked spec" — this phase's entire point is to stop trusting synthesized numbers and start measuring |

**Key insight:** almost nothing in this phase is a "new tool" problem — `sharp`, the WCAG formulas, the CDP client, and the panel-navigation loop already exist and are already correct. The actual work is (1) wiring a NEW pixel source (screenshot) into the EXISTING math, and (2) getting the CSS selector scoping exactly right so the measured performance budget and the backdrop-root spec semantics both hold. Both are precision problems, not library-selection problems.

## Runtime State Inventory

Not applicable — this is a greenfield CSS/tooling phase (adding glass declarations and a verifier mode), not a rename/refactor/migration. No stored data, live service config, OS-registered state, or renamed secrets are touched.

## Common Pitfalls

### Pitfall 1: Bare `.panel` glass selector blows the measured CPU budget

**What goes wrong:** If the glass declaration is written against `html.deck-active .panel { ... }` (matching all 7 panels regardless of state) instead of `html.deck-active .panel[data-state="active"]`, every inactive panel — which stays in the render tree at `opacity:0` (never `display:none`, deck.css:10-15/71-75) — also runs a `backdrop-filter` blur pass every frame. Spike 2 measured exactly 4 simultaneous glass surfaces (07-SPIKE-GLASS.md: "panel, header, footer, jump index... exactly what was measured"); shipping 7 panels + header + footer + jump-index = 10 simultaneous surfaces has never been measured and would very likely exceed the <10% total floor (cost is per-surface-per-frame, not amortized).

**Why it happens:** `.panel` (no state qualifier) is the more "obvious" selector to reach for when writing the glass CSS, and deck.css's existing structure makes it easy to miss that `[data-state="active"]`/`[data-state="inactive"]` are two SEPARATE rule blocks (lines 64-69 vs 71-75), not one shared selector.

**How to avoid:** Always attach the glass declaration to the existing `[data-state="active"]` block (deck.css:64-69) — never introduce a bare `.panel { background: ...; backdrop-filter: ...; }` rule anywhere.

**Warning signs / detection command:**
```bash
grep -n '^html\.deck-active \.panel {' src/styles/deck.css   # should return NOTHING with a background/backdrop-filter declaration inside
grep -n 'backdrop-filter' src/styles/deck.css                 # every hit must be inside a [data-state="active"] selector or an @supports/@media wrapping one
```
Runtime check: open DevTools → Layers panel (or `chrome://gpu`) with a panel active — confirm exactly 4 composited layers carry a blur filter (panel, header, footer, jump-index-toggle), not more.

### Pitfall 2: Nested `backdrop-filter` trapped by `.panel`'s own transient backdrop root

**What goes wrong:** Per the CSS Backdrop Filter spec (and GLASS.md §1.1, HIGH confidence, MDN-sourced), an element with `opacity < 1` becomes a "backdrop root" — any DESCENDANT's `backdrop-filter` can only sample content up to that root, not past it. `.panel[data-state="active"]` transitions through fractional opacity values during its 420ms fade (deck.css:78-82). If a future implementer adds a second, separately-blurred child element inside `.panel` (e.g. adopting Comeau's edge-highlight technique from GLASS.md §2.2 — a distinct DOM element with its own lighter blur, masked to fade into the panel body), that child's `backdrop-filter` would be silently clipped to `.panel`'s own (largely empty) subtree instead of the true sky during every transition — producing a dark/broken edge highlight specifically during panel changes, invisible in a static screenshot taken after the transition settles.

**Why it happens:** The trap only manifests DURING the transition window (420ms), so a developer testing by eye on a settled, `data-state="active"` panel (transition long finished, opacity back at a clean 1) will never see it — it requires either slow-motion visual inspection or specifically capturing mid-transition frames.

**How to avoid:** Use a plain `border-top: 1px solid var(--glass-edge)` for the light-edge effect on every surface (panel, header, footer, jump-index) — never a second, independently-blurred DOM element. This is explicitly the "cheap/default version" GLASS.md §2.2 itself recommends over Comeau's technique for cost reasons; the backdrop-root trap is a second, independent reason to make the same choice.

**Warning signs / detection command:**
```bash
grep -rn 'backdrop-filter' src/components/*.astro src/styles/*.css
```
Every match must be on `.panel[data-state="active"]`, `header`, `footer`, or `.deck-index-toggle` directly — zero matches on any OTHER selector nested inside one of those. Visually: slow down `prefers-reduced-motion` is OFF, trigger a panel change, and watch for a flash of un-blurred/dark edge during the 420ms window (manual check, since this can't be caught by the settled-state screenshot gate).

### Pitfall 3: Header/footer contrast has never been gated — glass fill can silently push it below 4.5:1

**What goes wrong:** `samplePageOnce()`'s element discovery is hard-scoped to the active `.panel` (`panel.querySelectorAll(...)`, verify-contrast.mjs:456) — `<header>` nav text and `<footer>` status/credit text have NEVER been contrast-checked by this tool, at any point in the project's history. Both currently render with **no background of their own** and rely entirely on the sky being dark enough at their screen position. Adding a white-tinted glass fill (per GLASS.md's recipe, `rgb(255 255 255 / 0.05-0.10)`) LIGHTENS the background under light-colored text (`--dim`/`--ink`), which narrows the contrast margin, not widens it — the opposite of the panels' situation where the scrim already does the darkening work.

**Why it happens:** The existing verifier's scope was correct for its original purpose (panel body text, SKY-05) and was never revisited when GLS-01 added header/footer/jump-index to the glass surface list — an easy scope-creep gap to miss since "the contrast tool" already exists and appears comprehensive.

**How to avoid:** GLS-03's re-architected verifier MUST add `document.querySelector('header')`, `document.querySelector('footer')`, and `document.querySelector('#deck-index')` (or `.deck-index-toggle` specifically) as additional discovery roots, sampled with the exact same glyph-run-rect + worst-case-pixel logic already used for panels — not a separate, simplified check.

**Warning signs / detection command:**
```bash
node scripts/verify-contrast.mjs --cdp-screenshot --url http://localhost:4321/
# report JSON must include entries for panel:"header", panel:"footer", panel:"jump-index"
# in addition to the 7 panel ids — absence of these three is the regression signal.
```

### Pitfall 4: Speculatively reducing the scrim before measuring glass on top of it

**What goes wrong:** The current worst-case contrast at 1280×800 is 4.58:1 — only **+0.08 above the 4.5 floor** (07-04-SUMMARY.md:149-150 flags this explicitly as a constraint for glass work). If the scrim's peak alpha (0.38, deck.css SCRIM_STOPS) is reduced or retired BEFORE the screenshot gate confirms glass fill alone (plus the unchanged scrim) still clears 4.5:1, the site can regress below the accessibility floor with no warning until the gate is re-run — and worse, if the reduction happens in the SAME commit as the glass CSS, a subsequent failure won't cleanly indicate which change caused it.

**Why it happens:** GLASS.md's own research (§3.2) frames scrim-reduction as an attractive simplification ("glass fill absorbs scrim duty per-pixel") — a reasonable-sounding architectural tidy-up that's easy to do speculatively rather than as a measured second step.

**How to avoid:** Two-step, measured-only protocol: **(1)** land glass CSS with the scrim completely UNCHANGED (0.38 peak, same SCRIM_STOPS), run the screenshot gate at both viewports; **(2)** only if the gate passes with real headroom (not just barely over 4.5) at the tighter 1280×800 width, try a scrim reduction in a SEPARATE, re-measured step — and if it fails, revert the scrim change, not the glass.

**Warning signs / detection command:**
```bash
node scripts/verify-contrast.mjs --selftest   # includes the existing SCRIM_STOPS <= 0.38 ceiling fixture (line ~337-340) — will NOT catch an intentional reduction, only an accidental regression above the ceiling
node scripts/verify-contrast.mjs --cdp-screenshot --width 1280 --height 800 --url http://localhost:4321/
# worstVsInk across ALL panels + header/footer/jump-index must stay >= 4.5 at every step
```

### Pitfall 5: Tall panels' below-the-fold text never captured (internal-scroll gap)

**What goes wrong:** `.panel` has `overflow: auto` (deck.css:50) — experience/patents/skills panels can be taller than the viewport at narrower widths (each renders 3-4 multi-line entries). `Page.captureScreenshot` captures only the current viewport frame; deck.ts has **no scroll-reset-on-activate logic** (confirmed: no `scrollTop`/`scrollTo` calls anywhere in `src/lib/nightsky/deck.ts`). A single capture per panel-activation (mirroring the existing `--cdp` analytic mode's one-shot-per-panel pattern) will only see the text that fits in the first viewport-height of that panel — any text below the internal scroll fold is silently never contrast-checked, even though it's visually reachable by a real user.

**Why it happens:** The existing analytic `--cdp` mode has this exact same gap today (it also samples only the currently-scrolled position via `getImageData` on the visible canvas) — it's a pre-existing, unaddressed limitation that becomes higher-stakes once GLS-03 explicitly promises "every panel × both viewports holds ≥4.5:1 worst-case" as the phase's headline gate.

**How to avoid:** For each panel where `panel.scrollHeight > panel.clientHeight` (discoverable in-page, cheap), the screenshot-mode sampler must iterate additional scroll offsets (`panel.scrollTop = n * step`, waiting one frame for repaint before each capture) until `scrollTop + clientHeight >= scrollHeight`, unioning worst-case results across all offsets for that panel. This is a genuinely NEW capability beyond "reuse the existing panel-navigation loop" — flag explicitly in the plan, don't assume the existing loop already covers it (see §1.5).

**Warning signs / detection command:** At 1280×800 (the narrower, tighter check width), manually resize the browser or check `experience`/`patents`/`skills` panels' `scrollHeight` vs `clientHeight` via DevTools console (`document.querySelector('[data-panel-id=experience]').scrollHeight`) — if `scrollHeight > clientHeight`, the single-capture design under-verifies that panel.

### Pitfall 6: Safari `-webkit-backdrop-filter` omission (carried from GLASS.md/PITFALLS.md, still applicable)

**What goes wrong:** Safari requires the `-webkit-` prefix for `backdrop-filter` even in current versions; omitting it makes glass silently render as fully opaque (or fully missing, engine-dependent) on Safari/iOS with no console error. [HIGH confidence — GLASS.md §4.1, repeated across every source checked in the milestone research]

**How to avoid:** Every `backdrop-filter` declaration must be paired with an identical `-webkit-backdrop-filter` declaration, in both the enhancement block AND (if ever removed) the `prefers-reduced-transparency`/print re-collapse blocks (`backdrop-filter: none; -webkit-backdrop-filter: none;`).

**Detection command:**
```bash
grep -c 'backdrop-filter:' src/styles/deck.css src/components/*.astro   # count A
grep -c '\-webkit-backdrop-filter:' src/styles/deck.css src/components/*.astro   # count B — must equal A
```

## Code Examples

### Screenshot-mode capture + decode (new, GLS-03 core)

```javascript
// scripts/verify-contrast.mjs — new helper, Node side (not injected into the page)
import sharp from "sharp"; // resolves from node_modules/sharp — already installed transitively

async function captureAndDecode(cdp, width, height) {
  const { data: base64 } = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  const buf = Buffer.from(base64, "base64");
  const { data, info } = await sharp(buf)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  // Self-check: with Emulation.setDeviceMetricsOverride({deviceScaleFactor:1})
  // set BEFORE navigation, screenshot px must equal the requested CSS-px
  // viewport 1:1 — a mismatch here means DPR drifted and every rect coordinate
  // downstream would silently sample the wrong pixels.
  if (info.width !== width || info.height !== height) {
    throw new Error(
      `screenshot size ${info.width}x${info.height} != requested viewport ${width}x${height} — DPR/coordinate-space assumption violated`
    );
  }
  return { data, width: info.width, height: info.height, channels: info.channels };
}

// Stride-math sub-region extraction — reuses worstCaseContrastInRegion()
// (verify-contrast.mjs:106-126) VERBATIM by producing a compatible
// {data, width, height} object for just the discovered text rect.
function extractSubImage(full, x0, y0, x1, y1) {
  const w = x1 - x0, h = y1 - y0;
  const out = new Uint8ClampedArray(w * h * 4);
  const stride = full.width * 4;
  for (let row = 0; row < h; row++) {
    const srcStart = (y0 + row) * stride + x0 * 4;
    const dstStart = row * w * 4;
    full.data.copy
      ? full.data.copy(out, dstStart, srcStart, srcStart + w * 4) // Buffer
      : out.set(full.data.subarray(srcStart, srcStart + w * 4), dstStart);
  }
  return { data: out, width: w, height: h };
}
```

### In-page rect discovery, trimmed for screenshot mode (reuses the EXACT existing logic)

```javascript
// Factored out of samplePageOnce() (verify-contrast.mjs:406-627) — keeps the
// identical selectors, ancestor-opaque-bg walk (L480-491), and Range-based
// glyph-run geometry (L499-516) — but stops BEFORE any getImageData call
// (L546+), since pixel data now comes from the Node-side screenshot decode.
function discoverTextRegions(rootSelectors) {
  const regions = [];
  for (const rootSel of rootSelectors) {
    const root = document.querySelector(rootSel);
    if (!root) continue;
    const els = root.querySelectorAll(
      "h1,h2,h3,h4,p,li,a,dt,dd,small,strong,em,td,th,figcaption,blockquote,button,time,code,span"
    );
    for (const el of els) {
      // ... IDENTICAL text-extraction, ancestor-opaque-bg walk, and
      // Range-based lineRects logic as samplePageOnce() lines 461-521 ...
      // Push {root: rootSel, tag, text, rect:{x0,y0,x1,y1}, overSky,
      //       fontSize, fontWeight, isLarge, threshold, ownColor} instead
      // of scanning pixels.
    }
  }
  return regions;
}
```

### `Emulation.setEmulatedMedia` for automated `prefers-reduced-transparency` testing

```javascript
// New CDP call in the fallback-ladder test path (GLS-02 verification):
await cdp.send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
});
// Then re-navigate/reload and re-run discoverTextRegions() + capture —
// glass surfaces must render with the OPAQUE baseline background and
// zero backdrop-filter, confirmed via a computed-style check
// (getComputedStyle(el).backdropFilter === "none").
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Analytic per-pixel alpha compositing in JS (`compositePixel()`, verify-contrast.mjs:435-451) to simulate flat-alpha DOM layers over canvas pixels | CDP `Page.captureScreenshot` + `sharp` raw decode — sample the browser's OWN GPU-composited output, which already includes the real blur kernel, saturate, and brightness | This phase (GLS-03) — the milestone research (07-RESEARCH.md §6.1) explicitly deferred this exact change from Phase 7 to Phase 8 with the reasoning "screenshot-based sampling only earns its complexity once there's a blur kernel to approximate" | Analytic compositing is mathematically exact for flat-alpha layers (scrim, DOM backgrounds) but CANNOT represent a spatial blur kernel (a blurred pixel is a weighted average of a neighborhood, not a function of one pixel) — this was always going to be a hard architectural cutover, not an incremental tweak |
| Header/footer contrast: unverified, relying on "the sky happens to be dark there" | Header/footer contrast: explicitly sampled via the widened rect-discovery scope (§1.6, Pitfall 3) | This phase, as a consequence of GLS-01 adding header/footer to the glass surface list for the first time | Closes a verification gap that predates this phase and was never a regression — just never in scope until header/footer became a translucency-bearing surface |
| `prefers-reduced-transparency` — a preference this codebase never needed (v2.0's flat scrim had no transparency to reduce) | An additive-pattern media query branch, present from the first glass component, testable via CDP `Emulation.setEmulatedMedia` (Chrome 118+) | This phase — PITFALLS.md's own framing: "a floor v2.0 never needed, v3.0's glass system does" | New floor, not a migration — build it in from day one per the additive pattern (opaque default, glass only inside `no-preference`) |

**Deprecated/outdated:** None — the analytic verifier mode is explicitly KEPT (not removed) per CONTEXT.md, for fast pre-glass iteration; it is downgraded from "the gate" to "a fast dev-loop tool," not deleted.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The exact glass fill alphas/blur/saturate numbers in GLASS.md's recipe (`rgb(255 255 255 / 0.07)`, `saturate(150%)`, etc.) are a reasonable starting point but not verified against THIS project's actual composited scene | Standard Stack, Pattern examples | If used as final values without running the screenshot gate first, could silently ship below 4.5:1 given the razor-thin 1280×800 baseline (Pitfall 4) — GLASS.md itself tags these MEDIUM confidence and says "tune against the actual astrophoto," which this project now has |
| A2 | `body.has-sky header {}` (Astro scoped-CSS ancestor-selector pattern) resolves correctly across Astro 7's compiler — not independently verified by running `astro build` and inspecting output CSS in this research session | Architecture Patterns, Pattern 2 | Low risk (this is a well-documented, common Astro pattern — ancestor selectors outside a component's own render tree are unaffected by Astro's scoping, which only appends the hash to selectors matching the component's OWN elements) but should be confirmed with `astro check` + a build + visual inspection of `dist/` output as part of the plan's verification step |
| A3 | `Page.captureScreenshot({format:"png", fromSurface:true})` at `deviceScaleFactor:1` (forced via `Emulation.setDeviceMetricsOverride` before navigation) will NOT hit the documented DSF-2 hang, since the hang is specifically tied to DSF 2, not DSF 1 | §1 (verifier architecture) | If wrong (i.e., if there's ANY screenshot-capture instability even at DSF1 in this environment), the whole GLS-03 gate is blocked — mitigate by testing `--cdp-screenshot` against a trivial fixture FIRST, before wiring it into the full 7-panel + header/footer/jump-index sweep, so a hang is caught cheaply |
| A4 | Astro's per-component CSS scoping specificity math (`.fig[data-astro-cid-xxx]` at specificity (0,2,0) beating `.panel > *` at (0,1,0)) is accurate for Astro 7's current compiler output | Architecture Patterns (Fig-01 exemption reasoning) | Low risk — this is a stable, long-standing Astro behavior, not a new-version concern — but the plan should still include a visual/DOM-inspection check that `.fig`'s computed `background-color` stays `var(--panel)` (opaque) after glass CSS lands, as a cheap regression guard regardless of the specificity reasoning being provably correct |

**If this table is empty:** N/A — see entries above; none of these are compliance/retention/security-standard claims, they are CSS-cascade and browser-tooling behavior claims with cheap, concrete verification paths already specified inline.

## Open Questions

1. **Should the agreement-selftest fixture be a standalone static HTML file (new, `scripts/fixtures/`) or reuse the live preview page's DOM contract (`#nightsky-canvas` + `.sky-photo img` + `.panel[data-state=active]` selectors)?**
   - What we know: Reusing the live DOM contract means `samplePageOnce()` (the analytic sampler) works completely unmodified against the fixture, which is the simplest zero-new-selector design; a standalone fixture is more isolated/faster but requires either duplicating those exact selectors or adding a selector-injection parameter to the analytic sampler.
   - What's unclear: Whether a standalone fixture's simplicity is worth the selector-duplication risk (a fixture whose selectors silently drift from the real page's would produce a false "modes agree" result).
   - Recommendation: Build the fixture to satisfy the EXACT existing DOM contract (`#nightsky-canvas` solid-filled, `.sky-photo img` pointing at a 1x1 solid-color data URI, `.panel[data-state="active"]` with known text/color) — this is the safer, less-drift-prone choice and lets both the existing analytic sampler and the new screenshot sampler run against it with zero code branching.

2. **Exactly how many internal-scroll offsets does Pitfall 5's tall-panel sweep need at each check width, and does this materially slow down the gate's total runtime?**
   - What we know: `experience`/`patents`/`skills` are the panels most likely to exceed `clientHeight` at 1280×800; the gate already runs `samples × interval` per panel (default 12 × 350ms ≈ 4.2s/panel) for the EXISTING analytic mode — adding N scroll offsets multiplies that by N per affected panel.
   - What's unclear: The actual `scrollHeight`/`clientHeight` ratio for each panel at both check widths — not measured in this research pass (would require running the live preview and reading DevTools, which is an implementation-time check, not a research-time one).
   - Recommendation: Measure `scrollHeight` vs `clientHeight` for all 7 panels at both 1280×800 and 1440×900 as the FIRST implementation step (cheap, `document.querySelector(...).scrollHeight` in a console or a tiny probe script) before committing to the scroll-sweep design's exact shape — if none exceed `clientHeight` at either width (plausible, since 07-04's footer padding was already tuned to keep panels from needing extra scroll clearance), the Pitfall 5 mitigation may turn out to be unnecessary for THIS milestone's content, and can be simplified to a documented "N/A — verified no panel needs internal scroll at either gate width" rather than built.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `sharp` (native binary) | GLS-03 screenshot decode | ✓ | 0.35.3 (win32-x64 prebuilt, `node_modules/@img/sharp-win32-x64`) | — |
| Chrome/Chromium (headless) | All CDP-based verification (`--cdp`, `--moon`, new `--cdp-screenshot`) | ✓ (assumed present — `findChrome()` already locates it via hardcoded Windows paths, verify-contrast.mjs:653-671; not independently re-probed this session since it's the SAME binary every existing verification mode already depends on) | — | — |
| Node.js | Build + verification tooling | ✓ | v22.22.2 | — |
| CDP `Emulation.setEmulatedMedia` support for `prefers-reduced-transparency` | GLS-02 automated fallback-ladder test | ✓ (Chrome 118+, this environment's Chrome is current per the existing `--cdp` mode already working) | — | Manual-flag test protocol: DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-transparency" → visually confirm opaque fallback, if automated CDP emulation is ever found not to work in a specific Chrome build |

**Missing dependencies with no fallback:** none identified.
**Missing dependencies with fallback:** `Emulation.setEmulatedMedia` for `prefers-reduced-transparency` — manual DevTools toggle as documented fallback if automation proves unreliable.

## Security Domain

`security_enforcement` is enabled (ASVS Level 1) per `.planning/config.json`. This phase's attack surface is minimal — it ships zero new user-facing input handling, zero new network calls from the browser, and zero new dependencies. The one new piece of code with any external-input characteristics is the verifier's screenshot decode path, which is a **local, dev-time-only Node CLI tool** never shipped to end users (verify-contrast.mjs's own header comment: "NOT wired into `astro build`").

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Static site, no auth surface |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | No access-controlled resources |
| V5 Input Validation | Marginal | The screenshot decode path (`sharp(buf).raw()...`) processes a PNG buffer that originates from CDP's own `Page.captureScreenshot` response (a trusted, locally-spawned Chrome process the script itself launched, not an external/untrusted source) — `sharp`'s own decoder handles malformed-input safety internally; no custom parsing is added. The `info.width/height` self-check (see Code Examples) is a correctness guard, not a security boundary. |
| V6 Cryptography | No | No crypto operations |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Reverse-tabnabbing via new-tab links | Tampering (carried forward, not new this phase) | Already mitigated site-wide (`target="_blank" rel="noopener noreferrer"` on every external link, per T-01-03/T-07-06 threat models already recorded in SiteHeader/SiteFooter/Hero/ContactSection) — no new external links added this phase |
| Malicious/oversized CDP screenshot response causing a decode DoS in the local dev tool | Denial of Service | Low risk (the CDP server is the SAME locally-spawned Chrome process the script itself started with `spawn()`, `--headless=new`, a fresh `mkdtempSync` profile per run, cleaned up in a `finally` block — verify-contrast.mjs:707-741) — not a network-facing service, not applicable to the shipped site |

No new threats introduced by this phase beyond what already exists in the verification tooling's trust model (a script that launches and talks to its own locally-spawned browser process).

## Sources

### Primary (HIGH confidence)
- `C:\Development\Dump\Portfolio\scripts\verify-contrast.mjs` — full read, this session — every cited line number verified directly against the live file
- `C:\Development\Dump\Portfolio\src\styles\deck.css`, `tokens.css`, `global.css` — full reads, this session
- `C:\Development\Dump\Portfolio\src\components\{PanelDeck,DeckIndex,SiteHeader,SiteFooter,Panel,NightSky,Figure01}.astro` — full/partial reads, this session
- `C:\Development\Dump\Portfolio\src\pages\{index,404,work/[slug]}.astro`, `src/layouts/BaseLayout.astro` — full reads, this session
- `.planning/phases/07-real-sky-foundation/07-SPIKE-GLASS.md`, `07-03-SUMMARY.md`, `07-04-SUMMARY.md`, `lighthouse-scores.md`, `07-RESEARCH.md` §5-7 — full/partial reads, this session (the 4.58/12.22 numbers, the DSF-2 hang documentation, the Phase-7-deferred-screenshot-sampling reasoning)
- `.planning/milestones/v2.0-phases/05.1-celestial-extras/05.1-01-SUMMARY.md:77-78` — the exact, previously-diagnosed root cause of the DSF-2 `Page.captureScreenshot` hang ("hangs indefinitely whenever deviceScaleFactor 2 is active... repeated timeouts with scripts frozen and GPU disabled")
- Local shell verification: `node --version` (v22.22.2), `npx astro --version` (v7.0.7), `node -e "require('sharp/package.json').version"` (0.35.3), `node_modules/sharp` + `node_modules/@img/sharp-win32-x64` directory listing — all this session, 2026-07-19

### Secondary (MEDIUM confidence)
- `.planning/research/GLASS.md` — milestone-level glassmorphism research (backdrop-root mechanics HIGH-sourced from WebKit/MDN directly; numeric recipe MEDIUM per its own framing)
- `.planning/research/PITFALLS.md` — milestone-level pitfalls research (Safari backdrop-filter bugs, `prefers-reduced-transparency` support matrix, GPU memory ceiling — all MEDIUM per its own tagging)
- [CSS prefers-reduced-transparency — Chrome for Developers](https://developer.chrome.com/blog/css-prefers-reduced-transparency) via WebSearch, this session — Chrome 118+ support for both the media feature and its DevTools/CDP emulation
- [Emulation domain — Chrome DevTools Protocol docs](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/) via WebSearch, this session — `setEmulatedMedia` accepting arbitrary feature/value pairs
- [sharp — Output options / Channel manipulation docs](https://sharp.pixelplumbing.com/api-output/) via WebSearch, this session — `raw()` + `ensureAlpha()` + `toBuffer({resolveWithObject:true})` API shape confirmed against sharp's own documentation

### Tertiary (LOW confidence)
- None relied upon for a load-bearing claim in this document — all glassmorphism-recipe-level MEDIUM/LOW claims from GLASS.md/PITFALLS.md are explicitly deferred to the screenshot gate as the arbiter (per A1 in Assumptions Log), not treated as facts to implement against directly.

## Metadata

**Confidence breakdown:**
- Verifier re-architecture (§1, GLS-03): HIGH — every referenced line number was read directly this session; the sharp API shape and CDP screenshot/emulation behavior are corroborated against official docs
- Glass CSS implementation map + backdrop-root audit (§2-3): HIGH — grounded in direct reads of every affected file; the state-scoping and nesting-avoidance conclusions follow directly from the CSS Backdrop Filter spec's own trigger list (opacity<1 → backdrop root) applied to the actual deck.css transition code
- Numeric glass recipe values (fill alpha/blur/saturate exact numbers): MEDIUM — inherited from GLASS.md's own synthesis, explicitly NOT re-verified against the real astrophoto in this research pass (that's the screenshot gate's job, per this phase's own design)
- Pitfalls (§8): HIGH for the codebase-specific ones (1-5, directly derived from reading deck.css/verify-contrast.mjs), MEDIUM for the carried-forward Safari one (6, sourced from milestone research)

**Research date:** 2026-07-19
**Valid until:** 30 days (stable domain — CSS spec behavior and this codebase's own architecture don't shift quickly; re-verify sooner only if `astro`/`sharp` majors bump or Chrome's CDP `Emulation` domain changes)
