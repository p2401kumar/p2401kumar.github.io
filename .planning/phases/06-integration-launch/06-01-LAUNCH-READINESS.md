# v2.0 "Night Sky" — Launch Readiness (go/no-go pack)

**For:** the 06-02 deploy decision. Everything below was verified LOCALLY on 2026-07-18
against the assembled tree. **Nothing has been pushed or deployed** — the live site is still
v1 and stays v1 until you say go. The push IS the deploy (`deploy.yml` fires on push to main;
main is currently **~64 local commits ahead** of origin/main, including this plan's evidence commits).

---

## 1. What changes live

Saying "go" replaces your current live professional site. `p2401kumar.github.io` flips from
the v1 single-scroll editorial page to the v2 **night-sky panel deck**: the same seven content
sections (hero, Fig. 01, systems, experience, patents, skills, contact) now present as
full-viewport panels navigated by scroll/swipe/keyboard over a live starfield scene —
constellations that brighten per panel, the Milky Way, a crescent moon, fireflies, occasional
meteors, and the camper silhouette. Content is unchanged and unforked from v1 (same copy, same
résumé-traced numbers); the two case-study pages keep their v1 editorial rendering, scene-free.
A "view classic" escape hatch restores the scrolling layout, and the no-JS fallback is the v1
page. Rollback is a two-command git revert (section 4).

## 2. Aggregate gate table

Every gate below was re-verified this plan against the assembled build. Full detail:
`06-01-integration-evidence.md`, `06-01-fig01-audit.md`, `06-01-lighthouse-scores-local.md`.

| # | Gate | Result | Key numbers |
|---|---|---|---|
| 1 | INTG-01 — 7 panels wrap the v1 components unforked (no content forks) | **PASS** | 7/7 components, Panel.astro = thin slot wrapper |
| 2 | INTG-01 — transform-only hiding (no CSS box-suppression) | **PASS** | 0 `display:none` / 0 `visibility:hidden` / 0 `content-visibility` in deck.css |
| 3 | INTG-01 — legibility over the scene ≥4.5:1 vs --ink, both viewports | **PASS** | worst **7.89:1** @1440×900, **8.39:1** @1280×800; 0 failing regions ×7 panels |
| 4 | SKY-07 moon dimness non-regression | **PASS** | moonPeak 0.1949 < mwPeak 0.4496 / 0.4464 |
| 5 | INTG-02 — cold `/#fig-01` deep-link: no 0×0 canvas, panel active | **PASS** | 878×380 backing store at init; post-load activation (no pre-paint flash) |
| 6 | INTG-02 — full v1 Fig. 01 checklist re-pass embedded | **PASS** | 36/36 CDP checks: send, fault→weigh-away, ~8s self-heal, keyboard proxies, sr-only narration |
| 7 | INTG-02 — resize-while-inactive → activate re-measures | **PASS** | 878 → 1468×760 @ DSF 2 (DPR cap 2 exercised, no stale store) |
| 8 | INTG-02 — classic mode + reduced-motion keep Fig. 01 functional | **PASS** | classic: interactive in scroll layout; RM: static frame + fault narrates |
| 9 | INTG-02 — one-active-animation (scene paused while fig-01 active) | **PASS** | scene captures identical while fig-01 active; animate at hero |
| 10 | INTG-03 — both /work/* cold-load standalone, scene/deck-free | **PASS** | full v1 chrome, 0 JS chunks, no `.deck`/`#nightsky-canvas` |
| 11 | INTG-03 — browser Back restores the deck at #systems | **PASS** | pathname `/`, hash `#systems`, systems panel active |
| 12 | INTG-03 — sitemap lists exactly the real routes | **PASS** | 3 `<loc>` (home + 2 case studies), /404 absent |
| 13 | INTG-03 — leak gate: deck/scene JS unreachable from /work/* and /404 | **PASS** | sentinel 0 hits; those pages ship zero scripts |
| 14 | Battery — build + `astro check` | **PASS** | exit 0; 0 errors / 0 warnings / 0 hints |
| 15 | Battery — zero hex outside tokens.css (boundary-aware) | **PASS** | 0 across nightsky/fig01/shared/deck.css/NightSky/constellations |
| 16 | Battery — single-rAF invariants | **PASS** | fig01/render.ts 2 · scene.ts 2 · starfield 0 · meteors 0 |
| 17 | Battery — module boundary (scene never imports deck/fig01) | **PASS** | 0 cross-boundary imports |
| 18 | INTG-04 pre-flight — LOCAL Lighthouse ≥90 ×4, both presets | **PASS** | mobile **96/100/100/100**, desktop **100/100/100/100** |
| 19 | INTG-04 — **LIVE** Lighthouse ≥90 ×4, both presets | **DEFERRED → 06-02** | the ONE gate that cannot be pre-verified locally; runs against `https://p2401kumar.github.io/` after deploy |

## 3. Screenshot index (all committed in this phase dir)

| Screenshot | Caption |
|---|---|
| `06-01-scene-hero.png` | Hero over the full scene — thesis, constellations, Milky Way, moon, camper (01/07) |
| `06-01-scene-experience.png` | Experience panel — Microsoft cluster brightened, text legible over the scene (04/07) |
| `06-01-scene-moon-crop.png` | 180×180 crop of the waning crescent moon in the left margin |
| `06-01-scene-reduced-motion.png` | Reduced-motion static frame — moon + constellations present; no fireflies/twinkle/meteor |
| `06-01-fig01-coldload.png` | Cold `/#fig-01` deep-link — figure fully painted, panel active, deck chrome 02/07 |
| `06-01-fig01-degraded.png` | Fig. 01 post-fault — cell-3 amber/dashed, weigh-away narration, tooltip production fact |
| `06-01-fig01-resize-activate.png` | Fig. 01 after resize-while-inactive → activate at 800×700 — correctly re-measured |

## 4. Rollback plan (reference only — NOT executed; stated so the go decision is reversible)

If you ever want to undo the launch after deploying:

```bash
# Revert the deploy range (v1 remains fully in git history) and fast-forward push.
# <first-v2-commit> = the first of the ~64 v2 commits (ad8b683 "docs: start milestone v2.0 Night Sky").
git revert --no-edit <first-v2-commit>..HEAD
git push origin main            # fast-forward only — NEVER --force
```

Safety nets already in place on origin:
- **Tag `v1.0`** marks the exact shipped v1 state (`git checkout v1.0` to inspect it).
- **Branch `origin/legacy-2021`** preserves the pre-v1 site.
- The revert-and-push itself triggers `deploy.yml` and republishes the v1 output — same
  pipeline, no manual Pages surgery needed.

## 5. Real-device touch checklist (carried from Phase 4 checkpoint item 8 — yours to run on the LIVE site post-deploy, rollback available)

On a real iPhone (Safari) and a mid-tier Android (Chrome):

- [ ] Vertical swipe pages exactly ONE panel — no skip, no dead feel, no double-fire from the momentum tail
- [ ] Horizontal / edge swipe does NOT hijack navigation — iOS edge-back gesture stays intact
- [ ] Jump-index tap (the `01 / 07` index) jumps straight to the tapped panel
- [ ] Deep-link cold-load (e.g. `/#patents`) opens the right panel with no flash of hero
- [ ] "view classic →" escape hatch works (native scrolling returns; "deck view" restores)
- [ ] Fig. 01: `send request` / `inject fault` are tappable; the log narrates fault → weigh-away → ~8s recovery

## 6. Post-deploy idle-CPU confirmation (carried from Phase 5 / 05-06 SKY-03 deferral)

A 5-minute on-device check you can run against the live site: open the home page, leave it
idle on the hero panel, and watch the device stay cool / battery-quiet (the scene's idle
per-frame work is one Layer-0 blit + ~40 twinkles + 9 fireflies; 30 s local soak measured
6.9% CPU, 60 fps). Backgrounding the tab or switching to Fig. 01 must drop the scene loop
entirely (visibility + panel gates).

## Fix-forward list (known, recorded, NOT launch blockers)

| Item | Behavior | Why not a blocker | Suggested fix (post-launch) |
|---|---|---|---|
| `/#work` crosslink lands on hero | Case-study "back to work →" targets `/#work`; the deck manifest hash for that panel is `systems`, so deck mode falls back to panel 0 (hero) | Content never lost; Back button + jump list reach systems; anchor works natively in classic/no-JS modes; all INTG-03 gates pass | Add `work` as a hash alias in `resolveIndexFromHash`, or point the crosslink at `/#systems` |
| Cold `/#fig-01` leaves the scene animating behind the figure until the first navigation | The scene↔fig01 pause contract is event-driven (`nightsky:panel-change` fires only on `goTo()` navigation, not on init hash resolution) | Cold-deep-link-only edge; self-corrects on first navigation; no Lighthouse impact (`/` audits hero); the event contract itself verified working | Dispatch the panel-change event (or read the active panel's `data-panel-id`) once at `initDeck`/scene init |

---

## Verdict

**READY FOR THE 06-02 GO/NO-GO.** 18 of 19 gates green locally; the only open gate is live
Lighthouse, which structurally requires the deploy. Saying **go** = fast-forward push of the
~64 local commits → GitHub Actions Pages deploy → live Lighthouse both presets → post-deploy
smoke (home, `/#fig-01`, one case study, 404) → the real-device checklist above at your leisure.
Saying **no / not yet** costs nothing: everything stays local, the live site remains v1.
