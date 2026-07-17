# Architecture Research

**Domain:** v2.0 "Night Sky" integration — persistent-scene + panel-deck presentation layer added to a shipped Astro 7 static portfolio
**Researched:** 2026-07-17
**Confidence:** HIGH for internal structure/integration points (derived directly from reading the actual shipped source: `src/pages/index.astro`, `src/layouts/BaseLayout.astro`, `src/components/Figure01.astro`, `src/lib/fig01/*`, `src/styles/tokens.css`, `src/styles/global.css`); MEDIUM for the external accessibility/rAF-coordination patterns cross-checked via web search (see Sources)

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│  BaseLayout.astro (UNCHANGED) — head/meta, imports tokens.css/fonts.css/    │
│  global.css once, <slot/>                                                   │
├────────────────────────────────────────────────────────────────────────────┤
│  index.astro (RESTRUCTURED)                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ NightSky.astro           — fixed, full-bleed, z-index:0 canvas host  │  │
│  │   <canvas id="nightsky-canvas">  (starfield/Milky Way/camper/fireflies)│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ PanelDeck.astro           — z-index:1, owns the deck DOM + dot nav   │  │
│  │  ┌────────┐ ┌────────┐ ┌───────────┐ ┌──────────┐ ... ┌────────┐    │  │
│  │  │Panel   │ │Panel   │ │Panel      │ │Panel     │     │Panel   │    │  │
│  │  │ <Hero/>│ │<Figure │ │<SystemsL/>│ │<Experien/│ ... │<Contact│    │  │
│  │  │        │ │ 01/>   │ │           │ │ ceSection│     │Section/│    │  │
│  │  └────────┘ └────────┘ └───────────┘ └──────────┘     └────────┘    │  │
│  │  <SiteHeader/> and <SiteFooter/> render OUTSIDE the panel loop, as   │  │
│  │  fixed chrome (nav/clock persist across every panel, per FEATURES)   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│  CLIENT-SIDE ENGINE LAYER (two sibling vanilla-TS modules, no framework)     │
│  ┌───────────────────────────────┐   ┌────────────────────────────────┐   │
│  │ src/lib/nightsky/               │   │ src/lib/fig01/  (UNCHANGED)     │   │
│  │  scene.ts    — starfield/Milky  │◄──┼─ event: 'nightsky:panel-change' │   │
│  │                Way/camper/       │  │   (CustomEvent on document)     │   │
│  │                fireflies draw   │   │  index.ts / interactions.ts /   │   │
│  │  constellations.ts — graph      │   │  model.ts / render.ts / tokens.ts│  │
│  │                render+highlight  │   │  keep their existing            │   │
│  │  deck.ts     — panel index state,│   │  IntersectionObserver + Page-   │   │
│  │                wheel/swipe/key/  │   │  Visibility + matchMedia gating │   │
│  │                dot input, emits  │   │  UNTOUCHED (see Pattern 1 below)│   │
│  │                the change event  │   └────────────────────────────────┘   │
│  │  tokens.ts   — wraps a NEW       │                                        │
│  │                shared color-     │                                        │
│  │                reader module     │                                        │
│  │  index.ts    — initNightSky(root)│                                        │
│  │                → teardown()      │                                        │
│  └───────────────────────────────┘                                          │
│  src/lib/shared/css-tokens.ts (NEW) — getComputedStyle/hex-parse plumbing    │
│    extracted so fig01/tokens.ts and nightsky/tokens.ts don't duplicate it   │
├────────────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                                  │
│  src/data/constellations.ts (NEW) — typed: chapter id, star coordinates,     │
│    labels, neural-link pairs, `source` honesty-gate string per chapter       │
├────────────────────────────────────────────────────────────────────────────┤
│  FALLBACK LAYER (no build-time branch — one implementation, CSS-gated)       │
│  No-JS / init-failure: PanelDeck never gets its `.deck-active` class →       │
│    panels render as normal stacked document flow == v1's scrolling column   │
│  prefers-reduced-motion: nightsky renders one static frame (no twinkle/      │
│    firefly/link-fire loop), panel transitions become instant (no slide)     │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| `NightSky.astro` | DOM shell for the scene canvas only: one `<canvas>`, `position: fixed; inset: 0; z-index: 0`, `aria-hidden="true"` (purely decorative — content stays in the panels' real DOM/AOM). Imports and calls `initNightSky(root)` | Mirrors `Figure01.astro`'s exact shape: markup + one bare bundling `<script>` tag, no props crossing the boundary |
| `PanelDeck.astro` | DOM shell for the deck: a `<div class="deck">` wrapping N `<Panel>` children (passed via slot), a `<div class="dots">` with one button per panel, imports and calls `initDeck(root)` | Astro component with a **default slot**, so `index.astro` still authors `<Panel id="hero"><Hero/></Panel>` etc. — existing section components are never forked |
| `Panel.astro` (NEW, thin) | One panel: `<section class="panel" id={id} role="group" aria-roledescription="panel">`, applies the shared full-viewport-centering layout CSS that today lives inline in `index.astro`'s `.page` class | Pure wrapper — takes an `id` + `default slot`; the wrapped component's own internal markup/CSS is untouched |
| `src/lib/nightsky/scene.ts` | Draws the persistent background: dot/star field, Milky Way gradient band, camper silhouette + single warm glow, sparse fireflies. Owns its own module-scope rAF driver, independently gated (see Pattern 3) | Vanilla TS, same shape as `fig01/render.ts` |
| `src/lib/nightsky/constellations.ts` | Renders the 4 career-chapter constellations (points + connecting lines) on the same canvas or a second stacked canvas; exposes `highlight(chapterId)` / `dim()` driven by the deck's panel-change event; owns the "occasional neural link fire" ambient animation | Reads `src/data/constellations.ts`; pure draw + a small timer for the sparse link-fire pulses (same `setTimeout`-not-rAF-driven doctrine as Fig. 01's heal timer, so it still fires under reduced motion if kept subtle) |
| `src/lib/nightsky/deck.ts` | The panel state machine: current index, `next()/prev()/goTo(id)`, wheel-delta debounce, touch swipe threshold, arrow-key handling, dot click handling, applies the transform/`inert` swap on panel elements, dispatches `nightsky:panel-change` on `document` | Vanilla TS class or closure over module state, same idiom as `fig01/model.ts` + `interactions.ts` split |
| `src/lib/nightsky/tokens.ts` | Reads any NEW color tokens this milestone needs (e.g. a star-white, Milky-Way-glow value) that aren't in `tokens.css` yet — added to `tokens.css` first, then read here | Thin wrapper around the new shared `src/lib/shared/css-tokens.ts` helper (see Structure Rationale) |
| `src/lib/shared/css-tokens.ts` (NEW) | The generic `getComputedStyle`+hex-parse logic currently duplicated verbatim inside `fig01/tokens.ts` (`parseHex`, `readToken`, `rgba`) | Extract once, both `fig01/tokens.ts` and `nightsky/tokens.ts` call into it — avoids a second copy of the same 20 lines and keeps "one token reader" as the Anti-Pattern-2 doctrine intended |
| `src/data/constellations.ts` (NEW) | Typed: 4 career-chapter entries (AWS, Microsoft, Samsung, patents/education), each with star coordinates (relative 0–1 canvas-space, not pixel), a label, optional neural-link pairs to other chapters, and a `source` string tracing the label back to the résumé (honesty gate, same discipline as every other data module) | Plain exported array + interface, same shape as `src/data/systems.ts`/`experience.ts` |
| `Figure01.astro`, `src/lib/fig01/*` | **Unchanged.** Fig. 01 becomes the content of one `<Panel id="fig01">` | Zero code changes required if `PanelDeck`'s inactive-panel technique is transform-based (Pattern 1) |
| `SiteHeader.astro`, `SiteFooter.astro` | Persist across every panel (nav + live clock) — render as fixed chrome outside the panel loop, above the deck in z-index | Unchanged internals; only their position in `index.astro`'s composition moves (from in-flow to a `position: fixed` context, likely via a small wrapper CSS change in `index.astro`, not the components themselves) |
| `src/pages/work/[slug].astro` (case studies) | Unchanged. Reachable via a normal same-page link from inside the `SystemsList` panel (an `<a href="/work/...">`, which necessarily leaves the deck/night-sky experience — that's expected: case studies are full separate pages, not panels) | No change |

## Recommended Project Structure

```
src/
├── components/
│   ├── NightSky.astro          # NEW — canvas host, fixed full-bleed background
│   ├── PanelDeck.astro         # NEW — deck shell + dot nav, default slot for <Panel>s
│   ├── Panel.astro             # NEW — thin per-panel wrapper (id + centering layout)
│   ├── SiteHeader.astro        # unchanged internals; now fixed chrome
│   ├── Hero.astro               # unchanged — becomes Panel content
│   ├── Figure01.astro           # unchanged — becomes Panel content
│   ├── SystemsList.astro        # unchanged — becomes Panel content
│   ├── ExperienceSection.astro  # unchanged — becomes Panel content
│   ├── PatentsSection.astro     # unchanged — becomes Panel content
│   ├── SkillsSection.astro      # unchanged — becomes Panel content
│   ├── ContactSection.astro     # unchanged — becomes Panel content
│   └── SiteFooter.astro         # unchanged internals; now fixed chrome
├── lib/
│   ├── nightsky/
│   │   ├── index.ts             # initNightSky(root): () => void  (mirrors initFig01)
│   │   ├── scene.ts             # starfield/Milky Way/camper/fireflies draw + own rAF gate
│   │   ├── constellations.ts    # constellation draw + highlight(id)/dim() + link-fire timer
│   │   ├── deck.ts              # panel state machine + input wiring + change-event dispatch
│   │   └── tokens.ts            # night-sky-specific token reads (wraps shared/css-tokens)
│   ├── shared/
│   │   └── css-tokens.ts        # NEW — extracted getComputedStyle/parseHex/rgba (was fig01-only)
│   └── fig01/                   # UNCHANGED (model/render/interactions/tokens/index)
├── data/
│   ├── constellations.ts        # NEW — chapter → star coords/label/links/source
│   └── ...                      # profile/systems/experience/patents/skills unchanged
├── styles/
│   ├── tokens.css                # append any new night-sky-only tokens; still the ONE source
│   ├── fonts.css                 # unchanged
│   └── global.css                # append the no-JS fallback base (deck-inactive = normal flow)
└── pages/
    └── index.astro                # RESTRUCTURED: BaseLayout > SiteHeader (fixed) + NightSky +
                                    #   PanelDeck( Panel*8 wrapping unchanged sections ) + SiteFooter (fixed)
```

### Structure Rationale

- **`lib/nightsky/` mirrors `lib/fig01/`'s split exactly (model/render/interactions → scene/constellations/deck):** same team already validated this decomposition ships a "must not regress" canvas engine successfully; reusing the shape means no new pattern to learn, and each concern (ambient scene, constellation graph, deck input) stays independently diffable.
- **`Panel.astro` is new and deliberately thin:** the downstream requirement is "wrap existing section components WITHOUT forking their markup." A slot-based wrapper is the only Astro-native way to do that — `Panel.astro` owns layout/role/id, the wrapped component owns everything else, identical to how `BaseLayout.astro` already wraps every page via one `<slot/>` without touching page content.
- **`shared/css-tokens.ts` is a small, justified refactor, not scope creep:** `fig01/tokens.ts` already contains a generic `parseHex`/`readToken`/`rgba` trio with zero Fig.-01-specific logic. Night sky needs the identical mechanism for new tokens (star white, Milky Way glow). Copy-pasting it a second time would recreate exactly the "two sources of truth" drift risk the existing `ARCHITECTURE.md` Anti-Pattern 2 was written to prevent — extracting it once is a few minutes of work that keeps that doctrine intact.
- **`data/constellations.ts` stays a typed array, not a content collection:** same reasoning as `experience.ts`/`patents.ts` in the current codebase — four fixed-shape chapter entries, no Markdown body, no reason to add collection-schema ceremony.
- **`index.astro` is the only page file that changes structurally:** `BaseLayout.astro`, `SEO.astro`, `content.config.ts`, `[slug].astro`, and `404.astro` all stay exactly as shipped — the night-sky experience is additive at the home-page composition layer, not a rewrite of the site's routing or content model.

## Architectural Patterns

### Pattern 1: Keep Fig. 01's existing IntersectionObserver lifecycle intact by making panel-hide a geometry change, not a display/opacity change

**What:** `src/lib/fig01/interactions.ts`'s `wireLifecycle` already gates the render loop on `IntersectionObserver` + `visibilitychange` + `matchMedia('(prefers-reduced-motion: reduce)')` — none of that code references scrolling specifically, it only cares whether `.fig-stage`'s bounding box geometrically intersects the viewport. If `PanelDeck`'s inactive-panel technique uses `transform: translateX(110vw)` (or `translateY`) on the panel wrapper rather than `display: none` or `opacity: 0`, the Fig. 01 panel's bounding box genuinely leaves the viewport when inactive and genuinely re-enters it when active — the existing `IntersectionObserver` fires correctly with **zero changes** to `lib/fig01/*`.
**When to use:** For the Fig. 01 panel specifically, and as the default technique for every panel — it's free performance (a translated-away panel isn't painted or hit-tested) and it's the one integration path that touches zero lines of the "must not regress" engine.
**Trade-offs:** Requires `PanelDeck`'s CSS to commit to transform-based positioning (`position: absolute; inset: 0`, all panels stacked, only the active one at `translate(0,0)`) instead of a simpler opacity crossfade. Slightly more CSS to write; the payoff is reusing Fig. 01's already-shipped, already-tested lifecycle gating verbatim.

**Example:**
```css
/* PanelDeck.astro */
.panel { position: absolute; inset: 0; transition: transform var(--deck-t, 320ms) ease; }
.panel[data-state="inactive-next"] { transform: translateX(100%); }
.panel[data-state="inactive-prev"] { transform: translateX(-100%); }
.panel[data-state="active"] { transform: translateX(0); }
```
```typescript
// deck.ts — only ever mutates data-state + inert; never display/opacity
panelEl.dataset.state = 'active';
panelEl.inert = false; // inactive panels get `.inert = true`
```

### Pattern 2: Explicit event contract between the deck and the constellation layer (don't infer state from the DOM)

**What:** `deck.ts` dispatches a single `CustomEvent('nightsky:panel-change', { detail: { id, index, prevId } })` on `document` at the start of every panel transition. `constellations.ts` subscribes once (inside `initNightSky`) and reacts: brighten the constellation whose `id` matches the incoming panel (via `src/data/constellations.ts`'s chapter-to-panel-id mapping), dim the previous one, and — if `id === 'fig01'` — pause `scene.ts`'s own ambient loop (Pattern 3).
**When to use:** Any time two independently-initialized modules (`nightsky/index.ts` and, indirectly, `fig01`) need to react to the same state change without one importing the other's internals. This keeps `lib/nightsky/` and `lib/fig01/` fully decoupled — neither imports from the other — matching the existing codebase's "no framework state library, just DOM + module-scope state" doctrine.
**Trade-offs:** A DOM CustomEvent is slightly more indirection than a direct function call, but it's the standard vanilla-JS decoupling primitive and avoids `PanelDeck` needing to know internal details of the night-sky engine (or vice versa) — each side only needs to agree on the event name + detail shape.

**Example:**
```typescript
// deck.ts
document.dispatchEvent(new CustomEvent('nightsky:panel-change', {
  detail: { id: panels[nextIndex].id, index: nextIndex, prevId: panels[currentIndex].id },
}));
```
```typescript
// constellations.ts
document.addEventListener('nightsky:panel-change', (e: Event) => {
  const { id, prevId } = (e as CustomEvent<{ id: string; prevId: string | null }>).detail;
  dim(prevId);
  highlight(id);
});
```

### Pattern 3: "One moving thing per viewport" applied to two independent rAF loops — pause the scene, don't try to co-run two 60fps loops

**What:** PROJECT.md's locked motion doctrine already states "one moving thing per viewport." Extend it explicitly to the engine layer: `scene.ts` owns its own module-scope rAF loop (twinkle + firefly drift + link-fire pulses), gated on `document.hidden` + `matchMedia(reduce-motion)` only (no IntersectionObserver needed — the canvas is `position: fixed`, always geometrically in the viewport). When the `nightsky:panel-change` event's `id === 'fig01'`, `scene.ts` calls its own `pause()` (stop the rAF loop, paint one dim static frame) instead of continuing to animate underneath Fig. 01's own now-active 60fps loop. On leaving the Fig. 01 panel, `scene.ts` resumes.
**When to use:** Any time the active panel itself owns an animation loop (today: only Fig. 01). For every other panel (static text/lists), the night sky keeps animating — it's the only moving thing on those panels.
**Trade-offs:** A hand-rolled coordination rule (pause on one specific panel id) rather than a generic shared-scheduler abstraction. Simpler to build and reason about than a real frame-budget scheduler, and sufficient because there are only ever two possible animators on screen at once (never three+); revisit only if a future panel adds a third independent loop.

**Example:**
```typescript
// scene.ts
export function pauseAmbient(): void { stopSceneLoop(); renderStaticFrame(dimTokens); }
export function resumeAmbient(): void { if (!rm.matches && !document.hidden) startSceneLoop(); }

// index.ts (nightsky)
document.addEventListener('nightsky:panel-change', (e) => {
  const { id } = (e as CustomEvent<{ id: string }>).detail;
  id === 'fig01' ? pauseAmbient() : resumeAmbient();
});
```

### Pattern 4: Progressive enhancement — the deck is a CSS-class opt-in, not a build-time route split

**What:** `PanelDeck.astro`'s base (no-JS) CSS renders panels as normal stacked block elements — exactly `index.astro`'s current `.page` scrolling column, just now expressed as `<Panel>` wrappers instead of raw section tags. `initDeck(root)` (the bundled `<script>`, same idiom as `initFig01`) adds a single class, e.g. `root.classList.add('deck-active')`, only after it successfully wires up. All of Pattern 1's `position: absolute`/transform rules live under `.deck-active .panel { ... }` in CSS, so they're inert until that class is present. If JS is disabled, or the init script throws before reaching that line, the page never leaves normal document flow — it scrolls exactly like v1, panel by panel, in the same DOM order.
**When to use:** This is the answer to "does the v1 scrolling layout remain reachable" — yes, automatically, as the actual base case, not a maintained parallel `/classic` route. No second implementation to keep in sync.
**Trade-offs:** Requires discipline that every deck-only visual rule (fixed positioning, dot nav, transform transitions) is scoped under `.deck-active`, never applied unconditionally — a CSS authoring convention, not a runtime cost. The upside is one codebase, one set of section components, zero duplicated content between a "night sky" version and a "classic" version.

**Example:**
```css
/* PanelDeck.astro — base: normal flow, works with zero JS */
.panel { position: relative; padding: 64px clamp(18px, 4vw, 32px); }

/* Enhanced: only once JS has wired the deck successfully */
.deck-active .panel { position: absolute; inset: 0; }
.deck-active .dots { display: flex; } /* dots are display:none in the base case — no JS means no working nav */
```

## Data Flow

### Panel-Change Flow (client-side, after mount)

```
user input (wheel delta / touch swipe / ArrowUp/Down / dot click)
    ↓
deck.ts: debounce/threshold → next()/prev()/goTo(id)
    ↓
deck.ts mutates each Panel's data-state + inert, transitions the active one to translate(0,0)
    ↓ (IntersectionObserver on Fig.01's .fig-stage fires automatically — Pattern 1)
    ↓
deck.ts dispatches `nightsky:panel-change` CustomEvent on document
    ↓                                              ↓
constellations.ts: highlight(id)/dim(prevId)   scene.ts: pauseAmbient()/resumeAmbient() (Pattern 3)
```

### Token Flow (extends the existing one-way flow — unchanged direction)

```
src/styles/tokens.css  (:root — append night-sky-only tokens here, never invent a literal elsewhere)
    ↓ imported once in BaseLayout.astro (unchanged import site)
    ├── every component's scoped <style> block reads var(--token)          [unchanged]
    ├── src/lib/fig01/tokens.ts reads via getComputedStyle at init         [unchanged]
    └── src/lib/nightsky/tokens.ts reads via the NEW shared/css-tokens.ts  [new call site,
                                                                              same read pattern]
```

### Constellation Data Flow (build-time → runtime)

```
src/data/constellations.ts (chapter id, relative star coords, label, links[], source string)
    ↓ imported at build time by nightsky/constellations.ts (bundled via the bare <script> pipeline,
      same "Astro TS/import bundling seam" NightSky.astro's script tag uses — no props cross the boundary)
    ↓
constellations.ts draws the static graph on init, then highlight(id)/dim(id) only toggle
    opacity/glow-radius per chapter in response to the panel-change event — topology itself
    never recomputed at runtime
```

## Scaling Considerations

Same framing as the existing `ARCHITECTURE.md`: "scale" here means panel/content growth and interactive-engine count, not traffic — this remains a static personal site.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| v2: 8 panels, 2 engines (nightsky + fig01) | Structure above is sufficient — Pattern 3's hand-rolled pause rule handles the one case where two loops could coexist |
| A 3rd animated panel added later (e.g. a `/craft` experiment surfaced as a panel) | Pattern 3's binary pause rule needs to generalize to "pause ambient scene whenever the active panel declares `data-animated="true"`" rather than hardcoding the `fig01` id — flag this as a near-term refactor trigger, not a v2 blocker |
| Case-study count grows past a handful | No change to this milestone's structure — case studies remain full separate pages reached via an in-panel link from `SystemsList`, outside the deck entirely |

### Scaling Priorities

1. **First risk: two rAF loops on screen at once (nightsky + Fig. 01) blowing the 60fps floor.** Mitigated up front by Pattern 3 (pause, don't co-run) — not something to profile-tune later.
2. **Second risk: panel-hide technique silently breaking Fig. 01's existing lifecycle gating.** Mitigated up front by Pattern 1 (transform-based hide keeps the existing `IntersectionObserver` semantics valid) — the single highest-value integration decision in this research, because getting it wrong means either modifying "must not regress" code or Fig. 01 burning CPU while hidden behind another panel.
3. **Third risk: token/canvas drift now across TWO canvas modules instead of one.** Mitigated by the `shared/css-tokens.ts` extraction (Structure Rationale) — same doctrine as v1's Anti-Pattern 2, now enforced for two consumers instead of one.

## Anti-Patterns

### Anti-Pattern 1: Hiding inactive panels with `display: none` or `opacity: 0`

**What people do:** The obvious-looking way to "hide" a panel is `display: none` (removes from layout) or an opacity crossfade (keeps it painted, just invisible).
**Why it's wrong:** `display: none` also removes the element from the accessibility tree abruptly (no announce) and, more importantly here, moves the Fig. 01 panel's bounding box to `0×0` in a way that some browsers report as non-intersecting only after layout recalculation lag; an opacity crossfade keeps Fig. 01's `.fig-stage` fully "intersecting" per `IntersectionObserver` even while it's invisible underneath another panel, so its render loop keeps running for zero visible benefit — silently burning the exact frame budget Pattern 3 is trying to protect.
**Do this instead:** `transform: translateX/Y()` to physically move inactive panels out of the viewport (Pattern 1), paired with the `inert` attribute for focus/AT exclusion once the transition finishes.

### Anti-Pattern 2: Wiring `nightsky/*` and `fig01/*` to import each other directly

**What people do:** Have `scene.ts` `import { stopAnimationLoop } from '../fig01/render'` (or the reverse) to coordinate pausing directly.
**Why it's wrong:** Couples two independently-initialized, independently-testable engines together, and risks import-order/init-order bugs (which one boots first? what if Fig. 01's panel is never visited in a session?). It also means a future change to Fig. 01 internals (a private rename) can silently break the night-sky engine.
**Do this instead:** The `CustomEvent` contract (Pattern 2) — both sides depend only on an agreed event name + detail shape, never on each other's modules.

### Anti-Pattern 3: A separate `/classic` route or a build-time flag to preserve the v1 scrolling layout

**What people do:** Duplicate `index.astro` into `index.astro` (deck) + `classic.astro` (scroll), or gate the whole night-sky feature behind an Astro build-time env flag producing two output trees.
**Why it's wrong:** Two places to update every time content changes; the case-study/résumé-metric honesty-gate discipline this project already enforces (one source of truth per number) gets undermined the moment there are two page trees rendering the same content data.
**Do this instead:** Progressive enhancement (Pattern 4) — one implementation, one DOM, a single CSS class opt-in that JS adds after successful init.

### Anti-Pattern 4: Duplicating the `getComputedStyle`/hex-parse token reader in `nightsky/tokens.ts`

**What people do:** Copy `fig01/tokens.ts`'s `parseHex`/`readToken`/`rgba` functions verbatim into a second file because it's fast and self-contained.
**Why it's wrong:** Recreates the exact "two sources of truth for the same mechanism" pattern the existing codebase's Anti-Pattern 2 (`ARCHITECTURE.md` v1) was written to prevent — a bugfix or format change (e.g. supporting `rgb()` tokens later) now needs to land in two places.
**Do this instead:** Extract once to `src/lib/shared/css-tokens.ts` (Structure Rationale), both `fig01/tokens.ts` and `nightsky/tokens.ts` import from it.

## Integration Points

### External Services

No new external services — this milestone is entirely client-side/build-time, same GitHub Pages static-hosting model as v1. No changes to `.github/workflows/deploy.yml`, `astro.config.mjs`, or the sitemap/OG pipeline.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `PanelDeck.astro` (markup) ↔ existing section components | Astro **default slot** | `index.astro` wraps each unchanged component in `<Panel id="...">`; zero forking of `Hero.astro`/`SystemsList.astro`/etc. |
| `nightsky/deck.ts` ↔ `nightsky/constellations.ts` + `nightsky/scene.ts` | `CustomEvent('nightsky:panel-change')` on `document` (Pattern 2) | One producer (deck), two independent consumers; consumers never call back into deck |
| `nightsky/*` ↔ `fig01/*` | **None directly.** Coordination is entirely geometric (Pattern 1, via the shared DOM/CSS contract of panel transforms) + the same `CustomEvent` (Pattern 2/3) that also drives constellation highlighting | This is the load-bearing boundary: it must stay a DOM-level contract, never a module import, to keep Fig. 01 unmodified (Anti-Pattern 2) |
| `fig01/tokens.ts` + `nightsky/tokens.ts` ↔ `shared/css-tokens.ts` (NEW) | Direct import of a shared pure-function module | No DOM/event coupling needed here — it's stateless utility code, safe to share directly (unlike the two engines' runtime state) |
| `src/data/constellations.ts` ↔ `nightsky/constellations.ts` | Build-time import, bundled via the bare `<script>` tag pipeline | Same "Astro TS/import bundling seam" already documented in `Figure01.astro`'s header comment — any attribute added to the script tag opts out of it |
| `tokens.css` ↔ every component/module (including the two new ones) | CSS custom properties, read-only from the consumer side | Unchanged one-way rule; only new tokens this milestone needs get appended here |

## Sources

- `src/pages/index.astro`, `src/layouts/BaseLayout.astro`, `src/components/Figure01.astro`, `src/lib/fig01/index.ts`, `src/lib/fig01/interactions.ts`, `src/lib/fig01/tokens.ts`, `src/components/SystemsList.astro`, `src/styles/tokens.css`, `src/styles/global.css` — all read directly from the live repository at `C:\Development\Dump\Portfolio` — HIGH confidence, primary source
- `.planning/PROJECT.md` (v2.0 milestone section, locked design/motion doctrine, constraints) — HIGH confidence, project's own current decisions
- `.planning/research/ARCHITECTURE.md` (v1 research, superseded in place by this file) — HIGH confidence as a record of the already-validated `lib/fig01/` split and Anti-Pattern 2 token-drift doctrine this research extends
- [Make accessible carousels — Chrome for Developers](https://developer.chrome.com/blog/accessible-carousel) — MEDIUM confidence; corroborates the `inert`/tabindex-management approach for inactive panels and the tabpanel-like pagination pattern
- [Avoid scrolljacking — Webflow Accessibility Checklist](https://webflow.com/accessibility/checklist/task/avoid-scrolljacking) and [Scrolljacking and Accessibility — SitePoint](https://www.sitepoint.com/scrolljacking-accessibility/) — MEDIUM confidence; informed the recommendation that panel transitions must remain instant/keyboard-operable, and that the progressive-enhancement fallback (Pattern 4) is the safety net for users/agents who can't or don't want the deck experience
- [requestAnimationFrame Scheduling For Nerds — Paul Irish](https://medium.com/@paul_irish/requestanimationframe-scheduling-for-nerds-9c57f7438ef4) and general rAF-budget web-search synthesis (single-rAF-handler recommendation, ~10ms JS budget within the 16.67ms frame) — MEDIUM confidence; corroborates Pattern 3's "don't co-run two independent 60fps loops" recommendation, though the specific "pause the scene during Fig. 01" rule is this agent's project-specific synthesis, not sourced verbatim

---
*Architecture research for: Astro portfolio v2.0 "Night Sky" — persistent scene + panel deck integration*
*Researched: 2026-07-17*
