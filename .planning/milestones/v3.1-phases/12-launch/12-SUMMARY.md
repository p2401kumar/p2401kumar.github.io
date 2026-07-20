---
phase: 12-launch
plan: milestone-close
subsystem: launch
tags: [deploy, github-pages, live-verification, visibility-gate, lighthouse, milestone-close, v3.1]
milestone: v3.1 Bolder Sky
requirements-completed: [BOLD-06]
duration: ~25min
completed: 2026-07-20
status: complete
---

# Phase 12 Launch — v3.1 "Bolder Sky" Milestone Close

**FF-pushed the 17-commit v3.1 rework to origin, GitHub Actions deployed green, and proved the bolder sky LIVE: `verify-visibility --gate` GREEN ×3 viewports on the LIVE origin (SSIM 0.9999/0.9998/0.9996 — the warm core-led sky + liquid-glass card provably render live), live Lighthouse desktop 100/100/100/100 + mobile 99/100/100/100, all smoke green. Milestone closed and archived.**

## Approval Record (verbatim)

The user explicitly chose **"Deploy now"** in chat on **2026-07-20** after reviewing the before/after comparison artifact — all four original complaints (too dark & muddy, glass reads as a flat gray box, camper is an unrecognizable smudge, composition empty & lopsided) confirmed fixed, and **the darker smoked-glass card tradeoff disclosed and accepted**. This authorized the deploy. Same explicit-go doctrine used at every prior milestone (v1/v2/v3).

## STEP 1 — Pre-flight (local, never push a broken build)

All green before any push:

- `npm run build` — green (4 pages, sitemap emitted, ~3.3s)
- `npx astro check` — **0 errors / 0 warnings / 0 hints** (51 files)
- `verify-visibility.mjs --gate --url http://localhost:4321/` — **PASS ×3 viewports** (1440/1280/375, DPR1)
- `verify-visibility.mjs --selftest` — **PASS**: healthy green; blackout control tripped [hero.bandRange, hero.starfieldRange, systems.starfieldRange, systems.starCount, hero.ssim, systems.ssim]; blur control tripped [live.starCount, hero.bandRange, hero.starfieldRange, hero.starCount, systems.bandRange, systems.starfieldRange, systems.starCount, hero.ssim, systems.ssim] — gate honesty intact
- `verify-contrast.mjs --cdp-screenshot` — **PASS at 1440x900 AND 1280x800** (every over-sky surface ≥4.5:1, screenshot mode)

## STEP 2 — The Deploy

- FF proof: `git merge-base --is-ancestor origin/main main` → exit 0 (origin/main is an ancestor of main). **No `--force` / `--force-with-lease` ever used.**
- `git push origin main` → `9fc597a..2ede462  main -> main` (fast-forward, 17 commits)
- GitHub Actions `deploy.yml` run `29776043081`: **build 21s ✓ → deploy 8s ✓** — `gh run watch --exit-status` exit 0

## STEP 3 — Live Verification (https://p2401kumar.github.io/)

**Propagation:** live homepage began referencing the new hashed CSS `index.C8Q7hGGN.css` (matching the fresh local dist) on the first poll — new build serving.

**LIVE visibility gate** (`verify-visibility --gate --url https://p2401kumar.github.io/`) — **GREEN ×3 viewports on the LIVE origin** (the perceptual proof the bold sky actually renders live):

| Viewport | bandRange | starfield | starCount | camperWarmDelta | SSIM |
|----------|-----------|-----------|-----------|-----------------|------|
| 1440x900 | 159.1 (floor 135) | 167.9 (135) | 291 (25) | 19.75 (10) | **0.9999** (0.9) |
| 1280x800 | 160.0 (135) | 168.0 (135) | 246 (18) | 19.78 (10) | **0.9998** (0.9) |
| 375x812  | lowerSky 111.1 (70) | — | 131 (30) | 22.49 (12) | **0.9996** (0.9) |

Aurora canvas-coverage 0.80/0.82 (floor 0.03). Every floor cleared with a wide margin; SSIM ≈1.0 confirms the live render is byte-for-byte the blessed bold look.

**Live captures committed** to the phase evidence dir:
- `.../11-bolder-sky/evidence/live-v31-desktop-1440.png` — warm amber core leading in the right margin, bright structured Milky-Way band, liquid-glass card over darker sky with legible eyebrow + copper "APPLIED AI" accent, credit line intact
- `.../11-bolder-sky/evidence/live-v31-mobile-375.png` — bright core band mid-viewport, glass card, credit line intact

**Live Lighthouse** (both presets, recorded to `live-lighthouse-{desktop,mobile}.json`):
- Desktop: **performance 100 / accessibility 100 / best-practices 100 / seo 100**
- Mobile: **performance 99 / accessibility 100 / best-practices 100 / seo 100**

No category below 90 (the visible bolder sky is the goal; the mobile perf 99 is within the expected 99-100 family).

**Smoke (live):**
- homepage `200`
- `#nightsky-canvas` PRESENT · `sky-photo` PRESENT · deck panels (`data-panel-id`) PRESENT
- credit line intact: `Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0` (both source + license linked)
- `/#work` → `200` (index-served hash alias); homepage links `/work/dynamodb-cellularization` + `/work/elb-auto-weight-away`
- `/work/dynamodb-cellularization/` → `200`, **scene-free** (no `#nightsky-canvas` leak)

## STEP 4 — Close-out

- **REQUIREMENTS.md**: BOLD-06 `[~]` → `[x]`; traceability row → Complete; coverage 6/6 complete
- **ROADMAP.md**: v3.1 milestone line → ✅ shipped 2026-07-20; Phase 12 `[x]` (1/1 Complete); v3.1 block moved into the collapsed shipped/archived `<details>` pattern (matching v1/v2/v3); progress table updated
- **PROJECT.md**: Current State → "v3.1 shipped 2026-07-20" (warm core-led sky + liquid glass, live gate GREEN, live Lighthouse); Current Milestone → "none (between milestones)"; v3.1 requirements moved to Validated; **4 Key Decisions rows added** (v3.1 fix-by-composition-not-darkening; smoked-glass-vs-bright-frost accepted tradeoff; perceptual visibility gate guards the look; "Deploy now" go)
- **Archived**: `milestones/v3.1-ROADMAP.md` + `milestones/v3.1-REQUIREMENTS.md` (final shipped state); `git mv .planning/phases/11-bolder-sky → .planning/milestones/v3.1-phases/11-bolder-sky`; this summary at `milestones/v3.1-phases/12-launch/12-SUMMARY.md`. `.planning/phases/` left empty of tracked content.
- **Tag**: `v3.1` annotated tag pushed.

## Deviations from Plan

1. **Live evidence path** — captured via a small self-contained CDP screenshot script (scratchpad) because the site is static and the visibility gate's own capture path doesn't emit full-page stills. Chrome discovered at `C:/Program Files/Google/Chrome/Application/chrome.exe`. Same headless-Chrome/DPR1 doctrine as the verify scripts.
2. **17 commits pushed, not 15** — the 11-03 SUMMARY recorded 15 ahead; two additional docs commits (the post-11-03 sky-visibility blocker fix + live-gate record) landed before this deploy, so origin was 17 behind. FF proof held; nothing rewritten.

## Known Stray (pre-existing, out of scope)

`.planning/phases/07-real-sky-foundation/spike-banding/` holds 6 untracked JPGs — spike artifacts regenerated by `build-sky.mjs` during 11-01. The tracked Phase 7 was already archived to `milestones/v3.0-phases/07-real-sky-foundation/` at v3.0 close. These are untracked build output, not committed, and not part of the v3.1 deploy; left in place (not created by this task).

## Self-Check: PASSED
