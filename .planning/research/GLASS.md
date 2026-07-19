# Glassmorphism Research — Milestone v3.0 "Real Sky"

**Lane:** backdrop-filter performance, dark glassmorphism grammar, accessibility over photographic backgrounds, fallback ladder, token integration.
**Researched:** 2026-07-18
**Method:** WebSearch + WebFetch. Primary/official sources (MDN, WebKit, web.dev, caniuse) preferred; where only aggregated dev-blog synthesis was retrievable, marked MEDIUM/LOW and flagged explicitly. No Context7 or curated-registry MCP was available in this run.

---

## 0. Context Recap (from prompt, not researched)

- Scene canvas (night sky, now a real astrophotography image + animated fireflies/clouds) sits **behind** content panels.
- Content chrome going full glass: panels, header/footer, jump index — all get backdrop blur + translucency + hairline light edges.
- Floors: Lighthouse ≥90 x4 (mobile/desktop presets), WCAG contrast ≥4.5:1 at worst-case pixel (existing canvas-readback verifier script `scripts/verify-contrast.mjs`), idle CPU <10%, reduced-motion support.
- Existing token file is `src/styles/tokens.css`, flat `:root` custom properties, zero-hex-outside-tokens discipline, a philosophy that visibly prunes tokens hard (e.g. the night-sky system comment: "Exactly 4 tokens ... No fifth token").
- Existing panel architecture (read directly from `scripts/verify-contrast.mjs`): full-viewport panel "deck" with `data-state="active"`, a DOM scrim (`linear-gradient` alpha ramp over `--bg`) sitting between the canvas and panel text, and a `#nightsky-canvas` that is read back pixel-by-pixel for the contrast verifier. This matters directly for Section 3 (the verifier's compositing model will need to change for glass).

---

## 1. backdrop-filter Performance Reality

### 1.1 What actually happens under the hood

`backdrop-filter` is a fundamentally different (and pricier) operation than `filter`. WebKit's own explainer describes a three-step pipeline: (1) capture the content **behind** the styled element — not its own background, the composited pixels of everything under it up to the nearest **backdrop root** — (2) run the filter chain (blur, saturate, brightness, …) over that captured region, (3) composite the blurred result back into the scene under the element's own background/content. **HIGH confidence** (WebKit, https://webkit.org/blog/3632/introducing-backdrop-filters/) — this describes the mechanism, not a benchmark.

**Backdrop root** is the load-bearing spec concept for this project's layering question: an element becomes a backdrop root if it has `opacity < 1`, a non-`none` `filter`, `mask`/`mask-image`/`clip-path`, `backdrop-filter` itself, `mix-blend-mode`, or `will-change` targeting any of those properties. `backdrop-filter` only samples pixels up to the nearest backdrop root — content *above* that boundary in paint order, or shielded behind an intervening backdrop root, is invisible to the filter. **HIGH confidence** (MDN, https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter). Practical implication: this is a *scoping* tool, not a *caching* tool. It controls **which** layers get sampled — it does not make a re-sample cheaper, and it cannot be used to "shield" the canvas from being blurred while still showing it: if the canvas is visually behind the glass and inside the same backdrop-root scope, it gets sampled every time that scope repaints.

### 1.2 Does an animating canvas behind glass force per-frame re-blur? — YES

Confirmed by multiple independent sources (converging, **MEDIUM-HIGH confidence** — consistent across several dev-blog deep-dives, no single canonical Chromium-source citation was retrievable this pass): each element with `backdrop-filter` is repainted whenever the content it samples changes. If a `<canvas>` sits underneath a glass panel and is redrawn every animation frame (as this project's firefly/cloud layer is, via `requestAnimationFrame`), the browser's compositor must re-run capture→blur→composite for that glass panel **on every one of those frames**, across the full pixel area where the panel overlaps the canvas. The canvas redraw was already forcing a compositor frame; the *added* cost is the blur pass itself (cost scales with blur-radius² and blurred-area size) plus an extra readback+recomposite pass per glass surface, per frame.

Two corroborating, more concrete points:
- `backdrop-filter: blur()` is repeatedly characterized as the most expensive CSS filter because "it reads pixels from the layer below every frame" (converging across multiple 2025/2026 dev-blog sources — **MEDIUM confidence**; no primary Chromium/WebKit engineering doc with that exact framing was retrievable, but it's consistent with WebKit's own three-step pipeline description in 1.1).
- `position: fixed` + `backdrop-filter` has a **documented iOS Safari issue**: it repaints the blurred region on every scroll frame even when nothing else changed — a second, orthogonal cost source specific to fixed-position glass (this project's header/footer are exactly this case). **MEDIUM confidence** (multiple independent community reports; no Apple/WebKit bug-tracker primary source found this pass).

### 1.3 Concrete budgets found in the wild

| Constraint | Value | Confidence | Source |
|---|---|---|---|
| Blur radius sweet spot | 8–16px; "below 10 looks like a rendering bug," above ~16–20 on low-end Android drops frames | MEDIUM (converging across 3+ independent dev-blog sources) | openreplay.com, uixplor, superdesign.dev, nineproo.com |
| Simultaneous glass surfaces (mobile) | 3–5 handled well; more degrades | MEDIUM (dev-blog synthesis) | f22labs.com and aggregated sources |
| Simultaneous glass surfaces (desktop) | More headroom, no hard number given | LOW | same aggregation |
| Compositing-layer memory | Each active layer costs GPU + system RAM; too many layers "can backfire" and reduce perf | MEDIUM | web.dev "Accelerated Rendering in Chrome" (https://web.dev/articles/speed-layers) |
| Global browser support | 94.63% of tracked global usage supports `backdrop-filter` | **HIGH** (direct caniuse fetch) | https://caniuse.com/css-backdrop-filter |
| Non-supporting browsers | IE 5.5–11, Opera Mini, KaiOS 2.5/3, QQ Browser 14.9; historically disabled-by-default in Chrome 47–75, Firefox 70–102 (now fine) | **HIGH** (direct caniuse fetch) | same |
| Apple "Liquid Glass" perf budget: ≤4 compositing layers/screen, blur ≤40px iPhone / ≤60px iPad-Mac | Cited by one search-synthesis result only | **LOW — unverified, do not hard-code** | could not corroborate against an Apple HIG/WWDC primary source this pass |

### 1.4 The canvas-behind-glass layering answer (the "killer question")

Given 1.1–1.3, the practically correct architecture for this project:

1. **Static astrophoto image as the true bottom layer.** A never-repainting `<img>`/`background-image` costs glass panels **nothing extra per frame** once painted — the compositor only re-runs a glass panel's blur pass when something in its *sampled region* changes, and a static image never does after load. This is the cheap case, and it's the direction the milestone is already headed (real photo replacing the procedural sky wash).
2. **The animated firefly/cloud canvas is the real recurring cost**, and every pixel of it under a glass surface pays that cost every frame. There is no "shield" trick — backdrop-root scoping (1.1) does not exempt visually-behind content from sampling. The real levers, in priority order:
   - **Minimize overlap area.** Bias firefly/cloud spawn density toward the margins/gutters outside the content column rather than uniformly across the viewport, so the *area* actually sampled by glass panels shrinks.
   - **Throttle the canvas's own redraw rate independent of display refresh.** Fireflies/drifting clouds are slow, low-frequency motion; redrawing the canvas at ~15–20fps (accumulator inside the existing `rAF` loop, not a full restructure) cuts forced re-blur passes 3–4x with no visible smoothness loss for this content class. This project's own git history already applies exactly this discipline elsewhere ("pause Fig. 01 rAF loop when its deck panel is inactive") — extend the same instinct to "don't force a 60fps re-blur for slow ambient motion."
   - **Fully remove inactive panels' glass from the paint tree**, not just visually hide them. Confirm inactive deck panels are `display:none` (removed from paint) rather than `opacity:0`/`visibility:hidden`, both of which can keep an element in the compositing pipeline in some engines — and critically, `opacity<1` on an *ancestor* of a glass element itself creates a new backdrop root, silently changing what gets sampled. This is a real footgun for a transition system that might fade panels via opacity.
   - **Keep blur radius at the low end (12–16px) specifically for glass surfaces with canvas underneath**, since cost scales with radius²; a footer-only glass surface over pure static sky (below firefly spawn range) can afford to go slightly higher.
   - **Cap simultaneous active glass surfaces at ≤4** — panel + header + footer + jump index is exactly 4, the project's locked scope — and treat that as a ceiling, consistent with the mobile "3–5 simultaneous blur effects" finding (1.3).
3. **`will-change: backdrop-filter` is a double-edged sword**: it pre-promotes the element to its own compositor layer (avoiding a first-blur stutter) but permanently reserves GPU memory while set. Apply it narrowly (header/jump-index, which show/hide on scroll) and gate/remove it elsewhere rather than applying blanket. **MEDIUM confidence**, general compositing-layer behavior via web.dev's rendering-layers explainer.
4. **`contain: layout paint` (or `content-visibility: auto` for offscreen panels)** on panel containers limits invalidation/repaint scope so a canvas redraw can't force recalculation of unrelated glass surfaces. Standard containment guidance, compounds well with the above. **MEDIUM confidence**.

**Verdict for the killer question:** animating canvas content **behind** a backdrop-filter **does** force a per-frame re-blur wherever the two regions overlap. There is no free layering trick that exempts it. The static-image sky costs nothing recurring; the fireflies/clouds canvas is the actual cost driver and must be budgeted (throttled redraw + reduced under-glass density + modest radius) rather than architected away.

---

## 2. Dark Glassmorphism Design Grammar (2026 state of the art)

### 2.1 Numbers, not vibes

Converging across several 2026 glassmorphism guides and generator tools (**MEDIUM confidence** — consistent range across independent sources, no single canonical spec since this is a design convention not a standard):

| Property | Light-glass convention | Dark-glass convention (relevant to this project) |
|---|---|---|
| Background fill alpha | ~10–15% white | **5–10% white** (`rgba(255,255,255,0.05–0.10)`) — lower than light mode because dark backdrops already read as "recessed"; too much white fill washes out the photo behind it |
| Blur radius | 10–20px | 10–16px (see §1.3 — same physical constraint, not aesthetic) |
| Saturation boost | 140–200% | 140–160% — this is the part that keeps a *photographic* backdrop looking alive instead of muddy; blur alone desaturates and flattens, `saturate()` in the same filter chain compensates |
| Brightness adjustment | Often omitted or >100% | Often **<100%** (e.g. 90–96%) or held near 100–110% depending on desired lift — used to keep white text readable against a bright patch of photo without a separate opaque scrim; direction (up vs down) is context-dependent, treat as a tuning knob not a fixed number |
| Border ("hairline light edge") | 1px, ~18–25% white alpha | Same convention carries to dark: **1px, ~8–18% white alpha**, frequently only on the top edge (or top+left) to simulate a light source from above — this is the "top-light convention" the prompt names |
| Corner radius | 16–20px | Same, independent of theme |
| Shadow | Soft, ~20–25% black alpha drop shadow beneath the glass panel, to seat it visually off the backdrop | Same — often slightly stronger on dark since the ambient backdrop already has more shadow "headroom" |

Representative composited recipe (dark, synthesized from multiple sources, **MEDIUM confidence**):
```css
background: rgba(255, 255, 255, 0.06);
backdrop-filter: blur(12px) saturate(150%) brightness(1.05);
border: 1px solid rgba(255, 255, 255, 0.10); /* top edge emphasized, see 2.2 */
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
```
Sources: superdesign.dev glassmorphism recipe page, nineproo.com CSS glassmorphism guide, devtooleasy backdrop-filter generator defaults, Josh W. Comeau's "Next-level frosted glass" (fetched directly — see 2.2). All converge on the same order of magnitude; treat exact percentages as a starting point to tune against this project's actual astrophoto, not a spec to copy verbatim.

### 2.2 Josh W. Comeau's "Next-level frosted glass" (fetched directly, HIGH confidence for this specific source — a well-known, technically rigorous CSS educator, not an aggregator)

This is the single most concrete, load-bearing primary-ish source found for the **edge-lighting technique** specifically:
- Primary panel blur: `blur(16px)`; a distinct **edge element** gets a different, lighter blur (`blur(6–12px)`) plus its own filter boost — `brightness(110%) saturate(120%)` on the edge vs `brightness(90%) saturate(140%)` on the body — to make the top edge read as catching more light than the body of the glass.
- The edge is a **separate DOM element**, not a CSS border — a thin strip (`--thickness: 4–6px` custom property) positioned at the top of the panel via `transform: translateY(100%)` trickery, given its own `background: hsl(0deg 0% 100% / 0.1)` and its own (lighter) blur/filter chain, then masked with `mask-image: linear-gradient(to bottom, black 0% 50%, transparent 50% 100%)` so it fades into the panel body rather than showing a hard seam.
- Fallback background for browsers without `backdrop-filter` support: `hsl(0deg 0% 100% / 0.95)` (near-opaque) vs `hsl(0deg 0% 100% / 0.5)` when blur is active — i.e., **when you can't blur, compensate with much higher opacity**, not the same low opacity without blur (which would look like a dirty smear, not a design choice). This generalizes directly to Section 4's fallback ladder.
- Explicitly frames the exact alpha/blur numbers as "more art than science" — treat as a starting point, tune visually against the real astrophoto.

**This "separate edge element with its own lighter filter chain, masked to fade" technique is the single strongest, most specific finding in this research pass for the "1px light-edge border, top-light convention" requirement** — a plain `border-top: 1px solid rgba(255,255,255,.15)` is the cheap/default version; Comeau's technique is the higher-fidelity version if budget allows one extra blurred element per glass surface (weigh against the ≤4-glass-surface budget in §1.3/1.4 — this would make each "glass surface" actually 2 blurred elements, doubling the compositing-layer count, so likely NOT worth it for header/footer/jump-index which are cost-sensitive; reserve for the content panels only, where scroll-driven repaint is less of a concern than for fixed chrome).

### 2.3 Apple Liquid Glass / visionOS-influenced patterns

Liquid Glass (announced WWDC 2025, shipped iOS/iPadOS/macOS "26") is the reference system the prompt names. Confirmed, **HIGH confidence** (Apple newsroom + Apple Developer docs, https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/, https://developer.apple.com/documentation/technologyoverviews/liquid-glass): the material "reflects and refracts its surroundings," dynamically adapts to bring focus to content, and features specular highlights that respond to device motion plus adaptive shadows. These are **native rendering effects (motion-driven lensing, real-time specular highlights)** that do not have a direct, cheap CSS equivalent — real-time light-bending/lensing on the web would require a WebGL/shader approach, which is out of scope and in tension with this project's "no framework runtime, static site" constraints and CPU floor. **Do not chase literal Liquid Glass fidelity in CSS** — take the *grammar* (translucency + blur + edge highlight + adaptive elevation), not the literal implementation (real-time refraction). The concrete ≤4-layer/blur-radius performance budget attributed to Liquid Glass in one search result could not be corroborated against a primary Apple source this pass (see §1.3) — treat only the qualitative direction as reliable, not the numbers.

### 2.4 Elevation hierarchy (multiple glass levels)

Consistent recommendation across sources (**MEDIUM confidence**, general design-system convention rather than one citable source): use **2 glass "levels"** for a system this scoped, not more:
- **Level 1 (chrome — header/footer/jump index):** lighter blur, lower fill alpha, always-present, optimized for cheap/idle-friendly rendering since these are visible for the whole session.
- **Level 2 (content panels):** can afford slightly heavier blur/saturation since panels are the "featured" surface and only one is typically active/visible at a time in this project's deck architecture.
Avoid a 3rd/4th elevation tier — more levels mostly just fragment the token budget (see §5) without a corresponding perceptual benefit at this site's scale (a handful of pages, not a dense app UI).

---

## 3. Accessibility Over Glass

### 3.1 The core problem: an unpredictable photographic backdrop

Unlike the current procedural night-sky (whose luminance range is fully controlled — see the `--sky-zenith`/`--sky-horizon` tokens and the scrim system in `deck.css`), a real astrophotography image has **uncontrolled local luminance** (bright star clusters, Milky Way core, moon glow) that a blur *reduces* variance in (blur is a low-pass filter — it literally cannot make dark regions darker or bright regions brighter, only smooths transitions) but does **not** guarantee stays under a contrast floor. Blur alone is not an accessibility strategy.

### 3.2 Dark-tint floor strategy (scrim + glass alpha stack)

Recommended approach, consistent across accessibility-focused sources (**MEDIUM-HIGH confidence** — this is standard "scrim over image" practice, well-established beyond just glassmorphism, e.g. Material Design's own image-scrim guidance and NN/g's text-over-images article):
- Treat the glass panel's own background alpha (§2.1's 5–10% white) as **decorative, not sufficient for contrast** — it is far too transparent on its own to guarantee 4.5:1 against an arbitrary bright photo pixel.
- Add a **separate, opaque-leaning dark tint layer** between the blur and the text — effectively what this project already has (the `deck.css` scrim gradient over `--bg`, confirmed live in `scripts/verify-contrast.mjs`: alpha ramps from 0 at panel edges up to 0.38 peak mid-panel). **The existing scrim system should be preserved/extended for glass, not replaced by it** — glass blur handles the *edge/chrome* legibility problem (separating panel from scene), the scrim handles the *contrast floor* problem, and they are complementary, not redundant.
- Concretely: `worst-case pixel contrast = f(text color, blurred-photo-pixel, scrim alpha, glass fill alpha)`. Since blur narrows the *variance* of the photo but not its *floor*, the scrim's peak alpha (currently 0.38 in this codebase) is the actual safety margin — this milestone should re-verify (not assume) that 0.38 remains sufficient once the sky source changes from a controlled procedural palette to an uncontrolled photo where the brightest pixel value is unknown until the actual image is chosen. **Recommend re-running the worst-case scan (§3.4) against the actual candidate astrophoto(s) before locking any scrim/glass alpha values** — this is a case where the number cannot be picked from research alone, it depends on the specific image.

### 3.3 `prefers-reduced-transparency`

- **What it does:** OS-level accessibility signal (Windows 11: Settings > Personalization > Colors > Transparency effects; macOS: Accessibility > Display > Reduce transparency) that the CSS Media Queries Level 5 spec exposes as `prefers-reduced-transparency: reduce | no-preference`. **HIGH confidence**, MDN + Chrome for Developers blog (https://developer.chrome.com/blog/css-prefers-reduced-transparency).
- **Browser support (2026):** Chrome/Edge 118+ support it; Firefox behind a flag; **Safari does not support it** as of the sources checked this pass. **MEDIUM-HIGH confidence** (Chrome for Developers blog is authoritative for the Chrome/Edge figures; Firefox/Safari status is less certain and should be spot-checked against caniuse at implementation time — Safari's lack of support is notable given this is an Apple-influenced design direction and the target audience skews toward professional/Mac-using recruiters).
- **Recommended pattern — additive, not subtractive:** define the LOW-transparency (safe, opaque-leaning) value as the *default*, then only add more transparency inside `@media (prefers-reduced-transparency: no-preference)`. This means Safari (no support) and any browser that hasn't matched the media query both silently get the safer, more opaque default — a graceful degradation for free, not an extra branch to maintain:
  ```css
  .glass-panel {
    --glass-bg-alpha: 0.95; /* opaque-leaning default */
    background: rgb(var(--panel-rgb) / var(--glass-bg-alpha));
    @media (prefers-reduced-transparency: no-preference) {
      --glass-bg-alpha: 0.08; /* true glass, only when explicitly not reduced */
    }
  }
  ```
  Source: Chrome for Developers blog, fetched directly, **HIGH confidence** for the pattern itself.

### 3.4 Extending the existing worst-case contrast verifier to glass

Read directly (`scripts/verify-contrast.mjs`, this repo): the current verifier's `compositePixel()` function does **analytic alpha compositing** — it takes a raw `getImageData` pixel from `#nightsky-canvas`, then manually composites the DOM scrim's alpha (and any semi-transparent DOM background layers) *in JavaScript*, pixel-by-pixel, using the standard `a*fg + (1-a)*bg` formula. This works today because every layer between the canvas and the text is either fully opaque (short-circuits the walk) or a flat-alpha `rgba()` fill — none of them spatially mix neighboring pixels.

**Backdrop-filter blur breaks this model**: a blurred pixel's value is a weighted average of a *neighborhood* of underlying pixels (roughly the blur radius in extent), not a function of the one pixel at that coordinate. The current `getImageData` on `#nightsky-canvas` + manual `a*fg+(1-a)*bg` composite is therefore **not sufficient** once a glass panel with `backdrop-filter: blur()` sits between the canvas and the scrim/text.

Two extension paths, in order of correctness vs. effort:
1. **True post-composite screenshot sampling (recommended, HIGH confidence this is correct — it sidesteps the analytic-model problem entirely).** Instead of reading `#nightsky-canvas` and simulating the composite in JS, use CDP's `Page.captureScreenshot` (or an equivalent full-page raster capture) to get the browser's **actual GPU-composited output**, which already includes the real blur, real saturate/brightness adjustments, and real DOM layering — then run the exact same `worstCaseContrastInRegion()` scanning logic (already written, reusable verbatim) over the *screenshot's* pixels in the same text bounding boxes instead of over canvas `ImageData`. This requires no manual blur simulation and is correct by construction — it measures what a user's eye actually sees. The existing CDP scaffolding in `verify-contrast.mjs` (Chrome launch, WebSocket CDP client, panel navigation loop) is directly reusable; only the pixel-source step changes from `ctx.getImageData(...)` to a screenshot decode.
2. **Analytic box-blur approximation (cheaper to reuse the current architecture, lower fidelity).** Approximate the glass panel's sampled region as a box blur (average the canvas `ImageData` over a `radius`-sized neighborhood around each output pixel) before feeding it into the existing `compositePixel()` chain. This avoids adding a screenshot-decode step but is an approximation of the browser's actual (Gaussian-ish, engine-specific) blur kernel — real Gaussian blur and a box-blur approximation can differ by a meaningful margin at a hard 4.5:1 floor, so this path carries **more risk of a false pass**. Only recommend this if screenshot capture proves infeasible in the CI/verification environment.

**Recommend path 1.** It is a smaller conceptual change than it sounds (the CDP machinery already exists in this exact script) and eliminates an entire class of "did I model the blur kernel correctly" risk at a hard accessibility gate.

### 3.5 `prefers-contrast: more` and focus-visible on glass

- `prefers-contrast: more` (the current spec name; older drafts used `high`) is a legitimate, separate signal from `prefers-reduced-transparency` — a user can want higher contrast without wanting zero transparency. Recommended glass-specific response: bump the scrim's peak alpha and/or swap glass fill alpha toward the opaque end of its range, plus thicken the hairline edge, inside a `@media (prefers-contrast: more)` block. **MEDIUM confidence** (general pattern, converging across accessibility-focused sources, not glass-specific).
- **Focus-visible on translucent surfaces is a genuine risk**: a `:focus-visible` outline in the site's `--accent` copper token could itself have inconsistent contrast against a variable photo backdrop, the same problem as text. The most resilient documented pattern is a **double-outline / double-ring technique**: two concentric outlines in contrasting values (e.g., a dark ring + a light ring, or copper + near-black) such that at least one ring maintains ≥3:1 against *any* possible backdrop, because the two rings' mutual contrast is itself ≥9:1. **MEDIUM confidence**, general focus-indicator accessibility guidance (Sara Soueidan-adjacent focus-indicator literature), not glass-specific but directly applicable — glass panels are exactly the "unpredictable backdrop" case this technique exists for. WCAG 2.4.11/2.4.13 floor: focus indicator ≥3:1 contrast, ≥2px thick, non-trivial area — this is a **separate, harder floor to hit reliably on glass than the 4.5:1 text floor**, because focus rings are thin (less area to average/scrim under) and often sit right at a panel's edge where the scrim is weakest (per this project's existing scrim curve, alpha tapers to 0 at 0%/100% y-fraction — i.e. **panel edges are the scrim's weakest point**, which is exactly where focus-visible rings on edge-adjacent interactive elements would need to prove out worst-case contrast).

---

## 4. Fallback Ladder

### 4.1 `@supports` pattern (define opaque first, enhance second)

Consistent, well-established pattern across sources (**HIGH confidence** — this is standard, low-risk CSS feature-detection practice, not a contested area):
```css
.glass-panel {
  /* Baseline: solid, translucent-leaning panel — works everywhere,
     including the project's stated "no-JS classic mode" and any
     browser without backdrop-filter. */
  background: rgb(var(--panel-rgb) / 0.92);
  border: 1px solid var(--hair2);
}

@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  .glass-panel {
    background: rgb(var(--panel-rgb) / 0.08);
    backdrop-filter: blur(14px) saturate(150%);
    -webkit-backdrop-filter: blur(14px) saturate(150%); /* Safari still requires the prefix */
    border: 1px solid rgb(255 255 255 / 0.10);
  }
}
```
Notes:
- **Always keep the `-webkit-` prefix** — Safari (all versions, including current) requires it even though it's shipped the unprefixed property for years elsewhere; this is one of the most commonly repeated "don't forget this" notes across every source checked. **HIGH confidence.**
- Given 94.63% global support (§1.3, direct caniuse fetch), the `@supports` fallback branch will rarely trigger in practice for this audience (senior engineers/recruiters on current-generation browsers) — but it's a near-zero-cost hedge given the project's existing "no-JS classic mode ethos," and it's the same code path that serves `prefers-reduced-transparency: reduce` users (§3.3) a reasonable floor even in browsers lacking that media feature.

### 4.2 Print styles

`backdrop-filter` (and any blur-dependent visual identity) is meaningless on a printed page and should be stripped, falling back to the same opaque baseline as §4.1:
```css
@media print {
  .glass-panel, .glass-header, .glass-footer, .glass-jumpindex {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: white; /* or the project's existing print stylesheet convention if one exists */
  }
}
```
**HIGH confidence** for the "strip backdrop-filter in print" recommendation (uncontroversial, low-risk — a photographic sky and blurred glass panels have no print value and printing translucent panels over a raster background is a common print-quality complaint in the wild). No project-specific print stylesheet was found in this research pass — flag for the roadmap that if one doesn't already exist, it should now, given glass adds a second reason (translucency) on top of the sky's photographic background as a first reason.

### 4.3 Combined fallback priority order

For a given glass surface, the effective CSS cascade should resolve fallbacks in this order (most to least specific):
1. `prefers-reduced-transparency: reduce` (or **no support** for the media feature at all, per the additive pattern in §3.3) → opaque baseline.
2. `@supports not (backdrop-filter: ...)` → opaque baseline (same visual target as #1, can share the same base rule).
3. `prefers-contrast: more` → bump scrim/border alpha even on top of the glass variant (§3.5) — this is additive to glass, not a full fallback to opaque, unless the design chooses to also collapse to opaque here for simplicity.
4. `prefers-reduced-motion: reduce` → **not a blur/transparency concern per se**, but relevant if any glass-adjacent motion (e.g., a shimmer/specular animation inspired by Liquid Glass, §2.3) is added — disable that motion, keep the static blur.
5. `@media print` → opaque baseline, no blur.

Because #1 and #2 converge on the same visual target (opaque baseline panel), a single "baseline-first, enhance-second" CSS structure (§4.1's pattern) naturally satisfies both with one set of rules, which is the cleanest implementation.

---

## 5. Token Integration

### 5.1 Proposed new tokens (additive to `tokens.css`, respecting its existing zero-hex-outside-tokens + minimal-token-count discipline)

Given the existing file's demonstrated philosophy (flat `:root` custom properties, hex literals only here, a documented "exactly N tokens, no fifth token" pruning discipline for the sky system), the glass system should follow the same shape — a **small, closed set**, not a token per surface:

```css
/* Glass system (Milestone v3.0) — shared by panels, header/footer, jump index.
   Two elevation levels only (see GLASS.md §2.4): chrome (lighter) and
   content panels (slightly heavier). Do not add a third level. */
--glass-bg:          rgb(255 255 255 / 0.07);   /* fill alpha, panel level */
--glass-bg-chrome:    rgb(255 255 255 / 0.05);   /* fill alpha, header/footer/jump-index — lighter, always-visible surfaces */
--glass-edge:         rgb(255 255 255 / 0.10);   /* 1px top-light hairline border */
--glass-blur:         12px;                       /* panel-level radius */
--glass-blur-chrome:  10px;                       /* chrome-level radius, kept low since these are fixed/always-composited */
--glass-saturate:     150%;
--glass-brightness:   1.03;
--glass-fallback-bg:  var(--panel);               /* opaque baseline — reuse the EXISTING --panel token, don't invent a new opaque color */
```
Rationale for reuse over invention: `--glass-fallback-bg` deliberately reuses the existing `--panel` (`#12161c`) token rather than introducing a new opaque color — the fallback ladder's baseline (§4.1) should look like "the current, pre-glass panel design," which is exactly what `--panel` already is. This keeps the new token surface minimal (8 new custom properties, 2 of which are pure numbers/percentages not colors) and avoids a second competing "opaque panel color" concept.

### 5.2 Where alpha values live

Follow the existing file's pattern of storing **fully-composed color values** (not separate hex + separate alpha) in each token — e.g. `--glass-bg: rgb(255 255 255 / 0.07)` as one token, not `--glass-white` + `--glass-alpha` as two. This matches how `--sky-zenith` etc. are already single composed values, and avoids the zero-hex-outside-tokens rule becoming ambiguous about where an alpha-only literal is allowed to live.

### 5.3 Consuming the tokens

```css
.panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness));
  border-top: 1px solid var(--glass-edge);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .panel { background: var(--glass-fallback-bg); }
}
```

### 5.4 One open naming question for the roadmap

The prompt's own vocabulary (`--glass-bg`/`--glass-edge`/`--glass-blur`) maps close to 1:1 onto what's proposed above — flag this as **low-risk to lock now** rather than defer, since it's consistent with both the prompt's own suggested names and the existing file's naming convention (`--sky-zenith`, `--hair`, `--hair2` — short, surface-role-named, no numbers-in-names).

---

## 6. Verdict — Recommended Glass Recipe

**Confidence overall: MEDIUM** — the performance/architecture claims (§1) are well-corroborated across independent sources and one HIGH-confidence primary source (WebKit) plus one HIGH-confidence spec source (MDN); the specific numeric recipe (§2) is a synthesis across several converging but non-canonical design-blog sources and should be treated as a **starting point to visually tune against the actual chosen astrophoto**, not a locked spec.

### Recipe (content panels — Level 2)
```css
background: rgb(255 255 255 / 0.07);
backdrop-filter: blur(12px) saturate(150%) brightness(1.03);
-webkit-backdrop-filter: blur(12px) saturate(150%) brightness(1.03);
border-top: 1px solid rgb(255 255 255 / 0.10);
/* existing deck.css scrim gradient PRESERVED underneath, re-verified against
   the actual chosen astrophoto's brightest pixels — see §3.2/3.4 */
```

### Recipe (chrome — Level 1: header, footer, jump index)
```css
background: rgb(255 255 255 / 0.05);
backdrop-filter: blur(10px) saturate(140%);
-webkit-backdrop-filter: blur(10px) saturate(140%);
border-top: 1px solid rgb(255 255 255 / 0.08); /* header only — footer likely wants border-bottom, jump index likely wants border-left, per top-light convention adapted per edge */
```

### Fallback (all glass surfaces)
```css
/* baseline, before @supports */
background: var(--panel); /* opaque, existing token */
/* enhance inside @supports (backdrop-filter) or (-webkit-backdrop-filter),
   and re-collapse to this baseline inside
   @media (prefers-reduced-transparency: reduce) per the additive pattern (§3.3) */
```

### The canvas-behind-glass layering answer (repeated for visibility)
Static astrophoto = free once painted. Animated firefly/cloud canvas = the real recurring cost wherever it overlaps a glass surface; there's no architectural trick that exempts it (backdrop-root scoping doesn't help — §1.1). Budget it via: reduced under-glass spawn density, throttled ~15-20fps canvas redraw, ≤16px blur radius where canvas is present, ≤4 simultaneous glass surfaces, and full removal (not just hiding) of inactive panels' glass from the paint tree.

### Biggest risk
**The worst-case contrast verifier's compositing model breaks under glass** (§3.4): its current per-pixel analytic `a*fg+(1-a)*bg` JS simulation cannot represent a spatial blur kernel. This must be re-architected (recommended: screenshot-based post-composite sampling via the CDP scaffolding already in `scripts/verify-contrast.mjs`) *before* any glass/scrim alpha values are locked, or the 4.5:1 floor may be silently unverified/gamed by an inaccurate model. Second-biggest risk: the specific numeric recipe above is untested against the actual chosen astrophoto — its brightest pixel could sit anywhere, and the existing scrim's 0.38 peak alpha (tuned for a controlled procedural palette) is not guaranteed to still be sufficient.

---

## Sources

- https://webkit.org/blog/3632/introducing-backdrop-filters/ — WebKit official explainer, backdrop-filter mechanism (3-step pipeline) — fetched directly — HIGH confidence
- https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter — MDN spec reference, "backdrop root" definition, filter function syntax — fetched directly — HIGH confidence
- https://caniuse.com/css-backdrop-filter — global support 94.63%, unsupported browser list — fetched directly — HIGH confidence
- https://developer.chrome.com/blog/css-prefers-reduced-transparency — official Chrome DevRel blog, additive CSS pattern, Chrome/Edge 118+ support — fetched directly — HIGH confidence
- https://www.joshwcomeau.com/css/backdrop-filter/ — "Next-level frosted glass," edge-lighting technique with concrete blur/alpha values, fallback opacity numbers — fetched directly — HIGH confidence for this named, technically rigorous source; numbers themselves are explicitly framed by the author as tuned-by-eye, not derived
- https://web.dev/articles/backdrop-filter — web.dev "Create OS-style backgrounds with backdrop-filter" — fetched directly, but yielded limited actionable detail beyond a general performance caution — MEDIUM confidence, thin content
- https://web.dev/articles/speed-layers — web.dev "Accelerated Rendering in Chrome" — compositing layer/GPU memory behavior, referenced via search synthesis — MEDIUM confidence (not directly fetched this pass)
- https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/ and https://developer.apple.com/documentation/technologyoverviews/liquid-glass — Apple Liquid Glass qualitative description (real-time lensing, specular highlights) — search-synthesis sourced, not directly fetched — MEDIUM confidence for the qualitative description; the specific "≤4 layers, ≤40/60px blur" performance-budget figure attributed to Apple could NOT be corroborated against a primary source — LOW confidence, flagged explicitly, do not rely on it
- https://expensive.toys/blog/animated-blur-overlay — animated backdrop-filter breakage in Chrome, `@property`-based workaround — fetched directly — MEDIUM confidence, narrow scope
- Multiple converging dev-blog/aggregator sources on blur radius budgets, simultaneous-surface counts, and dark-glass alpha recipes (openreplay.com, uixplor.com, f22labs.com, superdesign.dev, nineproo.com, devtooleasy.com) — search-synthesis only, not individually fetched — MEDIUM confidence each, treated as corroborating when 2+ independent sources converged on the same order of magnitude, otherwise flagged LOW
- WCAG/accessibility sources on scrim-over-image and focus-indicator contrast (webaim.org, nngroup.com, w3.org WCAG techniques G18/F83, Sara Soueidan-adjacent focus-indicator literature) — search-synthesis only — MEDIUM confidence, standard/uncontested guidance
- `C:\Development\Dump\Portfolio\scripts\verify-contrast.mjs` and `C:\Development\Dump\Portfolio\src\styles\tokens.css` — read directly from the local repo, not web research, but load-bearing for §3.4 and §5 — HIGH confidence (primary artifact, not a claim about the world)
