---
phase: 07-real-sky-foundation
verified: 2026-07-19T06:45:00Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 7: Real-Sky Foundation — Verification Report

**Phase Goal:** The home page renders a real composited astrophotography Milky Way sky as an LCP-discoverable static image behind everything — banding-free, credited, and with the authored overlay surviving on top — without compounding any performance floor.
**Verified:** 2026-07-19 (goal-backward, independent re-run of all cheap checks)
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Full-viewport real Milky Way photo (NOIRLab noirlab2430b, composited at build time into checked-in masters) renders behind everything (IMG-01) | VERIFIED | 4 masters + LQIP committed in `public/sky/` (git ls-files confirms: milky-way-{1920,2560}.{avif,webp} + milky-way-lqip.txt). Reproducible pipeline `scripts/build-sky.mjs` with the vignette derivation documented at the constant (`VIGNETTE_HALF_FRAC = 0.234043`, scripts/build-sky.mjs:130, derivation comment lines 108–126). Raw TIFF excluded: `git check-ignore -v sky-source/noirlab2430b.tif` → `.gitignore:27:/sky-source/`. Photo is the FIRST child of the fixed host (`.sky-photo`, src/components/NightSky.astro:67–88), painting bottom-most by DOM order; the only z-index is the pre-existing host `z-index:-1` (NightSky.astro:128) — no new z-index introduced. |
| 2 | Photo is a static `<img>`/CSS background — LCP-discoverable via preload + fetchpriority=high + LQIP ladder, zero CLS, present in no-JS classic (IMG-02) | VERIFIED | Built HTML (`dist/index.html`, fresh `npm run build`): `<link rel="preload" as="image" href="/sky/milky-way-1920.avif" imagesrcset="/sky/milky-way-1920.avif 1920w, /sky/milky-way-2560.avif 2560w" imagesizes="100vw" fetchpriority="high">` — imagesrcset mirrors the `<picture>` AVIF `srcset` byte-for-byte; `fetchpriority="high"` present on preload + `<img>` (2 occurrences). Zero-CLS structural: host `position:fixed; inset:0` (never in flow). No-JS safe: fade is a pure CSS keyframe ending at full opacity — `@keyframes sky-photo-fade{0%{opacity:0}to{opacity:1}}` + `animation:.4s cubic-bezier(.16,1,.3,1) both sky-photo-fade` in `dist/_astro/index.CEVLpBWH.css`; grep of src/lib confirms no JS gates `.sky-photo` opacity. Reduced-motion: `{opacity:1;animation:none}` under `prefers-reduced-motion:reduce` in the same built CSS. No-JS classic screenshot shows photo present (integration-evidence/07-04-1440x900-nojs-classic-bottom.png). |
| 3 | No visible banding on 8-bit display (AVIF 10-bit 4:4:4 + WebP fallback), proven by histogram comb-spike test + eyeball (IMG-03) | VERIFIED | Re-ran `node scripts/verify-banding.mjs --selftest` → "selftest OK: clean passes, banded control fails" (clean fixture PASS, posterized+JPEG control FAIL — detector proven discriminative). Re-ran full check: all 4 committed masters × 2 regions (top-dark-sky, seam-ramp) PASS with runsAboveZero=1, zeroGaps=0 → "all files pass the banding gate." Eyeball evidence: 07-SPIKE-BANDING.md + 07-04 DPR1/DPR2 screenshots. |
| 4 | Authored overlay survives on the real sky: constellations w/ panel-reactive brightening, meteors, drawn crescent moon (IMG-05) | VERIFIED | Overlay surgery real in `src/lib/nightsky/starfield.ts` (full read): procedural MW passes, sky-wash gradient, ground fill, dither, and Faintest/Dim bands all REMOVED — `BANDS` retains only mid+bright (starfield.ts:57–60); Layer 0 transparent except the single `drawMoon` bake (starfield.ts:164–199, queued at :435); margin-confined twinkle metadata kept. Constellations: `STAR_RADIUS_MID = 3.0` / `STAR_RADIUS_BRIGHT = 4.5` (constellations.ts:80–81), resting halo present (ambient halo 0.15 @ 1.3×, brightened 0.25 @ 1.5× — constellations.ts:67–69, drawn :463–481). scene.ts blit path unchanged (`drawImage(layer0.canvas, ...)` scene.ts:334, :421). Single-rAF re-grepped: `requestAnimationFrame` counts = scene.ts 2, fig01/render.ts 2, starfield.ts 0, meteors.ts 0 (repo-wide, only those 2 files). Zero deck/fig01 imports in scene modules (re-grepped: all import statements in scene/starfield/meteors/constellations are nightsky-internal or data/tokens; hits are doc comments only). Meteors intact and wired (`initMeteors` import scene.ts:43, invoked scene.ts:528). |
| 5 | CC BY 4.0 credit line renders in footer, exact attribution linked, license page browser-verified (IMG-04) | VERIFIED | Byte-exact in source (src/components/SiteFooter.astro:33–41) and built HTML — tag-stripped `dist/index.html` credit paragraph reads exactly `Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0`; NOIRLab → https://noirlab.edu/public/images/noirlab2430b/ and CC BY 4.0 → https://creativecommons.org/licenses/by/4.0/, both `target="_blank" rel="noopener noreferrer"`. Renders in both modes — deck fixed footer (integration-evidence/07-04-1440x900-dpr1.png, credit visible bottom-left) and classic no-JS flow (07-04-1440x900-nojs-classic-bottom.png, credit visible under status row). Credit present on all 3 pages sharing the footer. License-page manual browser check: DONE — orchestrator verified noirlab.edu/public/copyright/ and the noirlab2430b image page in-browser on 2026-07-18 (CC BY 4.0 confirmed, no special note on the image), recorded in 07-CONTEXT.md:18–20. |
| 6 | Post-photo LCP checkpoint passes (mobile LCP within budget) before glass/animation compounds | VERIFIED | lcp-checkpoint.md + lighthouse-scores.md (2026-07-19, local preview, Lighthouse 13.4.0): mobile 99/100/100/100, desktop 100/100/100/100 — all ≥ 90; mobile LCP 1.9 s (1860 ms) inside the 1.5–2.8 s budget, desktop 0.46 s; CLS 0.003 matches pre-photo baseline. Preload audit clean: exactly one milky-way-1920.avif fetch (56 KB), zero runWarnings, no unused-preload flag. LCP-element nuance documented honestly (LCP element is hero text; Chrome excludes full-viewport images as presumed backgrounds — delivery contract still held). Verdict line "PASS — phase unblocked for close-out" present. |

**Score:** 6/6 truths verified (0 present-behavior-unverified)

### Cross-Cutting Gates (independently re-run 2026-07-19)

| Check | Result |
|-------|--------|
| `npm run build` | PASS — 4 pages, sitemap generated, no errors |
| `npx astro check` | PASS — 0 errors / 0 warnings / 0 hints (46 files) |
| Zero hex outside tokens.css (boundary-aware `#[0-9a-fA-F]{3,8}\b` over src/lib/nightsky, src/lib/fig01, src/lib/shared, NightSky.astro, SiteFooter.astro, deck.css, src/data/constellations.ts) | PASS — 0 matches |
| `verify-contrast.mjs --selftest` (incl. coverSourceRect fixtures) | PASS — SELFTEST PASS |
| Contrast + moon numbers recorded | PASS — 4.58:1 @1280 / 12.22:1 @1440 vs 4.5 floor; moon 0.2123<0.4695 @1280, 0.1857<0.4748 @1440 (07-03-SUMMARY.md:86–89, gate battery lighthouse-scores.md:26–29) |
| Leak gate | PASS — 0 `<script src>` and 0 `/sky/` refs in dist/work/dynamodb-cellularization/, dist/work/elb-auto-weight-away/, dist/404.html |
| Sitemap routes | PASS — exactly 3 (`/`, both /work/ pages) in dist/sitemap-0.xml |
| Spike-2 verdict for Phase 8 | INTACT — "Verdict: PASS" at 07-SPIKE-GLASS.md:80 (+0.47 pp marginal ≤ 2–3 pp gate, total 4.52% < 10% floor) |
| Push state | main ahead of origin/main by 26 — expected (no push/deploy this phase per plan; live site stays v2 until Phase 10). Not a gap. |

### Accepted Deviations (recorded decisions, not gaps)

| Deviation | Where recorded |
|-----------|----------------|
| Band angle ~20°-from-horizontal vs UI-SPEC's literal steep diagonal (rotation trade: literal 24°-from-vertical needs ~66° rotation → 3.1× upscale softness) | 07-04-visual-signoff.md:39–48, explicit side-by-side note for async veto |
| Mobile (<640px) object-position 10% 70% vs UI-SPEC 12% 25% (winner master's quiet window is lower-left) | NightSky.astro:178–189 comment + 07-SPIKE-BANDING.md mobile note |
| DeckIndex/deck chrome raised +24px for the 2-line footer | lighthouse-scores.md:33 (CDP-measured clearance) |
| LCP element is hero text, not the photo (Chrome full-viewport-image exclusion) | lcp-checkpoint.md preload-LCP audit, documented honestly |
| Vignette widening 0.219385→0.234043 (authorized cross-plan fix after 4.06:1 gate failure; full banding + contrast + moon re-gate passed) | build-sky.mjs:118–126 derivation, 07-03-SUMMARY.md item 6, commit 27c7bc7 |

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| IMG-01 | SATISFIED | Truth 1 |
| IMG-02 | SATISFIED | Truth 2 |
| IMG-03 | SATISFIED | Truth 3 |
| IMG-04 | SATISFIED | Truth 5 |
| IMG-05 | SATISFIED | Truth 4 |

### Anti-Patterns Found

None blocking. No TBD/FIXME/XXX markers in the phase-modified scene modules or components; no stub returns; no JS-gated photo opacity.

### Human Verification Required

None open. The phase's own human gates were executed and recorded: visual sign-off (07-04-visual-signoff.md, with the band-angle deviation explicitly surfaced for async veto) and the license-page manual browser verification (07-CONTEXT.md, 2026-07-18).

### Gaps Summary

No gaps. All six success criteria hold in the codebase and built output; every re-runnable check (build, astro check, banding selftest + full gate, contrast selftest, hex sweep, rAF counts, import boundary, leak gate, sitemap) was independently re-executed and passed.

---

_Verified: 2026-07-19T06:45:00Z_
_Verifier: Claude (gsd-verifier)_
