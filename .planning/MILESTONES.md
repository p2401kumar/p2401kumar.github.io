# Milestones

## v1.0 Launch (Shipped: 2026-07-17)

**Phases completed:** 3 phases, 16 plans, 42 tasks
**Live:** https://p2401kumar.github.io (repo `p2401kumar/p2401kumar.github.io`, GitHub Actions → Pages)
**Timeline:** 2026-07-15 → 2026-07-17 (3 days, 86 commits, 136 files, ~3.2k LOC in src/)
**Closeout:** verified_closeout — all 3 phase verifications passed; 29/29 requirements complete

**Delivered:** A senior-engineer portfolio whose centerpiece is a live interactive demo of the candidate's own AWS work — replacing the 2021 site (preserved as branch `legacy-2021`).

**Key accomplishments:**

- **Editorial shell shipped to the user-root URL** — Astro 7 static build, mono header, serif thesis hero, live Seattle clock footer, all content sections (systems, experience, patents, skills, contact, résumé PDF), deployed via checkout@v7 → withastro/action@v6 → deploy-pages@v5.
- **Locked design system with an honesty gate** — single-source `tokens.css` (12 colors), self-hosted re-subset fonts (Source Serif 4 + Cascadia Code with the U+2192 arrow-glyph gap closed), fontaine metrics-matched fallbacks (no hero CLS), and a `source` annotation tracing every displayed metric to the résumé.
- **Fig. 01 in production** — the signature interactive cellularization figure: ambient request beams, `send request`, `inject fault` → weigh-away → 8s self-heal, hover facts; hardened with a genuinely rAF-free reduced-motion path, 10 sr-only keyboard proxy buttons + aria-live log, single consolidated rAF loop (DPR cap 2, intersection/visibility gated), zero hex literals outside tokens.css.
- **Two schema-enforced case studies** — `dynamodb/cellularization` and `elb/auto-weight-away` as a typed Content Layer collection (problem → trade-offs → impact), with a captured build-failure proof that malformed entries are rejected, linked from the systems list.
- **Launch polish verified live** — SEO head partial, hand-authored 1200×630 OG image (sharp-rasterized), 3-URL sitemap + robots.txt; Lighthouse on the live URL: home 99/94/100/100, both case studies ≥90 in all four categories, first attempt.
- **Full visual QA closed by automation** — hero CLS/font-flash, arrow glyphs, clock tick, 360px collapse, and all Fig. 01 interactions confirmed via browser automation with screenshot/DOM evidence.

**Known deferred (v2 backlog):** notes/blog (NOTE-01), /craft experiments (NOTE-02), third case study azure/health-snapshots (CASE-04), JSON-LD (PLAT-08). **Post-launch task:** retire/redirect the old `p2401kumar.github.io/home` repo.

---
