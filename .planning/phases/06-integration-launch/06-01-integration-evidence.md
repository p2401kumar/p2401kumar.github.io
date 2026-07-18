# 06-01 Integration Evidence — INTG-01 (panels + legibility) + INTG-03 (routing + sitemap + leak)

**Method:** all checks run LOCALLY against the assembled tree (`npm run build`, exit 0, 4 pages)
and a local preview (`npx astro preview` → `http://localhost:4321/`). Scripted browser checks
use the repo's zero-dep CDP harness pattern (`scripts/verify-contrast.mjs`) plus a scratchpad
routing driver (headless Chrome, `--remote-debugging-port`, node 22 built-in WebSocket).
No push, no deploy, `.planning/config.json` untouched.
**Date:** 2026-07-18

---

## INTG-01 — panel provenance, transform-only hiding, legibility over the scene

### 1. Markup provenance: 7 panels wrap the ORIGINAL v1 components, unforked

`src/pages/index.astro` composes exactly **7 `<Panel>` wrappers** (grep `<Panel id=` = 7), each
wrapping the original v1 section component:

| Panel id | Wrapped v1 component | Import line | Usage |
|---|---|---|---|
| hero | `Hero` | `import Hero from "../components/Hero.astro"` | `<Panel id="hero" label="hero"><Hero /></Panel>` |
| fig-01 | `Figure01` | `import Figure01 from "../components/Figure01.astro"` | `<Panel id="fig-01" label="fig. 01"><Figure01 /></Panel>` |
| systems | `SystemsList` | `import SystemsList from "../components/SystemsList.astro"` | `<Panel id="systems" label="selected systems"><SystemsList /></Panel>` |
| experience | `ExperienceSection` | `import ExperienceSection from "../components/ExperienceSection.astro"` | `<Panel id="experience" label="experience"><ExperienceSection /></Panel>` |
| patents | `PatentsSection` | `import PatentsSection from "../components/PatentsSection.astro"` | `<Panel id="patents" label="patents & publications"><PatentsSection /></Panel>` |
| skills | `SkillsSection` | `import SkillsSection from "../components/SkillsSection.astro"` | `<Panel id="skills" label="skills"><SkillsSection /></Panel>` |
| contact | `ContactSection` | `import ContactSection from "../components/ContactSection.astro"` | `<Panel id="contact" label="contact" emitId={false}><ContactSection /></Panel>` |

Each component usage count in index.astro = exactly 1 (grep `<$c` per component = 1 for all 7).

`src/components/Panel.astro` is a **thin slot wrapper**: a single `<div class="panel" ...><slot /></div>`
with zero content of its own and zero layout styling (its docblock states "ships zero layout
styling of its own so the v1 no-JS page renders these as plain in-flow `<div>`s" — confirmed:
no `<style>` block exists in the file). The only components carrying "panel" in the name under
`src/components/` are `Panel.astro` and `PanelDeck.astro` — **no per-panel content fork files exist**;
no duplicated section/content file was found.

### 2. Transform-only hiding — zero CSS box-suppression

`src/styles/deck.css` hides inactive panels ONLY via transform + opacity + pointer-events
(section 3, lines 62–72):

```css
html.deck-active .panel[data-state="active"]   { transform: translateY(0);    opacity: 1; pointer-events: auto; }
html.deck-active .panel[data-state="inactive"] { transform: translateY(24px); opacity: 0; pointer-events: none; }
```

| Negative grep over deck.css | Count | Verdict |
|---|---|---|
| `display:\s*none` (case-insensitive) | **0** | PASS |
| `visibility:\s*hidden` (case-insensitive) | **0** | PASS |
| `content-visibility` | **0** | PASS |
| `transform:\s*translateY` (the sanctioned mechanism) | **2** | PASS (≥2 required) |

**Why this matters for Fig. 01:** inactive panels keep their full layout box
(`position: absolute; inset: 0` — never removed from flow), so `.fig-stage` inside the
inactive fig-01 panel always has a nonzero `getBoundingClientRect().width` and the canvas
keeps its CSS height — this is the mechanism that makes `render.ts layout()` compute a
nonzero backing store even while the panel is hidden (verified live in `06-01-fig01-audit.md`).

### 3. Legibility over the scene — SKY-05 contrast non-regression (`--cdp`, both viewports)

`node scripts/verify-contrast.mjs --selftest` → **SELFTEST PASS** (exit 0; all WCAG 2.2 SC 1.4.3
fixtures green, `--ink` over `--bg` = 15.70:1, deck.css scrim-stop sync check green, scrim peak
0.38 ≤ 0.38 ceiling, moon comparator fixture green).

`--cdp` full 7-panel worst-case canvas-readback battery (12 samples/panel, per-pixel scrim +
DOM-layer compositing):

| Viewport | Global worst vs `--ink` | Failing regions (all 7 panels) | 05.1 baseline | Verdict |
|---|---|---|---|---|
| 1440×900 | **7.89:1** (experience panel) | **0** | 9.27:1 | PASS (≥4.5 floor; drift is twinkle/beam sampling noise) |
| 1280×800 | **8.39:1** (experience panel) | **0** | 8.07:1 | PASS (above baseline this run) |

Per-panel worst vs `--ink` (1440×900 / 1280×800): hero 10.17 / 10.03 · fig-01 n/a (0 over-sky
text regions — the figure is an opaque `--panel` card) · systems 10.03 / 8.59 · experience
7.89 / 8.39 · patents 10.19 / 10.82 · skills 10.46 / 10.29 · contact 10.84 / 10.29.
Every panel's `failing` array is empty at both viewports. Raw JSON reports: scratchpad
`contrast-1440.json` / `contrast-1280.json` (regenerate with the commands above).

### 4. Moon dimness — SKY-07 non-regression (`--moon`, both viewports)

| Viewport | moonPeak | mwPeak | Assertion | Verdict |
|---|---|---|---|---|
| 1440×900 | 0.1949 | 0.4496 | moonPeak < mwPeak strictly | **PASS** (exit 0) |
| 1280×800 | 0.1949 | 0.4464 | moonPeak < mwPeak strictly | **PASS** (exit 0) |

(05.1 baseline: 0.1952 < 0.6283 / 0.5181 — moonPeak effectively unchanged; mwPeak varies with
the Milky-Way core box's random scatter per generation, comparison remains strict-pass.)

---

## INTG-03 — case studies, routing, sitemap, leak gate, 404

### 1. Cold-load routing (scripted headless Chrome, fresh navigation per route)

Both case-study routes render standalone with full v1 chrome and mount neither the deck nor
the scene:

| Check | /work/dynamodb-cellularization | /work/elb-auto-weight-away |
|---|---|---|
| `article h1` (systemId) renders | PASS — "dynamodb/cellularization" | PASS — "elb/auto-weight-away" |
| `.standfirst` renders non-empty | PASS | PASS |
| `.metrics .metric` count | PASS — 2 | PASS — 2 |
| back-to-work crosslink `a[href="/#work"]` | PASS — "back to work →" | PASS — "back to work →" |
| `<html>` NOT `.deck-active` | PASS | PASS |
| `<html>` NOT `.classic-active` | PASS | PASS |
| no `.deck` element in DOM | PASS | PASS |
| no `#nightsky-canvas` in DOM | PASS | PASS |
| external JS chunks referenced (`script[src]`) | PASS — **0** | PASS — **0** |

### 2. Browser Back restores the deck at #systems (the INTG-03 gate)

Scripted sequence: cold-load `/` → wait `html[data-deck-ready="true"]` → dispatch deck
ArrowDown keydowns until `[data-panel-id="systems"][data-state="active"]` (hero → fig-01 →
systems; `location.hash` = `#systems` via `goTo`'s pushState) → real navigation to
`/work/dynamodb-cellularization` (article h1 confirmed) → `history.back()`:

| Assertion after history.back() | Result |
|---|---|
| `location.pathname === '/'` | PASS |
| `location.hash === '#systems'` | PASS |
| `<html>.deck-active` re-applied | PASS |
| `[data-panel-id="systems"]` has `data-state="active"` (active panel = systems) | PASS |

### 3. Routing-sanity OBSERVATION — the `/#work` crosslink (fix-forward, NOT a launch blocker)

The case-study "back to work →" crosslink targets **`/#work`**. `#work` is the `id` on
`SystemsList.astro`'s `<section class="work" id="work">` **inside** the systems panel, but the
deck manifest hash for that panel is **`systems`** — so `deck.ts resolveIndexFromHash("#work")`
finds no manifest match and falls back to **index 0 (hero)** in deck mode. Confirmed live:
cold-loading `/#work` activates the **hero** panel, not systems.

- Impact: a visitor clicking "back to work →" from a case study lands on the deck's hero
  panel instead of the systems panel. Content is never lost; one ArrowDown×2 or a jump-list
  tap reaches systems. In classic mode and no-JS mode the anchor works natively as intended.
- Verdict: **fix-forward UX item** recorded for the go/no-go pack (06-01-LAUNCH-READINESS.md).
  Cold-loadable URLs, browser Back, and the sitemap — the INTG-03 gates — all pass. Not fixed
  in this plan per plan scope.

### 4. Sitemap — exactly the 3 real routes

`dist/sitemap-index.xml` and `dist/sitemap-0.xml` both exist after build. `dist/sitemap-0.xml`
contains exactly **3 `<loc>` entries** and nothing else:

```
https://p2401kumar.github.io/
https://p2401kumar.github.io/work/dynamodb-cellularization/
https://p2401kumar.github.io/work/elb-auto-weight-away/
```

`/404` is absent (grep `/404/?</loc>` = 0 — `astro.config.mjs` sitemap `filter` excludes it).

### 5. Leak gate — deck/scene JS unreachable from /work/* and /404

| Check | Count | Verdict |
|---|---|---|
| `nightsky:panel-change` sentinel in `dist/work/**` (HTML + any referenced chunk) | **0** | PASS |
| `nightsky:panel-change` sentinel in `dist/404.html` | **0** | PASS |
| Sentinel present in home `/_astro/*.js` chunks | 2 chunks (`NightSky.astro_…js`, `PanelDeck.astro_…js`) | PASS (reachable from home only) |
| `/_astro/*.js` references in `dist/work/*/index.html` | **0** (the case-study pages ship zero JS) | PASS |
| `/_astro/*.js` references in `dist/404.html` | **0** | PASS |
| `nightsky-canvas` string in `dist/work/**` / `dist/404.html` | **0** / **0** | PASS |

### 6. 404 sanity

`dist/404.html` builds and renders the site chrome (BaseLayout + SiteHeader + SiteFooter)
with no deck markup, no scene canvas, and no JS chunk references — same scene-free rendering
contract as /work/* (05-06 shipped architecture, re-verified here).

---

**Result: INTG-01 PASS · INTG-03 PASS** (one recorded fix-forward observation: `/#work` → hero
fallback). Scripted-browser evidence: scratchpad `routing-audit.mjs` / `routing-audit.out`,
`contrast-1440.json`, `contrast-1280.json`.
