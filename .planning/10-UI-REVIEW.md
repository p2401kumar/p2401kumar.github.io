# v3.0 "Real Sky" — Retroactive UI Review (Phase 10 audit)

> **STATUS UPDATE (2026-07-19): BLOCKER → FIXED-LOCALLY, pending redeploy.**
> All three findings remediated on local main (commits 15aaf62 / 71cc35d /
> 467d9a4) and the demanded perceptual gate shipped (8738d33,
> `scripts/verify-visibility.mjs` — GREEN at 1440/1280/375 with both selftest
> controls failing correctly). Full re-gate record + before/after evidence:
> `.planning/quick/2026-07-19-sky-visibility-fix/SUMMARY.md`. The LIVE site
> still serves the broken build — **redeploy is user-gated** (nothing pushed).

**Audited:** 2026-07-19
**Baseline:** 05/07/08 UI-SPECs + live site https://p2401kumar.github.io/
**Evidence:** `.planning/ui-review-evidence/` (headless-Chrome captures of the LIVE site + raw-asset reference render + CDP settled-state probes)
**Driving complaint (user, verbatim):** "the website background is not visible at all, not starry stuff or camper or milky way. please add testing to verify output from testing in visually instead of by vibes."

**The complaint is confirmed, on every viewport, in the fully settled, healthy-load state.** And the primary cause is NOT the fade fragility or the mobile crop (both real, both secondary) — it is that Phase 8 attached `backdrop-filter: blur(12px)` to the **full-viewport active panel**, which permanently blurs the entire night sky into featureless blobs behind every panel of the deck.

---

## Overall: 17/24 → headline defect is a single BLOCKER

| Pillar | Score | Key finding |
|---|---|---|
| 1. Visual hierarchy | 2/4 | Type hierarchy excellent; the scene that IS the product's credibility layer is erased |
| 2. Color / contrast | 1/4 | Text contrast passes 4.5:1 everywhere — and the background fails perceptual visibility everywhere (BLOCKER) |
| 3. Typography | 4/4 | Serif display + mono system reads exactly to spec |
| 4. Spacing / layout | 3/4 | Clean and generous; header wordmark sits flush at x=0 (appears clipped) in all captures |
| 5. Motion | 2/4 | Fade pattern is opacity-0-pinned by design; pre-hydration ghost-flash of all 7 panels stacked |
| 6. Accessibility | 3/4 | RM/reduced-transparency/print degradations all correctly authored; panel hiding is JS-applied (`data-state` absent in server HTML) |

---

## ROOT CAUSE (BLOCKER) — full-viewport glass blur erases the sky

`src/styles/deck.css` §8 (lines 202–208):

```css
html.deck-active .panel[data-state="active"],
html.classic-active .panel {
  background-color: var(--glass-bg);           /* white 0.06 */
  backdrop-filter: blur(var(--glass-blur))     /* 12px */
                   saturate(150%) brightness(0.90);
}
```

`.panel` is a **full-viewport** element. The active panel therefore applies a 12px backdrop blur + 0.90 brightness + a white haze fill across 100% of the screen, over the photo, the canvas (stars/moon/aurora/meteors), and the camper (all in `.nightsky-host`, z-index −1). Stars are 1–2px point sources; a 12px blur averages them to nothing. The Milky Way core survives only as a soft bright blob at the right edge.

**Proof (settled state, live site, img loaded, opacity 1 — `probe-desktop.png` vs raw asset `avif-direct.png`):**

| Region | Metric | Raw photo | Live page | Verdict |
|---|---|---|---|---|
| Right band zone (78–100% x) | mean lum | 48.4 | 46.9 | brightness is NOT the problem |
| Right band zone | luminance range | **186.0** | **67.3** | structure destroyed (blur) |
| Left starfield margin | luminance range | **165.7** | **63.2** | every star gone |
| Left starfield margin | p95 lum | 63.0 | 71.8 | haze lifted floor, detail flattened |

Mean luminance on the live page is actually *equal or higher* than the raw photo (the white glass fill adds haze) — which is exactly why every existing ratio/ceiling gate passed. The sky is not too dark; it is **blurred flat**. This also explains why Phase 7's careful object-position ladder (band in the right margin) bought nothing: the band it positions is behind the blur on every panel including the hero.

Note the design's own intent contradicts this: the 05 pitfalls explicitly say "flat gradient only — never a blur filter" for the scrim, and 08's tiering carefully avoided blurring 7 panels — but nobody noticed tier-1 still blurs 100% of the viewport behind the ONE active panel, i.e. always.

## Per-element visibility verdicts (settled healthy state)

| Element | Desktop 1440/1280 | Mobile 375 |
|---|---|---|
| Milky Way band/core | **faint** — structureless bright blob at right edge | **invisible** — crop (10% 70%) points at quiet region; nothing survives blur |
| Stars (photo + canvas) | **invisible** (zero point sources in any capture) | **invisible** |
| Camper silhouette | **invisible** (blurred + tone-on-tone) | **invisible** |
| Camper window glow | **faint** — unidentifiable orange smudge | **faint** orange smudge |
| Aurora / moon / meteors (canvas) | **invisible** (behind blur) | **invisible** |
| Mobile vs desktop | Desktop at least shows tonal variation (full-frame 26% px above base+14) | Mobile sky regions are a flat gradient; camper-box 16% vs desktop 24%, lower-sky essentially at base. Materially emptier — the user's phone experience is a blank navy wall |

## SECONDARY FINDING (WARNING) — the fade fragility (orchestrator's hypothesis, confirmed but not the cause)

`NightSky.astro` lines 160–181: `.sky-photo img` has **no base opacity declaration**; visibility depends entirely on `animation: sky-photo-fade 400ms ... both` whose 0% keyframe is `opacity: 0`. Confirmed in the built stylesheet on the live site.

- **Background tab at load:** CSS animation clocks keep advancing while hidden (they are time-based, not rAF-based), so on focus the animation is past its end and `fill: both` holds opacity 1 — **self-heals**. Low severity.
- **Frozen-timeline / animation-suppressed environments** (energy-saver freeze, some capture/preview surfaces, forced `animation-play-state` tooling): the 0% keyframe + `fill: both` pins the img at **opacity 0 indefinitely**. Our own `--virtual-time-budget` captures reproduced a no-photo state.
- **LQIP behavior at opacity 0:** the wrapper's data-URI background DOES paint (measured mean luminance 27.7/255 vs base 17.7 — dark but present). So in the fade-failure state the user sees dark featureless blobs — which is also, coincidentally, what the blur produces in the healthy state. Two independent paths to the same "nothing there" percept.

The inverse pattern is strictly safer and costs nothing (see remediation 2).

## TERTIARY FINDINGS

- **WARNING — pre-hydration ghost flash:** server HTML carries no `data-state` on panels; `.panel` hiding is JS-applied. Early captures (`mobile-375-hero-realtime.png`) show all 7 panels' text stacked and legible through the hero. On slow devices this is a real, visible boot flash of overlapping text.
- **INFO — header wordmark flush at x=0** in every capture ("prateek kumar" touches the viewport edge; looks clipped).
- **INFO — canvas layers can't be judged at all** while the blur stands; re-audit aurora/moon/meteor tuning after remediation 1.

---

## Remediation plan (ranked)

### 1. Rescope the glass (fixes the complaint) — BLOCKER
Remove `backdrop-filter` from the full-viewport tier-1 panels. Options in preference order:
   a. **Glass on content surfaces only:** move blur+fill to an inner content wrapper sized to the text column (a real "card"), leaving the panel itself transparent. The sky stays crisp in the margins where Phase 7 placed the band.
   b. **Minimum diff:** delete `backdrop-filter`/`-webkit-backdrop-filter` and `background-color` from the tier-1 rule (deck.css 202–208), keep the scrim; keep tier-2's translucent `--glass-bg-2` fill for dense-prose panels but **drop its blur too** (a 0.55-alpha fill alone protects text and passes contrast).
   Tradeoff: re-run the contrast screenshot gate; hero/systems already pass on scrim alone per Phase 5 evidence.

### 2. Fade robustness — WARNING
```css
.sky-photo img {
  opacity: 1;                       /* visible is the default state */
  animation: sky-photo-fade 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes sky-photo-fade { from { opacity: 0; } to { opacity: 1; } }
```
(Identical visuals; if the animation never runs, the photo shows instead of vanishing. RM override becomes redundant but harmless.)

### 3. `scripts/verify-visibility.mjs` — the perceptual gate the user demanded
Per-viewport (1440×900, 1280×800, 375×812) + reduced-motion variant, CDP `Page.captureScreenshot` (the repo's proven pattern), two capture instants (t≈0 for LQIP/fade-ramp floor; t>2s settled):
- **Region floors** (regions from the 07 placement ladder): band-zone `mean ≥ base+20` AND **luminance range ≥ 120** (the structure metric that catches blur — ratios cannot); starfield margins `≥0.5%` of pixels above base+14 as isolated ≤3px components (star count); camper box: Sobel-edge density above threshold against its backdrop (silhouette detectability); aurora box: hue-shifted pixel presence during its window.
- **Reference stills:** SSIM ≥ 0.90 against blessed captures in `scripts/fixtures/visibility-refs/`; `--bless` re-captures and overwrites refs only on explicit human sign-off (print a side-by-side path, require `--bless --yes`).
- **Selftest:** a control run against a synthetically blacked-out page (CSS injection `.sky-photo{display:none}`) MUST fail every floor; a blur-injection control (`backdrop-filter: blur(12px)` on body) MUST fail the range/star-count floors. Gate is invalid if either control passes.
- Wire into the standing battery next to verify-contrast/verify-banding so "invisible background" is a hard red forever.

### 4. Mobile crop + grade review — after #1
Re-capture 375px with blur gone; the quiet-crop (10% 70%) region does contain stars in the raw master (left-margin: 27.6% px above threshold, range 166). If the new gate's star-count floor still fails at 375, options: (i) shift tier to ~20% 45% to catch band edge in the top margin (re-run contrast), (ii) a brighter mobile grade variant master (midtone ×0.90, desat ×0.5), (iii) drop mobile scrim peak 0.38→0.30. State the contrast-floor tradeoff in whichever is picked.

### 5. Desktop grade brightness — likely NO-OP
Raw-vs-live means (48.4 vs 46.9) show the grade itself meets "same campsite, clearer night" — defer to the new gate after #1 before touching `build-sky.mjs`.

## Why the process missed it (honest)

Every automated gate in the battery measures ratios and ceilings — contrast ≥ 4.5, moonPeak < mwPeak, auroraPeak < mwPeak — all of which improve, or at worst hold, as the background loses structure; a fully invisible sky is the gate battery's global optimum. The one instrument that could have caught it — a human (or perceptual metric) looking at a settled screenshot and asking "can I see the Milky Way?" — was auto-resolved in autonomous mode, so the "eyeball checkpoints" were the agents' own vibes, sampled from the same screenshots they were already passing. The mobile tier was never perceptually judged at all, only contrast-judged; and Phase 8's glass gate verified text-over-glass legibility, never sky-through-glass visibility — the exact inverse of the product's stated core value.

## Evidence index (`.planning/ui-review-evidence/`)

| File | What it shows |
|---|---|
| `probe-desktop.png` | Settled healthy state, 1440×900, img opacity 1 & loaded (CDP-verified) — sky still blobs |
| `probe-mobile.png` | Settled healthy state, 375×812 — featureless gradient, orange smudge |
| `avif-direct.png` | Raw 1920 AVIF rendered by the same headless Chrome — crisp stars + bright core (the asset is fine) |
| `desktop-1440-hero.png` / `desktop-1280-hero.png` / `desktop-1440-systems.png` | CLI captures, hero + mid-deck |
| `desktop-1440-hero-rm.png` | Reduced-motion (opacity forced 1) — identical blobs, exonerating the fade as primary cause |
| `mobile-375-hero-realtime.png` / `mobile-375-systems.png` | Pre-hydration ghost-flash of stacked panel text |
