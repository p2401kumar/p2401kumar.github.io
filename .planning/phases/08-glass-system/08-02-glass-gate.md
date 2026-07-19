# 08-02 Glass Gate — Screenshot-Sampled Contrast Record (GLS-03 arbitration)

**Recorded:** 2026-07-19 · glass CSS live (commits 943baea + a8191db)
**Tool:** `node scripts/verify-contrast.mjs --cdp-screenshot` — the 08-01 gate (real CDP `Page.captureScreenshot` → sharp raw decode → selftested WCAG helpers, DPR1 emulation-forced, glyphs hidden via `color:transparent` during capture). Run at BOTH true emulated viewports with glass compositing.
**Gate metric:** worst-case contrast of `--ink` (#e8ebef) vs every real background pixel inside each glyph-run rect. Threshold ≥ 4.5 normal text / ≥ 3 large.
**Result: PASS at both viewports, exit 0, on the UI-SPEC starting tier assignment. ZERO tier escalations required.**

## Final gate table — worst-case vs `--ink`, per surface, both viewports

| Surface | Tier (as shipped) | 1280×800 | 1440×900 | Pre-glass baseline (1280 / 1440) | Status |
|---|---|---|---|---|---|
| hero | tier-1 optical | **13.402** | **13.548** | 14.891 / 15.022 | PASS both |
| fig-01 | tier-1 wrapper (`.fig` card exempt, opaque) | n/a — no over-sky text | n/a | (11.59 opaque) | not gated, by construction |
| systems | tier-1 optical | **13.224** | **13.371** | 14.918 / 14.891 | PASS both |
| experience | **tier-2 protected** | **12.115** | **15.061** | **3.636 FAIL** / 14.544 | PASS both — pre-existing failure CLEARED |
| patents | **tier-2 protected** | **15.551** | **15.551** | 14.891 / 14.906 | PASS both |
| skills | **tier-2 protected** | **15.551** | **15.575** | 14.891 / 14.906 | PASS both |
| contact | tier-1 optical | **14.020** | **14.020** | 14.906 / 15.563 | PASS both |
| header | chrome | **6.331** | **6.234** | 5.272 / **4.335 FAIL** | PASS both — pre-existing failure CLEARED |
| footer | chrome | **12.107** | **12.284** | 14.679 / 15.282 | PASS both |
| jump-index | chrome (standard recipe — tier-2 fill NOT needed) | **10.287** | **10.596** | (15.702, opaque pill — not previously over-sky) | PASS both — first-ever over-sky gating of this surface |

Worst-region identities (screenshot-authoritative, final run):

- hero @1280 → `em "applied ai"`, worst px rgb(29,34,39); @1440 → `h1 "I build the infrastructure…"`, rgb(28,33,39)
- experience @1280 → `li "Shrank the app APK from 150MB…"` worst px rgb(53,38,32) @(245,626) — the **camper glow**, now sampled through the tier-2 fill
- header both widths → `b "prateek kumar"`, worst px rgb(61,85,121)/(62,86,122) — bright top-left sky, now sampled through the chrome glass
- jump-index both widths → `span "01 / 07"` over the galactic-core margin, through the chrome glass pill fill
- Scroll sweep: `sampled_offsets: [0]` for every panel at both widths — no panel scrolls internally at either gate viewport (capability armed, not needed)

## Escalation log

**No escalations.** The UI-SPEC starting assignment (tier-1: hero, fig-01 wrapper, systems, contact · tier-2: experience, patents, skills · chrome: header, footer, jump-index) passed the gate on the first run at both viewports. Specifically:

1. **experience @1280×800 — pre-existing 3.636 FAIL → 12.115 PASS.** The tier-2 protected fill (`rgb(15 18 23 / 0.55)` + `brightness(0.96)` + `blur(10px)`) functions as the supplemental scrim the UI-SPEC math predicted (~10.2 hand-math headroom; real measured 12.1). It darkens the pulsing `.camper-glow` copper radial beneath the bullet text — worst pixel fell from rgb(160,110,76) to rgb(53,38,32). No has-sky-scoped glow alpha reduction was needed (the contemplated Rule 2 deviation was NOT exercised).
2. **header @1440×900 — pre-existing 4.335 FAIL → 6.234 PASS.** The chrome recipe's `brightness(0.92)` darkens the bright top-left sky crop more than the 5% white fill lightens it, and `blur(10px)` averages away the brightest point pixels. No chrome→tier-2 escalation needed.
3. **hero watch-item (UI-SPEC: "escalate immediately if below 4.5 under tier-1"):** measured 13.402/13.548 under tier-1 — the 07-04-era 4.58 "razor-thin" figure belonged to the mislabeled legacy viewport family (see 08-01-baseline-contrast.md reconciliation); the true-viewport floor has ~9 points of headroom. Hero stays tier-1.
4. **jump-index watch-item (highest-risk chrome, galactic-core margin):** 10.287/10.596 under the standard chrome recipe — the tier-2 dark protective fill trade was NOT needed; the jewel-like read ships.

Tier-2 never failed anywhere → the stop-and-escalate condition never arose.

## Deviation discovered by visual evidence (not the gate): DeckIndex stacking trap

The gate PASSED while the rendered pill was actually **illegible** — full-page evidence screenshots showed `01 / 07`, the deck hint, and the mode links smeared into the footer's backdrop. Root cause: `.deck` (position:fixed, z-index:1) is a stacking context, so those z-index-21 fixed elements painted BELOW the z-index-20 footer; the footer's new backdrop-filter therefore blurred them as part of its backdrop. The gate cannot see this class of bug (it hides glyphs before capture, and it measures contrast, not glyph integrity). Fix: DeckIndex moved outside `.deck` (PanelDeck.astro) + document-scoped hook queries (deck.ts) — commit a8191db. Gate re-run at both widths after the fix: the final table above IS the post-fix record (jump-index 10.287/10.596, footer 12.107/12.284).

## Classic-mode spot check (lower-rigor path per 08-UI-SPEC)

Both viewports, via the real `.deck-view-classic` escape hatch:

- `html.classic-active` panels carry glass AND the SKY-05 scrim gradient simultaneously (computed: `background-color: rgba(255,255,255,0.06)` tier-1 / `rgba(15,18,23,0.55)` tier-2, `background-image: linear-gradient(…)` intact) — the `background-color` longhand choice preserved the classic scrim exactly as the UI-SPEC's Scrim Interaction locks it.
- Scrolling layout intact (`scrollHeight > innerHeight`, panels in flow); tier-2 experience/patents text visually legible over the static photo (`classic-experience-*.png`).
- No cost/contrast problem observed → `content-visibility: auto` lever NOT applied (documented as available, per plan).

## Degradation evidence (GLS-02)

| Ladder | Method | Result |
|---|---|---|
| `prefers-reduced-transparency: reduce` | CDP `Emulation.setEmulatedMedia` (feature emulation VERIFIED working: `matchMedia('(prefers-reduced-transparency: reduce)').matches === true` after the call — no manual-flag protocol needed) | Panels/header/footer: `backdrop-filter: none`, `background-color: rgba(0,0,0,0)` (declare-nothing fallback = today's transparent look); pill returns to solid `rgb(15,18,22)` = `--bg` base rule. Captures: `reduced-transparency-*.png` |
| Print | CDP `Emulation.setEmulatedMedia({media:'print'})` computed-style check | `backdrop-filter: none`, `background: none` on panel, header, pill — the `!important` print strip beats the higher-specificity scoped glass rules (this is WHY the strip carries `!important`; a plain rule verifiably lost the cascade) |
| `@supports` absent | Not simulatable in Chrome (backdrop-filter support cannot be disabled at runtime). Structurally proven instead: ALL glass rules live inside `@supports (backdrop-filter…) or (-webkit-backdrop-filter…)`; the no-support appearance is BY CONSTRUCTION identical to the reduced-transparency captures (same declare-nothing fallback branch) | Covered by rule structure + reduced-transparency captures |

## Evidence index (glass-evidence/)

- `gate-1280x800-final.json` / `gate-1440x900-final.json` — full gate reports (final, post-stacking-fix; exit 0 both) + `.log` per-panel summaries
- `gate-1280x800-run1.json` / `gate-1440x900-run1.json` — first runs (pre-stacking-fix; also exit 0 — documents that the fix did not rescue the gate, the gate never saw the bug)
- `deck-hero-{1280x800,1440x900}.png` — deck hero, tier-1 glass, full page
- `deck-experience-tier2-{vp}.png` — tier-2 protected fill over the camper glow
- `jump-index-closeup-{vp}.png` — the reference chrome surface, sharp above the footer glass (post-fix)
- `classic-top-{vp}.png` / `classic-experience-{vp}.png` — classic-mode spot check
- `reduced-transparency-{vp}.png` — GLS-02 collapse proof
- `computed-style-checks.json` — every computed-style assertion above, both viewports

## Gate exit status

`--cdp-screenshot` exits **0 at 1280×800 and 0 at 1440×900** with glass live. Every over-sky surface ≥ 4.5:1 worst-case; the two 08-01 pre-existing failures are cleared; `--selftest` remains green (scrim 0.38 untouched).
