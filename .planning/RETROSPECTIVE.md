# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Launch

**Shipped:** 2026-07-17
**Phases:** 3 | **Plans:** 16 | **Sessions:** 1 (single long orchestration session, ~3 days wall-clock)

### What Was Built
- A live senior-engineer portfolio at https://p2401kumar.github.io: editorial shell, all résumé content with per-metric `source` provenance, and downloadable résumé
- Fig. 01 — an interactive canvas demo of the candidate's real AWS cellularization/weigh-away work, with genuine reduced-motion, keyboard, and 60fps floors
- Two schema-enforced case studies, full SEO/OG/sitemap layer, Lighthouse ≥90 ×4 verified live

### What Worked
- **Design lock before planning**: iterating 5 prototype directions to explicit user approval, then freezing tokens/copy/behavior in CONTEXT.md, meant zero design churn during execution — every executor ported rather than invented
- **Session-derived CONTEXT.md** (express-path style) instead of re-running discuss-phase: the design conversation WAS the discussion; capturing it verbatim preserved fidelity at zero extra cost
- **Goal-backward phase verification caught a real gap** (404 page missing header/footer) that 12 passing plan-level checks had missed — the "every page" wording only got tested at phase level
- **Research agents verifying against live registries/docs** (not training data) caught the U+2192 font-subset gap, the create-astro flag removal, the deprecated zod import, and repo ground truth
- **Checker-prescribed fixes applied by the orchestrator** (UI-SPEC spacing rationale, verify-command assertions) resolved BLOCKED verdicts in minutes without full agent revision cycles

### What Was Inefficient
- Browser tooling (gstack browse daemon, built-in browser pane) failed to start mid-session, deferring visual QA a full phase before eventually working in Phase 3 — environment flakiness cost two retries and a deferred checklist
- One executor was killed by an API server error mid-bookkeeping; recovery worked (spot-check + orchestrator reconciliation) but cost a diagnosis round; another (phase researcher) stalled outright and needed a rerun with "write early, incrementally" instructions
- `grep -c` vs minified single-line HTML tripped three separate plans' verify commands before the `grep -o | wc -l` lesson propagated — a verify-methodology convention should exist from plan 1
- The milestone.complete CLI dumped all 16 raw one-liners (including one mis-extraction) as "accomplishments," requiring manual curation

### Patterns Established
- Honesty gate: every displayed number carries a `source` field tracing to the résumé; numeric allowlist greps enforce it in prose
- Zero hex literals outside `tokens.css`; canvas reads tokens via `getComputedStyle`
- "Every page" contract: all pages compose SiteHeader + SiteFooter explicitly (encode as dist-level acceptance criteria)
- Accessibility floors built with the feature, not after (rAF-free reduced-motion path, sr-only proxy buttons, aria-live)
- Fast-forward-only pushes; destructive repo actions gated behind decision checkpoints with backup-first options

### Key Lessons
1. Lock design with a working prototype and user approval BEFORE the GSD pipeline starts — the pipeline then executes instead of designing
2. Verify commands must assert, not print (`test "$(grep -o … | wc -l)" = N`); and remember minified HTML is one line
3. When a subagent dies mid-run, spot-check disk/git state before re-dispatching — most "failures" left complete, committed work
4. Phase-level goal-backward verification is worth its cost: it reads requirement *wording* ("on every page") that plan-level checks operationalize away
5. Corporate-proxy machines need pinned dependency workarounds documented in STATE decisions (vite override) so later plans don't "fix" them

### Cost Observations
- Model mix (agent count): planning/verification heavy — opus for 3 planner runs, sonnet for research/execution/verification (~20 runs), haiku for 5 checker runs
- Sessions: 1 orchestration session end-to-end
- Notable: adaptive model profile worked well — opus only where plan quality compounds; haiku checkers caught real blockers twice

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 3 | Established: design-lock-first, session-derived CONTEXT, honesty gate, verify-assert convention |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | build-gate + grep-battery (no unit runner by decision) | n/a | 1 (@astrojs/sitemap) |

### Top Lessons (Verified Across Milestones)

1. (Single milestone so far — candidates: design-lock-first; assert-don't-print verify commands)
