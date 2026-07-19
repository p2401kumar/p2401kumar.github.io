---
phase: 07-real-sky-foundation
plan: 04
subsystem: footer-credit-and-phase-gates
tags: [cc-by-4.0, attribution, lighthouse, lcp-checkpoint, gate-battery, deck-chrome, fixed-footer]
requires:
  - phase: 07-01
    provides: "banding-free sky masters + build-sky.mjs + verify-banding.mjs gate"
  - phase: 07-02
    provides: "Verdict: PASS glass-CPU spike (Phase 8 unblocked, blur 12/16px budget)"
  - phase: 07-03
    provides: "integrated real-sky page + photo-aware verify-contrast.mjs + widened column vignette"
provides:
  - "IMG-04: locked-verbatim CC BY 4.0 credit line ('Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0') in the shared footer, both modes, all pages — NOIRLab + CC BY 4.0 linked, target=_blank rel='noopener noreferrer'"
  - "2-line footer geometry: .footer-row (status+clock) + .credit column, gap 8px; deck .panel bottom padding 112->136px; deck chrome offsets raised 24px (index pill/mode links 58->82, hint 96->120)"
  - "Full carried-floor gate battery recorded green (lighthouse-scores.md) + the blocking post-photo LCP checkpoint PASSED (lcp-checkpoint.md): mobile 99/100/100/100 LCP 1.9s in the 1.5-2.8s budget, desktop 100x4 LCP 0.5s"
  - "Phase 7 closed: IMG-01..05 Complete, ROADMAP Phase 7 ticked, visual sign-off auto-resolved with committed evidence"
affects: [phase-8 glass (baseline numbers), phase-10 live verification]
tech-stack:
  added: []
  patterns:
    - "Fixed-chrome bottom offsets must track the fixed footer's measured height — any footer growth shifts the whole bottom-left/bottom-right chrome stack"
    - "Locked credit copy kept byte-exact by keeping anchor open/close tags flush with the surrounding text nodes (no whitespace injection)"
key-files:
  created:
    - .planning/phases/07-real-sky-foundation/lcp-checkpoint.md
    - .planning/phases/07-real-sky-foundation/lighthouse-scores.md
    - .planning/phases/07-real-sky-foundation/07-04-visual-signoff.md
    - .planning/phases/07-real-sky-foundation/integration-evidence/ (5 new 07-04 screenshots)
  modified:
    - src/components/SiteFooter.astro
    - src/styles/deck.css
    - src/components/DeckIndex.astro
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/STATE.md
decisions:
  - "Credit line added UNCONDITIONALLY to the shared footer (per plan/07-RESEARCH pitfall 9) — renders on home, both case studies, and 404; simplest and cannot be silently missed"
  - "Deck .panel bottom padding bumped to 136px (CDP-measured 131.5px 2-line footer + ~4.5px headroom, matching the original 112-over-107.5 convention)"
  - "LCP-element nuance recorded honestly: Chrome excludes full-viewport images from LCP candidacy, so LCP is the hero text; the preload single-fetch invariant held (one 56KB AVIF fetch, zero runWarnings)"
metrics:
  duration: "~35min"
  completed: 2026-07-19
status: complete
---

# Phase 7 Plan 04: Credit Line + Gate Battery + LCP Checkpoint Summary

**One-liner:** The locked CC BY 4.0 credit line shipped in the shared footer in both modes (with the deck's fixed-chrome stack re-calibrated for the taller footer), the full carried-floor battery re-ran green with numbers matching 07-03 exactly, and the phase's blocking LCP checkpoint passed with headroom (mobile 99 + LCP 1.9 s inside the 1.5–2.8 s budget; desktop 100×4 + LCP 0.5 s) — Phase 7 is closed with IMG-01..05 Complete.

## What was built

### Task 1 — CC BY 4.0 credit line, both modes (commits c926e90 + 35f0766)

- **SiteFooter.astro**: restructured from a single flex row into a flex COLUMN (gap 8px):
  the existing `.st` status + `#clock` wrapped in `.footer-row` (visual result unchanged),
  new `.credit` line below, left-aligned. Copy is byte-exact verbatim (verified against
  the built HTML): `Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0` — NOIRLab →
  noirlab.edu/public/images/noirlab2430b/, CC BY 4.0 → creativecommons.org/licenses/by/4.0/,
  both `target="_blank" rel="noopener noreferrer"` (T-07-06 mitigated). Tokens only:
  mono 11.5px / line-height 1.4 / `--faint`; links `--dim` + `--hair2` underline, hover
  `--ink` + `--accent` (the pre-existing site-wide link pattern). Unconditional on every
  page sharing the footer; present in deck (fixed chrome) AND classic/no-JS flow.
- **deck.css**: `.panel` bottom padding 112 → 136px — the 2-line footer CDP-measured
  131.5px fixed height in deck mode (was ~107.5px), so 112px no longer cleared it.
- **DeckIndex.astro** (Rule 1 deviation, commit 35f0766): the footer's 24px growth pushed
  its status row up into the fixed deck chrome calibrated for the 1-line footer —
  `view classic →` overlapped the status text and the clock collided with the `01 / 07`
  pill. Raised all three fixed offsets by the measured growth: index pill + mode links
  bottom 58 → 82px, hint 96 → 120px. Re-captured screenshots confirm a clean stack.

### Task 2 — Full gate battery + blocking LCP checkpoint (commit b37c8bc)

Battery (full table in `lighthouse-scores.md`, all PASS, run against the final build):

| Gate | Result |
|---|---|
| astro check / build | 0 errors 0 warnings 0 hints / green, 4 pages |
| Zero-hex (plan trio + boundary-aware wider sweep) | 0 |
| Single-rAF | scene=2 · starfield=0 · meteors=0 · fig01/render=2 |
| Scene-module deck/fig01 imports | 0 (only doc-comment mentions) |
| verify-banding --selftest + 4 masters × 2 regions | all clean (runs=1 gaps=0) |
| verify-contrast --selftest | PASS |
| --cdp worst vs --ink | **4.58** @1280×800 · **12.22** @1440×900 (identical to 07-03) |
| --moon | **0.2123 < 0.4695** @1280 · **0.1857 < 0.4748** @1440 (identical to 07-03) |
| Leak gate | /work/* + /404: zero script tags, zero /sky/ refs; preload + scene/deck JS only in /index.html |
| Sitemap | exactly 3 routes |
| package.json / lock / .planning/config.json | untouched; zero installs |

**Blocking LCP checkpoint (lcp-checkpoint.md): PASS.**

| Preset | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Mobile | **99** | 100 | 100 | 100 | **1.9 s (1860 ms)** — in 1.5–2.8 s budget | 0.003 (= pre-photo baseline) | 0 ms |
| Desktop | **100** | 100 | 100 | 100 | **0.5 s (460 ms)** | 0 | 0 ms |

Preload-LCP audit clean: exactly one `milky-way-1920.avif` fetch (56 KB) per run, zero
runWarnings (no unused-preload). Recorded honestly: the LCP element is the hero TEXT
(`p.sub` mobile / `h1` desktop) because Chrome's LCP spec excludes full-viewport images
as presumed backgrounds — the photo never gated LCP; IMG-02's delivery contract
(preload-discovered, single-fetch, zero-CLS) fully held.

### Task 3 — Visual sign-off checkpoint (auto-resolved)

Checkpoint auto-resolved under /gsd-autonomous with committed screenshot evidence (async
user veto available; live site unchanged until Phase 10). Evidence + walkthrough in
`07-04-visual-signoff.md`: band-over-margin composition, invisible seam, overlay harmony,
reduced-motion/classic modes, and the 2-row footer with working links — with the
**band-angle deviation called out explicitly** (band ~20° from horizontal per 07-01's
recorded trade vs the UI-SPEC's literal 24°-from-vertical; forcing the literal diagonal
would have cost a 3.1× upscale). Veto path: re-run build-sky.mjs / adjust object-position,
then re-run this battery.

### Close-out

IMG-01..05 all Complete in REQUIREMENTS.md (checkboxes + traceability rows); ROADMAP
Phase 7 ticked complete 2026-07-19 with 4/4 plans; STATE advanced to Phase 8.

## Deviations from Plan

**1. [Rule 1] Deck fixed-chrome offsets raised 24px (DeckIndex.astro, commit 35f0766)** —
the plan's clearance check covered `.panel` padding only; the taller footer ALSO collided
with the fixed `view classic` link / index pill / hint (calibrated bottom offsets 58/58/96
assumed the 1-line footer). Found via screenshot review, fixed by the footer's measured
24px growth, re-verified visually at both widths. DeckIndex.astro was not in the plan's
files_modified list — direct consequence of this task's footer change.

**2. [Recorded nuance, no code change] LCP element is hero text, not the preloaded AVIF** —
Chrome excludes full-viewport images from LCP candidacy (presumed background). All numeric
gates pass; the single-fetch/no-unused-preload invariants hold. Documented in
lcp-checkpoint.md rather than claimed otherwise.

## Authentication gates

None.

## Known Stubs

None — the credit line is fully wired; no placeholder values flow to the UI.

## Threat Flags

None new. T-07-06 (reverse-tabnabbing) mitigated with rel="noopener noreferrer" on both
outbound links; T-07-07 (LCP regression) closed by the passing blocking checkpoint;
T-07-SC held (zero installs, package.json/lock untouched, Lighthouse via npx).

## Notes for Phase 8

- Baseline for glass work: mobile 99/LCP 1.9 s/TBT 0 ms; contrast worst-case 4.58 @1280
  (only ~0.08 above the 4.5 floor — glass scrim/tier choices must not spend it);
  blur budget 12px default / 16px ceiling (07-02).
- The NOIRLab license-page manual browser check (STATE blocker, IMG-04's "before ship"
  clause) remains an open pre-deploy item for Phase 10 — the credit line itself is live
  in the codebase; nothing is publicly shipped until the user-gated Phase 10 deploy.
- Phase 8's screenshot-sampling contrast verifier re-architecture owns the blur boundary
  verify-contrast.mjs intentionally does not model.

## Self-Check: PASSED

All key files verified on disk (SUMMARY, lcp-checkpoint.md, lighthouse-scores.md,
07-04-visual-signoff.md, 5 evidence screenshots) and all three task/fix commits present
in git history (c926e90, 35f0766, b37c8bc).
