# Feature Research

**Domain:** Personal portfolio site for a senior distributed-systems/cloud/AI engineer (recruiter/hiring-manager audience)
**Researched:** 2026-07-15
**Confidence:** MEDIUM (cross-corroborated across 9 web queries, no single authoritative spec exists for this domain — portfolio "best practice" is a consensus of practitioner writing, not a standards body; WCAG/OG/performance sub-claims carry higher confidence than aesthetic/structural sub-claims)

## Feature Landscape

### Table Stakes (Users Expect These)

Features recruiters/hiring managers assume exist. Missing these reads as incomplete or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| One-line positioning statement above the fold | Recruiters decide in the first 6-8 seconds; a distinct, specific thesis keeps them, a generic one closes the tab | LOW | Already scoped as serif declarative thesis hero in PROJECT.md — matches research |
| 3-6 real projects/systems with role, stack, and outcome | Table-stakes proof of "what you built, why, what happened" — GitHub shows code, portfolio shows judgment | MEDIUM | PROJECT.md's "selected systems list" (4 entries) sits at the low end of this range — fine given depth-over-breadth positioning |
| Specific metrics per project, not adjectives | "Cut p95 latency 800ms→120ms" reliably beats "worked on backend performance" in every source reviewed | LOW | Directly satisfied by PROJECT.md's real-metric requirement (+30% reliability, −20% p99, 90% automation, etc.) |
| Experience/employment history with scope | Establishes career trajectory and seniority signal for hiring managers scanning for level-fit | LOW | Microsoft → AWS → MathWorks → Samsung section already scoped |
| Contact method (impossible to miss) | Table stakes — email, or equivalent, must be one click away, not buried | LOW | "pick one and make it impossible to miss" is a repeated finding |
| Downloadable résumé (PDF) alongside the live site | PDF serves ATS/applicant-tracking pipelines (static, parseable, 2-page); the site serves humans after resume clears the filter — they are complementary, not substitutes | LOW | PROJECT.md already has this; keep the PDF and site numbers in sync (single source of truth) |
| Links to LinkedIn/GitHub near contact info | Standard placement pattern; recruiters look for corroborating profiles | LOW | Already scoped as quiet text links in header |
| Fast load, no broken links | A 3-second load or a 404 is read as an anti-signal and recruiters simply move on — this is punished, not just under-rewarded | MEDIUM | Directly enforced by the project's Lighthouse ≥90 constraint; treat as a release gate, not an aspiration |
| Basic SEO/OG so the link previews well when shared | Recruiters/hiring managers pass portfolio links through Slack/LinkedIn/email — an ugly or missing preview card undercuts a first impression before the click | LOW | Already scoped; see Architecture note below for implementation specifics |
| Mobile-responsive, keyboard-accessible | A meaningful fraction of first-touch traffic is a recruiter on a phone forwarding a link, or a hiring manager tabbing through before a call; broken mobile/keyboard UX is punished like a broken link | MEDIUM | Already scoped; canvas figure needs an explicit non-mouse/non-hover fallback (see Fig. 01 dependency below) |

### Differentiators (Competitive Advantage)

Features that set a senior/staff-level candidate apart. Not required, but this is where the site earns "operates at our level."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Fig. 01 — live interactive systems demo | Demonstrated craft beats asserted craft; nothing in the researched corpus of senior-engineer portfolios shows a live, faithful re-enactment of the candidate's actual production system (most "interactive" portfolios are generic canvas art, not domain-accurate). This is the single biggest differentiator available and is already the design centerpiece | HIGH | Core to Core Value in PROJECT.md; must hold 60fps and degrade gracefully under `prefers-reduced-motion` (WCAG: decorative/ambient motion can trigger vestibular/migraine issues, so a static-diagram fallback is not optional polish, it's a compliance floor) |
| Case studies with explicit Problem → Approach → Impact structure | The "Approach" section (methodology, alternatives considered, trade-offs made) is what actually signals seniority — junior portfolios show outcomes, senior ones show judgment under trade-offs. Should be skimmable in ~30 seconds for the shape, then reward a deeper read | MEDIUM | Matches PROJECT.md's 1-2 case-study pages (DynamoDB cellularization, auto-weight-away); write each with a named "trade-offs considered" subsection — this is the differentiating ingredient, not just prose about impact |
| Patents & publications section | Extremely rare on engineer portfolios generally (not surfaced in any researched example) — for this candidate specifically it's a legitimate, factual seniority signal (Grade A1 patent, Android Lint paper) that most peer portfolios cannot show | LOW | Already scoped; keep it terse (mono, dated, one line each) to match editorial restraint rather than turning it into a second CV |
| Footer live clock + "all systems operational" status line | Small, cheap, reinforces the infrastructure-engineer identity and the site's own "systems" framing without adding a real feature surface; a wink that only a technical audience fully reads | LOW | Already scoped; treat as a signature detail, not a functional feature — must respect reduced-motion (freeze the clock text update cadence, no flashing) |
| Named metric in the systems list line (not just a description) | Repeated finding: a metric in the label itself out-converts a metric buried in a paragraph | LOW | Enforce this per PROJECT.md's "one-line description + real metric" format — treat the metric as a required field per system entry, not optional flavor |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this specific site and audience. This list validates and extends the project's existing Out of Scope section.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Skill bars / percentage ratings ("JavaScript 85%") | Feels like a quick way to visually communicate breadth | Reads as amateur theater to the exact senior-audience this site targets; a percentage on a skill is not a verifiable claim | Prose or grouped mono tags scoped by real project context (already the plan) |
| Tech-logo wall | Feels comprehensive, shows tool breadth | "Twenty framework icons say less than one system explained well" — logo walls are consistently named as a negative signal, not neutral | Name the specific technology inline within each system/case-study entry, where it's load-bearing to the story |
| AI chatbot / "AI twin" | On-trend, demonstrates "AI skills" directly | Explicitly flagged as high-risk: a chatbot giving one wrong answer about the candidate's own experience damages trust faster than a typo would — and for an infra/reliability engineer, an unreliable feature about reliability is a specific irony risk | Fig. 01's live systems demo already demonstrates AI-adjacent technical range without any correctness risk; keep chatbot as a possible later `/craft` experiment, clearly labeled as such, never load-bearing for credibility |
| Testimonials / recommendation quotes | Feels like social proof | Nothing in the research corpus flags testimonials as expected for this audience; hiring managers weight demonstrated systems and metrics far above quoted praise, and quotes read as unverifiable | Let the metrics and case-study depth carry the credibility burden instead |
| Blog / writing section | Feels like it rounds out a "thought leader" profile | Stale-blog risk is real and immediate — an abandoned blog dated 18 months ago actively undercuts the "operates at our level, today" thesis more than having no blog at all | Already correctly deferred to v2 in PROJECT.md; LinkedIn remains the active publishing channel |
| Analytics dashboards / visible traffic stats | Feels like it demonstrates data-mindedness | Not requested or expected by this audience; adds a surface that's about the site's own performance rather than the candidate's work, diluting focus | None needed for v1; use invisible, privacy-respecting analytics if desired for the owner's own insight, never surfaced to visitors |
| Light theme toggle | Seems like basic accessibility/preference courtesy | Already correctly rejected in PROJECT.md — a toggle doubles the design surface (contrast, copper-accent tuning, canvas palette) for a preference not evidenced as blocking for this audience; `prefers-reduced-motion` is the accessibility feature with actual compliance weight here, not `prefers-color-scheme` | Dark-only, but do keep text contrast ratios WCAG-compliant within the single theme |
| Overly deep / multi-level navigation | Feels organized for a "complete" site | Elite comparable portfolios (rauno.me-class) consistently favor a small number of dense sections over deep nav trees; confusing navigation costs a recruiter's limited evaluation time and is held against the candidate | Single-scroll editorial shell with a handful of named sections, exactly the locked design direction |
| Chasing every possible SEO/marketing tactic (schema.org person markup, blog-driven content SEO, backlink building) | Feels like "doing SEO properly" | This audience arrives via a shared link (LinkedIn, email, résumé), not organic search discovery — over-investing in search SEO is effort spent on the wrong acquisition channel | Basic on-page SEO + correct OG/Twitter Card tags only (see Table Stakes); optional minimal Person/Organization JSON-LD is low-cost enough to include but not worth further investment |

## Feature Dependencies

```
Fig. 01 (signature interactive figure)
    └──requires──> prefers-reduced-motion static-diagram fallback (WCAG floor, not optional)
    └──requires──> keyboard-operable controls (send request / inject fault) for zero-mouse access
    └──requires──> Performance budget (60fps, DPR cap, Lighthouse ≥90) enforced in CI

Case-study pages
    └──requires──> Selected systems list (case studies are the deep-dive of specific list entries)
    └──enhances──> Core Value ("operates at our level") — Approach/trade-offs section is where seniority reads

Downloadable résumé PDF
    └──requires──> Content parity with on-site metrics (single source of truth, résumé is authoritative)

SEO/OG meta
    └──requires──> A generated or authored og:image (1200x627) per key route (home, each case study)
    └──enhances──> Every other feature's "first click" — this is what recruiters see before they land

Patents & publications section ──enhances──> Experience section (dated, factual seniority signal)

Anti-feature: chatbot ──conflicts──> Core Value (restraint-as-differentiator thesis)
Anti-feature: skill bars ──conflicts──> Skills-as-prose requirement already locked in PROJECT.md
```

### Dependency Notes

- **Fig. 01 requires the reduced-motion fallback and keyboard operability before it can ship:** this is not a phase-2 nicety — WCAG 2.2 treats it as a floor, and the project's own accessibility constraint list already names both. Build the static/keyboard path alongside the animated path in the same phase, not after.
- **Case-study pages require the selected systems list to exist first:** the list is the index; the case studies are the two entries promoted to full depth. Sequence list-and-metrics before case-study prose in the roadmap.
- **SEO/OG enhances every acquisition path:** because this audience arrives via shared links rather than search, OG correctness has outsized leverage relative to its (low) implementation cost — it should not be deprioritized to a late "polish" phase.
- **Anti-feature conflicts are intentional guardrails:** chatbot and skill-bars are flagged as directly undermining the locked Core Value and design decisions, not merely low-value — a future contributor proposing either should be pointed at PROJECT.md's Key Decisions and this file.

## MVP Definition

### Launch With (v1)

Minimum viable product — matches PROJECT.md's Active requirements almost exactly; research did not surface any table-stakes feature missing from that list.

- [ ] Editorial shell (header, hero thesis, one-line bio, quiet links) — first-impression table stakes
- [ ] Fig. 01 signature interactive figure with reduced-motion + keyboard fallback — the differentiator, ships with its accessibility floor
- [ ] Selected systems list with real metrics per entry
- [ ] Experience section (Microsoft → AWS → MathWorks → Samsung)
- [ ] 1-2 case-study deep-dives (DynamoDB cellularization; auto-weight-away) with explicit trade-offs/approach content
- [ ] Patents & publications section
- [ ] Skills as prose/grouped mono tags
- [ ] Contact + downloadable PDF résumé
- [ ] Footer clock + status line
- [ ] SEO/OG meta (title, description, og:image per key route, favicon, sitemap)
- [ ] Responsive + accessible baseline (keyboard nav, reduced-motion, focus states)

### Add After Validation (v1.x)

- [ ] Additional case studies beyond the initial 2, if the first two demonstrably hold attention (add once real usage signal — e.g., time-on-page or recruiter feedback — justifies the writing effort)
- [ ] Minimal Person/Organization JSON-LD structured data (low cost, defer only because it's genuinely optional, not because it's risky)
- [ ] Expanded systems list entries beyond the initial 4, if new project work produces new real metrics

### Future Consideration (v2+)

- [ ] Blog/writing section — defer until there's a sustainable cadence commitment; a stale dated section is a worse signal than no section (already correctly deferred in PROJECT.md)
- [ ] `/craft` chatbot experiment — only as an explicitly labeled, non-load-bearing side experiment, never presented as authoritative about the candidate's own experience
- [ ] Light theme — defer indefinitely; no evidence surfaced that this audience needs it, and it dilutes the committed visual system

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Editorial shell + hero thesis | HIGH | LOW | P1 |
| Fig. 01 interactive figure | HIGH | HIGH | P1 |
| Selected systems list w/ metrics | HIGH | LOW | P1 |
| Experience section | HIGH | LOW | P1 |
| Case-study deep-dives (2) | HIGH | MEDIUM | P1 |
| Contact + résumé PDF | HIGH | LOW | P1 |
| SEO/OG meta | MEDIUM | LOW | P1 |
| Accessibility baseline (keyboard, reduced-motion, focus) | HIGH | MEDIUM | P1 |
| Patents & publications | MEDIUM | LOW | P1 |
| Footer clock/status line | LOW | LOW | P2 |
| Additional case studies (3rd+) | MEDIUM | MEDIUM | P2 |
| JSON-LD structured data | LOW | LOW | P3 |
| Blog section | LOW (stale-risk if half-committed) | HIGH (ongoing) | P3 / deferred |
| `/craft` chatbot experiment | LOW-MEDIUM (risk-adjusted) | MEDIUM | P3 / deferred |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Elite comparables (rauno.me / antfu.me / paco.me class) | Typical bootcamp/generic dev portfolio | Our Approach |
|---------|----------------------------------------------------------|------------------------------------------|--------------|
| Navigation depth | Single-scroll or dock-style, few dense sections, minimal chrome | Multi-page nav bar with many top-level items (About, Skills, Projects, Blog, Contact, Testimonials) | Single-scroll editorial shell, handful of named sections — matches elite pattern, already locked |
| Project presentation | Feed/list linking to dedicated, deep project pages | Grid of cards with tech-logo badges, live-demo/GitHub buttons, thin one-line descriptions | Systems list (index) + 2 promoted case-study deep-dives with problem/approach/impact — depth over breadth |
| Signature interaction | Often one strong personal motion/interaction signature (varies per site, but restraint is the pattern — one thing done well, not many) | Often generic scroll animations, parallax hero, particle backgrounds with no domain meaning | Fig. 01 — one signature figure, domain-accurate (mirrors real AWS work), matches the "one motion metaphor" pattern rather than decorative effects |
| Skills presentation | Prose or minimal tags, rarely bars | Percentage skill bars, radar charts, logo walls | Prose/grouped mono tags — matches elite pattern, explicitly avoids the generic anti-pattern |
| Resume/CV | Typically a simple, findable link, not always a prominent PDF button | Sometimes buried or absent entirely | Prominent PDF download alongside quiet contact links — matches best-practice finding of visible, labeled "Resume (PDF)" placement |

## Sources

- [Software Engineer Portfolio Website: 10 Best Examples](https://sitesplaced.com/blog/best-portfolio-website-for-software-engineers)
- [The Complete Software Engineer Portfolio Guide + 24 Examples](https://careerfoundry.com/en/blog/web-development/software-engineer-portfolio/)
- [Beautiful Portfolio Sites](https://dpnkr.in/beautiful-portfolio-sites)
- [Rauno Freiberg | Killer Portfolio](https://www.killerportfolio.com/by/rauno-freiberg)
- [How to Write an Engineering Case Study That Converts Prospects](https://jonjachura.com/2025/09/02/writing-engineering-case-study-that-converts/)
- [Guide to Portfolio Case Studies | InfluenceFlow](https://influenceflow.io/resources/guide-to-portfolio-case-studies-showcase-your-work-land-more-opportunities-in-2026/)
- [Optimize Your Portfolio for Search | AgentKit SEO](https://agentkit-seo.github.io/playbooks/web-portfolio/)
- [12 Essential Open Graph Meta Tags for Facebook and Twitter](https://neilpatel.com/blog/open-graph-meta-tags/)
- [Design accessible animation and movement with code examples](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)
- [WCAG 2.1.1 Keyboard Accessibility: Requirements, Testing & Implementation Guide](https://www.uxpin.com/studio/blog/wcag-211-keyboard-accessibility-explained/)
- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [How Recruiters and Hiring Managers Actually Look at Your Portfolio](https://blog.opendoorscareers.com/p/how-recruiters-and-hiring-managers-actually-look-at-your-portfolio)
- [Why Your Portfolio Isn't Getting You Developer Interviews and How to Fix It](https://pantheonuk.org/why-your-portfolio-isnt-getting-you-developer-interviews-and-how-to-fix-it/)
- [How to Add a Portfolio Link to Your Resume | UseResume](https://useresume.ai/blog/posts/how-to-add-a-portfolio-to-your-resume)
- [Link Your Portfolio in the Resume the right way – Tiiny Host Blog](https://tiiny.host/blog/link-portfolio-in-resume/)
- [Working With Web Performance Budgets | DebugBear](https://www.debugbear.com/blog/working-with-performance-budgets)
- [Optimizing Web Vitals using Lighthouse | web.dev](https://web.dev/articles/optimize-vitals-lighthouse)
- Prior project research corpus (referenced in PROJECT.md): 4-agent parallel research on AI-infra design language, devtools motion grammar, elite engineer portfolios (rauno.me/paco.me/antfu.me), canvas technique catalog

---
*Feature research for: Senior distributed-systems/cloud/AI engineer portfolio*
*Researched: 2026-07-15*
