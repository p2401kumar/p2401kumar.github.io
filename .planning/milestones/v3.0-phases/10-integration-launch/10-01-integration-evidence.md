# 10-01 Integration Evidence — deck mechanics, no-JS classic floor, case-study/SEO surface (FLR-02, FLR-03)

**Method:** same scratchpad CDP driver as `10-01-fig01-audit.md` (runtime sections) + greps
over `dist/` (static sections), against the composited local build. 2026-07-19. No push.

---

## (a) DECK MECHANICS — all runtime, all PASS

| Check | Result | Evidence |
|---|---|---|
| Cold `/` → hero active, pill `01 / 07` | **PASS** | B1 |
| **One gesture = one panel** — ArrowDown | **PASS** | B2: hero → fig-01 exactly, hash `#fig-01`, pill `02 / 07` |
| **One gesture = one panel** — wheel burst (3× deltaY 120 in one gesture window) | **PASS** | B3: fig-01 → systems exactly ONE advance; momentum tail suppressed by the 400ms transition lock |
| **One gesture = one panel** — jump-list tap | **PASS** | B4: → patents, hash `#patents`, `aria-current` follows to index 4 |
| Hash routing + back/forward | **PASS** | B5: `history.back()` → systems (hash + panel), `history.forward()` → patents |
| Cold deep-link `/#patents` — no flash of hero | **PASS** | B6: class-mutation timeline — `deck-active` added exactly once at `readyState "interactive"` with **patents already active** |
| **`/#work` alias → systems (v2 fix-forward CLOSED)** | **PASS** | B7: cold `/#work` → systems panel active, `location.hash` **preserved as `#work`**, pill `03 / 07`. Source: `deck.ts:98 HASH_ALIASES Map([['work','systems']])`, grep count 1 |
| view-classic escape → deck return | **PASS** | B8: classic-active (not deck-active), zero inert panels in classic; deck-view restores deck-active with systems re-applied |
| Cold `/#fig-01` scene pause seed (the OTHER v2 carried note, 06-02 Fix B) | **PASS** | fig01-audit A3: scene frozen cold with zero navigation events |

## (b) NO-JS CLASSIC FLOOR — from `dist/index.html` (static, all PASS)

| Check | Expected | Measured | Result |
|---|---|---|---|
| Resume/sky photo `<picture>` + `<img>` present as static markup | ≥ 1 | 1 (`<picture data-astro-cid-el3ewxpd>` — Astro scoped-style attribute; AVIF+WebP sources, 1920w/2560w) | **PASS** |
| Fig. 01 keyboard floor: `class="node-proxy"` buttons | exactly 10 | **10** | **PASS** |
| `id="fig01-log"` present | yes | present | **PASS** |
| Fig. 01 `role="img"` canvas chrome | yes | present | **PASS** |
| CC BY 4.0 credit line (footer is shared by deck + classic) | yes | present (`NOIRLab`/NSF/AURA/E. Slawik/M. Zamani + CC BY 4.0 links) | **PASS** |
| **Glass declares nothing without support**: every glass rule lives under `@supports (backdrop-filter…) or (-webkit-backdrop-filter…)` × `@media (prefers-reduced-transparency: no-preference)` in `deck.css`, never inline | yes | deck.css lines 198–199 gate the entire glass block; no-JS/no-@supports floor = the opaque scrim baseline | **PASS** |

Note (verify-grep adaptation, tooling-side): the plan's literal `grep '<picture>'` reads 0
because Astro emits the scoped-style attribute (`<picture data-astro-cid-…>`); the adapted
pattern `<picture[^>]*>` counts 1. Product markup is exactly as specified.

## (c) CASE-STUDY + SEO SURFACE — all PASS

| Check | Result | Evidence |
|---|---|---|
| `/work/dynamodb-cellularization/` cold-loads standalone | **PASS** | F1: no `#nightsky-canvas`, no `.deck`, no `deck-active`, h1 "dynamodb/cellularization", `/#work` back-crosslink present |
| `/work/elb-auto-weight-away/` cold-loads standalone, ZERO scripts | **PASS** | F3: no scene, no deck, h1 present, `script[src]` count **0** |
| Browser Back from case study → deck restored at `#systems` | **PASS** | F2: hash `#systems`, systems panel active, deck-active |
| Sitemap lists EXACTLY the 3 real routes | **PASS** | `dist/sitemap-0.xml`: `<loc>` count **3** — `/`, `/work/dynamodb-cellularization/`, `/work/elb-auto-weight-away/`; `/404` absent (0) |
| **Leak gate** — deck sentinel `nightsky:panel-change` in `dist/work/` | **0** | grep -o \| wc -l |
| Leak gate — sentinel in `dist/404.html` | **0** | grep |
| Leak gate — `/sky/milky-way` refs in `dist/work/` | **0** | grep |
| Leak gate — ANY case-insensitive `nightsky` ref in `dist/work/` | **0** | grep -i (stronger than the plan floor) |
| CC BY 4.0 credit renders in deck mode | **PASS** | visible in `10-01-fig01-coldload.png` footer ("Sky: NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0") |
| CC BY 4.0 credit renders in classic mode | **PASS** | E1 `credit: true` + `10-01-classic-mode.png` |

---

**Verdict: deck mechanics, the no-JS classic floor, and the case-study/SEO surface are all
green on the composited build. Both v2 fix-forward items (/#work alias; cold-/#fig-01 pause
seed) are CLOSED in v3 source and proven live.**
