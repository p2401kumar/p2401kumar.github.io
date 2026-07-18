# Phase 5: Night-Sky Scene - Research

**Researched:** 2026-07-17
**Domain:** Canvas2D procedural night-sky rendering (Milky Way + starfield), offscreen pre-render scheduling, ambient-scene pause composition, WCAG contrast verification over imagery, SVG-over-canvas layering
**Confidence:** MEDIUM overall — HIGH for architecture/integration (grounded directly in the shipped `fig01`/`deck.ts` source), LOW for the specific Milky Way compositing recipe (no authoritative source exists; this is exactly why CONTEXT.md gates it behind a spike), MEDIUM for browser-API support claims (websearch cross-referencing MDN/caniuse, not directly fetched this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Sequencing (LOCKED — research gate)**
1. Milky Way spike FIRST (~2-3h box): validate the zero-dep scatter+gradient offscreen technique visually before building the engine around it. If irreparably banded, the ~1-2KB simplex-noise package is the approved fallback (must pass the package legitimacy audit + exact pin). Spike output: a committed standalone HTML/screenshot pair + verdict in the phase dir.
2. Then engine, then constellations, then gates.

**Scene architecture (LOCKED — extends Phase 4 patterns)**
- Engine: `src/lib/nightsky/scene.ts` (layers, rAF driver, pause logic), `src/lib/nightsky/constellations.ts` (graph render + highlight + link-firing), `src/lib/nightsky/tokens.ts` (runtime token reads). Extract the generic getComputedStyle/parse logic from `fig01/tokens.ts` into `src/lib/shared/css-tokens.ts` NOW (both engines consume it; fig01 must not regress — its existing checks re-run: zero hex, astro check, single-rAF greps)
- `NightSky.astro`: fixed full-viewport canvas host rendered by index.astro BEHIND the deck (z-index under `.deck`, `pointer-events:none`), plus the camper silhouette as a DOM/SVG layer (below content, above canvas or composited into the static pre-render — planner's choice; silhouette itself is hand-authored SVG, never in the rAF loop)
- Layer split by update frequency (LOCKED): Layer 0 = starfield + Milky Way pre-rendered ONCE to an offscreen canvas per resize (chunked/idle-scheduled generation to protect TBT), blitted each frame; Layer 1 = SVG silhouette + copper glow (static DOM/CSS); Layer 2 = per-frame work ONLY: twinkle subset (~5-8% of stars, alpha wobble) + ≤ ~15 fireflies (ground band, slow drift, copper-tinted pulse) + at most ONE constellation link-firing beam at a time
- Single rAF loop for the whole scene; DPR cap 2; `visibilitychange` pause; subscribes to `nightsky:panel-change` — pauses ambient entirely while panel id `fig-01` is active (one-active-animation rule); resumes on leaving
- `prefers-reduced-motion`: render ONE static complete frame (Layer 0 + static stars + silhouette; no fireflies motion, no twinkle, no firing) and never start the loop — same doctrine as fig01's renderStaticFrame
- New sky tokens ALLOWED in tokens.css only (e.g. `--sky-zenith`, `--sky-horizon`, `--milkyway`) — the zero-light-pollution sky may need deeper blacks/blues than `--bg`; zero hex literals anywhere else (canvas reads via shared css-tokens)

**Constellations (LOCKED)**
- `src/data/constellations.ts`: typed module — 4 constellations (aws, microsoft, samsung, education-patents) with normalized star coords, magnitudes, link pairs, a display label, a `source` annotation (honesty gate: labels are employer/education names + patent facts only — nothing invented), and a `panelIds` mapping
- Panel→constellation highlight mapping lives IN the data module (single source of truth). Rule: at most ONE constellation brightened at a time; panels without a mapping leave all at ambient. Suggested mapping (planner may refine): fig-01+systems→aws, experience→microsoft, patents→education-patents, skills→samsung, hero/contact→none (all ambient)
- Brightening = alpha/glow lift on that constellation's stars + links over ~400ms ease-out; others dim slightly; driven ONLY by the `nightsky:panel-change` CustomEvent (no imports from deck.ts)
- Link-firing: reuse the fig01 beam MATH PATTERN (t-parameterized head+tail along a segment) reimplemented locally in constellations.ts (do NOT import fig01 modules); one quiet firing every ~6-10s on a random link of the ambient sky (suppressed while paused/reduced-motion)

**Scrim & contrast (SKY-05)**
- A content scrim (subtle vertical gradient behind the panel content column, ~30-40% max opacity, preserving the dark look) added at the deck/panel level; text contrast verified at WORST-CASE points — verification samples the brightest sky pixels under text regions (canvas readback in a verification script or screenshot analysis), not averages

**Quality gates (this phase)**
- astro check 0 errors; build green; zero hex outside tokens.css; fig01 non-regression greps re-run after the shared-tokens extraction
- Local Lighthouse ≥90 all four categories with deck + scene active (mobile + desktop presets), recorded in the phase dir
- Idle-CPU sanity: with the scene idle 60s+, document evidence the per-frame work is bounded (e.g. DevTools performance sample via browse tooling if it starts, else a reasoned frame-cost audit: elements-per-frame count in the code + TBT from Lighthouse). The formal <10%/5min claim finalizes in Phase 6's live verification if tooling can't measure it locally
- **NO push to origin** (hard prohibition — live site stays v1 until Phase 6)

### Claude's Discretion
- Star counts/densities, Milky Way band angle/composition, exact new token values, glow radii, firefly count (≤15), firing cadence within 6-10s, silhouette artwork details (camper shape, horizon line), chunked-generation scheduling (requestIdleCallback vs setTimeout slices), scrim gradient exact stops

### Deferred Ideas (OUT OF SCOPE)
- Fig. 01 embedded re-verification + resize audit → Phase 6
- Live-URL Lighthouse + deploy + real-device touch checklist → Phase 6
- Any constellation interactivity (hover/click on stars) → future (/craft territory)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SKY-01 | Persistent zero-light-pollution scene — dense pre-rendered starfield + vivid Milky Way band (offscreen-rendered once, blitted) behind every panel | Milky Way spike protocol (Common Pitfalls #1, Pattern 1), starfield density/magnitude technique (Pattern 2), offscreen pre-render mechanics (Pattern 3) |
| SKY-02 | Camper-car camp silhouette at horizon with single warm copper glow (hand-authored static SVG, outside animation loop) | SVG-over-canvas layering (Pattern 5), z-index/pointer-events stacking |
| SKY-03 | Sparse fireflies + twinkling star subset are the ONLY per-frame canvas work; idle CPU < 10% sustained over 5 min | Layer-by-frequency architecture (Architectural Responsibility Map, Pattern 4), chunked generation scheduling (Pattern 3), idle-CPU measurement method (Environment Availability, Common Pitfalls #4) |
| SKY-04 | Scene pauses when tab hidden and while Fig. 01's panel is active; `prefers-reduced-motion` renders one static frame | Pause-reason state machine (Pattern 6), direct extension of `fig01/interactions.ts`'s proven `updateRunState`/`wireLifecycle` pattern |
| SKY-05 | All text over sky passes WCAG 1.4.3 contrast at worst-case brightness via a scrim | Contrast verification method (Pattern 7, Code Examples), scrim stacking order (Architecture) |
| CONST-01 | Named career-chapter constellations in a typed data module with source-annotated labels (honesty gate) | Data module shape (Code Examples), honesty gate cross-check against `experience.ts`/`patents.ts` (Don't Hand-Roll note) |
| CONST-02 | Active panel's constellation brightens/dims via `nightsky:panel-change` | Event contract (already shipped in `deck.ts`, read directly — Architecture) |
| CONST-03 | Neural links occasionally fire, reusing the Fig. 01 beam pattern (sparse, decorative) | Beam math mirroring, NOT importing, `fig01/model.ts` (Code Examples, Pattern 8) |
</phase_requirements>

## Summary

This phase has one real unknown (the Milky Way visual technique) and a large amount of well-precedented engineering — nearly every architectural question this phase raises has already been answered once by the shipped `fig01/` module and `deck.ts`, and the job here is to mirror those patterns into a second, independent engine rather than invent new ones. `fig01/tokens.ts` (getComputedStyle-once caching), `fig01/render.ts` (DPR cap, single rAF driver, `renderStaticFrame` reduced-motion doctrine, layered-gradient glow instead of `shadowBlur`), and `fig01/interactions.ts` (the `IntersectionObserver` + `visibilitychange` + `matchMedia` + deck-`MutationObserver` four-signal pause gate) are not just prior art — for this phase they are the load-bearing contract the planner should copy nearly verbatim into `nightsky/*`, adding one new pause reason (`fig-01` panel active) to the existing pattern.

The one place this phase is genuinely exploring new ground is the Milky Way band's visual technique. No authoritative source (MDN, official docs, or a well-known open-source implementation) describes a proven "scatter dots + layered gradients" recipe for a convincing, non-banded Milky Way in Canvas2D — this was already flagged LOW-confidence in `STACK.md` and is exactly why CONTEXT.md gates it behind a timeboxed spike before any engine code is written. This research defines what "irreparably banded" concretely means so the spike has an objective pass/fail bar, and lays out the two-tier fallback path (dithering/jitter tuning, then `simplex-noise` as a last resort) so the spike isn't open-ended.

Everything else — offscreen pre-render mechanics, chunked idle-scheduled generation, star realism (power-law magnitude + color temperature + twinkle), the contrast-verification method for SKY-05, and the SVG-silhouette layering — has enough precedent (either in this codebase or in mainstream web-platform documentation) to plan prescriptively rather than exploratively.

**Primary recommendation:** Structure `nightsky/*` as a parallel, non-importing sibling to `fig01/*` (mirroring its module skeleton and pause-gate pattern exactly), spike the Milky Way technique standalone first with an objective banding checklist, and treat the offscreen pre-render + chunked generation + idle-CPU floor as one deliberately-designed subsystem rather than an afterthought — this is where SKY-03's 10% CPU floor and the Lighthouse TBT floor both live or die.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Starfield + Milky Way rendering (SKY-01) | Browser / Client (Canvas2D, build-time none) | — | Pure client-side procedural draw; GitHub Pages serves only static assets, no server tier exists |
| Offscreen pre-render + chunked generation (SKY-01, SKY-03) | Browser / Client | — | Runs once at init/resize on the main thread (idle-scheduled); no build-time pre-bake chosen for v2.0 (viewport-size-dependent layout varies per visitor) |
| Camper silhouette + glow (SKY-02) | Browser / Client (static SVG + CSS) | — | Never touches the rAF loop; a DOM/CSS layer, not canvas |
| Twinkle + fireflies + link-firing (SKY-03, CONST-03) | Browser / Client (single rAF loop) | — | The only genuinely per-frame work in the whole phase; everything else is either static or CSS-driven |
| Pause/lifecycle state machine (SKY-04) | Browser / Client | — | Mirrors `fig01/interactions.ts`'s existing `IntersectionObserver`+`visibilitychange`+`matchMedia`+`MutationObserver` gate; no new tier, one new pause reason |
| Contrast scrim (SKY-05) | Browser / Client (CSS gradient, verified via a build-time or dev-time script) | — | The scrim itself is a CSS layer; the *verification* is a one-off Node/browser script run during planning/QA, not a runtime concern |
| Constellation data + panel mapping (CONST-01, CONST-02) | Browser / Client (static TS data module, bundled at build) | — | No CMS/backend; `src/data/constellations.ts` is compiled into the static bundle exactly like `panels.ts`/`experience.ts` |
| `nightsky:panel-change` event consumption (CONST-02) | Browser / Client | — | Already-shipped `document`-level `CustomEvent`; no new transport needed |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Canvas2D API (native) | Web Platform, universal | Starfield, Milky Way, twinkle, fireflies, constellation nodes/links | Already the project's proven rendering surface; `fig01/render.ts` hits 60fps + Lighthouse ≥90 at comparable element counts `[VERIFIED: .planning/phases/04-deck-mechanics/lighthouse-scores.md]` |
| Inline SVG (hand-authored) | n/a (Web Platform) | Camper-car silhouette + copper glow | Static vector art belongs in SVG — crisp at every DPR, zero per-frame rasterization cost, hand-tweakable `[CITED: .planning/research/STACK.md]` |
| Vanilla TypeScript (project-authored, no library) | project code | `nightsky/scene.ts`, `nightsky/constellations.ts`, `nightsky/tokens.ts` | Mirrors `fig01/*`'s exact module skeleton and single-rAF-driver contract `[VERIFIED: src/lib/fig01/render.ts, src/lib/fig01/interactions.ts]` |
| `src/lib/shared/css-tokens.ts` (new, project-authored) | project code | Generic getComputedStyle/parse-hex bridge shared by `fig01` and `nightsky` | `fig01/tokens.ts` (74 lines) is already 90% generic (`parseHex`, `readToken`, `RgbTriple`, `rgba`) — only the token *name list* (`FigTokens` interface + the `getTokens()` field list) is fig01-specific `[VERIFIED: src/lib/fig01/tokens.ts]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| *(none required by default)* | — | — | Zero new npm dependencies for the default path — matches `STACK.md`'s "no new runtime dependencies" bottom line, carried forward unchanged for this phase |
| `simplex-noise` | `4.0.3` (latest, published 2024-07-26) `[VERIFIED: npm registry — npm view simplex-noise version/time.created]` | Fallback-only: higher-quality procedural texture for the Milky Way band if the zero-dep scatter+gradient spike is irreparably banded | ONLY if the spike (see Common Pitfalls #1) fails its objective pass/fail bar. Never adopt pre-emptively. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain detached `<canvas>` for the one-time Layer-0 pre-render | `OffscreenCanvas` (+ Web Worker) | `OffscreenCanvas` 2D-context support reached ~95% global coverage only from Safari 16.4+ (macOS/iOS) `[CITED: caniuse.com/offscreencanvas, MDN OffscreenCanvas]`; for a pre-render that runs once at init/resize (not every frame), a worker buys nothing and adds a support-detection branch. Use a plain `document.createElement('canvas')` never attached to the DOM — works identically everywhere, zero feature-detection needed. |
| `requestIdleCallback` for chunked generation | `setTimeout`-based deadline polyfill | Safari (macOS + iOS) does not ship `requestIdleCallback` at all as of this research `[CITED: MDN requestIdleCallback, multiple 2026 browser-support summaries]` — for a portfolio site where Safari/iOS visitors are a real audience segment, the `setTimeout` fallback is not an edge case, it is the *primary* path for a meaningful fraction of visitors. Feature-detect and use `requestIdleCallback` where available, but budget planning time for the `setTimeout` shim as first-class, not an afterthought. |
| Zero-dependency scatter+gradient Milky Way | `simplex-noise` (1-2KB) | Adopt only after the spike demonstrates the zero-dep version is visibly banded even after dithering/jitter tuning — see Common Pitfalls #1 for the objective bar. |

**Installation:**
```bash
# Default path — no install needed.
# ONLY if the Milky Way spike fails (see Common Pitfalls #1):
npm install simplex-noise@4.0.3
```

**Version verification:** `simplex-noise@4.0.3` confirmed current via `npm view simplex-noise version` (returned `4.0.3`) and `npm view simplex-noise time.created` (returned `4.0.3`'s actual publish date of 2024-07-26 per the package's full `time` map — the registry's top-level `time.created`/`time.modified` fields reflect metadata-cache timestamps, not the package's real age; the per-version `time` map is the authoritative source and shows the package's first version published 2012-08-07, fourteen versions total, most recent 2024-07-26) `[VERIFIED: npm registry]`.

## Package Legitimacy Audit

> Conditional — `simplex-noise` is a fallback-only dependency, not installed by default. Audited now so the planner has a ready-to-use verdict if the Milky Way spike fails.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `simplex-noise` | npm | 14 versions since 2012-08-07 (latest 4.0.3, 2024-07-26) `[VERIFIED: npm registry]` | Not returned by `npm view` in this environment | `github.com/jwagner/simplex-noise.js` `[VERIFIED: npm registry — repository.url]`, MIT license | `[SUS]` (per `gsd-tools query package-legitimacy check`) | Flagged — planner must add `checkpoint:human-verify` before install, IF the spike fails |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** `simplex-noise` — the automated legitimacy seam returned `SUS` with reasons `unknown-age`, `unknown-downloads`, `no-repository` (its own signal-collection step returned nulls in this environment, not a finding that the package itself is suspicious). Direct `npm view simplex-noise` and `npm view simplex-noise repository.url` calls in this session independently confirm: 14 published versions spanning 2012–2024, a real GitHub source repo (`jwagner/simplex-noise.js`), MIT license, and **no `postinstall` script** (`npm view simplex-noise scripts.postinstall` returned empty) `[VERIFIED: npm registry]`. This is a long-established, single-maintainer utility package with the classic profile of a legitimate small library whose automated download/age signals simply didn't resolve in this run — not a slopsquat pattern (which would show near-zero version history and a package age of days/weeks). Per protocol the `SUS` verdict is still honored: if the spike fails and this fallback is adopted, the plan must gate the `npm install simplex-noise@4.0.3` step behind a `checkpoint:human-verify` task, even though the manual registry evidence gathered here is reassuring.

*No other packages are candidates for installation in this phase — the default path (scatter+gradient, no dependency) requires zero `npm install` commands.*

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │  index.astro (page shell)                    │
                    │  <NightSky.astro>  (new, BEHIND .deck)        │
                    │  <PanelDeck>...panels...</PanelDeck>          │
                    └───────────────┬───────────────────────────────┘
                                    │ page load
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │ initNightSky(root)  — src/lib/nightsky/scene.ts         │
        │  1. getTokens() (shared/css-tokens.ts, once)             │
        │  2. createState() — stars, milky way params, fireflies   │
        │  3. generateLayer0(W,H) — CHUNKED (idle-scheduled)  ─────┼──▶ offscreen <canvas> (detached, no DOM)
        │       ↳ scatter stars + gradient MW band + dust darken   │        │ drawImage() blit, every frame
        │  4. wireLifecycle() — IntersectionObserver +             │        ▼
        │     visibilitychange + matchMedia + panel-change ────────┼──▶ visible <canvas> (Layer 0 blit
        │     listener (NEW: pause reason 'fig-01' panel active)   │      + Layer 2 twinkle/fireflies/beams)
        │  5. document.addEventListener('nightsky:panel-change',   │
        │     onPanelChange) → constellations.ts highlight/dim     │
        └───────────────────────────────────────────────────────┘
                                    │ resize (debounced)
                                    ▼
                    re-run generateLayer0(newW,newH), re-blit
                                    │
        ┌───────────────────────────────────────────────────────┐
        │ Single rAF loop (per-frame, ONLY when running)           │
        │   twinkle subset alpha wobble → draw on visible canvas   │
        │   fireflies drift/pulse       → draw on visible canvas   │
        │   ≤1 constellation link fire  → draw on visible canvas   │
        │   constellation brighten/dim tween → draw on visible     │
        └───────────────────────────────────────────────────────┘
                                    ▲
                    pause when: document.hidden ||
                    !intersecting || panelId==='fig-01' ||
                    prefers-reduced-motion
```

Fig. 01's own canvas (a separate `<canvas>` inside its own panel) is a fully independent rendering surface — `nightsky` and `fig01` never share a canvas element, only the pause-signal *pattern*.

### Recommended Project Structure
```
src/lib/
├── shared/
│   └── css-tokens.ts       # NEW — generic getComputedStyle/parseHex/rgba, extracted from fig01/tokens.ts
├── fig01/
│   └── tokens.ts           # THINNED — re-exports/wraps shared/css-tokens.ts, keeps FigTokens shape + fig01-specific token names; behavior identical, zero regression
├── nightsky/
│   ├── deck.ts              # ALREADY SHIPPED (Phase 4) — do not modify; nightsky/* only imports PANEL_CHANGE_EVENT
│   ├── tokens.ts            # NEW — sky-specific token names (--sky-zenith, --sky-horizon, --milkyway, firefly amber, etc.) via shared/css-tokens.ts
│   ├── starfield.ts         # NEW — Layer 0 generation: star scatter, magnitude/color distribution, MW band compositing (the spiked technique lives here)
│   ├── scene.ts             # NEW — layers, single rAF driver, pause state machine, resize/regen orchestration, initNightSky(root) entry point
│   └── constellations.ts    # NEW — graph data render, highlight/dim on panel-change, link-firing (beam math mirrored, not imported)
src/data/
└── constellations.ts        # NEW — typed 4-constellation data module (CONST-01)
src/components/
└── NightSky.astro           # NEW — fixed full-viewport canvas host + inline SVG silhouette
```

### Pattern 1: Milky Way spike — objective pass/fail bar

**What:** Before any engine code exists, build a single standalone HTML file (matching the project's existing `.planning/reference/prototype-*.html` convention) that renders ONLY the Milky Way band technique at production resolution/DPR, screenshot it, and judge it against explicit criteria.

**When to use:** First task of this phase, timeboxed ~2-3h per CONTEXT.md.

**Objective pass/fail criteria** (none of this is in the existing research corpus — defining it here closes that gap):
- **PASS bar:** At both DPR 1 and DPR 2, viewed full-screen on a color-calibrated (non-blown-out) dark display, the Milky Way band shows continuous, cloud-like density variation with no visible discrete rings, concentric arcs, or hard-edged color steps ("banding") — the classic 8-bit-gradient banding artifact where a smooth gradient shows visible stepped bands of color rather than a continuous ramp.
- **FAIL indicators (any one is disqualifying):**
  - Concentric rings/arcs visible in a `createRadialGradient`-based glow at any zoom level ≥100%
  - A visible seam or repeating pattern where scatter-dot density transitions between "dense band core" and "sparse edge" zones
  - Screenshot histogram analysis (or simply `Image > Levels` in any image viewer) shows discrete spikes/gaps rather than a smooth distribution in the band's luminance channel
  - The band reads as a flat color wash with no depth/dust-lane variation once desaturated to greyscale
- **Recovery ladder if FAIL** (try in order before reaching for `simplex-noise`):
  1. Add per-dot random jitter to position AND alpha (not just position) — uniform alpha across a gradient is the single most common cause of visible banding in Canvas2D gradients, because `createRadialGradient`/`createLinearGradient` color-stop interpolation itself can show 8-bit stepping on some GPUs/displays.
  2. Layer 3-4 gradients of different radii/opacities rather than one gradient — visually "dithers" the transition zone.
  3. Add a second, coarser scatter pass with larger, dimmer dots specifically along the gradient's banding-prone transition zones (breaks up any residual regularity).
  4. Only if all three fail: adopt `simplex-noise` (see Package Legitimacy Audit) purely for the one-time offscreen pre-render's density/alpha field — never in the per-frame path, so runtime cost is unchanged either way.
- **Spike output (LOCKED per CONTEXT.md):** committed standalone HTML/screenshot pair + a written verdict (which technique, why, and — if `simplex-noise` was needed — which recovery-ladder step failed and why) in the phase directory before any `nightsky/starfield.ts` code is written.

### Pattern 2: Star field realism — magnitude, color, twinkle

**What:** Cheap techniques for a starfield that reads as astronomically plausible rather than a uniform random sprinkle.

**When to use:** Layer 0 generation (`starfield.ts`).

- **Magnitude (brightness) distribution:** real starfields follow a steep power-law — vastly more faint stars than bright ones. Approximate with `Math.pow(Math.random(), N)` (N≈2.5-4) to bias toward low brightness, then map the result to both radius (0.5-2px) AND alpha (0.15-1.0) — brightness should affect both, not just alpha, since real bright stars also appear to have slightly larger apparent disks. `[ASSUMED — synthesized from multiple non-authoritative sources, no single canonical reference found this session]`
- **Color temperature:** vary hue subtly across a narrow band (not the full rainbow) — cool blue-white through neutral white to warm amber, weighted so most stars are near-neutral white with only a small fraction showing visible color, matching how real starfields look to the naked eye (strong color is rare, subtle tint is common). Implement via a small HSL hue range (e.g. 200°-40° through white) rather than arbitrary RGB, since HSL makes "mostly neutral, occasionally tinted" trivial to weight. `[ASSUMED — LOW confidence, no authoritative source]`
- **Twinkle (Layer 2, per-frame):** per CONTEXT.md, only ~5-8% of stars twinkle. Give each twinkling star a random phase offset and use `alpha = baseAlpha + amplitude * Math.sin(t / period + phaseOffset)` — cheap (one sin() per twinkling star per frame, not per star), reads as natural because unsynchronized phases avoid a uniform "pulsing" look. This mirrors `fig01/render.ts`'s existing ML-node breathing-ring technique (`Math.sin(T / ML_RING_PERIOD)`) almost exactly `[VERIFIED: src/lib/fig01/render.ts drawNode ML ring]`.
- **Density guidance for ~1080p-4K:** hundreds to low thousands of stars is the right order of magnitude (matching `STACK.md`'s own estimate) — not tens of thousands. At DPR-capped 2, a 3840×2160 canvas backing store is still only ~8.3M pixels; a few thousand 1-2px dots is a trivial one-time fill cost even unoptimized, but keep the ONE-TIME generation itself chunked regardless (see Pattern 3) since "one-time" still means "one synchronous loop" if not deliberately sliced.

### Pattern 3: Offscreen pre-render mechanics

**What:** Layer 0 (starfield + Milky Way) draws ONCE per init/resize to a detached canvas, then is blitted via `drawImage()` every frame — this is the architecture's single most important perf decision (Pitfall 5, 6 in `PITFALLS.md`).

- **Detached plain `<canvas>`, not `OffscreenCanvas`:** `OffscreenCanvas` 2D-context support only reached Safari 16.4+ (macOS/iOS) `[CITED: caniuse.com/offscreencanvas, MDN OffscreenCanvas — websearch-synthesized, not directly fetched this session, so treat as MEDIUM confidence]`. Since this pre-render is a one-shot operation (not sustained per-frame work), a plain `document.createElement('canvas')` that is never appended to the DOM needs zero feature detection and works identically on every browser this project already targets. `STACK.md`'s own "Alternatives Considered" table already reached this same conclusion independently — this research corroborates it.
- **Chunked generation via `requestIdleCallback` with a `setTimeout` fallback:** `IdleDeadline.timeRemaining()` caps at ~50ms per callback `[CITED: MDN Window.requestIdleCallback]`. Structure generation as: build a queue of "chunks" (e.g. 100-200 stars per chunk, then the Milky Way band as its own final chunk), and drain the queue across multiple `requestIdleCallback` invocations, checking `deadline.timeRemaining() > 0` before each unit of work within a chunk. Since Safari does not ship `requestIdleCallback` at all `[CITED: MDN, multiple 2026 support summaries — MEDIUM confidence]`, feature-detect (`'requestIdleCallback' in window`) and fall back to a `setTimeout`-based shim that mimics the same `deadline.timeRemaining()` contract (`Math.max(0, 50 - (Date.now() - start))`) — this fallback is not optional/rare, it is the primary path for a meaningful fraction of visitors on this specific project (portfolio → recruiters/hiring managers, many on Safari/macOS).
- **Regeneration on resize:** debounce resize events (200-300ms settle) before regenerating Layer 0 at the new size — do NOT regenerate on every resize tick, and do NOT scale-blit the old bitmap as a permanent solution (a scaled-up low-res starfield looks visibly soft/blurry). A brief scale-blit AS the debounce's interim frame (so the scene doesn't flash empty during a resize) is a reasonable UX polish, with the real regeneration replacing it once the debounce settles.
- **TBT protection is the actual goal**, not idle-scheduling for its own sake — Pitfall 6 in `PITFALLS.md` is explicit that Lighthouse's TBT metric flags any single task over 50ms; chunking below that threshold is what keeps the scene's init off the TBT ledger entirely, independent of which scheduling primitive is used.

### Pattern 4: Layer-by-frequency architecture (already locked, restated as an implementation pattern)

**What:** The three-layer split from CONTEXT.md maps directly onto three different code paths with three different re-render triggers:
- Layer 0 (starfield+MW): re-rendered only by `generateLayer0()`, triggered by init + debounced resize. Never touched by the rAF loop except for the `drawImage()` blit.
- Layer 1 (SVG silhouette+glow): rendered once by Astro at build time, animated (if at all) purely via CSS `@keyframes` on the glow's opacity — genuinely zero JS involvement per frame.
- Layer 2 (twinkle/fireflies/beams/constellation-tween): the ONLY code that runs inside the rAF tick function.

This is the same discipline `fig01/render.ts` already applies (`drawGrid` static-ish substrate vs. `drawBeams`/glow-decay per-frame work) — the planner should structure `scene.ts`'s `drawFrame()` analogously to `fig01/render.ts`'s `drawFrame()`: one function, clearly commented sections, Layer 0 blit first, Layer 2 elements drawn on top.

### Pattern 5: SVG silhouette over canvas — stacking and interaction gotchas

**What:** The camper-car silhouette is inline SVG (not canvas), sitting visually between Layer 0 (background) and the panel content.

- **z-index / stacking order:** `NightSky.astro`'s canvas host must sit BEHIND `.deck` (CONTEXT.md: "z-index under `.deck`"). Given `deck.css` already sets `html.deck-active .deck { position: fixed; z-index: 1; }`, the scene canvas + SVG silhouette host should be `position: fixed; inset: 0; z-index: 0` (or unset, relying on DOM order, but explicit `z-index: 0` is safer against future insertions) — one new fixed-position sibling ahead of `.deck` in `index.astro`'s DOM order, or `z-index` explicitly below 1. `[VERIFIED: src/styles/deck.css]`
- **`pointer-events: none` is mandatory on BOTH the canvas AND the SVG silhouette** (CONTEXT.md states this for the canvas host explicitly; the SVG must inherit or independently declare the same, since an interactive-looking SVG shape with default pointer-events would otherwise sit in the hit-testing path of whatever DOM lies below it in stacking order despite being visually behind panels — SVG elements have their own independent pointer-events default of `visiblePainted}` unless overridden, so this must be explicit CSS, not assumed).
- **The silhouette can be a sibling `<svg>` inside `NightSky.astro`, positioned via CSS** (`position: absolute; bottom: 0`), rather than composited into the canvas Layer 0 bitmap — CONTEXT.md leaves this as "planner's choice," but keeping it as a separate SVG element (not baked into the canvas raster) is simpler to reason about, gets free crisp-at-any-DPR rendering, and avoids the whole silhouette needing to be regenerated every time Layer 0 regenerates on resize (a `<svg>` responds to CSS/viewport resize for free; a raster bake-in does not).
- **The "single warm glow"** is best implemented as a CSS `radial-gradient` pseudo-element (or an SVG `<filter>`/`<feGaussianBlur>` baked once, not per-frame) with one slow `@keyframes` opacity pulse — `STACK.md`'s explicit "What NOT to Use" table already flags live `filter: blur()`/`shadowBlur` as expensive; a static pre-authored soft-edge gradient with a CSS opacity animation avoids any per-frame cost while still reading as a subtle glow.

### Pattern 6: Pause-reason state machine (extends the proven fig01 pattern)

**What:** `fig01/interactions.ts`'s `updateRunState()` already gates the rAF loop on THREE boolean signals combined with `&&` (`intersecting && panelActive && !document.hidden && !rm.matches`) `[VERIFIED: src/lib/fig01/interactions.ts:316-323]`. `nightsky/scene.ts` needs the same shape with a DIFFERENT panel-active check inverted: fig01 pauses when its OWN panel is inactive; nightsky pauses when the `fig-01` panel specifically IS active (the "one-active-animation rule").

**Recommended implementation**, directly modeled on the proven code:
```typescript
// nightsky/scene.ts — mirrors fig01/interactions.ts's updateRunState shape.
// Source pattern: src/lib/fig01/interactions.ts:316-347
const rm = matchMedia('(prefers-reduced-motion: reduce)');
let tabVisible = !document.hidden;
let fig01Active = false; // becomes true only while the 'fig-01' panel is the active one

function updateRunState(): void {
  const shouldRun = tabVisible && !fig01Active && !rm.matches;
  if (shouldRun) {
    startAnimationLoop(/* ctx, state, tokens */);
  } else {
    stopAnimationLoop();
  }
}

document.addEventListener('visibilitychange', () => {
  tabVisible = !document.hidden;
  updateRunState();
});

document.addEventListener(PANEL_CHANGE_EVENT, (e: Event) => {
  const detail = (e as CustomEvent<{ id: string }>).detail;
  fig01Active = detail.id === 'fig-01';
  updateRunState();
  // constellations.ts's own listener (separate) handles brighten/dim —
  // scene.ts's listener here ONLY handles the pause gate.
});

rm.addEventListener('change', () => {
  stopAnimationLoop();
  if (rm.matches) {
    renderStaticFrame(/* ... */); // one frame, no loop — same doctrine as fig01
  } else {
    updateRunState();
  }
});
```
- **`nightsky/scene.ts` does NOT need an `IntersectionObserver`** the way `fig01` does — fig01 needs it because it's a panel that scrolls in/out of a *document flow* in the non-deck (classic) fallback mode; `nightsky`'s canvas is a fixed full-viewport background that's either the whole page's backdrop or nothing (it has no independent visibility state beyond tab-hidden and reduced-motion). Do include the reduced-motion `change` listener AND the `visibilitychange` listener, both already proven necessary in `fig01`.
- **The `fig-01` pause check listens to the SAME `nightsky:panel-change` event `constellations.ts` also listens to** — these should be two independent listener registrations (pause-gate concern vs. brighten/dim concern), not conflated into one handler, for the same separation-of-concerns reason `fig01/interactions.ts` splits `updateRunState` (loop gating) from `createRedraw` (repaint-on-mutation) into separate functions.

### Anti-Patterns to Avoid
- **Importing `fig01/*` from `nightsky/*` or vice versa:** CONTEXT.md is explicit — the beam math pattern is *reimplemented*, not imported. This keeps the two engines independently testable/removable and matches the codebase's existing module-boundary discipline.
- **A per-frame probability check for "should a link fire now?" inside the rAF tick:** PITFALLS.md Pitfall 5 explicitly calls this out — use a `setTimeout`-scheduled sparse event (6-10s per CONTEXT.md) instead of rolling dice every frame.
- **Baking the camper glow as a live per-frame canvas radial gradient recomputed every tick:** wasted cost for a genuinely static visual — CSS `@keyframes` opacity pulse on a pre-authored gradient element is both cheaper and simpler.
- **Treating `prefers-reduced-motion` as "twinkle slower" instead of "no twinkle at all":** PITFALLS.md Pitfall 4 — the reduced-motion path must render Layer 0 + static stars + silhouette with NO Layer 2 elements moving, not a dampened version of Layer 2.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| RGB hex parsing + rgba() formatting | A second copy of `parseHex`/`rgba` inside `nightsky/tokens.ts` | `src/lib/shared/css-tokens.ts` (extracted from `fig01/tokens.ts`) | CONTEXT.md explicitly locks this extraction; duplicating the logic would violate the "single source of truth" doctrine already established for `tokens.css` itself |
| Beam/link "travels along a path and fires" animation math | A new geometry system for constellation link-firing | The exact `pAt`/route-segment math pattern from `fig01/model.ts` (`pAt`, elbow/segment point-at-distance sampling), reimplemented for straight star-to-star links (simpler than fig01's 3-segment elbow routes, since constellation links are direct lines, not Manhattan-routed) | Fig. 01's beam math already solves "a point of light traveling along a defined path, gradient tail + head dot" — CONTEXT.md's own guidance is to mirror this, not invent new beam math |
| Contrast-ratio computation | A hand-rolled sRGB-to-relative-luminance formula from scratch | The standard WCAG relative luminance formula (`L = 0.2126*R + 0.7152*G + 0.0722*B` after gamma-correcting each channel) applied to `getImageData()` samples, then `(L1+0.05)/(L2+0.05)` for the ratio `[CITED: W3C WCAG 2.2 Understanding SC 1.4.3, websearch-corroborated]` | This is a well-defined, standardized formula — reinventing it risks subtly wrong luminance weighting that produces a false pass |
| Idle-time scheduling primitive | A custom `requestAnimationFrame`-based idle detector | `requestIdleCallback` with a `setTimeout`-based polyfill matching its `deadline.timeRemaining()` contract | The polyfill pattern is well-established and simple; a custom rAF-based idle detector would need to reinvent the same "don't block for more than ~50ms" contract with more code and more edge cases |

**Key insight:** This phase's engineering surface is 90% "apply the pattern `fig01`/`deck.ts` already proved" and 10% genuinely new territory (the Milky Way visual technique, and the WCAG-over-canvas contrast verification script). Treat the 90% as prescriptive copying, and reserve actual exploration effort for the 10%.

## Common Pitfalls

### Pitfall 1: The Milky Way spike is treated as a formality instead of a real go/no-go gate
**What goes wrong:** The spike gets built, looks "good enough" on the developer's own bright monitor at 100% zoom, and the engine gets built around it — then it turns out visibly banded on a properly dark-calibrated display, at DPR 2, or in a full-screen screenshot review.
**Why it happens:** Banding artifacts are notoriously display-dependent (visible on some monitors/screenshots, invisible on others) and easy to miss when you already "know" what the gradient is supposed to look like.
**How to avoid:** Use the objective pass/fail bar in Architecture Pattern 1 above — check both DPR 1 and DPR 2, check a saved screenshot (not just the live canvas), and specifically look for concentric-ring artifacts in the radial-gradient glow, which is the single most common Canvas2D gradient banding failure mode.
**Warning signs:** The band looks fine live but a screenshot of it shows visible stepping when zoomed in; the effect looks different on two different displays during review.

### Pitfall 2: `requestIdleCallback` chunking is written but silently never runs on Safari
**What goes wrong:** Code is written assuming `requestIdleCallback` exists, tested only on Chrome/Firefox dev machines, and ships. On Safari (macOS + iOS) — a real fraction of this portfolio's recruiter/hiring-manager audience — the feature-detection branch either throws or the whole chunking scheme silently no-ops, potentially producing an unchunked synchronous fallback (or no generation at all) that reintroduces the exact TBT regression the chunking was meant to prevent.
**Why it happens:** `requestIdleCallback` support is easy to verify "works" without noticing the primary dev browser happens to support it while the target audience's browser doesn't.
**How to avoid:** Build the `setTimeout` fallback FIRST as the tested default, then treat `requestIdleCallback` as a progressive enhancement layered on top — not the other way around. Explicitly test the chunked-generation path with `requestIdleCallback` deleted from `window` (e.g. via DevTools console) before considering the feature done.
**Warning signs:** TBT regression appears specifically in a Safari-flavored Lighthouse run (or WebKit-based testing) but not in Chrome-based Lighthouse.

### Pitfall 3: Twinkle/firefly/beam Layer 2 code accidentally touches Layer 0's offscreen bitmap
**What goes wrong:** For convenience, a per-frame drawing function ends up drawing directly onto the same canvas/context object used for Layer 0 generation (rather than the visible canvas that Layer 0 was already blitted onto), silently regenerating or corrupting the pre-rendered starfield every frame — defeating the entire "draw once" premise and reintroducing the CPU-drain PITFALLS.md Pitfall 5 warns about.
**Why it happens:** Sharing a single `CanvasRenderingContext2D` reference between "the offscreen generation context" and "the visible per-frame context" is an easy variable-naming mistake once both exist in the same module.
**How to avoid:** Keep the offscreen generation canvas/context and the visible canvas/context as clearly separate, distinctly-named variables (e.g. `layer0Ctx` vs. `visibleCtx`) — never let the rAF tick function hold a reference to `layer0Ctx` at all, only ever `visibleCtx.drawImage(layer0Canvas, ...)`.
**Warning signs:** CPU usage stays high even after Layer 0 generation should have completed; DevTools Performance panel shows the same "star scatter" function appearing in every frame's flame graph, not just the first.

### Pitfall 4: Idle-CPU measurement (SKY-03's <10%/5min floor) has no tooling available in this environment
**What goes wrong:** CONTEXT.md's own quality-gates section already anticipates this: "document evidence... e.g. DevTools performance sample via browse tooling if it starts, else a reasoned frame-cost audit... The formal <10%/5min claim finalizes in Phase 6's live verification if tooling can't measure it locally." If the planner doesn't build in a concrete fallback measurement method, this requirement risks being left as an unverified assertion.
**Why it happens:** Sustained multi-minute CPU sampling isn't something Lighthouse's single-run TBT metric captures; it needs either a live DevTools Performance recording or a reasoned static analysis.
**How to avoid:** Plan for BOTH: (1) attempt a DevTools/`browse` tooling performance sample if available at execution time, and (2) regardless of (1)'s success, produce a written "frame-cost audit" — count exactly how many draw calls/elements Layer 2 touches per frame (≤8-8% of star count for twinkle + ≤15 fireflies + ≤1 beam + constellation tween), multiply by the per-primitive cost class already proven cheap in `fig01/render.ts` (simple arcs/gradients, no `shadowBlur`/`filter:blur()`), and reason from there to a bounded-cost conclusion. Record whichever evidence was actually obtainable, explicitly noting which one it was.
**Warning signs:** The phase's verification step reaches for a `<10% CPU>` claim with no supporting artifact in the phase directory.
**Environment note:** No Chrome DevTools MCP / `browse` daemon tooling was invoked during this research session (out of scope for research; this is an execution-time concern) — the planner should treat the DevTools-sample path as "attempt if available," not "assumed available."

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `requestIdleCallback` (browser API, not npm) | Chunked Layer-0 generation scheduling | Available in Chromium/Firefox; NOT available in Safari macOS/iOS `[CITED: MDN, caniuse — MEDIUM confidence, websearch-synthesized]` | n/a (browser API) | `setTimeout`-based polyfill matching `deadline.timeRemaining()` — REQUIRED, not optional, given this project's audience |
| `OffscreenCanvas` (browser API) | NOT required — explicitly avoided per Pattern 3 | n/a | n/a | Plain detached `<canvas>` (no feature detection needed) |
| Node.js (build) | `astro build`, `astro check` | ✓ | `>=22.12.0` per `package.json` engines `[VERIFIED: package.json]` | — |
| npm registry access | Verifying `simplex-noise` if the spike fails | ✓ (confirmed working this session — `npm view simplex-noise version` succeeded) | — | — |
| Chrome DevTools Performance panel / `browse` daemon | SKY-03 idle-CPU measurement (Pitfall 4) | Not invoked/verified during this research session (execution-time concern) | — | Reasoned frame-cost audit (see Pitfall 4) |

**Missing dependencies with no fallback:** none — every dependency in this phase has a documented fallback.

**Missing dependencies with fallback:** `requestIdleCallback` (Safari) → `setTimeout` polyfill; `OffscreenCanvas` → plain detached canvas (not actually needed, see Pattern 3); DevTools live performance sampling → static frame-cost audit.

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1` per `.planning/config.json`. This is a static, backend-free portfolio site with no user input, no authentication, and no data persistence — most ASVS categories are structurally inapplicable.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth surface exists on this site |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | No access-controlled resources |
| V5 Input Validation | Marginal — yes for the URL-hash-derived panel index (already handled by `deck.ts`, out of scope for this phase) | `resolveIndexFromHash` bounds-checks against the `panels[]` manifest, `findIndex` fallback to 0 `[VERIFIED: src/lib/nightsky/deck.ts:95-99]` — this phase adds NO new user-controllable input surface (constellation data is build-time-only, panel-change events are internally dispatched, never URL-derived) |
| V6 Cryptography | No | No cryptographic operations |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Constellation labels inadvertently exposing non-public employer/internal detail | Information Disclosure | Honesty gate already established (`experience.ts`/`patents.ts` `source:` annotations) — `constellations.ts` data must carry the same `source` field pattern, sourced ONLY from what's already public in `experience.ts`/`patents.ts`, per CONTEXT.md's explicit honesty-gate requirement and `PITFALLS.md`'s Security Mistakes table |
| `tooltipHtml`/`innerHTML`-style rendering of any new constellation label text | Tampering (XSS, low actual risk given all content is developer-authored/build-time) | Follow `fig01/interactions.ts`'s existing precedent: `writeLog` uses `textContent` only; `showTip` uses `innerHTML` ONLY because `fact.tooltipHtml` is developer-authored build-time content, never user/URL input `[VERIFIED: src/lib/fig01/interactions.ts:85-95, 117-126]`. If `constellations.ts` renders any label text, default to `textContent` unless there's a specific, deliberate reason to allow markup (matching the existing codebase convention) |

No other ASVS-relevant surface exists in this phase — the scene is entirely build-time-authored content rendered client-side with no network calls, no forms, and no dynamic data sources.

## Code Examples

### Layer 0 chunked generation with `requestIdleCallback` + fallback
```typescript
// nightsky/starfield.ts — pattern only; exact star count/params are
// Claude's-discretion per CONTEXT.md.
type IdleDeadlineLike = { timeRemaining: () => number; didTimeout: boolean };

function requestIdle(cb: (deadline: IdleDeadlineLike) => void): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(cb);
  } else {
    // Safari fallback — mirrors the standard requestIdleCallback polyfill shape.
    const start = Date.now();
    setTimeout(() => {
      cb({ timeRemaining: () => Math.max(0, 50 - (Date.now() - start)), didTimeout: false });
    }, 1);
  }
}

function generateLayer0Chunked(
  ctx: CanvasRenderingContext2D,
  starQueue: StarSpec[],
  onDone: () => void
): void {
  let i = 0;
  function step(deadline: IdleDeadlineLike): void {
    while (i < starQueue.length && deadline.timeRemaining() > 0) {
      drawStar(ctx, starQueue[i]);
      i++;
    }
    if (i < starQueue.length) {
      requestIdle(step);
    } else {
      drawMilkyWayBand(ctx); // final chunk — the spiked technique
      onDone();
    }
  }
  requestIdle(step);
}
```

### Worst-case contrast verification (SKY-05 — sketch for a verification script, not runtime code)
```typescript
// Verification-time only (dev script / QA step), not shipped runtime code.
// Source pattern: WCAG 2.2 Understanding SC 1.4.3 relative luminance formula.
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1: number, l2: number): number {
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

// Sample every pixel in a text region's bounding box (post-scrim, actual
// rendered canvas), find the WORST (highest-luminance, since text is light
// on dark here) pixel, and check it against --ink's luminance.
function worstCaseContrastInRegion(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  textLuminance: number
): number {
  const { data } = ctx.getImageData(x, y, w, h);
  let worst = Infinity;
  for (let i = 0; i < data.length; i += 4) {
    const l = relativeLuminance(data[i], data[i + 1], data[i + 2]);
    const ratio = contrastRatio(textLuminance, l);
    if (ratio < worst) worst = ratio;
  }
  return worst; // must be >= 4.5 (normal text) or >= 3 (large text)
}
```

### Constellation link-firing (mirrors `fig01/model.ts`'s `pAt`/beam pattern, reimplemented not imported)
```typescript
// nightsky/constellations.ts — straight-line version of fig01/model.ts's
// pAt (route point-at-distance sampler). Links here are direct star-to-star
// segments, not fig01's 3-segment elbow routes, so this is simpler.
function pointAtDistance(
  x1: number, y1: number, x2: number, y2: number, d: number
): [number, number] {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const t = len === 0 ? 0 : Math.min(1, Math.max(0, d / len));
  return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
}
// Firing: gradient tail + head dot, exact same visual treatment as
// fig01/render.ts's drawBeams — accent-colored, globalCompositeOperation
// = 'lighter', head dot brighter than tail. See src/lib/fig01/render.ts
// drawBeams (lines 203-237) for the full drawing pattern to mirror.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `shadowBlur`/CSS blur filters for glow/bloom effects | Layered radial-gradient fills at decreasing alpha | Already established in `fig01/render.ts` (node glow halo) and reaffirmed by `STACK.md`'s "What NOT to Use" | Directly reusable — the camper glow and star glow should use the same layered-gradient technique, not a blur filter |
| Synchronous unchunked procedural generation on load | `requestIdleCallback`/`setTimeout`-sliced chunked generation | Established web-perf best practice (Chrome DevRel, MDN); this project's own Phase 4 CLS incident (`lighthouse-scores.md`) is a directly analogous cautionary tale — an unguarded synchronous pattern caused a measured Lighthouse regression from 100→76 until fixed | This phase should build chunking in from the start rather than retrofit it after a Lighthouse regression, learning directly from Phase 4's own documented incident |

**Deprecated/outdated:** None specific to this phase's domain — Canvas2D, `requestAnimationFrame`, and `requestIdleCallback` are all stable, mature web-platform APIs with no pending deprecation.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Power-law magnitude distribution formula (`Math.pow(Math.random(), N)`, N≈2.5-4) and specific radius/alpha mapping | Pattern 2 (Star field realism) | Low — purely a visual-tuning parameter, easily adjusted during the spike/implementation without any architectural consequence |
| A2 | Color-temperature HSL hue-range approach (200°-40° through white, weighted toward neutral) | Pattern 2 (Star field realism) | Low — same as A1, a tunable visual parameter with no functional/accessibility consequence |
| A3 | No single authoritative Milky Way Canvas2D compositing recipe exists — the scatter+gradient technique is a synthesis, not a verified pattern | Pattern 1, Summary | Medium — this is exactly why CONTEXT.md gates it behind a spike; if the technique fails outright even after the recovery ladder, the phase needs the `simplex-noise` fallback, which is already pre-audited in this document to reduce that risk |
| A4 | `OffscreenCanvas` Safari support figures (16.4+) and `requestIdleCallback` Safari non-support | Standard Stack Alternatives, Pattern 3, Environment Availability | Medium — sourced from websearch synthesis of caniuse/MDN summaries, not a direct fetch of caniuse.com or MDN this session; if Safari's actual support differs, the `setTimeout` fallback path is harmless overhead either way (feature-detection means it only activates where needed), so the risk is bounded even if the specific version number is slightly off |

**If this table is empty:** N/A — see entries above.

## Open Questions

1. **Exact chunk size / batch granularity for Layer 0 generation**
   - What we know: chunking must keep any single synchronous unit of work under ~50ms; `requestIdleCallback`'s `timeRemaining()` gives a live budget signal.
   - What's unclear: the exact number of stars per batch that's optimal — this depends on per-star draw cost, which is itself dependent on the final drawing technique chosen by the Milky Way spike.
   - Recommendation: Claude's discretion at implementation time — write the chunking loop to check `deadline.timeRemaining()` per-star (not per fixed batch size) so it self-adjusts regardless of per-star cost; no fixed constant needs to be decided during planning.

2. **Whether the silhouette's warm glow should be a CSS pseudo-element or an inline SVG `<filter>`**
   - What we know: both approaches avoid per-frame canvas cost (Pattern 5); CONTEXT.md leaves this as planner's/Claude's discretion.
   - What's unclear: which renders more consistently across browsers for a soft radial glow — CSS `radial-gradient` background is simpler and has zero cross-browser risk; SVG `<feGaussianBlur>` filters have historically had minor rendering inconsistencies across browsers for filter regions.
   - Recommendation: default to a CSS `radial-gradient` pseudo-element (simpler, zero filter-region edge cases) unless the visual design during implementation specifically needs SVG-filter-only capabilities.

## Sources

### Primary (HIGH confidence)
- `src/lib/fig01/tokens.ts`, `src/lib/fig01/render.ts`, `src/lib/fig01/interactions.ts`, `src/lib/fig01/model.ts`, `src/lib/fig01/index.ts` — directly read this session, the load-bearing prior-art for nearly every architectural pattern in this document
- `src/lib/nightsky/deck.ts`, `src/data/panels.ts` — directly read this session, the shipped `nightsky:panel-change` event contract and panel manifest this phase consumes
- `src/styles/tokens.css`, `src/styles/deck.css` — directly read this session, confirms z-index/stacking context and the zero-hex-literal token doctrine
- `.planning/phases/04-deck-mechanics/lighthouse-scores.md` — directly read this session, the CLS/TBT incident directly informing this phase's chunked-generation urgency
- `npm view simplex-noise` (version, time.created, repository.url, scripts.postinstall) — directly executed this session against the live npm registry

### Secondary (MEDIUM confidence)
- MDN `OffscreenCanvas`, caniuse.com/offscreencanvas (via websearch synthesis) — Safari 16.4+ support figure
- MDN `Window.requestIdleCallback`, W3C requestidlecallback spec (via websearch synthesis) — 50ms deadline cap, Safari non-support
- W3C WAI "Understanding Success Criterion 1.4.3: Contrast (Minimum)" (via websearch synthesis) — relative luminance formula, worst-case verification requirement
- `.planning/research/STACK.md`, `.planning/research/PITFALLS.md` (v2.0, already-committed project research) — carried-forward architecture/pitfall guidance for this milestone

### Tertiary (LOW confidence)
- Websearch synthesis on Canvas2D starfield magnitude/color/twinkle techniques (CodePen/dev.to/blog sources, no single authoritative reference) — flagged `[ASSUMED]` throughout Pattern 2
- Websearch synthesis on Milky Way Canvas2D compositing specifically — confirmed no authoritative recipe exists, which is itself the actionable finding (justifies the spike-first sequencing)

## Metadata

**Confidence breakdown:**
- Standard stack / architecture: HIGH — grounded directly in shipped, working code in this repository (`fig01/*`, `deck.ts`)
- Milky Way technique: LOW — explicitly unresolved, which is why CONTEXT.md gates it behind a spike; this research defines the spike's pass/fail bar rather than the technique itself
- Browser API support (OffscreenCanvas, requestIdleCallback): MEDIUM — websearch-synthesized against MDN/caniuse, not directly fetched this session
- Security: HIGH — static-site threat surface is narrow and well-understood; directly cross-checked against existing honesty-gate precedent in `experience.ts`/`patents.ts`

**Research date:** 2026-07-17
**Valid until:** 30 days for architecture/pitfalls guidance (stable web-platform APIs); the Milky Way technique specifically has no "valid until" — it resolves at spike time, not from this research
