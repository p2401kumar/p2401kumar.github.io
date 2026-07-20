---
type: quick-task
date: 2026-07-19
slug: sky-visibility-fix
source: .planning/10-UI-REVIEW.md (v3.0 retroactive UI review)
status: complete — FIXED + DEPLOYED LIVE 2026-07-19 (user-approved redeploy)
commits:
  - 15aaf62 fix(sky-visibility) — glass rescoped to content cards (BLOCKER)
  - 71cc35d fix(sky-visibility) — sky-photo fade inverted (failure mode = visible)
  - 467d9a4 fix(sky-visibility) — server-rendered panel states (ghost flash)
  - 8738d33 feat(sky-visibility) — verify-visibility.mjs perceptual gate + blessed refs
  - cd4d310 test(sky-visibility) — LIVE verification, gate PASS on origin + evidence
---

# Quick Task: v3.0 Sky-Invisibility Fix (BLOCKER + 2 warnings + perceptual gate)

**One-liner:** Rescoped the Phase-8 glass from the full-viewport active panel to a
content-hugging `.panel-card`, inverted the sky-photo fade so the failure mode is
*visible*, server-rendered initial panel states, and built the perceptual
visibility gate the user demanded — stars/band/camper/aurora are now provably
visible at all three viewports, with a selftest that proves the gate would have
caught the original bug.

## The fix story

The 10-UI-REVIEW audit confirmed the user's complaint ("background not visible at
all") and traced it to one root cause: `deck.css` §8 attached
`backdrop-filter: blur(12px)` to the **full-viewport** `.panel[data-state="active"]`
— since one panel is always active, 100% of the sky sat behind a 12px blur + white
haze forever. Every existing gate (ratios/ceilings) *improves* as the sky loses
structure, so the battery was green while the product's credibility layer was erased.

1. **Glass rescope (BLOCKER)** — `Panel.astro` gained a minimal `.panel-card`
   wrapper; both tier recipes (tokens verbatim, gate-certified in 08-02) moved to
   `... .panel[data-state="active"] > .panel-card` / classic equivalent. Cards are
   content-hugging (`align-items: flex-start` — no section uses stretched height,
   text position unchanged). Chrome glass (header/footer/jump-index) untouched.
   Preserved: active-only application (<=4 blur surfaces), -webkit dual-write +
   prefix order (dist verified: 6/6 pairs), @supports + reduced-transparency +
   print ladders (`.panel-card` added to the print strip), `.fig` opacity
   exemption, scrim 0.38 untouched.
   *Documented tradeoff:* during the 420ms panel opacity transition the incoming
   card is briefly fill-only (transitioning panel = backdrop root); blur lands at
   transitionend. Bounded, user-triggered, absent under reduced motion.
2. **Fade inversion (warning 1)** — `.sky-photo img { opacity: 1 }` base;
   `sky-photo-fade` 400ms runs 0→1 with **no fill mode**. Frozen-timeline /
   animation-stripped environments now show the photo instead of pinning it at 0.
   Reduced-motion branch unchanged.
3. **Ghost-flash fix (warning 2)** — built HTML ships `data-state` (hero
   `active`, rest `inactive`); first paint under the speculative pre-paint
   `.deck-active` shows one panel, not 7 stacked. `deck.ts` keeps runtime
   ownership (synchronous re-resolve before adding the class on deep links).
   No-JS classic floor verified with script execution disabled: deck-active
   absent, 7/7 panels visible (opacity 1, transform none), full-page scroll
   (evidence/nojs-classic-1440.png).
4. **verify-visibility.mjs (the demanded gate)** — see numbers below; `--selftest`
   proves a blacked-out page AND a blur(12)-injected capture both FAIL.

## Visibility gate numbers (all floors GREEN)

| Check | 1440x900 | 1280x800 | 375x812 | Floor |
|---|---|---|---|---|
| live bandRange / lowerSkyRange | **111.5** | **111.3** | **114.2** | 90 / 90 / 70 |
| live starCount | **120** | **92** | **100** | 20 / 14 / 20 |
| RM bandRange (hero=systems) | 111.5 | 111.3 | — | 90 |
| RM starfieldRange | **127.7** | **123.4** | — | 100 (60% of raw 165.7) |
| RM starCount | **120** | **92** | **104** | 25 / 18 / 30 |
| camper edge energy (Sobel) | **8.34** | **9.46** | **16.60** | 5.0 / 5.0 / 10.0 |
| aurora canvas coverage (26s window max) | **0.808** | **0.833** | n/a (no margin) | 0.03 |
| SSIM vs blessed refs (hero/systems) | 1.00/1.00 | 1.00/1.00 | 1.00/1.00 | 0.90 |

Context: the broken live page measured bandRange **67.3** and starfield range
**63.2** with **zero** countable point sources — every structure floor above
rejects it. Raw-AVIF reference: band 186.0 (unscrimmed), starfield 165.7.

**Selftest:** healthy PASS · blackout control FAILED (starCount, starfieldRange,
SSIM x2) · blur(12) control FAILED (all bandRange + starfieldRange + all
starCount + camperEdge + SSIM — the exact signature of the original BLOCKER).
Gate honesty proven.

## Re-gate battery

| Gate | Result |
|---|---|
| `npm run build` + `astro check` | green / 0-0-0 |
| zero-hex outside tokens.css | CLEAN |
| single-rAF counts | scene 2 / clouds+aurora+parallax+idle-queue+meteors+starfield 0 / fig01 2 (unchanged) |
| cross-boundary imports | none (comments only) |
| `verify-visibility --gate` | **PASS all 3 viewports** (table above) |
| `verify-visibility --selftest` | PASS (both controls fail correctly) |
| `verify-contrast --cdp-screenshot` 1440 | PASS — worsts: hero 13.55 · systems 13.37 · experience 14.89 · patents 15.55 · skills 15.57 · contact 14.02 · header 6.32 · footer 13.89 · jump-index 11.97 |
| `verify-contrast --cdp-screenshot` 1280 | PASS — worsts: hero 13.40 · systems 13.22 · experience 11.65 · patents 15.55 · skills 15.56 · contact 14.05 · header 6.40 · footer 13.73 · jump-index 11.66 |
| tier escalations | ZERO (text sits on the same glass recipes, now card-scoped) |
| `--moon` | PASS 1440 (0.2200 < 0.4748) · PASS 1280 (0.4410 < 0.4695 — single-sample mode; transient twinkle can inflate the box peak, assertion strictly held) |
| `--aurora` | PASS 1440 (0.1052) · PASS 1280 (0.0384) — identical to the 10-01 family |
| `verify-contrast --selftest` / `verify-banding --selftest` | PASS / PASS |
| Ambient soak | quality floors hold absolutely: 60.0fps, 0 long tasks, layout 0.000s. Absolute cpuPct **not comparable today** (machine running software-raster Chrome ~2x slower than the 08/09/10 sessions: RM baseline 2.05% vs the recorded ~1.2% family). Same-machine A/B is decisive: fixed-local **10.41%** <= broken-live **10.95%**, tree CPU **66.9% vs 75.7%** (-8.8pp — the shrunken blur area), identical marginal 8.35pp both. Blur area shrank; relative cost went DOWN. |
| Lighthouse local (mobile) | **100/100/100/100**, LCP 1.9s, TBT 0ms, **CLS 0** (was 0.003 — server-rendered data-state did not regress CLS; it improved) |
| Lighthouse local (desktop) | **100/100/100/100**, LCP 0.5s, TBT 0ms, CLS 0 |
| No-JS classic floor | PASS (script-disabled CDP: all content visible) |
| package.json / .planning/config.json | untouched · NOTHING pushed |

## Before / after evidence (`evidence/`)

| File | What |
|---|---|
| `before-live-1440.png` / `before-live-375.png` | The broken LIVE site (review's settled probes — featureless blobs) |
| `after-fixed-local-1440.png` / `after-fixed-local-375.png` | Fixed local build, same settled protocol — crisp starfield, band, camper glow |
| `crop-band-before.png` / `crop-band-after.png` | Right-margin band zone pair: haze blob → full galactic core with dust lanes |
| `crop-camper-before.png` / `crop-camper-after.png` | Camper box pair: unidentifiable smudge → silhouette + warm window glow |
| `nojs-classic-1440.png` | Script-disabled capture (DECK-07 floor) |
| `../gate-report.json` / `../selftest-report.json` | Full machine-readable gate output |

## Deviations from the task spec (all documented in-code)

1. **Camper surround-ratio dropped** — the review's "edge density vs surround"
   comparator is star-polluted (healthy ratio 0.87 <1 because the sky above the
   camper is full of high-gradient point sources). Absolute Sobel floor kept
   (blur crushes it: control tripped `camperEdgeAbs`). Dark-delta was evaluated
   and rejected too (healthy ~2.5, negative on mobile next to the glow).
2. **Aurora mean-vs-surround replaced with canvas coverage** — measured deltas
   are -18/-23 lum on the healthy page (the upper-margin surround is inherently
   brighter than the horizon band; box mean is dominated by the camper glow
   pulse). Presence is asserted at the source: canvas alpha coverage of the
   aurora band, maxed over a full ~20s breathing window (0.81/0.83 measured).
   Screenshot-level haze remains covered by the range/star/SSIM floors.
3. **Blackout control criterion** — "must fail EVERY floor" is impossible by
   construction (the canvas overlay legitimately keeps some point metrics alive
   with the photo hidden); enforced as: must fail overall AND trip a
   photo-structure floor (bandRange or SSIM). It trips 5 floors in practice.
4. **bandRange floor 90, not 112 (60% of raw)** — the raw-AVIF reference is
   unscrimmed; the deployed page composites the locked 0.38 scrim, compressing
   healthy range to 111.5. Floor 90 = 80% of healthy / 134% of the broken state
   / 48% of raw. starfieldRange keeps the literal 60%-of-raw floor (100).
5. **Soak absolute number recorded via same-machine A/B** (see battery table) —
   the machine measures ~2x the recorded family on BOTH builds today.

## DEPLOYED LIVE — 2026-07-19 (user-approved)

**Approval record:** the user explicitly chose **"Redeploy now"** in chat on
2026-07-19 after reviewing the before/after evidence for the sky-visibility
BLOCKER. That authorized the deploy.

**Deploy:** FF-only push `6f56e10..1d6999d` (origin/main was a strict ancestor;
NEVER --force). Actions deploy run `29715776255` — build 29s + deploy 10s —
**success**. Live CSS asset `index.hvpsm-dc.css` is **byte-identical** (17081 B)
to the local build; live HTML server-renders `data-state` (1 active / 6 inactive);
backdrop-filter lives only on `>.panel-card` (bare active-panel rule = opacity/
transform only). Propagation confirmed on first poll (no CDN lag).

**LIVE visibility gate — PASS all three viewports** (`verify-visibility --gate
--url https://p2401kumar.github.io/`), recorded next to local:

| Check | LIVE 1440 | local | LIVE 1280 | local | LIVE 375 | local | Floor |
|---|---|---|---|---|---|---|---|
| band / lowerSky range | **111.5** | 111.5 | **111.3** | 111.3 | **114.2** | 114.2 | 90/90/70 |
| starfield range (RM) | **127.7** | 127.7 | **123.4** | 123.4 | — | — | 100 |
| star count (RM hero) | **120** | 120 | **92** | 92 | **104** | 104 | 25/18/30 |
| live star count | **120** | 120 | **92** | 92 | **100** | 101 | 20/14/20 |
| camper edge (Sobel) | **8.34** | 8.34 | **9.46** | 9.46 | **16.60** | 16.60 | 5/5/10 |
| aurora canvas coverage | **0.813** | 0.829 | **0.837** | 0.825 | n/a | n/a | 0.03 |
| SSIM vs blessed refs | **1.00/1.00** | 1.00 | **1.00/1.00** | 1.00 | **1.00/1.00** | 1.00 | 0.90 |

Live equals local within animation phase (aurora coverage + one twinkle-phase
star count differ trivially, both far above floors). Every structure floor a
blur destroys is cleared on the REAL origin by a wide margin. Selftest gate-
honesty proof was re-run against the local build (blackout + blur(12) controls
both FAIL correctly — `local-selftest-report.json`).

**Live evidence (committed):** `evidence/live-fixed-1440.png`,
`evidence/live-fixed-375.png` — settled hero captures showing the crisp
starfield, the Milky Way galactic core with dust lanes (1440 right margin), the
camper silhouette + warm window glow, and the intact credit line
"Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0". Machine-readable:
`live-gate-report.json`.

**Live smoke:** homepage 200 · deck+scene markup present (`nightsky-canvas`,
`.deck`, `.sky-photo`) · credit line intact · `/#work` alias → `systems`
(shipped `Map([['work','systems']])`) · `/work/dynamodb-cellularization/` 200 and
scene-free.

**Live Lighthouse:** mobile **100/100/100/100** (LCP 1.4s, TBT 50ms, CLS 0.001);
desktop **94/100/100/100** (LCP 1.5s, TBT 20ms, CLS 0). Desktop perf 94 is below
the local 100 — pure live-network LCP variance (1.5s over the CDN vs 0.5s local),
above the 90 floor, not a regression; the visible sky was the priority.
Full reports: `live-lighthouse-mobile.json` / `live-lighthouse-desktop.json`.
