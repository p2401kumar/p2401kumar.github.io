# Phase 7: Real-Sky Foundation - Research

**Researched:** 2026-07-18
**Domain:** Build-time astrophotography compositing (sharp), LCP-discoverable static image delivery in an Astro static site, canvas-overlay-over-photo layering, banding detection tooling, CDP-based CPU/contrast measurement.
**Confidence:** HIGH — every load-bearing number in this document (source asset URLs, byte sizes, TIFF dimensions, sharp API surface, crop/rotation math, banding-histogram behavior) was independently confirmed this session via `curl`, `node -e` against the actually-installed `sharp@0.35.3`, or direct reads of the live codebase — not carried forward from training data. Sections that extend milestone-level (`IMAGERY.md`/`PITFALLS.md`/`GLASS.md`) research are marked `[CITED: milestone-research]`; anything not independently re-verified this session is explicitly tagged `[ASSUMED]`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**License + source (VERIFIED 2026-07-18, in-browser, primary source — HIGH confidence)**
- noirlab.edu/public/copyright/: images CC BY 4.0, "reproduced without fee provided the credit is clear and visible"; no-endorsement + no-logo-use conditions noted (we use neither)
- noirlab.edu/public/images/noirlab2430b/: "largest open-source, freely available all-sky photo of the night sky", 40000×20000, 360°×180°, credit **NOIRLab/NSF/AURA/E. Slawik/M. Zamani**, NO special license note → general CC BY 4.0 applies
- Available masters: Publication TIFF 10K (91.3MB) · TIFF 4K (15.6MB) · Publication JPEG (3.5MB). Spike 1 starts from the 4K TIFF (15.6MB); escalate to 10K TIFF only if the final crop region needs more source resolution at 2560w output. DOWNLOAD SCOPE: these named NOIRLab assets (+ ESO eso0932a only if fallback triggers) — nothing else.
- Credit line (IMG-04): `Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0` with "NOIRLab" linked to the image page and "CC BY 4.0" linked to the license — placed in the site footer/colophon in both deck and classic modes.

**Spike 1 — Banding (gates the pipeline)**
- Encode ladder: sharp/avifenc AVIF 10-bit 4:4:4 at q≈55-60 (+ film-grain/noise strategy, + the 2×-resolution-lower-quality variant) vs WebP fallback; judge on a real 8-bit display + histogram comb-spike test (script the histogram check — it joins the gate battery)
- Output artifact: SPIKE-BANDING.md with the winning recipe + encoded evidence files + the histogram script committed

**Spike 2 — Glass-over-animating-canvas CPU (the RE-SCOPE TRIGGER)**
- Standalone harness (like v2's spike-milkyway.html): the real photo + the current live scene canvas + 4 MOCK backdrop-filter surfaces at production-like sizes/blur(12px). Measure: idle CPU scene-alone vs scene+glass (60s CDP soak, same methodology as 05-06's 5.6% baseline). Marginal budget: ≤2-3% (total <10%)
- Verdict tiers in SPIKE-GLASS.md: PASS (full glass proceeds in Phase 8) / PASS-WITH-LADDER (mitigations required, enumerate which) / FAIL → STOP THE CHAIN and present the structural rethink to the user (this is a designated autonomous-mode stop)

**Photo delivery + layering**
- `<picture>` (AVIF + WebP sources) or CSS background in NightSky.astro's DOM BELOW the canvas — plain HTML/CSS so it renders in no-JS classic mode; never canvas-drawn
- z-order: photo img (bottom) → overlay canvas (current z-index:-1 host, canvas above img within it) → ground/camper silhouette → content/glass. Planner reads the current NightSky.astro/deck.css stacking reality before choosing exact z values
- LCP: preload + fetchpriority=high + inline LQIP (tiny blurred placeholder, no CLS); the LCP checkpoint (local Lighthouse both presets + LCP number vs the 1.5-2.8s research budget) runs immediately after integration and BLOCKS the phase from completing hot

**Overlay adaptation (starfield.ts evolves, not forked)**
- Procedural Milky Way: OFF (the photo provides it). Procedural 4-band ambient field: REDUCED to the ~40-star twinkle subset (scintillation upgrades it in Phase 9) — the photo provides ambient stars
- KEPT drawn: career constellations (+panel brightening), meteors, crescent moon (physics decision recorded), the twinkle subset, ground/silhouette/camper/copper glow (the photo is sky-only — no horizon in the equirectangular master; our composite crops sky and our existing ground treatment stays)
- Layer 0 becomes transparent except authored elements; generation gets cheaper, blit path unchanged; sky-brightness governor logic re-evaluated against the photo (the governor attenuated the PROCEDURAL MW inside the text column — with a photo backdrop, the equivalent duty moves to crop/exposure choice + scrim, verified by contrast)
- Contrast floor over the photo: the verifier's analytic mode breaks the moment the backdrop isn't canvas — pull the minimal photo-aware sampling forward into THIS phase (composite img+canvas in the sample, still pre-blur), leaving the full screenshot-sampling re-architecture for Phase 8's gate as planned. Planner decides the smallest honest evolution; silent unverified contrast is not acceptable for even one commit

**Composite recipe (build-time, one-time)**
- Equirectangular 360×180 → select a Milky-Way-band crop region that reproduces the current design's diagonal band placement (05-UI-SPEC band geometry as the target look — read it), level/rotate, bottom gradient-blend into --bg for the ground seam, export masters (2560w + 1920w; LQIP ~32w inline) via a committed script (scripts/build-sky.mjs or similar) — masters checked in, raw TIFF NOT checked in (gitignore it; document the recipe for reproducibility)

**Floors (all carried)**
- astro check 0, build green, zero-hex (any new tokens in tokens.css), single-rAF counts unchanged, no deck/fig01 imports in scene modules, no push, no new npm dependencies (sharp already present via astro; avifenc via npx/sharp only — if a genuinely new tool is unavoidable, that's a SUS stop), Lighthouse ≥90 both presets at the LCP checkpoint

### Claude's Discretion
Exact crop window, blend gradient stops, LQIP encoding, preload markup details, whether the photo lives as `<img>` or CSS background (LCP-discoverability decides), spike harness file layout.

### Deferred Ideas (OUT OF SCOPE)
Glass build → Phase 8 (only its spike runs here); ambient systems → Phase 9; OG image refresh (OG-03) → Phase 10 candidate. Annotated/zoomable sky exploration → /craft territory, someday.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IMG-01 | A composited real-astrophotography Milky Way sky (NOIRLab `noirlab2430b` primary / ESO `eso0932a` fallback) renders full-viewport behind everything on the home page | §1 Download+composite pipeline — verified download URL, verified 4000×2000px source, empirically-validated crop/rotate/blend recipe with real sample output |
| IMG-02 | The photo ships as a static `<img>`/CSS background — never canvas-drawn — LCP-discoverable (preload + `fetchpriority=high` + LQIP ladder, no CLS), present in no-JS classic mode | §4 Astro integration — exact `<picture>`/preload mechanism, zero-CLS sizing, stacking |
| IMG-03 | Encode pipeline (AVIF 10-bit 4:4:4 + WebP fallback) produces no visible banding on an 8-bit display, proven by the banding spike (histogram comb-spike test + eyeball) before integration | §1 encode ladder (tool-verified sharp API + real byte budgets) + §2 banding histogram test (built, run, and validated against a deliberately-banded control this session) |
| IMG-04 | A photo credit line renders in the footer/colophon — exact attribution text with source link, CC BY 4.0 compliant; license page manually verified before ship | §1 license verification (re-confirmed via direct `curl`, not just WebFetch) + placement note re: shared `SiteFooter.astro` |
| IMG-05 | The authored overlay survives on the real sky: career constellations with panel-reactive brightening, meteors, and the drawn crescent moon (photo moon rejected on physics — recorded decision) | §5 Overlay adaptation surgery — exact starfield.ts/scene.ts function-level changes, grounded in a full read of the live code |
</phase_requirements>

## Summary

Every artifact this phase needs was independently re-verified this session, not just researched: the exact NOIRLab download URL (`https://noirlab.edu/public/media/archives/images/publicationtiff/noirlab2430b.tif`, confirmed 200 OK, 16,359,276 bytes = 15.6MB, matching CONTEXT.md's figure exactly), the source's exact dimensions (4000×2000px, 8-bit sRGB TIFF, confirmed via `sharp().metadata()` against the actually-downloaded file), the exact credit line and license text (scraped directly from the live page, not paraphrased), and a working, tested crop → rotate → blend → encode pipeline built and run end-to-end against the real source this session, producing a visually convincing diagonal Milky Way band composite (screenshot captured — see §1.6) with a validated zero-seam bottom gradient blend into `--bg`.

**Primary recommendation:** `sharp@0.35.3` (already resolvable via `node_modules/sharp` — Astro's own dependency, confirmed present, confirmed supports `avif({bitdepth:10, chromaSubsampling:'4:4:4'})` and `webp()`) is sufficient for 100% of this phase's image pipeline — download, crop, rotate, gradient-blend, AVIF/WebP encode, LQIP, and the banding-histogram verifier all run through the one already-present dependency. **No `avifenc`/`npx` fallback is needed** (confirmed: `npx avifenc` 404s on this registry anyway, so the CONTEXT.md fallback clause is moot — sharp alone clears the "no new npm dependencies" floor with room to spare). The photo must be delivered as a plain `<img>`/`<picture>` **below** the existing `#nightsky-canvas` inside `.nightsky-host` — never `drawImage()`'d into the canvas — both for LCP-discoverability (browser preload scanner) and to avoid Canvas2D's 8-bit compositing bottleneck undermining the AVIF 10-bit encode's whole purpose `[CITED: milestone-research, PITFALLS.md Pitfall 1 item 4]`. Layer 0 generation gets dramatically cheaper once the procedural sky wash + starfield + Milky Way are removed (from ~3,000+ chunked work units down to essentially one: the crescent moon) — this is a measurable, code-grounded finding from reading `starfield.ts` directly, not a guess.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Sky photo compositing (crop/rotate/blend/encode) | Build-time (Node script, `sharp`) | — | One-time, deterministic; must never run in the browser or in Astro's per-request pipeline (there is no per-request pipeline — `output:'static'`) |
| Sky photo delivery | Static / CDN (GitHub Pages via Fastly) | Browser (preload scanner, `<picture>`) | Plain static asset in `public/sky/`; no server-side logic exists or is needed |
| Overlay rendering (constellations, meteors, moon, twinkle, fireflies) | Browser / Client (Canvas2D, `scene.ts`'s single rAF) | — | Unchanged tier from v2.0 — this phase only shrinks what Layer 0 bakes, it does not move any rendering tier |
| Photo-aware contrast verification | Build/verify-time tooling (Node + headless Chrome via CDP) | Browser (the thing being measured) | `scripts/verify-contrast.mjs` already runs as an out-of-band Node tool driving headless Chrome — this phase extends its in-page sampler, not its process architecture |
| Banding detection | Build-time tooling (Node + `sharp` raw pixel dump) | — | Runs against encoded output files on disk, never in the browser |
| LCP/Lighthouse checkpoint | Build/verify-time tooling (`npx lighthouse` against local preview, per Phase 4/5 precedent) | — | No change from the existing project convention |

## Project Constraints (from CLAUDE.md)

- **Hosting:** GitHub Pages static-only — no server code; the entire pipeline in this phase must be a build-time/one-time script, never a runtime endpoint.
- **Tech stack:** Astro + vanilla TS/canvas — no UI framework, no Tailwind (both already absorbed by the existing codebase; this phase adds zero new runtime JS frameworks).
- **Fonts/assets convention:** this project self-hosts pre-built assets under `public/` (see `public/fonts/`, `public/og/`) rather than using `astro:assets`/`<Image>`/`<Picture>` from `src/assets/` — **no existing usage of `astro:assets` was found anywhere in this codebase** (confirmed via grep). The sky-image pipeline should follow the SAME established convention (pre-built files committed under `public/sky/`, referenced by plain `<img>`/`<source>` tags) rather than introducing Astro's build-time image pipeline for the first time in this project. This is a **Don't Hand-Roll inversion**: Astro's own `<Picture>` component would technically work, but adopting it now would be a net-new architectural pattern this project has deliberately avoided everywhere else — the "committed script produces static files in `public/`" pattern is more consistent with `scripts/render-og.mjs` and the font-subsetting precedent already established.
- **Performance:** Fig. 01 must hold 60fps (unaffected by this phase); Lighthouse ≥90 across the board — this phase's LCP checkpoint is the binding new risk.
- **Honesty gate:** every number displayed must trace to something real — the credit line's exact wording was re-verified against the live page this session (not paraphrased from a stale summary).
- **GSD workflow enforcement:** file changes must go through a GSD command (not directly relevant to research output, but the planner should route implementation through `/gsd-execute-phase`).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `sharp` | **0.35.3** [VERIFIED: local `node_modules/sharp/package.json`, this session] | Crop/rotate/gradient-composite/AVIF-encode/WebP-encode/raw-pixel-dump for the banding histogram | Already resolvable (pulled in transitively by Astro); confirmed via direct `require()` + `.avif()`/`.webp()`/`.raw()`/`.rotate()`/`.extract()`/`.composite()` all present and callable against real files this session. Confirmed `AvifOptions.bitdepth: 8\|10\|12` and `chromaSubsampling` (default `'4:4:4'`) exist in the installed version's own `.d.ts` — the 10-bit anti-banding lever from `IMAGERY.md` is NOT hypothetical, it works today. |
| Node.js built-ins (`fs`, `child_process`, `WebSocket`) | Node 22 (project floor: `>=22.12.0`) | Downloading the source TIFF (or documenting the manual-download fallback), driving headless Chrome for Spike 2 and the contrast sampler | Zero new dependency — mirrors `scripts/verify-contrast.mjs`'s own zero-dep CDP pattern exactly (reuse its `launchChrome`/`connectCdp`/`Cdp` class verbatim, don't reinvent) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SVG-via-sharp (librsvg, bundled into libvips) | bundled with `sharp` 0.35.3 | Rasterizing a `linearGradient` SVG for the bottom-blend-to-`--bg` composite | Verified working this session (`sharp(Buffer.from(svgString)).png()` rasterized a 1280×200 alpha-ramped gradient correctly) — no separate gradient-generation library needed; this is the cleanest way to get a mathematically exact, antialiased linear alpha ramp without hand-rolling pixel math |
| headless Chrome (`chrome.exe`, already resolved by `verify-contrast.mjs`'s `findChrome()`) | whatever is locally installed | Spike 2's CDP CPU soak; the photo-aware contrast sampler; the LCP/Lighthouse checkpoint | Not an npm dependency at all — an external binary the existing script already locates via `CHROME_PATH` env var or Windows/macOS/Linux default install paths |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `sharp` for AVIF 10-bit encode | `avifenc` CLI via `npx` | **Rejected — confirmed unnecessary.** `npx avifenc` 404s against this project's configured npm registry (`packagefeedproxy.microsoft.io`) — it is not even resolvable here, let alone a clean zero-new-dep path. `sharp` already does everything the CONTEXT.md's avifenc fallback clause was hedging against. |
| Astro `<Picture>`/`astro:assets` for responsive-image generation | Plain committed static files in `public/sky/` + hand-written `<picture>` markup | Astro's built-in pipeline would work (it also uses `sharp` internally) but requires importing the master from `src/assets/`, which is a net-new pattern nowhere else in this codebase (see Project Constraints above). The committed-static-file approach matches the project's existing `public/fonts/`, `public/og/`, `scripts/render-og.mjs` precedent exactly and keeps the crop/rotate "one-time, hand-tuned, committed" doctrine `IMAGERY.md` already recommended. |
| Node-native raw pixel histogram | ImageMagick/Pillow CLI | `IMAGERY.md`/`PITFALLS.md` both floated ImageMagick/Pillow for the histogram check — **not needed**: `sharp().raw().toBuffer({resolveWithObject:true})` gives direct access to decoded pixel bytes for any encoded format sharp can read (including its own AVIF output), so the entire histogram/banding detector can live in the same zero-dep Node script family as the rest of the pipeline. |

**Installation:** none — `sharp` is already present. No `npm install` step is needed for this phase's image pipeline.

**Version verification:** `sharp@0.35.3` confirmed via `node -e "require('fs').readFileSync('node_modules/sharp/package.json')"` — the version's `AvifOptions`/`WebpOptions` type surface was read directly from `node_modules/sharp/lib/index.d.ts` in this session (not from the sharp docs site), so the bitdepth/chromaSubsampling API is proven correct for the version this project will actually run at build time, not just "the latest sharp docs."

## Package Legitimacy Audit

**No new packages are proposed or required for this phase.** `sharp` is already present as a transitive dependency of `astro@^7.0.7` and is directly `require()`-able from the project root (confirmed this session). No `package.json`/`package-lock.json` change is needed. The CONTEXT.md floor ("no new npm dependencies... if a genuinely new tool is unavoidable, that's a SUS stop") is cleared with room to spare — this is not a close call.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `sharp` | npm | already installed, not new | N/A (existing dep) | github.com/lovell/sharp | OK (pre-existing, not newly introduced) | No action — already vetted by the project's existing Astro dependency tree |

**Packages removed due to `[SLOP]` verdict:** none.
**Packages flagged as suspicious `[SUS]`:** none.

## Architecture Patterns

### System Architecture Diagram

```
Build time (one-time, committed script — never re-runs on every `astro build`)
──────────────────────────────────────────────────────────────────────────────
  curl download                sharp pipeline                    output
  ┌──────────────┐   4000×2000  ┌──────────────────────┐   AVIF   ┌─────────────────┐
  │ NOIRLab       │────TIFF────▶│ 1. extract() safe-zone│─10bit──▶│ public/sky/      │
  │ publicationtiff│   15.6MB   │    band (±22.5% of H) │  4:4:4  │  milky-way-      │
  │ /noirlab2430b │             │ 2. rotate() to angle,  │         │   2560.avif      │
  │     .tif      │             │    fill=--bg           │  WebP   │   1920.avif      │
  └──────────────┘              │ 3. extract() inscribed │────────▶│   2560.webp      │
                                 │    rect (no fill leak) │         │   1920.webp      │
                                 │ 4. composite() SVG      │  LQIP  │   lqip.txt        │
                                 │    gradient → --bg seam │───────▶│   (base64 string) │
                                 │ 5. resize() 2560w/1920w │        └─────────────────┘
                                 │ 6. .avif()/.webp()      │
                                 └──────────────────────┘
                                          │
                                          ▼
                                 banding histogram check
                                 (sharp raw() + luminance
                                  comb-spike detector)
                                          │
                                    PASS ─┴─ FAIL → retune quality/effort/grain, re-encode

Runtime (browser, GitHub Pages static delivery)
──────────────────────────────────────────────────────────────────────────────
  <head>                         .nightsky-host (position:fixed, inset:0, z-index:-1)
  ┌────────────────────┐         ┌───────────────────────────────────────────┐
  │ <link rel=preload   │         │  <picture>  (NEW, bottom)                  │
  │  as=image           │────────▶│    <source avif> <source webp> <img>       │
  │  fetchpriority=high  │        │  #nightsky-canvas (existing, on top,        │
  │  imagesrcset=...>    │        │    now mostly-transparent Layer 0)          │
  └────────────────────┘         │  .camper (existing, DOM/CSS, on top)        │
         │                        └───────────────────────────────────────────┘
   preload scanner discovers               │
   the image during HTML parse,            ▼
   before any JS executes            scene.ts's single rAF blits Layer 0
                                      (now near-empty except the moon) +
                                      draws twinkle/fireflies/constellations/
                                      meteors on top, every frame, unchanged
                                      code shape
```

### Recommended Project Structure

```
scripts/
├── build-sky.mjs              # NEW — the one-time composite+encode pipeline (§1)
├── verify-sky-banding.mjs     # NEW — histogram comb-spike detector (§2), self-testing
└── verify-contrast.mjs        # MODIFIED — photo-aware sampling addition (§6)
public/
└── sky/
    ├── milky-way-2560.avif    # committed masters
    ├── milky-way-1920.avif
    ├── milky-way-2560.webp
    ├── milky-way-1920.webp
    └── milky-way-lqip.txt     # the ~32w base64 data-URI string, for copy-paste into the component (or read at build time — see §4)
sky-source/                    # gitignored — the raw downloaded TIFF + intermediate working files, NOT committed
└── noirlab2430b-4k.tif
src/
├── components/
│   └── NightSky.astro         # MODIFIED — <picture> added below canvas (§4)
└── lib/nightsky/
    ├── starfield.ts           # MODIFIED — Milky Way + full starfield bake removed (§5)
    └── scene.ts                # MODIFIED — twinkle candidate sourcing tweaked (§5)
```

---

## 1. Download + Composite Pipeline

### 1.1 Verified download URL and asset tiers

**`WebFetch` on `noirlab.edu` pages returns empty content — reconfirmed this session** (same bot-gate `IMAGERY.md` already documented). **`curl` from this environment works fine** and was used to independently verify every claim below directly against the live server — these are `[VERIFIED: noirlab.edu, this session]`, not carried forward from the milestone research's WebSearch synthesis.

The asset host is `storage.noirlab.edu` (the `noirlab.edu` URLs 301-redirect there). Confirmed URL pattern and exact byte sizes, all matching CONTEXT.md's stated figures exactly:

| Tier | URL (redirects from `noirlab.edu/public/media/archives/images/...`) | Confirmed size | Matches CONTEXT.md? |
|---|---|---|---|
| **Publication TIFF 4K (Spike 1 target)** | `https://noirlab.edu/public/media/archives/images/publicationtiff/noirlab2430b.tif` | **16,359,276 bytes = 15.6 MB** | ✅ exact match |
| Publication TIFF 10K (escalation) | `https://noirlab.edu/public/media/archives/images/publicationtiff10k/noirlab2430b.tif` | 95,723,018 bytes = 91.3 MB | ✅ exact match |
| Publication TIFF 25K | `https://noirlab.edu/public/media/archives/images/publicationtiff25k/noirlab2430b.tif` | 486,892,200 bytes = 464.3 MB | matches search-synthesis figure (25K tier, out of scope) |
| Fullsize Original (40K, ~1GB — out of scope, do not download) | `https://noirlab.edu/public/media/archives/images/original/noirlab2430b.tif` | 1,101,956,832 bytes ≈ 1.03 GB | matches "~1GB" description |
| Publication JPEG | `https://noirlab.edu/public/media/archives/images/publicationjpg/noirlab2430b.jpg` | 3,682,194 bytes = 3.5 MB | ✅ exact match |

**Exact download command for Spike 1 (verified working this session):**
```bash
mkdir -p sky-source
curl -L -o sky-source/noirlab2430b-4k.tif \
  "https://noirlab.edu/public/media/archives/images/publicationtiff/noirlab2430b.tif"
# Confirmed: HTTP 301 → https://storage.noirlab.edu/media/archives/images/publicationtiff/noirlab2430b.tif → 200 OK, 16,359,276 bytes
```

**Manual-download fallback (only needed if `curl`/network access is unavailable in the execution environment):** open `https://noirlab.edu/public/images/noirlab2430b/` in a browser, use the "Publication TIFF 4K" download link in the Image Formats panel, save to `sky-source/noirlab2430b-4k.tif`. The page's Image Formats section (confirmed present via direct page fetch this session) lists exactly this file plus the 10K/25K/40K tiers and JPEG.

**`sky-source/` must be gitignored** — add `/sky-source/` to `.gitignore` before this phase's first commit that touches the pipeline. The current `.gitignore` (read this session) has no such entry yet.

### 1.2 Verified source dimensions and metadata

Confirmed via `sharp(downloadedFile).metadata()` against the actual downloaded 4K TIFF this session:

```json
{
  "format": "tiff",
  "width": 4000,
  "height": 2000,
  "space": "srgb",
  "channels": 3,
  "bitsPerSample": 8,
  "hasAlpha": false,
  "hasProfile": true
}
```

Cross-confirmed against the live page's own metadata table: `Size: 40000 x 20000 px` (the full/original tier) `Field of View: 360° x 180°` — the 4K tier is the same full 360°×180° equirectangular map, just downsampled 10x to 4000×2000. **This is a genuine full-sphere equirectangular projection** (not a single-location ground panorama), confirming `IMAGERY.md`'s claim that any rotation angle is compositionally valid (no real fixed horizon to fight).

### 1.3 Equirectangular crop-window formula (the distortion rule)

**The rule:** in an equirectangular (plate carrée) projection, horizontal (east-west) stretch relative to true angular distance scales as `1 / cos(latitude)`, where `latitude = (H/2 - y) / (H/2) * 90°` for a source row `y` in a map of height `H`. Distortion is **zero at the vertical center row** (the map's "equator") and **diverges toward the top/bottom edges** (the poles). This is standard map-projection math, not astrophotography-specific — but it's the exact formula that answers "which sub-rectangle yields a natural-looking flat sky band."

**Practical rule derived from it:** keep the pre-rotation extraction window's rows within roughly **±22.5% of `H/2`** (i.e., `y ∈ [0.275·H, 0.725·H]`, a ~45°-of-latitude band centered on the map's equator). At the edge of that band (22.5° latitude), the stretch factor is `1/cos(22.5°) ≈ 1.082` — an 8% worst-case horizontal stretch differential across the crop, imperceptible for a decorative background. Going wider (e.g., ±35% of H, ~63° latitude) hits a stretch factor of `~2.2` — visibly distorted. For the 4000×2000 source: **safe row range is roughly y = 550 to y = 1450** (900px tall, centered on row 1000).

**Empirically validated this session:** a brightness-scan of the actual downloaded TIFF (10x-downsampled to 400×200 for speed, per-row/per-column mean-luminance scoring within the safe zone) located the richest Milky-Way-core region at **source rows ~1000-1090, columns ~1670-2470** (of 4000) — i.e., almost exactly the map's vertical center (near-zero distortion) and a strong galactic-core signature (dust lanes, warm core color, bright star clustering) rather than a random star field. This is a *starting heuristic* (mean luminance is a coarse proxy for "Milky Way present," not a semantic detector) — the actual crop should still be eyeballed during Spike 1, but it's a good automatic starting point, not a blind guess. `[VERIFIED: this session, against the real downloaded TIFF]`

### 1.4 Rotation math (verified against real sharp output)

`sharp().rotate(angleDeg, { background })` grows the canvas per the standard rotation bounding-box formula — **confirmed exactly** against real output this session: extracting an 1800×900 region and rotating 20° produced a 1999×1461 canvas; the formula `newW = |w·cosθ| + |h·sinθ|`, `newH = |w·sinθ| + |h·cosθ|` predicts `1999.3 × 1461.3` — an exact match.

**Fill color:** `sharp().rotate(angle, { background: '#0f1216' })` fills the exposed corners with the page's own `--bg` token color (`#0f1216`), so any corner spill blends into the page background rather than showing a seam — `[CITED: milestone-research, IMAGERY.md]`, confirmed this session by inspecting the actual rotated output (corner fill color measured, matched `#0f1216` within rounding).

**Largest-inscribed-rectangle-after-rotation formula** (avoids the fill color leaking into the final crop — do NOT eyeball a percentage-based inner crop, compute it):

```js
// Standard rotate-crop formula (verified against real sharp output this session —
// all 4 corners of the computed crop sampled clean sky pixels, zero fill contamination).
function largestInscribed(w, h, angleRad) {
  const a = Math.abs(angleRad % Math.PI);
  const angle = a > Math.PI / 2 ? Math.PI - a : a;
  const sinA = Math.sin(angle), cosA = Math.cos(angle);
  const isWide = w >= h;
  const longSide = isWide ? w : h, shortSide = isWide ? h : w;
  let wr, hr;
  if (shortSide <= 2 * sinA * cosA * longSide + 1e-9 || Math.abs(sinA - cosA) < 1e-10) {
    const x = 0.5 * shortSide;
    if (isWide) { wr = x / sinA; hr = x / cosA; } else { wr = x / cosA; hr = x / sinA; }
  } else {
    const cos2a = cosA * cosA - sinA * sinA;
    wr = (w * cosA - h * sinA) / cos2a;
    hr = (h * cosA - w * sinA) / cos2a;
  }
  return { width: Math.floor(wr), height: Math.floor(hr) };
}
```

Verified this session: for a 1800×900 pre-rotation extract rotated 20°, this formula gives a 1315×478 inscribed crop; extracting that exact region from the rotated 1999×1461 canvas (centered) sampled all 4 corners as clean sky pixels (no `#0f1216` contamination). Use this instead of a hand-picked "crop 60% of the rotated canvas" percentage — it is deterministic and provably seam-free.

### 1.5 Bottom gradient-blend into `--bg` (ground seam)

**Recommended technique — verified working this session:** rasterize a small SVG `linearGradient` (transparent → `--bg` opaque) via `sharp`'s built-in SVG support (librsvg, bundled in libvips — no extra dependency), then `composite()` it onto the bottom ~25-30% of the crop with `gravity: 'south'`.

```js
const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
  <defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0%' stop-color='#0f1216' stop-opacity='0'/>
    <stop offset='100%' stop-color='#0f1216' stop-opacity='1'/>
  </linearGradient></defs>
  <rect width='100%' height='100%' fill='url(#g)'/>
</svg>`;
const gradPng = await sharp(Buffer.from(svg)).png().toBuffer();
const blended = await sharp(cropBuffer)
  .composite([{ input: await sharp(gradPng).resize(cropW, Math.round(cropH * 0.3)).toBuffer(), gravity: 'south' }])
  .toBuffer();
```

Confirmed this session: `sharp(Buffer.from(svg)).png()` rasterizes correctly (1280×200 alpha-ramped PNG, `hasAlpha: true`), and compositing it onto the test crop produced a **visually seamless fade to near-black at the bottom edge** — see the rendered evidence in this session's scratchpad (`candidate-blended.jpg`); the fade reads as a natural darkening toward the horizon, not a visible band. `--bg` is `#0f1216` per `tokens.css` (read directly) — use the literal hex here since this is a **build-time Node script, not CSS**, so the zero-hex-outside-tokens.css doctrine (a CSS-file rule) does not apply; document the value's provenance in the script's own header comment instead (`// mirrors --bg from src/styles/tokens.css — update both if that token ever changes`).

### 1.6 Full pipeline validated end-to-end this session

Ran the complete extract → rotate → inscribed-crop → resize → encode chain against the real downloaded 4K TIFF. The resulting composite (rotated 20°, cropped to the galactic-core region located by the brightness scan) produced a convincing diagonal Milky Way band with visible dust lanes, warm core coloring, and dense star clustering — directly comparable in composition to the target diagonal-band look `05-UI-SPEC.md` describes (enters upper-middle, sweeps to lower-right). This is strong empirical confirmation that the recipe (safe-zone extraction + rotation + inscribed-rectangle crop) produces a natural, non-distorted result from this specific source file — not just a theoretical claim.

### 1.7 AVIF/WebP encode — verified byte budgets

Ran the actual encode against the real test crop (1920w) this session:

| Encode | Settings | Measured size | Time |
|---|---|---|---|
| AVIF 10-bit | `{quality:58, bitdepth:10, chromaSubsampling:'4:4:4', effort:6}` | **243,291 bytes (238 KB)** | 1.70s |
| AVIF 8-bit | `{quality:58, bitdepth:8, chromaSubsampling:'4:4:4', effort:6}` | 248,835 bytes (243 KB) | 2.37s |
| WebP | `{quality:72}` | 250,402 bytes (245 KB) | 0.24s |
| LQIP (32w WebP) | `{quality:40}` | **126 bytes** (168 base64 chars — trivially inlineable) | — |

These numbers are from a rough test crop (not the final graded master), but they land comfortably inside `IMAGERY.md`'s estimated 1920w budget (250-450KB) — confirming the budget estimate is realistic for this specific source, not just a generic hero-image guess. **10-bit AVIF was not larger than 8-bit at this quality** — a reassuring sign that the anti-banding lever is close to free here, though this should be re-checked against the final graded master, not assumed to hold at every quality setting.

**API confirmed present in `sharp@0.35.3`'s own `.d.ts`:**
```ts
interface AvifOptions {
  quality?: number;          // default 50
  effort?: number;           // 0-9, default 4 — use 6-8 per IMAGERY.md (one-time cost)
  chromaSubsampling?: string; // default '4:4:4' — do not set to '4:2:0'
  bitdepth?: 8 | 10 | 12;     // default 8 — use 10 for the sky master
}
interface WebpOptions {
  quality?: number; // default 80 — no bitdepth option (8-bit only, confirmed)
}
```

### 1.8 Sharp-vs-avifenc verdict

**Use sharp exclusively.** `npx avifenc` returns `404 Not Found` against this project's configured npm registry (confirmed this session — `npm error 404 Not Found - GET .../avifenc`), so it isn't even a viable fallback in this environment, let alone necessary. `sharp` already covers every encode/decode/composite operation this phase needs. CONTEXT.md's "avifenc via npx/sharp only" fallback clause never triggers — no SUS stop needed.

---

## 2. Banding Histogram Test

### 2.1 Verified, working detection algorithm

Built and ran the actual detector this session. **Key finding: the discriminating signal is the number of disconnected populated-bin runs in the darkest-quartile luminance histogram (`runsAboveZero`), not merely the presence of a spike.** A smooth gradient's histogram has one continuous run of populated bins; a banded/quantized one fractures into several disconnected runs separated by zero-count gaps.

```js
// scripts/verify-sky-banding.mjs shape — zero-dep, sharp-only.
import sharp from 'sharp'; // already resolvable, no new dependency

async function luminanceHistogram(buf) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const hist = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += info.channels) {
    const lum = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
    hist[lum]++;
  }
  return hist;
}

/** Scans a luminance range [lo,hi] (the darkest quartile — e.g. 0-63 of 0-255,
 * or the exact range the source gradient spans, whichever is tighter/more
 * diagnostic) for the comb-spike signature: disconnected runs of populated
 * histogram bins separated by zero-count gaps. */
function combSpikeScore(hist, lo, hi) {
  const slice = hist.slice(lo, hi + 1);
  let zeroGaps = 0, runsAboveZero = 0, inRun = false;
  for (let i = 0; i < slice.length; i++) {
    if (slice[i] === 0) { inRun = false; }
    else if (!inRun) { runsAboveZero++; inRun = true; }
  }
  for (let i = 1; i < slice.length - 1; i++) {
    if (slice[i] === 0 && slice[i - 1] > 0 && slice.slice(i + 1, i + 4).some((v) => v > 0)) zeroGaps++;
  }
  return { zeroGaps, runsAboveZero, nonzeroBins: slice.filter((v) => v > 0).length, totalBins: slice.length };
}
```

**Threshold recommendation** (calibrated against the selftest below, this session): **FAIL if `runsAboveZero > 3` OR `zeroGaps >= 2`** within the darkest-quartile/dominant-gradient luminance range. A clean encode should show `runsAboveZero` in the 1-2 range (allowing minor real sensor-noise gaps) and `zeroGaps` near 0.

### 2.2 Selftest strategy — verified this session (a deliberately-banded control DOES fail)

Built a synthetic dark gradient matching the actual `--sky-zenith`(`5,7,10`) → `--sky-horizon`(`20,26,44`) token values (the exact "darkest gradient region" scenario `PITFALLS.md` Pitfall 1 describes), then compared a clean pipeline (light pre-encode noise + 10-bit AVIF, mirroring the "don't denoise, let natural grain survive" doctrine) against a deliberately-banded control (posterized to 24-level steps, then a harsh 8-bit JPEG re-encode at q35, no grain):

| Pipeline | `zeroGaps` | `runsAboveZero` | `nonzeroBins`/`totalBins` |
|---|---|---|---|
| **Clean** (10-bit AVIF q60 effort7, light pre-noise) | **0** | **1** | 21/40 |
| **Deliberately banded** (posterized + 8-bit JPEG q35, no grain) | **7** | **8** | 9/40 |

This is a clean, unambiguous pass/fail signal — `[VERIFIED: this session, real sharp encode output]`, not a theoretical claim. **Wire this exact synthetic-gradient pair into `verify-sky-banding.mjs --selftest`** (mirroring `verify-contrast.mjs`'s own `--selftest` doctrine of self-testing formulas before trusting them against real data) so a future change to the detector's thresholds can't silently regress without a fixture catching it.

### 2.3 Applying it to the real encoded master

Run the same `luminanceHistogram`/`combSpikeScore` pair against: (a) the darkest quartile of the FULL encoded 2560w/1920w AVIF output (the sky region away from the bright galactic core — likely the crop's upper corners or the gradient-blended bottom band), and (b) the same region of the WebP fallback. Because the real photo has a bright, busy core, isolate the scan to a specific dark sub-region (e.g. `extract()` just the top 20% of the crop, or just the bottom gradient-blend band) rather than scanning the whole frame — a whole-frame histogram will be dominated by the bright core's wide luminance spread and dilute the darkest-quartile signal. **This is a real methodology nuance discovered this session** (an initial whole-frame test against the busy test crop did NOT discriminate cleanly — only isolating a genuinely smooth dark region did) — do not skip the region-isolation step.

**Real-device check still required, not optional** `[CITED: milestone-research, PITFALLS.md]` — the histogram test catches gross banding but display-dependent dithering/panel bit-depth means a passing histogram should still get one eyeball check on a non-reference display before Spike 1 is called done.

---

## 3. Spike-2 Harness (Glass-over-animating-canvas CPU)

### 3.1 CDP soak methodology — exact precedent from 05-06

Read `.planning/milestones/v2.0-phases/05-night-sky-scene/frame-cost-audit.md` and `05-06-SUMMARY.md` directly. The 5.6% baseline this phase must beat (`marginal budget ≤2-3%, total <10%`) was produced by this exact method:

- **Headless Chrome, "new" headless mode** (software rasterization — explicitly noted as *conservative* vs. real GPU, so a passing number here is a safe lower bound, not an optimistic one)
- **DevTools Protocol `Performance.getMetrics`**, sampled at soak start and end; `CPU% = (TaskDuration_end − TaskDuration_start) / wallClockSeconds`
- **60-second soak** (not the full 5 minutes SKY-03 formally requires — extrapolated, justified because per-frame work is constant/bounded by construction, no accumulation)
- **`PerformanceObserver('longtask')`** injected into the page to count long tasks (target: 0)
- **A `requestAnimationFrame`-based frame counter** injected to compute realized fps (target: 60.0)
- **`LayoutDuration` delta** tracked separately (target: 0.000s — proves no forced layout/reflow from the animation loop)

The exact scratchpad script (`idle-soak.mjs`) referenced in `frame-cost-audit.md` was not committed to the repo (scratchpad-only), but `scripts/verify-contrast.mjs`'s own `launchChrome()`/`connectCdp()`/`Cdp` class (read directly, lines 517-624) implement the identical zero-dep CDP connection pattern (Node 22 built-in `WebSocket`, spawn Chrome with `--headless=new --remote-debugging-port=0`, poll `DevToolsActivePort` in the temp profile dir) — **reuse these three pieces verbatim** rather than re-deriving them; only the in-page injected script (metrics collection vs. contrast sampling) differs.

### 3.2 Harness shape (standalone HTML, per CONTEXT.md's "like spike-milkyway.html" instruction)

```
.planning/phases/07-real-sky-foundation/spike-glass/
├── harness.html          # the standalone page (see below)
└── soak.mjs               # CDP driver script, adapted from verify-contrast.mjs's launchChrome/connectCdp
```

`harness.html` structure:
```html
<!doctype html>
<html>
<head><style>
  html,body{margin:0;background:#0f1216;height:100%}
  .photo{position:fixed;inset:0;z-index:-2}
  .photo img{width:100%;height:100%;object-fit:cover}
  #scene{position:fixed;inset:0;z-index:-1}
  .glass{position:fixed;background:rgb(255 255 255/0.07);
    backdrop-filter:blur(12px) saturate(150%);
    -webkit-backdrop-filter:blur(12px) saturate(150%)}
  /* 4 mock surfaces at production-like geometry, per CONTEXT.md: */
  .glass.header{top:0;inset-inline:0;height:64px}      /* header chrome */
  .glass.footer{bottom:0;inset-inline:0;height:88px}    /* footer chrome */
  .glass.jumpindex{bottom:24px;right:24px;width:160px;height:220px} /* DeckIndex */
  .glass.panel{top:96px;left:50%;transform:translateX(-50%);width:880px;height:60vh} /* content panel */
</style></head>
<body>
  <div class="photo"><img src="/sky/milky-way-2560.avif" /></div>
  <canvas id="scene"></canvas>
  <div class="glass header"></div>
  <div class="glass footer"></div>
  <div class="glass jumpindex"></div>
  <div class="glass panel"></div>
  <script type="module">
    // Import the REAL live scene.ts engine (not a re-implementation) so the
    // measured idle profile matches production exactly — mirrors v2.0's own
    // spike-milkyway.html precedent of exercising real engine code, not a mock.
    import { initNightSky } from '/src/lib/nightsky/scene.ts'; // or the built dist path
    const host = document.querySelector('.photo').parentElement; // or a dedicated host div
    initNightSky(host);
  </script>
</body>
</html>
```

**Two-run protocol** (mirrors CONTEXT.md's "measure: idle CPU scene-alone vs scene+glass"):
1. **Baseline run:** same harness with the 4 `.glass` divs `display:none` (scene + real photo, no blur) → establish the new baseline (this may differ slightly from 05-06's 5.6% since Layer 0 generation is now near-empty — expect this number to be equal-or-lower than 5.6%, not higher, since less canvas work is happening per frame, see §5).
2. **Glass run:** same harness, 4 `.glass` divs visible with `backdrop-filter:blur(12px) saturate(150%)` → measure marginal delta.
3. **Marginal cost = Glass run CPU% − Baseline run CPU%.** CONTEXT.md's budget: marginal ≤2-3%, total <10%.

### 3.3 What to record

Per the 05-06 precedent table shape, record for BOTH runs: soak wall-clock, `TaskDuration` delta → CPU%, `ScriptDuration` delta, `LayoutDuration` delta (should stay 0 even with glass — blur is a compositor operation, not a layout one), long-task count, realized fps. Then compute and report the marginal delta explicitly — this delta number is the actual gate CONTEXT.md's PASS/PASS-WITH-LADDER/FAIL tiers key off of, not either run's absolute number in isolation.

**If FAIL:** per CONTEXT.md, this is a designated autonomous-mode stop — do not proceed to attempt mitigations and re-measure silently; surface the structural rethink to the user with the measured numbers as evidence.

**If PASS-WITH-LADDER:** `GLASS.md` §1.4 already enumerates the mitigation ladder in priority order (minimize overlap area → throttle canvas redraw to ~15-20fps independent of display refresh → remove inactive panels from paint tree via `display:none` not `opacity:0` → keep blur ≤16px where canvas is present → cap simultaneous glass surfaces at ≤4) — SPIKE-GLASS.md should enumerate exactly which of these were needed to clear the floor, since Phase 8 must apply them exactly as measured, not re-derive them.

---

## 4. Astro Integration (LCP-discoverable `<picture>`)

### 4.1 Head injection mechanism — confirmed Astro pattern

`BaseLayout.astro` (read directly) currently hardcodes its `<head>` preloads with no named slot — every page shares the identical head. Since `NightSky`/the photo only render on `index.astro` (confirmed: `work/[slug].astro` and `404.astro` do not import `NightSky`, per `PITFALLS.md`'s own codebase grounding), the LCP preload must NOT be unconditionally added to `BaseLayout.astro`'s hardcoded head — it needs to be page-specific.

**Recommended mechanism: a named slot.** Add `<slot name="head" />` inside `BaseLayout.astro`'s `<head>`, then `index.astro` passes the preload link via `slot="head"`:

```astro
<!-- BaseLayout.astro — ADD inside <head>, after the existing font preloads -->
<slot name="head" />

<!-- index.astro — pass the preload through the slot -->
<BaseLayout>
  <link
    slot="head"
    rel="preload"
    as="image"
    href="/sky/milky-way-1920.avif"
    imagesrcset="/sky/milky-way-1920.avif 1920w, /sky/milky-way-2560.avif 2560w"
    imagesizes="100vw"
    fetchpriority="high"
  />
  <div class="page">...</div>
</BaseLayout>
```

This is standard, documented Astro named-slot behavior `[CITED: docs.astro.build/en/basics/layouts/, general Astro slot mechanics]` — content passed with a `slot="head"` attribute is resolved into the layout's `<slot name="head" />` wherever that slot is placed, including inside `<head>`, at render/compile time (not a client-side portal — this works correctly for `<head>` placement). This keeps `work/[slug].astro`/`404.astro` completely unaffected (they simply never pass anything into that slot) and matches the codebase's existing "plain `<link>` tags in `<head>`" convention rather than introducing a new pattern.

**`imagesrcset`/`imagesizes` on the preload link** must exactly mirror the `<picture>`'s own `srcset`/`sizes` so the browser's preload-scanner-selected resource is the SAME one the `<picture>` element ultimately requests — a mismatch here causes a **double-fetch** (the single highest-value pitfall to grep-check for, see §7).

### 4.2 `<picture>` markup — zero-CLS, below the canvas

```astro
<!-- NightSky.astro — inside .nightsky-host, BEFORE the existing <canvas> -->
<div class="sky-photo">
  <picture>
    <source type="image/avif" srcset="/sky/milky-way-1920.avif 1920w, /sky/milky-way-2560.avif 2560w" sizes="100vw" />
    <source type="image/webp" srcset="/sky/milky-way-1920.webp 1920w, /sky/milky-way-2560.webp 2560w" sizes="100vw" />
    <img
      src="/sky/milky-way-1920.avif"
      alt=""
      role="presentation"
      fetchpriority="high"
      loading="eager"
      decoding="async"
      style={`background: center / cover no-repeat url('data:image/webp;base64,${LQIP_BASE64}')`}
    />
  </picture>
</div>
<canvas id="nightsky-canvas"></canvas>
```

```css
.sky-photo,
.sky-photo picture,
.sky-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.sky-photo img {
  object-fit: cover;
  object-position: center 30%; /* tune to match where the Milky Way band sits in the final crop */
}
```

**Zero-CLS:** `.nightsky-host` is already `position:fixed; inset:0` (never participates in document flow — confirmed by reading `NightSky.astro`), so `position:absolute; inset:0` on `.sky-photo` inherits that same zero-layout-impact guarantee `[CITED: milestone-research, PITFALLS.md Pitfall 2]` — no `aspect-ratio` trick is needed because the element is never in flow to begin with. `alt=""` + `role="presentation"` is correct since `.nightsky-host` already carries `aria-hidden="true"` on its parent (confirmed) — the photo is exactly as decorative as the canvas it sits behind.

**LQIP as an inline CSS `background` (not a separate `<img>` swap):** setting the LQIP as the `<img>`'s own CSS `background` (shown via the image's transparent/loading periods, then covered once the real image decodes) avoids the `src`-swap flash risk `PITFALLS.md` flags — the browser paints the background immediately, then the foreground image layers on top once decoded, with no attribute mutation needed.

**LQIP generation (verified sizes this session):** a 32w WebP quality-40 LQIP encoded to **126 bytes / 168 base64 characters** — small enough to inline directly as a `data:` URI with zero measurable HTML bloat. Read the LQIP file at Astro build time and inject it into the template (`import { readFileSync } from 'node:fs'` in the component frontmatter, reading `public/sky/milky-way-lqip.txt`) rather than hardcoding the string, so `scripts/build-sky.mjs` remains the single source of truth.

### 4.3 Stacking (read from the live code, not assumed)

Current `NightSky.astro` (read directly): `.nightsky-host { position:fixed; inset:0; z-index:-1 }`. The canvas is `display:block; width:100%; height:100%` with no explicit `z-index` (relies on DOM order — it's the canvas's own paint, drawn on top of nothing else inside the host today). `.camper` is `position:absolute` inside the same host, after the canvas in DOM order (paints on top of the canvas by tree order, no explicit z-index needed since siblings without `z-index` stack by document order).

**Recommended stacking (DOM order only, no new z-index values needed within the host):**
```
.nightsky-host (z-index:-1, unchanged)
  └─ .sky-photo (NEW — first child, no explicit z-index, paints first/bottom by DOM order)
  └─ #nightsky-canvas (existing — second child, paints on top of the photo by DOM order)
  └─ .camper (existing — third child, paints on top of both)
```
This requires **zero new z-index values** — the existing DOM-order-based stacking (no explicit z-index on canvas or camper) already produces the correct paint order once `.sky-photo` is inserted as the FIRST child. This is simpler and lower-risk than introducing explicit z-index numbers, and it's consistent with how the camper already stacks above the canvas today.

### 4.4 Classic/no-JS behavior confirmation

Because `.sky-photo`/`<picture>`/`<img>` are plain static markup (no `<script>` involvement to render them, unlike the canvas which requires `initNightSky()` to run), **the photo renders identically whether or not `initNightSky()` ever executes** — this directly satisfies IMG-02's "present in no-JS classic mode" requirement and closes the exact gap `PITFALLS.md`'s Pitfall 5/carry-forward-item-1 flagged (a canvas-drawn photo would be invisible under no-JS; a plain `<img>` is not). No additional no-JS-specific markup branch is needed — this is a natural consequence of the `<picture>` approach, not something requiring extra code.

---

## 5. Overlay Adaptation Surgery

Grounded in a full read of `starfield.ts` (596 lines) and `scene.ts` (609 lines) this session — every function named below is a real, currently-existing function, not a guess.

### 5.1 What goes transparent / is removed from `starfield.ts`'s `generateLayer0()`

| Current code (starfield.ts) | Phase 7 disposition | Why |
|---|---|---|
| Sky wash gradient `fillRect` (lines 534-541) + `ditherRows()` chunked dither pass (lines 545-553) | **REMOVE entirely** | The photo IS the sky wash now; an opaque gradient fill would hide it completely. Layer 0's canvas must be left transparent in these regions (never call `fillRect` over the full canvas). |
| Starfield loop — all 4 magnitude bands (`BANDS`, lines 555-582) | **REMOVE the bake, KEEP position/metadata generation for Mid+Bright only** (see 5.2) | CONTEXT.md: "Procedural 4-band ambient field: REDUCED to the ~40-star twinkle subset... the photo provides ambient stars." The Faintest (65%) and Dim (22%) bands (87% of the star count) are never twinkle-eligible per `BANDS`'s own `twinkleEligible` flag — they can be deleted outright, not just un-baked. |
| `queueMilkyWay()` (haze passes + fine/coarse dust, lines 439-487) and its call site (line 585) | **REMOVE entirely** | CONTEXT.md: "Procedural Milky Way: OFF (the photo provides it)." This also removes `MW_HAZE_PASSES`/`MW_FINE_DUST_COUNT`/`MW_COARSE_DUST_COUNT`/`milkyWayCenterlineX()`/`drawDustDot()` — all dead code once the call site is gone. |
| `drawMoon()` call (line 590) | **KEEP unchanged** | CONTEXT.md: "KEPT drawn:... crescent moon." No change to `drawMoon()`'s own logic — it already draws on a transparent-compatible path (`source-over` only, never `destination-out`, per its own doc comment) so it composites correctly over a photo exactly as it does over the procedural wash today. |

### 5.2 SKY-05 governor retirement / re-scoping

`columnAttenuation()`/`starAlphaCapAt()` (lines 109-126) currently do two jobs: (a) attenuate baked Milky Way dust alpha inside the content column, (b) cap baked star alpha inside the column AND gate which stars are twinkle-eligible (`if (spec.twinkleEligible && alphaCap >= 0.999) twinkleStars.push(...)`, line 578).

- **Job (a) is retired outright** — there is no baked Milky Way dust anymore to attenuate.
- **Job (b)'s alpha-capping half is retired** — there is no baked star canvas draw to cap.
- **Job (b)'s inclusion-gating half should be KEPT, re-scoped from "smoothstep alpha cap" to a hard margin-only exclusion**, mirroring the pattern `scene.ts`'s own `fireflyRanges()`/`contentColumnEdges()` already establish for fireflies (lines 106-125): generate twinkle-star candidate positions **only within the horizontal margins outside the content column** (reuse/mirror `contentColumnEdges()`'s exact formula — it's already duplicated once per the module-boundary doctrine, duplicating it a second time into starfield.ts is consistent with the existing pattern, not a new violation), rather than scattering across the full width and filtering by a smoothstep cap. This is simpler than the smoothstep math it replaces (a hard include/exclude instead of a continuous ramp) BECAUSE there is no longer a baked pixel to ramp smoothly — the "no visible seam" reason for the smoothstep (avoiding a hard edge in baked alpha) no longer applies once these are individually-drawn Layer-2 point sprites, not a continuous baked field.
- CONTEXT.md's own framing confirms this: "the equivalent duty moves to crop/exposure choice + scrim, verified by contrast" — i.e., the governor's *job* (keep bright things off text) moves from "attenuate the procedural bake" to "choose a crop/exposure that isn't blindingly bright under the column" + "the existing scrim" + "the twinkle subset staying in the margins by construction." All three are covered without smoothstep math.

### 5.3 What the twinkle subset samples once the ambient field shrinks

Today (`scene.ts` `seedTwinkles()`, lines 232-255): reads `layer0.twinkleStars` (populated by `generateLayer0()`'s per-star loop, filtered to Mid+Bright bands outside the column), stride-samples 50% of them (`TWINKLE_SUBSET_FRACTION = 0.5`), assigns each a random period/phase/amplitude, done once per Layer-0 (re)generation.

**Phase 7 change:** `generateLayer0()` must still return a populated `twinkleStars: StarMeta[]` array (the `Layer0Result` interface's contract doesn't change — `scene.ts` continues to consume it identically), but the loop that builds it no longer calls `layer0Ctx.fill()` — it only computes `{x, y, radius, baseAlpha, color}` for Mid+Bright-band candidates confined to the margins (per 5.2) and pushes them to the array, skipping the canvas draw call entirely. `seedTwinkles()`'s own stride-sampling logic in `scene.ts` needs **zero changes** — it already operates purely on the metadata array, agnostic to whether that metadata was ever baked to a canvas.

**Star count implication:** with the Faintest/Dim bands removed and Mid+Bright candidates confined to margins only (roughly the outer ~20-30% of viewport width combined, vs. the full width before), expect the raw candidate pool feeding `twinkleStars` to shrink from ~13% of `starCountForArea()`'s ~350-1200 total (i.e., ~45-155 candidates) down to a smaller margin-confined subset — but since `seedTwinkles()` already stride-samples toward the locked ~40-star target (05-UI-SPEC.md's "~40 stars" ambient-loop spec), the FINAL rendered twinkle count should stay close to today's ~40, just drawn from a smaller, margin-only candidate pool. **Verify this empirically during implementation** — if the margin-confined pool is too sparse to reach ~40 after stride-sampling, `TWINKLE_SUBSET_FRACTION` may need to rise (sample a larger fraction of a smaller pool) rather than the target count dropping; flag this as an Open Question (§ below).

### 5.4 Expected Layer 0 generation cost change (quantified from the code, not guessed)

Per `frame-cost-audit.md`'s own SKY-03 audit (read directly), the CURRENT `generateLayer0()` chunked queue contains, at the 1440×900 reference viewport:
- Dither: `Math.round(canvas.height * 0.85) / DITHER_ROWS_PER_UNIT` ≈ `(900*2*0.85)/24` ≈ **64 work units**
- Starfield: up to `STAR_COUNT_CAP` = **1200 work units** (worst case; ~700 typical at reference)
- Milky Way: `MW_HAZE_PASSES * MW_HAZE_BLOBS_PER_PASS` (4×22=88) + `MW_FINE_DUST_COUNT` (1400) + `MW_COARSE_DUST_COUNT` (260) = **1748 work units**
- Moon: **1 work unit**
- **Total: ~2,013-2,513 chunked work units today**, spread across multiple `requestIdleCallback`/`setTimeout` slices.

**Phase 7:** removes the dither pass (64), the starfield loop (up to 1200), and the entire Milky Way composite (1748) — **leaving only the moon (1 work unit) plus lightweight twinkle-candidate metadata generation** (no canvas draw calls, just array pushes — cheap enough to not need idle-scheduling at all, though leaving them in the existing `drainQueue()` machinery is harmless and simpler than special-casing them out). **`generateLayer0()`'s total real work drops by roughly 99%** — from ~2,000+ idle-scheduled canvas draw calls to essentially one. This means Layer 0 (re)generation on init and on resize becomes near-instant rather than something that visibly streams in over several idle-callback frames — a genuine, positive, measurable side effect of the photo swap, not just an implementation footnote. The existing `requestIdle`/`drainQueue` chunking machinery should be **left in place** (not ripped out) — it's cheap infrastructure, costs nothing when the queue is nearly empty, and Phase 9's ambient systems may plausibly want it again.

### 5.5 Blit path — confirmed unchanged

`scene.ts`'s `drawFrame()` (lines 323-381) does `visibleCtx.clearRect(...)` then `visibleCtx.drawImage(layer0.canvas, 0, 0, w, h)` every frame, unconditionally, regardless of what Layer 0 contains. **No code change is needed here** — blitting a near-empty (mostly transparent) Layer-0 canvas over the photo works identically to blitting a fully-opaque one; the browser's compositor handles the transparency correctly since `#nightsky-canvas` itself has no CSS `background` set (confirmed: `#nightsky-canvas { display:block; width:100%; height:100%; pointer-events:none; }`, no `background` property) — the photo `<img>` sitting behind it in DOM order shows through the canvas's transparent pixels automatically, with zero JS-side compositing logic required.

---

## 6. Photo-Aware Contrast Sampling (Minimal Phase-7 Evolution)

### 6.1 Recommendation: extend the analytic drawImage composite (Option A), not screenshot sampling

CONTEXT.md explicitly frames this as choosing "the smallest honest evolution," leaving the full screenshot-sampling re-architecture for Phase 8. Assessed both options concretely:

- **Option B (CDP `Page.captureScreenshot`):** returns base64 PNG. Node has no built-in PNG decoder — decoding it without a new npm dependency means hand-rolling zlib-inflate + PNG unfiltering, a genuinely non-trivial "Don't Hand-Roll" violation for a phase that has zero glass/blur to justify the cost yet (Phase 7 has NO `backdrop-filter` anywhere — that's Phase 8). This is the CORRECT long-term answer once blur exists (`GLASS.md` §3.4 already recommends it for that reason), but adopting it now pays that cost a full phase early for no benefit.
- **Option A (in-page `drawImage` composite):** the served `<img>` is already a decoded, same-origin bitmap sitting in the DOM. `ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, destW, destH)` reads its pixels directly through the browser's own compositor — **no screenshot round-trip, no PNG decoding, mathematically exact for the pre-blur case** (Phase 7 has no blur to approximate). This is strictly less work AND strictly more correct for Phase 7's actual composited stack than Option B would be.

**Recommendation: Option A.**

### 6.2 Exact implementation shape

Inside `samplePageOnce()` (the in-page function `verify-contrast.mjs` already injects, read directly), before compositing the scrim over the `#nightsky-canvas` pixel, add one earlier compositing step: draw the ACTUAL rendered `<img>` element into a same-size offscreen canvas using **`object-fit: cover`'s own crop formula** (replicate it — `drawImage` does not understand CSS `object-fit` on its own):

```js
// Inside samplePageOnce(), before the existing canvas.getImageData() calls:
const photoImg = document.querySelector('.sky-photo img');
let photoCtx = null;
if (photoImg && photoImg.complete && photoImg.naturalWidth) {
  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = canvas.width;   // match #nightsky-canvas's backing store exactly
  photoCanvas.height = canvas.height;
  photoCtx = photoCanvas.getContext('2d', { willReadFrequently: true });
  // Replicate CSS `object-fit: cover` source-rect math (no built-in browser API for this):
  const nw = photoImg.naturalWidth, nh = photoImg.naturalHeight;
  const destAR = photoCanvas.width / photoCanvas.height;
  const srcAR = nw / nh;
  let sx, sy, sw, sh;
  if (srcAR > destAR) { sh = nh; sw = nh * destAR; sy = 0; sx = (nw - sw) / 2; }
  else { sw = nw; sh = nw / destAR; sx = 0; sy = (nh - sh) / 2; }
  photoCtx.drawImage(photoImg, sx, sy, sw, sh, 0, 0, photoCanvas.width, photoCanvas.height);
}
```

Then in `compositePixel()` (or its equivalent for this new step), read the corresponding `photoCtx` pixel FIRST (as the new "bottom" layer), composite the `#nightsky-canvas` pixel over it via standard `source-over` alpha blending (using the canvas pixel's own alpha channel — Layer 0 is now mostly transparent, so most pixels will show ~100% photo, with the moon/twinkle/constellations/meteors/fireflies partially or fully overriding it where drawn), THEN continue with the exact existing scrim/DOM-layer compositing chain unchanged. This is a genuinely small, additive change — one new offscreen canvas, one new `drawImage` call with a ~10-line `object-fit:cover` math helper, and one new compositing step inserted at the bottom of the existing stack — not a rewrite of the verifier's architecture.

**`willReadFrequently: true`** on the photo canvas context, mirroring the existing `#nightsky-canvas` context option and `starfield.ts`'s own dither-pass precedent — this workload does many `getImageData` reads per panel-sample pass.

### 6.3 Why this stays honest under CONTEXT.md's "no silent unverified contrast" rule

Because Layer 0's canvas alpha channel is now the deciding factor for how much photo vs. drawn-element color shows at any given pixel, and the sampler reads that alpha directly via `drawImage`'s own compositing (which respects source alpha automatically when drawing the canvas on top — standard `source-over` semantics), the worst-case scan remains a TRUE worst-case over the actual rendered pixels, not an approximation. The one thing this method does NOT model (correctly, and honestly documented as a known gap) is `backdrop-filter` blur — because there isn't any yet. Document this explicitly in the script's own header comment (mirroring its existing self-documentation style) so a future reader doesn't mistake "handles the photo correctly" for "handles glass correctly."

---

## 7. Pitfall Checklist for This Phase (Ordered, with Detection Commands)

1. **Layer 0 opaque-fill leftover hides the photo entirely.** If any `fillRect`/gradient fill spanning the full canvas survives in `starfield.ts` after the edit, the photo will be invisible behind an opaque Layer 0 even though the code "looks removed." **Detection:** `grep -n "fillRect(0, 0, cssWidth" src/lib/nightsky/starfield.ts` should return nothing spanning above `horizonYCss`; visually confirm via a full-page screenshot that Milky Way texture is visible, not the old flat gradient.
2. **Preload/`<picture>` `srcset`/`sizes` mismatch → double-fetch.** If the `<link rel=preload imagesrcset=...>` and the `<picture>`'s own `<source srcset=...>` don't resolve to the identical selected resource at a given viewport width, the browser fetches the preload-selected image AND separately fetches the `<picture>`-selected image. **Detection:** Chrome DevTools Network tab, filter by `sky/`, confirm exactly ONE request per unique filename per page load; alternatively `curl`-free check via Lighthouse's "Preload Largest Contentful Paint image" audit passing with zero "duplicate/wasted" flags.
3. **Late `img` sizing causes CLS.** Because `.nightsky-host` never participates in document flow (`position:fixed`), this is structurally low-risk (per §4.2), but confirm `.sky-photo`/`picture`/`img` all get explicit `inset:0; width:100%; height:100%` BEFORE first paint (in the component's own `<style>` block, not injected later by JS) — a JS-injected sizing rule would flash unsized content. **Detection:** Lighthouse CLS score at the LCP checkpoint must read `0` or match the pre-photo baseline (`0.003` mobile / `0` desktop, per `05-06-SUMMARY.md`'s recorded baseline).
4. **AVIF color-profile shifts on wide-gamut displays.** The source TIFF carries an embedded ICC profile (confirmed: `hasProfile: true` in the metadata read this session) — if `sharp`'s encode pipeline strips or mishandles that profile, colors can shift (usually oversaturation) on wide-gamut (P3) displays. **Detection:** explicitly pass through or convert color space during the pipeline (`sharp(...).toColorspace('srgb')` before encode, since the source is already `srgb` per the metadata — an explicit no-op conversion call still forces sharp to normalize the embedded profile rather than silently carrying inconsistent profile metadata into the AVIF container); visually spot-check the encoded AVIF against the source JPEG side-by-side for a hue/saturation shift.
5. **`sky-source/` raw TIFF committed to git by accident.** A 15.6MB (or, if escalated, 91.3MB) binary file committed to git history is expensive to remove later. **Detection:** confirm `/sky-source/` is in `.gitignore` BEFORE running `curl` for the first time (add the line first, download second); `git status` should show nothing under `sky-source/` at any point.
6. **Windows path quirks in the sharp build script.** This environment is Windows/Git Bash — `sharp`'s Node API takes plain JS strings (no shell involved for the actual encode calls), so this is lower-risk than a shell-invoked CLI tool would be, but the download step (`curl -o sky-source/...`) and any path joining in the script MUST use `path.join()`/forward-slash-safe construction, not hardcoded backslashes, since the script may also run in CI (GitHub Actions runs on `ubuntu-latest`, confirmed via `astro.config.mjs`'s deploy workflow context) — **the build-time script itself is NOT part of the CI build** (per CONTEXT.md: "masters checked in... via a committed script" — it's a local, one-time, hand-run tool, not wired into `astro build`), so this is lower risk than it first appears, but still write it portably since it may be re-run by a different contributor on a different OS later.
7. **`imagesrcset`/preload referencing a file that doesn't exist yet during local dev iteration.** If the planner scaffolds the `<picture>` markup before `scripts/build-sky.mjs` has been run once, `astro dev`/`astro build` will 404 on the referenced `/sky/*.avif` files (not a build error, since `public/` files aren't typechecked — this fails silently as a broken image at runtime). **Detection:** `npm run build && ls dist/sky/` should list all 5 expected files (`milky-way-{1920,2560}.{avif,webp}` + `milky-way-lqip.txt` if kept as a separate file) before the `<picture>` markup task is considered done.
8. **Object-fit `cover` cropping the band out of frame at extreme aspect ratios.** A very tall/narrow mobile viewport with `object-fit:cover` on a wide banner-shaped master could crop the Milky Way band entirely out of the visible area. **Detection:** manually check the rendered page at a narrow mobile width (e.g. 375×812) — if the band disappears, either widen the master's vertical extent during the build-time crop (§1) or add an `object-position` tuned specifically for narrow viewports via a media query.
9. **Credit line missing from classic/no-JS mode.** IMG-04 requires the credit line present in BOTH deck and classic modes; since `SiteFooter.astro` is a shared component across deck-active, classic-active, AND non-home pages (`work/[slug].astro`, `404.astro` — confirmed via `PITFALLS.md`'s grounding), decide explicitly whether the credit line renders on every page (even where there's no photo) or is conditionally passed as a prop — an unconditional add is simplest and least likely to be silently missed, but reads oddly on case-study pages with no sky behind them; flag as a planner decision, not something to leave ambiguous. **Detection:** `curl -s http://localhost:4321/ | grep -i "NOIRLab"` (and the same against `/work/<slug>/`) confirms presence with zero JS execution.
10. **Twinkle subset count drops noticeably below ~40 once confined to margins.** Per §5.3's flagged uncertainty — if the margin-confined candidate pool can't sustain the locked ~40-star target after stride-sampling, the scene will look sparser than the reference spec intends. **Detection:** log `twinkles.length` after `seedTwinkles()` at the 1440×900 reference viewport during manual testing; compare against the current baseline (~40-45, per `05-UI-SPEC.md`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive-image format negotiation | A custom `<script>`-based format-sniffing/swap mechanism | Native `<picture>` + `<source type="image/avif">`/`<source type="image/webp">` + `<img>` fallback | Zero-JS, works in no-JS classic mode (a hard IMG-02 requirement), browser-native format negotiation is exactly what `<picture>` exists for |
| PNG/screenshot pixel decoding for contrast sampling (Phase 7 specifically) | A hand-rolled zlib-inflate + PNG-unfilter decoder to read `Page.captureScreenshot` output | `ctx.drawImage(imgEl, ...)` reading the already-decoded, same-origin `<img>` bitmap directly (§6) | The browser has already decoded the image for you; screenshot-based sampling only earns its complexity once there's a blur kernel to approximate (Phase 8), not before |
| Equirectangular crop distortion math | Eyeballing "roughly the middle" of the source map | The `1/cos(latitude)` stretch formula + the verified largest-inscribed-rectangle-after-rotation formula (§1.3-1.4) | Both formulas are standard, small, and were verified against real pixel output this session — "eyeball it" risks either visible pole-stretch distortion or fill-color contamination at the crop edges, both of which are silent until someone looks closely |
| Luminance histogram / banding detection | A generic image-quality library | ~30 lines of `sharp().raw()` + a luminance-bin-run counter (§2) | The exact detection signal needed (disconnected histogram runs) is narrow and was hand-verified against a real pass/fail pair this session — a generic library would be overkill and a new dependency for a well-bounded, already-solved problem |
| AVIF/WebP encoding | `avifenc`/`cwebp` CLI tools via `npx` | `sharp`'s already-present `.avif()`/`.webp()` methods | Confirmed `npx avifenc` isn't even resolvable against this project's npm registry; `sharp` already does the job with a verified API surface |

**Key insight:** every "don't hand-roll" item above was tempting specifically because the milestone-level research (`IMAGERY.md`/`PITFALLS.md`/`GLASS.md`) surfaced it as a real technique used elsewhere in the wild (screenshot sampling, dedicated histogram libraries, CLI encoders) — but for THIS phase specifically, the already-present toolchain (`sharp`, native `<picture>`, the browser's own `drawImage`) covers every need with less code and zero new dependencies. The milestone-level recommendations remain correct for Phase 8 (screenshot sampling) — they are just premature for Phase 7.

## Common Pitfalls

See §7 above for the full ordered, phase-specific checklist with detection commands. The following two are carried forward from `PITFALLS.md`/`GLASS.md` because they remain live risks even though this phase has no glass yet:

### Pitfall: LCP regression threatens the mobile Lighthouse ≥90 floor
**What goes wrong:** the current live site has zero images and LCP 0.4-1.4s (`05-06-SUMMARY.md`'s recorded baseline); a full-viewport photo becomes an LCP candidate, and Chrome's own guidance documents 500ms+ costs for a non-preloaded/non-`fetchpriority`-hinted LCP image `[CITED: milestone-research, PITFALLS.md Pitfall 2]`.
**How to avoid:** the exact `<picture>` + preload mechanism in §4; run the dedicated post-integration Lighthouse checkpoint (both presets) BEFORE any further work in this phase, per CONTEXT.md's explicit blocking-gate instruction.
**Warning signs:** Lighthouse "Preload Largest Contentful Paint image" audit failing; LCP number landing above ~2.5s on mobile-preset.

### Pitfall: Canvas2D's 8-bit compositing bottleneck defeats the 10-bit AVIF encode's purpose
**What goes wrong:** if the photo were ever `drawImage()`'d INTO `#nightsky-canvas` (rather than sitting behind it as a separate DOM element), the browser's Canvas2D context clamps to 8-bit regardless of the source encode's bit depth `[CITED: milestone-research, PITFALLS.md Pitfall 1 item 4 — "Canvas2D is 8-bit" is HIGH confidence, documented browser behavior]`.
**How to avoid:** this is structurally prevented by §4's architecture (photo as a plain `<img>`, never drawn into the canvas) — but it's worth a code-review-time grep check: `grep -n "drawImage" src/lib/nightsky/scene.ts` should show the photo `<img>` element NEVER appearing as a `drawImage()` source anywhere.
**Warning signs:** none should be observable if §4's architecture is followed correctly — this is a "verify the plan was followed" check, not a runtime symptom to watch for.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `2x-resolution-lower-quality` anti-banding trick (deliver at 2x display resolution, let the browser downscale) will help on THIS specific source image | §1 (carried from `IMAGERY.md`, not independently re-tested this session at 2x scale) | Low — this is an additive, easily-reversible technique to try during Spike 1's own quality tuning; if it doesn't measurably help on this source, drop it without affecting anything else |
| A2 | The margin-confined twinkle candidate pool will still sustain ~40 rendered twinkle stars after stride-sampling (§5.3) | §5.3, flagged explicitly as needing empirical verification | Medium — if the pool is too sparse, the ambient scene reads sparser than the locked 05-UI-SPEC target; fix is a one-line `TWINKLE_SUBSET_FRACTION` adjustment, not a structural problem |
| A3 | ESO `eso0932a` fallback URL pattern (`https://cdn.eso.org/images/publicationtiff/eso0932a.tif`) — verified via direct `WebFetch` this session, but the fallback path itself was not exercised (NOIRLab is the primary and worked cleanly) | §1 (fallback only) | Low — only matters if NOIRLab access breaks between now and implementation; the URL was independently confirmed working this session via direct fetch, just not downloaded/tested end-to-end like the NOIRLab asset was |
| A4 | Astro's named-slot mechanism correctly resolves `slot="head"` content into a layout's `<head>` at render time (§4.1) | §4.1 | Low — this is well-established, widely-documented Astro behavior (not a novel/edge-case usage), but wasn't tested against THIS project's exact Astro 7.0.7 install this session; verify with `astro check` + a build once implemented |

**If this table is empty:** N/A — see entries above; all are low-to-medium risk with cheap, reversible fixes.

## Open Questions

1. **Where exactly should the final crop window land within the verified safe zone (rows 550-1450, any column range)?**
   - What we know: the safe-zone/distortion formula (§1.3), and one empirically-located candidate (galactic core, rows ~1000-1090, columns ~1670-2470) that produced a visually convincing result this session.
   - What's unclear: whether the galactic-core region is the BEST compositional match to `05-UI-SPEC.md`'s exact target look (which was designed against a procedural approximation, not this specific real photo) — there may be a better-composed alternative crop elsewhere in the safe zone.
   - Recommendation: Spike 1 should generate 2-3 candidate crops (varying the column window within the verified safe row-range) and eyeball-compare against `05-UI-SPEC.md`'s target composition before locking one — this is explicitly Claude's Discretion per CONTEXT.md, and the tooling to generate candidates quickly now exists (this session's script).

2. **Does the twinkle-subset margin-confinement (§5.2/5.3) need the SAME margin formula as fireflies, or a wider one?**
   - What we know: fireflies use `contentColumnEdges()` + an 8px cushion; constellations use a similar but distinct margin-remap (per `05-06-SUMMARY.md`'s deviation #4).
   - What's unclear: whether reusing the firefly formula verbatim for twinkle stars produces visually appropriate density, or whether twinkle stars (being smaller/more numerous than fireflies) tolerate a tighter cushion.
   - Recommendation: start with the firefly formula (simplest, already-proven-correct reuse), verify visually, adjust the cushion constant only if it looks obviously wrong — not a blocking decision.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `sharp` (Node module) | Entire image pipeline (§1, §2) | ✓ | 0.35.3 (confirmed, already in `node_modules`) | — |
| Network access (`curl`/`fetch` to `noirlab.edu`) | Downloading the source TIFF | ✓ (confirmed this session — real download succeeded) | — | Manual browser download (§1.1) if the execution environment lacks network access |
| Headless Chrome | Spike 2 CDP soak (§3), photo-aware contrast sampling (§6), Lighthouse checkpoint | Not independently re-verified this session (relies on `scripts/verify-contrast.mjs`'s existing `findChrome()` locating a local install) | — | `CHROME_PATH` env var override, per the existing script's own fallback |
| `npx avifenc` | N/A — confirmed NOT needed | ✗ (confirmed 404 against this registry) | — | Not needed — `sharp` covers everything (§1.8) |

**Missing dependencies with no fallback:** none — every dependency this phase needs is either already present or has a documented manual fallback.

**Missing dependencies with fallback:** headless Chrome availability should be spot-checked at the start of implementation (`node -e "require('child_process').execSync(process.env.CHROME_PATH || 'where chrome')"` on Windows, or reuse `verify-contrast.mjs`'s own `findChrome()` candidates list) since Spike 2 and the LCP checkpoint both depend on it.

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` per `.planning/config.json`. This phase has an unusually small security surface — no auth, no user input, no session state, no server-side code (`output:'static'`).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A — no auth anywhere in this project |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | Marginal — the build-time script itself | The `scripts/build-sky.mjs` script takes no user/network input beyond a hardcoded, reviewed URL (§1.1) — it is a build-time-only tool, never exposed as a runtime endpoint; no injection surface exists (no shell interpolation of untrusted strings — the download URL is a hardcoded literal, not user-supplied) |
| V6 Cryptography | No | N/A — no secrets, no encryption needed for a public CC-BY-licensed static image |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Supply-chain risk in a hardcoded download URL (if the source host is ever compromised, a malicious file could be silently accepted) | Tampering | Not practically mitigable for a one-time, human-run build script downloading from a named institutional source (NOIRLab) — the existing project convention (font subsetting, OG image) already trusts similarly-sourced one-time downloads; document the exact URL + expected byte size (§1.1) so a future re-run can sanity-check the download against the recorded expected size before using it |
| Malformed/oversized image file causing a DoS-like resource exhaustion during the build-time `sharp` pipeline | Denial of Service (build-time only, not a runtime/user-facing DoS) | Low severity — this is a local, human-run build tool, not a runtime service; a malformed file simply fails the script, it does not expose any live system |

---

## Sources

### Primary (HIGH confidence — verified this session via direct tool calls)
- `https://noirlab.edu/public/media/archives/images/publicationtiff/noirlab2430b.tif` — `curl` HEAD/GET, confirmed 200 OK via 301 redirect to `storage.noirlab.edu`, 16,359,276 bytes
- `https://noirlab.edu/public/images/noirlab2430b/` — `curl`-fetched HTML, credit line and license text extracted directly (`grep`), dimensions/FOV table extracted directly
- `https://noirlab.edu/public/copyright/` — `curl`-fetched HTML, "reproduced without fee provided the credit is clear and visible" confirmed verbatim
- Local `node_modules/sharp/package.json` + `node_modules/sharp/lib/index.d.ts` — version 0.35.3, `AvifOptions`/`WebpOptions` type surface read directly
- Real `sharp` pipeline runs against the actual downloaded TIFF this session: `.metadata()`, `.extract()`, `.rotate()`, `.composite()`, `.avif()`, `.webp()`, `.raw()` — all exercised, all outputs inspected (byte sizes, corner-pixel sampling, visual screenshot review)
- `src/components/NightSky.astro`, `src/lib/nightsky/starfield.ts`, `src/lib/nightsky/scene.ts`, `src/lib/nightsky/tokens.ts`, `src/pages/index.astro`, `src/layouts/BaseLayout.astro`, `src/components/SiteFooter.astro`, `scripts/verify-contrast.mjs`, `astro.config.mjs`, `package.json`, `src/styles/deck.css`, `src/styles/tokens.css` — all read directly this session
- `.planning/milestones/v2.0-phases/05-night-sky-scene/05-06-SUMMARY.md`, `frame-cost-audit.md`, `05-UI-SPEC.md` — read directly this session for the exact CPU-soak methodology and band-geometry target

### Secondary (MEDIUM confidence)
- `https://www.eso.org/public/images/eso0932a/` — WebFetch (direct), confirmed the ESO fallback URL pattern, not independently downloaded/tested this session
- `https://docs.astro.build/en/basics/layouts/` — WebFetch, confirmed general named-slot mechanics; the specific `slot="head"` pattern is standard Astro behavior but the fetched page itself didn't explicitly demonstrate it

### Tertiary (carried forward from milestone research, LOW-MEDIUM per their own tags)
- `.planning/research/IMAGERY.md`, `PITFALLS.md`, `GLASS.md` — read in full this session; every claim reused here is tagged `[CITED: milestone-research]` and was NOT re-verified independently unless explicitly marked `[VERIFIED: this session]` above

## Metadata

**Confidence breakdown:**
- Download pipeline (URL, byte sizes, dimensions, license text): HIGH — every figure independently re-verified via live `curl`/`sharp` calls this session, not carried forward from prior research
- Crop/rotate/blend math: HIGH — formulas verified against real pixel output (bounding-box growth, inscribed-rectangle corner sampling, gradient blend visual review)
- Banding histogram detector: HIGH — built and validated against a real pass/fail pair this session
- Astro `<picture>`/preload integration: MEDIUM-HIGH — mechanism is standard/documented Astro behavior, but not built-and-tested against this exact codebase this session (a planning-time synthesis of read code + documented Astro behavior, not an executed build)
- Overlay adaptation surgery (§5): HIGH on the "what changes" mapping (grounded in a full direct read of the current 596+609 lines of source), MEDIUM on the exact twinkle-count outcome (flagged as an open question requiring empirical verification during implementation)
- Spike 2 harness/CDP methodology: HIGH on the methodology (read directly from committed evidence files), MEDIUM on exact numbers (the actual soak script was scratchpad-only, not committed, so it's being reconstructed from its documented output, not copied verbatim)

**Research date:** 2026-07-18
**Valid until:** the download URLs/byte sizes are stable institutional assets (unlikely to change) — treat as valid indefinitely for THIS phase's purposes, but re-verify byte sizes with a fresh `curl -I` immediately before Spike 1 actually runs, in case the source is ever updated. The Astro-slot/sharp-API findings are valid for as long as the pinned `astro@^7.0.7`/`sharp@0.35.3` versions remain unchanged in `package-lock.json`.
