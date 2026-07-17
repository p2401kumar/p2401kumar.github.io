# Stack Research

**Domain:** Immersive canvas night-sky presentation layer + no-scroll panel deck, layered onto an existing Astro 7 static site
**Researched:** 2026-07-17
**Confidence:** MEDIUM — cross-verified against MDN and multiple independent sources for wheel-event/scroll-snap/canvas-layering claims (websearch, no context7/curated-registry MCP available this run); the Milky Way compositing recipe specifically is a LOW-confidence synthesis from general Canvas2D gradient/pattern primitives, not a directly-sourced authoritative technique (flagged below)

> **Scope note:** This supersedes the v1.0 `STACK.md` for the v2.0 "Night Sky" milestone. It covers ONLY the new features (night scene, panel deck, constellations); it does not re-research Astro/GitHub Pages/fonts/sitemap, which remain validated from v1.0 (see `.planning/PROJECT.md` "Validated" requirements) and are carried forward unchanged.

## Bottom line

**No new runtime npm dependencies are needed.** Every v2.0 feature (starfield, Milky Way band, fireflies, silhouette, constellations, no-scroll panel deck) is achievable with the Web Platform APIs this project already uses in `src/lib/fig01/` — Canvas2D, `requestAnimationFrame`, `getComputedStyle`-sourced tokens, plain CSS — plus one new hand-authored inline SVG asset. The only "stack decision" here is architectural (how to structure the new modules), not a package to `npm install`.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Canvas2D API** (native, no library) | Web Platform, universal support | Starfield, Milky Way band, fireflies, constellation nodes/links | Already the project's proven rendering surface (`src/lib/fig01/render.ts`) — single-rAF, DPR-capped, token-driven, and already hit the 60fps/Lighthouse ≥90 floor at production quality. Element counts here (a few hundred stars, a few dozen fireflies, ~4 constellation clusters of ~5-8 nodes each) are two to three orders of magnitude below where WebGL's throughput advantage starts to matter — see "Alternatives Considered." |
| **Inline SVG (hand-authored)** | n/a (Web Platform) | Camper-car silhouette + single warm copper glow | Static, art-directed vector art belongs in SVG, not procedural canvas paths: crisp at every DPR with zero rasterization cost every frame, trivially hand-tweakable (unlike canvas path coordinates), and the "single warm glow" is a CSS `filter: drop-shadow()` / radial-gradient pseudo-element with one slow `@keyframes` opacity pulse — satisfies the "one moving thing per viewport" motion doctrine for near-zero cost. Mirrors the project's existing preference for plain CSS/token-driven styling over canvas wherever the content isn't per-frame data. |
| **Vanilla TypeScript state machine** (new project-authored module, no library) | project code | No-scroll full-viewport panel deck (wheel/swipe/keys/dots) | The requirement is explicitly "no page scroll" — not "hide the scrollbar." A hand-rolled index-based controller (panels `position: fixed`, CSS-transition crossfade driven by a `data-active` swap) gives full authorial control over transition timing/choreography, which real document scrolling (even `scroll-snap`) cannot guarantee. This is the same shape of problem `src/lib/fig01/interactions.ts` already solved (`wireKeyboard`, `wirePointer`, `wireButtons`, a debounce/cooldown gate) — same author, same codebase convention, no new paradigm. |
| **CSS custom properties + transitions** (extend existing `tokens.css`) | n/a | Panel crossfade, glow pulse, dot-nav active state, constellation-brighten opacity | Zero-JS-by-default constraint: anything that's a discrete state change (panel visible/hidden, dot active/inactive, glow pulse) belongs in CSS transitions/`@keyframes`, not a JS rAF tween. Reserve the rAF loop for genuinely continuous per-frame canvas work (star twinkle, firefly drift, beam travel). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| *(none required by default)* | — | — | The recommended path below needs zero new `npm install` entries. |
| `simplex-noise` (optional, ~1-2KB min+gz) | latest on npm if adopted | Higher-quality procedural texture for the Milky Way band | **Only if** the default scatter-dots + layered-gradient technique (see Architecture notes below) looks visibly flat/banded once prototyped against the real dark-graphite background. This is small enough not to violate the project's zero-heavy-dependency posture, but treat it as a fallback, not the default — try the zero-dependency version first. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| *(none new)* | — | Existing Biome + `astro check` + `astro/tsconfigs/strict` cover new `.ts`/`.astro` files with no config changes. No new build step, no new CI step. |

## Installation

```bash
# No new runtime dependencies required for v2.0 Night Sky.
# If Milky Way texture quality demands it during prototyping (optional, evaluate first):
npm install simplex-noise
```

## Architecture integration notes (how this plugs into the existing fig01 pattern)

- **Mirror the fig01 module skeleton** for the new engine, e.g. `src/lib/nightsky/{tokens,model,render,interactions,index}.ts`, with the same contract: `index.ts` exports one `initNightSky(root)` that wires everything and returns a teardown function, exactly like `initFig01(root)`.
- **Extract and share, don't duplicate, the DPR/rAF/token-cache utilities.** `getDpr()`, `stopAnimationLoop()`-style rAF driver, and the `getComputedStyle`-once token-reading pattern (`fig01/tokens.ts`) are generic enough to lift into a small shared `src/lib/canvas-shared/` (or similar) module both `fig01` and `nightsky` import — avoids two independent rAF loops competing for frame budget, which the research below flags as a real perf risk once you have 2-3 canvas layers running concurrently.
- **One shared rAF driver for the whole page**, not one per feature. The night sky's twinkle/firefly/constellation-beam updates and Fig. 01's beam animation (when its panel is active) should tick off a single `requestAnimationFrame` call site, each doing its own cheap per-layer update — matches the "single rAF loop" pattern the codebase already documents as a hard rule.
- **Layer the rendering by update frequency, not by visual concept** (this is the single most important perf lesson from the research below):
  - *Layer 0 — draw once, blit every frame:* deep/background starfield + the Milky Way band, pre-rendered to an offscreen canvas (or a hidden `<canvas>`/`ImageBitmap`) once at init and on resize, then `drawImage`'d into the visible canvas each frame (or simply left as its own static, never-redrawn `<canvas>` layer under the animated one). This is the same "static grid dots vs. animated beams" split fig01's `render.ts` already uses.
  - *Layer 1 — SVG, CSS-driven only:* the camper silhouette + copper glow. Never touches the rAF loop.
  - *Layer 2 — redrawn every frame, small element count:* a few dozen twinkling foreground stars, a few dozen fireflies, and the constellation nodes/links (which brighten based on active panel and occasionally "fire" a beam along an edge). All three are the same class of problem (a scattered set of glowing points with an alpha function of time) and can share one drawing routine parameterized by count/color/motion.
- **Constellation graph = adapt, don't reinvent, `fig01/model.ts`.** `advanceBeams`/`spawnBeam`/route geometry already implement exactly "a point of light traveling along a route that fires occasionally" — that is a neural link. Treat each named career chapter as a node cluster and reuse the beam-travel math for "links that occasionally fire," rather than building a second animation system from scratch.
- **Panel controller exposes a plain callback** (`onPanelChange(index: number) => void`), the same DOM-root-plus-plain-function wiring style as `initFig01(root)` — the night-scene engine subscribes to it to brighten the active panel's constellation. No event bus/pub-sub library needed for 4-6 panels.
- **Reduced motion carries forward the existing doctrine**: `prefers-reduced-motion` should (a) freeze twinkle/firefly/beam animation to a static single frame, exactly as fig01 already does, and (b) make panel transitions an instant cut instead of an animated crossfade.
- **New design tokens needed in `tokens.css`**, not hardcoded in canvas/TS: night-sky-specific colors (deep-space near-black, star white/blue-white, Milky Way tint, firefly warm amber) should be added as `:root` custom properties and read once via the same `getTokens()`-style pattern fig01 uses — continues the "never a hex literal in a render module" rule.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|--------------|-------------|--------------------------|
| Canvas2D layered rendering | WebGL / regl / three.js | Only if particle counts grew into the thousands, true 3D parallax/perspective were required, or per-pixel shader effects (real volumetric nebula, bloom) became a hard requirement. At this project's scale (hundreds of stars, dozens of fireflies, a handful of constellation nodes) Canvas2D comfortably holds 60fps, and WebGL adds context-loss handling, shader authoring, and a rendering paradigm with no fig01 precedent — pure downside for this element count. |
| Hand-rolled vanilla-TS panel-deck state machine (no real document scroll) | CSS `scroll-snap` on a `100vh overflow-y:auto` container (canvas layers `position: fixed` behind it) | This is a legitimate, meaningfully simpler middle path: near-zero JS, free native touch/wheel/momentum handling, and solid accessibility (real scrollable document, works with screen readers/keyboard `PageDown` natively). Fall back to it if the hand-rolled wheel/touch state machine proves fiddly across devices (trackpad momentum over-firing, iOS Safari overscroll bounce) during implementation — but it does not literally satisfy "no page scroll" (there is still a real, if snapped, scroll position), and gives up exact cross-fade/constellation-brighten timing control, which is why it's the fallback, not the default. |
| Hand-rolled vanilla-TS panel-deck state machine | `fullPage.js` / `swiper` / similar scroll-hijack libraries | Essentially never for this project. Research found fullPage.js is ~37KB+ with increasingly paid-gated features, and its free/lightweight alternatives are largely unmaintained since 2014-2019. A 4-6-panel deck is well within the complexity this project already proved it can hand-roll cleanly (`fig01/interactions.ts`), and doing so keeps the zero-new-dependency posture intact. |
| Scatter-dots + layered CSS-token gradients for the Milky Way band (zero dependency) | A small `simplex-noise`/value-noise library | Adopt only if the zero-dependency version looks visibly banded/artificial once prototyped — see Supporting Libraries above. Don't default to a noise library pre-emptively; the scatter+gradient approach follows directly from Canvas2D primitives already in use (radial/linear gradients, dot scatter identical in kind to fig01's dot-grid). |
| Main-thread pre-render of the static Layer 0 (Milky Way + deep starfield) at init/resize | `OffscreenCanvas` + a Web Worker | Only worth the added complexity if the pre-render pass were expensive/sustained (it isn't — it runs once at load and again on resize, not every frame) or if you needed to keep the main thread free during that pass for some other reason. For a one-shot pre-render, `OffscreenCanvas` buys nothing here and adds a browser-support variable (worker-based `transferControlToOffscreen` 2D-context support has historically been less consistent on Safari than the mainstream 2D canvas API). |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| three.js or any WebGL/GPU library | Adds a rendering paradigm (shaders, GPU context, context-loss recovery) with real payoff only at particle/geometry counts far above this scene's needs; no reduced-motion/a11y precedent in this codebase; pure risk against the Lighthouse ≥90 + zero-framework-runtime constraints for a flat 2D scene. | Layered Canvas2D, extending `fig01`'s existing engine pattern. |
| GSAP or any JS animation/easing library | This project has already proven it can hand-roll all the easing it needs (linear beams, staggered ease-out build-ins) in a few lines of `render.ts` math; panel crossfades and glow pulses are native CSS-transition territory, not JS-tween territory. | Plain CSS `transition`/`@keyframes` for discrete state changes; hand-rolled easing functions (already exist in `fig01/render.ts`) for continuous canvas motion. |
| `fullPage.js`, `swiper`, or other scroll-hijacking UI libraries | ~37KB+, features increasingly paywalled, most lightweight competitors unmaintained since 2014-2019 (see research above) — worse than the ~150-200 line hand-rolled controller this codebase's own precedent (`interactions.ts`) shows it can build. | The hand-rolled panel-deck state machine described above. |
| `shadowBlur` / CSS/canvas blur filters for star or glow "bloom" | Blur filters are comparatively GPU-expensive per-frame operations; research confirms bloom-like glow is commonly faked with layered radial-gradient fills instead, which is both cheaper and matches fig01's existing "no filter, just composited shapes" drawing style. | Layered radial-gradient fills at decreasing alpha (same technique already implicit in fig01's node-glow rendering). |
| Real document scroll (plain unstyled scrolling, or `scroll-snap` presented as *the* implementation of "no scroll") as the literal fulfillment of the "no page scroll" requirement | The requirement explicitly says no page scroll, and real scrolling — even snapped — still has a scroll position, can show scrollbars/overscroll bounce/address-bar chrome shifts on mobile Safari, and can't guarantee the tight cross-fade/constellation-brighten choreography the design calls for. | The hand-rolled fixed-position panel-deck controller (index-based active state, CSS-transition crossfade) as primary; keep `scroll-snap` filed as the documented fallback only, not the default. |

## Stack Patterns by Variant

**If the hand-rolled wheel/touch/key panel controller proves unreliable across real devices during implementation** (e.g., trackpad momentum repeatedly over-skipping panels, iOS Safari overscroll/rubber-band fighting a `position: fixed` scene layer):
- Fall back to CSS `scroll-snap` (`scroll-snap-type: y mandatory` on a `100vh` container, canvas layers `position: fixed` behind it, `overscroll-behavior: none`, hidden scrollbar) with an `IntersectionObserver` to derive the "active panel index" for the constellation-brighten callback.
- Because it trades some timing precision for materially lower implementation risk and free native input handling — acceptable if it starts eating disproportionate phase time.

**If the zero-dependency scatter+gradient Milky Way texture looks visibly artificial once prototyped against the real dark-graphite background:**
- Add `simplex-noise` (~1-2KB) purely for the one-time offscreen pre-render pass; it never touches the per-frame rAF loop, so the runtime cost is unchanged.
- Because a slightly better-looking hero visual is worth a ~1-2KB one-time dependency, but only after confirming the zero-dependency version is actually insufficient — don't reach for it pre-emptively.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| Canvas2D API | All evergreen browsers, GitHub Pages static hosting | No build-time integration required; this is pure client-side script, identical in kind to the already-shipped `fig01` module — no `astro.config.mjs` changes needed. |
| `OffscreenCanvas` (only if adopted for the Layer-0 pre-render) | Chrome/Firefox: broad support; Safari: full 2D-context `transferControlToOffscreen` support only from Safari 16.4+ | Not recommended by default (see Alternatives Considered) — flagging only in case a later phase revisits it. |
| CSS `scroll-snap` (only if adopted as the fallback panel mechanism) | Supported in all evergreen browsers since ~2019, ~96%+ of users, iOS Safari 11+ | Verified via MDN + multiple independent sources during this research pass — MEDIUM confidence, safe to treat as broadly available if the fallback path is taken. |
| `simplex-noise` (only if adopted) | Any modern bundler/Vite (Astro 7 uses Vite under the hood) | No known compatibility issues; would be the project's second runtime dependency after `@astrojs/sitemap`. |

## Sources

- WebSearch: "Canvas2D realistic starfield rendering technique brightness distribution twinkle animation performance" — multiple independent blog/CodePen/dev.to sources converged on the same brightness-distribution/sine-twinkle/no-blur-filter/parallax-layering techniques — MEDIUM confidence
- WebSearch: "CSS scroll-snap full viewport section navigation vs custom wheel touch keyboard controller accessibility" — cross-referenced against MDN (`scroll-snap-type`, "Basic concepts of scroll snap") plus CSS-Tricks/ishadeed.com — MEDIUM confidence (MDN itself is HIGH-confidence-tier; the accessibility caveats and support-percentage figure are synthesized across secondary sources, hence the blended rating)
- WebSearch: "offscreen canvas pre-rendered gradient texture Milky Way band nebula effect canvas 2d technique" — MDN `OffscreenCanvas`/`OffscreenCanvasRenderingContext2D` pages confirm the API and worker-offload rationale; no source directly addressed a "Milky Way" compositing recipe specifically — the layered-gradient + scatter-dot technique recommended above is a LOW-confidence synthesis from general Canvas2D gradient/pattern primitives, not a verified authoritative technique — flag for a quick visual prototype/spike before committing in the roadmap
- WebSearch: "fullpage.js alternatives lightweight vanilla javascript full page scroll library bundle size" — alvarotrigo.com, jQueryScript, SaaSHub comparisons — LOW confidence (aggregator/listicle sources, bundle-size figures not independently verified against current npm registry), used only to support a negative recommendation (don't adopt), which is a lower-risk claim than a positive one
- WebSearch: "requestAnimationFrame single canvas particle layers performance budget 60fps mobile" — multiple independent perf-engineering sources (web.dev-adjacent, Flipboard engineering blog, dev.to) converged on the 16.67ms budget, multi-canvas-layer, and decoupled-update-cadence patterns — MEDIUM confidence
- WebSearch: "wheel event deltaMode normalization trackpad vs mouse wheel cross browser best practice" — cross-referenced against MDN `WheelEvent`/`Element: wheel event` plus phrogz.net's normalization reference and jquery-mousewheel's README — MEDIUM confidence
- No context7 or other curated-registry MCP tool was available in this research pass (all `config.*_search` flags false, no `mcp__context7__*` tool exposed); all fetches used the built-in `WebSearch` fallback path per the tool-strategy seam
- Directly read for integration context (not web sources): `src/lib/fig01/index.ts`, `src/lib/fig01/render.ts`, `src/lib/fig01/tokens.ts`, `package.json`, `.planning/PROJECT.md` — HIGH confidence (primary source, this codebase)

---
*Stack research for: Astro 7 static portfolio — v2.0 "Night Sky" milestone (canvas night scene + no-scroll panel deck)*
*Researched: 2026-07-17*
