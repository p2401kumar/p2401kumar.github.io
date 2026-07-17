# Phase 2: Fig. 01 — Signature Interactive Figure - Research

**Researched:** 2026-07-17
**Domain:** Porting a working vanilla-JS canvas IIFE into a modular, production-hardened Astro/TypeScript component (no new UI framework, no new runtime dependencies)
**Confidence:** MEDIUM-HIGH — the reference implementation is a known-working artifact (primary source, HIGH confidence); the porting/hardening concerns (Astro script bundling, a11y patterns, rAF lifecycle) are corroborated across official docs and multiple independent sources (MEDIUM confidence); no LOW-confidence claims remain unflagged.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Reference implementation (LOCKED — do not regress behavior)**
`.planning/reference/prototype-shell-and-fig01.html` contains the working figure as a single IIFE. Its BEHAVIOR is the contract; its structure is not. Port it into modules with identical visible behavior:
- Topology: 3 client devices → `elb/weight-away` → 4 cells (`cell-0..3`) → `data-pipelines` → `ml/snapshots`
- Elbow-routed 1px hairline paths (Manhattan routing, rounded corners), dot-grid substrate with cursor lens
- Staggered dependency-order build-in on load (nodes fade+rise ~60ms stagger, routes draw-on ~55ms stagger)
- Ambient request beams: one spawns every ~2.6–4.0s; beam = 70px gradient tail + 2.2px head, speed ~0.22 px/ms; path client → LB → weighted healthy cell → pipelines → ML
- `send request` button + clicking any node dispatches a beam; node glow on beam arrival (decay ×0.955/frame)
- `inject fault`: random cell among 1–3 degrades — amber, dashed border (dashed = unhealthy grammar), status dot amber; routing weights exclude it; event log narrates (`cell-N fault injected → weighed away · traffic rerouting · p99 stable`); self-heals after ~8s (`recovered · weight restored`); button disabled while degraded
- Hover tooltips with REAL production facts; ML node breathes (soft ring, ~1200ms period)
- Figure chrome: fig-bar (`fig. 01 — request path through a cellularized region · live` + two buttons), canvas ~380px (300px ≤640px), event log (max 2 lines, newest first, timestamped America/Los_Angeles), caption line

**Architecture (from ARCHITECTURE.md — LOCKED)**
- `src/lib/fig01/model.ts` (topology, state, weights), `render.ts` (canvas drawing), `interactions.ts` (pointer/keyboard/buttons/tooltip), `tokens.ts` (reads colors at runtime via `getComputedStyle` from tokens.css custom properties — NEVER duplicate hex literals)
- `src/components/Figure01.astro` — markup chrome + one plain `<script type="module">`; NO framework island, NO client: directives
- Tooltip and event log are HTML overlays (crisper than canvas text), positioned relative to the figure stage
- Facts/metrics shown in tooltips come from a typed data module with `source` fields (extend `src/data/` — e.g. `fig01.ts`), consistent with the CONT-07 honesty gate. Numbers allowed: +30% reliability, −20% p99 (cellularization); 90% capacity ops automated (weight-away); info-theory snapshots (Azure); SmartThings/Galaxy S21 (clients). No invented telemetry.

**Accessibility floor (REQUIREMENTS FIG-05/06 — build WITH the animation, not after)**
- `prefers-reduced-motion: reduce` → NO rAF loop: render one complete static frame (all routes drawn, nodes placed); `send request` becomes a no-op or instant-glow; `inject fault` still works via instant state redraw + event log narration (the informative content survives)
- Keyboard: both buttons are real `<button>`s with visible focus rings (already the pattern); add a roving-focus or sequential tab order over canvas nodes exposing each node's tooltip content (visually-hidden text or a focus-following HTML tooltip); event log wrapped in `aria-live="polite"`; no keyboard trap
- Canvas gets `role="img"` + `aria-label` describing the figure; the interactive semantics live in the HTML controls

**Performance floor (FIG-07)**
- Single rAF loop; DPR cap 2; batched path strokes; no `ctx.shadowBlur` (layered strokes/gradients only — already the prototype's approach)
- Pause the loop when `document.hidden` and when the figure is fully offscreen (IntersectionObserver) — battery/perf hygiene
- 60fps target on average laptops; the page with figure active must not fall below Lighthouse 90 Performance (formal audit is Phase 3; smoke-check now with a local Lighthouse run if convenient)

### Claude's Discretion
- Exact module boundaries within `src/lib/fig01/`, TS types for nodes/beams/state, IntersectionObserver thresholds, tooltip positioning math, how node keyboard traversal is implemented (buttons list vs roving tabindex), whether to add a tiny unit test for the weight-exclusion logic

### Deferred Ideas (OUT OF SCOPE)
- Formal Lighthouse ≥90 audit + OG image (possibly featuring the figure) → Phase 3
- In-browser visual QA residual from Phase 1 (CLS/glyph/clock) → Phase 3 polish pass
- Any Fig. 01 variants (trace view, status view) → /craft experiments, v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FIG-01 | Staggered dependency-ordered build-in + ambient request beams | Reference IIFE `intro`/stagger logic (lines 246–256, 289–296 of prototype) ports directly into `render.ts`; single-rAF architecture (Pattern: Single rAF Loop below) preserves this |
| FIG-02 | Dispatch request via button/node click, travels full topology | `spawnBeam()`/`routes`/`pAt`/`pathTo` logic (prototype lines 182–201) ports into `model.ts` (topology/beam math) + `interactions.ts` (click wiring) |
| FIG-03 | Fault injection: degrade, reroute, narrate, self-heal ~8s | `degraded`/`healT`/`healthyCells()` state (prototype lines 194–216, 284–286) ports into `model.ts`; event log via `aria-live` region (Accessibility section below) |
| FIG-04 | Hover tooltip with real production facts | HTML tooltip overlay pattern (Pattern 2 below) + typed `src/data/fig01.ts` module with `source` fields (Don't Hand-Roll / Data Module section) |
| FIG-05 | `prefers-reduced-motion` → static informative figure, fault injection still works | `matchMedia` + `change` listener pattern (Pattern: Reduced Motion below); reference IIFE already has an `RM` flag precedent (line 134, 194, 247, 251, 259, 290) to formalize |
| FIG-06 | Keyboard operability, visible focus, no trap | Native `<button>` proxy controls per node (Pattern: Canvas Accessibility below); `aria-live="polite"` log |
| FIG-07 | 60fps, DPR cap 2, batched draws, Lighthouse ≥90 with figure active | Single rAF + IntersectionObserver/visibilitychange pause (Pattern: Lifecycle Gating below); HiDPI sizing pattern (Pattern: HiDPI Canvas below) |
</phase_requirements>

## Summary

The reference implementation at `.planning/reference/prototype-shell-and-fig01.html` is a complete, working ~215-line IIFE that already implements every visible behavior FIG-01..07 require. This phase is **not** a canvas-design problem — it is a **porting and hardening** problem: split one IIFE into four typed modules (`model.ts`, `render.ts`, `interactions.ts`, `tokens.ts`) behind a plain `<script type="module">` in `Figure01.astro`, while adding three things the prototype does NOT yet have: (1) a real `prefers-reduced-motion` branch that renders a static informative frame rather than just an `RM` flag that skips intro staging, (2) keyboard/screen-reader access via native HTML proxy controls, and (3) lifecycle gating (IntersectionObserver + `visibilitychange`) so the rAF loop stops spending CPU when the figure isn't visible.

Astro requires the `<script>` tag to be **bare** (no `type="module"` attribute) for its own bundling/TypeScript pipeline to run — adding `type="module"` explicitly, which the CONTEXT.md decision text mentions, actually **opts out** of Astro's processing per official docs. This is the single most consequential porting detail: use a bare `<script>` tag (Astro auto-converts it to `type="module"` after processing) so `src/lib/fig01/*.ts` imports get bundled and type-checked, not a hand-written `type="module"` attribute.

No new runtime npm packages are needed — everything here is standard browser APIs (Canvas 2D, `matchMedia`, `IntersectionObserver`, `ResizeObserver`, `getComputedStyle`) already used elsewhere in the codebase (SiteFooter's clock). The only discretionary new dependency is `vitest` as a devDependency, if a unit test for the weight-exclusion logic is added — Astro's own docs describe this as a manual (not zero-config) setup via `getViteConfig()`.

**Primary recommendation:** Port the reference IIFE's math/logic verbatim into `model.ts`/`render.ts`/`interactions.ts` (it is already correct and tuned), and spend the actual engineering effort on the three hardening gaps: reduced-motion static frame, keyboard proxy controls, and rAF lifecycle gating — these are net-new behavior, not present in the prototype.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Canvas topology drawing (nodes, routes, dot-grid, beams) | Browser / Client | — | Pure imperative Canvas 2D rendering; no server involvement possible on GitHub Pages |
| Fault-injection state machine (degrade/reroute/self-heal) | Browser / Client | — | Client-side simulation only — there is no backend; "live" in the fig-bar label refers to the animation being genuinely running, not a real telemetry feed |
| Tooltip / event-log DOM overlays | Browser / Client | — | HTML overlays positioned over the canvas stage, per locked architecture decision (crisper text than canvas-drawn text) |
| Design tokens (color values) | CDN / Static (authored) | Browser / Client (consumed) | Authored once in `tokens.css` (build-time static asset); read at runtime by the canvas module via `getComputedStyle` — one-way flow, CSS is authoritative |
| Tooltip fact content (`source`-tagged metrics) | CDN / Static (authored) | Browser / Client (consumed) | Typed data module (`src/data/fig01.ts`) is build-time static content, imported into the client bundle at build time — same pattern as `systems.ts`/`experience.ts` |
| Figure markup + script composition | CDN / Static | — | `Figure01.astro` is fully prerendered at build time (Astro `output: 'static'`); the `<script>` tag ships as a static JS asset, no SSR involved |
| Reduced-motion / visibility lifecycle gating | Browser / Client | — | Depends on `matchMedia`, `IntersectionObserver`, `document.hidden` — all client-only runtime APIs |

## Standard Stack

### Core

No new runtime libraries. Fig. 01 is built entirely on standard browser APIs already available in every evergreen browser Astro 7 targets:

| API | Purpose | Why Standard |
|-----|---------|---------------|
| Canvas 2D Context (`CanvasRenderingContext2D`) | All figure drawing | Already the reference implementation's engine; zero-dependency, matches "no framework runtime" constraint exactly |
| `matchMedia('(prefers-reduced-motion: reduce)')` | Detect + live-track motion preference | Web standard; `.matches` for initial check, `addEventListener('change', ...)` for live OS toggle — `[CITED: developer.mozilla.org/…/prefers-reduced-motion]` |
| `IntersectionObserver` | Detect figure scroll-offscreen | Web standard; pairs with `visibilitychange` to fully cover the pause/resume matrix (see Pitfalls) |
| `document.hidden` / `visibilitychange` | Detect tab-backgrounding | Web standard; catches the case IntersectionObserver misses (tab hidden, figure still "in viewport") |
| `ResizeObserver` | Detect stage/canvas box resize | Web standard; more robust than a bare `window.resize` listener because it also fires on container-driven resizes (font load reflow, etc.), not just viewport resize |
| `getComputedStyle` | Read CSS custom properties at runtime | Already the locked architecture pattern (ARCHITECTURE.md Pattern 2) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | `4.1.10` (latest, verified via `npm view vitest version` `[VERIFIED: npm registry]` — peer-compatible with the project's pinned `vite@8.1.2` override, peer range `^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0`) | Unit-testing `model.ts`'s pure logic (weight exclusion, healthy-cell selection, route math) | Only if the team exercises the "Claude's Discretion" option to add a unit test — see Package Legitimacy Audit below for the required checkpoint before installing |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<button>` proxy controls for keyboard node access | Full roving-`tabindex` hit-testing directly on canvas (reimplementing arrow-key nav, focus ring drawing) | Native buttons get focus rings, Enter/Space activation, and screen-reader semantics for free; hand-rolled roving tabindex on a canvas requires manually drawing focus indicators and reimplementing keyboard nav — significantly more code for the same outcome (see Don't Hand-Roll) |
| `IntersectionObserver` + `visibilitychange` combined | `IntersectionObserver` alone | IO does not fire on tab-backgrounding (element stays "intersecting" while tab is hidden) — using IO alone would keep the rAF loop running (wastefully) in a backgrounded-but-scrolled-to tab |
| `vitest` for the optional unit test | No test framework, manual `node --eval` sanity checks | Vitest is near-zero-config for `getViteConfig()` projects and this is the only case in the phase where automated testing meaningfully de-risks logic (weight-exclusion is a pure function with clear edge cases: "never exclude cell-0", "never leave zero healthy cells") |

**Installation (only if the discretionary unit test is added):**
```bash
npm install -D vitest
```

**Version verification:** `npm view vitest version` → `4.1.10` (peer `vite: "^6.0.0 || ^7.0.0 || ^8.0.0"`, compatible with this project's `vite@8.1.2` override) — confirmed 2026-07-17 `[VERIFIED: npm registry]`.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|--------------|---------|-------------|
| `vitest` | npm | unknown (tool signal fetch failed — registry lookup returned no age/downloads/repo data in this environment) | unknown (same) | unknown (same) | **SUS** (`gsd-tools query package-legitimacy check` reasons: `unknown-age`, `unknown-downloads`, `no-repository`) | Flagged — planner must add a `checkpoint:human-verify` task before running `npm install -D vitest`, even though this is a widely-known package (manually confirmed to exist on the npm registry via `npm view vitest version` → `4.1.10`, published, peer-compatible) |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `vitest` — the automated legitimacy-check tool could not retrieve age/downloads/repository signals in this run (likely a registry-metadata-endpoint issue in this environment, not evidence of an actual malicious package). `npm view vitest version` independently confirmed the package resolves on the npm registry to `4.1.10` with peer dependencies consistent with this project's Vite version. Per protocol, the SUS verdict from the automated check is preserved and gated behind a human-verify checkpoint rather than silently overridden — this package is entirely optional (only needed if the discretionary unit test is built).

*No packages in this phase were discovered via WebSearch/training data and left unverified — the only new package under consideration (`vitest`) was checked against both the legitimacy seam and a direct registry query.*

## Architecture Patterns

### System Architecture Diagram

```
                     BUILD TIME (Astro SSG)
┌─────────────────────────────────────────────────────────────────┐
│ src/data/fig01.ts (typed facts, each with `source` field)         │
│ src/styles/tokens.css (:root custom properties)                   │
│         │                            │                            │
│         ▼                            ▼                            │
│ Figure01.astro  ──renders──▶  static <figure> markup +            │
│  (canvas, tip div, log div,   bare <script> (Astro bundles        │
│   send/fault <button>s)       src/lib/fig01/*.ts into it)         │
└─────────────────────────────┬──────────────────────────────────┘
                               │  dist/index.html + hashed JS asset
                               ▼
                     RUNTIME (client browser, no server)
┌─────────────────────────────────────────────────────────────────┐
│  page load                                                        │
│    → tokens.ts reads --accent/--good/--amber/--hair via           │
│      getComputedStyle (ONCE, cached)                               │
│    → model.ts builds node/route topology, sets initial state       │
│    → interactions.ts wires: send/fault buttons, canvas             │
│      pointer hover/click, per-node proxy <button>s (keyboard)      │
│    → matchMedia('(prefers-reduced-motion: reduce)') checked         │
│         │                                                          │
│    ┌────┴─────────────────┐                                       │
│    ▼ reduce=false          ▼ reduce=true                          │
│  IntersectionObserver +   render ONE static complete frame         │
│  visibilitychange gate     (no rAF loop started)                   │
│    │                       fault injection still works via         │
│    ▼                       instant state redraw (no animation)     │
│  single rAF loop (render.ts):                                      │
│    clear → draw dot-grid+lens → draw routes → draw/advance          │
│    beams → spawn ambient beam on timer → heal check → draw          │
│    nodes → loop                                                     │
│         │                                                           │
│         ▼                                                           │
│  DOM side-channel writes: tooltip innerHTML, event-log              │
│  prepend (aria-live="polite" region)                                │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── components/
│   └── Figure01.astro          # markup chrome (canvas, buttons, tip, log, caption)
│                                 # + one bare <script> importing lib/fig01/index.ts
├── data/
│   └── fig01.ts                 # typed tooltip facts, each with `source` field
├── lib/
│   └── fig01/
│       ├── index.ts             # public initFig01(root): () => teardown fn
│       ├── model.ts             # topology, route math (pAt/pathTo), beam/fault state
│       ├── render.ts            # rAF loop, drawNode/drawBeam/drawGrid, static-frame render
│       ├── interactions.ts      # pointer hover/click, button wiring, keyboard proxy controls
│       └── tokens.ts            # getComputedStyle reads, cached once at init
└── styles/
    └── tokens.css                # unchanged — already the single color source
```

### Pattern 1: Bare `<script>` tag, not `type="module"` — for Astro bundling to apply

**What:** Astro auto-processes a plain `<script>` tag (no attributes besides an optional `src`) with import bundling and TypeScript compilation, and automatically emits it as `type="module"` in the final HTML. Adding `type="module"` (or any other attribute) yourself **disables** this processing entirely — Astro treats it as `is:inline` and does zero bundling, so `import { initFig01 } from '../lib/fig01'` would not resolve without a bundler.
**When to use:** Always, for `Figure01.astro`'s script tag — this is the mechanism that makes `src/lib/fig01/*.ts` a real bundled/type-checked module rather than a raw unbundled import.
**Confidence:** `[CITED: docs.astro.build/en/guides/client-side-scripts/]` — directly fetched and quoted 2026-07-17: *"Astro will not process a `<script>` tag if it has any attribute other than `src`"* and processed scripts *"become `type=\"module\"` automatically."*

**Example:**
```astro
---
// src/components/Figure01.astro
---
<figure class="fig">
  <!-- ...markup... -->
</figure>
<script>
  import { initFig01 } from '../lib/fig01';
  const root = document.currentScript!.parentElement as HTMLElement;
  initFig01(root);
</script>
```

> **Correction to CONTEXT.md wording:** CONTEXT.md's Architecture section says "one plain `<script type=\"module\">`" — read this as "one script that Astro treats as a module" (the outcome), not literally the `type="module"` HTML attribute (the mechanism). Do not add `type="module"` by hand; leave the tag bare so Astro's own pipeline applies it after bundling.

### Pattern 2: Read tokens once at init, never per-frame

**What:** `getComputedStyle(document.documentElement)` returns a *live* CSSStyleDeclaration, but re-invoking `.getPropertyValue('--accent')` inside the rAF draw loop (60 times/sec) is unnecessary DOM work for values that don't change during a session. Read once in `tokens.ts` at `initFig01()` time into a plain frozen object.
**When to use:** Always — this is the token-drift-prevention pattern from ARCHITECTURE.md Pattern 2, refined with the "read once" performance detail.
**Confidence:** `[CITED: developer.mozilla.org/…/Window/getComputedStyle]` + web synthesis — MEDIUM.

```typescript
// src/lib/fig01/tokens.ts
let cached: Record<string, string> | null = null;

export function getTokens() {
  if (cached) return cached;
  const css = getComputedStyle(document.documentElement);
  cached = {
    accent: css.getPropertyValue('--accent').trim(),
    good: css.getPropertyValue('--good').trim(),
    amber: css.getPropertyValue('--amber').trim(),
    hair: css.getPropertyValue('--hair').trim(),
  };
  return cached;
}
```

### Pattern 3: `prefers-reduced-motion` as a first-class render path, not a flag inside the animated path

**What:** The reference prototype has an `RM` boolean checked in several places (`intro=RM?1e9:0`, spawn gating, breathing-ring math) but it still calls `requestAnimationFrame(frame)` unconditionally — it never fully skips the rAF loop, it just skips *some* motion inside it. FIG-05 requires genuinely no rAF loop under reduced motion: render one static complete frame (all routes drawn at `prog=1`, all nodes placed, no beams) and stop. Fault injection must still work — but as an instant state mutation + a single re-render call (not a loop), with the event log narrating the change.
**When to use:** Structure `render.ts` with two entry points: `renderStaticFrame(state)` (called once, or again after any state mutation under reduced motion) and `startAnimationLoop(state)` (the rAF loop, only started when `!prefersReducedMotion`).
**Confidence:** `[CITED: developer.mozilla.org/…/prefers-reduced-motion]` + web synthesis on the matchMedia+change pattern — MEDIUM.

```typescript
const rm = matchMedia('(prefers-reduced-motion: reduce)');

function applyMotionPreference() {
  stopAnimationLoop();
  if (rm.matches) {
    renderStaticFrame(state); // one full frame, no rAF
  } else {
    startAnimationLoop(state); // normal rAF loop resumes
  }
}

applyMotionPreference();
rm.addEventListener('change', applyMotionPreference);

// fault injection under reduced motion: mutate state, redraw once, log narrates
faultBtn.addEventListener('click', () => {
  injectFault(state); // synchronous state mutation, same model.ts function either way
  if (rm.matches) renderStaticFrame(state); // instant redraw, no self-heal animation—
  // still schedule the ~8s heal via setTimeout (not rAF) so the log narrates recovery
});
```

### Pattern 4: Native `<button>` proxy controls for canvas node keyboard access

**What:** Canvas content is not part of the accessibility tree except for a) fallback content between `<canvas>...</canvas>` tags, or b) attributes on the canvas element itself (`role="img"`, `aria-label`). Neither gives keyboard users access to *individual* nodes' tooltip content. The accepted pattern is a set of real `<button>` elements (visually hidden or visually overlaid at each node's screen position) wired to the same hover/click logic as the canvas pointer handlers — keyboard users tab through them and get native focus rings, Enter/Space activation, and (via `aria-describedby` or inline text) the tooltip content, all without reimplementing focus management by hand.
**When to use:** One proxy `<button>` per node (10 buttons for this topology), positioned absolutely over the stage matching each node's `px`/`py` from `model.ts`'s layout pass, `tabindex="0"` in DOM order (sequential tab order is simplest and satisfies FIG-06's "no keyboard trap" — full roving-tabindex arrow-key nav is a nice-to-have, not required by FIG-06's literal text).
**Confidence:** `[CITED: developer.mozilla.org/…/ARIA/Roles]` + `pauljadam.com/demos/canvas.html` pattern synthesis (multiple corroborating community sources) — MEDIUM.

```html
<div class="fig-stage">
  <canvas role="img" aria-label="Request path through a cellularized region: three clients route through a load balancer to four isolated cells, then to data pipelines and an ML snapshot service."></canvas>
  <div class="tip" id="tip" aria-hidden="true"></div>
  <!-- one per node, positioned via inline style matching node.px/py -->
  <button class="node-proxy" data-node="lb" aria-describedby="tip">elb/weight-away</button>
  <!-- ...remaining 9 nodes... -->
</div>
```

**Don't hand-roll:** avoid a hand-built roving-`tabindex` hit-testing scheme that intercepts arrow keys and manually draws a focus rectangle on the canvas — native buttons give you the browser's own focus ring and tab order for free, which is both less code and more robust across screen readers.

### Pattern 5: Dual-gate rAF lifecycle (IntersectionObserver + visibilitychange)

**What:** `IntersectionObserver` reports scroll position but keeps reporting "intersecting" while a tab is backgrounded (rAF itself is already throttled/paused by the browser in a backgrounded tab, but the loop's own internal timers — beam spawn scheduling, fault heal timers — should also pause explicitly rather than relying on browser throttling alone, which varies by browser). `document.hidden`/`visibilitychange` reports tab-backgrounding but says nothing about scroll position. Gate the loop's *running* state on both: `shouldRun = isIntersecting && !document.hidden`.
**When to use:** Wrap `startAnimationLoop`/`stopAnimationLoop` calls behind a single `updateRunState()` function invoked from both the `IntersectionObserver` callback and the `visibilitychange` listener.
**Confidence:** Web synthesis, corroborated across MDN Intersection Observer docs + community guidance — MEDIUM.

```typescript
let intersecting = false;
const io = new IntersectionObserver(([entry]) => {
  intersecting = entry.isIntersecting;
  updateRunState();
}, { threshold: 0 });
io.observe(stageEl);

document.addEventListener('visibilitychange', updateRunState);

function updateRunState() {
  const shouldRun = intersecting && !document.hidden && !rm.matches;
  if (shouldRun) startAnimationLoop(state);
  else stopAnimationLoop();
}
```

### Pattern 6: HiDPI canvas sizing via ResizeObserver

**What:** Read the CSS box size via `getBoundingClientRect()` (not `canvas.width`/`height`, which are the backing-store size, not layout size), multiply by `min(devicePixelRatio, 2)` for the backing-store dimensions, keep `canvas.style.width`/`height` at the CSS size, and call `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` once per resize so all draw calls afterward use CSS-pixel coordinates (matches the reference prototype's existing `layout()` function almost exactly — the only change is driving it from `ResizeObserver` instead of only `window.addEventListener('resize', layout)`, so container-driven resizes are also caught).
**When to use:** Always for the canvas backing store; already correctly implemented in the reference prototype's `layout()` — port as-is, just swap the trigger to `ResizeObserver`.
**Confidence:** Web synthesis (WebGL/Canvas DPI guidance corroborated across multiple independent sources) — MEDIUM.

```typescript
const ro = new ResizeObserver(() => layout());
ro.observe(stageEl);
// layout() body: unchanged from prototype lines 171-180 — already correct
```

### Anti-Patterns to Avoid

- **Hand-rolling `type="module"` on the Astro script tag:** disables Astro's bundling pipeline entirely — see Pattern 1.
- **Per-frame `getComputedStyle` calls:** unnecessary DOM reads inside a 60fps loop — see Pattern 2.
- **Treating reduced-motion as "run the loop but skip some visual flourishes":** the reference prototype's `RM` flag pattern does exactly this and does NOT satisfy FIG-05 as written (FIG-05 requires no rAF loop at all under reduced motion) — this is the single biggest behavioral gap between the reference implementation and the phase requirements.
- **Relying on IntersectionObserver alone for pause/resume:** misses the backgrounded-tab-but-scrolled-to-figure case — see Pattern 5.
- **Drawing a custom focus indicator on canvas instead of using native `<button>` focus rings:** more code, worse cross-browser/cross-screen-reader behavior — see Pattern 4 / Don't Hand-Roll.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Keyboard access to canvas-drawn nodes | Custom roving-tabindex + hand-drawn focus rectangles on canvas + manual arrow-key nav | Native `<button>` proxy controls per node, sequential tab order | Native elements get focus rings, Enter/Space activation, and AT (assistive technology) semantics for free; a hand-rolled scheme must reimplement all of this and is easy to get subtly wrong (e.g., focus indicator not meeting contrast requirements) |
| Motion-preference detection with live updates | Polling `matchMedia().matches` on a `setInterval`, or checking only once at page load | `matchMedia(query).addEventListener('change', handler)` | The `change` event is the platform-native way to catch a live OS-level toggle; polling wastes cycles and re-checking only once at load misses users who enable reduced-motion mid-session |
| DPR-aware canvas sizing math | A bespoke "is this a retina screen" heuristic (e.g., checking screen.width) | `devicePixelRatio` read directly, capped with `Math.min(dpr, 2)` | `devicePixelRatio` is the standard, already-correct signal; the reference prototype already does this correctly (line 144) — port verbatim |
| Elbow/Manhattan route path math | A generic graph-routing library | The reference prototype's `pAt`/`pathTo` functions (fixed 3-segment elbow: horizontal → vertical → horizontal) | The topology is fixed and small (10 nodes, 12 routes) — a general routing library is unjustified complexity for a closed, hand-tuned layout that's already correct in the prototype |

**Key insight:** every "don't hand-roll" item above is really the same lesson: the reference prototype already solved the *drawing* problems correctly (route math, DPR, beam animation) — port that code as-is. The genuinely new work in this phase is entirely in the *lifecycle and accessibility* layer (reduced motion as a real static path, keyboard proxy controls, visibility-gated rAF) which the prototype does not yet have, and which browser-native APIs (not custom logic) are the right tool for.

## Common Pitfalls

### Pitfall 1: `type="module"` on the Figure01 script tag silently breaks Astro's bundling

**What goes wrong:** `import { initFig01 } from '../lib/fig01'` inside a `<script type="module">` tag works fine in `astro dev` (the browser resolves the bare-looking relative import directly since Vite's dev server serves modules on demand) but may behave differently in ways that don't get Astro's own TypeScript type-checking/bundling pass, and CONTEXT.md's literal wording ("one plain `<script type=\"module\">`") could lead directly to this mistake.
**Why it happens:** The phrase "plain script, module semantics" is ambiguous between "the HTML attribute" and "the resulting behavior" — Astro's own default behavior for a bare script tag already produces `type="module"` output, making the manual attribute redundant and, per official docs, actively harmful (it disables Astro's processing entirely).
**How to avoid:** Use a bare `<script>` tag with no attributes in `Figure01.astro` (see Pattern 1). Verify with `astro build` that `dist/`'s emitted script is bundled/hashed (a single hashed `.js` file, not a raw ES module import graph served unbundled).
**Warning signs:** `astro build` output still references `../lib/fig01` as a literal unresolved path in the built HTML, or TypeScript errors in `src/lib/fig01/*.ts` don't surface during `astro check`.

### Pitfall 2: Reduced-motion branch built as an afterthought loop-flag instead of a real static path

**What goes wrong:** Porting the reference prototype's `RM` variable pattern literally (checked inline in various places, but `requestAnimationFrame(frame)` still called unconditionally) technically "respects" `prefers-reduced-motion` in the sense that intro staging is skipped, but the loop keeps running every frame forever — ambient ellipse ML-node breathing (`Math.sin(T/1200)`) still animates, which is exactly the kind of non-essential motion `prefers-reduced-motion` exists to suppress, and burns CPU/battery the requirement explicitly wants avoided.
**Why it happens:** It's the path of least resistance when porting existing code — the flag already exists in the source material, so it's tempting to just "carry it forward" rather than restructuring around a genuinely separate static-render code path.
**How to avoid:** Structure `render.ts` with an explicit `renderStaticFrame()` function that is NOT part of the rAF loop, and never call `requestAnimationFrame` at all when `matchMedia(...).matches` is true at init (see Pattern 3).
**Warning signs:** DevTools Performance panel shows continuous rAF callback activity even with OS reduced-motion enabled; the ML node's ring is still visibly pulsing under reduced motion.

### Pitfall 3: Fault self-heal timer tied to rAF-driven `performance.now()` comparisons breaks under reduced motion

**What goes wrong:** The reference prototype's heal check (`if(degraded && ts>healT)`) runs inside the rAF loop — if reduced motion means no rAF loop runs, this check never fires, and a fault injected under reduced motion never self-heals or narrates recovery, silently breaking FIG-03/FIG-05's "fault injection still works" requirement.
**Why it happens:** The heal timer is implicitly coupled to the render loop's cadence in the source material; porting it without noticing the coupling carries the bug into the reduced-motion path where there IS no render loop to drive it.
**How to avoid:** Use `setTimeout(() => { healFault(state); renderStaticFrame(state); logRecovery(); }, 8000)` for the heal trigger (decoupled from rAF), used in BOTH the animated and reduced-motion paths — this also simplifies the animated path (no per-frame time comparison needed).
**Warning signs:** Toggle OS reduced-motion, click "inject fault", wait 8+ seconds — if the event log never logs "recovered," this pitfall has been hit.

### Pitfall 4: Strict TypeScript (`astro/tsconfigs/strict`) rejects the prototype's loose JS patterns as-is

**What goes wrong:** The reference prototype is untyped JS with patterns like `nodes[k]` (implicit `any` index access), `document.getElementById('send')` (possibly-null return not checked), and object literals with inconsistent optional fields (`glyph`, `ml`, `cell` present on some nodes, absent on others) — the project's `tsconfig.json` extends `astro/tsconfigs/strict`, which enables `strictNullChecks` and would flag all of these.
**Why it happens:** Porting is often done as a near-literal translation; the type errors only surface when `astro check`/`tsc` actually runs, which may be later than the initial "it renders correctly in the browser" check.
**How to avoid:** Define an explicit discriminated-union or fully-optional interface for `NodeSpec` up front (all node-kind-specific fields as optional, common fields required) so every node literal type-checks without `as any` escapes; null-check every `getElementById`/`querySelector` result before use.
**Warning signs:** `npx astro check` reports errors in `src/lib/fig01/*.ts`; using `!` non-null assertions pervasively in the port is a sign the types weren't modeled up front.

## Runtime State Inventory

Not applicable — this phase is net-new feature construction (porting a prototype into production modules), not a rename/refactor/migration. No existing stored data, live service config, OS-registered state, secrets, or build artifacts reference "fig01" or related identifiers anywhere in this codebase today (confirmed via the Phase 1 file listing already read — `src/lib/`, `src/data/fig01.ts` do not yet exist).

## Code Examples

### Single-rAF driver with delta-time (ported from reference, restructured for lifecycle gating)
```typescript
// src/lib/fig01/render.ts
let rafId: number | null = null;
let last = 0;

function tick(ts: number) {
  const dt = Math.min(ts - last, 50); // clamp to avoid huge jumps after a pause
  last = ts;
  advanceBeams(state, dt);
  drawFrame(ctx, state, ts);
  rafId = requestAnimationFrame(tick);
}

export function startAnimationLoop(s: FigureState) {
  if (rafId !== null) return; // idempotent
  last = performance.now();
  rafId = requestAnimationFrame(tick);
}

export function stopAnimationLoop() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
}
```
Source: restructured from `.planning/reference/prototype-shell-and-fig01.html` lines 232-297, adding explicit start/stop for lifecycle gating (Pattern 5).

### Weight-exclusion logic (pure function, testable in isolation — for the optional unit test)
```typescript
// src/lib/fig01/model.ts
export function healthyCells(cells: string[], degraded: string | null): string[] {
  return cells.filter((c) => c !== degraded);
}

export function pickFaultCell(cells: string[]): string {
  // cell-0 is never eligible for fault injection (matches prototype's `1+Math.floor(Math.random()*3)`)
  const eligible = cells.slice(1);
  return eligible[Math.floor(Math.random() * eligible.length)];
}
```
Source: ported from `.planning/reference/prototype-shell-and-fig01.html` lines 196, 213 — same logic, extracted as named pure functions for testability.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| Single monolithic IIFE mixing model/render/interaction | Split modules (`model.ts`/`render.ts`/`interactions.ts`/`tokens.ts`) behind a bare Astro `<script>` | This phase (porting decision, not an ecosystem shift) | Each concern independently diffable/testable; matches ARCHITECTURE.md's locked module split |
| `prefers-reduced-motion` as an inline flag inside an always-running loop | Fully separate static-render code path, rAF never started when reduced motion is active | This phase (accessibility hardening gap identified during research) | Genuinely stops CPU/battery use under reduced motion, not just "less motion" |
| `window.resize` listener for canvas sizing | `ResizeObserver` on the stage element | Standard practice since ResizeObserver's broad browser support (all evergreen browsers Astro 7 targets) | Catches container-driven resizes (e.g., font-load reflow) that a bare window resize listener misses |

**Deprecated/outdated:** none specific to this domain — Canvas 2D, matchMedia, IntersectionObserver, ResizeObserver are all stable, non-deprecated web platform APIs as of 2026.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | `vitest@4.1.10` is a legitimate, non-slopsquatted package despite the automated legitimacy-check tool returning `SUS` due to a signal-fetch failure in this environment | Package Legitimacy Audit | Low — `vitest` is one of the most widely-used JS test frameworks; the SUS verdict is gated behind a human-verify checkpoint before install regardless, per protocol, so this is a belt-and-suspenders safeguard rather than a blind trust decision |
| A2 | Sequential DOM tab order over per-node proxy `<button>`s satisfies FIG-06's "keyboard-only visitor can operate the figure" requirement, without needing a more elaborate roving-`tabindex` arrow-key scheme | Pattern 4 / FIG-06 | Low-medium — if the user actually wants arrow-key node-to-node navigation (a richer widget pattern, akin to a toolbar/grid ARIA pattern), sequential tab order alone would under-deliver; CONTEXT.md explicitly leaves this to Claude's Discretion ("roving tabindex vs hidden button list"), so this is a discretionary implementation choice, not a verified external fact |

## Open Questions

1. **Should the 10 node proxy buttons be visually present (overlaid, styled to match node positions) or visually hidden (sr-only) with the tooltip driven purely by focus events?**
   - What we know: CONTEXT.md leaves "how node keyboard traversal is implemented" to Claude's Discretion; the reference prototype has no keyboard affordance at all today.
   - What's unclear: whether a visually-present button grid would look "busy" against the "quiet, one-moving-thing" motion doctrine (PITFALLS.md UX section) — an sr-only button with a focus-triggered tooltip (mirroring the existing hover tooltip) likely satisfies both accessibility and visual-restraint constraints simultaneously.
   - Recommendation: implement as visually-hidden (`sr-only`-style) buttons positioned absolutely at each node's coordinates, sized to the node's hit box, so focus + Enter/Space produces the identical tooltip/beam-dispatch behavior as a mouse hover/click — zero visual footprint when not focused, full native semantics when tabbed to.

2. **Does `Figure01.astro`'s script need a teardown/cleanup path (removing the `ResizeObserver`, `IntersectionObserver`, rAF loop, event listeners on unmount)?**
   - What we know: this site does not use Astro's `ClientRouter`/view-transitions (explicitly excluded per REQUIREMENTS.md Out of Scope), so `Figure01.astro`'s script runs exactly once per full page load and the whole document (including all observers/listeners) is torn down by the browser on navigation — no manual cleanup is strictly required.
   - What's unclear: nothing significant — this is a low-risk simplification the plain-MPA architecture already grants.
   - Recommendation: `initFig01()` can still return a teardown function for hygiene/testability (matches ARCHITECTURE.md's documented signature `initFig01(root: HTMLElement): () => void`), but the phase does not need to invoke it anywhere in production code.

## Environment Availability

Not applicable — this phase has no external tool/service dependencies beyond what's already installed (Astro 7, Node ≥22.12, npm, TypeScript — all confirmed present via `package.json`/`npm view` calls during this research session). The only conditionally-needed addition (`vitest`) is covered in Standard Stack/Package Legitimacy Audit above, gated behind discretion + a human-verify checkpoint.

## Security Domain

`security_enforcement` is enabled (`.planning/config.json` → `workflow.security_enforcement: true`, `security_asvs_level: 1`). This phase ships zero backend, zero user-submitted data, and zero authentication — most ASVS categories are not applicable to a static client-side canvas widget.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|-----------------|---------|---------------------|
| V2 Authentication | No | No auth surface anywhere in this site |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | No access-controlled resources |
| V5 Input Validation / Output Encoding | Yes (narrow) | Tooltip content is set via `.innerHTML` in the reference prototype (to render the `<span class="m">` metric highlight) — this is safe ONLY because tooltip strings originate from the phase's own typed `src/data/fig01.ts` module (build-time-authored, not user input); do not extend this pattern to any future user-input-driven content without switching to `.textContent` + manual DOM construction |
| V6 Cryptography | No | No cryptographic operations |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Stored/DOM XSS via tooltip `innerHTML` | Tampering / Information Disclosure | Not exploitable today (content is a closed, developer-authored data module with no user input path) — but flag in code review if `fig01.ts` content is ever sourced from anything other than a hand-authored TypeScript literal (e.g., never wire it to a form, URL param, or external fetch without sanitization) |
| Employer-confidential detail leakage via the "mirrors real AWS work" framing | Information Disclosure | Already addressed at the content level (PITFALLS.md Security Mistakes) — keep Fig. 01's topology/labels abstracted/generalized (`cell-0..3`, `elb/weight-away`) rather than literal internal AWS service names; the reference prototype already follows this discipline, port verbatim |

## Sources

### Primary (HIGH confidence)
- `.planning/reference/prototype-shell-and-fig01.html` — the working reference implementation, read directly in full this session; source of all topology/animation/timing constants cited above

### Secondary (MEDIUM confidence)
- [Scripts and event handling — Astro Docs](https://docs.astro.build/en/guides/client-side-scripts/) — fetched directly 2026-07-17, quoted verbatim on bare-script-vs-`type="module"` bundling behavior
- [Testing — Astro Docs](https://docs.astro.build/en/guides/testing/) — fetched directly 2026-07-17, quoted verbatim on `getViteConfig()` Vitest setup (not zero-config)
- [prefers-reduced-motion — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) — websearch-corroborated, `matchMedia`+`change` pattern
- [Window: getComputedStyle() — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle) — websearch-corroborated, live-object/caching behavior
- [WAI-ARIA Roles — MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles) + [HTML canvas Accessibility — pauljadam.com](https://pauljadam.com/demos/canvas.html) — websearch-corroborated, `role="img"`/native-button-proxy pattern
- [Intersection Observer API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — websearch-corroborated, IO + Page Visibility API combined-gating pattern
- `npm view vitest version` (direct registry query, this session) — `4.1.10`, peer `vite: "^6.0.0 || ^7.0.0 || ^8.0.0"`
- `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`, `.planning/REQUIREMENTS.md`, `.planning/phases/01-foundation-editorial-shell/01-UI-SPEC.md`, current production `src/pages/index.astro` / `src/styles/tokens.css` / `src/components/SiteHeader.astro` / `src/components/SiteFooter.astro` / `src/data/systems.ts` / `src/data/types.ts` / `astro.config.mjs` / `tsconfig.json` — all read directly this session

### Tertiary (LOW confidence)
- None retained without a corroborating MEDIUM+ source — all WebSearch-only findings were either cross-checked against a second source or upgraded via direct `WebFetch` of the primary official doc page.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new runtime dependencies; the one discretionary devDependency (`vitest`) is version-verified against the live npm registry
- Architecture: HIGH — module split is already locked in ARCHITECTURE.md and cross-checked against the actual current `src/` tree (no path aliases configured, root GitHub Pages deploy confirmed, no `base` needed)
- Pitfalls: MEDIUM-HIGH — the four pitfalls documented here are derived from direct comparison of the reference implementation's actual code against the phase's locked accessibility/performance requirements (a structural gap analysis, not speculative), corroborated by official docs and MDN for the underlying API behaviors

**Note on tooling discrepancy:** the project's `classify-confidence` seam returned `LOW` for the `webfetch` provider id (both with and without `--verified`) in this environment, while `websearch --verified` returned `MEDIUM`. Per the skill's own `<source_hierarchy>` definitions, direct fetches of official documentation (`docs.astro.build`) are tagged `[CITED: url]` (defined as MEDIUM confidence) rather than the seam's raw `LOW` output for the `webfetch` provider id, since the seam does not appear to special-case authoritative documentation domains in this run. This is a judgment call, documented here for the planner's awareness, not a silent override.

**Research date:** 2026-07-17
**Valid until:** 30 days (stable web-platform APIs + a locked reference implementation; re-verify `vitest` version if not installed within that window)

---
*Research for: Phase 2 — Fig. 01 Signature Interactive Figure*
*Researched: 2026-07-17*
