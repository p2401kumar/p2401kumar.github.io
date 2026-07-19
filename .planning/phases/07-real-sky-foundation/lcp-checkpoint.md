# Phase 7 — Blocking Post-Photo LCP Checkpoint (07-04, D-LCP gate)

**Gate contract (07-CONTEXT.md D-LCP / ROADMAP Phase 7 criterion 6):** Lighthouse mobile
AND desktop presets must score >= 90 in every category AND mobile LCP must land within
the 1.5–2.8 s research budget, immediately after real-photo integration and BEFORE any
Phase 8 glass work compounds. A category < 90 or an LCP blowout = STOP the phase.

**Audit method:** `npx lighthouse` (v13.4.0), headless Chrome (`--chrome-flags="--headless=new"`),
against the LOCAL preview (`npm run build && npm run preview` → `http://localhost:4321/`) —
NOT the deployed site (no push/deploy this phase; the live site stays v2 until Phase 10).
Full v3 foundation active: composited NOIRLab Milky-Way photo (LCP-preloaded AVIF), transparent
Layer 0 overlay (moon bake, margin twinkle, constellations + resting halo, meteors), SKY-05
scrim, deck mode, CC BY 4.0 footer credit line (07-04 Task 1).
**Date:** 2026-07-19

## VERDICT: PASS — phase unblocked for close-out

| Gate | Floor | Mobile (default preset) | Desktop (`--preset=desktop`) | Result |
|---|---|---|---|---|
| Performance | >= 90 | **99** | **100** | PASS |
| Accessibility | >= 90 | **100** | **100** | PASS |
| Best Practices | >= 90 | **100** | **100** | PASS |
| SEO | >= 90 | **100** | **100** | PASS |
| LCP | 1.5–2.8 s (mobile budget) | **1.9 s (1860 ms)** — inside budget | **0.5 s (460 ms)** — far under | PASS |
| CLS | 0 / pre-photo baseline (0.003) | **0.003** (matches 05.1/06 baseline exactly) | **0** | PASS |
| TBT | informational | 0 ms | 0 ms | — |
| FCP | informational | 1.4 s | 0.4 s | — |
| Speed Index | informational | 1.4 s | 0.5 s | — |

## Preload-LCP audit (07-RESEARCH.md pitfall 2 — single-fetch invariant)

- **Exactly ONE sky-master fetch on both presets:** `milky-way-1920.avif`, 56 KB transfer,
  resourceType Image. No second fetch of any `milky-way-*` asset — the `rel=preload`
  `imagesrcset`/`imagesizes` byte-for-byte mirror of the `<picture>` avif source held
  (no preload/srcset divergence double-fetch).
- **Zero `runWarnings`** on both presets — in particular, NO "preloaded but not used
  within a few seconds" unused-preload warning; the preload was consumed by the picture's
  own request.
- **LCP element identity (recorded honestly):** Lighthouse reports the LCP element as the
  hero TEXT — `section.hero > p.sub` on mobile, `section.hero > h1` on desktop — NOT the
  photo `<img>`. This is expected Chrome LCP-spec behavior, not a delivery defect: images
  occupying the full viewport are excluded from LCP candidacy as presumed backgrounds
  (`lcp-discovery-insight` reports notApplicable accordingly, and the
  `prioritize-lcp-image` audit is absent for a text LCP). The photo itself is still
  preload-discovered, fetched exactly once, decoded eagerly (`fetchpriority=high`), and
  painted behind the text — the intent of IMG-02's "LCP-discoverable" delivery contract
  (never delay first paint, never double-fetch, never shift layout) is fully held, and the
  text-LCP outcome is strictly BETTER for the budget than an image LCP would be.
- **LCP breakdown (mobile):** TTFB 325 ms + element render delay 172 ms — no
  load-delay/load-time subparts (text LCP; the photo never gated it).

## Raw JSON

`lh-mobile.json` / `lh-desktop.json` (scratchpad — not committed; reproduce with
`npm run preview` + the commands above).

**Consequence:** the blocking gate PASSES on every axis — no STOP condition. Phase 7 may
close; the documented fallback ladder (drop the 400 ms LQIP fade, 07-RESEARCH.md §4.2)
was NOT needed. Phase 8 glass work may proceed against these numbers as its baseline.

**No push, no deploy, no Pages trigger — all verification local.**
