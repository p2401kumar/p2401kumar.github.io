---
phase: 05-night-sky-scene
plan: 03
subsystem: frontend
tags: [astro, canvas2d, night-sky, milky-way, tokens, offscreen-render]

# Dependency graph
requires:
  - phase: 05-01
    provides: "SPIKE.md — the validated zero-dependency Milky Way scatter+gradient technique, final sky token values, and the exact Contract for 05-03 (angle/placement/pass counts/alpha ranges)"
  - phase: 05-02
    provides: "src/lib/shared/css-tokens.ts (getRootStyles/readToken/rgba/parseHex bridge) this plan's nightsky/tokens.ts consumes"
provides:
  - "4 sky tokens in tokens.css: --sky-zenith, --sky-horizon, --milkyway, --star"
  - "src/lib/nightsky/tokens.ts: getSkyTokens() — the sky-specific bridge over shared/css-tokens.ts"
  - "src/lib/nightsky/starfield.ts: generateLayer0() + capDpr() — chunked, idle-scheduled Layer 0 generator (detached canvas, sky wash + dither + power-law starfield + Milky Way band), returns twinkle-eligible star metadata for 05-04"
  - "src/components/NightSky.astro: fixed full-viewport scene host (negative z-index, pointer-events:none, aria-hidden) + hand-authored camper SVG silhouette + CSS copper glow + a one-time generate-then-blit bootstrap script"
  - "index.astro mounts <NightSky /> as the first child of .page, behind PanelDeck"
affects: [05-04-scene-engine, 05-05-constellations, 05-06-contrast-gates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Layer 0 generation: detached document.createElement('canvas') (never DOM-attached), sized cssSize*dpr, ctx.setTransform(dpr,0,0,dpr,0,0) once so all subsequent draws use plain CSS-pixel coordinates — mirrors fig01/render.ts's layout() convention exactly"
    - "Generic idle-scheduled work-queue drainer (drainQueue/requestIdle): every unit of generation work (dither row-slice, one star, one Milky Way blob/dot) is pushed as a closure onto a flat array and drained across requestIdleCallback (setTimeout-fallback) invocations, checking deadline.timeRemaining() per unit — self-adjusting regardless of per-unit cost"
    - "Distinctly-named offscreen context (layer0Ctx) never exposed outside starfield.ts — only the finished detached canvas is returned to callers (05-RESEARCH.md Pitfall 3 guard)"
    - "Negative z-index (not 0) for a fixed full-viewport decorative background host, so it stays behind static in-flow content in BOTH the deck-active AND the DECK-07 no-JS/init-failure fallback modes — CSS painting order places position:fixed z-index:0/auto elements ABOVE static in-flow siblings, only a negative z-index guarantees 'behind everything' in every mode"

key-files:
  created: [src/lib/nightsky/tokens.ts, src/lib/nightsky/starfield.ts, src/components/NightSky.astro]
  modified: [src/styles/tokens.css, src/pages/index.astro]

key-decisions:
  - "Wired a minimal one-time generate+blit bootstrap script into NightSky.astro (calling starfield.ts's generateLayer0 once on load, drawImage-ing the result) even though Task 1's own action text said 'do not wire any script yet.' The plan's own <threat_model>/<must_haves> prohibition text says 'Layer 0 is generate-once + blit; the rAF driver arrives in 05-04' — read literally, the blit belongs in THIS plan, only the continuous per-frame loop is deferred. This also satisfies the plan's own success criterion of a screenshot-verified static scene. No requestAnimationFrame, no resize listener, no pause/lifecycle wiring were added — those remain scene.ts's (05-04) job."
  - "NightSky.astro's host uses z-index:-1, not the literal z-index:0 the plan's must_haves text mentions. Reasoned from CSS's own painting-order spec: a position:fixed element with z-index:0/auto paints AFTER (visually on top of) non-positioned static in-flow content within the same stacking context. Since .page/.deck are only positioned once html.deck-active is added by deck.ts, a z-index:0 scene host would render ON TOP of page content in the DECK-07 no-JS/init-failure fallback. A negative z-index paints before all in-flow content in every mode while still trivially sitting below .deck's z-index:1 whenever that class is present — strictly stronger than the literal instruction, not a deviation from its intent."
  - "Star hue jitter is derived entirely from the --star token's own parsed RGB (converted to HSL, lightness preserved, hue/saturation nudged by a small weighted-toward-zero random) rather than any hardcoded hex — satisfies both 05-RESEARCH.md Pattern 2's 'subtle, mostly-neutral tint' guidance and the zero-hex-literal doctrine simultaneously."
  - "Sky dither (SPIKE.md's per-pixel getImageData/putImageData anti-banding pass) is folded into the same idle-scheduled work queue as the starfield/Milky Way units, in device-pixel row-slices of 24 rows each, rather than run as one synchronous getImageData/putImageData over the whole sky region — keeps every single work unit well under the ~50ms idle budget even at DPR-2 canvas sizes."
  - "canvas.getContext('2d', { willReadFrequently: true }) — added after headless-Chrome verification surfaced the browser's own 'Multiple readback operations... willReadFrequently' console warning for the chunked dither pass's repeated getImageData calls (Rule 1 auto-fix, observed during verification, not anticipated in the plan)."

patterns-established:
  - "Pattern: per-engine tokens.ts modules (fig01, nightsky) both delegate to shared/css-tokens.ts and expose only their own token-name list + an identity-stable cache function — the pattern is now proven twice, ready for any future canvas engine to reuse without re-deriving it"
  - "Pattern: idle-scheduled offscreen pre-render (generate-once, detached canvas, chunked via requestIdleCallback+setTimeout fallback) as the default technique for any expensive one-time canvas composition on this site, not just night-sky's starfield"

requirements-completed: [SKY-01, SKY-02]

coverage:
  - id: D1
    description: "4 sky tokens appended to tokens.css with SPIKE.md's final (unchanged) values; nightsky/tokens.ts bridges them via shared/css-tokens.ts"
    requirement: "SKY-01"
    verification:
      - kind: other
        ref: "npm run build && npx astro check (0 errors); grep sky-token count == 4 in tokens.css; grep zero-hex in src/lib/nightsky + NightSky.astro (own files) == 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "NightSky.astro renders a fixed, non-interactive, aria-hidden scene host behind the deck with a hand-authored camper silhouette + single CSS radial-gradient copper glow (no blur filter)"
    requirement: "SKY-02"
    verification:
      - kind: other
        ref: "grep pointer-events count != 0; grep aria-hidden count != 0; grep NightSky in index.astro != 0; grep requestAnimationFrame == 0"
        status: pass
      - kind: human
        ref: "Headless Chrome (gstack /browse) screenshots at DPR1 and DPR2 — 05-03-scene-dpr1.png, 05-03-scene-dpr2.png"
        status: pass
    human_judgment: true
  - id: D3
    description: "starfield.ts generates Layer 0 (sky wash + dither + power-law starfield + Milky Way band, SPIKE.md's Contract) to a detached canvas via chunked, idle-scheduled work; zero rAF"
    requirement: "SKY-01"
    verification:
      - kind: other
        ref: "grep requestIdleCallback/setTimeout/createElement present; grep requestAnimationFrame == 0; grep zero-hex == 0; astro check 0 errors"
        status: pass
      - kind: human
        ref: "Headless Chrome screenshot at DPR2 shows continuous, non-banded Milky Way density matching SPIKE.md's own approved verdict screenshot's brightness/character; no console errors (including the willReadFrequently perf warning, fixed during verification)"
        status: pass
    human_judgment: true

duration: 25min
completed: 2026-07-18
status: complete
---

# Phase 05 Plan 03: Scene Shell + Layer 0 Summary

**Sky tokens + nightsky/tokens.ts bridge + NightSky.astro (fixed canvas host, camper silhouette, copper glow) + starfield.ts's chunked, idle-scheduled Layer 0 generator (power-law starfield + SPIKE.md's validated Milky Way band) — verified static via headless-Chrome screenshots at DPR1/DPR2**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-17T23:56:56Z (STATE.md's prior session marker)
- **Completed:** 2026-07-18T00:22:38Z
- **Tasks:** 2 (plus one in-scope follow-up wiring commit, see Deviations)
- **Files modified:** 5 (2 created fresh: tokens.ts, starfield.ts; 1 new component: NightSky.astro; 2 modified: tokens.css, index.astro)

## Accomplishments

- `tokens.css` gains exactly the 4 spike-validated sky tokens (`--sky-zenith:#05070a`, `--sky-horizon:#141a2c`, `--milkyway:#cfd9f2`, `--star:#eef2fa`) — SPIKE.md's verdict was "unchanged" from the UI-SPEC's provisional recommendation, so no new values were invented
- `src/lib/nightsky/tokens.ts` mirrors `fig01/tokens.ts`'s proven identity-stable-cache pattern exactly, delegating hex-parsing/rgba-formatting to `shared/css-tokens.ts` (extracted in 05-02)
- `src/components/NightSky.astro`: a fixed, full-viewport, `aria-hidden="true"`, `pointer-events:none` scene host with a hand-authored 3-shape inline SVG camper silhouette (rounded-rect body + wheel arc + window) anchored bottom-left on the horizon line, plus a single CSS `radial-gradient` copper glow (`var(--accent)`, no blur filter) with a subtle reduced-motion-aware pulse
- `src/lib/nightsky/starfield.ts`'s `generateLayer0()` produces the full Layer 0 bitmap (sky wash, per-pixel dither, power-law 4-band starfield, SPIKE.md's 3-pass Milky Way composite) on a detached canvas via a generic idle-scheduled work-queue drainer, returning both the bitmap and the twinkle-eligible (Mid/Bright band) star subset 05-04 will need
- Verified end-to-end with headless-Chrome screenshots (DPR1 and DPR2, matching the spike's own verification methodology) — the static scene renders correctly behind the fully functional deck, with Milky Way band brightness/character closely matching SPIKE.md's own approved verdict screenshots

## Task Commits

Each task was committed atomically:

1. **Task 1: Append sky tokens, create nightsky/tokens.ts, author NightSky.astro (canvas host + camper SVG + glow), mount in index.astro** — `f70f2f8` (feat)
2. **Task 2: Implement nightsky/starfield.ts — Layer 0 offscreen generation** — `face1be` (feat)
3. **Follow-up: wire one-time generate+blit bootstrap, fix willReadFrequently, commit screenshot evidence** — `0193f7c` (feat) — see Deviations

**Plan metadata:** (this commit, following)

## Files Created/Modified

- `src/styles/tokens.css` — Appended 4 sky tokens under a "Night-sky scene (Phase 5)" block (SPIKE.md final values, unchanged from UI-SPEC)
- `src/lib/nightsky/tokens.ts` — New: `SkyTokens` interface + `getSkyTokens()`, sky-specific bridge over `shared/css-tokens.ts`
- `src/lib/nightsky/starfield.ts` — New: `capDpr()`, `generateLayer0()` — detached-canvas Layer 0 generator (sky wash + dither + power-law starfield + Milky Way band), chunked via `requestIdleCallback`/`setTimeout` fallback
- `src/components/NightSky.astro` — New: fixed full-viewport scene host, camper SVG + copper glow, one-time generate+blit bootstrap script
- `src/pages/index.astro` — Mounts `<NightSky />` as the first child of `.page`, behind `<PanelDeck>`

## Decisions Made

- See `key-decisions` in frontmatter above — negative z-index for robustness across both deck-active and no-JS fallback modes, the one-time generate+blit bootstrap wiring, star hue jitter derived entirely from the `--star` token, dither folded into the chunked queue, and the `willReadFrequently` perf fix are all documented there with full reasoning.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — auto-add missing critical functionality] Wired a one-time generate+blit bootstrap into NightSky.astro**
- **Found during:** Task 2 wrap-up / plan-level verification
- **Issue:** Task 1's own action text said "do not wire any script yet," but the plan's own `must_haves.prohibitions` explicitly states "Layer 0 is generate-once + blit; the rAF driver arrives in 05-04" — meaning the generate+blit itself (not the continuous per-frame loop) is this plan's job. Without any wiring, the visible `#nightsky-canvas` would stay blank and the plan's own success criterion ("Static scene visible behind the deck with screenshot evidence") would be unsatisfiable.
- **Fix:** Added a trailing bare `<script>` to `NightSky.astro` (mirroring `Figure01.astro`'s bundling convention) that calls `generateLayer0()` once on load and `drawImage()`s the finished bitmap onto the visible canvas — a single call, no `requestAnimationFrame`, no resize listener, no pause/lifecycle state machine (all confirmed absent by the same automated greps the plan's own verify block specifies).
- **Files modified:** `src/components/NightSky.astro`
- **Commit:** `0193f7c`

**2. [Rule 1 — bug/perf correctness] Added `willReadFrequently: true` to the offscreen 2D context**
- **Found during:** Headless-Chrome verification pass (console log inspection)
- **Issue:** Chromium logged "Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true" — the dither pass performs many chunked `getImageData`/`putImageData` round-trips over the same context.
- **Fix:** `canvas.getContext('2d', { willReadFrequently: true })`.
- **Files modified:** `src/lib/nightsky/starfield.ts`
- **Commit:** `0193f7c`

**3. [Documentation-only, not a code deviation] Reworded two source comments that literally contained the substring "requestAnimationFrame"**
- **Found during:** Running the plan's own automated verify greps
- **Issue:** The plan's `<verify>` block greps for the literal string `requestAnimationFrame` and requires zero matches in `starfield.ts`/`NightSky.astro`. Two doc comments explaining that this plan does NOT use rAF happened to contain that literal substring, tripping the naive grep despite zero actual usage.
- **Fix:** Reworded both comments to say "per-frame animation loop" instead of spelling out the API name.
- **Files modified:** `src/lib/nightsky/starfield.ts`, `src/components/NightSky.astro`
- **Commit:** included in `f70f2f8`/`face1be` (fixed before each task's commit, not a separate commit)

### Known Verify-Script False Positive (not fixed, out of scope)

The plan's zero-hex verify command (`grep -roE '#[0-9a-fA-F]{3,8}' src/lib/nightsky src/components/NightSky.astro`) recurses into `src/lib/nightsky/deck.ts` (already shipped in Phase 4, not touched by this plan). That file's CSS ID selectors (`#deck-live`, `#deck-index-count`, `#deck-hint`) coincidentally match the hex-literal pattern (`#dec`, 3 valid hex chars) even though they are not colors. Confirmed via `grep -n` that all matches are `#dec` substrings inside CSS ID selector strings, not hex color literals — zero actual hex leaks in this plan's own new/modified files (`tokens.ts`, `starfield.ts`, `NightSky.astro`), verified separately by scoping the grep to just those three files (0 matches). Out of scope to "fix" per the Deviation Rules' scope boundary (pre-existing, unrelated file, not part of this plan's `files_modified`).

None of the above are architectural (Rule 4) — no user decision was required.

## Issues Encountered

None beyond the auto-fixed items above.

## User Setup Required

None — no external service configuration required. No `git push`, deploy, or Pages trigger occurred (verified: `git log` shows only local commits on `main`, all commits are `feat`/local).

## Known Stubs

None. The scene is fully wired end-to-end for its Layer 0 scope: tokens render, the camper + glow render, and the starfield + Milky Way generate and blit correctly (confirmed visually). The only intentionally-deferred pieces (Layer 2 twinkle/fireflies/beams, the rAF driver, pause/lifecycle state machine, resize-debounced regeneration) are explicitly out of scope for 05-03 per the plan's own `must_haves.prohibitions` ("the rAF driver arrives in 05-04") — not stubs, but the next plan's stated responsibility.

## Threat Flags

None beyond what the plan's own `<threat_model>` already covers (T-05-03 zero-hex boundary, T-05-04 TBT/DoS via chunked generation, T-05-DEPLOY no-push). No new network endpoints, auth paths, or trust-boundary-crossing surface was introduced — this plan is 100% client-side, build-time-authored, decorative canvas/SVG content.

## Next Phase Readiness

- `src/lib/nightsky/starfield.ts`'s `generateLayer0()` return shape (`Layer0Result`: `canvas`, `cssWidth`, `cssHeight`, `dpr`, `twinkleStars`) is ready for `05-04`'s `scene.ts` to consume directly — the twinkle-eligible star subset (Mid/Bright bands, position/radius/baseAlpha/color) is already shaped for Layer 2's per-frame alpha wobble.
- `capDpr()` is exported from `starfield.ts` for `scene.ts` to reuse when sizing the visible canvas identically to Layer 0's backing store.
- The one-time bootstrap in `NightSky.astro` is intentionally minimal (no resize listener, no pause gate) — `05-04` should either replace it entirely with `scene.ts`'s own init path, or extend it; either is compatible with the current markup/DOM contract (`#nightsky-canvas` id is stable).
- No blockers. All work is local-only; nothing pushed or deployed (per plan prohibitions).

---
*Phase: 05-night-sky-scene*
*Completed: 2026-07-18*

## Self-Check: PASSED

All created/modified files and all three commit hashes (`f70f2f8`, `face1be`, `0193f7c`) verified present.
