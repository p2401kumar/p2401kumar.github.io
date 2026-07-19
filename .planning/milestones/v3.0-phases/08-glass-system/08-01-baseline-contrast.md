# 08-01 Pre-Glass Baseline Contrast Reference (GLS-03)

**Recorded:** 2026-07-19 · commit family 882ea09/99fca0b (verifier re-architecture, ZERO glass CSS present)
**Tool:** `node scripts/verify-contrast.mjs --cdp-screenshot` — real post-composite screenshots via CDP `Page.captureScreenshot` → `sharp` raw decode → the existing selftested WCAG helpers. DPR1 forced via `Emulation.setDeviceMetricsOverride` before navigation (the DSF-2 capture hang is a known machine constraint; the gate is DPR1-only by doctrine).
**Gate metric:** worst-case contrast of `--ink` (#e8ebef) vs every real background pixel inside each glyph-run rect (glyphs hidden via `color:transparent` during capture so text pixels never self-compare). Thresholds: ≥4.5 normal text, ≥3 large. Own-color ratios recorded as informational context.

**This table is the arbiter reference for Phase 8:** the glass gate (08-02) must still clear ≥4.5:1 worst-case on every over-sky surface after glass composites over this exact scene.

## Reference table — worst-case vs `--ink`, per surface, both check viewports

| Surface | 1280×800 | 1440×900 | Status / notes |
|---|---|---|---|
| hero | 14.891 | 15.022 | PASS both |
| fig-01 | (11.59 — opaque `.fig` bg, not over sky) | (11.59 — opaque) | not gated (opaque `--panel` background, same as analytic-mode semantics) |
| systems | 14.918 | 14.891 | PASS both |
| **experience** | **3.636 — FAIL (pre-existing)** | 14.544 | see Pre-existing condition 1 |
| patents | 14.891 | 14.906 | PASS both |
| skills | 14.891 | 14.906 | PASS both |
| contact | 14.906 | 15.563 | PASS both |
| **header** | 5.272 | **4.335 — FAIL (pre-existing)** | first-ever measurement; see Pre-existing condition 2 |
| footer | 14.679 | 15.282 | PASS both (vs `--ink`) |
| jump-index | (15.702 — opaque pill) | (15.702 — opaque) | pill has opaque `background: var(--bg)` today → not over sky; measured from real pixels anyway (`notOverSky` in report). Own-color (`--body` over pill): 8.773 |

Worst region identities (screenshot-authoritative):

- experience @1280×800 → `li "Shrank the app APK from 150MB to 90MB."` rect (218,620 253×19), worst pixel rgb(160,110,76) at (242,633) — the **camper glow**.
- header @1440×900 → `b "prateek kumar"` rect (0,32 102×15), worst pixel rgb(94,110,134) at (8,32) — bright photo sky at the top-left where the scrim ramp is still weak (~0.19 alpha).
- header @1280×800 → same `b "prateek kumar"` region, 5.272 (passes at this width).

## Pre-existing conditions (recorded, NOT fixed in 08-01 — this plan touches zero product CSS)

### 1. Experience panel text over the camper glow — 3.636:1 at 1280×800

The failing pixel rgb(160,110,76) sits at (242,633); the `.camper-glow` copper radial (NightSky.astro: camper at `left:8vw, bottom:15%`, width `clamp(160px,16vw,260px)`; glow center 70%/57.3% of the camper box) computes to center ≈(245,632) at 1280×800 — exact match. At this viewport the experience panel's left-column bullet list overlaps the glow.

**Why no prior gate ever saw this:** the analytic sampler composites photo + canvas + scrim + *ancestor* DOM backgrounds. The camper glow is a DOM **sibling** layer inside `.nightsky-host` (Layer 1) — not on the canvas, not the photo, not an ancestor of any text — so it is architecturally invisible to analytic compositing. Only real-screenshot sampling can see it. Additionally the glow **pulses** (`camper-glow-pulse` 5s, opacity 0.7↔1.0); this capture caught one phase — at peak opacity the ratio is somewhat worse, at trough somewhat better. Reduced-motion holds it at 0.85.

**Disposition:** pre-existing legibility condition of the live site, newly measurable. 08-02's glass gate (which must clear ≥4.5 on this same panel/viewport) forces the fix decision (tiered panel fill, glow dimming under text, or scrim/geometry adjustment — measured, not guessed).

### 2. Header identity line — 4.335:1 at 1440×900 (first-ever chrome measurement)

`<b>prateek kumar</b>` (`--ink`, 12.5px/600) fails 4.5 at 1440×900 (4.335) and passes at 1280×800 (5.272). Header/footer/`#deck-index` were **never contrast-gated in project history** (the analytic query was panel-scoped); header/footer carry no background of their own and ride on "the sky is dark up there" — which the true-1440×900 photo crop breaks at the top-left corner. This region was only discovered because the region query was widened with `b`/`div` (the identity line is a direct-text `<div>` with a `<b>` child — neither tag was in the original panel-scoped list).

**Disposition:** pre-existing condition. Any white-tinted glass fill on the header will *lower* this number further — 08-02's gate forces the tier/fix decision (e.g. header fill darkness, top-scrim extension).

### 3. Informational — chrome own-color ratios (design-tier dim text, never gated, unchanged semantics)

The gate metric is vs `--ink` (identical to the analytic mode's historical gating). The chrome's actual text colors are dimmer by design and their own-color worst ratios pre-glass are:

| Region | color | 1280×800 | 1440×900 |
|---|---|---|---|
| header nav "contact" | `--dim` | 1.835 | 1.725 |
| header "· seattle" | `--dim` | 2.107 | 2.104 |
| header nav "résumé" / "work" | `--dim` | 2.529 / 3.018 | 2.549 / 3.086 |
| footer status/clock/credit | `--faint` | 2.712–2.888 | 2.824–2.897 |
| footer credit links | `--dim` | 4.742 | 4.742 |

Recorded verbatim as the pre-glass state of these never-gated surfaces; 08-02 inherits these as context when the fill decisions land.

## Tall-panel internal-scroll sweep findings

Measured in-page at both widths (`sampled_offsets` recorded per panel entry in the report JSON):

| Panel | 1280×800 scrollH/clientH | 1440×900 scrollH/clientH | Sweep |
|---|---|---|---|
| experience | 800/800 | 900/900 | no internal scroll needed at either width |
| patents | 800/800 | 900/900 | no internal scroll needed at either width |
| skills | 800/800 | 900/900 | no internal scroll needed at either width |
| (all others) | =viewport | =viewport | no internal scroll needed |

`sampled_offsets: [0]` for every panel at both widths — the sweep machinery exists and fires automatically whenever `scrollHeight > clientHeight` (08-RESEARCH.md Pitfall 5 / Open Question 2 resolved: current content fits both gate viewports; the capability stays armed for content growth).

## Mode-agreement record

- `--agreement-selftest` (solid fixture, pre-blur): analytic 11.3880 vs screenshot 11.3875 → |Δ| = **0.0005** ≤ 0.05 — PASS (re-confirmed after the baseline runs).
- Glass fixture variant (recorded, screenshot-authoritative): analytic 1.1070 vs screenshot 7.7901 → |Δ| = 6.68 — the analytic model cannot represent the blur kernel; this divergence is the justification for screenshot mode.

### Expected-family reconciliation (STOP-and-investigate performed and closed)

07-04's analytic reference (worst 4.58 @ "1280×800", 12.22 @ "1440×900") does **not** match this baseline's panel family (~14.5–15.6). Investigated to root cause — neither pixel pipeline is lying:

1. **The legacy `--cdp`/`--moon` viewport labels are wrong.** `--window-size=1440,900` in headless Chrome yields an *effective* viewport of **1424×805** (probed directly: `innerWidth/innerHeight` = 1424×805 without emulation; 1440×900 exactly with `Emulation.setDeviceMetricsOverride`). All historical analytic numbers were measured at the smaller, wider-aspect effective viewports — different photo cover-crop, different scrim mapping, different layout.
2. **Like-for-like cross-check:** analytic mode run at a window size whose effective viewport is exactly 1440×900 reproduces the screenshot numbers per panel within 0.02–0.46 (hero 15.004 vs 15.022; contact 15.538 vs 15.563; experience 15.004 vs 14.544 — residual is twinkle time-sampling breadth: 12 samples vs 1 frame).
3. Analytic at the legacy window size still reproduces 12.216 today (12-sample AND 1-sample) — the historical numbers are stable, just mislabeled.

**Consequence:** this screenshot baseline at true 1280×800 / 1440×900 CSS px supersedes the 4.58/12.22 family as the Phase-8 reference. The legacy analytic mode remains the fast dev-loop tool (its viewport mislabel is logged as a deferred item; not fixed in this plan).

## Gate exit status at baseline

Both runs exit non-zero **solely** due to the two pre-existing conditions above (experience@1280×800, header@1440×900). Every other over-sky surface clears its threshold with ≥10 points of headroom. Per the 08-01 plan contract these are recorded, not fixed; the plan does not fail on them — 08-02's gate owns the decisions.
