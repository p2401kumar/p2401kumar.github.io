# Feature Research

**Domain:** Immersive single-viewport / no-scroll panel-cycling portfolio experience (v2.0 "Night Sky" re-skin of a shipped content-complete portfolio)
**Researched:** 2026-07-17
**Confidence:** MEDIUM (cross-corroborated across 14 web queries covering NN/g usability research, WCAG technique docs, MDN/web.dev, and Awwwards-class example sites; no single authoritative spec exists for "immersive portfolio UX" as a genre — this is practitioner consensus + accessibility standards, not a formal spec. Accessibility sub-claims (WCAG 2.1.2, prefers-reduced-motion) carry higher confidence than aesthetic/genre-convention sub-claims.)

**Scope note:** This file covers ONLY the new v2.0 experience layer (night scene, constellations, panel cycling, orientation/navigation). It does not re-litigate v1 content requirements (bio, systems list, case studies, contact) — those are shipped and validated; see git history for the superseded v1 `FEATURES.md`. All v1 content becomes panel content inside this new shell.

## Feature Landscape

### Table Stakes (Users Expect These)

Features any no-scroll/deck-style immersive site needs. Missing these reads as broken, disorienting, or amateurish — and for this project's task-oriented recruiter/hiring-manager audience, disorientation is punished harder than on an exploratory consumer site.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Visible progress/orientation indicator (dots or index, e.g. "03 / 06") | Full-viewport decks hide the page length that normal scrollbars communicate for free; without an explicit indicator users can't tell how much content exists or where they are — NN/g flags "discoverability" as one of scrolljacking's chief threatened heuristics | LOW | Mono numeric index ("03/06") fits the existing infrastructure-texture type system better than plain dots and doubles as a wayfinding label; dots alone are noted as a weak mobile cue (users often don't notice them) — pair with a numeric/label cue, not dots in isolation |
| Multiple input parity: wheel, touch/swipe, arrow keys, and a clickable index | Users arrive on trackpad, mouse wheel, touchscreen, or keyboard-only — supporting only one channel breaks the experience for a meaningful slice of visitors, and CSS scroll-snap behaves inconsistently across mouse-wheel vs. trackpad, so device-diversity testing matters even after picking a mechanism | MEDIUM | This is the single highest-craft-signal implementation detail in the genre — every award-tier example reviewed treats input parity as non-negotiable, not a stretch goal |
| Escape hatches: browser back/forward works, deep-linkable panels, no dead-end trap | WCAG 2.1.2 "No Keyboard Trap" is Level A — any full-viewport panel/overlay must let keyboard users move focus in and out with standard keys; NN/g's scrolljacking research found altering native navigation "hijacks" a user's sense of control, generating disorientation and eroding trust | MEDIUM | URL hash fragments (`#panel-name`) are the standard static-site-compatible mechanism: `hashchange` event drives the active panel, browser back/forward walks hash history for free, and links become shareable/bookmarkable — zero server routing needed, works on GitHub Pages |
| First-visit "how to navigate" affordance | Users frequently don't realize a page continues or that non-scroll gestures are expected; NN/g homepage-usability guidance: don't rely on users noticing a subtle visual cue with no prompt | LOW | Small, persistent, low-key hint (e.g. a mono caption "scroll / swipe / → to continue") that fades after first interaction — progressive disclosure, not a blocking tutorial modal |
| `prefers-reduced-motion` readable fallback for the entire experience, not just Fig. 01 | This is a carried-forward v1 floor (already a project constraint) but the surface area is much larger in v2 — starfield parallax, constellation-fire animation, panel transition motion, camper glow pulse all need gating, not just the one figure | MEDIUM | CSS media query alone is insufficient: JS-driven motion (rAF loops, Web Animations API, canvas redraws) must independently check `matchMedia('(prefers-reduced-motion: reduce)')` in script; decorative motion (parallax, fireflies, pulse) should simply be disabled, while meaningful motion (constellation brightening on active panel) should become an instant/static state change that still conveys the information |
| Full keyboard operability of panel cycling itself | Same WCAG floor already committed to for Fig. 01 in v1, now extended to the whole shell — arrow/Page-Up-Down keys must cycle panels, Tab must reach in-panel interactive content (including Fig. 01's own keyboard proxies), Escape/clear route back to an index or "classic" view | MEDIUM | Sequencing risk: Fig. 01 already owns arrow-key semantics internally (fault injection proxies) for its own panel — the outer panel-cycling keymap must not collide with Fig. 01's inner keymap when that panel is active (see Feature Dependencies) |
| No loading spinner / preloader gate before first interaction | Preloaders on immersive sites are a well-documented anti-pattern (adds perceived latency, actively fights the project's Lighthouse ≥90 / fast-load constraint, and the whole genre exists specifically to avoid "wait for the experience" friction) | LOW | Progressive/streamed initial paint: render the static night scene immediately, then layer in canvas starfield/constellation rendering — never block first paint on JS init |
| Mobile parity, not a degraded mobile mode | A meaningful share of recruiter link-forwarding traffic is mobile; the genre's award-tier examples all treat mobile swipe as first-class, not an afterthought — 44-48px minimum tap targets with adequate spacing, visible tappable alternative to any swipe-only gesture | MEDIUM | Reuse v1's already-proven responsive floor (360px→desktop); the new risk is specifically canvas performance on mobile GPUs and touch-vs-scroll gesture conflicts (native page pull-to-refresh/bounce fighting a custom swipe handler) |

### Differentiators (Competitive Advantage)

Features that make the night-sky re-skin distinctive within the genre, not merely competent. Should align with Core Value ("this person operates at our level") — these are where craft becomes visible.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Constellation brightening tied to active panel | Ties the ambient scene directly to navigation state rather than leaving it as disconnected decoration — the scene *responds*, which is the difference between "pretty background" and "designed system." Award-tier immersive sites (Bruno Simon, Active Theory) share this pattern of the environment reacting to navigation, just in a 3D-game idiom rather than a 2D-canvas one | MEDIUM | Implement as a state-driven visual diff (brighten star/link opacity+glow for the constellation matching the active panel's career chapter) rather than a full redraw; gate the brighten transition (not just the idle firefly/parallax motion) behind `prefers-reduced-motion` with an instant-swap fallback |
| Subtle neural links firing quietly between constellation nodes | Reinforces the "distributed systems engineer" thesis ambiently (nodes + links = literal systems diagram made celestial) without being a literal HUD/graph gimmick — matches the project's existing "one signature motion metaphor" doctrine from v1 (Fig. 01) extended to the whole scene | HIGH | Motion-doctrine risk: v1's locked doctrine is "one moving thing per viewport" — idle link-firing must stay extremely sparse/slow so it doesn't compete with Fig. 01's beam animation when that panel is active, or with the constellation-brighten transition during panel changes |
| Panel-aware URL hashes for shareability | Lets a recruiter/hiring manager share a direct link to, e.g., the DynamoDB case-study panel, not just the homepage — differentiator because most immersive/deck-style sites in the genre skip this (WebGL/3D-world sites like Bruno Simon's have no equivalent concept of a "panel" to link to) | LOW-MEDIUM | Straightforward given the table-stakes hash-routing requirement above — this is really "table stakes done well" more than a separate feature; treat implementation as one unit with the escape-hatch requirement |
| Parallax depth on the starfield (subtle, layered) | Cheap way to sell "this is a real 3D-feeling night sky, not a flat wallpaper" — layered star-density planes moving at different rates on pointer/scroll input is a well-worn but still-effective depth cue | LOW-MEDIUM | Must be disabled entirely (not reduced) under `prefers-reduced-motion` — parallax is specifically named in accessibility research as harmful to users with vestibular disorders, not merely a nice-to-disable |
| "View classic" link to a static/linear fallback of the same content | Directly answers the task-oriented-user tolerance problem NN/g's scrolljacking research surfaces: recruiters scanning for a specific fact (e.g. "does he have AWS experience") are exactly the population shown to have the least patience for guided/gated navigation | LOW | This is a genuinely differentiating choice, not table stakes, because most immersive portfolios in the genre don't offer it — for this project specifically, v1's shipped editorial shell already exists and can be repurposed as exactly this fallback view, which is close to free given the codebase state |

### Anti-Features (Commonly Requested, Often Problematic)

Features that look appealing for an immersive night-sky deck but create real problems for this project's audience and constraints. Extends the project's existing Out of Scope guardrails into the v2 experience layer specifically.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Aggressive scroll-hijacking (overriding native scroll speed/direction/easing) | Feels like the "premium" immersive feel seen on flashy agency sites | NN/g usability research found the majority of study participants experienced disorientation from altered scroll behavior, with some believing it was a bug; it actively threatens user control, discoverability, and task success — and this project's audience is disproportionately task-oriented (recruiters scanning for facts under time pressure), the exact population shown to tolerate it least | Panel cycling via discrete, intentional inputs (wheel-tick-to-advance, explicit swipe, arrow key, dot/index click) rather than continuous scroll-speed manipulation — advance one panel per gesture, don't remap the scroll axis itself |
| Auto-advancing panels/text (timed carousel behavior) | Feels dynamic, "keeps itself moving," reduces perceived empty/idle state | Removes user control entirely (worse than scrolljacking, which at least responds to input); a recruiter mid-read on a case-study panel having it auto-advance away is a directly hostile UX failure, and it's explicitly called out as bad practice for content-heavy carousels generally | User-driven advancement only; if an idle/ambient state is wanted, animate the *background scene* (fireflies, subtle link-fire) while leaving panel content fully static and user-controlled |
| Motion-sickness-triggering effects: aggressive parallax, screen-shake, fast camera-style pans, spinning transitions | Feels cinematic, "wows" on first view | Parallax and vestibular-triggering motion are specifically named in accessibility literature as harmful, not just an accessibility nice-to-have to reduce — and this sits directly on top of the project's already-committed `prefers-reduced-motion` floor, so shipping it un-gated would be a regression against an existing constraint | Slow, subtle, low-amplitude motion by default (twinkle, slow drift, sparse firefly movement); reserve any stronger transition for panel-change moments only, always gated, always with an instant-cut fallback |
| Trapping keyboard focus inside the deck / no way to Tab to browser chrome | Feels like it "protects" the immersive experience from users leaving the flow | WCAG 2.1.2 No Keyboard Trap is a Level A violation if done wrong — keyboard failures already account for ~15-20% of typical WCAG violations sitewide, and this is one of the most common regression points specifically introduced by custom full-screen-panel navigation | Standard modal-dialog focus pattern only where a true overlay exists (e.g. a lightbox); for the primary panel-cycling shell itself, focus should move predictably with panel changes but never trap — Escape/Tab must always reach a way out |
| Breaking the browser back button (panels not represented in history/URL) | Simpler to implement — just swap DOM content on gesture, ignore routing | Silently breaks one of the most fundamental web affordances users rely on; combined with scrolljacking-style disorientation this compounds into "the page feels broken," which is punished harder than a plain, unstyled page would be for this audience | Hash-based routing (`#panel-name`) as already scoped in Table Stakes — cheap, static-site-compatible, and turns "back button" into a free feature rather than a liability |
| Loading spinner / intro preloader before the scene is interactive | Feels like it "sets the mood" for an immersive reveal, common on agency showcase sites | Directly fights the project's Lighthouse ≥90 / fast-load constraint and this genre's own best examples avoid it; a delayed-gratification intro reads as vanity for a résumé-adjacent site where the audience wants information fast, not a mood piece | Static night-scene base paints immediately (near-zero-cost SVG/CSS gradient sky + stars); canvas-driven starfield/constellation detail layers in progressively without blocking interaction |
| Full 3D/WebGL world navigation (Bruno-Simon-style drivable/explorable scene) | The most impressive example in the genre, tempting to emulate directly | Radically higher implementation cost (physics engine, 3D asset pipeline, WebGL competency) for a static GitHub-Pages-hosted single-contributor résumé site; also actively works against the project's locked "vanilla TS/canvas, no framework runtime" stack constraint and its recruiter-scanning-for-facts audience, who need panel content to be fast and legible, not explorable | 2D canvas starfield/constellation scene as designed (dense stars, Milky Way band, camper silhouette) with panel content as flat overlays — keep the "systems" metaphor (nodes + links) but render it in the same 2D canvas engine already proven in Fig. 01, not a new 3D stack |
| Skip/auto-continue "connecting the dots" narrative sequencing that forces panel order | Feels like it tells a better "story" (chapter 1 → chapter 2 → ...) | Contradicts the escape-hatch requirement above and the demonstrated tolerance gap for task-oriented users; a hiring manager who wants the DynamoDB case study specifically should not be forced through Microsoft/Samsung panels first | Free-order panel index/dots + direct deep links to any panel; use *visual* career-chronology cues (constellation layout, panel order in the default index) to imply a story without enforcing it as a gate |

## Feature Dependencies

```
Panel-cycling shell (wheel/swipe/keys/dots)
    └──requires──> URL hash routing (#panel-name) for back-button + deep-link escape hatch
    └──requires──> prefers-reduced-motion gating extended beyond Fig. 01 to the whole shell
    └──requires──> Keyboard-input namespace negotiation with Fig. 01's existing keyboard proxies
                       └──conflicts-if-unhandled──> Fig. 01's fault-injection arrow-key controls (v1) when Fig. 01 is the active panel

Constellation brighten-on-active-panel
    └──requires──> Panel-cycling shell's active-panel state (single source of truth for "current panel")
    └──requires──> prefers-reduced-motion instant-swap fallback (brighten becomes a static state, not an animated transition)
    └──enhances──> Core Value ("operates at our level") — environment responding to navigation reads as designed, not decorative

Neural links firing (idle ambient motion)
    └──requires──> Motion budget discipline (v1's "one moving thing per viewport" doctrine)
    └──conflicts-if-unbudgeted──> Fig. 01's beam animation and the constellation-brighten transition, if all three run simultaneously at full intensity

Canvas starfield + parallax + fireflies
    └──requires──> requestAnimationFrame-driven render loop with layer separation (static star cache vs. dynamic firefly/glow layer)
    └──requires──> DPR cap + batched draws (already an existing v1/Fig.01 performance constraint, now applied scene-wide)
    └──conflicts-if-unbudgeted──> Lighthouse ≥90 / 60fps floor if the scene-wide canvas competes with Fig. 01's own canvas budget when both are visible simultaneously

"View classic" static fallback link
    └──requires──> v1's existing editorial shell content (already built — this is largely a repurposing, not new content work)
    └──enhances──> Escape-hatch requirement and task-oriented-user tolerance (NN/g finding)

Anti-feature: scroll-hijacking (continuous scroll remap) ──conflicts──> Panel-cycling shell (discrete, input-parity design)
Anti-feature: 3D/WebGL world ──conflicts──> Stack constraint (vanilla TS/canvas, no framework runtime) and existing Fig. 01 investment
```

### Dependency Notes

- **Panel-cycling shell requires hash routing before it can ship responsibly:** without it, browser back/forward and shareable deep links silently break — this is a correctness requirement, not a polish item, and should be built in the same phase as the panel mechanism itself, not bolted on after.
- **Keyboard-namespace negotiation with Fig. 01 is the sharpest new integration risk in this milestone:** v1 shipped Fig. 01 with its own keyboard proxies (send request / inject fault) as a documented accessibility floor. The outer shell's panel-cycling keymap (likely arrow keys / Page Up-Down) must either (a) only intercept panel-navigation keys when focus is *not* inside Fig. 01's canvas/controls, or (b) use a distinct keymap for panel-cycling (e.g. bracket keys or explicit next/prev buttons) so the two never collide. Flag this for deeper phase-specific research — it's exactly the kind of interaction-design edge case generic web research won't fully resolve; it needs to be worked out against the actual Fig. 01 code.
- **Motion budget is a scene-wide constraint, not a per-feature one:** v1 already committed to "one moving thing per viewport" for Fig. 01 alone. v2 introduces at least three more potential motion sources (starfield parallax/twinkle, firefly drift, neural-link firing, constellation-brighten transitions) that now share the same viewport as Fig. 01 when its panel is active. Treat this as a single design budget to allocate across all motion sources, not five independent decisions — likely resolution is: ambient scene motion is always slow/sparse/low-amplitude, and it visually recedes (dims/pauses) rather than competing whenever a panel's own content motion (like Fig. 01's beams) is active.
- **"View classic" is nearly free given existing v1 investment:** because the entire v1 editorial shell already exists and is content-complete, this differentiator is much cheaper for this project specifically than it would be for a greenfield immersive site — strongly recommend keeping it in scope rather than treating it as a stretch goal.
- **Canvas performance budget is scene-wide, echoing the motion-budget note:** v1's Fig. 01 already holds a 60fps/DPR-cap/batched-draw floor for its own canvas. v2 adds a second, larger, always-visible canvas (the night scene) that now renders concurrently with Fig. 01's canvas whenever that panel is shown. Layer separation (static starfield cached/offscreen, only the dynamic layer redrawn per frame) is the standard mitigation and should be treated as required, not an optimization to defer.

## MVP Definition

### Launch With (v1 of this milestone — the "Night Sky" release)

Minimum viable version of the experience layer — matches PROJECT.md's Active requirements; research did not surface a table-stakes item missing from that list, but did surface implementation-order dependencies worth calling out explicitly.

- [ ] Persistent night scene base layer (dark ground, starfield, Milky Way, camper silhouette + glow) painting immediately on load, no preloader
- [ ] Panel-cycling shell with input parity (wheel, touch/swipe, arrow keys) and a clickable numeric/index orientation indicator
- [ ] URL hash routing per panel (deep-linkable, browser back/forward intact)
- [ ] Full keyboard operability of panel cycling with an explicit, documented resolution for the Fig. 01 keyboard-namespace conflict
- [ ] First-visit navigation affordance (fades after first interaction)
- [ ] Constellations with active-panel brightening, budgeted against Fig. 01's existing motion allowance
- [ ] `prefers-reduced-motion` gating extended across every new motion source (parallax, fireflies, link-firing, brighten transitions), not just Fig. 01
- [ ] All v1 content (systems, experience, patents, skills, contact, résumé link, both case studies) present as panels with no content loss
- [ ] Fig. 01 embedded as its own panel with v1's interaction/a11y floors intact
- [ ] Mobile parity: touch targets, swipe gesture with visible alternative, canvas performance validated on a mid-tier mobile GPU
- [ ] Lighthouse ≥90 maintained across all categories on the new shell

### Add After Validation (v1.x of this milestone)

- [ ] "View classic" static fallback link surfaced prominently (reusing the existing v1 editorial shell) — recommend including at launch given near-zero incremental cost, but sequence after the core deck if time-constrained
- [ ] Panel-aware Open Graph previews (share a specific case-study panel with a matching preview), if per-panel sharing turns out to matter beyond the base hash-routing requirement

### Future Consideration (beyond this milestone)

- [ ] Neural-link firing patterns that vary by career narrative (e.g., links fire in a path tracing career progression) — defer until the base brighten-on-active-panel mechanic is proven not to compete with Fig. 01's own motion
- [ ] Deeper parallax/depth layering beyond a single subtle layer — defer until base performance budget (scene canvas + Fig. 01 canvas concurrently) is validated on real mobile hardware
- [ ] Full 3D/WebGL scene upgrade — explicitly out of scope; conflicts with locked stack constraint (see Anti-Features)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Panel-cycling shell w/ input parity | HIGH | HIGH | P1 |
| URL hash routing / deep links / back button | HIGH | LOW-MEDIUM | P1 |
| Orientation indicator (numeric index) | HIGH | LOW | P1 |
| Keyboard operability + Fig. 01 namespace resolution | HIGH | MEDIUM-HIGH | P1 |
| prefers-reduced-motion scene-wide gating | HIGH | MEDIUM | P1 |
| Night scene base layer (starfield, Milky Way, camper) | HIGH | MEDIUM | P1 |
| First-visit navigation hint | MEDIUM | LOW | P1 |
| Constellation brighten-on-active-panel | HIGH (core differentiator) | MEDIUM | P1 |
| Mobile touch parity + canvas perf validation | HIGH | MEDIUM | P1 |
| Neural links firing (idle ambient) | MEDIUM | HIGH | P2 |
| Subtle parallax depth | MEDIUM | LOW-MEDIUM | P2 |
| "View classic" fallback link | MEDIUM-HIGH (cheap given v1 reuse) | LOW | P2 |
| Panel-aware OG previews | LOW-MEDIUM | MEDIUM | P3 |
| Full 3D/WebGL upgrade | LOW (conflicts with constraints) | VERY HIGH | Rejected |

**Priority key:**
- P1: Must have for this milestone's launch
- P2: Should have, add when possible within the milestone
- P3: Nice to have, likely deferred past this milestone

## Competitor Feature Analysis

| Feature | Award-tier immersive/3D sites (Bruno Simon, Active Theory, OHZI, Obys) | Typical scrollytelling/narrative sites (Apple product pages, agency case studies) | Our Approach |
|---------|---------------------------------------------------------------------|-------------------------------------------------------------------------------------|--------------|
| Navigation mechanism | Full 3D world exploration (drive/fly), near-zero HTML chrome, in-world affordances (floor tiles, walls) | Scroll-position-driven section transitions ("sticky" sections with an internal 0→1 progress value) rather than literal scroll-speed hijacking; native scroll preserved | Discrete panel-cycling via wheel-tick/swipe/key/dot-click — closer to a "deck" than either scroll-driven storytelling or full 3D exploration, chosen for stack-constraint fit (2D canvas, no WebGL) and task-oriented-user tolerance |
| Orientation cue | Minimal/none (in-world visual landmarks substitute) | Often none explicit — relies on section pacing/length and occasional page controls; not consistently dot-based even on flagship examples | Explicit numeric index + clickable dots, prioritizing recruiter/hiring-manager orientation needs over pure aesthetic minimalism |
| Escape hatch | None typically offered — the 3D world *is* the site | Standard browser scroll/back always available since native scroll isn't hijacked | Deep-linkable hash-routed panels + a "view classic" static fallback — stronger escape-hatch commitment than either comparison class, driven by this project's task-oriented audience |
| Ambient/environment reactivity | Environment often static backdrop to the interactive foreground (Bruno Simon's world doesn't change based on "progress") | Rare — sections are typically independent, not cumulative/reactive to a persistent scene | Constellation brighten-on-active-panel makes the persistent scene state-reactive to navigation — a meaningful differentiator versus both comparison classes |
| Implementation stack | WebGL/Three.js, often a physics engine | CSS/JS scroll-timeline techniques, sometimes GSAP ScrollTrigger-class libraries | 2D canvas (proven in Fig. 01), vanilla TS, no new runtime dependency — deliberately narrower stack than either comparison class per locked project constraints |

## Sources

- [Best Scroll Websites — Awwwards](https://www.awwwards.com/websites/scrolling/)
- [Immersive Website Examples 2026: A Curated Breakdown](https://metabole.studio/en/blog/immersive-website-examples)
- [Bruno Simon Portfolio Case Study — Awwwards](https://www.awwwards.com/brunos-portfolio-case-study.html)
- [Bruno Simon Portfolio Case Study — Medium](https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b)
- [Scrolljacking 101 — Nielsen Norman Group](https://www.nngroup.com/articles/scrolljacking-101/)
- [Scrolljacking and Accessibility: Are we Breaking the Web? — SitePoint](https://www.sitepoint.com/scrolljacking-accessibility/)
- [Avoid scrolljacking — Webflow Accessibility Checklist](https://webflow.com/accessibility/checklist/task/avoid-scrolljacking)
- [Scrollytelling: complete guide for premium narrative websites — Metabole](https://metabole.studio/en/blog/scrollytelling)
- [Carousel Usability: Designing an Effective UI for Websites with Content Overload — Nielsen Norman Group](https://www.nngroup.com/articles/designing-effective-carousels/)
- [Keyboard Navigation Patterns for Complex Widgets — UXPin](https://www.uxpin.com/studio/blog/keyboard-navigation-patterns-complex-widgets/)
- [How Keyboard Traps Impact Web Accessibility — The A11Y Collective](https://www.a11y-collective.com/blog/keyboard-trap/)
- [WCAG 2.1.2: Allow keyboard users to move focus freely](https://wcag.dock.codes/documentation/wcag212/)
- [The 2025 TestParty Guide to WCAG 2.1.2 – No Keyboard Trap](https://testparty.ai/blog/wcag-2-1-2-no-keyboard-trap-2025-guide)
- [Design accessible animation and movement with code examples — Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)
- [C39: Using the CSS prefers-reduced-motion query to prevent motion — W3C WAI](https://www.w3.org/WAI/WCAG22/Techniques/css/C39)
- [prefers-reduced-motion: Sometimes less movement is more — web.dev](https://web.dev/articles/prefers-reduced-motion)
- [Respecting Users' Motion Preferences — Smashing Magazine](https://www.smashingmagazine.com/2021/10/respecting-users-motion-preferences/)
- [fullPage.js Best Alternatives — Alvaro Trigo's Blog](https://alvarotrigo.com/blog/fullpage-best-alternative/)
- [How to Make Snapping Scroll Sections with CSS Scroll-Snap — Isotropic](https://isotropic.co/css-scroll-snap-tutorial/)
- [5 Touch-Friendly Navigation Design Tips For Mobile Success](https://williamsmedia.co/touch-friendly-navigation-design)
- [Mobile Navigation Design: 8 Types, Examples & Best Practices — UXPin](https://www.uxpin.com/studio/blog/mobile-navigation-examples/)
- [Using Hashed vs. Non-Hashed URL Paths in Single Page Apps — Bits and Pieces](https://blog.bitsrc.io/using-hashed-vs-nonhashed-url-paths-in-single-page-apps-a66234cefc96)
- [Efficient Animations with requestAnimationFrame — Treehouse Blog](https://blog.teamtreehouse.com/efficient-animations-with-requestanimationframe)
- [Optimising a canvas animation — Remy Sharp](https://remysharp.com/2015/07/13/optimising-a-canvas-animation)
- [HTML5 Canvas Optimize Animation Performance — Konva docs](https://konvajs.org/docs/performance/Optimize_Animation.html)
- [Astro Kit NASA UI/UX Design Case Study — Fuselab Creative](https://fuselabcreative.com/our-projects/astro-kit/)
- [Figures in the Sky — Visual Cinnamon](https://www.visualcinnamon.com/portfolio/figures-in-the-stars/)
- [113 Design Guidelines for Homepage Usability — Nielsen Norman Group](https://www.nngroup.com/articles/113-design-guidelines-homepage-usability/)
- [Learning from Apple - Scrolling Website Interface — Black Raven](https://blackraven.digital/learning-from-apple-scrolling-website-interface/)
- Prior project research corpus referenced in PROJECT.md (v1): 4-agent parallel research on AI-infra design language, devtools motion grammar, elite engineer portfolios, canvas technique catalog — carried forward as background context for motion-doctrine consistency

---
*Feature research for: Immersive single-viewport night-sky portfolio experience layer (v2.0 milestone)*
*Researched: 2026-07-17*
