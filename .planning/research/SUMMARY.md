# Project Research Summary

**Project:** Prateek Kumar — Portfolio
**Milestone:** v2.0 "Night Sky" — immersive single-viewport re-skin
**Domain:** Persistent canvas night scene (starfield, Milky Way, career constellations, camper silhouette, fireflies) + no-scroll full-viewport panel deck over the shipped v1.0 Astro site
**Researched:** 2026-07-17
**Confidence:** MEDIUM-HIGH overall (Architecture HIGH — grounded in reading shipped source; Milky Way visual technique LOW — needs spike)

## Executive Summary

v2.0 is a **presentation-layer remodel of existing content, not a product rearchitecture**. It transforms the shipped v1.0 portfolio (live Fig. 01 canvas demo, all CV content, Lighthouse ≥90) into an immersive single-viewport experience: a persistent zero-light-pollution night scene with all CV content cycling as full-viewport overlay panels instead of scrolling.

**Core technical challenge:** layering a new persistent, always-on animation surface *alongside* the existing Fig. 01 canvas engine while keeping the Lighthouse ≥90 / 60fps / reduced-motion floors. This is a two-rAF-loop **coordination** problem, not a two-framework problem — resolved by pausing the ambient scene while Fig. 01's panel is active.

**Critical sequencing insight:** the panel-cycling interaction model (wheel/swipe/keys/dots, hash routing, focus management) must be bulletproof *before* visual content is layered on. Half the pitfalls (scroll-hijack disorientation, focus traps, SEO loss) emerge from mechanics, not aesthetics. Build **Mechanics → Canvas Scene → Integration**, not visual-first.

## Key Findings

### Recommended Stack (STACK.md)

- **No new npm dependencies.** Everything achievable with Canvas2D + inline SVG + vanilla TS, extending the proven `src/lib/fig01/` pattern. Optional fallback only: a ~1-2KB simplex-noise package IF the zero-dep Milky Way scatter+gradient technique looks banded (evaluate in a spike first).
- **Layered Canvas2D, split by update frequency:** Layer 0 starfield + Milky Way pre-rendered once to an offscreen canvas and blitted; Layer 1 camper/landscape silhouette as hand-authored SVG + CSS (never in the rAF loop); Layer 2 the only per-frame work (twinkle subset, ~dozens of fireflies, occasional constellation link-firing — reuse fig01's beam math).
- **Deck = hand-rolled index-based state machine** mirroring fig01/interactions.ts patterns (no fullPage.js/swiper/GSAP/three.js — argued against individually); CSS scroll-snap documented as legitimate fallback if the custom controller proves fiddly on real devices.
- Extract shared `getComputedStyle` token logic to `src/lib/shared/css-tokens.ts` for both canvas engines.

### Expected Features (FEATURES.md)

- **Table stakes:** progress indicator (mono index), full input parity (wheel/swipe/keys/dots — all primary, none fallback), escape hatches (working back button, per-panel deep links, no keyboard traps), first-visit affordance, reduced-motion support, full keyboard operability.
- **Differentiators:** constellation brightens with active panel (scene reacts to navigation — the genre standout), neural links firing occasionally, URL hashes for shareability, "view classic" fallback (cheap — reuses v1 shell via progressive enhancement).
- **Anti-features:** aggressive scroll-hijacking fighting native gestures, auto-advancing panels, motion-sickness effects, focus traps, broken back button, preloaders, 3D/WebGL.
- **Sharpest integration risk:** keyboard-namespace collision — Fig. 01 already uses arrow-key semantics for its controls; the deck keymap must resolve against actual fig01 source during planning.

### Architecture Approach (ARCHITECTURE.md — HIGH confidence, read shipped source)

Four load-bearing patterns:
1. **Panel hide via `transform`, never `display:none`** — keeps Fig. 01's IntersectionObserver lifecycle valid with zero changes to must-not-regress code.
2. **CustomEvent contract:** deck dispatches `nightsky:panel-change` on document; constellation layer and scene pause/resume subscribe. `nightsky/*` and `fig01/*` never import each other.
3. **One active animation at a time:** ambient scene rAF pauses entirely while the Fig. 01 panel is active ("one moving thing" doctrine extended to engines).
4. **Progressive enhancement fallback:** base CSS renders panels as the v1 scrolling stack; `.deck-active` class (added only after successful JS init) enables the deck. No /classic route, no duplicate content — the fallback is free.

Components: `NightSky.astro` (canvas host) + `PanelDeck.astro` + thin `Panel.astro` slot-wrapper around UNMODIFIED v1 section components; engine in `src/lib/nightsky/{scene,deck,constellations,tokens}.ts`; constellation definitions as a typed `src/data/constellations.ts` with source-annotated labels.

### Critical Pitfalls (PITFALLS.md — 11 mapped)

1. Scroll-hijack disorientation → all four inputs primary, transition lock, working back button
2. Wheel-delta double-fire (trackpad) vs dead-feel (mouse) → delta accumulation + debounce, cross-device testing
3. Focus traps between panels → `inert` on hidden panels, aria-live announcements
4. Reduced-motion treated as "dimmer" → ambient scene must FULLY STOP to a single static frame (WCAG C39); deck transitions instant
5. Always-on canvas battery drain → static/dynamic layer split, visibility gating, idle CPU <10% sustained
6. TBT/LCP regression from scene init → pre-bake/chunk generation; Lighthouse gate immediately after scene phase
7. GPU overdraw from stacked layers → minimal layer count, no full-repaint gradients per frame
8. Text-over-starfield contrast failures → scrim gradient (~30-40%) verified at WORST-CASE brightness points, not averages
9. SEO/deep-link loss → case studies keep distinct URLs + cold-load; all panel content stays in DOM; sitemap intact
10. iOS edge-swipe collision → vertical swipe axis preferred; real-device testing
11. **v1 regression vector:** Fig. 01 embedded in a hidden-until-active panel can init at 0×0 — wire re-measurement to the visibility hook; re-run the FULL v1 Fig. 01 verification checklist after embedding

## Implications for Roadmap

Three sequential phases (continuing numbering from 4):

1. **Deck Mechanics** — state machine, input parity, hash routing + case-study routing decision, focus management, Fig. 01 keymap resolution, progressive enhancement, first-visit hint. Gate: Lighthouse ≥90 with deck (no scene); real-device input testing.
2. **Night-Sky Scene** — Milky Way spike FIRST (LOW-confidence technique), then layered engine (pre-rendered sky, SVG silhouette, fireflies), constellation graph + panel-reactive brightening via the event contract, reduced-motion full-stop. Gate: idle CPU <10%, contrast ≥4.5:1 at worst-case, Lighthouse ≥90.
3. **Integration & Launch Polish** — Fig. 01 as panel (resize audit + full v1 re-verification), all content layered with scrims, case-study cold-load verified, sitemap/SEO intact, full Lighthouse mobile+desktop, live deploy.

**Gaps to address during planning:** Milky Way spike (2-3h) early in the scene phase; constellation topology/coordinates are content decisions (honesty gate applies to labels); case-study routing architecture must be decided in Mechanics, not Integration; real iPhone/mid-tier-Android testing budgeted.

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Stack | MEDIUM | Proven v1 patterns extended; Milky Way recipe LOW (spike flagged) |
| Features | MEDIUM | NN/g + WCAG cross-corroborated table stakes/anti-features |
| Architecture | HIGH | Read actual shipped source; patterns reuse proven structures |
| Pitfalls | MEDIUM | WCAG primary sources MEDIUM-HIGH; perf budgets illustrative until benchmarked |

## Sources

- `.planning/research/STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, `PITFALLS.md` (v2.0 versions, 2026-07-17 — each carries its own source list: NN/g scrolljacking research, W3C WAI carousel/WCAG 2.3.3/C39, MDN/web.dev canvas + wheel-event docs, WebKit/Chrome DevRel perf guidance, fullPage.js issue tracker, Awwwards-class site survey)
- `.planning/PROJECT.md` v2.0 milestone section (user-locked vision)
- v1.0 research corpus (design language, motion grammar, portfolio genre) remains valid background — archived in git history

---
*Note: assembled by the orchestrator from the synthesizer's inline return (#222 self-heal — the agent fabricated a write restriction instead of writing this file).*
