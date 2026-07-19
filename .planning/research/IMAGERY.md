# Real Sky Imagery Research (v3.0 "Real Sky")

**Scope:** Sourcing, licensing, compositing, and delivery of real astrophotography imagery to replace the procedural night-sky base while keeping the drawn constellation/meteor/moon overlay on top.

**Method:** WebSearch + WebFetch against primary source pages (ESO, NOIRLab, NASA, Wikimedia Commons, Sharp/Astro docs). Every load-bearing claim is confidence-tagged. `noirlab.edu` blocked direct WebFetch twice (returned empty content — likely bot/JS gate); those claims are corroborated via 2–3 independent WebSearch syntheses instead and tagged MEDIUM accordingly.

**Status:** COMPLETE.

---

## 1. Sources Evaluated

| Source | What it is | Real-photo? | Max free resolution | License | Verdict |
|---|---|---|---|---|---|
| **ESO GigaGalaxy Zoom (S. Brunier), `eso0932a`** | Single-photographer 360°×180° all-sky panorama, ~1200 photos stitched from La Silla/Paranal, Aug 2008–Feb 2009 | Yes (real composite of real exposures) | 6000×3000 px (18MP), 7.8MB JPEG. Full 800MP original is NOT freely downloadable — "for copyright reasons" it must be requested directly from Brunier | CC BY 4.0 | **Strong candidate.** Ground-based, galactic-plane-horizontal composition — closest in spirit to a classic "Milky Way arch" look. 18MP ≈ 6000×3000 is comfortably above any web crop need (site needs ≤2560w). |
| **NOIRLab all-sky panorama, `noirlab2430b`** ("largest open-source, freely available all-sky photo") | Multi-location, multi-year composite: Eckhard Slawik's film exposures from Germany, Tenerife, La Palma, Namibia, Chile, each panel a dual exposure (with/without diffuser for star color), released Dec 2024 as part of NOIRLab's "88 Constellations" project | Yes — explicitly "combining real images" (matches user's own phrasing) | 40,000 px wide JPEG (large) + a ~1GB TIFF "original" (`.../original/noirlab2430b.tif`) | CC BY 4.0 (NOIRLab's general image/video policy; not independently confirmed on this specific page due to fetch block — MEDIUM) | **Best candidate by far.** No fixed horizon (it's a full celestial-sphere compile, not a single-location ground shot) — meaning there is no "wrong" crop angle to fight; you can rotate/crop the diagonal Milky Way band anywhere without a foreground horizon constraining you. Also the single most literal match to "combining real images." Credit line confirmed: `NOIRLab/NSF/AURA/E. Slawik/M. Zamani`. |
| **ESA/Hubble** | Deep-space imagery (nebulae, galaxies, star clusters) | Yes, but not wide-field ground-based sky panoramas | Varies per image | CC BY 4.0 (confirmed, fetched directly) | **Not a fit.** Hubble's catalog is telescopic/deep-field, not the kind of "sky dome with a Milky Way band" look the site needs. Keep as a fallback only if a specific nebula accent asset is wanted later — out of scope for the base sky. |
| **NASA (general) / NASA APOD** | Aggregator; NASA-produced content is public-domain, but APOD specifically re-publishes a huge amount of third-party amateur/pro astrophotography | Mixed | Varies | **NOT uniformly safe.** NASA-produced imagery: no copyright in the US. APOD as a page: per NASA's own `apod/fap/lib/rights.html` framing (confirmed via search, direct fetch 404'd) and the APOD FAQ (fetched directly), "many APOD images are copyrighted" and require locating + contacting the individual photographer — APOD gives no simple public-domain/non-public-domain flag per image. Independent estimate found in search: **~45% of APOD images are photographer-copyrighted**, ~55% NASA public domain (MEDIUM confidence, single secondary-source stat, but directionally consistent with NASA's own caveat language). | **AVOID as a source unless you individually verify NASA authorship on a specific image page** — too easy to grab a beautiful APOD photo that turns out to be a named photographer's copyrighted work, which fails the honesty-gate spirit of exact, verifiable attribution. |
| **Wikimedia Commons astrophotography** | Mirror/aggregator; hosts a copy of the ESO Brunier image (`File:ESO_-_Milky_Way.jpg`, confirmed CC BY 4.0, same 6000×3000/7.23MB, same credit) plus other user-contributed astrophotography under varying CC0/CC-BY/CC-BY-SA licenses | Yes | Varies per file — check each file page individually | Varies per file — **must be checked per-file**, no blanket license | **Useful as a secondary mirror/verification of the ESO file**, not as a primary discovery source — Commons license tags on user-submitted astrophotography are less consistently reliable than an institutional source, and quality/resolution of non-ESO/NOIRLab Milky Way panoramas on Commons is inconsistent. |
| **Unsplash** | Stock photo platform | Some real Milky Way night-sky photos exist, but catalog also increasingly includes AI-generated/AI-enhanced "night sky" images not disclosed as such (general 2026 stock-photo risk — LOW confidence, not independently verified for this specific query, flagged as caution not fact) | Full res, no cap | Unsplash License: commercial use OK, **no attribution required** (confirmed via search of `unsplash.com/license` + Unsplash Help Center) | **Usable but risky for "real astrophotography" honesty framing** — no institutional guarantee the image is an authentic unedited/lightly-edited real composite vs. AI-touched. Also typically single-exposure landscape shots (with foreground), not equirectangular all-sky sources good for arbitrary diagonal-band cropping. |
| **Pexels** | Stock photo platform | Same caution as Unsplash | Full res, no cap | Free for commercial + personal use, **no attribution required** except via API integration (confirmed via search of `pexels.com/license`) | Same verdict as Unsplash — usable as a fallback, not the honesty-forward choice for a portfolio whose whole framing is "every number/asset traces to something real." |
| **Stellarium-rendered skies** | Open-source planetarium software; renders night sky from star catalog data, not photographs | **No — not a real image.** It's a procedural/data-driven render (photorealistic-looking, but generated, same category as the current procedural canvas, just with better fidelity) | N/A | Stellarium itself is GPL; rendered output ownership is the renderer's user, not a copyright concern, but it fails the literal ask | **Rejected on category grounds** — the milestone's explicit goal is to move OFF a procedural/rendered sky onto composited real photographs. Using Stellarium output would be trading one procedural renderer for a fancier one, not "real images." Do not use, even though it's technically license-clean. |

---

## 2. Licensing Precision

### ESO — CC BY 4.0 (HIGH confidence, fetched directly: `eso.org/public/copyright/`, `eso.org/public/images/eso0932a/`)

Exact requirement per ESO's own copyright page: *"the full image or footage credit must be presented in a clear and readable manner to all users, with the wording unaltered"* — credit must stay visually attached to the image (not buried in a separate page), and online use should carry an active link back to the source.

ESO's own worked example for a different image: `"ESO/José Francisco (josefrancisco.org)"`.

**Compliant minimal credit for this project, for the Brunier image specifically:**
```
Sky: ESO/S. Brunier, CC BY 4.0
```
This exact form is already anticipated in `PROJECT.md`'s locked direction. To be maximally compliant, make "ESO" a hyperlink to `https://www.eso.org/public/images/eso0932a/` (or to `https://creativecommons.org/licenses/by/4.0/` for the license itself) rather than plain text — ESO's guidance explicitly favors linked online credits.

### NOIRLab — CC BY 4.0 (MEDIUM confidence — general policy corroborated by 3 independent sources: `noirlab.edu/public/copyright/` search synthesis, a `nationalastro.org` mirror of the same policy text, and a `webarchive.gemini.edu` mirror; direct WebFetch of `noirlab.edu` pages returned empty content twice, likely a bot-block — recommend a human/browser re-check of the live page before shipping, but the policy text is verbatim-identical to ESO's own boilerplate, which is a strong internal-consistency signal since NOIRLab and ESO are sibling public-observatory outreach programs)

Same CC BY 4.0 policy shape as ESO: reproducible without fee if credit is clear and visible; NOIRLab's own captions should credit "NOIRLab" for text, and the specific image's own byline for the image itself.

**Confirmed credit line for `noirlab2430b`:** `NOIRLab/NSF/AURA/E. Slawik/M. Zamani`

**Compliant minimal credit for this project:**
```
Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0
```
This is a longer credit line than ESO's — if the footer/colophon needs brevity, CC BY 4.0 permits crediting less verbosely as long as it's not misleading; a defensible shortened form used by other CC BY 4.0 reusers of institutional astro-imagery is `"NOIRLab/E. Slawik"` with the full line available via link/alt-text — but given this project's honesty-gate discipline, **prefer the full unabridged line** over the shortened one; it costs almost nothing in footer space and removes any compliance ambiguity.

### NASA (public domain, with a sharp edge) — HIGH confidence for the general rule (fetched directly: `nasa.gov/nasa-brand-center/images-and-media/`)

NASA-produced content ("images, audio, video, and media files ... generally are not subject to copyright in the United States") is safe. But: *"Third-party copyrighted material occasionally appears on NASA websites [including APOD]. These items are clearly marked with the copyright holder's name, and using them requires direct permission from the copyright owner — not NASA."*

**Verdict: do not source the base sky photo from APOD.** If a specific APOD image is ever considered, it must show an explicit NASA/government-agency credit (not a named individual photographer) before use, checked on that image's own page — not assumed.

### ESA/Hubble — CC BY 4.0 (HIGH confidence, fetched directly), same attribution mechanics as ESO, not relevant to this milestone's sourcing choice (see Section 1).

### Unsplash / Pexels — commercial-safe, no attribution required (MEDIUM confidence, WebSearch synthesis of `unsplash.com/license`, `help.unsplash.com`, `pexels.com/license`, `help.pexels.com` — not independently fetched). **Not recommended as primary** — see Section 1 rationale (authenticity/provenance weaker than an institutional CC BY source, undermines the "real astrophotography, verifiably real" framing the milestone is explicitly going for).

### Sources flagged as licensing-unsafe or category-unsafe for this project
- **NASA APOD** (per-image, unverified provenance risk) — unsafe unless individually vetted.
- **Stellarium** — not a licensing problem, a category problem (not a real photograph).
- **Random Wikimedia Commons user uploads** (non-ESO/NOIRLab) — license tags exist but are self-reported by uploaders; treat as unverified unless cross-checked against an institutional source.

---

## 3. Compositing Plan

### Why NOIRLab's all-sky panorama is the better compositing substrate than ESO's

ESO's `eso0932a` is a **single continuous ground-based panorama** — it has one fixed horizon and one fixed orientation (galactic plane horizontal, as photographed from La Silla/Paranal). To get the site's signature **diagonal** Milky Way band (matching the current procedural design), you'd have to rotate that single fixed-horizon image, which drags empty/rotated-canvas corners into frame and fights the photograph's one real horizon line.

NOIRLab's `noirlab2430b` is a **full celestial-sphere compile with no single real horizon** (it was assembled from multiple locations/dates specifically to build a complete all-sky reference, for the 88 Constellations education project) — there is no "correct" up/down. This means:
- Any rotation angle is equally valid; you can freely choose the diagonal angle that matches the site's established composition without visibly "tilting a photograph."
- The site's own drawn horizon/camper-silhouette layer (already a separate procedural draw, per the v2.0 architecture) provides the "ground," so the photo layer never needs to show real terrain — you're only borrowing the sky dome, which is exactly what an all-sky panorama is built for.

**Recommended one-time (build-time, not runtime) compositing recipe:**

1. **Source master:** download `noirlab2430b` at the largest practical resolution (the large JPEG, not necessarily the 1GB TIFF — 1GB is unnecessary for a web crop that tops out at 2560w; the large JPEG tier is almost certainly ≥6000px wide, more than enough headroom).
2. **Rotate to level the desired diagonal band:** use a one-off script (Node + `sharp`, since `sharp` is already the project's image dependency via `astro:assets`) or a manual pass in a free tool (GIMP's Filters → Map → Panorama Projection, or Photopea) to rotate the panorama by the target angle (empirically match the current procedural design's diagonal, roughly 15–25° off horizontal based on the existing canvas composition) with `sharp().rotate(angle, { background: '#0f1216' })` — filling the exposed corners with the site's own bg token color (`#0f1216`) rather than transparent/white, so any corner spill blends with the page background rather than showing seams.
3. **Crop the working master:** extract a wide letterboxed rectangle (e.g. a 21:9 or wider working master, since the site itself further crops per-viewport) centered on the rotated Milky Way band using `sharp().extract({ left, top, width, height })`. Produce ONE checked-in master asset (e.g. `src/assets/sky/milky-way-master.jpg`, something like 5000×2200px) — do the rotate+crop **once**, by hand, and commit the result. Do not re-derive the rotation/crop at build time on every Astro build; that's wasted CI time for a static, never-changing crop decision.
4. **Let Astro's image pipeline own only format/resolution/quality variants** from that single master going forward (see Section 4) — `<Image>`/`getImage()` should never need to know about the rotation; that's baked into the master once.
5. **Bottom blend / horizon treatment:** the master's bottom edge should fade to the page's `bg` graphite token via a vertical gradient (either baked into the master image with a soft alpha/levels fade in the same one-time editing pass, or handled live via a CSS `mask-image: linear-gradient(...)` / `::after` gradient overlay in the DOM layer that already draws the camper silhouette) — do NOT try to photographically composite a real foreground; the drawn camper/horizon layer stays exactly as designed, sitting in front of the photo sky.

### Moon compositing — keep the drawn moon (recommend AGAINST a photo moon, on evidence)

Every independent astrophotography guide found agrees on the same physical constraint: **once the Moon is more than roughly a slim crescent (~25% illuminated) in frame, it overpowers and visibly washes out the Milky Way** — real photographers either shoot the Milky Way on/near a new-moon night, keep the Moon out of frame, or blend two *separately timed* exposures (Milky Way shot after moonset, foreground shot while moonlit) precisely because you cannot capture a bright moon and a vivid Milky Way in one real exposure (MEDIUM-confidence, WebSearch synthesis of multiple independent photography-technique sources, internally consistent).

This directly validates the milestone's already-locked decision (`PROJECT.md`): the crescent moon stays a **drawn** layer. A photographically-sourced moon compositied into the same frame as a vivid photo Milky Way would either (a) require an unrealistically dim/crescent-only moon photo that then looks like decoration rather than the "real" element it's supposed to be, or (b) be physically implausible next to a bright Milky Way band, undermining the exact honesty-gate + "zero light pollution" premise the scene is built on. The v2.0 finding that the drawn crescent was "verified dimmer-than-MW" should simply carry forward unchanged against the new photo base.

---

## 4. Delivery Budget (encode pipeline)

### Format choice: AVIF primary, WebP fallback (no JPEG for the hero sky)

- `sharp`'s `avif()` (confirmed via direct fetch of `sharp.pixelplumbing.com/api-output/`, HIGH confidence) supports `bitdepth: 8|10|12`. **Use `bitdepth: 10`** for the sky master — 10-bit specifically targets smooth low-contrast gradient content (dark skies, soft glows) and is the single most load-bearing lever against banding on an 8-bit *display* is irrelevant; the point is the encoder keeps more precision through quantization, so the browser's own dithering-on-display has more real data to work with instead of amplifying 8-bit banding steps (MEDIUM confidence — general AVIF/10-bit banding claims are consistent across multiple sources, but no source directly benchmarked this specific dark-astrophoto scenario).
- `chromaSubsampling: '4:4:4'` (sharp's AVIF default) rather than `'4:2:0'` — a starfield has fine per-pixel chroma variation (star color) at the pixel level that 4:2:0 subsampling can visibly smear; keep full chroma for this specific asset even though it costs some file size (HIGH confidence on the mechanism — chroma subsampling behavior is well-documented sharp/AVIF spec behavior — MEDIUM confidence this specific tradeoff call is optimal without a local A/B test).
- **Pre-encode grain/dither pass is the actual anti-banding lever**, more than format choice alone: multiple independent sources (video/image compression-artifact guides) converge on the same mechanism — deliberately retaining/adding a small amount of fine noise ("dither") before lossy encoding breaks up the smooth gradient steps that would otherwise quantize into visible bands; "coarser film-grain-like noise... is more likely to survive compression" than after-the-fact per-pixel dithering (MEDIUM confidence, general compression-theory consensus, not tested on this specific master image). **Practical recipe: do NOT denoise/smooth the master during the one-time edit in Section 3** — real astrophotography sensor grain in the NOIRLab/ESO source files is doing this job for free; the risk is actually that an over-aggressive AVIF `effort`/`quality` setting flattens that natural grain back out. Verify by eye at final quality/effort settings, not just by file-size target.
- **WebP fallback**: `sharp`'s `webp()` defaults to 8-bit only (no `bitdepth` option — confirmed via direct fetch of the same sharp docs page) — WebP will band more readily than the AVIF version on the same source; this is expected and acceptable since AVIF is primary and covers ~93%+ of 2026 browser traffic per general web-platform-status consensus (MEDIUM confidence, not independently re-verified this cycle) — WebP only needs to be "acceptable," not equally banding-free.

### Quality settings

Baseline mapping from `industrialempathy.com`'s AVIF/WebP quality study (HIGH confidence for the numeric mapping itself — fetched directly; MEDIUM confidence for applicability to this specific dark/noisy content class, since the study's own sample set was 4 general photos, not dark astrophotography):

| "JPEG-equivalent" target | AVIF quality | WebP quality |
|---|---|---|
| 60 | ~50–51 | ~64–65 |
| 70 | ~56 | ~72 |
| 80 | ~64 | ~82 |

**Recommendation for the sky master specifically: start at AVIF quality 55–60** (above the generic "60-equivalent" baseline) — dark, low-frequency gradient content is exactly the class of image where AVIF's normal size savings come partly *from* smoothing gradients, which is the one failure mode this asset can't afford. Treat 55–60 as a starting point to visually inspect for banding at both 1x and 2x DPR crops, not a final number — no source benchmarked this exact content type, so this is a reasoned starting point (MEDIUM confidence), not a verified final value.

Set `effort: 6-8`, not the sharp default of `4` — this is a one-time build-time cost (not per-request), so there's no reason not to spend more CPU for the ~5-10% extra compression AVIF's higher effort levels buy (MEDIUM confidence, general AVIF effort-vs-size relationship, consistent across sources).

### Realistic KB budgets

No source directly benchmarked "dark full-viewport astrophotography specifically" at these exact widths (flag as an estimate, MEDIUM-LOW confidence, extrapolated from general hero-image AVIF budget guidance plus the fact that noisy/grainy source content compresses *worse* than smooth photographic content at a given visual-quality target):

| Width | Format | Estimated budget |
|---|---|---|
| 1920w | AVIF, q~55-60, 10-bit, 4:4:4 | 250–450 KB |
| 2560w | AVIF, q~55-60, 10-bit, 4:4:4 | 400–700 KB |
| 1920w | WebP fallback, q~70 | 350–600 KB |
| 2560w | WebP fallback, q~70 | 550–900 KB |

These are meaningfully higher than "generic hero photo" budgets quoted in general web-perf guidance (e.g. the commonly-cited "2400px hero ≈ 400-800KB" figures found in this research) precisely because a grainy dark starfield resists compression harder than a smooth landscape photo of similar dimensions — budget accordingly and verify against Lighthouse's actual LCP/byte-weight audit on a real build rather than trusting these numbers as a hard ceiling.

### Responsive `srcset` / DPR strategy

- Generate at minimum **2 widths × 2 densities**: `1920w`/`2560w` (or Astro's `widths` config generating both from the same master) — do not go beyond 2560w; DPR-3 phones scaling a 2560w image down still render sharp, and a genuine 3x/4K asset for this specific noisy-content class would blow the KB budget for marginal visible gain on a background/atmosphere element (as opposed to Fig.01-style foreground content where crispness matters more).
- Use Astro's `<Picture>` component (`docs.astro.build/en/guides/images/`, confirmed via direct fetch, HIGH confidence) with `formats={['avif', 'webp']}` and an explicit `widths` array, letting Astro/`sharp` generate the srcset variants at build time rather than hand-rolling multiple `<Image>` calls.
- **Cap DPR-driven upscaling at 2x** — same rationale as the project's existing Fig.01 "DPR cap 2" constraint (`PROJECT.md` constraints) — extend that same doctrine to the new sky photo rather than introducing a second, inconsistent DPR policy for this milestone.

### Preload-as-LCP strategy

- If the sky photo is rendered as a real `<img>`/CSS element (not drawn into canvas via a JS `Image()` load), it becomes eligible for the browser's own **preload scanner** — meaning the HTML parser can discover and start fetching it before any JS executes, which is categorically better for LCP than the current v2.0 architecture's canvas-only approach (where any bitmap load happens inside JS, invisible to the preload scanner) (MEDIUM confidence — general Core Web Vitals guidance, not fetched from a single canonical source but consistent across `web.dev`-adjacent search results).
- **Architectural implication for this milestone (flagging for whoever owns Architecture/Delivery in the roadmap, since it's adjacent to but not strictly "my lane"): the photo sky should NOT be `drawImage()`'d onto the existing nightsky canvas.** Instead, render it as a plain `<img>` (or CSS `background-image` via `getImage()`) positioned behind a now-transparent overlay canvas that keeps drawing only the constellations/meteors/moon. This lets you add `<link rel="preload" as="image" fetchpriority="high" imagesrcset="..." imagesizes="100vw">` (confirmed pattern via search of `web.dev/articles/preload-responsive-images`, MEDIUM confidence, not independently fetched) or simply `loading="eager" fetchpriority="high"` directly on the `<img>`, and Lighthouse's "Preload Largest Contentful Paint image" audit will actually be satisfiable — it is very hard to satisfy that specific Lighthouse audit for an image whose load is hidden inside a canvas-drawing JS module.
- Do not `srcset`-preload every width — only the size expected to actually render at the initial viewport (mirrors the general `imagesizes="100vw"` guidance found for full-bleed hero images).

---

## 5. Verdict

**Primary source: NOIRLab's `noirlab2430b` all-sky panorama** (Eckhard Slawik / NSF / AURA / NOIRLab, CC BY 4.0) — HIGH confidence this is the right *choice*, MEDIUM confidence on some of its specific license-page details due to a fetch block (recommend a quick manual browser check of `https://noirlab.edu/public/copyright/` and the image page before shipping, to convert those MEDIUM tags to HIGH).

**Fallback / secondary-verification source: ESO's `eso0932a`** (S. Brunier, CC BY 4.0) — HIGH confidence across the board (every claim independently fetched and cross-mirrored on Wikimedia Commons). Use this if the NOIRLab license page can't be manually confirmed, or if the rotation/crop experiment in Section 3 doesn't work well against a horizon-free source for some unforeseen reason.

**Exact credit line to ship** (footer/colophon, matching `PROJECT.md`'s already-approved format):
```
Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0
```
or, if falling back to ESO:
```
Sky: ESO/S. Brunier, CC BY 4.0
```

**Composite approach:** one-time, build-time-only rotate + crop of the horizon-free all-sky master (via `sharp` script or GIMP), producing a single checked-in master asset; drawn horizon/camper/moon/constellation layer stays exactly as-is on a separate (now-transparent-background) canvas on top; bottom edge gradient-blends into the page's graphite `bg` token rather than attempting a photographic foreground; **keep the drawn crescent moon** — do not composite a photographic moon (physically incompatible with a vivid Milky Way in one real exposure, confirmed across multiple independent astrophotography sources).

**Encode pipeline:** AVIF primary (`bitdepth: 10`, `chromaSubsampling: '4:4:4'`, quality ~55-60 as a starting point verified by eye against banding, `effort: 6-8`) + WebP fallback (`quality` ~70), generated via `sharp`/Astro's `<Picture>` at build time from the single master, 1920w/2560w × up to 2x DPR, delivered as a real `<img>`/background element (not canvas-drawn) so it's preload-scanner-discoverable and can carry `fetchpriority="high"` for LCP. Realistic budget: ~250-700KB depending on width — meaningfully above generic hero-photo budgets because grainy dark content compresses worse; verify against live Lighthouse output, don't trust the estimate as a ceiling.

**Biggest risk:** banding on 8-bit displays under real-world lossy compression at a KB budget that still holds a Lighthouse ≥90 performance score — this is a genuine tension (higher quality/bitdepth = less banding but more bytes = perf risk) that needs an actual local A/B encode-and-eyeball-on-a-real-8-bit-display pass before locking numbers; treat every quality/KB figure above as a starting hypothesis, not a final spec.

---

## Sources Log

| URL | Method | Confidence | Note |
|---|---|---|---|
| https://www.eso.org/public/images/eso0932a/ | WebFetch (direct) | HIGH | Title, credit, resolutions, file sizes |
| https://www.eso.org/public/copyright/ | WebFetch (direct) | HIGH | License text, example credit format |
| https://commons.wikimedia.org/wiki/File:ESO_-_Milky_Way.jpg | WebFetch (direct) | HIGH | Cross-mirror confirms ESO license/credit/resolution |
| https://www.nasa.gov/nasa-brand-center/images-and-media/ | WebFetch (direct) | HIGH | NASA public-domain rule + third-party-content caveat |
| https://apod.nasa.gov/apod/ap_faq.html | WebFetch (direct) | HIGH | Confirms APOD has no simple public-domain flag per image |
| https://apod.nasa.gov/apod/fap/lib/rights.html | WebFetch | FAILED (404) | Corroborated via WebSearch synthesis instead |
| https://esahubble.org/copyright/ | WebFetch (direct) | HIGH | ESA/Hubble CC BY 4.0 confirmed, not relevant to sourcing choice |
| https://noirlab.edu/public/images/noirlab2430b/ | WebFetch | FAILED (empty content, 2 attempts) | Corroborated via WebSearch synthesis |
| https://noirlab.edu/public/copyright/ | WebFetch | FAILED (empty content) | Corroborated via WebSearch synthesis + 2 independent mirrors (nationalastro.org, webarchive.gemini.edu) |
| https://noirlab.edu/public/news/noirlab2430/ | WebFetch | FAILED (empty content) | Corroborated via WebSearch (sci.news, universetoday.com secondary coverage) |
| https://sharp.pixelplumbing.com/api-output/ | WebFetch (direct) | HIGH | Full avif()/webp()/jpeg() option signatures |
| https://www.industrialempathy.com/posts/avif-webp-quality-settings/ | WebFetch (direct) | HIGH (numbers) / MEDIUM (applicability to dark content) | AVIF/WebP quality-equivalence mapping |
| https://docs.astro.build/en/guides/images/ | WebFetch (direct) | HIGH | Image/Picture component behavior, getImage() for CSS backgrounds |
| unsplash.com/license, help.unsplash.com (multiple pages) | WebSearch synthesis | MEDIUM | Not independently fetched |
| pexels.com/license, help.pexels.com (multiple pages) | WebSearch synthesis | MEDIUM | Not independently fetched |
| Multiple Milky Way + moon photography guides (goldpaintphotography.com, photopills.com, capturetheatlas.com et al.) | WebSearch synthesis | MEDIUM | Cross-source consistent on moon/Milky Way exposure conflict |
| Multiple compression-artifact/dithering guides | WebSearch synthesis | MEDIUM | General dither-before-encode mechanism, not tested on this content class |
| web.dev preload-responsive-images / LCP background-image guidance | WebSearch synthesis | MEDIUM | Not independently fetched this cycle |
