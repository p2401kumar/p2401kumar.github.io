# Phase 1: Foundation & Editorial Shell - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning
**Source:** Session design lock (interactive design exploration + 4-agent research, 2026-07-15 — decisions captured verbatim from user-approved prototype)

<domain>
## Phase Boundary

Deployed, content-complete static site at `https://p2401kumar.github.io`: Astro 7 scaffold, design tokens, self-hosted fonts, editorial shell (header / serif-thesis hero / footer with live Seattle clock), and every text content section (selected systems, experience, patents & publications, skills, contact, résumé download) — live via GitHub Actions.

NOT in this phase: Fig. 01 canvas (Phase 2 inserts it between hero and systems list), case-study pages and links to them (Phase 3), OG image/sitemap/Lighthouse gates (Phase 3, though basic `<title>`/description ship now).

</domain>

<decisions>
## Implementation Decisions

### Design system (LOCKED — user approved the live prototype after rejecting 5 alternatives)
- Tokens (single source `src/styles/tokens.css`, canvas later reads via `getComputedStyle`):
  `--bg:#0f1216` `--panel:#12161c` `--panel2:#141a22` `--ink:#e8ebef` `--body:#aab2bd` `--dim:#78818d` `--faint:#565f6b` `--hair:#1e242d` `--hair2:#28303b` `--accent:#d99163` (copper, <5% of surface) `--good:#57b98a` `--amber:#d9a441`
- Dark-only. No theme toggle.
- Type roles: serif display (hero thesis + headings), sans body, mono for header/nav/labels/metrics/footer. Mono is the "infrastructure texture."
- Motion doctrine: one moving thing per viewport; hover responses ≤150ms; ease-out entries; `prefers-reduced-motion` respected everywhere. Phase 1 shell is essentially static (the only "live" element is the footer clock).

### Typography
- Display serif: Claude's discretion among open-license transitional/old-style serifs with Iowan/Palatino character (e.g. Source Serif 4, Charter/Charis, Literata) — MUST be self-hostable woff2, subset to used glyphs, `font-display: swap` with metrics-matched fallback (`size-adjust`/`ascent-override`) so the hero thesis has no visible CLS (PLAT-04)
- Fallback stacks (from prototype): serif `"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif`; sans `"Helvetica Neue","Segoe UI",Arial,system-ui,sans-serif`; mono `ui-monospace,"Cascadia Code","SF Mono",Consolas,monospace`
- Body ~15px/1.6; hero thesis clamp(30px→44px) serif weight 500; mono labels 11–13px

### Copy (LOCKED verbatim from approved prototype)
- Header: `prateek kumar` · `seattle` | nav: `work` · `résumé` · `contact`
- Eyebrow: `distributed systems · cloud · applied ai` (accent on "applied ai")
- Hero thesis: **"I build the infrastructure that intelligence runs on."**
- Bio line: "SDE 2 at Microsoft, on Azure's data platform. Previously cellularized DynamoDB's US-EAST-1 region at AWS and built the SmartThings notifications platform at Samsung. Two patents. M.S. CS, USC."
- Hero links: `résumé →` `linkedin →` `github →`
- Footer: green status dot + `all systems operational` | `seattle {live HH:mm}` (24h, America/Los_Angeles, updates ≤30s interval)
- Copy tone everywhere: no adjectives about self, credibility via named artifacts and numbers. Never "passionate."

### Page structure (home, single scroll)
1. Header (mono)
2. Hero (eyebrow → serif thesis → bio → links)
3. [Fig. 01 slot — Phase 2; Phase 1 renders nothing here]
4. `selected systems` list — 4 rows: `2025 azure/health-snapshots` (info-theory), `2023 dynamodb/cellularization` (+30% rel · −20% p99), `2023 elb/auto-weight-away` (90% ops automated), `2019 iot/contextual-widget` (patented). Row = year | mono name + sans one-liner | accent metric. Hover: subtle panel bg. NO links to case studies yet (Phase 3 adds).
5. `experience` — Microsoft SDE 2 (2024–now, Azure data platform: durable idempotent pipelines, info-theory health snapshots, auto-healing container apps), AWS SWE (2023–24, DynamoDB cellularization + SDK Java v1/v2, ELB auto-weight-away −10% peak latency), MathWorks intern (2022, Web-MATLAB low-bandwidth, JS test suite −3min), Samsung Sr. SWE (2017–20, SmartThings notifications platform, APK 150→90MB, contextual widget on Galaxy S21, multi-client RTSP)
6. `patents & publications` — Patent: IoT room identification via device-type watermarks, Grade A1, 2020. Patent: automated position & latch locking control via mobile, IN 201631007292, 2016. Paper: Android Lint tool optimization (~30% faster dead-code/unused-resource detection)
7. `skills` — grouped mono tags with prose intro: Languages (Java, C#, Kotlin, Go, Python, JavaScript/TypeScript) · Cloud & Distributed (AWS DynamoDB/EC2/ECS/EKS, Azure, Kubernetes, Docker, load balancing, auto-scaling) · Data (DynamoDB, PostgreSQL, MySQL, Redis) · Mobile (Android SDK, Jetpack, Kotlin, JNI)
8. `contact` — mailto p2401kumar@gmail.com + LinkedIn; keep phone number OFF the site (PDF only)
9. Footer

### Content data & honesty gate (CONT-07)
- All list/experience/patents data lives in typed TS data modules (`src/data/*.ts`), each entry carrying a `source` field (e.g. `resume-4.5 §AWS`) — NOT content collections (those are Phase 3 for case studies)
- Every metric must appear in the résumé; no invented numbers
- External links: LinkedIn `https://www.linkedin.com/in/prateek-kumar-7b11321b3`, GitHub `https://github.com/p2401kumar`
- Résumé PDF: copy `C:\Users\prateekkumar\Downloads\Prateek_Kumar_resume_4_5.pdf` into `public/` as `prateek-kumar-resume.pdf`

### Stack & structure (from research, confirmed)
- Astro `^7` (verify exact version via `npm view astro version` at scaffold), Node ≥22.12, TypeScript strict, `output: 'static'` (default)
- NO Tailwind, NO UI framework/islands, plain CSS custom properties; scoped component styles allowed but tokens come only from tokens.css
- `astro.config.mjs`: `site: 'https://p2401kumar.github.io'`, NO `base` (user-root deploy — decision locked 2026-07-15)
- Structure per ARCHITECTURE.md: `src/layouts/BaseLayout.astro`, `src/components/` (Header, Hero, SystemsList, Experience, Patents, Skills, Contact, Footer), `src/data/`, `src/styles/tokens.css` + `global.css`, `src/pages/index.astro`
- Deploy: `.github/workflows/deploy.yml` with `actions/checkout` → `withastro/action` → `actions/deploy-pages` (versions per STACK.md); Pages source = GitHub Actions
- GitHub repo: create `p2401kumar/p2401kumar.github.io` and push (gh CLI; if gh is unauthenticated, pause with exact manual commands for the user). Old `/home` repo untouched this phase (retirement is post-launch)

### Claude's Discretion
- Exact serif face choice (within constraints above), subsetting tooling (pyftsubset vs fontsource files), spacing scale, responsive breakpoint details, footer clock implementation details, Prettier/Biome choice, exact pinned versions

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design contract & prototype
- `.planning/reference/prototype-shell-and-fig01.html` — the user-approved prototype: exact tokens, layout, copy, spacing idiom. Phase 1 ports the SHELL portions (everything except the `<canvas>` figure). Do not regress its look.
- `.planning/PROJECT.md` — design doctrine, honesty constraint, key decisions

### Research
- `.planning/research/STACK.md` — Astro 7 config, deploy workflow YAML, font strategy
- `.planning/research/ARCHITECTURE.md` — component boundaries, structure, anti-patterns (token drift!)
- `.planning/research/PITFALLS.md` — base-path, font CLS, canvas perf phase mapping
- `.planning/research/SUMMARY.md` — synthesis

### Content sources
- `C:\Users\prateekkumar\Downloads\Prateek_Kumar_resume_4_5.pdf` — the single source of truth for all metrics/dates (extracted text already embedded in the decisions above)

</canonical_refs>

<specifics>
## Specific Ideas

- Header/nav/footer/labels are lowercase mono — this styling IS the brand; don't "fix" the casing
- Systems-list rows use a 64px year column | content | right-aligned accent metric (collapses on mobile: metric hidden or wrapped)
- Section headings: mono 12px uppercase letterspaced dim (like `selected systems`), not big display headings
- Hero measures: thesis max ~21ch, bio max ~58ch
- Focus states: visible outline on all links/buttons (keyboard a11y from day one)

</specifics>

<deferred>
## Deferred Ideas

- Fig. 01 canvas module + `send request`/`inject fault` interactions → Phase 2
- Case-study pages, content collection, links from systems list → Phase 3
- OG image, sitemap, full meta, Lighthouse ≥90 verification gate → Phase 3
- Notes/blog, /craft experiments (AI-twin) → v2 backlog
- Old `/home` repo retirement/redirect → post-launch task

</deferred>

---

*Phase: 01-foundation-editorial-shell*
*Context gathered: 2026-07-15 via session design lock*
