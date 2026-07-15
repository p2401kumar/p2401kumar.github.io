# Pitfalls Research

**Domain:** Personal portfolio site (Astro + GitHub Pages + interactive canvas hero figure) for a senior distributed-systems engineer
**Researched:** 2026-07-15
**Confidence:** MEDIUM (web-sourced, unverified against primary docs; GitHub Pages/Astro deploy behavior is well-documented and stable, canvas performance guidance is standard MDN-level practice, portfolio positioning findings are pattern-matched across several independent sources)

## Critical Pitfalls

### Pitfall 1: GitHub Pages base-path breaks assets, routes, and the 404 page

**What goes wrong:**
Astro emits relative and root-absolute paths that assume the site lives at the domain root. On a GitHub Pages *project* site (`username.github.io/repo-name`) — as opposed to a *user root* site (`username.github.io`) — every absolute link (`/about`, `/og-image.png`, font `url()`s in CSS, `<script src="/...">`) resolves against the wrong root and 404s. Nested routes and the custom 404 page are hit hardest because their relative depth differs from the root's. This project explicitly has an open decision (per PROJECT.md) between deploying at the user root vs. a project path with the old site retired — get this wrong and the whole site breaks silently until someone clicks a second-level link.

**Why it happens:**
Astro's `base` config is opt-in and easy to forget or misconfigure; developers test locally (`astro dev`/`preview` at root) where the bug is invisible, and only discover it after the GitHub Actions deploy when paths are served from a subdirectory. GitHub Pages' filesystem is also case-sensitive (Linux) while Windows dev environments are not — a link that works on `localhost` can 404 in production purely from casing.

**How to avoid:**
- Decide the hosting target (user root `p2401kumar.github.io` vs. project path) *before* scaffolding Astro, since it determines `astro.config.mjs`'s `site` and `base` values and cannot be silently retrofitted.
- Set `base` explicitly even if empty string, and use Astro's `base` import/`import.meta.env.BASE_URL` (or the built-in `<Image>`/asset pipeline) for every internal link and asset reference — never hand-write a leading-slash path.
- Use the official `astro build` + `actions/upload-pages-artifact` + `actions/deploy-pages` workflow from docs.astro.build rather than third-party actions; some report `withastro/action` as flakey.
- Set the GitHub Pages source to "GitHub Actions" in repo settings, not "Deploy from a branch."
- Commit the lockfile (`package-lock.json`/`pnpm-lock.yaml`) — CI builds fail without it.
- Test the production build locally with `astro preview` (which respects `base`), not just `astro dev`.
- After first deploy, click through every nav link and the 404 page on the live URL, not just localhost.

**Warning signs:**
Images/fonts load in `astro dev` but 404 in the deployed GitHub Pages URL; nav links work on the homepage but break one level deep; console shows 404s for `/assets/...` instead of `/repo-name/assets/...`.

**Phase to address:**
Foundation (Astro scaffold + first GitHub Pages deploy) — must be settled before any content or Fig. 01 work lands, since retrofitting `base` touches every internal link.

---

### Pitfall 2: Fig. 01 canvas demo tanks Lighthouse and battery life

**What goes wrong:**
An always-running canvas animation (ambient request beams, rerouting on fault injection) is exactly the pattern that produces poor Total Blocking Time (30% of Lighthouse's performance score) and drains laptop/mobile battery — the two failure modes this project explicitly worries about. A naive implementation redraws the entire canvas every frame via `setInterval`, keeps running in background tabs, and doesn't cap DPR, causing CPU/GPU load to spike on both idle viewing and on high-DPI screens.

**Why it happens:**
Canvas demos are usually built to "look good" first and profiled later, if at all. `requestAnimationFrame` is easy to reach for but easy to misuse — multiple independent rAF loops, full-canvas clears every tick, and no visibility/intersection gating are the default naive implementation.

**How to avoid:**
- Single consolidated `requestAnimationFrame` loop for the whole figure — never spawn multiple independent rAF chains for beams/nodes/log.
- Cap devicePixelRatio (project constraint already states DPR cap 2) and batch draws — set canvas backing-store size to `cssSize * min(devicePixelRatio, 2)`, scale the 2D context accordingly, keep CSS size at intended display size.
- Redraw only the changed region/layer (beams layer vs. static node layer) rather than clearing/repainting the full canvas every frame; consider a static background layer (dot-grid, node positions) composited under a dynamic beam layer.
- Gate the animation loop on `IntersectionObserver` (pause when Fig. 01 scrolls off-screen) and rely on rAF's native pause-on-hidden-tab behavior — don't fight it with `setInterval`.
- Throttle to a fixed target FPS using the rAF timestamp delta rather than assuming every callback should draw a new frame.
- Run Lighthouse (mobile + desktop) after Fig. 01 lands, not just after static content — canvas is the single highest-risk element for the ≥90 Lighthouse target in the project constraints.

**Warning signs:**
Fan noise / thermal throttling when the hero is on screen; DevTools Performance panel shows continuous main-thread activity even when nothing changes visually; Lighthouse TBT regresses specifically after Fig. 01 is added (bisect by testing before/after); battery drain reported on a laptop with the tab open and idle.

**Phase to address:**
Figure (Fig. 01 build) — instrument performance budget from the first commit of the canvas code, not as a later optimization pass. Re-verify in Polish phase with real Lighthouse runs on the deployed site.

---

### Pitfall 3: prefers-reduced-motion is treated as an afterthought, or as "just slow it down"

**What goes wrong:**
Teams either forget `prefers-reduced-motion` entirely, or implement it as "make the animation slower" rather than "provide a static, equally-informative alternative." For Fig. 01, the beams/rerouting *are* the content (it demonstrates the auto-weight-away rerouting claim) — if reduced motion just removes the animation with no static substitute, reduced-motion users lose the entire point of the figure and see a dead diagram or nothing.

**Why it happens:**
`prefers-reduced-motion` is trivial to implement for decorative CSS transitions (one media query) but much harder for canvas/JS-driven animation, which requires detecting the preference in JS (`window.matchMedia('(prefers-reduced-motion: reduce)')`) and branching to an entirely different rendering path — a static frame that still conveys the "before/after" of the fault-injection story.

**How to avoid:**
- Design the static fallback for Fig. 01 as a first-class deliverable, not a CSS toggle: a single static diagram frame that shows the *result* of "inject fault" (rerouted paths, healthy/unhealthy coloring) so reduced-motion users still get the story, per the project's own motion doctrine ("`prefers-reduced-motion` → static diagram").
- Detect via `matchMedia` in the canvas init code and branch early (skip the rAF loop entirely, render one static composite) rather than running the animation loop at 0 speed.
- Listen for the media query's `change` event too (users can toggle the OS setting live) — don't only check once on load.
- Apply the same doctrine to page-level build-in stagger animations (30–80ms ease-out per PROJECT.md) — those must also collapse to instant/no-motion.

**Warning signs:**
Reduced-motion testing (macOS/Windows accessibility setting, or Chrome DevTools "Emulate CSS media feature prefers-reduced-motion") shows a blank canvas, a frozen mid-animation frame, or no visual difference from motion-on.

**Phase to address:**
Figure (Fig. 01 build) for the canvas-specific fallback; Foundation/Polish for global stagger/hover motion audit.

---

### Pitfall 4: Self-hosted serif display font causes FOUT/CLS on the thesis hero

**What goes wrong:**
The hero's serif declarative thesis is the first thing a visitor sees ("within seconds... this person operates at our level"). If the self-hosted serif face isn't preloaded and lacks a metrics-matched fallback, the page either flashes invisible text (FOIT) for up to 3 seconds, or flashes the wrong-sized fallback font then reflows the layout (FOUT + CLS) right as the visitor is forming their first impression — directly undermining the "seconds" requirement in the project's Core Value.

**Why it happens:**
Font-display defaults and self-hosting are treated as a checkbox ("self-host, subset for performance") without the accompanying fallback-metrics work; font-related CLS is reported to account for roughly 15–20% of total layout shift on the median page, and it disproportionately hits large display type like a serif hero headline.

**How to avoid:**
- `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the serif display face (it's above-the-fold and LCP-relevant) and the mono/sans workhorse fonts used in the header nav.
- Use `font-display: swap` at minimum; consider `font-display: optional` for the display serif if CLS-zero matters more than guaranteed custom-font render.
- Define a size-matched fallback stack using `size-adjust`/`ascent-override`/`descent-override` (`@font-face` fallback declarations) tuned to the chosen serif's actual metrics, so the fallback-to-custom swap doesn't reflow the layout.
- Subset fonts to only the characters/weights actually used (already a stated constraint) — smaller files arrive faster, shrinking the FOUT window.
- Verify with Lighthouse's CLS metric and a manual slow-3G throttle test watching the hero specifically.

**Warning signs:**
Visible "jump" of the hero thesis text on page load, especially on first visit (cold cache); Lighthouse flags CLS > 0.1; PageSpeed Insights attributes shift to the heading element.

**Phase to address:**
Foundation (typography setup) — before content is poured into the hero, so the fallback-metrics work is done once and inherited everywhere.

---

### Pitfall 5: Content or metrics drift into "AI slop" / overclaiming, breaking the honesty constraint

**What goes wrong:**
Two related failure modes specific to this project's stated fight against "AI slop": (a) visual/copy genericness — competent-default AI output converges to the same look/voice every other portfolio has, undermining the "operates at our level" signal; (b) factual overclaiming — a number, verb, or scope claim on the site drifts from what the résumé actually supports (e.g., "led" becomes "architected," a percentage gets rounded up, a metric appears without the underlying artifact). The project's own constraint is explicit: *every number displayed must trace to the résumé — no invented telemetry.*

**Why it happens:**
Generic output happens because leaving word choice and layout decisions to an LLM (or to unexamined templates) produces the statistically most common "good enough" result — this is exactly why the project locked a specific design system (exact hex tokens, named type choices, a named motion doctrine) rather than "make it modern." Overclaiming happens gradually: a first draft slightly embellishes for punch, review passes focus on prose quality rather than fact-checking, and the exaggeration ships.

**How to avoid:**
- Treat the existing locked design tokens/type/motion doctrine in PROJECT.md as non-negotiable constraints during content/UI phases — any deviation toward "looks nice" genericness should be rejected in review.
- For every metric or claim on the site, require a one-line traceability note back to the résumé/LinkedIn source during content authoring (even if not shown publicly) — e.g., a content-collection frontmatter field like `source: "resume:dynamodb-cellularization"`. This creates a checkable artifact instead of relying on memory during review.
- Have a dedicated content-review pass (separate from a design/code review) that reads every number and verb against the résumé PDF line-by-line before ship.
- Avoid the anti-features already correctly excluded (skill bars, testimonials, tech-logo walls, analytics dashboards) — these are classic filler that signals genericness by their presence alone.
- Prefer specific, concrete verbs tied to the case studies (what was actually built/measured) over adjectives ("expert," "passionate," "innovative") — the project's own Core Value statement already frames this correctly ("credibility through demonstrated craft, not adjectives").

**Warning signs:**
A reviewer (or the engineer himself) can't immediately point to where a displayed number comes from; copy reads interchangeably with a generic "senior engineer" template; a metric feels rounder or more impressive than the résumé's actual phrasing.

**Phase to address:**
Content (case studies, systems list, experience section) — build the traceability check into the content-authoring workflow itself, and re-verify in a final Polish/pre-launch pass.

---

### Pitfall 6: Portfolio ships once and goes stale, undermining the "operates at our level" signal months later

**What goes wrong:**
A portfolio with a frozen "last updated" date, superseded metrics, or a stale "Selected systems" list starts working against the person it's meant to represent — an outdated portfolio can read as worse than no portfolio, because it signals the newer work isn't being surfaced or the person has been inactive. This project already deferred a blog (explicitly to avoid a stale-content risk) — but the remaining static sections (experience, systems list, case studies) can still go stale.

**Why it happens:**
Portfolio sites are usually treated as a one-time ship-and-forget project rather than a maintained artifact; there's no scheduled trigger to revisit it after a role change, a new project, or an expired case study.

**How to avoid:**
- Since blog is explicitly out of scope for v1, the update surface is small (experience section, systems list, case studies, résumé PDF) — make updating these low-friction (Astro content collections, not hardcoded markup) so a quarterly 15-minute pass is realistic.
- Bake a lightweight review cadence into the project's own lifecycle notes (e.g., a recurring reminder tied to role/résumé changes) rather than assuming it'll be remembered.
- Keep the downloadable résumé PDF and the on-site experience section as a single source of truth pairing — update both together, never let one drift ahead of the other.
- The footer's live Seattle clock / "all systems operational" status line is good instinct (signals an active, monitored system) but is cosmetic — pair it with actual content freshness, not just a ticking clock, or it becomes its own small piece of "AI slop" theater.

**Warning signs:**
Experience section still shows a role/title after an actual job change; "Selected systems" references a metric or project that's since been superseded or corrected; résumé PDF download is a different version than what the page text says.

**Phase to address:**
Content (structure content collections for low-friction updates) and Deploy (document the update workflow); this is primarily a post-launch discipline, but the phase that builds the content model determines how expensive updates will be later.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| Hardcoding GitHub Pages `base` path assumptions instead of using Astro's `BASE_URL`/asset pipeline | Faster initial scaffold | Every internal link must be hand-fixed if hosting target changes (user root vs. project path) | Never — decide hosting target first, use the pipeline from day one |
| Full-canvas clear+redraw each frame instead of dirty-rect/layered rendering | Simpler drawing code | Higher CPU/battery draw, harder to hit 60fps target on average laptops | Acceptable only for a throwaway prototype (e.g., the scratchpad `living-graph.html`); must be replaced before the Astro port |
| Skipping metrics-matched font fallback (`size-adjust`/`ascent-override`) | Saves setup time | Visible CLS on every fresh page load, hurts Lighthouse and first impression | Never for the hero serif; low-risk for footer/legal text |
| Hardcoding content (experience, systems list) directly in page markup instead of content collections | Faster initial build | Every future update requires touching component code instead of editing a data file | Acceptable only if the site is truly one-and-done; contradicts the project's own "quarterly update" reality |
| Skipping `prefers-reduced-motion` branch for Fig. 01 and shipping "just slower" motion | Less implementation work | Fails accessibility requirement in project constraints; reduced-motion users miss the demo's actual content | Never — it's an explicit project constraint |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|--------------|------------------|--------------------|
| GitHub Pages (project vs. user site) | Assuming `base: '/'` works regardless of which repo hosts the site | Decide user-root vs. project-path before scaffolding; set `site`/`base` in `astro.config.mjs` accordingly, verify with `astro preview` |
| GitHub Actions deploy | Using `Deploy from a branch` source or a flaky third-party action | Use GitHub's official Pages source = "GitHub Actions" + Astro's documented `withastro` build/deploy steps (or the maintained official workflow), commit lockfile |
| Self-hosted fonts | Loading font files without `preload`/`font-display`, or serving unsubset full font families | Preload LCP-critical fonts, subset to used glyphs/weights, set `font-display: swap`/`optional` |
| `prefers-reduced-motion` + canvas | Only handling the CSS media query, ignoring JS-driven canvas animation | Check `matchMedia` in canvas init JS, branch to static render path, listen for `change` events |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Uncapped devicePixelRatio on canvas | Blurry rendering fixed by using raw DPR, but then CPU/GPU cost spikes on high-DPI 3x displays | Cap DPR at 2 (already a stated project constraint), scale context accordingly | Breaks noticeably on newer high-DPI laptops/phones (DPR 3+) if uncapped |
| Multiple independent rAF loops (one per beam/node) | Frame time creeps up as more figure elements animate; jank under load | Consolidate into one rAF driver function that updates all animated entities per tick | Becomes visible once Fig. 01's beam count or fault-injection complexity grows |
| Full canvas clear + redraw every frame | Fine at low element counts; CPU usage and battery drain rise with scene complexity | Dirty-rect redraw or layered canvases (static background layer + dynamic beam layer) | Breaks the "60fps on average laptops" constraint once the ambient beam count is high enough to matter visually |
| Unthrottled animation loop (draws every rAF tick regardless of desired FPS) | Runs at display refresh rate (60/120/144Hz) burning more cycles than needed for a 60fps target | Use rAF timestamp delta to gate draws to target FPS | Becomes a battery/thermal issue on 120Hz+ laptop/phone displays |

## Security Mistakes

Not highly relevant for this project (static site, no backend, no user data) — but two domain-adjacent notes:

| Mistake | Risk | Prevention |
|---------|------|------------|
| Embedding real infrastructure details (internal service names, non-public metrics) in Fig. 01's "mirrors his real AWS work" framing | Could inadvertently expose employer-confidential information in a public demo | Keep Fig. 01 as an abstracted/generalized cellularization pattern, not a literal recreation of internal AWS systems; only use the specific numbers already public on the résumé |
| Serving the résumé PDF with outdated contact info or unintentionally embedded metadata (author, revision history) in the PDF | Minor privacy/professionalism leak | Strip PDF metadata before publishing; confirm contact details are current at each content-freshness pass |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|--------------|-------------------|
| Fig. 01 demo requires discovery/interaction with no affordance | Recruiters/hiring managers skim in seconds; if "send request" / "inject fault" controls aren't obviously clickable, the signature figure goes unused | Give the interactive controls clear visual affordance (matching the mono/label motion doctrine) and consider a subtle ambient auto-play state (beams already moving) so the value is visible even without interaction |
| Motion doctrine violated by adding "just one more" animated element per section | Visual noise undercuts the "one moving thing per viewport" restraint that signals seniority | Enforce the one-moving-thing rule in design review for every new section, not just Fig. 01 |
| Case-study deep-dives written as marketing copy instead of problem→approach→impact engineering narrative | Reads as generic/AI-slop to the target audience (senior engineers can tell) | Keep the stated case-study structure (problem → approach → impact) strict; write in the same restrained, factual voice as the rest of the site |

## "Looks Done But Isn't" Checklist

- [ ] **GitHub Pages deploy:** Often missing correct `base`/`site` config — verify by clicking every nav link and the 404 page on the *live* deployed URL, not localhost
- [ ] **Fig. 01 canvas:** Often missing DPR capping and rAF consolidation — verify with a Performance-panel recording while idle and while animating on a mid-range laptop
- [ ] **prefers-reduced-motion:** Often implemented only for CSS transitions — verify by toggling the OS reduced-motion setting and confirming Fig. 01 shows a static, informative diagram (not a blank canvas)
- [ ] **Self-hosted fonts:** Often missing preload + fallback metrics — verify with Lighthouse CLS score and a manual slow-network reload watching the hero
- [ ] **Metric traceability:** Often missing a source citation per displayed number — verify every number/claim against the résumé PDF line-by-line before launch
- [ ] **Lighthouse ≥90 target:** Often only tested pre-Fig.-01 — verify the score *after* the canvas figure and all fonts/images are in place, on both mobile and desktop presets
- [ ] **Content freshness workflow:** Often missing until it's already stale — verify content (experience, systems list) lives in editable content collections, not hardcoded markup, before declaring the phase done

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|-------------------|
| GitHub Pages base-path breakage discovered post-launch | LOW | Fix `astro.config.mjs` `base`/`site`, replace hardcoded absolute paths with `BASE_URL`-relative ones, redeploy — no data loss, just a redeploy cycle |
| Fig. 01 performance regression discovered via Lighthouse | MEDIUM | Profile with DevTools Performance panel, identify hot path (usually full-canvas redraw or uncapped DPR), refactor to dirty-rect/layered rendering, re-measure |
| Overclaimed metric discovered after launch | LOW–MEDIUM | Correct the copy immediately (reputational risk scales with how long it's been live and who's seen it); add the traceability field retroactively to prevent recurrence |
| Stale content noticed by a recruiter/hiring manager | MEDIUM (reputational, not technical) | Push an update immediately, and instate the quarterly review cadence going forward |
| Font CLS discovered late (visible jump) | LOW | Add preload tag + fallback-metrics `@font-face` override; no architecture change needed |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|-----------------|
| GitHub Pages base-path breakage | Foundation | Click every link + 404 page on the live deployed URL, not localhost |
| Fig. 01 performance/battery drain | Figure | DevTools Performance recording at idle + animating; Lighthouse TBT/CLS after Fig. 01 lands |
| prefers-reduced-motion neglect on canvas | Figure | Toggle OS reduced-motion setting; confirm static diagram fallback conveys the fault-injection story |
| Font FOUT/FOIT/CLS on hero | Foundation | Lighthouse CLS score; manual slow-network reload test on the hero specifically |
| Overclaiming / generic AI-slop content | Content | Line-by-line metric traceability check against résumé PDF before launch |
| Content staleness post-launch | Content + Deploy | Content lives in Astro content collections; quarterly review cadence documented and followed |

## Sources

- [Astro relative-path 404 bug — withastro/astro #2452](https://github.com/withastro/astro/issues/2452)
- [Astro 404 page asset path bug — withastro/astro #2561](https://github.com/withastro/astro/issues/2561)
- [GitHub Pages 404 troubleshooting — GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites)
- [Deploying to Github Pages? Don't Forget to Fix Your Links — Maxim Orlov](https://maximorlov.com/deploying-to-github-pages-dont-forget-to-fix-your-links/)
- [Deploy your Astro Site to GitHub Pages — Astro Docs](https://docs.astro.build/en/guides/deploy/github/)
- [Deploying to GitHub Pages is problematic/flakey — withastro/docs #8247](https://github.com/withastro/docs/issues/8247)
- [Optimising a canvas animation — Remy Sharp](https://remysharp.com/2015/07/13/optimising-a-canvas-animation)
- [Optimizing canvas — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [Efficient Animations with requestAnimationFrame — Treehouse Blog](https://blog.teamtreehouse.com/efficient-animations-with-requestanimationframe)
- [prefers-reduced-motion — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [Design accessible animation and movement — Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)
- [Understanding SC 2.3.3: Animation from Interactions — W3C WAI](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [Best practices for fonts — web.dev](https://web.dev/articles/font-best-practices)
- [Fixing Layout Shifts Caused by Web Fonts — DebugBear](https://www.debugbear.com/blog/web-font-layout-shift)
- [A Practical Guide to Self-Hosting Web Fonts — Tristan Guest](https://tristanguest.hashnode.dev/a-practical-guide-to-self-hosting-web-fonts)
- [Lighthouse performance scoring — Chrome for Developers](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
- [Measure and Optimize CLS — DebugBear](https://www.debugbear.com/docs/metrics/cumulative-layout-shift)
- [7 Common AI Website Mistakes — Search Engine Journal](https://www.searchenginejournal.com/7-common-ai-website-mistakes-that-are-easy-to-avoid/574196/)
- [Building a Site That Doesn't Look AI-Generated — Porter Intelligent Systems](https://www.porterintelligent.com/blog/building-a-site-that-doesnt-look-ai-generated)
- [How to Avoid AI Slop When Using Claude Design — MindStudio](https://www.mindstudio.ai/blog/claude-design-avoid-ai-slop-design-system)
- [5 Most Common Developer Portfolio Mistakes — David Walsh](https://davidwalsh.name/5-most-common-developer-portfolio-mistakes)
- [Don't waste your time on a portfolio website — jkettmann.com](https://jkettmann.com/dont-waste-your-time-on-a-portfolio-website/)
- [Ensuring our Canvas Visuals Look Good on Retina/High-DPI Screens — Kirupa](https://www.kirupa.com/canvas/canvas_high_dpi_retina.htm)
- [High DPI rendering on HTML5 canvas — cmdcolin](https://cmdcolin.github.io/posts/2014-05-22/)
- Project context: `.planning/PROJECT.md` (design doctrine, honesty constraint, GitHub Pages/Astro constraints)

---
*Pitfalls research for: personal portfolio site (Astro + GitHub Pages + interactive canvas hero)*
*Researched: 2026-07-15*
