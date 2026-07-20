# Prateek Kumar — Portfolio

## What This Is

A personal portfolio site for Prateek Kumar (SDE 2 at Microsoft; previously AWS DynamoDB, Samsung SmartThings), positioning him as a senior distributed-systems/cloud engineer at the AI intersection. Static site hosted on GitHub Pages, aimed at recruiters and senior/staff-level hiring managers.

## Core Value

Within seconds of landing, a senior engineering leader should think "this person operates at our level" — credibility delivered through demonstrated craft (a live systems demo), not adjectives.

## Current State (v3.0 shipped 2026-07-19)

**Live at https://p2401kumar.github.io** — the v3.0 "Real Sky" experience: a real NOIRLab Milky Way astrophotograph (composited/graded at build time, 81KB AVIF, banding-proven, CC BY 4.0 credited) behind frosted-glass content chrome (13 `--glass-*` tokens, two tiers, screenshot-verified contrast) and a living ambient scene — drifting clouds, panel-change parallax, breathing aurora, atmospheric scintillation — while the authored overlay (career constellations, meteors, drawn crescent moon) survives on the real sky. **Live Lighthouse: 100×8 (all four categories, both presets)**, LCP 1.5s mobile, idle CPU 6.39% with everything running. Case studies stay scene-free; view-classic + no-JS fall back to the v1-style page. Tags `v1.0`, `v2.0`, `v3.0`; 2021 site on `legacy-2021`.

Milestone stats: 4 phases (7-10), 12 plans, all 18 v3.0 requirements complete and verified (archives: `milestones/v3.0-*`). Two empirical spikes de-risked the milestone before build (banding; glass-over-animating-canvas CPU — the re-scope trigger that never fired). Codebase: Astro 7.0.7 static; `src/lib/fig01/` + `src/lib/nightsky/` engines (one rAF each, event-name coupling only, pause machine covers all ambient); **zero new dependencies across v2 AND v3**. Deploys on push to `main` via GitHub Actions.

## Current Milestone: v3.1 Bolder Sky

**Trigger (user, 2026-07-20):** "The background look shit. improve it." A UI review confirmed all four counts — too dark & muddy, glass reads as a flat gray box, the camper is an unrecognizable smudge, the composition is empty & lopsided. Root of the muddiness: the v3.0 grade crushed the real amber core to cool slate and darkened the whole sky to protect (full-viewport) glass contrast — a floor-gaming that every ratio-gate rewarded.

**Locked direction (mockup pick, 2026-07-20):** from a 3-way mockup, the user chose **Galactic Core + liquid-glass card** — a warm, bright, core-led real sky with a genuinely premium glass card (specular, bright edge, rounded). Focused aesthetic rework, engine unchanged. Phases 11 (Rework) + 12 (Launch), lean (no research fan-out). Full spec: `phases/11-bolder-sky/11-CONTEXT.md`; visual anchor: Artifact `claude.ai/code/artifact/6edcd025-d312-4178-965d-68889d4a18d5`.

**Guarding the look:** v3.1 ships behind `verify-visibility.mjs` (built in the post-v3.0 fix) — a perceptual gate measuring luminance-*range*/structure, star counts, edge-detectability, SSIM vs blessed stills, with blur/blackout controls that must fail. This is the answer to how v3.0 shipped an invisible/muddy sky: the ratio gates couldn't see it; this one can.

Open post-launch items: retire/redirect the old `/home` repo (tracked since v1); user real-device checklist (v3.0-phases/10-integration-launch/10-01-LAUNCH-READINESS.md §6).

Open post-launch items from v2.0 (unchanged): retire/redirect the old `/home` repo; user-run real-device touch checklist + 5-min idle-CPU check (documented in `milestones/v2.0-phases/06-integration-launch/06-01-LAUNCH-READINESS.md` §5–6).

## Requirements

### Validated

- ✓ Editorial shell (mono header, serif thesis hero, quiet links, live-clock footer) — v1.0
- ✓ Fig. 01 signature interactive figure (beams, fault injection → weigh-away → self-heal, hover facts; reduced-motion static path, keyboard proxies, single-rAF 60fps floor) — v1.0
- ✓ All content sections with honesty-gate `source` annotations (systems, experience, patents, skills, contact, résumé PDF) — v1.0
- ✓ Two schema-enforced case studies (dynamodb/cellularization, elb/auto-weight-away; problem → trade-offs → impact) — v1.0
- ✓ User-root GitHub Pages deploy via Actions; responsive 360px→desktop; self-hosted subset fonts with no hero CLS — v1.0
- ✓ SEO/OG/meta, static OG image, 3-URL sitemap, robots.txt; Lighthouse ≥90 ×4 categories on live URL — v1.0

- ✓ Zero-light-pollution night scene: dense pre-rendered starfield, vivid Milky Way, camper silhouette + single copper glow, crescent moon, fireflies, rare meteors — v2.0
- ✓ Constellations with meaning: AWS/Microsoft/Samsung/education-patents clusters, panel-reactive brightening, quiet neural link-firing — v2.0
- ✓ CV as overlay: no-scroll deck (wheel/swipe/keys/jump index), hash routing + back/forward, Fig. 01 as a panel, classic + no-JS fallbacks — v2.0
- ✓ Floors carried forward: live Lighthouse ≥90 ×4 both presets, reduced-motion static frame, keyboard operable, honesty gate, worst-case contrast ≥4.5:1 — v2.0

- ✓ Real composited sky: NOIRLab `noirlab2430b` build-time composite (crop/grade/vignette/seam), AVIF 10-bit + WebP, banding-proven, CC BY 4.0 credit line — v3.0
- ✓ Authored overlay survives on the photo: constellations + panel brightening, meteors, drawn crescent moon (photo moon rejected on physics) — v3.0
- ✓ Full glass system: panels (2 tiers) + header/footer + jump index, 13 tokens, screenshot-sampled contrast verifier, @supports/reduced-transparency/print ladders — v3.0
- ✓ Living sky: clouds (column-attenuated), physically-honest parallax, left-margin aurora (luminance-capped), scintillation — all in one rAF + pause machine, 6.39% idle, mobile shed ladder — v3.0
- ✓ Floors at launch: LIVE Lighthouse 100×8, reduced-motion byte-identical still, contrast ≥4.5:1 every surface both viewports, honesty gate + attribution — v3.0

### Active

*(none — between milestones)*

**Future candidates (not this milestone):**
- Notes/writing section (NOTE-01) — only once a content pipeline exists
- `/craft` experiments page (NOTE-02) — dated interactive prototypes; a curated AI-twin could live here
- Third case study: azure/health-snapshots (CASE-04)
- JSON-LD Person structured data (PLAT-08)
- Post-launch task: retire/redirect the old `p2401kumar.github.io/home` repo

### Out of Scope

- Blog/writing section — v2; he publishes on LinkedIn today, adding a content pipeline now risks a stale section
- "AI twin" chatbot — top-tier engineer portfolios conspicuously avoid chatbots; restraint is the AI-era differentiator (may revisit as a /craft experiment later)
- CMS or backend — static site is a hard requirement (GitHub Pages)
- Light theme — the design system commits to the tinted-graphite dark editorial look; a toggle adds surface area without hiring value
- Analytics dashboards, testimonials, skill bars, tech-logo walls — anti-patterns per portfolio research

## Context

**Content sources:** résumé PDF (`Prateek_Kumar_resume_4_5.pdf`), LinkedIn profile export, existing site p2401kumar.github.io/home (superseded). All metrics on the site must be real: +30% reliability / −20% p99 (DynamoDB cellularization), 90% capacity ops automated (auto-weight-away), APK 150→90 MB, 2 patents, USC MS CS 3.9 GPA, IIT Dhanbad.

**Design direction (locked after 5 prototype iterations + 4-agent parallel research):**
- Rejected: generic AI-slop looks (terminal green, cream serif, gradient hero), playful neural-net toy (bugdroid, fake epoch HUD), flat service-map
- Locked: **editorial restraint + one signature motion metaphor** — the "Fig. 01" interactive cellularization demo framed like a paper figure
- Design tokens: bg `#0f1216` graphite, panel `#12161c`, ink `#e8ebef`, body `#aab2bd`, dim `#78818d`, hairline `#1e242d`, accent copper `#d99163` (<5% surface), good `#57b98a`, amber `#d9a441`
- Type: serif display for thesis (self-host, e.g. an Iowan/Palatino-class face or open equivalent), workhorse sans for body, mono for labels/metrics/nav (infrastructure texture)
- Motion doctrine: one moving thing per viewport; beams with linear easing on 1px hairline routes; staggered dependency-order build-ins (30–80ms, ease-out); dashed = unhealthy/ephemeral; hover responses ≤150ms; `prefers-reduced-motion` → static diagram
- Prototype preserved at `.planning/reference/prototype-shell-and-fig01.html` — fully ported to production in v1.0 (do not regress its interactions in future changes)

**Research corpus (4 parallel agents, July 2026):** AI-infra design language (Anthropic/Modal/OpenAI et al.), devtools motion grammar (Vercel/Stripe/Linear/PlanetScale), elite engineer portfolios (rauno.me/paco.me/antfu.me), canvas technique catalog (dot-grid fields, routed beams, flow fields). Key findings embedded in decisions above.

**Deployment (decided 2026-07-15):** user-root GitHub Pages — repo `p2401kumar.github.io`, served at `https://p2401kumar.github.io`, no `base` path. The old `/home` repo is retired after launch (redirect or archive — post-launch task).

## Constraints

- **Hosting**: GitHub Pages (static only, free) — no server-side code; canvas/JS must be self-contained
- **Tech stack**: Astro + vanilla TS/canvas for Fig. 01 — component model + content collections without shipping a framework runtime
- **Fonts**: self-hosted (no CDN dependency); subset for performance
- **Performance**: Fig. 01 must hold 60fps on average laptops (DPR cap 2, batched draws); Lighthouse ≥ 90 across the board
- **Honesty**: every number displayed must trace to the résumé — no invented telemetry

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Lead positioning: distributed systems + cloud, AI as intersection | Deepest real track record (DynamoDB, ELB, Azure); AI claim is demonstrated, not asserted | ✓ Good (v1.0) |
| Astro static build | Modern DX, zero-JS-by-default, first-class GitHub Pages deploy, content collections for case studies | ✓ Good (v1.0 — build ~1s, zero runtime JS beyond Fig. 01) |
| Editorial-restraint design + single signature figure | 4-agent research: top-tier engineers signal seniority through restraint; one motion metaphor per viewport | ✓ Good (v1.0) |
| Fig. 01 demonstrates auto-weight-away/cellularization | Animation proves the résumé claim instead of decorating it — the site's memorable differentiator | ✓ Good (v1.0 — shipped with a11y/perf floors) |
| No blog, no chatbot in v1 | Stale-blog risk; top-tier portfolios avoid chatbots; both revisitable in v2 | ✓ Good (v1.0 — revisit in v2 as /craft) |
| Dark-only tinted-graphite + copper system | Committed visual world reads more deliberate than a toggle; accent <5% per AI-infra research | ✓ Good (v1.0 — Lighthouse a11y ≥90) |
| Deploy to user root `p2401kumar.github.io` (new repo), retire old `/home` after launch | Cleanest résumé URL, zero base-path risk (top research-flagged pitfall); user decision 2026-07-15 | ✓ Good (v1.0 live; /home retirement still open) |
| v2.0 re-skin keeps all v1 substance (panels wrap v1 components unforked) | User decision: "Re-skin, keep substance" — beauty layered over verified content, not a rewrite | ✓ Good (v2.0 — 0 content forks, honesty gate intact) |
| Zero-dep procedural sky (spike-validated scatter+gradient, no noise lib, no NASA imagery) | Spike passed the banding bar first try; 0 bytes vs 400KB+ image; DPR-perfect; authored constellations need procedural stars | ✓ Good (v2.0 — Milky Way + moon + meteors, 0 new deps) |
| One rAF per engine, event-name-only coupling (`nightsky:panel-change`), scene pauses when hidden/fig01-active | One-active-animation doctrine scaled from v1; grep-enforced module boundary kept both engines independent | ✓ Good (v2.0 — idle 5.6% CPU @60fps; TBT 0–170ms) |
| Deploy gated on explicit user go despite autonomous mode (fix-2-edges-then-launch chosen) | Replacing the live professional site is outward-facing; user gated the v1 equivalent personally | ✓ Good (v2.0 — launched with both fixes verified live 11/11) |
| v3.0 real photo as static `<img>`, never canvas (LCP + no-JS floors decide architecture) | Canvas-drawn photo would break LCP discoverability AND the DECK-07 no-JS floor | ✓ Good (v3.0 — live LCP 1.5s mobile, photo present no-JS) |
| Spike-first for both v3 unknowns (banding; glass-CPU re-scope trigger) before any build | v2's Milky-Way-spike pattern; banding/CPU baked in late = costliest discoveries | ✓ Good (v3.0 — both passed; re-scope never fired; +0.47pp measured) |
| Contrast verifier re-architected to screenshot sampling BEFORE glass values locked | Analytic compositing cannot model a blur kernel; silent unverified floors unacceptable | ✓ Good (v3.0 — caught 2 pre-existing failures on first run) |
| Physically-honest parallax (ground moves, sky at infinity doesn't; canvas never CSS-transformed) | Real physics + dissolves margin-math/re-blur/contrast-geometry traps simultaneously | ✓ Good (v3.0 — parallax ships, zero canvas transforms) |
| v3 launch: "Launch now" chosen at the gate (20/21 green, no user-facing defects) | Same explicit-go doctrine; pack led with before/after heroes for a 60-second call | ✓ Good (v3.0 — live Lighthouse 100×8, 13/13 smoke) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-19 after v3.0 milestone completion (shipped + live-verified, Lighthouse 100×8)*
