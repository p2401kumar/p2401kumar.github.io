# Pitfalls Research

**Domain:** No-scroll immersive deck (full-viewport panel cycling) over a persistent ambient canvas scene, added to an existing Astro + GitHub Pages portfolio that must hold Lighthouse ≥90 and its accessibility/honesty floors
**Milestone:** v2.0 "Night Sky"
**Researched:** 2026-07-17
**Confidence:** MEDIUM (web-sourced across 13 independent queries; several claims cross-verified against W3C WAI/WCAG primary sources and Chrome DevRel docs — those are treated as higher confidence; general blog-sourced UX/perf claims are directionally solid but not independently benchmarked against this specific codebase)

## Critical Pitfalls

### Pitfall 1: Scroll-hijacking breaks the mental model native scroll gives users for free

**What goes wrong:**
Replacing native page scroll with a JS-driven panel cycler (wheel → `preventDefault()` → programmatic panel change) severs the tight coupling users expect between physical scroll input and on-screen motion. Nielsen Norman Group's usability study found the *majority* of participants experienced at least mild disorientation from scrolljacking, and some read the altered behavior as a bug rather than a feature. Trackpad users in particular expect continuous, momentum-based motion; a hijacked deck instead jumps in discrete steps, which reads as broken or laggy the first time it's used — exactly the "seconds to judge credibility" window this site is optimizing for (per PROJECT.md Core Value). This is a **known, cited failure mode of exactly the fullPage.js-style pattern this milestone is adopting**, not a hypothetical.

**Why it happens:**
Developers build and test the deck with one input device (usually a mouse wheel on a desktop dev machine) and never validate trackpad momentum, touch swipe, or reduced-DPI displays before shipping. The library-free custom implementation this project will need (no fullPage.js dependency, since it must stay a static Astro build with no added runtime) makes it easy to under-invest in gesture normalization compared to a battle-tested library.

**How to avoid:**
- Keep the panel transition instantaneous-feeling and forgiving: one clean wheel/swipe "tick" of intent-threshold crossing should equal one panel change, not a proportional scrub — don't try to fake momentum physics.
- Always provide **non-scroll affordances that are equally primary**, not fallback: visible dot/tab indicators (click-to-jump), arrow-key support, and on-screen prev/next controls — so a user who is confused by wheel behavior has an obvious, discoverable alternative within view (per PROJECT.md's own stated "wheel/swipe/keys/dots" requirement — this pitfall is *why* all four channels are non-negotiable, not decorative extras).
- Test explicitly on a trackpad (Mac and Windows precision touchpad) in addition to a mouse wheel before calling the deck feature done — this is the single most under-tested input path historically.
- Never trap the user with no visible way out: the dots/URL/keyboard-escape must always be reachable, and native browser zoom/find-in-page must keep working.

**Warning signs:**
First-time users pause or scroll-then-stop-then-scroll-again when they hit the deck (visible in session recordings/QA); moving between panels feels like it "took two tries"; anyone testing exclusively with a mouse wheel signs off, then trackpad testing surfaces double-fires or missed panels (see Pitfall 2).

**Phase to address:**
Deck mechanics phase (the phase implementing wheel/swipe/keys/dots panel cycling) — this is the foundational interaction and must be validated across input devices before any content or canvas work is layered on top.

---

### Pitfall 2: Wheel-delta is not normalized across devices — naive "one wheel event = one panel" logic double-fires or feels dead

**What goes wrong:**
`wheel` event `deltaY` values are wildly different across input hardware and OS: a physical mouse wheel typically fires large, discrete steps (historically ±120 per notch on Windows); a trackpad emits many small continuous deltas per physical gesture, with OS-level acceleration baked in on macOS. Code that maps "any wheel event past 0" directly to "advance one panel" will skip 2-3 panels on a single fast trackpad swipe, or feel completely unresponsive to a light mouse-wheel nudge — a direct, common implementation bug in every from-scratch scroll-hijack build.

**Why it happens:**
The `WheelEvent` spec doesn't normalize magnitude across devices/browsers by design (`deltaMode` distinguishes pixel/line/page but not the underlying accumulation behavior), so any naive `element.addEventListener('wheel', e => e.deltaY > 0 ? next() : prev())` is a footgun that appears to work fine on the developer's own trackpad and then misbehaves for a large fraction of real visitors.

**How to avoid:**
- Accumulate `deltaY` across a short time window (e.g., a rolling buffer or simple debounce, ~120-150ms) and only trigger a panel change once the accumulated magnitude crosses a threshold, then reset the accumulator and lock input briefly (e.g., 400-600ms) so a single gesture can't fire multiple panel changes.
- Treat `deltaMode` (pixel vs. line vs. page) explicitly rather than assuming raw magnitude is comparable across devices.
- Debounce/lock during the panel transition animation itself (ignore new wheel events while a transition is in flight) — this is the second half of the same fix and prevents "queued" transitions from feeling out of control.
- Test with an actual physical mouse wheel *and* a trackpad, not just one — this pitfall is invisible if only one input device is used during development.

**Warning signs:**
QA on a trackpad skips panels or lands two panels ahead of intent; QA on a mouse feels sluggish/unresponsive requiring multiple scroll nudges per panel; rapid scrolling queues up a stack of transitions that plays out after the user has stopped scrolling.

**Phase to address:**
Deck mechanics phase, same as Pitfall 1 — implement delta accumulation + transition-lock as part of the initial wheel handler, not as a bug-fix pass after QA finds it.

---

### Pitfall 3: Deck traps keyboard focus, or panel changes don't move focus/announce to screen readers — a known accessibility critique of fullPage.js-style sites

**What goes wrong:**
Two opposite failure modes, both common: (a) focus gets silently left on an element that's no longer visible after a panel change (a screen-reader or keyboard user tabs and hears/sees nothing relevant, effectively trapped mid-deck with no orientation), or (b) an over-eager fix yanks focus to the new panel's first element on every transition, which is jarring for keyboard/screen-reader users navigating deliberately and violates the W3C carousel-pattern guidance that panel controls should **not** move focus away from the control that triggered the change. This class of full-viewport "presentation" site (fullPage.js and its clones) is specifically and repeatedly criticized in accessibility literature for exactly this failure — interfering with assistive technology and creating unpredictable navigation for users with motor or cognitive disabilities.

**Why it happens:**
Full-viewport panel patterns are visually validated (does it look right?) far more often than they're keyboard/screen-reader tested; "make Tab still work" is treated as good enough without auditing what's actually focusable when a panel is hidden (still in the DOM but visually off-screen) versus what a screen reader announces on transition.

**How to avoid:**
- Off-screen panels must be `inert` (or `aria-hidden="true"` + `tabindex="-1"` on all their focusable descendants) so Tab order only ever includes the currently visible panel plus the deck's own navigation controls (dots/arrows) — never let a hidden panel's links/buttons receive focus.
- Do **not** force-move focus into the new panel's content on every automatic/wheel-triggered transition (per W3C WAI carousel guidance) — reserve explicit focus moves for direct user activation of a nav control (e.g., clicking a dot or pressing a "jump to panel" link), where moving focus to the new panel's heading is expected and helpful.
- Add a visually-hidden `aria-live="polite"` status region that announces "Panel x of y: [name]" on every transition, so screen-reader users get equivalent orientation to the sighted dot-indicator without requiring focus to move.
- Ensure `:focus-visible` styling remains visible against the starfield/canvas background at all times (see Pitfall 8) — a correct-but-invisible focus ring is functionally the same as no focus management.
- Verify Fig. 01's existing v1.0 keyboard-proxy interactions (already shipped, must not regress per PROJECT.md) still work identically now that Fig. 01 is itself one panel among several, including its own internal Tab order interacting correctly with the deck's outer Tab order.

**Warning signs:**
Tabbing through the page reaches an interactive element that isn't visible on screen; a screen reader announces content from a panel that isn't currently showing; VoiceOver/NVDA testing produces no announcement at all when panels change; focus ring appears to vanish against the night-sky background.

**Phase to address:**
Deck mechanics phase for the inert/focus-trap fix (structural, must be right from the first implementation); Accessibility/QA verification phase for the live-region announcement and full screen-reader pass (NVDA + VoiceOver at minimum) before ship.

---

### Pitfall 4: `prefers-reduced-motion` treated as "slow the starfield down" instead of "here is the equivalent content, statically"

**What goes wrong:**
This project's own v1.0 doctrine already got this half right for Fig. 01 (`prefers-reduced-motion` → static diagram), but v2.0 adds two *new* motion-heavy surfaces that need the same discipline: (a) the panel-to-panel transition itself, and (b) the always-on ambient canvas scene (twinkling stars, firefly drift, neural-link pulses, camper glow). The generic mistake is implementing reduced-motion as "make the animation slower/subtler" rather than "remove non-essential motion and keep only what conveys information." WCAG's own framing (Success Criterion 2.3.3 / technique C39) is explicit: motion that is *decorative* (parallax, ambient background movement, hover flourishes) must be fully removable via the media query; only motion that is *essential to the information being conveyed* may remain. For this milestone specifically: scroll-snap-driven panel transitions must switch from a mandatory, animated snap to an optional/instant one under reduced motion (the documented WCAG technique C39 pattern: `scroll-snap-type: y mandatory` → `y proximity` or none), and the ambient scene (stars twinkling, fireflies drifting, neural links firing) is squarely "decorative background movement" that must be fully stillable, not just dimmed.

**Why it happens:**
Ambient/background motion is exactly the kind of animation developers are proudest of and most reluctant to fully disable — the instinct is to "just reduce the intensity" rather than genuinely stop it, because a fully static night sky feels like a downgrade of the hero feature. But partial motion still triggers vestibular/migraine symptoms in sensitive users; the WCAG bar is "stopped," not "calmer."

**How to avoid:**
- Branch, don't dampen: on `matchMedia('(prefers-reduced-motion: reduce)').matches`, stop the ambient scene's continuous animation loop entirely (stars render once, statically bright; no firefly drift; no neural-link pulse) rather than reducing amplitude/speed. A single static starfield frame is still the "hero" visually — it's just not moving.
- Apply the WCAG C39 scroll-snap technique for the deck itself: reduced motion should make panel-to-panel movement instant (or a simple crossfade with no transform/scroll animation) rather than an eased slide/scroll.
- Listen for the media query's `change` event (as v1.0 already established for Fig. 01) so a user who toggles the OS setting mid-session gets an immediate, correct response — don't only check once on load.
- Explicitly decide, and document, which motion in the deck is "essential" (e.g., the active panel's constellation brightening — arguably essential, it's the wayfinding cue for "where am I") versus "decorative" (ambient twinkle, firefly drift, neural-link firing) — essential wayfinding motion can stay in reduced form (e.g., an instant highlight instead of a fade), decorative motion must fully stop.
- Re-verify Fig. 01's existing reduced-motion static-diagram path still triggers correctly now that Fig. 01 is a panel embedded in a larger reduced-motion-aware page, not a standalone component.

**Warning signs:**
Reduced-motion testing (OS accessibility toggle or Chrome DevTools emulation) still shows twinkling/drifting/pulsing at a lower intensity rather than a genuinely still scene; panel transitions still animate/scroll under reduced motion instead of jumping instantly; a user with the OS setting on reports the site still feels "busy."

**Phase to address:**
Canvas scene phase (ambient animation loop's reduced-motion branch) and Deck mechanics phase (scroll-snap/transition reduced-motion branch) — both need the branch built in from first implementation, verified together in the Accessibility/QA phase.

---

### Pitfall 5: Always-on canvas scene keeps a CPU core (and the device) busy indefinitely, tanking battery life and thermal headroom on laptops/phones

**What goes wrong:**
Unlike Fig. 01 (a bounded, mostly-idle diagram that only animates on interaction), the v2.0 night-sky scene is explicitly described as *persistent* — stars, Milky Way, fireflies, neural links are meant to be always rendering in the background across every panel, for the entire time a visitor has the tab open. Canvas 2D rendering runs on the CPU; a continuously-redrawing canvas keeps a power-hungry core awake and prevents the browser/OS from entering low-power idle states, which drains laptop battery and heats up phones even though nothing the user is "doing" changes. Recommended budgets from performance research: web animations should stay under ~30% CPU on desktop and ~20% on mobile to avoid overheating/battery complaints — an always-on multi-layer starfield-plus-fireflies-plus-neural-links scene is a realistic way to blow that budget if every element redraws every frame.

**Why it happens:**
"Ambient scene that's always alive" is the entire creative premise of this milestone, so there's a natural pull to keep everything moving continuously rather than asking which elements actually need to animate every frame versus rarely. Combined with the deck's multiple panels each potentially wanting their own visual embellishments layered over the same canvas, per-frame cost compounds quickly.

**How to avoid:**
- Separate the scene into static and dynamic layers, same principle v1.0 already applied to Fig. 01: a **static** starfield/Milky Way layer drawn once (or on resize only) to an offscreen canvas/bitmap and composited cheaply, versus a **sparse dynamic** layer for the few things that truly need per-frame updates (firefly positions, occasional neural-link pulse, the single warm glow's subtle flicker) — most individual stars should never be redrawn once placed.
- Gate the whole scene on `document.visibilitychange`/tab focus (pause the loop when the tab is backgrounded — rAF already pauses on hidden tabs natively, but any `setInterval`-based twinkle timer will not, so audit for stray timers) and on `IntersectionObserver` if the scene can ever scroll out of view.
- Throttle the "occasional" effects (neural-link pulse firing, firefly repositioning) to genuinely occasional — e.g., driven by `setTimeout`-scheduled sparse events rather than a per-frame probability check inside the main rAF loop, so the steady-state per-frame cost is dominated by cheap compositing, not recomputation.
- Keep a hard DPR cap (2, matching the existing Fig. 01 constraint in PROJECT.md) applied to the scene canvas too — a night sky with hundreds of star points at DPR 3-4 on a modern phone multiplies fill cost for no visible gain.
- Budget-test explicitly: leave the site open and idle for 5+ minutes on a mid-range laptop and a mid-range phone, watch CPU% in Activity Monitor/Task Manager and battery drain, not just DevTools' instantaneous FPS counter — sustained idle cost is the actual risk here, not peak frame time.

**Warning signs:**
Fan noise or thermal throttling with the tab open and idle (no interaction); DevTools Performance panel shows continuous main-thread scripting activity every frame even when the visible panel hasn't changed; a laptop's battery estimate visibly drops faster with the tab open in the background than with it closed; mobile Safari/Chrome shows the page as a top battery consumer in OS-level battery reports during manual testing.

**Phase to address:**
Canvas scene phase — layer the static/dynamic split and visibility gating into the scene's first implementation, not as a later optimization. Re-verify with real idle-CPU measurement in the Accessibility/QA or Polish phase, the same way Fig. 01's performance was re-verified in v1.0.

---

### Pitfall 6: Canvas scene initialization and per-panel content mounting create a Total Blocking Time / LCP regression that silently breaks the ≥90 Lighthouse floor

**What goes wrong:**
Two distinct Lighthouse-metric risks are new in v2.0, both absent from v1.0's simpler scroll page:
1. **TBT (Total Blocking Time):** Lighthouse counts any task over 50ms between First Contentful Paint and Time to Interactive as a "long task," summing the over-50ms portion as blocking time, and flags pages with more than ~4s of cumulative main-thread work. A synchronous procedural starfield generator (placing hundreds/thousands of stars, building a Milky Way density field, laying out constellation node/edge graphs) running once on page load is precisely this kind of long task if it isn't chunked.
2. **LCP (Largest Contentful Paint):** with all v1 content now floating as overlay panels *above* the canvas scene, the LCP element is likely still the hero panel's text (as in v1.0) — but if the deck's JS must fully initialize (measure viewport, compute panel positions, wire up wheel/touch listeners) before the first panel is allowed to paint or become interactive, that adds sequential work before LCP fires, unlike v1.0's simple static-first-paint page.

**Why it happens:**
Procedural generation code is usually written for visual correctness first (does the starfield look dense and realistic?) without profiling; a single `for` loop placing 2,000 stars with per-star trig/gradient calculations can easily blow past 50ms on a mid-tier device, and it's invisible on a fast dev machine where the same loop finishes in a few milliseconds.

**How to avoid:**
- Pre-generate the static starfield/Milky Way layout at build time if possible (a deterministic seeded random placement baked into a data file or pre-rendered bitmap shipped as a static asset) rather than computing it from scratch in the browser on every page load — this converts a runtime cost into a one-time build cost.
- If runtime generation is required (e.g., to vary per viewport size), chunk it: generate stars in batches across multiple animation frames or via `requestIdleCallback` rather than one synchronous loop, so no single task exceeds ~50ms.
- Ensure the first visible panel (hero) can paint and become interactive independent of the ambient scene's full readiness — the scene can visually "fill in" a frame or two later without blocking LCP/TBT, since it's the background, not the LCP element.
- Keep deck initialization (wheel/touch/keyboard listener wiring, panel position math) cheap and synchronous-fast; defer anything not needed for the first paint.
- Run Lighthouse (mobile *and* desktop presets) after the canvas scene and deck mechanics both land, the same discipline v1.0 already established for Fig. 01 — bisect TBT/LCP regressions by testing immediately before/after each addition rather than only at the end of the milestone.

**Warning signs:**
Lighthouse TBT score regresses specifically after the scene or deck lands (compare before/after); DevTools Performance panel shows a single long yellow (scripting) block near page load; visible delay between white/blank page and the hero panel's text appearing, especially on mobile throttled CPU simulation.

**Phase to address:**
Canvas scene phase (generation chunking/pre-baking) and Deck mechanics phase (init-cost budget) — both need a Lighthouse checkpoint before the milestone's final QA/Polish phase, mirroring v1.0's own "measure Lighthouse after Fig. 01 lands" practice.

---

### Pitfall 7: Compositing multiple canvas/DOM layers (scene canvas + overlay panels + Fig. 01's own canvas) causes GPU overdraw that hits mobile fill-rate/thermal limits

**What goes wrong:**
v2.0 stacks more rendering layers than v1.0 ever had at once: the persistent ambient scene canvas, semi-transparent scrim/overlay layers for text readability (Pitfall 8), the active content panel's DOM, and — when that panel is Fig. 01 — a *second* canvas rendering context, all potentially overlapping and blending on every composited frame. Each additional overlapping layer adds real compositing cost (roughly 0.3-1.5ms per layer depending on size/blend mode in general web-performance guidance), and mobile GPUs have dramatically lower fill-rate, memory-bandwidth, and thermal budgets than desktop GPUs — overdraw (the GPU repeatedly shading pixels that get covered by something else in the same frame) eats that budget fast and is a well-documented mobile performance killer once layer count and blend-mode use (transparency, blur, glow) climbs.

**Why it happens:**
Each visual want (a subtle glow, a scrim gradient, a soft blur on inactive panels) is usually added independently and looks fine in isolation on a desktop GPU; the cumulative cost of several semi-transparent/blurred layers stacked simultaneously only shows up on lower-end mobile GPUs, which desktop-first development rarely tests against.

**How to avoid:**
- Minimize the number of simultaneously-composited transparent/blurred layers: prefer baking the scrim into the same canvas draw as the scene (or a single flat CSS gradient with no blur) rather than stacking multiple independent `backdrop-filter`/`box-shadow`-glow DOM layers on top of the canvas.
- Avoid full-viewport blur/glow effects (e.g., a soft `filter: blur()` glow around the camper) recomputed every frame — bake soft glows into a pre-rendered sprite/gradient asset instead of a live CSS/canvas blur filter, since full-screen blur is one of the most expensive GPU operations per pixel.
- Keep Fig. 01's own canvas and the ambient scene canvas from needing to composite simultaneously where possible — if Fig. 01 is its own panel, consider whether the ambient scene canvas needs to keep rendering at full fidelity underneath an opaque or near-opaque Fig. 01 panel, versus pausing/simplifying while Fig. 01 is active.
- Test on an actual mid/low-tier Android phone (not just an iPhone or desktop Chrome device-emulation), since mobile GPU headroom varies far more widely than desktop — device emulation in DevTools does not simulate real GPU fill-rate limits.

**Warning signs:**
Frame rate drops specifically when a scrim/glow-heavy panel is active versus a plain-text panel; Android mid-tier device testing shows visible jank or heat that desktop/iPhone testing didn't surface; Chrome's "Rendering" DevTools overlay (paint flashing / layer borders) shows large overlapping composited regions.

**Phase to address:**
Canvas scene phase (layer/scrim architecture decision) and Visual polish phase (glow/blur effect implementation) — the layering *strategy* must be decided before individual glow/scrim effects are built per-panel, or each effect will be added independently without anyone accounting for cumulative cost.

---

### Pitfall 8: Text floating over a starfield fails WCAG contrast at the "worst-case" point even though it looks fine in isolated review

**What goes wrong:**
A "zero-light-pollution" starfield is, by design, visually busy and high-contrast in patches (bright Milky Way band, individual bright stars, the warm camper glow) — exactly the kind of background that can pass a contrast check against an *average* sampled pixel while failing badly wherever body text happens to overlap a bright star cluster or the Milky Way band. WCAG 1.4.3 requires 4.5:1 for normal text and 3:1 for large text measured against the actual background behind it, not an average; a starfield's whole aesthetic point (varying brightness, a dense Milky Way, a glowing highlight) is in direct tension with guaranteeing that ratio everywhere the deck's floating text panels can appear.

**Why it happens:**
Contrast is usually checked once, against one reference screenshot, during design review — not against every possible pan/zoom/panel position where the actual live starfield could render behind live text, especially if star placement has any randomization or the scene is not pixel-identical across viewport sizes.

**How to avoid:**
- Use a scrim (a semi-transparent dark gradient/panel) behind every text block that floats over the scene — the standard, well-established accessible technique for text-over-imagery — sized and opacity-tuned (commonly ~30-40% dark overlay for light text) so contrast holds at the busiest realistic point behind it, not just the average.
- Constrain where text panels are allowed to sit relative to the scene's brightest features (Milky Way band, camper glow) — e.g., reserve a deliberately calmer/darker region of the composition for panel text, rather than letting text float anywhere over a uniformly busy sky.
- Verify contrast programmatically against the actual rendered pixels behind text (screenshot + contrast-checker tool) rather than trusting a single Figma/mockup check, since canvas output at runtime can differ from a static design comp.
- Keep the scrim itself reduced-motion- and Lighthouse-cheap: a flat gradient (canvas-drawn or CSS `linear-gradient`) rather than a live blur filter satisfies both the accessibility need and the overdraw concern from Pitfall 7.
- Re-test contrast whenever star density, Milky Way opacity, or panel copy length changes — this is a floor that can silently regress with unrelated content or visual tuning changes later in the milestone.

**Warning signs:**
Automated contrast tooling (axe, Lighthouse a11y audit) flags text-over-canvas elements as insufficient contrast; text is legible in a calm region of the sky but hard to read when a panel happens to sit over a bright cluster or the Milky Way band; Lighthouse accessibility score regresses below 90 specifically after the night-sky scene lands, breaking the "floors carried forward" requirement in PROJECT.md.

**Phase to address:**
Canvas scene / visual design phase (scrim strategy baked into the composition, not bolted on after) — verified in the same Accessibility/QA pass that re-checks Lighthouse ≥90 across all categories before ship.

---

### Pitfall 9: Single-viewport deck hides all content from search engines and removes deep-linkability, undermining SEO/discoverability that v1.0 already earned

**What goes wrong:**
v1.0 shipped real per-page URLs, a 3-URL sitemap, and OG/meta tags — all of which depend on content being reachable as distinct, crawlable, linkable HTML. A no-scroll deck where all panels live in one DOM behind JS-driven visibility/transform state removes the thing search crawlers and shared links both rely on: content behind click/scroll/wheel interaction is not something crawlers act on (crawlers don't scroll or click), and many non-Google crawlers (including a growing share of AI-driven search/answer engines) don't execute JavaScript at all. If the case studies (currently their own routed pages in v1.0) become deck panels reachable only via in-page navigation with no distinct URL, they risk becoming invisible to search and unshareable via direct link — a real regression from v1.0's shipped SEO floor, not just a hypothetical.

**Why it happens:**
"No-scroll panel cycling" is easy to interpret as "everything lives at one URL now," especially since the creative premise (a persistent ambient scene) suggests a single continuous canvas experience — but that's a UI/interaction decision, not a URL-architecture decision, and the two get conflated without deliberate separation.

**How to avoid:**
- Keep all panel content present in the initial static HTML output (Astro's static build already does this by default — don't let it regress into client-fetched/lazy-injected panel content) so crawlers see full text even without executing JS or interacting with the deck.
- Preserve or extend real, distinct URLs per meaningfully-linkable destination — at minimum the two existing case-study routes (per PROJECT.md's "case studies reachable" requirement) should keep working as directly-linkable, directly-crawlable pages, whether they render as their own route that happens to open in "panel mode" when arrived at from the deck, or the deck syncs `history.pushState` per panel to a real URL fragment/path that also works as a cold-load entry point.
- On cold-load of a deep link (e.g., landing directly on the DynamoDB case-study panel URL from a shared link or search result), the deck must render that panel's content immediately/statically — not require the user to first land on panel 1 and manually navigate there.
- Keep the sitemap listing every independently-URLed piece of content (mirroring v1.0's 3-URL sitemap, extended for whatever new distinct routes v2.0 introduces), and confirm each sitemap URL actually 200s and contains its content without requiring interaction.
- Spot-check with "view source" / a JS-disabled fetch (`curl`, or Chrome's "disable JavaScript" dev setting) on each important URL post-deploy — if the content isn't there without JS execution, most non-Google crawlers won't see it either.

**Warning signs:**
Case-study content only exists inside a JS-toggled panel with no unique URL; `curl`ing a page or viewing page source shows a shell with no visible text content; Google Search Console (or a `site:` search) shows fewer indexed pages after the redesign than before; a shared link to a specific case study lands on the deck's first panel instead of the intended one.

**Phase to address:**
Deck mechanics phase (URL/history architecture decision must be made alongside panel-cycling implementation, not retrofitted) — verified against the sitemap/SEO floor in the same Accessibility/QA or Polish phase that re-checks Lighthouse SEO category ≥90.

---

### Pitfall 10: Touch-swipe panel navigation collides with iOS Safari's edge-swipe "go back" gesture

**What goes wrong:**
On iOS Safari, a horizontal swipe starting near the left edge of the screen is the system gesture for browser back navigation — the exact same physical gesture that a naturally-designed horizontal (or diagonally-interpretable) swipe-to-advance deck would want to claim for panel navigation. This is a documented, repeatedly-hit real-world conflict for any full-width swipeable UI on iOS (well-known e-commerce carousel case studies report users accidentally leaving the page mid-interaction). Since this milestone's requirement explicitly includes swipe as one of the four panel-advance channels (wheel/swipe/keys/dots per PROJECT.md), this is a directly applicable risk, not a tangential one.

**Why it happens:**
The conflict is invisible on desktop (no edge-swipe gesture exists) and invisible in Android/Chrome testing (different gesture system), so it's easy to ship a swipe implementation that's only validated on non-iOS devices, or on an iOS simulator without physical edge-swipe testing.

**How to avoid:**
- If panel navigation is oriented so swipes are interpreted as vertical (matching the wheel-driven "scroll" metaphor, which is the natural fit for a no-scroll *page* deck) rather than horizontal, this conflict mostly disappears — vertical swipe doesn't compete with iOS's horizontal back-gesture. This is the simplest structural fix and worth deciding deliberately (vertical swipe = panel advance, matching wheel direction) rather than defaulting to horizontal swipe cards.
- If any horizontal swipe interaction exists (e.g., within a panel, or if panel order is ever presented horizontally), avoid claiming the full screen width for it — leave a safe margin near the left edge that doesn't intercept touch, matching the documented mitigation other sites use.
- Test on a real physical iPhone (not just simulator) with actual edge-swipe gestures before considering swipe navigation done — simulator touch events don't always reproduce the OS-level gesture-priority conflict.
- Always keep wheel/keys/dots as equally functional alternatives (already required) so an iOS user who accidentally triggers back navigation, or who avoids swipe entirely after one bad experience, isn't stuck — this doubles as the safety net for Pitfall 1's trap-avoidance requirement.

**Warning signs:**
Testing on a real iPhone shows swipe gestures near the screen edge occasionally navigate back to the previous page/site instead of changing panels; user reports of "the site kicked me back to Google" on mobile.

**Phase to address:**
Deck mechanics phase — the swipe-axis decision (vertical vs. horizontal) should be made as part of the initial gesture design, validated on real iOS hardware before ship.

---

### Pitfall 11: v1.0 shipped assets regress silently — Fig. 01's double-rAF/init pattern, design tokens, and case-study routes are easy to break while retrofitting a deck around them

**What goes wrong:**
PROJECT.md is explicit that v1.0's Fig. 01 interactions, the locked design-token system, and the case-study routes must not regress. Three concrete regression paths are specific to *this* milestone's mechanics: (1) Fig. 01's existing canvas init/resize logic (built assuming it's a normal in-flow page element with its own scroll-based visibility) may assume it's always in the DOM and visible, or may run its resize/DPR-detection logic once on load — if Fig. 01 becomes a deck panel that mounts/unmounts or is hidden via `display:none`/`transform` rather than natural document flow, canvas size detection (`getBoundingClientRect`, `ResizeObserver`) can silently return 0×0 or stale dimensions when the panel isn't yet visible, breaking the DPR-capped, single-rAF-loop pattern that was carefully tuned in v1.0; (2) design tokens (the graphite/copper palette, motion doctrine's "one moving thing per viewport" rule) are easy to drift from once a second, much busier animated surface (the ambient scene) is introduced alongside them — the "one moving thing" rule was written for a scrolling page with one Fig. 01, not a page with a permanently-animating background *plus* per-panel content; (3) the two existing case-study routes need a clear answer for how they behave in the new deck-based navigation model (Pitfall 9) — if that answer isn't explicit, they're the most likely thing to break or become orphaned mid-implementation.

**Why it happens:**
Retrofitting a new interaction/rendering model (deck + persistent canvas) around code that was written for a simpler model (scrolling page, occasional canvas) is exactly the kind of change where implicit assumptions ("this element is always visible," "this is the only thing moving," "these routes work like normal pages") silently break, because the original code never had to defend those assumptions explicitly.

**How to avoid:**
- Audit Fig. 01's init/resize code specifically for assumptions about always being visible/in-flow before building the deck; if Fig. 01 becomes hidden-until-active as a deck panel, wire its canvas sizing to re-measure (or lazily initialize) on becoming visible, using `IntersectionObserver` or an explicit "panel became active" hook rather than assuming `getBoundingClientRect` is meaningful while hidden.
- Re-run the full v1.0 Fig. 01 interaction/verification pass (fault injection → weigh-away → self-heal, hover facts, reduced-motion static path, keyboard proxies, 60fps floor) once it's embedded as a panel, not just once in isolation — the deck's own event handling (wheel/keys) could conflict with Fig. 01's own internal keyboard proxies if both listen globally.
- Explicitly reconcile the "one moving thing per viewport" motion doctrine with the new reality of an always-animating background: either formally amend the doctrine (e.g., "one moving *foreground* thing, ambient background scene explicitly exempted") or scope it per-layer, but don't leave it ambiguous — design review needs a clear rule to enforce.
- Decide and document the case-study route/URL strategy (see Pitfall 9) as part of the deck's information architecture before content work begins, so it's a designed decision rather than something discovered mid-build.
- Keep the locked design tokens (`#0f1216`, `#d99163`, etc.) as the single source of truth for both the deck's UI chrome and the night-sky palette — verify the new copper/graphite-adjacent night-sky colors (deep sky blues/purples, warm camper glow) are deliberately harmonized with, not just adjacent to, the existing token system, so the two visual systems (editorial shell tokens vs. night-sky illustration palette) don't visibly clash.

**Warning signs:**
Fig. 01 renders at 0-size or blank the first time its panel becomes active, then fixes itself on window resize; Fig. 01's keyboard shortcuts fire the deck's panel-change instead (or vice versa) when a user is inside the Fig. 01 panel; a design review flags that the page now has three or four things moving simultaneously (ambient scene + panel transition + Fig. 01 + hover states) with no stated rule for it; a case-study link from an external source (résumé, LinkedIn) 404s or lands on the wrong panel after the deck ships.

**Phase to address:**
Integration/regression-check phase (whichever phase embeds Fig. 01 as a deck panel) for the canvas-visibility fix and keyboard-conflict check; Design-system reconciliation should happen early (Scene/visual-design phase) before the ambient scene's palette and motion are finalized; case-study routing should be decided in the Deck mechanics phase per Pitfall 9.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| Naive one-wheel-event-equals-one-panel logic without delta accumulation/lock | Fast to prototype the deck feel | Double-fires on trackpads, feels dead on mice, discovered late unless tested on both input types | Never for shipped code; fine for a throwaway feel-prototype |
| Reducing (not removing) ambient scene motion under `prefers-reduced-motion` | Avoids "boring" fully-static night sky during design iteration | Fails WCAG 2.3.3 intent (decorative motion must be removable, not just dimmed), risks vestibular-trigger complaints | Never for shipped code |
| Runtime-only starfield/constellation generation with no build-time pre-bake or chunking | Simpler code, one code path for all viewport sizes | Long synchronous main-thread task regresses TBT/LCP, breaks the Lighthouse ≥90 floor | Acceptable only during early visual prototyping; must be chunked or pre-baked before the Lighthouse gate |
| Leaving case-study routing undecided until content/deck integration | Lets deck mechanics and content work proceed in parallel without blocking on a decision | Case studies become orphaned or unlinkable, regressing v1.0's shipped SEO floor | Never — decide the URL/routing model before content integration begins |
| Horizontal-first swipe gesture design without checking iOS edge-back conflict | Feels like the "obvious" carousel-native gesture | Real iOS users accidentally navigate away mid-session | Acceptable only if immediately followed by real-device iOS testing before ship, and margin/vertical-axis mitigation applied |
| Stacking scrim + blur + glow as independent DOM/CSS layers instead of a single baked layer | Faster to iterate visually per-effect in isolation | Cumulative GPU overdraw hurts mobile frame rate/battery, invisible until real mid-tier Android testing | Acceptable only for early visual exploration; must be consolidated before performance verification |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|--------------|------------------|--------------------|
| Deck ↔ Fig. 01 (existing v1.0 canvas panel) | Assuming Fig. 01's resize/init logic still works unchanged once it's hidden-until-active inside a deck panel | Re-measure/lazily init canvas sizing on panel-becomes-active (IntersectionObserver or explicit hook), re-run full v1.0 Fig. 01 verification once embedded |
| Deck ↔ browser History API | Treating panel changes as pure client-side UI state with no URL sync, or naively `preventDefault()`-ing links without `pushState` | Deliberately sync deck panel state to History API per meaningful destination (especially case studies) so back/forward and deep links behave correctly |
| Deck ↔ search crawlers | Assuming a single-URL, JS-toggled deck is fine because "Google renders JS" | Keep all panel content in static initial HTML; give crawlable, distinct URLs to any content that was independently linkable in v1.0 (case studies) |
| Ambient scene canvas ↔ `prefers-reduced-motion` | Only gating the deck's *transition* animation on reduced motion, forgetting the ambient scene's continuous twinkle/drift/pulse also needs its own reduced-motion branch | Branch both surfaces independently: deck transitions collapse to instant/crossfade, ambient scene collapses to a fully static single frame |
| Touch input ↔ iOS Safari system gestures | Claiming full-width horizontal swipe for panel navigation | Prefer vertical swipe axis (matches wheel/scroll metaphor) or leave edge margin free of swipe capture |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Always-on ambient canvas redrawing every element every frame | Sustained CPU usage while idle; battery drain; fan noise on laptops | Static/dynamic layer split, visibility gating on tab focus, sparse-event scheduling for "occasional" effects instead of per-frame probability checks | Becomes visible after a few minutes of idle tab time, worse on longer sessions (exactly how a recruiter might leave the tab open) |
| Synchronous procedural scene generation on page load | Lighthouse TBT regression; visible delay before hero content is interactive | Pre-bake static layout at build time, or chunk generation across frames/`requestIdleCallback` | Breaks the ≥90 Lighthouse floor once star/constellation count is large enough to exceed ~50ms in one task |
| Multiple simultaneous transparent/blurred compositing layers (scrim + glow + scene + panel) | Frame-rate drop and heat specifically on mid/low-tier mobile GPUs, not visible on desktop | Bake scrims/glows into flat gradients or pre-rendered sprites instead of live blur filters; minimize simultaneous overlapping transparent layers | Breaks first on real mid-tier Android devices, invisible in desktop/iPhone-only testing |
| Uncapped devicePixelRatio applied to the new scene canvas (separate risk from Fig. 01's already-capped DPR) | Blurry-vs-sharp rendering trade fixed by raising DPR, then CPU/fill cost spikes on 3-4x DPR phones | Apply the same DPR-cap-2 constraint already established for Fig. 01 to the scene canvas | Becomes visible on newer high-DPI phones once star count is large enough for per-star draw cost to matter |
| Wheel-lock/transition-lock omitted, allowing queued rapid transitions | Panels appear to "catch up" playing several transitions in a row after the user stops scrolling | Lock input during in-flight transitions; discard/coalesce queued deltas rather than queuing multiple panel advances | Becomes visible under fast scrolling/flicking input, easy to miss with slow, careful manual testing |

## Security Mistakes

Not highly relevant for this milestone (still a static site, no backend, no user data) — one domain-adjacent note carried forward and one new:

| Mistake | Risk | Prevention |
|---------|------|------------|
| Embedding real infrastructure/employer-confidential detail into named career-chapter constellations (AWS/Microsoft/Samsung labels with internal specifics) | Could inadvertently expose non-public employer information via a public, prominently-featured visual | Keep constellation content limited to what's already public on the résumé; treat this the same as v1.0's Fig. 01 abstraction discipline |
| Client-side-only deep-link/history state with no server validation (inherent to a static site) | Low risk here since there's no backend, but a maliciously crafted panel/hash URL could theoretically be shared to land a visitor on an unintended state | Validate/sanitize any panel index or hash value parsed from the URL before using it to drive rendering (bounds-check against known panel count) rather than trusting it blindly |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|--------------|-------------------|
| No visible indication of how many panels exist or where the user currently is | Recruiters skimming in seconds can't tell if they've seen everything or how much is left, undermining the "seconds to judge" Core Value | Persistent, always-visible dot/tab indicator showing total panel count and current position, per PROJECT.md's own "dots" requirement |
| Deck feels like it fights the user's first scroll attempt (see Pitfall 1) before they learn the new interaction model | First impression (the exact moment this site is optimized for) is confusion instead of "this person operates at our level" | Make the first scroll/wheel input forgiving and instantly responsive with a smooth, fast transition, and ensure dot/arrow affordances are visible immediately without requiring discovery |
| Ambient scene upstages the actual content it's meant to frame | A hiring manager remembers "pretty night sky" instead of the DynamoDB/ELB case-study substance the site exists to prove | Keep the scene genuinely ambient (background, low visual competition with panel text) — panel content must always read as the foreground; scrim/contrast work (Pitfall 8) directly serves this |
| Case studies feel demoted from full pages (v1.0) to "just another panel" | Reduces perceived depth/seriousness of the two case studies, which are the site's strongest credibility evidence | Give case-study panels equivalent visual weight/reading-length affordance to v1.0's dedicated pages, and ensure they're still independently reachable/shareable (Pitfall 9) |

## "Looks Done But Isn't" Checklist

- [ ] **Wheel/trackpad handling:** Often tested only on one input device — verify explicitly on a physical mouse wheel *and* a trackpad (Mac + Windows precision touchpad) that a single gesture advances exactly one panel
- [ ] **Keyboard/focus management:** Often "Tab still works" without auditing hidden-panel focusability — verify off-screen panels are `inert`/unfocusable and a screen reader announces panel changes via a live region
- [ ] **prefers-reduced-motion on the ambient scene:** Often dimmed rather than stopped — verify the OS/DevTools reduced-motion toggle produces a fully static single-frame starfield, not just slower twinkling
- [ ] **Deck transitions under reduced motion:** Often left animating — verify panel changes become instant/crossfade (no scroll/slide animation) under the reduced-motion setting
- [ ] **Lighthouse ≥90 after scene + deck both land:** Often only re-checked after content, not after the heaviest new surfaces — verify all four categories on mobile *and* desktop presets post-integration, not just post-content
- [ ] **Text contrast over the live starfield:** Often checked once against a static mockup — verify against actual rendered pixels behind real panel copy at the busiest realistic point (Milky Way band, camper glow)
- [ ] **Case-study deep links:** Often broken by the routing refactor — verify each case-study URL cold-loads its content directly (no requirement to first land on panel 1 and navigate)
- [ ] **iOS swipe gesture:** Often only tested in simulator or on Android — verify on a real iPhone that edge-swipe doesn't accidentally trigger browser back navigation
- [ ] **Fig. 01 embedded as a panel:** Often assumed unchanged — verify canvas sizing/DPR/keyboard proxies still work correctly the first time its panel becomes active (not just after a resize), and that its shortcuts don't conflict with the deck's own
- [ ] **Idle battery/CPU cost:** Often only measured via instantaneous FPS counters — verify sustained CPU% over several idle minutes on a real mid-range laptop and phone, not just a peak-frame-time snapshot

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|-------------------|
| Wheel/trackpad double-fire or dead-input discovered late | LOW | Add delta accumulation + transition lock to the existing wheel handler; no architectural change needed |
| Focus trap / missing live-region announcement discovered in a11y audit | LOW–MEDIUM | Add `inert`/`aria-hidden` to off-screen panels and a visually-hidden `aria-live` status element; retrofit is localized to the deck's panel-switch function |
| Ambient scene fails to fully stop under reduced motion | LOW | Add/fix the `matchMedia` branch to skip the animation loop entirely rather than dampening it; isolated to the scene's animation driver |
| TBT/LCP regression discovered via Lighthouse after scene lands | MEDIUM | Profile with DevTools Performance panel to find the long task, then chunk generation across frames or pre-bake at build time; may require restructuring the scene-init code path |
| Case-study routes become unlinkable/orphaned post-deck | MEDIUM–HIGH | Requires retrofitting URL/History API sync into the deck's panel-change logic and verifying cold-load rendering per URL; costlier the later it's discovered since it touches both deck mechanics and content wiring |
| Contrast failure over the starfield discovered in QA | LOW | Add/strengthen a scrim gradient behind affected text panels; no structural change, but must be re-verified against worst-case sky brightness |
| GPU overdraw/mobile jank discovered via real-device testing | MEDIUM | Consolidate blur/glow layers into baked assets, reduce simultaneous transparent layers; may require re-authoring specific visual effects rather than a pure config change |
| iOS edge-swipe conflict discovered post-launch | LOW–MEDIUM | Switch swipe axis to vertical or add edge-margin exclusion; isolated to the touch-gesture handler |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|-----------------|
| Scroll-hijacking disorientation / trapped users | Deck mechanics | Manual test with mouse wheel, trackpad, keyboard, touch; confirm dots/arrows always visible and functional as an escape hatch |
| Wheel-delta double-fire/dead-input | Deck mechanics | Explicit trackpad + mouse-wheel test pass; verify one gesture = one panel change on both |
| Focus trap / missing screen-reader announcements | Deck mechanics (structural) + Accessibility/QA (verification) | NVDA + VoiceOver pass; Tab-through test confirms no hidden-panel elements receive focus |
| Reduced-motion treated as "dimmer" not "stopped" | Canvas scene + Deck mechanics | OS/DevTools reduced-motion toggle test on both the ambient scene and panel transitions |
| Always-on canvas battery/CPU drain | Canvas scene | Sustained idle CPU% measurement on real mid-range laptop + phone over several minutes |
| TBT/LCP regression from scene init | Canvas scene | Lighthouse mobile + desktop run immediately after scene lands, bisected against pre-scene baseline |
| GPU overdraw from stacked scrim/glow/canvas layers | Canvas scene + Visual polish | Real mid-tier Android device test; DevTools layer-borders/paint-flashing inspection |
| Text contrast over starfield | Canvas scene / visual design | Contrast check against actual rendered pixels at worst-case brightness; Lighthouse a11y ≥90 re-check |
| Content hidden from crawlers / lost deep links | Deck mechanics | `curl`/JS-disabled fetch check per important URL; sitemap validation; Lighthouse SEO ≥90 re-check |
| iOS edge-swipe conflict | Deck mechanics | Real physical iPhone edge-swipe test |
| Fig. 01 / design-token / case-study regressions | Integration (Fig. 01-as-panel) + Scene/visual-design (token reconciliation) + Deck mechanics (routing) | Full re-run of v1.0's Fig. 01 verification checklist once embedded; design review against locked token system; case-study link click-through test |

## Sources

- [Scrolljacking 101 — NN/G](https://www.nngroup.com/articles/scrolljacking-101/) — usability study finding majority of participants disoriented by scrolljacking
- [What is scroll hijacking? — Alvaro Trigo's Blog](https://alvarotrigo.com/blog/what-is-scroll-hijacking/) (fullPage.js author's own blog, discusses the pattern's tradeoffs)
- [Avoid scrolljacking — Webflow Accessibility Checklist](https://webflow.com/accessibility/checklist/task/avoid-scrolljacking)
- [Scrolljacking and Accessibility: Are we Breaking the Web? — SitePoint](https://www.sitepoint.com/scrolljacking-accessibility/)
- [browser back-button/history problem with first section — alvarotrigo/fullPage.js GitHub Issue #950](https://github.com/alvarotrigo/fullPage.js/issues/950)
- [Off-Canvas + fullpage.js Problem — Foundation Forum](https://foundation.zurb.com/forum/posts/25532-off-canvas--fullpagejs-problem)
- [Carousels Tutorial / Functionality — W3C WAI](https://www.w3.org/WAI/tutorials/carousels/functionality/) — authoritative source on focus management and live-region announcements
- [WCAG 2.2 — W3C](https://www.w3.org/TR/WCAG22/)
- [C39: Using the CSS prefers-reduced-motion query to prevent motion — W3C WAI](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) — scroll-snap-type mandatory→proximity technique
- [Understanding Success Criterion 2.3.3: Animation from Interactions — W3C WAI](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) — essential vs. decorative motion distinction
- [prefers-reduced-motion: Sometimes less movement is more — web.dev](https://web.dev/articles/prefers-reduced-motion)
- [How Web Content Can Affect Power Usage — WebKit Blog](https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/)
- [Website performance and laggy animations: GPU vs CPU — Erwin Hofman](https://www.erwinhofman.com/blog/website-performance-laggy-animations-gpu-vs-cpu/) — CPU budget guidance (<30% desktop, <20% mobile)
- [Canvas vs WebGL for Interactive Browser Apps — Simplified Media](https://simplified.media/guides/canvas-vs-webgl)
- [Total Blocking Time — Chrome for Developers](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time)
- [Minimize main-thread work — Chrome for Developers](https://developer.chrome.com/docs/lighthouse/performance/mainthread-work-breakdown)
- [Optimizing Single-Page Applications for SEO & AI Search — seoClarity](https://www.seoclarity.net/blog/single-page-applications)
- [How To Optimize Single Page Applications For SEO — DebugBear](https://www.debugbear.com/docs/single-page-application-seo)
- [Designing Accessible Text Over Images — Smashing Magazine](https://www.smashingmagazine.com/2023/08/designing-accessible-text-over-images-part1/) — scrim technique and worst-case contrast verification
- [Text over images: The impact on accessibility — WCAG.com](https://www.wcag.com/blog/content-over-images-how-does-this-ux-ui-trend-impact-accessibility/)
- [Element: wheel event — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event)
- [Normalized WheelDelta JavaScript — phrogz.net](https://phrogz.net/js/wheeldelta.html)
- [Carousels on Mobile Devices — NN/G](https://www.nngroup.com/articles/mobile-carousels/) — documented J.Crew/iOS edge-swipe conflict case study
- [Blocking Navigation Gestures On iOS Safari — Pqina](https://pqina.nl/blog/blocking-navigation-gestures-on-ios-13-4/)
- [Performance problems in android: Overdraw — Medium](https://medium.com/@vincentiusvin1/overdraw-554cabc95571)
- [What Are GPU Performance Budgets — Digital Strategy Force](https://digitalstrategyforce.com/journal/what-are-gpu-performance-budgets-and-how-do-you-optimize-render-pipelines/) — per-layer compositing cost, mobile fill-rate constraints
- [requestAnimationFrame Explained — DEV Community](https://dev.to/tawe/requestanimationframe-explained-why-your-ui-feels-laggy-and-how-to-fix-it-3ep2)
- [WebGPU Resizing the Canvas](https://webgpufundamentals.org/webgpu/lessons/webgpu-resizing-the-canvas.html) — devicePixelRatio/ResizeObserver guidance
- Project context: `.planning/PROJECT.md` (v2.0 Night Sky milestone goals, floors carried forward, locked v1.0 design system and Fig. 01 doctrine)
- Project context: `.planning/research/PITFALLS.md` (v1.0 research, 2026-07-15) — carried-forward baseline for Fig. 01/font/GitHub Pages pitfalls, superseded by this v2.0-focused pass for the deck/scene domain

---
*Pitfalls research for: no-scroll immersive deck + persistent ambient canvas scene (v2.0 Night Sky milestone)*
*Researched: 2026-07-17*
