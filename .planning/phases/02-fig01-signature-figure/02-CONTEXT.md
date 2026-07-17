# Phase 2: Fig. 01 — Signature Interactive Figure - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning
**Source:** Session design lock (the user approved the live prototype; Phase 2 ports its canvas figure to production)

<domain>
## Phase Boundary

Port the approved prototype's interactive canvas figure into the production site as a modular vanilla-TS engine, inserted between Hero and SystemsList on the home page (the `<!-- Fig. 01 slot — Phase 2 -->` placeholder in `src/pages/index.astro`). Covers FIG-01..FIG-07.

NOT in this phase: case studies, OG/sitemap, formal Lighthouse gate (Phase 3 — but FIG-07's perf floor applies NOW: the figure must not tank the page).

</domain>

<decisions>
## Implementation Decisions

### Reference implementation (LOCKED — do not regress behavior)
`.planning/reference/prototype-shell-and-fig01.html` contains the working figure as a single IIFE. Its BEHAVIOR is the contract; its structure is not. Port it into modules with identical visible behavior:
- Topology: 3 client devices → `elb/weight-away` → 4 cells (`cell-0..3`) → `data-pipelines` → `ml/snapshots`
- Elbow-routed 1px hairline paths (Manhattan routing, rounded corners), dot-grid substrate with cursor lens
- Staggered dependency-order build-in on load (nodes fade+rise ~60ms stagger, routes draw-on ~55ms stagger)
- Ambient request beams: one spawns every ~2.6–4.0s; beam = 70px gradient tail + 2.2px head, speed ~0.22 px/ms; path client → LB → weighted healthy cell → pipelines → ML
- `send request` button + clicking any node dispatches a beam; node glow on beam arrival (decay ×0.955/frame)
- `inject fault`: random cell among 1–3 degrades — amber, dashed border (dashed = unhealthy grammar), status dot amber; routing weights exclude it; event log narrates (`cell-N fault injected → weighed away · traffic rerouting · p99 stable`); self-heals after ~8s (`recovered · weight restored`); button disabled while degraded
- Hover tooltips with REAL production facts; ML node breathes (soft ring, ~1200ms period)
- Figure chrome: fig-bar (`fig. 01 — request path through a cellularized region · live` + two buttons), canvas ~380px (300px ≤640px), event log (max 2 lines, newest first, timestamped America/Los_Angeles), caption line

### Architecture (from ARCHITECTURE.md — LOCKED)
- `src/lib/fig01/model.ts` (topology, state, weights), `render.ts` (canvas drawing), `interactions.ts` (pointer/keyboard/buttons/tooltip), `tokens.ts` (reads colors at runtime via `getComputedStyle` from tokens.css custom properties — NEVER duplicate hex literals)
- `src/components/Figure01.astro` — markup chrome + one plain `<script type="module">`; NO framework island, NO client: directives
- Tooltip and event log are HTML overlays (crisper than canvas text), positioned relative to the figure stage
- Facts/metrics shown in tooltips come from a typed data module with `source` fields (extend `src/data/` — e.g. `fig01.ts`), consistent with the CONT-07 honesty gate. Numbers allowed: +30% reliability, −20% p99 (cellularization); 90% capacity ops automated (weight-away); info-theory snapshots (Azure); SmartThings/Galaxy S21 (clients). No invented telemetry.

### Accessibility floor (REQUIREMENTS FIG-05/06 — build WITH the animation, not after)
- `prefers-reduced-motion: reduce` → NO rAF loop: render one complete static frame (all routes drawn, nodes placed); `send request` becomes a no-op or instant-glow; `inject fault` still works via instant state redraw + event log narration (the informative content survives)
- Keyboard: both buttons are real `<button>`s with visible focus rings (already the pattern); add a roving-focus or sequential tab order over canvas nodes exposing each node's tooltip content (visually-hidden text or a focus-following HTML tooltip); event log wrapped in `aria-live="polite"`; no keyboard trap
- Canvas gets `role="img"` + `aria-label` describing the figure; the interactive semantics live in the HTML controls

### Performance floor (FIG-07)
- Single rAF loop; DPR cap 2; batched path strokes; no `ctx.shadowBlur` (layered strokes/gradients only — already the prototype's approach)
- Pause the loop when `document.hidden` and when the figure is fully offscreen (IntersectionObserver) — battery/perf hygiene
- 60fps target on average laptops; the page with figure active must not fall below Lighthouse 90 Performance (formal audit is Phase 3; smoke-check now with a local Lighthouse run if convenient)

### Claude's Discretion
- Exact module boundaries within `src/lib/fig01/`, TS types for nodes/beams/state, IntersectionObserver thresholds, tooltip positioning math, how node keyboard traversal is implemented (buttons list vs roving tabindex), whether to add a tiny unit test for the weight-exclusion logic

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/reference/prototype-shell-and-fig01.html` — reference implementation (the `<script>` IIFE: model/render/interaction logic to port; the `.fig` CSS chrome already partially exists in the shell)
- `.planning/research/ARCHITECTURE.md` — fig01 module split + token-drift anti-pattern
- `.planning/research/PITFALLS.md` — canvas perf pitfalls (single rAF, DPR cap, reduced-motion as content)
- `.planning/phases/01-foundation-editorial-shell/01-UI-SPEC.md` — `--amber` reserved for fault states (Phase 2 uses it now); accent budget rules
- `src/pages/index.astro` — the Fig. 01 slot placeholder between Hero and SystemsList
- `src/styles/tokens.css` — the only color source (read via getComputedStyle)
- `.planning/REQUIREMENTS.md` — FIG-01..07 acceptance surface

</canonical_refs>

<specifics>
## Specific Ideas

- Event-log timestamps use the same Intl America/Los_Angeles pattern as the footer clock (consistency)
- Fault injection picks among cells 1–3 (never cell-0) — matches prototype
- Keep the figure's visual weight subordinate to the hero: it sits in the page flow, framed with the same hairline border/radius idiom as other panels
- The `· live` label in the fig-bar is honest: the figure IS live (simulation of the pattern he shipped, labeled as such in the caption — "The pattern I shipped at AWS…")

</specifics>

<deferred>
## Deferred Ideas

- Formal Lighthouse ≥90 audit + OG image (possibly featuring the figure) → Phase 3
- In-browser visual QA residual from Phase 1 (CLS/glyph/clock) → Phase 3 polish pass
- Any Fig. 01 variants (trace view, status view) → /craft experiments, v2

</deferred>

---

*Phase: 02-fig01-signature-figure*
*Context gathered: 2026-07-17 via session design lock*
