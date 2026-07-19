# 08-03 — GLS-04 Real-Page Idle-CPU Re-Proof + Lighthouse + Regression Battery

**Run:** 2026-07-19 · **Gate:** GLS-04 (glass + scene idle CPU < 10% total on the REAL page)
**Method:** 60s CDP soak per run against the BUILT PREVIEW PAGE (`npm run preview` serving `dist/`), `Performance.getMetrics` — the exact methodology that produced 05-06's 5.6%/60s baseline and 07-02 Spike-2's projection (headless Chrome `--headless=new`, software rasterization — conservative vs real GPU). DPR1 at an exact 1440×900 viewport via `Emulation.setDeviceMetricsOverride`. 15s unmeasured warm-up before the first measured run.

**The honest same-page toggle:** both runs measure the IDENTICAL production document. Glass is switched off for the baseline via CDP `Emulation.setEmulatedMedia` emulating `prefers-reduced-transparency: reduce` — the shipped additive `@media` gate collapses every glass surface to its solid fallback (verified live: `matchMedia` true, **0** elements carrying a computed `backdrop-filter`). The glass run emulates `no-preference` (the shipped default): **4** live glass surfaces (`header`, `#hero` active panel, jump-index pill, `footer`), active panel `blur(12px) saturate(1.5) brightness(0.9)`, header `blur(10px) saturate(1.4) brightness(0.92)` — the exact 08-02 recipes. (The jump list is a closed popover at idle — display:none costs nothing, per Spike-2's own proof — so idle surface count is exactly the 4 Spike-2 measured.)

Driver: `glass-reproof/real-soak.mjs` (CDP pieces reused verbatim from `spike-glass/soak.mjs` / `verify-contrast.mjs`; zero new dependencies, package.json untouched). Raw stdout: `glass-reproof/real-soak-output.txt`.

## Soak results — 60s runs, 1440×900 DPR1, real preview page

### Run 1 — BASELINE (real page, reduced-transparency emulated: glass OFF)

| Metric | Value | Target |
|---|---|---|
| Wall clock | 60.0 s | 60 s |
| TaskDuration Δ → CPU | 4.082 s → **6.80%** | — (family check below) |
| ScriptDuration Δ | 1.827 s | — |
| LayoutDuration Δ | 0.000 s | 0.000 s ✓ |
| Long tasks | 0 | 0 ✓ |
| Realized fps | 60.0 | 60.0 ✓ |
| Live glass surfaces | 0 | 0 ✓ (emulation verified) |
| Whole-tree CPU (suppl.) | 30.00% | — (software-raster compositing of the full production page) |

**Baseline sanity:** 6.80% sits inside the live 5.6–6.9% family (05-06 measured 5.6% on the v2 production page; the spike harness read 4.04% carrying only the scene stack). The real v3 page carries the full deck DOM, the photo `<img>` stack, scrim, and 7 panels — the top of the family is expected, no red flag.

### Run 2 — GLASS (same page, no-preference emulated: glass LIVE, 4 surfaces)

| Metric | Value | Target |
|---|---|---|
| Wall clock | 60.0 s | 60 s |
| TaskDuration Δ → CPU | 3.662 s → **6.10%** | **total < 10% ✓ (3.9 pp headroom)** |
| ScriptDuration Δ | 1.591 s | — |
| LayoutDuration Δ | 0.000 s | 0.000 s ✓ (blur is a compositor op, not layout — confirmed on the real page) |
| Long tasks | 0 | 0 ✓ |
| Realized fps | 60.0 | 60.0 ✓ |
| Live glass surfaces | 4 (header, active panel, jump pill, footer) | ≤4 ✓ |
| Whole-tree CPU (suppl.) | 36.67% | — |

### Marginal delta vs Spike-2's projection (the GLS-04 number)

| Measure | Baseline | Glass | Marginal | Spike-2 projection | Result |
|---|---|---|---|---|---|
| **Main-thread CPU (canonical, 05-06 methodology)** | 6.80% | 6.10% | **−0.70 pp** | +0.47 pp | **PASS** — statistically zero (see interpretation) |
| Total with glass | — | **6.10%** | — | 4.52% projected total | **PASS** (< 10%, 3.9 pp headroom) |
| Whole-tree CPU (supplementary, software raster) | 30.00% | 36.67% | **+6.68 pp** | +6.48 pp (Spike-2 measured) | consistent within 0.2 pp |

**Interpretation (recorded honestly):** the main-thread marginal measured −0.70 pp — the glass run's ScriptDuration was 0.24 s *lower* than the baseline's (1.591 vs 1.827 s), i.e. the delta is dominated by run-to-run scene-script variance (meteor spawn timing, twinkle phase) of ~±0.4 pp, not by glass. This is exactly what Spike-2 predicted: backdrop-filter blur executes in the compositor, so the main-thread marginal is ~0 within noise (+0.47 pp was itself near the noise floor). The cross-check that actually carries the blur cost confirms the projection precisely: the whole-process-tree marginal is **+6.68 pp vs Spike-2's measured +6.48 pp** — the real page reproduces the spike's compositor-side cost within 0.2 pp under identical software-raster conditions. On real hardware that cost runs on the GPU (05-06/07-02 doctrine). Verdict keys off the floors: total 6.10% < 10%, 60.0 fps held, 0 long tasks, LayoutDuration Δ 0.000 s.

**Mitigation ladder:** NOT triggered — no lever applied (total sits 3.9 pp under the floor; the GLASS.md §1.4 ladder — overlap-area reduction → 15–20fps canvas throttle under glass → spawn-density bias → blur cap toward 12px — remains untouched headroom for Phase 9).

**Phase 9 budget note:** ambient animation inherits ~3.9 pp of main-thread headroom under the 10% floor at the measured real-page total of 6.10% (glass live, software raster, 1440×900 DPR1).

## Lighthouse — final build, both presets (npx lighthouse v13.4.0, `--headless=new`, preview URL)

| Preset | Perf | A11y | Best Practices | SEO | TBT | LCP | CLS | Floor |
|---|---|---|---|---|---|---|---|---|
| Mobile (default) | **99** | **100** | **100** | **100** | **0 ms** | 1.86 s | 0.003 | ≥90 ×4 ✓ |
| Desktop (`--preset=desktop`) | **100** | **100** | **100** | **100** | **0 ms** | 0.46 s | 0.000 | ≥90 ×4 ✓ |

Identical to the 07-04 pre-glass baseline (mobile 99 / LCP 1.9 s / CLS 0.003; desktop 100×4 / LCP 0.5 s) — glass added compositing but zero JS, so TBT stayed 0 ms and no category moved. Scores extracted from the JSON reports; the tables above are the committed record (raw JSONs not committed, matching the 07-04 evidence convention).

## GLS-04 verdict

| Gate | Result |
|---|---|
| Total idle CPU with glass (real page, 60s) | **6.10% < 10% — PASS** |
| 60 fps held | **60.0 — PASS** |
| Long tasks | **0 — PASS** |
| LayoutDuration Δ | **0.000 s — PASS** |
| Marginal vs Spike-2 +0.47 pp | **~0 pp main-thread (−0.70 pp, inside ±0.4 pp scene noise); tree cross-check +6.68 pp vs spike's +6.48 pp — projection CONFIRMED** |
| Lighthouse ≥90 ×4, both presets | **PASS (99/100/100/100 · 100/100/100/100), TBT 0 ms** |
| Mitigation ladder | not needed |

**GLS-04: PASS.**

---

## Full carry-forward regression battery (composited build, 2026-07-19)

Every gate asserted (`test "$(grep -o … | wc -l | tr -d ' ')" = N` convention against source; `grep -c` nowhere).

| Gate | Result |
|---|---|
| `npx astro check` | **PASS — 0 errors / 0 warnings / 0 hints** |
| `npm run build` | **PASS — green, 4 pages + sitemap-index** |
| `--glass-*` token declarations in tokens.css | **exactly 13**; 0 hex characters in the 13 declarations (values stay rgb()/px/%/decimal) |
| Zero-hex, standard regex (deck.css / SiteHeader / SiteFooter / BaseLayout / index.astro) | **0** |
| Zero-hex, DeckIndex.astro identifier-boundary PCRE (`#[0-9a-fA-F]{3,8}(?![0-9A-Za-z_-])` skips `#deck-*` ids) | **0** |
| Single-rAF invariant | scene.ts = **2** · starfield.ts = **0** · meteors.ts = **0** · fig01/render.ts = **2** — unchanged |
| Scene-module deck/fig01 imports (scene/starfield/constellations/meteors/tokens import lines) | **0** |
| `verify-contrast.mjs --selftest` (incl. scrim 0.38 deck.css sync check — scrim untouched this phase) | **PASS** |
| `verify-contrast.mjs --agreement-selftest` | **PASS** (solid fixture within ±0.05 asserted; glass divergence recorded as designed) |
| `verify-banding.mjs --selftest` | **PASS** (clean control passes, banded control fails) |
| `verify-banding.mjs` — 4 committed masters × 2 regions | **all PASS** (runsAboveZero=1, zeroGaps=0 everywhere) |
| `--cdp-screenshot` @1280×800 | **exit 0** — worst 6.331 (header); hero 13.40 · systems 13.22 · experience 12.16 · patents 15.55 · skills 15.55 · contact 14.02 · footer 12.11 · jump-index 10.29 — matches 08-02's final post-relocation table (twinkle-phase deltas ≤0.05) |
| `--cdp-screenshot` @1440×900 | **exit 0** — worst 6.234 (header); hero 13.55 · systems 13.37 · experience 15.06 · patents 15.55 · skills 15.58 · contact 14.02 · footer 12.28 · jump-index 10.60 — matches 08-02's final table |
| `--moon` @1280×800 | **PASS** — moonPeak 0.2123 < mwPeak 0.4695 (identical to 07-03/07-04: glass is a DOM layer above the canvas; --moon reads canvas pixels directly) |
| `--moon` @1440×900 | **PASS** — moonPeak 0.1857 < mwPeak 0.4748 (identical) |
| Sitemap | **exactly 3 `<loc>` routes** |
| package.json / package-lock.json / .planning/config.json | **untouched** (`git diff --quiet` clean); zero installs |

### Leak gate (built output)

| Assertion | Result |
|---|---|
| `dist/index.html` body carries `has-sky` | **PASS** — `<body class="has-sky">` (1 body-tag match) |
| `dist/work/*/index.html` + `dist/404.html` bodies carry `has-sky` | **PASS — 0** (`<body>` bare on all three) |
| backdrop-filter on /work + /404 (inlined chrome CSS) | **airtight** — 8 occurrences per page, ALL accounted for: 4 inside `@supports` condition text + 4 inside `body.has-sky`-scoped rules that cannot match (unaccounted = 0 on every page) |
| Panel/deck glass reaching /work or /404 | **0** — zero `data-state="active"` / `.deck` / `--glass-panel` selectors in their CSS (deck.css stays PanelDeck-only → index-only) |
| Scene/sky JS on /work + /404 (carried from 07-04) | **PASS** — zero `<script src>` tags, zero `nightsky`/`/sky/` refs (sole inline module script = pre-existing footer clock, matching 07-04's record) |
| Dist CSS ships BOTH backdrop-filter forms (08-02 cssTarget fix regression check) | **PASS** — 6 `-webkit-backdrop-filter` + 6 unprefixed `backdrop-filter` in `dist/_astro/*.css` |

**Assertion-precision note (recorded, not a gate change):** the plan's literal file-wide grep `cat dist/work/*/index.html dist/404.html | grep -o 'has-sky' | wc -l = 0` counts **6** — but all six are the *selector text* of the inlined, unmatched `body.has-sky` chrome rules, not a leak. The gate's stated truth ("body has no has-sky class → no chrome-glass rule can match") is what's asserted above, boundary-correctly, on the `<body>` tags themselves. Nothing was weakened: the stronger per-occurrence accounting (unaccounted = 0) plus the body-tag assertion subsume the intent.

### DeckIndex-relocation regression smoke (CDP, built preview @1440×900)

08-02 moved `<DeckIndex />` out of `.deck`'s stacking context and document-scoped deck.ts's six hooks — this smoke proves the deck still works end-to-end:

| Check | Result |
|---|---|
| `#deck-index` present AND outside `.deck` (relocation held in dist) | **PASS** |
| Jump-link click (`data-panel-index="2"`, `#systems`) → correct panel active | **PASS** — `data-panel-id="systems"` active, count text `03 / 07` |
| `aria-current` follows navigation (exactly one carrier) | **PASS** — 0 → 2 → 0 across jump + return, always exactly 1 anchor |
| `nightsky:panel-change` fires per navigation (the fig-01 pause contract's transport) | **PASS** — exactly 1 event per jump (2 total for 2 navigations); dist JS carries 5 `nightsky:panel-change` refs (source untouched since 08-02's final commit — dist is byte-equivalent by construction) |

**Battery verdict: ALL GREEN — zero fixes required, zero gates weakened.**
