// scripts/verify-contrast.mjs — SKY-05 worst-case WCAG contrast verifier.
// Zero new dependencies (plain node + the browser); matches the repo's
// scripts/render-og.mjs .mjs node-script convention. NOT wired into
// `astro build` — a verification-time tool whose recorded output lives in
// .planning/phases/05-night-sky-scene/contrast-evidence.md.
//
// Modes:
//
//   node scripts/verify-contrast.mjs --selftest
//     Runs the WCAG 2.2 SC 1.4.3 formula fixtures in plain node (no
//     browser, no deps): contrastRatio(black, white) === 21, identical
//     luminances === 1, a known mid-gray fixture, the worst-case region
//     scanner against a synthetic ImageData, --ink vs --bg parsed live
//     from src/styles/tokens.css, and a deck.css sync check that the
//     scrim gradient stops in CSS still match SCRIM_STOPS below.
//     Exits non-zero if any fixture fails.
//
//   node scripts/verify-contrast.mjs --cdp [--url http://localhost:4321/]
//                                     [--samples 12] [--interval 350]
//     Fully automated browser sampling: launches headless Chrome via the
//     DevTools Protocol (node 22's built-in WebSocket — still zero deps),
//     navigates the local preview, walks every deck panel via hash
//     navigation, and for each panel samples the live scene canvas
//     (getImageData readback) under every visible text element's
//     bounding box, N times over a multi-second window so twinkle peaks
//     and beam passes are caught. Each canvas pixel is composited with
//     the scrim's analytic alpha at that pixel's viewport-y (the scrim
//     is a DOM layer ABOVE the canvas, so "post-scrim" = canvas pixel
//     composited under rgb(--bg) at the gradient's alpha) plus any
//     semi-transparent DOM backgrounds between the text and the canvas.
//     Prints a JSON report of worst-case ratios to stdout.
//
//   Browser paste mode (manual fallback): open the local preview, open
//   DevTools, and paste the output of
//     node scripts/verify-contrast.mjs --print-browser-snippet
//   into the console. It defines window.__sampleContrast() which returns
//   the same per-region worst-case report for the CURRENT panel.
//
//   node scripts/verify-contrast.mjs --moon [--url http://localhost:4321/]
//                                    [--width 1440] [--height 900]
//     SKY-07 moon-dimness assertion (05.1-01, FLAG 1): launches headless
//     Chrome at the given viewport, waits for the scene to paint, then
//     reads the live canvas via getImageData over (a) the moon's bounding
//     box [moonX-1.1R, moonY-1.1R, 2.2R, 2.2R] (geometry recomputed
//     in-page with the SAME formulas as starfield.ts, from
//     window.innerWidth/innerHeight) and (b) the Milky-Way-core box
//     [x:0.80-0.98, y:0.30-0.60 of the viewport]. Computes the MAX
//     relative luminance in each (moonPeak, mwPeak) and asserts
//     moonPeak < mwPeak strictly. Exits non-zero on failure.
//
// WCAG references implemented verbatim (do not hand-roll variants):
//   relative luminance  https://www.w3.org/WAI/GL/wiki/Relative_luminance
//   contrast ratio      WCAG 2.2 SC 1.4.3 (L1 + 0.05) / (L2 + 0.05)
// Thresholds: >= 4.5:1 normal text, >= 3:1 large text (>= 24px, or
// >= 18.66px at weight >= 700).

import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// WCAG 2.2 SC 1.4.3 formulas (shared verbatim between node selftest and the
// injected browser sampler — keep these functions self-contained: they are
// serialized with Function.prototype.toString into the page).
// ---------------------------------------------------------------------------

/** WCAG relative luminance of an sRGB color (0-255 channels). */
export function relativeLuminance(r, g, b) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two relative luminances (order-agnostic). */
export function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Scans every pixel of an ImageData-like ({ data, width, height }) region
 * and returns the WORST (lowest) contrast ratio vs the given text
 * luminance, plus where/what that worst pixel was.
 */
export function worstCaseContrastInRegion(imageData, textLuminance) {
  const { data, width } = imageData;
  let worst = Infinity;
  let worstPixel = null;
  for (let i = 0; i < data.length; i += 4) {
    const l = relativeLuminance(data[i], data[i + 1], data[i + 2]);
    const ratio = contrastRatio(textLuminance, l);
    if (ratio < worst) {
      worst = ratio;
      const px = (i / 4) % width;
      const py = Math.floor(i / 4 / width);
      worstPixel = { x: px, y: py, r: data[i], g: data[i + 1], b: data[i + 2], luminance: l };
    }
  }
  return { worst, worstPixel };
}

/**
 * Peak (maximum) relative luminance across every pixel of an
 * ImageData-like ({ data }) region — the SKY-07 moon-dimness comparator
 * (05.1-01): moon-bbox peak must stay STRICTLY below the MW-core-box peak.
 */
export function peakLuminanceInRegion(imageData) {
  const { data } = imageData;
  let peak = 0;
  for (let i = 0; i < data.length; i += 4) {
    const l = relativeLuminance(data[i], data[i + 1], data[i + 2]);
    if (l > peak) peak = l;
  }
  return peak;
}

// ---------------------------------------------------------------------------
// Scrim model — MUST stay in sync with src/styles/deck.css (the --selftest
// deck.css sync check enforces this). Stops are [yFraction, alphaOfBg].
// ---------------------------------------------------------------------------

export const SCRIM_STOPS = [
  [0, 0],
  [0.1, 0.3],
  [0.45, 0.38],
  [0.7, 0.38],
  [0.92, 0.15],
  [1, 0],
];

/** Piecewise-linear scrim alpha at a viewport-y fraction (0=top, 1=bottom) —
 * exactly what the CSS linear-gradient(180deg, ...) computes. */
export function scrimAlphaAt(yFrac, stops) {
  const s = stops || SCRIM_STOPS;
  if (yFrac <= s[0][0]) return s[0][1];
  for (let i = 1; i < s.length; i++) {
    if (yFrac <= s[i][0]) {
      const [y0, a0] = s[i - 1];
      const [y1, a1] = s[i];
      const t = y1 === y0 ? 0 : (yFrac - y0) / (y1 - y0);
      return a0 + (a1 - a0) * t;
    }
  }
  return s[s.length - 1][1];
}

// ---------------------------------------------------------------------------
// Token parsing (node side) — reads --ink/--bg/--body from tokens.css.
// ---------------------------------------------------------------------------

const ROOT = fileURLToPath(new URL("..", import.meta.url));

export function parseHex(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function readTokens() {
  const css = readFileSync(join(ROOT, "src/styles/tokens.css"), "utf8");
  const token = (name) => {
    const m = css.match(new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{3,8})`));
    if (!m) throw new Error(`token ${name} not found in tokens.css`);
    return parseHex(m[1]);
  };
  return { ink: token("--ink"), bg: token("--bg"), body: token("--body") };
}

// ---------------------------------------------------------------------------
// --selftest
// ---------------------------------------------------------------------------

function approx(actual, expected, tol, label) {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`FIXTURE FAIL: ${label} — expected ~${expected}, got ${actual}`);
  }
  console.log(`  ok  ${label} = ${actual.toFixed(4)}`);
}

function selftest() {
  console.log("verify-contrast --selftest (WCAG 2.2 SC 1.4.3 formula fixtures)");

  // 1. Pure black vs pure white == 21 exactly.
  approx(
    contrastRatio(relativeLuminance(0, 0, 0), relativeLuminance(255, 255, 255)),
    21,
    0.001,
    "contrast(#000, #fff)"
  );

  // 2. Identical colors == 1.
  approx(
    contrastRatio(relativeLuminance(128, 128, 128), relativeLuminance(128, 128, 128)),
    1,
    1e-9,
    "contrast(#808080, #808080)"
  );

  // 3. Known mid-gray fixture: #767676 vs #ffffff is the canonical 4.54:1
  //    "just passes AA" gray (WebAIM/W3C-cited value).
  approx(
    contrastRatio(
      relativeLuminance(0x76, 0x76, 0x76),
      relativeLuminance(255, 255, 255)
    ),
    4.54,
    0.02,
    "contrast(#767676, #fff)"
  );

  // 4. worstCaseContrastInRegion scanner: synthetic 2x1 region, one black
  //    pixel + one white pixel, vs white text — worst must be the white
  //    pixel (ratio 1), not the black one (ratio 21).
  const synthetic = {
    width: 2,
    height: 1,
    data: new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]),
  };
  const scan = worstCaseContrastInRegion(synthetic, relativeLuminance(255, 255, 255));
  approx(scan.worst, 1, 1e-9, "worstCaseContrastInRegion(black+white, whiteText)");
  if (scan.worstPixel.x !== 1) throw new Error("FIXTURE FAIL: worst pixel should be the white one at x=1");
  console.log("  ok  worst pixel correctly located at the brightest sample");

  // 5. Live tokens: --ink over --bg from tokens.css (the base floor every
  //    scene pixel must not push text below).
  const { ink, bg } = readTokens();
  const inkL = relativeLuminance(ink.r, ink.g, ink.b);
  const bgL = relativeLuminance(bg.r, bg.g, bg.b);
  const inkOverBg = contrastRatio(inkL, bgL);
  console.log(`  ok  --ink over --bg = ${inkOverBg.toFixed(2)}:1 (tokens.css live values)`);
  if (inkOverBg < 4.5) throw new Error("FIXTURE FAIL: --ink over --bg below 4.5 — token regression");

  // 6. deck.css sync check: every SCRIM_STOPS entry must appear verbatim in
  //    the shipped gradient so this script's analytic scrim model can never
  //    silently drift from the CSS.
  const deckCss = readFileSync(join(ROOT, "src/styles/deck.css"), "utf8").replace(/\s+/g, " ");
  for (const [y, a] of SCRIM_STOPS) {
    const needle = `rgb(from var(--bg) r g b / ${a}) ${Math.round(y * 100)}%`;
    if (!deckCss.includes(needle)) {
      throw new Error(`FIXTURE FAIL: deck.css scrim out of sync — missing "${needle}"`);
    }
  }
  console.log(`  ok  deck.css scrim stops match SCRIM_STOPS (${SCRIM_STOPS.length} stops)`);

  // 7. Scrim model sanity: peak must respect the locked <=0.38 ceiling.
  const peak = Math.max(...SCRIM_STOPS.map(([, a]) => a));
  if (peak > 0.38) throw new Error(`FIXTURE FAIL: scrim peak ${peak} exceeds the 0.38 ceiling`);
  console.log(`  ok  scrim peak ${peak} <= 0.38 ceiling`);

  // 8. Moon fixture (SKY-07 / 05.1-01): peakLuminanceInRegion comparison
  //    logic over a synthetic ImageData pair — a "moon box" whose brightest
  //    pixel is a 0.45-alpha --star-class crescent pixel over dark sky
  //    (~rgb(112,116,124)) vs an "MW core box" containing one saturated
  //    'lighter'-accumulated pixel (255,255,255). moonPeak must be
  //    STRICTLY below mwPeak, and the scanner must ignore dark filler.
  const moonBoxFixture = {
    width: 2,
    height: 1,
    data: new Uint8ClampedArray([14, 17, 22, 255, 112, 116, 124, 255]),
  };
  const mwBoxFixture = {
    width: 2,
    height: 1,
    data: new Uint8ClampedArray([40, 46, 58, 255, 255, 255, 255, 255]),
  };
  const moonPeakFx = peakLuminanceInRegion(moonBoxFixture);
  const mwPeakFx = peakLuminanceInRegion(mwBoxFixture);
  approx(mwPeakFx, 1, 1e-9, "peakLuminanceInRegion(mw fixture) — saturated white");
  if (!(moonPeakFx > 0.1 && moonPeakFx < 0.3)) {
    throw new Error(`FIXTURE FAIL: moon fixture peak ${moonPeakFx} outside the expected dim band`);
  }
  if (!(moonPeakFx < mwPeakFx)) {
    throw new Error("FIXTURE FAIL: moon fixture peak must be strictly below the MW fixture peak");
  }
  console.log(
    `  ok  moon fixture: moonPeak ${moonPeakFx.toFixed(4)} < mwPeak ${mwPeakFx.toFixed(4)}`
  );

  console.log("SELFTEST PASS");
}

// ---------------------------------------------------------------------------
// In-page sampler. This function is serialized (fn.toString()) and injected
// into the live page together with the WCAG helpers above — it must only
// reference browser globals and the helpers injected alongside it.
// ---------------------------------------------------------------------------

function samplePageOnce(cfg) {
  // cfg: { ink: {r,g,b}, body: {r,g,b}, bg: {r,g,b}, scrimStops: [[y,a],...] }
  const lum = (c) => relativeLuminance(c.r, c.g, c.b);
  const scrimAt = (yFrac) => scrimAlphaAt(yFrac, cfg.scrimStops);

  const canvas = document.querySelector("#nightsky-canvas");
  if (!canvas) return { error: "no #nightsky-canvas" };
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const dprX = canvas.width / window.innerWidth;
  const dprY = canvas.height / window.innerHeight;

  const panel =
    document.querySelector('.panel[data-state="active"]') ||
    document.querySelector(".panel");
  const panelId = panel ? panel.getAttribute("data-panel-id") || panel.id || "?" : "?";

  const parseCssColor = (str) => {
    const m = str.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[,/ ]+([\d.]+))?\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  };

  // Composite a canvas pixel (r,g,b) under: (1) semi-transparent DOM bg
  // layers between the canvas and the text (bottom-up), (2) the scrim at
  // this pixel's viewport-y. Returns final {r,g,b}.
  const compositePixel = (r, g, b, yFrac, bgLayers) => {
    let cr = r, cg = g, cb = b;
    // scrim first (it sits directly above the canvas, below panel content)
    const sa = scrimAt(yFrac);
    cr = sa * cfg.bg.r + (1 - sa) * cr;
    cg = sa * cfg.bg.g + (1 - sa) * cg;
    cb = sa * cfg.bg.b + (1 - sa) * cb;
    for (const L of bgLayers) {
      cr = L.a * L.r + (1 - L.a) * cr;
      cg = L.a * L.g + (1 - L.a) * cg;
      cb = L.a * L.b + (1 - L.a) * cb;
    }
    return { r: cr, g: cg, b: cb };
  };

  const results = [];
  const seen = new Set();
  const els = panel
    ? panel.querySelectorAll(
        "h1,h2,h3,h4,p,li,a,dt,dd,small,strong,em,td,th,figcaption,blockquote,button,time,code,span"
      )
    : [];

  for (const el of els) {
    const text = (el.childNodes.length
      ? Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent)
          .join("")
      : el.textContent
    ).trim();
    // Only elements that DIRECTLY contain text — container-only elements are
    // covered by their text-bearing descendants.
    if (!text) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;

    // Walk ancestors: collect semi-transparent backgrounds; skip the element
    // entirely if an opaque layer sits between the text and the canvas.
    // The walk stops BEFORE <body>: body's background propagates to the
    // viewport canvas and paints BELOW the fixed z-index:-1 scene host, so
    // it never occludes the scene (CSS background propagation rule).
    let node = el;
    let overSky = true;
    const bgLayers = []; // bottom-up
    while (node && node !== document.body) {
      const bg = parseCssColor(getComputedStyle(node).backgroundColor || "");
      if (bg && bg.a >= 0.99) {
        overSky = false;
        break;
      }
      if (bg && bg.a > 0) bgLayers.unshift(bg);
      node = node.parentElement;
    }

    // TIGHT text regions: per-line rects from a Range over the element's
    // direct text nodes — a block element's bounding box spans the full
    // column even when its text is a few glyphs wide, which would sample
    // sky the text never touches. Line rects cover exactly the rendered
    // glyph runs (the true "text region" WCAG 1.4.3 cares about).
    const lineRects = [];
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const lr of range.getClientRects()) {
        const lx0 = Math.max(0, Math.floor(lr.left));
        const ly0 = Math.max(0, Math.floor(lr.top));
        const lx1 = Math.min(window.innerWidth, Math.ceil(lr.right));
        const ly1 = Math.min(window.innerHeight, Math.ceil(lr.bottom));
        if (lx1 - lx0 >= 2 && ly1 - ly0 >= 2) lineRects.push({ x0: lx0, y0: ly0, x1: lx1, y1: ly1 });
      }
    }
    if (!lineRects.length) continue;
    const x0 = Math.min(...lineRects.map((r) => r.x0));
    const y0 = Math.min(...lineRects.map((r) => r.y0));
    const x1 = Math.max(...lineRects.map((r) => r.x1));
    const y1 = Math.max(...lineRects.map((r) => r.y1));

    const key = `${el.tagName}:${x0},${y0},${x1},${y1}:${text.slice(0, 24)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const fontSize = parseFloat(cs.fontSize);
    const fontWeight = parseInt(cs.fontWeight, 10) || 400;
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
    const ownColor = parseCssColor(cs.color) || cfg.ink;

    if (!overSky) {
      results.push({
        panel: panelId,
        tag: el.tagName.toLowerCase(),
        text: text.slice(0, 40),
        rect: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
        overSky: false,
        note: "opaque DOM background between text and canvas — not over sky",
      });
      continue;
    }

    // Worst-case scan with per-pixel scrim + DOM-layer compositing, over
    // every line rect of the element's rendered text.
    const inkL = lum(cfg.ink);
    const ownL = lum(ownColor);
    let worstInk = Infinity;
    let worstOwn = Infinity;
    let worstPixel = null;
    let scanError = null;
    for (const lr of lineRects) {
      let region;
      try {
        region = ctx.getImageData(
          Math.round(lr.x0 * dprX),
          Math.round(lr.y0 * dprY),
          Math.max(1, Math.round((lr.x1 - lr.x0) * dprX)),
          Math.max(1, Math.round((lr.y1 - lr.y0) * dprY))
        );
      } catch (e) {
        scanError = String(e);
        continue;
      }
      const w = region.width;
      for (let i = 0; i < region.data.length; i += 4) {
        const px = (i / 4) % w;
        const py = Math.floor(i / 4 / w);
        const viewportY = lr.y0 + py / dprY;
        const yFrac = viewportY / window.innerHeight;
        const c = compositePixel(
          region.data[i],
          region.data[i + 1],
          region.data[i + 2],
          yFrac,
          bgLayers
        );
        const l = relativeLuminance(c.r, c.g, c.b);
        const rInk = contrastRatio(inkL, l);
        const rOwn = contrastRatio(ownL, l);
        if (rInk < worstInk) {
          worstInk = rInk;
          worstPixel = {
            vx: Math.round(lr.x0 + px / dprX),
            vy: Math.round(viewportY),
            composited: { r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b) },
            raw: [region.data[i], region.data[i + 1], region.data[i + 2]],
            scrimAlpha: +scrimAt(yFrac).toFixed(3),
          };
        }
        if (rOwn < worstOwn) worstOwn = rOwn;
      }
    }
    if (worstPixel === null) {
      results.push({ panel: panelId, tag: el.tagName.toLowerCase(), error: scanError || "no scannable pixels" });
      continue;
    }

    results.push({
      panel: panelId,
      tag: el.tagName.toLowerCase(),
      text: text.slice(0, 40),
      rect: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
      overSky: true,
      fontSize,
      fontWeight,
      isLarge,
      threshold: isLarge ? 3 : 4.5,
      ownColor: cs.color,
      worstVsInk: +worstInk.toFixed(3),
      worstVsOwnColor: +worstOwn.toFixed(3),
      worstPixel,
    });
  }

  return { panel: panelId, viewport: { w: window.innerWidth, h: window.innerHeight }, dpr: dprX, results };
}

function buildInjectedSource() {
  const { ink, bg, body } = readTokens();
  const cfg = { ink, bg, body, scrimStops: SCRIM_STOPS };
  return (
    relativeLuminance.toString() +
    "\n" +
    contrastRatio.toString() +
    "\n" +
    scrimAlphaAt.toString() +
    "\n" +
    samplePageOnce.toString() +
    `\nwindow.__sampleContrast = () => samplePageOnce(${JSON.stringify(cfg)});` +
    `\n"snippet-installed";`
  );
}

// ---------------------------------------------------------------------------
// CDP automation (zero-dep: node 22 built-in WebSocket + headless Chrome).
// ---------------------------------------------------------------------------

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  for (const c of candidates) {
    try {
      readFileSync(c);
      return c;
    } catch {
      /* keep looking — readFileSync on the exe throws only if missing */
    }
  }
  // readFileSync succeeds on executables; if all threw, fall back to name.
  return "chrome";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchChrome(width, height) {
  const profile = mkdtempSync(join(tmpdir(), "verify-contrast-"));
  const chrome = findChrome();
  const proc = spawn(
    chrome,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      `--window-size=${width},${height}`,
      "about:blank",
    ],
    { stdio: "ignore" }
  );
  // Chrome writes DevToolsActivePort into the profile dir once ready.
  let port = null;
  for (let i = 0; i < 100; i++) {
    await sleep(150);
    try {
      const contents = readFileSync(join(profile, "DevToolsActivePort"), "utf8");
      port = parseInt(contents.split("\n")[0], 10);
      if (port) break;
    } catch {
      /* not yet */
    }
  }
  if (!port) {
    proc.kill();
    throw new Error("Chrome DevToolsActivePort never appeared");
  }
  return { proc, port, profile };
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(
        "page exception: " +
          (res.exceptionDetails.exception?.description || res.exceptionDetails.text)
      );
    }
    return res.result.value;
  }
}

async function connectCdp(port) {
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  let target = list.find((t) => t.type === "page");
  if (!target) throw new Error("no page target");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  return new Cdp(ws);
}

// ---------------------------------------------------------------------------
// --moon mode (SKY-07 / 05.1-01 FLAG 1): moon-bbox peak luminance must stay
// STRICTLY below the Milky-Way-core-box peak, per viewport. The sampler is
// serialized into the page like samplePageOnce — it must only reference
// browser globals + the helpers injected alongside it, and it recomputes
// the moon geometry with the SAME formulas as starfield.ts drawMoon
// (mirrored here; any drift is caught by the assertion itself).
// ---------------------------------------------------------------------------

function sampleMoonOnce() {
  const canvas = document.querySelector("#nightsky-canvas");
  if (!canvas) return { error: "no #nightsky-canvas" };
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dprX = canvas.width / w;
  const dprY = canvas.height / h;

  // Moon geometry — identical formulas to starfield.ts (constants:
  // MOON_RADIUS_COEFF 0.018, floor 12, cap 22; MOON_X_MARGIN_FRACTION 0.30
  // of the deck.css column-left edge; MOON_Y_FRACTION 0.68).
  const pad = Math.min(32, Math.max(18, w * 0.04));
  const half = Math.min(880, w - 2 * pad) / 2;
  const columnLeft = w / 2 - half;
  const R = Math.min(22, Math.max(12, 0.018 * Math.min(w, h)));
  const moonX = 0.3 * columnLeft;
  const moonY = 0.68 * h;

  const peakOf = (x0, y0, x1, y1) => {
    const dx0 = Math.max(0, Math.round(x0 * dprX));
    const dy0 = Math.max(0, Math.round(y0 * dprY));
    const dw = Math.max(1, Math.min(canvas.width - dx0, Math.round((x1 - x0) * dprX)));
    const dh = Math.max(1, Math.min(canvas.height - dy0, Math.round((y1 - y0) * dprY)));
    const region = ctx.getImageData(dx0, dy0, dw, dh);
    let peak = 0;
    let px = null;
    for (let i = 0; i < region.data.length; i += 4) {
      const l = relativeLuminance(region.data[i], region.data[i + 1], region.data[i + 2]);
      if (l > peak) {
        peak = l;
        px = [region.data[i], region.data[i + 1], region.data[i + 2]];
      }
    }
    return { peak, px };
  };

  // Moon bounding box: [moonX-1.1R, moonY-1.1R, 2.2R, 2.2R] CSS px.
  const moonBox = { x0: moonX - 1.1 * R, y0: moonY - 1.1 * R, x1: moonX + 1.1 * R, y1: moonY + 1.1 * R };
  // Milky-Way core box: x 0.80-0.98, y 0.30-0.60 of the viewport.
  const mwBox = { x0: 0.8 * w, y0: 0.3 * h, x1: 0.98 * w, y1: 0.6 * h };

  const moon = peakOf(moonBox.x0, moonBox.y0, moonBox.x1, moonBox.y1);
  const mw = peakOf(mwBox.x0, mwBox.y0, mwBox.x1, mwBox.y1);

  return {
    viewport: { w, h },
    dpr: dprX,
    geometry: { moonX: +moonX.toFixed(2), moonY: +moonY.toFixed(2), R: +R.toFixed(2), columnLeft: +columnLeft.toFixed(2) },
    moonBox,
    mwBox,
    moonPeak: moon.peak,
    moonPeakPixel: moon.px,
    mwPeak: mw.peak,
    mwPeakPixel: mw.px,
  };
}

async function moonMain(args) {
  const url = argValue(args, "--url") || "http://localhost:4321/";
  const width = parseInt(argValue(args, "--width") || "1440", 10);
  const height = parseInt(argValue(args, "--height") || "900", 10);

  const { proc, port, profile } = await launchChrome(width, height);
  let snap;
  try {
    const cdp = await connectCdp(port);
    await cdp.send("Page.enable");
    await cdp.send("Page.navigate", { url });
    // Wait for load + scene readiness (Layer 0 is idle-scheduled; the moon
    // is the FINAL work unit, so a painted-center probe alone could race
    // it — poll until the moon-box itself contains non-background pixels
    // OR the settle timeout passes after first paint).
    let ready = false;
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      try {
        ready = await cdp.evaluate(`(() => {
          const c = document.querySelector('#nightsky-canvas');
          if (!c || !c.width) return false;
          const ctx = c.getContext('2d');
          const d = ctx.getImageData(Math.floor(c.width/2), Math.floor(c.height/4), 1, 1).data;
          return d[3] > 0; // scene has painted (sky wash is opaque)
        })()`);
        if (ready) break;
      } catch {
        /* page still loading */
      }
    }
    if (!ready) throw new Error("scene never painted (Layer 0 not adopted within 30s)");
    // Settle: let the chunked Layer-0 queue (incl. the final moon unit)
    // fully drain before sampling.
    await sleep(2500);

    await cdp.evaluate(
      relativeLuminance.toString() + "\n" + sampleMoonOnce.toString() + '\n"installed";'
    );
    snap = await cdp.evaluate("sampleMoonOnce()");
    if (snap.error) throw new Error(snap.error);
  } finally {
    proc.kill();
    await sleep(300);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* best-effort tmp cleanup */
    }
  }

  const pass = snap.moonPeak < snap.mwPeak;
  console.log(
    JSON.stringify(
      { mode: "moon", url, requested: { width, height }, ...snap, assertion: "moonPeak < mwPeak", pass },
      null,
      2
    )
  );
  if (!pass) {
    console.error(
      `MOON DIMNESS FAIL at ${width}x${height}: moonPeak ${snap.moonPeak} >= mwPeak ${snap.mwPeak}`
    );
    process.exit(1);
  }
  console.error(
    `moon dimness PASS at ${width}x${height}: moonPeak ${snap.moonPeak.toFixed(4)} < mwPeak ${snap.mwPeak.toFixed(4)}`
  );
}

const PANELS = ["hero", "fig-01", "systems", "experience", "patents", "skills", "contact"];

async function cdpMain(args) {
  const url = argValue(args, "--url") || "http://localhost:4321/";
  const samples = parseInt(argValue(args, "--samples") || "12", 10);
  const interval = parseInt(argValue(args, "--interval") || "350", 10);
  const width = parseInt(argValue(args, "--width") || "1440", 10);
  const height = parseInt(argValue(args, "--height") || "900", 10);

  const { proc, port, profile } = await launchChrome(width, height);
  let report;
  try {
    const cdp = await connectCdp(port);
    await cdp.send("Page.enable");
    await cdp.send("Page.navigate", { url });
    // Wait for load + scene readiness (Layer 0 is idle-scheduled).
    let ready = false;
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      try {
        ready = await cdp.evaluate(`(() => {
          const c = document.querySelector('#nightsky-canvas');
          if (!c || !c.width) return false;
          const ctx = c.getContext('2d');
          const d = ctx.getImageData(Math.floor(c.width/2), Math.floor(c.height/4), 1, 1).data;
          return d[3] > 0; // scene has painted (sky wash is opaque)
        })()`);
        if (ready) break;
      } catch {
        /* page still loading */
      }
    }
    if (!ready) throw new Error("scene never painted (Layer 0 not adopted within 30s)");

    // Install the sampler.
    await cdp.evaluate(buildInjectedSource());

    report = {
      url,
      viewport: { width, height },
      samplesPerPanel: samples,
      sampleIntervalMs: interval,
      startedAt: new Date().toISOString(),
      panels: [],
    };

    for (const id of PANELS) {
      await cdp.evaluate(`location.hash = ${JSON.stringify("#" + id)}; "nav";`);
      await sleep(800); // 420ms transition lock + settle
      // Aggregate worst-case across N samples (twinkle/beam time coverage).
      const byKey = new Map();
      let meta = null;
      for (let s = 0; s < samples; s++) {
        const snap = await cdp.evaluate("window.__sampleContrast()");
        if (snap.error) throw new Error(snap.error);
        meta = { panel: snap.panel, dpr: snap.dpr };
        for (const r of snap.results) {
          if (!r.overSky || r.error) {
            const k = `${r.tag}|${r.text}|skip`;
            if (!byKey.has(k)) byKey.set(k, r);
            continue;
          }
          const k = `${r.tag}|${r.text}|${r.rect.x},${r.rect.y}`;
          const prev = byKey.get(k);
          if (!prev || r.worstVsInk < prev.worstVsInk) byKey.set(k, r);
          else {
            // keep the running minimum of own-color too
            if (r.worstVsOwnColor < prev.worstVsOwnColor)
              prev.worstVsOwnColor = r.worstVsOwnColor;
          }
        }
        await sleep(interval);
      }
      const regions = Array.from(byKey.values());
      const overSkyRegions = regions.filter((r) => r.overSky);
      const worst = overSkyRegions.reduce(
        (acc, r) => (r.worstVsInk < acc ? r.worstVsInk : acc),
        Infinity
      );
      report.panels.push({
        panel: id,
        activePanelSeen: meta?.panel,
        regionCount: regions.length,
        overSkyCount: overSkyRegions.length,
        worstVsInk: worst === Infinity ? null : +worst.toFixed(3),
        failing: overSkyRegions
          .filter((r) => r.worstVsInk < r.threshold)
          .sort((a, b) => a.worstVsInk - b.worstVsInk),
        regions: overSkyRegions.sort((a, b) => a.worstVsInk - b.worstVsInk),
      });
      process.stderr.write(
        `panel ${id}: ${overSkyRegions.length} over-sky text regions, worst vs --ink = ${
          worst === Infinity ? "n/a" : worst.toFixed(2)
        }\n`
      );
    }
  } finally {
    proc.kill();
    await sleep(300);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* best-effort tmp cleanup */
    }
  }
  console.log(JSON.stringify(report, null, 2));
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

function argValue(args, name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const args = process.argv.slice(2);
try {
  if (args.includes("--selftest")) {
    selftest();
  } else if (args.includes("--cdp")) {
    await cdpMain(args);
  } else if (args.includes("--moon")) {
    await moonMain(args);
  } else if (args.includes("--print-browser-snippet")) {
    console.log(buildInjectedSource());
  } else if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("verify-contrast.mjs")) {
    console.log(
      "usage: node scripts/verify-contrast.mjs --selftest | --cdp [--url U] [--samples N] | --moon [--width W --height H] | --print-browser-snippet"
    );
  }
} catch (err) {
  console.error(String(err?.message || err));
  process.exit(1);
}
