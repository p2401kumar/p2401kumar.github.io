# Project Research Summary

**Project:** Prateek Kumar — Portfolio
**Milestone:** v3.0 "Real Sky" — composited real-astrophotography sky + full glass chrome + ambient realism
**Researched:** 2026-07-18 (4 parallel lanes: [IMAGERY.md](IMAGERY.md) · [GLASS.md](GLASS.md) · [AMBIENT.md](AMBIENT.md) · [PITFALLS.md](PITFALLS.md) — this file is the decision layer; lanes hold full evidence + URLs. v2.0's summary preserved in git history at tag v2.0.)
**Confidence:** MEDIUM-HIGH overall (architecture + licensing HIGH/MEDIUM; encode numbers + glass CPU cost are spike-gated by design)

## Architecture Verdict

Static astrophotography photo (NOIRLab `noirlab2430b`, CC BY 4.0; ESO `eso0932a` fallback) delivered as a **real `<img>`/CSS background — never canvas-drawn**: LCP-discoverable, survives the no-JS classic mode (a canvas-drawn photo would silently break the DECK-07 floor), and costs nothing behind glass once painted (static backdrop content is cached after first blur). Above it, the **drawn overlay canvas** carries everything that moves or is authored: career constellations, meteors, the drawn crescent moon (photo moon physically rejected — a real moon bright enough to see washes out a real Milky Way in the same exposure), fireflies, clouds, aurora, scintillation. **Glass surfaces sit on top** (panels + header/footer + jump index). Single rAF loop, existing 3-state pause machine covers all four new ambient systems, no new pause states needed.

**The open cross-lane question (resolved empirically in the spike, not by argument):** how much animating canvas overlaps glass panels and what the per-frame re-blur costs. `backdrop-filter` re-blurs whatever changes behind it — no architectural trick exempts animated content. Mitigation ladder if the spike measures hot: throttle canvas work under glass regions to 15–20fps → reduce spawn density under glass → cap blur at 12–16px where overlapped → shrink animated footprint under panels. ≤4 simultaneous glass surfaces (exactly our chrome scope).

## Two Spike Gates (empirical, run FIRST — v2's spike-first pattern)

1. **Banding spike** — AVIF 10-bit 4:4:4 encode (+ film-grain/noise strategy + 2×-resolution-lower-quality trick) must show no visible banding on a real 8-bit display; verified by histogram comb-spike test + eyeball. Banding baked into the foundation is the costliest late discovery — it decides premium vs cheap.
2. **Glass-over-animating-canvas CPU spike** — measure idle CPU: scene alone vs scene + 4 glass surfaces. Marginal re-blur cost must fit inside the <10% total idle floor (target ≤2–3% marginal). **This is the milestone's re-scope trigger**: if the cost can't be tuned under the floor, the "full glass over a permanently-animating scene" premise needs a structural rethink (glass over static-only regions), not more tuning.

## Decided vs Needs-Spike

| Lane | Decided by research | Needs spike | Verification evolution |
|---|---|---|---|
| IMAGERY | NOIRLab primary / ESO fallback (both CC BY 4.0); credit `Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0` (linked); build-time rotate/crop composite via sharp; AVIF 10-bit + WebP fallback; ~250–700KB budget; moon stays drawn | Banding pipeline (spike 1) | Histogram comb-spike test; real 8-bit display check |
| GLASS | Recipe: white 5–10% fill + `blur(12px) saturate(150%)` + 1px top light edge; chrome variant lighter (10px/5%); token-expressed (`--glass-*`); `@supports` ladder → opaque `--panel` baseline; `prefers-reduced-transparency` additive pattern | Re-blur CPU cost (spike 2) | **verify-contrast.mjs re-architecture required**: analytic compositing cannot model a blur kernel — must sample real post-composite screenshots (CDP scaffolding already in the script) |
| AMBIENT | Clouds: 2 pre-rendered sprite layers, wraparound blit in existing tick; parallax: CSS `translate3d` transitions (300–500ms) per panel change, compositor-only; aurora: noise-table curtains, updates every 3–5 frames, luminance capped below MW band; scintillation: waveform upgrade of the existing ~40-star subset (no count widening) | Glass-overlap cost (spike 2) | Per-system frame-cost profiling; mobile ladder: drop far cloud layer → throttle aurora → drop color nudge; NEVER drop parallax; reduced-motion always full-stop |
| PITFALLS | 4-stage banding pipeline; LCP realistic 1.5–2.8s mobile with full-viewport AVIF (from 0.4–1.4s today) → LQIP ladder + `fetchpriority=high` + preload, dedicated Lighthouse checkpoint immediately after photo integration; photo via CSS/`<img>` for no-JS; stacking-context/backdrop-root traps enumerated | Both spikes | Carry-forward regression checklist (below) |

## Carry-forward regression list (lift into the launch phase verbatim)

Fig. 01 embedded 36-check audit · deck mechanics (wheel/swipe/keys/jump/hash/back-forward) · no-JS classic mode **with the photo present** · `view classic` escape hatch · case-study pages scene-free (leak gate) · sitemap 3 routes · `/#work` alias · cold-`/#fig-01` scene pause · honesty gate label sourcing · single-rAF counts · zero-hex (new `--glass-*`/photo tokens live in tokens.css) · contrast ≥4.5:1 worst-case (new screenshot-sampled mode) · idle <10% CPU · reduced-motion full stop · Lighthouse ≥90 ×4 live both presets.

## Design-phase deliberation (surfaced, not a blocker)

PROJECT.md locks "FULL glass system" (user choice). Precedent (NN/G's critique of Apple's Liquid Glass; ESO.org avoiding glass under body text) warns that uniform glass on text-dense surfaces fights legibility. Resolution path: the glass system may **tier within the locked direction** — paragraph-heavy panels get a higher-opacity/lower-blur variant of the same glass grammar; the screenshot-sampled 4.5:1 floor is the objective arbiter. Surfaced at roadmap approval; decided finally in the glass phase's UI spec.

## Confidence ledger

- HIGH: ESO eso0932a license (fetched); backdrop-filter re-blur semantics (MDN + browser bugs); photo-as-`<img>` for LCP/no-JS; moon-washout physics (multiple independent astro sources); CSS-transition parallax cost model.
- MEDIUM: NOIRLab noirlab2430b license/resolution (site bot-gated WebFetch; corroborated via 2–3 mirrors — **manual browser check of noirlab.edu/public/copyright/ required before ship**); AVIF encode numbers for dark astrophotography (reasoned, not benchmarked — spike 1 verifies); ambient budget table (estimates pending profiling).
- LOW/unverified: Apple's specific "≤4 layers / ≤40–60px blur" Liquid Glass budget (no primary source — we use our own spike numbers instead).
- Fetch failures logged: `apod.nasa.gov/apod/fap/lib/rights.html` (404), all `noirlab.edu` direct fetches (bot-gated).

## Suggested phase shape (advisory for the roadmapper; numbering continues from 6)

1. **Phase 7 — Real-Sky Foundation**: both spikes FIRST, then photo composite pipeline + LQIP ladder + credit line + dedicated LCP/Lighthouse checkpoint before anything compounds.
2. **Phase 8 — Glass System**: contrast-verifier re-architecture BEFORE glass values lock, then panels/chrome glass + fallback ladder.
3. **Phase 9 — Living Sky**: parallax → clouds → aurora → scintillation, doctrine + mobile ladder + budget re-proof.
4. **Phase 10 — Integration & Launch**: carry-forward regression battery + real-device checklist + gated deploy (user-go precedent from v2).

---
*Synthesized from 4 parallel research lanes, 2026-07-18. Synthesizer agent returned content inline (Write-tool false refusal, same as v2); orchestrator wrote this file.*
