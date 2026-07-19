// scripts/verify-contrast.mjs — SKY-05 worst-case WCAG contrast verifier.
// Zero new dependencies (plain node + the browser); matches the repo's
// scripts/render-og.mjs .mjs node-script convention. NOT wired into
// `astro build` — a verification-time tool whose recorded output lives in
// .planning/phases/05-night-sky-scene/contrast-evidence.md.
//
// 07-03 photo-aware evolution (IMG-05 honesty gate): the real Milky-Way
// photo (.sky-photo <img>, DOM-below the now-mostly-transparent canvas) is
// composited as the BOTTOM sampling layer via an analytic in-page
// drawImage of the already-decoded <img> bitmap (07-RESEARCH.md §6 Option
// A) — the object-fit:cover + object-position source-rect math is
// replicated in coverSourceRect() below (drawImage understands neither).
// Compositing order per pixel: photo (opaque bottom) <- canvas pixel via
// source-over using the canvas pixel's own alpha <- scrim <- DOM bg
// layers. This is mathematically exact for the PRE-BLUR stack; it
// intentionally does NOT model backdrop-filter blur — none exists yet.
// Phase 8 (glass) owns the screenshot-sampling gate that handles blur
// (07-RESEARCH.md §6.3); do not mistake "handles the photo correctly"
// for "handles glass correctly".
//
// --moon's Milky-Way-core comparator (sample point B) reads the PHOTO's
// brightest galactic-core pixel since 07-03 (the procedural MW is gone);
// moonPeak composites the canvas moon pixels over the photo behind them
// (raw canvas RGB is non-premultiplied and would overread a 0.45-alpha
// crescent as near-white).
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
//   node scripts/verify-contrast.mjs --agreement-selftest
//     08-01 (GLS-03) mode-agreement proof: launches headless Chrome at
//     DPR1 against scripts/fixtures/glass-agreement-fixture.html (a static
//     solid page satisfying the exact live DOM contract), runs BOTH the
//     analytic sampler (window.__sampleContrast) and the new screenshot
//     sampler (Page.captureScreenshot -> sharp raw decode) over the SAME
//     text rect, and asserts they agree within +/-0.05 — pre-blur, over a
//     solid backdrop, the two modes MUST agree. Then switches the fixture
//     to its glass variant (thin bright stripes + backdrop-filter blur)
//     and RECORDS (never asserts) the divergence between the modes: the
//     analytic mode cannot represent a spatial blur (a blurred pixel is a
//     weighted neighborhood average, not a function of one pixel), which
//     is the entire justification for screenshot mode. The screenshot
//     number is authoritative wherever the two disagree.
//
//   node scripts/verify-contrast.mjs --cdp-screenshot [--url U]
//                                    [--width 1440] [--height 900]
//     THE Phase-8 contrast GATE (08-01 Task 2; the analytic --cdp above is
//     retained as the fast dev-loop tool, this mode is what gates glass):
//     samples REAL post-composite screenshots via CDP Page.captureScreenshot
//     decoded Node-side with sharp — the only honest pixel source once a
//     backdrop-filter blur kernel exists. Covers all 7 panels PLUS
//     <header>, <footer>, and #deck-index (surfaces never gated before
//     Phase 8), sweeps tall panels across internal-scroll offsets, and
//     exits non-zero if any over-sky text region's worst-case ratio falls
//     below its WCAG threshold (4.5 normal / 3 large). DPR1-ONLY — see the
//     Emulation.setDeviceMetricsOverride note below.
//
//   node scripts/verify-contrast.mjs --moon [--url http://localhost:4321/]
//                                    [--width 1440] [--height 900]
//     SKY-07 moon-dimness assertion (05.1-01, FLAG 1; photo-aware since
//     07-03): launches headless Chrome at the given viewport, waits for
//     the scene to paint, then samples (a) the moon's bounding box
//     [moonX-1.1R, moonY-1.1R, 2.2R, 2.2R] — canvas pixels composited
//     over the photo behind them (geometry recomputed in-page with the
//     SAME formulas as starfield.ts) and (b) the PHOTO's Milky-Way-core
//     box [x:0.80-0.98, y:0.30-0.60 of the viewport] via the same
//     object-fit:cover composite. Computes the MAX relative luminance in
//     each (moonPeak, mwPeak) and asserts moonPeak < mwPeak strictly.
//     Exits non-zero on failure.
//
//   node scripts/verify-contrast.mjs --aurora [--url http://localhost:4321/]
//                                    [--width 1440] [--height 900]
//                                    [--samples 24] [--interval 900]
//     09-02 (AMB-03) aurora luminance-ceiling assertion: sibling of --moon
//     (self-contained sampler; the locked moon path is untouched). Samples
//     the aurora bounding box's composited peak (canvas over photo) and
//     the photo's MW-core peak, taking the MAX aurora peak across a
//     sampling window >= one full ~20s breathing period (samples*interval
//     >= 21000ms enforced) so the envelope peak is provably observed.
//     Asserts max(auroraPeak) < mwPeak strictly; run at BOTH reference
//     viewports with explicit dimensions. Exits non-zero on failure.
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
import { fileURLToPath, pathToFileURL } from "node:url";
// sharp resolves from node_modules — ALREADY present transitively via
// astro:assets' image pipeline (win32-x64 prebuilt binary lives at
// node_modules/@img/sharp-win32-x64). The "no new dependencies" floor is
// preserved: package.json is NOT touched (Task 1 verify asserts it).
import sharp from "sharp";

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
 * CSS object-fit:cover source-rect math WITH object-position (07-03,
 * plan-inlined reference implementation — plain center-cover math misses
 * object-position). posX/posY are the active media-query tier's
 * object-position fractions (e.g. 0.72/0.38 at 1440×900). Returns the
 * visible source window of the image; draw via
 * drawImage(img, srcX, srcY, srcW, srcH, 0, 0, boxW*dpr, boxH*dpr).
 * Serialized into the page alongside the samplers below.
 */
export function coverSourceRect(imgW, imgH, boxW, boxH, posX, posY) {
  const scale = Math.max(boxW / imgW, boxH / imgH);
  const srcW = boxW / scale, srcH = boxH / scale; // visible source window
  const srcX = (imgW - srcW) * posX, srcY = (imgH - srcH) * posY;
  return { srcX, srcY, srcW, srcH };
}

/**
 * Builds an offscreen canvas holding the .sky-photo <img> rendered through
 * its LIVE computed object-fit:cover/object-position crop, sized to the
 * scene canvas's backing store (deviceW × deviceH). Returns the 2d context
 * (willReadFrequently — many getImageData reads per pass), or null when
 * the photo isn't present/decoded yet. Serialized into the page; only
 * browser globals + coverSourceRect may be referenced.
 */
export function makePhotoCanvas(deviceW, deviceH) {
  const img = document.querySelector(".sky-photo img");
  if (!img || !img.complete || !img.naturalWidth) return null;
  const c = document.createElement("canvas");
  c.width = deviceW;
  c.height = deviceH;
  const pctx = c.getContext("2d", { willReadFrequently: true });
  if (!pctx) return null;
  // Computed object-position — honors the responsive ladder's active
  // media tier without duplicating it here. Our CSS uses % pairs only;
  // anything else falls back to center (0.5).
  const op = (getComputedStyle(img).objectPosition || "50% 50%").split(/\s+/);
  const frac = (tok) => (tok && tok.endsWith("%") ? parseFloat(tok) / 100 : 0.5);
  const posX = frac(op[0]);
  const posY = frac(op[1] || "50%");
  const { srcX, srcY, srcW, srcH } = coverSourceRect(
    img.naturalWidth,
    img.naturalHeight,
    window.innerWidth,
    window.innerHeight,
    posX,
    posY
  );
  // 07-03 Rule-1 fix: naturalWidth/naturalHeight are DENSITY-CORRECTED for
  // srcset w-descriptor images (e.g. the 1920w resource reports natural
  // 1424×605 at a 1440-wide viewport), while 9-arg drawImage SOURCE
  // coordinates are in the underlying BITMAP's pixel space — passing the
  // natural-space window there samples the wrong region (measured: core
  // cropped out entirely). Instead map the WHOLE image (coordinate-space
  // unambiguous 5-arg draw) so the natural-space window srcX..srcX+srcW
  // lands exactly on 0..deviceW — mathematically identical to CSS
  // object-fit:cover + object-position rendering.
  const kx = deviceW / srcW;
  const ky = deviceH / srcH;
  pctx.drawImage(img, -srcX * kx, -srcY * ky, img.naturalWidth * kx, img.naturalHeight * ky);
  return pctx;
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

  // 9. coverSourceRect fixture (07-03): 1440×900 box over the 2560×1089
  //    master at the desktop tier's object-position 72% 38%. The returned
  //    source window must sit right-of-center of the master, and the
  //    horizontal placement fraction must round-trip: srcX/(imgW-srcW)
  //    ≈ 0.72 ± 0.01 (guards a regression to plain center-cover math,
  //    which would silently sample the wrong region of the photo).
  {
    const imgW = 2560, imgH = 1089;
    const { srcX, srcY, srcW, srcH } = coverSourceRect(imgW, imgH, 1440, 900, 0.72, 0.38);
    if (srcW > imgW + 1e-6 || srcH > imgH + 1e-6) {
      throw new Error("FIXTURE FAIL: coverSourceRect window larger than the source image");
    }
    approx(srcX / (imgW - srcW), 0.72, 0.01, "coverSourceRect posX round-trip (1440 tier)");
    const centerX = srcX + srcW / 2;
    if (!(centerX > imgW / 2)) {
      throw new Error("FIXTURE FAIL: 72% window must sit right-of-center of the master");
    }
    // Vertical: at this geometry cover uses the full image height, so the
    // window must span it exactly (srcY 0, srcH == imgH) — above-center
    // trivially holds.
    if (Math.abs(srcY) > 1e-6 || Math.abs(srcH - imgH) > 1e-6) {
      throw new Error("FIXTURE FAIL: 1440×900 over 2560×1089 must use the full source height");
    }
    console.log(`  ok  coverSourceRect window x[${srcX.toFixed(1)}..${(srcX + srcW).toFixed(1)}] of ${imgW}`);
  }

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

  // 07-03: the photo is the BOTTOM sampling layer. Same-backing-store
  // offscreen composite of the .sky-photo <img> through its live
  // object-fit:cover/object-position crop. When the photo is absent /
  // not yet decoded (photoCtx null), the base falls back to --bg — the
  // root background that literally shows through a transparent canvas.
  const photoCtx = makePhotoCanvas(canvas.width, canvas.height);

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
      let photoRegion = null;
      try {
        const gx = Math.round(lr.x0 * dprX);
        const gy = Math.round(lr.y0 * dprY);
        const gw = Math.max(1, Math.round((lr.x1 - lr.x0) * dprX));
        const gh = Math.max(1, Math.round((lr.y1 - lr.y0) * dprY));
        region = ctx.getImageData(gx, gy, gw, gh);
        if (photoCtx) photoRegion = photoCtx.getImageData(gx, gy, gw, gh);
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
        // 07-03 bottom layer: photo pixel first, then the canvas pixel
        // composited over it via source-over using the canvas pixel's OWN
        // alpha (Layer 0 is now mostly transparent — most pixels show
        // ~100% photo; moon/twinkle/constellation/meteor/firefly pixels
        // partially or fully override it where drawn).
        const ca = region.data[i + 3] / 255;
        const baseR = photoRegion ? photoRegion.data[i] : cfg.bg.r;
        const baseG = photoRegion ? photoRegion.data[i + 1] : cfg.bg.g;
        const baseB = photoRegion ? photoRegion.data[i + 2] : cfg.bg.b;
        const c = compositePixel(
          ca * region.data[i] + (1 - ca) * baseR,
          ca * region.data[i + 1] + (1 - ca) * baseG,
          ca * region.data[i + 2] + (1 - ca) * baseB,
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

  return {
    panel: panelId,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    dpr: dprX,
    photoPresent: !!photoCtx,
    results,
  };
}

function buildInjectedSource(cfgOverrides) {
  const { ink, bg, body } = readTokens();
  const cfg = { ink, bg, body, scrimStops: SCRIM_STOPS, ...(cfgOverrides || {}) };
  return (
    relativeLuminance.toString() +
    "\n" +
    contrastRatio.toString() +
    "\n" +
    scrimAlphaAt.toString() +
    "\n" +
    coverSourceRect.toString() +
    "\n" +
    makePhotoCanvas.toString() +
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

// Scene-readiness probe (07-03 Rule-1 tooling fix): the pre-photo probe
// asserted an opaque pixel at canvas center — Layer 0 is TRANSPARENT there
// forever after the overlay surgery, so it would time out. The moon is the
// FINAL Layer-0 work unit, so "a bright pixel exists in the moon box"
// proves the whole chunked queue drained AND the scene adopted/blitted.
// Also requires the .sky-photo <img> to be decoded (the samplers composite
// it as the bottom layer — sampling before decode would silently fall back
// to --bg and weaken the gate).
const READY_PROBE = `(() => {
  const c = document.querySelector('#nightsky-canvas');
  const img = document.querySelector('.sky-photo img');
  if (!c || !c.width || !img || !img.complete || !img.naturalWidth) return false;
  const ctx = c.getContext('2d');
  const w = window.innerWidth, h = window.innerHeight;
  const dpr = c.width / w;
  const pad = Math.min(32, Math.max(18, w * 0.04));
  const half = Math.min(880, w - 2 * pad) / 2;
  const colLeft = w / 2 - half;
  const R = Math.min(22, Math.max(12, 0.018 * Math.min(w, h)));
  const mx = 0.3 * colLeft, my = 0.68 * h;
  const d = ctx.getImageData(
    Math.max(0, Math.round((mx - R) * dpr)),
    Math.max(0, Math.round((my - R) * dpr)),
    Math.max(1, Math.round(2 * R * dpr)),
    Math.max(1, Math.round(2 * R * dpr))
  ).data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] > 80 && d[i + 3] > 50) return true; // lit crescent pixel
  }
  return false;
})()`;

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
      // 08-01: pin the output color profile so Page.captureScreenshot's
      // PNG bytes are raw sRGB — an unmanaged/display profile would shift
      // captured RGB values and break the analytic<->screenshot agreement
      // selftest. No effect on getImageData-based modes.
      "--force-color-profile=srgb",
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
// 08-01 (GLS-03) screenshot pixel source — Node-side capture + decode.
//
// DPR1-ONLY GATE DOCTRINE: the screenshot path forces deviceScaleFactor 1
// via Emulation.setDeviceMetricsOverride BEFORE Page.navigate. Two reasons:
//   1. A 1:1 CSS-px <-> screenshot-px mapping means every in-page rect
//      coordinate indexes the decoded frame directly (no DPR scaling that
//      could drift); captureAndDecode's size self-check enforces it hard.
//   2. The known Windows DSF-2 Page.captureScreenshot hang
//      (05.1-01-SUMMARY.md:77-78 — "hangs indefinitely whenever
//      deviceScaleFactor 2 is active") means device-scale-factor 2 is used
//      ONLY for optional CLI visual evidence (--force-device-scale-factor
//      captures by hand), NEVER for the gate.
// ---------------------------------------------------------------------------

/** Force the DPR1 viewport contract (call BEFORE Page.navigate). */
async function forceDpr1(cdp, width, height) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

/**
 * CDP Page.captureScreenshot -> sharp raw decode. Returns an ImageData-like
 * { data, width, height, channels } (RGBA, channels always 4 via
 * ensureAlpha) compatible with worstCaseContrastInRegion()'s iteration.
 * Hard self-check: the decoded frame MUST equal the requested CSS-px
 * viewport exactly — a mismatch means DPR drifted and every downstream
 * rect coordinate would sample the wrong pixels.
 */
async function captureAndDecode(cdp, width, height) {
  const { data: base64 } = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  const buf = Buffer.from(base64, "base64");
  const { data, info } = await sharp(buf)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  if (info.width !== width || info.height !== height) {
    throw new Error(
      `screenshot size ${info.width}x${info.height} != requested viewport ` +
        `${width}x${height} — DPR/coordinate-space assumption violated ` +
        `(forceDpr1 must run before Page.navigate)`
    );
  }
  return { data, width: info.width, height: info.height, channels: info.channels };
}

/**
 * Stride-math copy of one rect out of the full decoded frame into a fresh
 * Uint8ClampedArray — shape-compatible with the EXISTING
 * worstCaseContrastInRegion() ({ data, width, height }), which is reused
 * VERBATIM on the result. Clamps to frame bounds; returns null when the
 * clamped rect is empty. Handles both Buffer (.copy) and plain typed-array
 * (.subarray/.set) sources.
 */
function extractSubImage(full, x0, y0, x1, y1) {
  const cx0 = Math.max(0, Math.floor(x0));
  const cy0 = Math.max(0, Math.floor(y0));
  const cx1 = Math.min(full.width, Math.ceil(x1));
  const cy1 = Math.min(full.height, Math.ceil(y1));
  const w = cx1 - cx0;
  const h = cy1 - cy0;
  if (w <= 0 || h <= 0) return null;
  const out = new Uint8ClampedArray(w * h * 4);
  const stride = full.width * 4;
  for (let row = 0; row < h; row++) {
    const srcStart = (cy0 + row) * stride + cx0 * 4;
    const dstStart = row * w * 4;
    if (typeof full.data.copy === "function") {
      full.data.copy(out, dstStart, srcStart, srcStart + w * 4); // Buffer
    } else {
      out.set(full.data.subarray(srcStart, srcStart + w * 4), dstStart);
    }
  }
  return { data: out, width: w, height: h };
}

// Glyph occlusion control: a screenshot contains the RENDERED text pixels,
// which would self-compare against the text luminance at ratio ~1 and
// poison every worst-case scan. Before each capture the glyphs are hidden
// with color:transparent (layout/backdrop-filter/background rendering are
// all unaffected — backdrop-filter samples the BACKDROP, not the element's
// own content), so the captured rect holds exactly the background the
// glyphs sit on. Rect discovery always runs BEFORE hiding (it reads the
// real computed color for ownColor).
const HIDE_TEXT_EXPR = `(() => {
  let s = document.getElementById("__vc-hide-text");
  if (!s) {
    s = document.createElement("style");
    s.id = "__vc-hide-text";
    s.textContent = "* { color: transparent !important; text-shadow: none !important; }";
    document.head.appendChild(s);
  }
  return new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r(true)))
  );
})()`;

const SHOW_TEXT_EXPR = `(() => {
  const s = document.getElementById("__vc-hide-text");
  if (s) s.remove();
  return true;
})()`;

// ---------------------------------------------------------------------------
// --agreement-selftest (08-01 Task 1): the analytic and screenshot pixel
// pipelines must agree within +/-0.05 on a solid pre-blur fixture; on the
// glass (blur) fixture variant their divergence is RECORDED, not asserted —
// the screenshot number is authoritative there by design.
// ---------------------------------------------------------------------------

const AGREEMENT_TOLERANCE = 0.05;
const FIXTURE_PATH = join(ROOT, "scripts/fixtures/glass-agreement-fixture.html");
const AGREEMENT_W = 1000;
const AGREEMENT_H = 700;

async function agreementSelftestMain() {
  const { ink } = readTokens();
  const inkL = relativeLuminance(ink.r, ink.g, ink.b);
  const url = pathToFileURL(FIXTURE_PATH).href;

  const { proc, port, profile } = await launchChrome(AGREEMENT_W, AGREEMENT_H);
  let solidPass = false;
  try {
    const cdp = await connectCdp(port);
    await cdp.send("Page.enable");
    await forceDpr1(cdp, AGREEMENT_W, AGREEMENT_H);
    await cdp.send("Page.navigate", { url });

    let ready = false;
    for (let i = 0; i < 60; i++) {
      await sleep(150);
      try {
        ready = await cdp.evaluate("window.__fixtureReady === true");
        if (ready) break;
      } catch {
        /* still loading */
      }
    }
    if (!ready) throw new Error("fixture never became ready (canvas fill / img decode)");

    // Analytic sampler, injected with ZERO scrim stops: the fixture has no
    // scrim DOM element, so the analytic model must model no scrim. The
    // production scrim model is separately locked by --selftest's deck.css
    // sync fixture — what THIS test proves is the pixel pipeline (rect ->
    // pixels -> WCAG math) agreement between the two modes.
    await cdp.evaluate(buildInjectedSource({ scrimStops: [[0, 0], [1, 0]] }));

    // Both samplers over the SAME text rect, in both fixture states.
    const runBothModes = async (label) => {
      const snap = await cdp.evaluate("window.__sampleContrast()");
      if (snap.error) throw new Error(snap.error);
      const region = snap.results.find((r) => r.overSky && r.rect);
      if (!region) throw new Error(`${label}: no over-sky text region found in fixture`);
      const analyticWorst = region.worstVsInk;

      await cdp.evaluate(HIDE_TEXT_EXPR);
      const frame = await captureAndDecode(cdp, AGREEMENT_W, AGREEMENT_H);
      await cdp.evaluate(SHOW_TEXT_EXPR);

      const sub = extractSubImage(
        frame,
        region.rect.x,
        region.rect.y,
        region.rect.x + region.rect.w,
        region.rect.y + region.rect.h
      );
      if (!sub) throw new Error(`${label}: fixture text rect empty after clamping`);
      const { worst: screenshotWorst } = worstCaseContrastInRegion(sub, inkL);
      return { analyticWorst, screenshotWorst, rect: region.rect, text: region.text };
    };

    console.log("verify-contrast --agreement-selftest (analytic vs screenshot pixel pipelines)");

    // 1. SOLID fixture state: pre-blur over a solid backdrop — MUST agree.
    const solid = await runBothModes("solid");
    const solidDelta = Math.abs(solid.analyticWorst - solid.screenshotWorst);
    console.log(
      `  solid fixture  rect=${JSON.stringify(solid.rect)} "${solid.text}"\n` +
        `    analytic   worstVsInk = ${solid.analyticWorst.toFixed(4)}\n` +
        `    screenshot worstVsInk = ${solid.screenshotWorst.toFixed(4)}\n` +
        `    |delta| = ${solidDelta.toFixed(4)} (tolerance ${AGREEMENT_TOLERANCE})`
    );
    solidPass = solidDelta <= AGREEMENT_TOLERANCE;

    // 2. GLASS fixture state: recorded observation, never asserted. The
    //    modes are EXPECTED to diverge beyond the tolerance here — the
    //    analytic sampler reads raw stripe pixels through a flat-alpha
    //    model; the screenshot reads the browser's real blur(12px)
    //    composite. Divergence here is the justification for screenshot
    //    mode; the screenshot number is authoritative.
    const glassMode = await cdp.evaluate("window.__fixtureGlassMode()");
    if (glassMode !== "glass-mode") throw new Error("fixture glass mode failed to engage");
    await cdp.evaluate(
      "new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))"
    );
    const glass = await runBothModes("glass");
    const glassDelta = Math.abs(glass.analyticWorst - glass.screenshotWorst);
    console.log(
      `  glass fixture (RECORDED, not asserted — screenshot is authoritative):\n` +
        `    analytic   worstVsInk = ${glass.analyticWorst.toFixed(4)} (raw stripe pixels, blur invisible to the model)\n` +
        `    screenshot worstVsInk = ${glass.screenshotWorst.toFixed(4)} (real blurred composite)\n` +
        `    |delta| = ${glassDelta.toFixed(4)}` +
        (glassDelta > AGREEMENT_TOLERANCE
          ? " — modes diverge under blur, as expected (screenshot mode is why this phase exists)"
          : " — WARNING: expected divergence beyond tolerance did not appear; check the fixture's stripe geometry")
    );
  } finally {
    proc.kill();
    await sleep(300);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* best-effort tmp cleanup */
    }
  }

  if (!solidPass) {
    console.error(
      `AGREEMENT SELFTEST FAIL: analytic and screenshot modes disagree beyond ` +
        `+/-${AGREEMENT_TOLERANCE} on the SOLID pre-blur fixture — one of the pixel ` +
        `pipelines is lying; do not trust either gate until this passes.`
    );
    process.exit(1);
  }
  console.log("AGREEMENT SELFTEST PASS (solid fixture within tolerance)");
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

  // 07-03: the MW core lives on the PHOTO now, and the canvas is
  // transparent behind the moon — sample point A (moon) composites the
  // canvas pixels over the photo (raw non-premultiplied canvas RGB would
  // overread a 0.45-alpha crescent as near-white); sample point B reads
  // the photo's own brightest galactic-core pixel.
  const photoCtx = makePhotoCanvas(canvas.width, canvas.height);
  if (!photoCtx) return { error: "no decoded .sky-photo img (photo comparator unavailable)" };

  // Moon geometry — identical formulas to starfield.ts (constants:
  // MOON_RADIUS_COEFF 0.018, floor 12, cap 22; MOON_X_MARGIN_FRACTION 0.30
  // of the deck.css column-left edge; MOON_Y_FRACTION 0.68).
  const pad = Math.min(32, Math.max(18, w * 0.04));
  const half = Math.min(880, w - 2 * pad) / 2;
  const columnLeft = w / 2 - half;
  const R = Math.min(22, Math.max(12, 0.018 * Math.min(w, h)));
  const moonX = 0.3 * columnLeft;
  const moonY = 0.68 * h;

  const deviceRect = (x0, y0, x1, y1) => {
    const dx0 = Math.max(0, Math.round(x0 * dprX));
    const dy0 = Math.max(0, Math.round(y0 * dprY));
    const dw = Math.max(1, Math.min(canvas.width - dx0, Math.round((x1 - x0) * dprX)));
    const dh = Math.max(1, Math.min(canvas.height - dy0, Math.round((y1 - y0) * dprY)));
    return { dx0, dy0, dw, dh };
  };

  // Sample A (moon): canvas pixels source-over-composited onto the photo
  // pixels behind them — the luminance a viewer actually sees.
  const compositedPeakOf = (x0, y0, x1, y1) => {
    const { dx0, dy0, dw, dh } = deviceRect(x0, y0, x1, y1);
    const scene = ctx.getImageData(dx0, dy0, dw, dh);
    const photo = photoCtx.getImageData(dx0, dy0, dw, dh);
    let peak = 0;
    let px = null;
    for (let i = 0; i < scene.data.length; i += 4) {
      const a = scene.data[i + 3] / 255;
      const r = a * scene.data[i] + (1 - a) * photo.data[i];
      const g = a * scene.data[i + 1] + (1 - a) * photo.data[i + 1];
      const b = a * scene.data[i + 2] + (1 - a) * photo.data[i + 2];
      const l = relativeLuminance(r, g, b);
      if (l > peak) {
        peak = l;
        px = [Math.round(r), Math.round(g), Math.round(b)];
      }
    }
    return { peak, px };
  };

  // Sample B (MW core): the PHOTO's own brightest galactic-core pixel —
  // the 07-UI-SPEC Overlay Harmony comparator target.
  const photoPeakOf = (x0, y0, x1, y1) => {
    const { dx0, dy0, dw, dh } = deviceRect(x0, y0, x1, y1);
    const region = photoCtx.getImageData(dx0, dy0, dw, dh);
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
  // Milky-Way core box: x 0.80-0.98, y 0.30-0.60 of the viewport (covers
  // the UI-SPEC's x:0.90/y:0.50 spot sample).
  const mwBox = { x0: 0.8 * w, y0: 0.3 * h, x1: 0.98 * w, y1: 0.6 * h };

  const moon = compositedPeakOf(moonBox.x0, moonBox.y0, moonBox.x1, moonBox.y1);
  const mw = photoPeakOf(mwBox.x0, mwBox.y0, mwBox.x1, mwBox.y1);

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
    // Wait for load + scene readiness: READY_PROBE requires the decoded
    // photo AND a lit moon pixel (moon = final Layer-0 work unit, so the
    // whole chunked queue has drained once it appears).
    let ready = false;
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      try {
        ready = await cdp.evaluate(READY_PROBE);
        if (ready) break;
      } catch {
        /* page still loading */
      }
    }
    if (!ready) throw new Error("scene never painted (Layer 0 not adopted within 30s)");
    // Settle margin retained (cheap; guards any straggling paint).
    await sleep(1000);

    await cdp.evaluate(
      relativeLuminance.toString() +
        "\n" +
        coverSourceRect.toString() +
        "\n" +
        makePhotoCanvas.toString() +
        "\n" +
        sampleMoonOnce.toString() +
        '\n"installed";'
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

// ---------------------------------------------------------------------------
// --aurora mode (09-02, AMB-03): the aurora bounding box's composited peak
// luminance must stay STRICTLY below the photo's Milky-Way-core peak, per
// viewport. Sibling of --moon — sampleAuroraOnce is SELF-CONTAINED (its own
// inline deviceRect/compositedPeakOf/photoPeakOf mirroring sampleMoonOnce)
// so the locked moon path is untouched. The breathing peak (alpha envelope
// 0.07-0.17, ~20s period, in-code ceiling 0.20) is provably observed by
// auroraMain's MAX-over-a-full-cycle sampling: any window >= the period
// contains the envelope peak, so the running maximum across N samples with
// N*I >= ~21s reflects the brightest breathing moment.
// ---------------------------------------------------------------------------

function sampleAuroraOnce() {
  const canvas = document.querySelector("#nightsky-canvas");
  if (!canvas) return { error: "no #nightsky-canvas" };
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dprX = canvas.width / w;
  const dprY = canvas.height / h;

  // Photo comparator (bottom layer) — the aurora is drawn on the canvas
  // over the transparent Layer-0 region, so its visible luminance is the
  // canvas pixel source-over-composited onto the photo behind it.
  const photoCtx = makePhotoCanvas(canvas.width, canvas.height);
  if (!photoCtx) return { error: "no decoded .sky-photo img (photo comparator unavailable)" };

  // Aurora bounding box — aurora.ts's documented geometry mirrored here:
  // x from 8 to (columnLeft - 8) via the same deck.css pad/half column
  // formula; y from 0.49H (the highest breathing top extent) to 0.85H
  // (the fixed horizon base).
  const pad = Math.min(32, Math.max(18, w * 0.04));
  const half = Math.min(880, w - 2 * pad) / 2;
  const columnLeft = w / 2 - half;
  const auroraBox = { x0: 8, y0: 0.49 * h, x1: columnLeft - 8, y1: 0.85 * h };
  // The SAME Milky-Way-core comparator box the moon gate uses.
  const mwBox = { x0: 0.8 * w, y0: 0.3 * h, x1: 0.98 * w, y1: 0.6 * h };

  const deviceRect = (x0, y0, x1, y1) => {
    const dx0 = Math.max(0, Math.round(x0 * dprX));
    const dy0 = Math.max(0, Math.round(y0 * dprY));
    const dw = Math.max(1, Math.min(canvas.width - dx0, Math.round((x1 - x0) * dprX)));
    const dh = Math.max(1, Math.min(canvas.height - dy0, Math.round((y1 - y0) * dprY)));
    return { dx0, dy0, dw, dh };
  };

  // Aurora sample: canvas pixels source-over-composited onto the photo
  // pixels behind them — the luminance a viewer actually sees — with a
  // POINT-FEATURE EROSION so the peak measures the AURORA (a broad,
  // spatially-smooth area fill), not the pre-existing bright point
  // features that share the left-margin box (the margin-confined
  // twinkle/constellation stars and the moon crescent, all of which
  // pre-date the aurora and carry their own gates; a raw un-eroded box
  // peak fails against mwPeak even with the aurora removed entirely).
  // Erosion = separable min filter over a ~7-CSS-px window: any feature
  // narrower than the window (star disks <= ~5 CSS px) is eliminated,
  // while the aurora's slow-varying luminance is untouched — so an
  // aurora alpha regression (a broad TOO-BRIGHT fill) still fails the
  // gate; only sub-window POINTS are excluded. The raw peak is returned
  // alongside for transparency, never asserted.
  const compositedPeakOf = (x0, y0, x1, y1) => {
    const { dx0, dy0, dw, dh } = deviceRect(x0, y0, x1, y1);
    const scene = ctx.getImageData(dx0, dy0, dw, dh);
    const photo = photoCtx.getImageData(dx0, dy0, dw, dh);
    const lum = new Float32Array(dw * dh);
    const rgb = new Uint8ClampedArray(dw * dh * 3);
    let rawPeak = 0;
    let rawPx = null;
    for (let i = 0, j = 0; i < scene.data.length; i += 4, j++) {
      const a = scene.data[i + 3] / 255;
      const r = a * scene.data[i] + (1 - a) * photo.data[i];
      const g = a * scene.data[i + 1] + (1 - a) * photo.data[i + 1];
      const b = a * scene.data[i + 2] + (1 - a) * photo.data[i + 2];
      const l = relativeLuminance(r, g, b);
      lum[j] = l;
      rgb[j * 3] = r;
      rgb[j * 3 + 1] = g;
      rgb[j * 3 + 2] = b;
      if (l > rawPeak) {
        rawPeak = l;
        rawPx = [Math.round(r), Math.round(g), Math.round(b)];
      }
    }
    // Separable erosion: min over rows, then min over columns.
    const rad = Math.max(3, Math.round(3.5 * dprX)); // ~7 CSS px window
    const rowMin = new Float32Array(dw * dh);
    for (let y = 0; y < dh; y++) {
      const off = y * dw;
      for (let x = 0; x < dw; x++) {
        let m = Infinity;
        const lo = Math.max(0, x - rad);
        const hi = Math.min(dw - 1, x + rad);
        for (let k = lo; k <= hi; k++) if (lum[off + k] < m) m = lum[off + k];
        rowMin[off + x] = m;
      }
    }
    let peak = 0;
    let peakIdx = 0;
    for (let y = 0; y < dh; y++) {
      const lo = Math.max(0, y - rad);
      const hi = Math.min(dh - 1, y + rad);
      for (let x = 0; x < dw; x++) {
        let m = Infinity;
        for (let k = lo; k <= hi; k++) if (rowMin[k * dw + x] < m) m = rowMin[k * dw + x];
        if (m > peak) {
          peak = m;
          peakIdx = y * dw + x;
        }
      }
    }
    const px = [rgb[peakIdx * 3], rgb[peakIdx * 3 + 1], rgb[peakIdx * 3 + 2]];
    return { peak, px, rawPeak, rawPx, erosionRadiusDevicePx: rad };
  };

  // MW-core sample: the PHOTO's own brightest galactic-core pixel.
  const photoPeakOf = (x0, y0, x1, y1) => {
    const { dx0, dy0, dw, dh } = deviceRect(x0, y0, x1, y1);
    const region = photoCtx.getImageData(dx0, dy0, dw, dh);
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

  const aurora = compositedPeakOf(auroraBox.x0, auroraBox.y0, auroraBox.x1, auroraBox.y1);
  const mw = photoPeakOf(mwBox.x0, mwBox.y0, mwBox.x1, mwBox.y1);

  return {
    viewport: { w, h },
    dpr: dprX,
    geometry: { columnLeft: +columnLeft.toFixed(2) },
    auroraBox,
    mwBox,
    // Left-margin box vs right-margin comparator: disjoint by
    // construction — asserted Node-side so the ceiling check can never
    // silently become a self-referential near-tie.
    boxesOverlap: auroraBox.x1 > mwBox.x0,
    auroraPeak: aurora.peak,
    auroraPeakPixel: aurora.px,
    // Raw (un-eroded) box peak — transparency only, never asserted: it
    // is dominated by the pre-existing point features (stars/moon) that
    // share the box and carry their own gates.
    auroraPeakRaw: aurora.rawPeak,
    auroraPeakRawPixel: aurora.rawPx,
    erosionRadiusDevicePx: aurora.erosionRadiusDevicePx,
    mwPeak: mw.peak,
    mwPeakPixel: mw.px,
  };
}

async function auroraMain(args) {
  const url = argValue(args, "--url") || "http://localhost:4321/";
  const width = parseInt(argValue(args, "--width") || "1440", 10);
  const height = parseInt(argValue(args, "--height") || "900", 10);
  // Full-cycle max sampling: N*I must cover >= one ~20s breathing period
  // (with margin) so the running max provably contains the envelope peak.
  const samples = parseInt(argValue(args, "--samples") || "24", 10);
  const interval = parseInt(argValue(args, "--interval") || "900", 10);
  if (samples * interval < 21000) {
    console.error(
      `--aurora sampling window ${samples}x${interval}ms = ${samples * interval}ms < 21000ms — ` +
        `must cover at least one full ~20s breathing period to observe the envelope peak`
    );
    process.exit(1);
  }

  const { proc, port, profile } = await launchChrome(width, height);
  let maxAurora = null;
  let mwSnap = null;
  let overlap = false;
  let sampleCount = 0;
  try {
    const cdp = await connectCdp(port);
    await cdp.send("Page.enable");
    await cdp.send("Page.navigate", { url });
    // Same readiness contract as --moon: decoded photo + lit moon pixel
    // (the final Layer-0 work unit).
    let ready = false;
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      try {
        ready = await cdp.evaluate(READY_PROBE);
        if (ready) break;
      } catch {
        /* page still loading */
      }
    }
    if (!ready) throw new Error("scene never painted (Layer 0 not adopted within 30s)");
    await sleep(1000);

    await cdp.evaluate(
      relativeLuminance.toString() +
        "\n" +
        coverSourceRect.toString() +
        "\n" +
        makePhotoCanvas.toString() +
        "\n" +
        sampleAuroraOnce.toString() +
        '\n"installed";'
    );

    for (let s = 0; s < samples; s++) {
      const snap = await cdp.evaluate("sampleAuroraOnce()");
      if (snap.error) throw new Error(snap.error);
      sampleCount++;
      if (snap.boxesOverlap) overlap = true;
      if (!maxAurora || snap.auroraPeak > maxAurora.auroraPeak) {
        maxAurora = {
          auroraPeak: snap.auroraPeak,
          auroraPeakPixel: snap.auroraPeakPixel,
          auroraPeakRaw: snap.auroraPeakRaw,
          auroraPeakRawPixel: snap.auroraPeakRawPixel,
          atSample: s,
        };
      }
      // mwPeak is photo-static — keep the latest snapshot for reporting.
      mwSnap = snap;
      await sleep(interval);
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

  if (overlap) {
    console.error(
      `AURORA GATE FAIL at ${width}x${height}: aurora box overlaps the MW comparator box — ` +
        `the ceiling check would be self-referential`
    );
    process.exit(1);
  }

  const pass = maxAurora.auroraPeak < mwSnap.mwPeak;
  console.log(
    JSON.stringify(
      {
        mode: "aurora",
        url,
        requested: { width, height },
        viewport: mwSnap.viewport,
        dpr: mwSnap.dpr,
        geometry: mwSnap.geometry,
        auroraBox: mwSnap.auroraBox,
        mwBox: mwSnap.mwBox,
        boxesOverlap: overlap,
        sampling: {
          samples: sampleCount,
          intervalMs: interval,
          windowMs: sampleCount * interval,
          note: "max composited aurora peak across >= one full ~20s breathing cycle",
        },
        auroraPeak: maxAurora.auroraPeak,
        auroraPeakPixel: maxAurora.auroraPeakPixel,
        auroraPeakRaw: maxAurora.auroraPeakRaw,
        auroraPeakRawPixel: maxAurora.auroraPeakRawPixel,
        erosionRadiusDevicePx: mwSnap.erosionRadiusDevicePx,
        auroraPeakAtSample: maxAurora.atSample,
        mwPeak: mwSnap.mwPeak,
        mwPeakPixel: mwSnap.mwPeakPixel,
        assertion: "max(auroraPeak) < mwPeak",
        pass,
      },
      null,
      2
    )
  );
  if (!pass) {
    console.error(
      `AURORA CEILING FAIL at ${width}x${height}: max auroraPeak ${maxAurora.auroraPeak} >= mwPeak ${mwSnap.mwPeak}`
    );
    process.exit(1);
  }
  console.error(
    `aurora ceiling PASS at ${width}x${height}: max auroraPeak ${maxAurora.auroraPeak.toFixed(4)} < mwPeak ${mwSnap.mwPeak.toFixed(4)} (${sampleCount} samples / ${((sampleCount * interval) / 1000).toFixed(1)}s window)`
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
    // Wait for load + scene readiness (photo decoded + moon painted —
    // see READY_PROBE).
    let ready = false;
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      try {
        ready = await cdp.evaluate(READY_PROBE);
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
        if (!snap.photoPresent) {
          // 07-03 honesty gate: sampling without the photo would fall back
          // to --bg and understate worst-case brightness — hard-fail.
          throw new Error("photo not decoded during sampling — gate would be dishonest");
        }
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
// --cdp-screenshot (08-01 Task 2) — THE Phase-8 contrast gate.
//
// DPR1 IS MANDATORY here (forceDpr1 before navigation — see the doctrine
// block above captureAndDecode). This mode — not the analytic --cdp — is
// THE contrast gate for the rest of Phase 8: analytic per-pixel compositing
// is exact for flat-alpha layers but cannot represent a backdrop-filter
// blur kernel; only the browser's own composited screenshot can.
//
// Scope (08-RESEARCH.md Pitfall 3): all 7 PANELS entries PLUS <header>,
// <footer>, and #deck-index — three fixed chrome surfaces that are
// siblings of .deck and were NEVER visited by samplePageOnce's
// panel-scoped query. Sampled once while hero is active (they are
// position:fixed and identical regardless of active panel).
//
// Tall-panel internal-scroll sweep (08-RESEARCH.md Pitfall 5): .panel is
// overflow:auto and deck.ts never resets scrollTop, while
// Page.captureScreenshot sees ONE viewport frame — so any panel with
// scrollHeight > clientHeight is swept across scrollTop offsets
// (step = clientHeight), re-discovering rects and unioning worst-case
// results across all offsets. Panels that fit record "no internal scroll
// needed" instead.
// ---------------------------------------------------------------------------

/**
 * In-page geometry-only text-region discovery — factored out of
 * samplePageOnce(): IDENTICAL text extraction, ancestor-opaque-background
 * walk, and Range-based per-line glyph-run rect logic, but it STOPS before
 * any getImageData call. Pixels come from the Node-side screenshot decode.
 * Serialized with .toString() into the page — browser globals only.
 *
 * Element-list scope note (Rule 2 widening): the original h1..span list
 * plus `b` and `div` — the header identity line is a direct-text <div>
 * with a <b> child (SiteHeader.astro), neither of which the original
 * panel-scoped list ever needed. The direct-text-node filter below keeps
 * container-only divs out exactly as before.
 */
function discoverTextRegions(rootSpecs) {
  // rootSpecs: [{ selector, panel }]
  const parseCssColor = (str) => {
    const m = str.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[,/ ]+([\d.]+))?\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  };
  const out = [];
  const seen = new Set();
  for (const spec of rootSpecs) {
    const root = document.querySelector(spec.selector);
    if (!root) {
      out.push({ panel: spec.panel, error: "root not found: " + spec.selector });
      continue;
    }
    const els = root.querySelectorAll(
      "h1,h2,h3,h4,p,li,a,dt,dd,small,strong,em,td,th,figcaption,blockquote,button,time,code,span,b,div"
    );
    for (const el of els) {
      const text = (el.childNodes.length
        ? Array.from(el.childNodes)
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent)
            .join("")
        : el.textContent
      ).trim();
      if (!text) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;

      let node = el;
      let overSky = true;
      while (node && node !== document.body) {
        const bg = parseCssColor(getComputedStyle(node).backgroundColor || "");
        if (bg && bg.a >= 0.99) {
          overSky = false;
          break;
        }
        node = node.parentElement;
      }

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

      const key = spec.panel + ":" + el.tagName + ":" + x0 + "," + y0 + "," + x1 + "," + y1 + ":" + text.slice(0, 24);
      if (seen.has(key)) continue;
      seen.add(key);

      const fontSize = parseFloat(cs.fontSize);
      const fontWeight = parseInt(cs.fontWeight, 10) || 400;
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      out.push({
        panel: spec.panel,
        tag: el.tagName.toLowerCase(),
        text: text.slice(0, 40),
        rect: { x0, y0, x1, y1 },
        lineRects,
        overSky,
        fontSize,
        fontWeight,
        isLarge,
        threshold: isLarge ? 3 : 4.5,
        ownColor: parseCssColor(cs.color),
        ownColorCss: cs.color,
      });
    }
  }
  return out;
}

function buildDiscoverySource() {
  return (
    discoverTextRegions.toString() +
    "\nwindow.__discoverTextRegions = discoverTextRegions;" +
    '\n"discovery-installed";'
  );
}

async function cdpScreenshotMain(args) {
  const url = argValue(args, "--url") || "http://localhost:4321/";
  const width = parseInt(argValue(args, "--width") || "1440", 10);
  const height = parseInt(argValue(args, "--height") || "900", 10);
  const { ink } = readTokens();
  const inkL = relativeLuminance(ink.r, ink.g, ink.b);

  const { proc, port, profile } = await launchChrome(width, height);
  let report;
  let anyFailing = false;
  try {
    const cdp = await connectCdp(port);
    await cdp.send("Page.enable");
    // DPR1 MANDATORY — before navigation (captureAndDecode enforces 1:1).
    await forceDpr1(cdp, width, height);
    await cdp.send("Page.navigate", { url });

    // Same readiness contract as the analytic mode: decoded photo + lit
    // moon pixel (the final Layer-0 work unit).
    let ready = false;
    for (let i = 0; i < 120; i++) {
      await sleep(250);
      try {
        ready = await cdp.evaluate(READY_PROBE);
        if (ready) break;
      } catch {
        /* page still loading */
      }
    }
    if (!ready) throw new Error("scene never painted (Layer 0 not adopted within 30s)");

    await cdp.evaluate(buildDiscoverySource());

    report = {
      url,
      viewport: { width, height },
      mode: "screenshot",
      dpr: 1,
      startedAt: new Date().toISOString(),
      panels: [],
    };

    // One settled position: discover rects (real colors), hide glyphs,
    // capture+decode, restore glyphs, scan every line rect Node-side with
    // the SAME selftested WCAG helpers, tracking per-region minima.
    const sampleRoots = async (rootSpecs, byKey, offset) => {
      const regions = await cdp.evaluate(
        `window.__discoverTextRegions(${JSON.stringify(rootSpecs)})`
      );
      await cdp.evaluate(HIDE_TEXT_EXPR);
      const frame = await captureAndDecode(cdp, width, height);
      await cdp.evaluate(SHOW_TEXT_EXPR);
      for (const r of regions) {
        if (r.error) {
          const k = `${r.panel}|error|${r.error}`;
          if (!byKey.has(k)) byKey.set(k, r);
          continue;
        }
        const ownL = r.ownColor
          ? relativeLuminance(r.ownColor.r, r.ownColor.g, r.ownColor.b)
          : inkL;
        let worstInk = Infinity;
        let worstOwn = Infinity;
        let worstPixel = null;
        for (const lr of r.lineRects) {
          const sub = extractSubImage(frame, lr.x0, lr.y0, lr.x1, lr.y1);
          if (!sub) continue;
          const scanInk = worstCaseContrastInRegion(sub, inkL);
          if (scanInk.worst < worstInk) {
            worstInk = scanInk.worst;
            worstPixel = {
              vx: lr.x0 + scanInk.worstPixel.x,
              vy: lr.y0 + scanInk.worstPixel.y,
              rgb: [scanInk.worstPixel.r, scanInk.worstPixel.g, scanInk.worstPixel.b],
              scrollOffset: offset,
            };
          }
          const scanOwn = worstCaseContrastInRegion(sub, ownL);
          if (scanOwn.worst < worstOwn) worstOwn = scanOwn.worst;
        }
        if (worstPixel === null) continue; // fully clipped at this offset
        const entry = {
          panel: r.panel,
          tag: r.tag,
          text: r.text,
          rect: { x: r.rect.x0, y: r.rect.y0, w: r.rect.x1 - r.rect.x0, h: r.rect.y1 - r.rect.y0 },
          overSky: r.overSky,
          fontSize: r.fontSize,
          fontWeight: r.fontWeight,
          isLarge: r.isLarge,
          threshold: r.threshold,
          ownColor: r.ownColorCss,
          worstVsInk: +worstInk.toFixed(3),
          worstVsOwnColor: +worstOwn.toFixed(3),
          worstPixel,
        };
        const k = `${r.panel}|${r.tag}|${r.text}|${r.rect.x0}`;
        const prev = byKey.get(k);
        if (!prev || entry.worstVsInk < prev.worstVsInk) {
          if (prev && prev.worstVsOwnColor < entry.worstVsOwnColor)
            entry.worstVsOwnColor = prev.worstVsOwnColor;
          byKey.set(k, entry);
        } else if (entry.worstVsOwnColor < prev.worstVsOwnColor) {
          prev.worstVsOwnColor = entry.worstVsOwnColor;
        }
      }
    };

    const pushPanelEntry = (id, byKey, sampledOffsets, scrollInfo, activePanelSeen) => {
      const regions = Array.from(byKey.values()).filter((r) => !r.error);
      const overSkyRegions = regions.filter((r) => r.overSky);
      const notOverSky = regions.filter((r) => !r.overSky);
      const worst = overSkyRegions.reduce(
        (acc, r) => (r.worstVsInk < acc ? r.worstVsInk : acc),
        Infinity
      );
      const failing = overSkyRegions
        .filter((r) => r.worstVsInk < r.threshold)
        .sort((a, b) => a.worstVsInk - b.worstVsInk);
      if (failing.length) anyFailing = true;
      report.panels.push({
        panel: id,
        activePanelSeen,
        regionCount: regions.length,
        overSkyCount: overSkyRegions.length,
        worstVsInk: worst === Infinity ? null : +worst.toFixed(3),
        sampled_offsets: sampledOffsets,
        scroll: scrollInfo,
        failing,
        regions: overSkyRegions.sort((a, b) => a.worstVsInk - b.worstVsInk),
        // Regions behind an opaque DOM background (e.g. today's opaque
        // jump-index pill) still get REAL screenshot pixels — measured and
        // recorded for the baseline, but excluded from the over-sky gate
        // exactly like the analytic mode excludes them.
        notOverSky: notOverSky.sort((a, b) => a.worstVsInk - b.worstVsInk),
      });
      process.stderr.write(
        `panel ${id}: ${overSkyRegions.length} over-sky text regions, worst vs --ink = ${
          worst === Infinity ? "n/a" : worst.toFixed(2)
        }${failing.length ? ` — ${failing.length} FAILING` : ""}\n`
      );
    };

    for (const id of PANELS) {
      await cdp.evaluate(`location.hash = ${JSON.stringify("#" + id)}; "nav";`);
      await sleep(800); // 420ms transition lock + settle
      const sm = await cdp.evaluate(
        `(() => { const p = document.querySelector('.panel[data-state="active"]');
           return p ? { scrollHeight: p.scrollHeight, clientHeight: p.clientHeight,
                        active: p.getAttribute("data-panel-id") || p.id || "?" } : null; })()`
      );
      const offsets = [0];
      if (sm && sm.scrollHeight > sm.clientHeight) {
        const step = sm.clientHeight;
        const max = sm.scrollHeight - sm.clientHeight;
        for (let top = step; top < max + step; top += step) offsets.push(Math.min(top, max));
        for (let i = offsets.length - 1; i > 0; i--)
          if (offsets[i] === offsets[i - 1]) offsets.splice(i, 1);
      }
      const byKey = new Map();
      const seenOffsets = [];
      for (const off of offsets) {
        const applied = await cdp.evaluate(
          `(() => { const p = document.querySelector('.panel[data-state="active"]');
             if (!p) return -1; p.scrollTop = ${off};
             return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(p.scrollTop)))); })()`
        );
        seenOffsets.push(typeof applied === "number" ? Math.round(applied) : off);
        await sampleRoots([{ selector: '.panel[data-state="active"]', panel: id }], byKey, off);
      }
      await cdp.evaluate(
        `(() => { const p = document.querySelector('.panel[data-state="active"]'); if (p) p.scrollTop = 0; return true; })()`
      );
      pushPanelEntry(
        id,
        byKey,
        seenOffsets,
        sm
          ? {
              scrollHeight: sm.scrollHeight,
              clientHeight: sm.clientHeight,
              swept: seenOffsets.length > 1,
              note:
                sm.scrollHeight > sm.clientHeight
                  ? "internal-scroll sweep fired"
                  : `no internal scroll needed at ${width}x${height}`,
            }
          : null,
        sm?.active
      );
    }

    // Chrome surfaces — once, while hero is active. header/footer/
    // #deck-index are position:fixed siblings of .deck, identical
    // regardless of active panel; NEVER visited by samplePageOnce's
    // panel-scoped query (REQUIRED scope extension, not an extra).
    await cdp.evaluate(`location.hash = "#hero"; "nav";`);
    await sleep(800);
    const chromeSpecs = [
      { selector: "header", panel: "header" },
      { selector: "footer", panel: "footer" },
      { selector: "#deck-index", panel: "jump-index" },
    ];
    const chromeByKey = new Map();
    await sampleRoots(chromeSpecs, chromeByKey, 0);
    for (const spec of chromeSpecs) {
      const byKey = new Map();
      for (const [k, v] of chromeByKey) if (v.panel === spec.panel) byKey.set(k, v);
      pushPanelEntry(spec.panel, byKey, [0], null, "hero");
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
  if (anyFailing) {
    console.error(
      `CONTRAST GATE FAIL at ${width}x${height} (screenshot mode): over-sky region(s) below threshold — see failing[] entries.`
    );
    process.exit(1);
  }
  console.error(`contrast gate PASS at ${width}x${height} (screenshot mode, DPR1)`);
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
  } else if (args.includes("--agreement-selftest")) {
    await agreementSelftestMain();
  } else if (args.includes("--cdp-screenshot")) {
    await cdpScreenshotMain(args);
  } else if (args.includes("--cdp")) {
    await cdpMain(args);
  } else if (args.includes("--moon")) {
    await moonMain(args);
  } else if (args.includes("--aurora")) {
    await auroraMain(args);
  } else if (args.includes("--print-browser-snippet")) {
    console.log(buildInjectedSource());
  } else if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("verify-contrast.mjs")) {
    console.log(
      "usage: node scripts/verify-contrast.mjs --selftest | --agreement-selftest | --cdp-screenshot [--url U --width W --height H] | --cdp [--url U] [--samples N] | --moon [--width W --height H] | --aurora [--width W --height H] [--samples N --interval MS] | --print-browser-snippet"
    );
  }
} catch (err) {
  console.error(String(err?.message || err));
  process.exit(1);
}
