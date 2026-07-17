# Phase 4: Deck Mechanics - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning
**Source:** v2.0 milestone lock (user-approved vision) + v2.0 research corpus (ARCHITECTURE.md HIGH-confidence patterns)

<domain>
## Phase Boundary

The no-scroll interaction model on the home page, built and verified BEFORE any night-sky visuals exist: a hand-rolled panel-deck state machine wrapping the existing v1 sections as full-viewport panels, with full input parity (wheel/swipe/keyboard/index), hash routing + cold-load, focus management, first-visit hint, "view classic" escape hatch, and the progressive-enhancement fallback. Covers DECK-01..08.

NOT in this phase: the night-sky scene/constellations (Phase 5), Fig. 01 embedded re-verification and the final live Lighthouse gate (Phase 6). The deck ships against the plain v1 background this phase.

</domain>

<decisions>
## Implementation Decisions

### Architecture patterns (LOCKED — from v2.0 ARCHITECTURE.md, HIGH confidence)
- Panels hide via `transform` (translateY) — NEVER `display:none` / `visibility:hidden` / unmounting; all panel content stays in the DOM (SEO + fig01 IntersectionObserver stays valid)
- Progressive enhancement: base CSS = the v1 scrolling stack unchanged; `deck.ts` adds `.deck-active` to a root element ONLY after successful init; all deck layout CSS is scoped under `.deck-active`
- Engine at `src/lib/nightsky/deck.ts` (vanilla TS, mirrors fig01 module conventions: typed state, wire* functions, init returns teardown); component shells `PanelDeck.astro` + thin `Panel.astro` slot wrapper; existing section components pass through UNMODIFIED
- Event contract defined and dispatched NOW: `document.dispatchEvent(new CustomEvent('nightsky:panel-change', { detail: { index, id, total } }))` on every activation — Phase 5 subscribes later; nightsky/* and fig01/* never import each other
- Extract `src/lib/shared/css-tokens.ts` from fig01/tokens.ts generic logic ONLY if deck needs token reads; otherwise defer extraction to Phase 5 (planner's call — don't refactor fig01 gratuitously this phase)

### Input mechanics (LOCKED requirements, research-mandated details)
- Wheel: delta ACCUMULATION against a threshold + transition lock (ignore input while animating) — one physical gesture = exactly one panel on both trackpad (fine deltas, momentum tail) and notched mouse (coarse deltas). Momentum-tail suppression after a fired transition
- Touch: VERTICAL swipe axis (iOS edge-swipe collision avoidance); threshold + velocity check; no preventDefault on horizontal moves
- Keyboard: ArrowUp/Down + PageUp/Down + Home/End move panels; Space NOT hijacked. Ground truth: `src/lib/fig01/interactions.ts` wireKeyboard binds only focus/blur/click on proxy buttons (comment at line ~245 confirms no keydown interception) — verify at planning time and document; if true, arrows are collision-free even when focus is inside Fig. 01's panel. Keys only act when no form/interactive element would consume them
- Progress index: mono index (e.g. `03 / 09`) + jump list — the v1 lowercase-mono idiom, NOT decorative dots; keyboard reachable, current panel aria-current
- First-visit affordance: quiet mono hint (e.g. `scroll · ↓ · swipe`), dismisses on first navigation, remembered via localStorage (no re-nag)

### Routing (DECISION owed this phase — decide in planning, default below)
- Each home panel gets a hash (`#hero`, `#fig-01`, `#systems`, `#experience`, `#patents`, `#skills`, `#contact`); history entries per navigation (pushState), popstate drives the deck; cold-load with a hash jumps directly (no animation) to that panel
- Case studies REMAIN separate Astro routes at /work/* (v1 URLs, SEO intact) reachable via links from the systems panel — they are NOT deck panels; header/footer chrome unchanged there. This is the recommended resolution of the research's open routing question — planner may refine but not silently drop the decision
- "view classic": a quiet mono link (footer or index area) that disables the deck (`.deck-active` removed + preference persisted in localStorage) and restores native scrolling; a matching "deck view" link restores it

### Accessibility (floors)
- Non-active panels get `inert` (+ `aria-hidden`); focus moves to the active panel container (tabindex="-1") on change; `aria-live="polite"` region announces "Panel N of M — {title}"
- `prefers-reduced-motion: reduce` → transitions are INSTANT (no transform animation); everything else identical
- No keyboard traps: Tab order flows within the active panel; Escape never trapped

### Quality gates (this phase)
- `npx astro check` 0 errors; build green; zero hex literals outside tokens.css
- Lighthouse ≥ 90 all categories against a LOCAL preview (`npm run preview` + npx lighthouse against localhost) with the deck active — the live-URL run is Phase 6
- **Do NOT push to origin during this phase** — the live site stays v1 until Phase 6 deploys the complete v2 experience; commits accumulate locally on main
- Cross-device input testing: attempt automated verification (wheel-event simulation in browser tooling if it starts); real-device iPhone/Android testing is flagged as a checklist item that lands with Phase 6's checkpoint if tooling can't cover it — do NOT block Phase 4 on physical devices

### Claude's Discretion
- Exact wheel thresholds/lock duration, transition duration/easing (≤ ~500ms, ease-out per v1 doctrine), hint copy, index placement/styling details, localStorage key names, whether SiteHeader/SiteFooter become fixed chrome now or in Phase 6 (styling-only per research)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/research/ARCHITECTURE.md` (v2.0 — the four locked patterns, component split, build order)
- `.planning/research/PITFALLS.md` (v2.0 — Pitfalls 1-4, 9, 10: wheel normalization, focus management, reduced-motion, SEO/deep-links, iOS swipe)
- `.planning/research/FEATURES.md` (v2.0 — table stakes/anti-features for deck UX)
- `.planning/research/SUMMARY.md` (v2.0 synthesis)
- `src/pages/index.astro` (current composition to wrap)
- `src/lib/fig01/interactions.ts` (keyboard ground truth — wireKeyboard binds focus/blur/click only)
- `src/layouts/BaseLayout.astro`, `src/styles/global.css`, `src/styles/tokens.css` (integration surfaces; token doctrine)
- `.planning/REQUIREMENTS.md` (DECK-01..08 acceptance surface)

</canonical_refs>

<specifics>
## Specific Ideas

- The deck must FEEL premium: measured transitions (single panel slide with subtle fade, ease-out), never rubber-bandy; the v1 "hover ≤150ms, one moving thing" doctrine applies to the transition itself
- Progress index in the lowercase-mono idiom (`04 / 09` + panel names on hover/expand) — consistent with fig-bar styling
- Panel titles for aria-live come from a single typed panel manifest (id, hash, title) that PanelDeck and deck.ts share — one source of truth
- Keep the wheel handler passive:false ONLY on the deck root, not window — don't degrade scroll perf on /work/* routes (deck code must not even load there)

</specifics>

<deferred>
## Deferred Ideas

- Night-sky scene, constellations, event-contract consumers → Phase 5
- Fig. 01 embedded full re-verification, scrim/contrast work, live Lighthouse + deploy → Phase 6
- Panel-aware OG cards → future (OG-02)

</deferred>

---

*Phase: 04-deck-mechanics*
*Context gathered: 2026-07-17 via milestone lock + research corpus*
