// scripts/build-sky.mjs — one-time/rerunnable composite + encode pipeline for
// the Phase 7 real-sky masters (IMG-01, IMG-03). NOT wired into `astro build`
// — matches the project's render-og.mjs / font-subsetting convention (one-time
// build step, commit the resulting artifacts under public/sky/).
//
// Run with: node scripts/build-sky.mjs
//
// SOURCE (download scope is EXACTLY this one asset — 07-01-PLAN.md T-07-01):
//   URL:   https://noirlab.edu/public/media/archives/images/publicationtiff/noirlab2430b.tif
//          (301 -> storage.noirlab.edu; NOIRLab "The World at Night" all-sky
//          panorama, credit NOIRLab/NSF/AURA/E. Slawik/M. Zamani, CC BY 4.0)
//   Size:  16,359,276 bytes exactly — asserted before any pixel is used.
//   SHA-256 (recorded at first verified download, 2026-07-19):
//          c49e471107fbccd3cea2bcbb67f19caa2d263c8de3b5dc75b0f1c839b33cb965
//   Shape: 4000x2000 8-bit sRGB equirectangular TIFF (galactic coordinates —
//          the Milky Way band runs horizontally along the map equator, core
//          bulge centered near x=2050).
//   The raw TIFF lives ONLY in gitignored /sky-source/ — never committed.
//
// TOKEN PROVENANCE: the literal hex/RGB values below mirror
// src/styles/tokens.css. This is a build-time Node script, so the CSS-only
// zero-hex doctrine does not apply — update BOTH files if a token changes:
//   --bg:#0f1216   --sky-zenith:#05070a (5,7,10)   --sky-horizon:#141a2c (20,26,44)
//
// PIPELINE (recipe locked by 07-SPIKE-BANDING.md — the spike verdict is the
// authoritative record of why each constant holds its value):
//   1. download + integrity gate (byte length, 4000x2000/8-bit/srgb metadata)
//   2. per candidate: solve frame geometry (place the galactic core at a
//      target frame fraction, rotate theta clockwise for the descending
//      band diagonal, assert all four frame corners inside the
//      distortion-safe row range y=550..1450 — the 1/cos(latitude) rule,
//      07-RESEARCH.md section 1.3)
//   3. grade: desaturate + tint into the blue-slate family (hue 200-230),
//      then per-channel linear black-point mapping so the measured dark-sky
//      floor lands on --sky-zenith (5,7,10) +/-4
//   4. column vignette: baked darken toward --sky-zenith with the SKY-05
//      governor's geometry (half-width 464px + 80px smoothstep ramp at the
//      1440x900 reference), mapped through the object-fit:cover window at
//      the 1024-1799px tier (object-position 72%)
//   5. seam ramp: vertical blend to --bg, stops 0..0.72 photo / 0.72..0.94
//      ramp / 0.94..1.0 solid (07-UI-SPEC Seam Contract)
//   6. normalize to srgb, resize 2560w + 1920w, add light deterministic
//      grain (anti-banding dither), encode AVIF 10-bit 4:4:4 + WebP, plus
//      a ~32w WebP LQIP data URI
//   7. evidence previews for every candidate -> spike-banding/

import sharp from "sharp";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_PATH = join(ROOT, "sky-source", "noirlab2430b-4k.tif");
const OUT_DIR = join(ROOT, "public", "sky");
const EVIDENCE_DIR = join(
  ROOT,
  ".planning",
  "phases",
  "07-real-sky-foundation",
  "spike-banding",
);

const SRC_URL =
  "https://noirlab.edu/public/media/archives/images/publicationtiff/noirlab2430b.tif";
const EXPECTED_BYTES = 16359276;

// ---------------------------------------------------------------------------
// Token mirrors (see TOKEN PROVENANCE header note)
// ---------------------------------------------------------------------------
const BG_HEX = "#0f1216"; // --bg
const ZENITH_HEX = "#05070a"; // --sky-zenith
const ZENITH = [5, 7, 10]; // --sky-zenith, RGB

// ---------------------------------------------------------------------------
// Recipe constants (locked by the spike — see 07-SPIKE-BANDING.md)
// ---------------------------------------------------------------------------
const ASPECT = 2.35; // master letterbox (07-UI-SPEC: ~2.3:1-2.4:1)
const SAFE_TOP = 550; // distortion-safe rows (07-RESEARCH.md section 1.3)
const SAFE_BOTTOM = 1450;
const SAFE_H = SAFE_BOTTOM - SAFE_TOP;

// Grade: desaturate airglow/warm-core color, pull the whole frame into the
// blue-slate hue family (07-UI-SPEC Tone Contract: hue 200-230, S <= 15%).
const GRADE_SATURATION = 0.35;
const GRADE_TINT = "#93a7cf"; // pale blue-slate chroma target for .tint()
// Per-channel black-point mapping: measured dark floor -> --sky-zenith.
const GRADE_WHITE_IN = 252;
const GRADE_WHITE_OUT = 245;
// Black-floor measurement: global 0.5th percentile over the frame above the
// seam ramp (NOT a fixed corner patch — a corner can catch band glow and
// over-stretch the map, crushing genuine dark-rift pixels below the +/-4
// zenith tolerance).
const DARK_REGION = { x0: 0.02, x1: 0.98, y0: 0.05, y1: 0.6 };
const DARK_PCT = 0.005;
// Mid-tone pull-down: out = k*in + (1-k)*zenith — keeps the black floor
// anchored on --sky-zenith while pulling band glow/mids down so the photo
// stays subordinate to the authored overlay (07-UI-SPEC Overlay Harmony)
// and the near-horizon non-band ceiling holds under --sky-horizon.
const MIDTONE_SCALE = 0.8;

// Column vignette — SKY-05 governor geometry mapped into master space.
// Reference tier: 1440x900 viewport, object-fit:cover, object-position 72%.
// Master is 2.35:1 (wider than 1.6:1) so cover scales by height: the visible
// window is (1.6/2.35)=0.68085 of master width, its left edge sits at
// 0.72*(1-0.68085)=0.229787. Viewport px -> master px scale = masterH/900,
// so 464px half-width => 464/(900*2.35)=0.219385 of master WIDTH, and the
// 80px ramp => 0.037825. Center = window center = 0.570213 of master width.
const WIN_LEFT_FRAC = 0.229787; // reference-tier cover window left edge
const WIN_WIDTH_FRAC = 0.680851; // reference-tier cover window width
const VIGNETTE_CENTER_FRAC = 0.570213;
const VIGNETTE_HALF_FRAC = 0.219385;
const VIGNETTE_RAMP_FRAC = 0.037825;
const VIGNETTE_ALPHA = 0.88; // texture x0.12 inside the column (governor parity)

// Seam ramp (07-UI-SPEC Seam Contract)
const SEAM_START = 0.72;
const SEAM_SOLID = 0.94;
// Below this frame fraction the seam ramp is >=92% opaque --bg, so the
// distortion-safe-zone corner check is relaxed for the bottom corners (the
// pixels there are invisible behind the seam — this buys ~10% more native
// frame height from the 4K source).
const SEAM_SAFE_FRACTION = 0.9;

// Anti-banding grain: deterministic +/-amplitude dither applied per output
// pixel AFTER resize, before encode (post-resize so downscaling can't smooth
// it away). Mirrors the research's validated "light pre-noise" doctrine.
const GRAIN_AMP = 1.5;

// Encode ladder (07-RESEARCH.md section 1.7, verified against sharp@0.35.3)
const AVIF_OPTS = { quality: 58, bitdepth: 10, chromaSubsampling: "4:4:4", effort: 6 };
const WEBP_OPTS = { quality: 72 };
const EXPORT_WIDTHS = [2560, 1920];
const LQIP_WIDTH = 32;
const LQIP_OPTS = { quality: 40 };

// ---------------------------------------------------------------------------
// Candidate crop windows. core = [x,y] source px of the compositional anchor
// (the brightest band feature the frame is built around); theta = clockwise
// rotation in degrees (descending "\" diagonal, 07-UI-SPEC Crop+Placement);
// coreAt = [fx,fy] target frame fraction where the anchor lands. The anchor
// must land in the reference-tier window's core zone: window x 0.80-0.98 =>
// master x 0.7745-0.897 (07-UI-SPEC band geometry).
// ---------------------------------------------------------------------------
const CANDIDATES = [
  // A — the research heuristic's galactic-core bulge (rows ~1000-1090,
  // cols ~1670-2470): densest dust-lane texture, warm core.
  { id: "A-core-t20", core: [2050, 1040], theta: 20, coreAt: [0.84, 0.58] },
  // B — same bulge, steeper diagonal (closer to the UI-SPEC's steep target,
  // trades a little inscribed resolution for angle).
  { id: "B-core-t28", core: [2050, 1035], theta: 28, coreAt: [0.85, 0.58] },
  // C — western band segment (Cygnus-side rift, cols ~1200-1600): quieter
  // core, stronger dark-rift texture, no warm bulge to fight the grade.
  { id: "C-rift-t18", core: [1400, 1020], theta: 18, coreAt: [0.84, 0.58] },
];

// Locked by the spike verdict (07-SPIKE-BANDING.md): candidate A.
// `--winner <id>` overrides for candidate-comparison encodes (spike use only
// — the committed public/sky/ masters must always come from the default).
const winnerArgIdx = process.argv.indexOf("--winner");
const WINNER = winnerArgIdx >= 0 ? process.argv[winnerArgIdx + 1] : "A-core-t20";

// ---------------------------------------------------------------------------
// 1. Download + integrity gate
// ---------------------------------------------------------------------------
async function ensureSource() {
  if (!existsSync(SRC_PATH)) {
    console.log(`downloading ${SRC_URL} ...`);
    mkdirSync(join(ROOT, "sky-source"), { recursive: true });
    const res = await fetch(SRC_URL, { redirect: "follow" });
    if (!res.ok) {
      throw new Error(
        `NOIRLab download failed (${res.status} ${res.statusText}). ` +
          `The ONLY permitted fallback is the ESO mirror ` +
          `https://cdn.eso.org/images/publicationtiff/eso0932a.tif — a ` +
          `different source image requiring re-derived crop constants; do ` +
          `not swap it in silently (07-01-PLAN.md download scope).`,
      );
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength !== EXPECTED_BYTES) {
      throw new Error(
        `integrity gate FAILED: downloaded ${buf.byteLength} bytes, expected ` +
          `${EXPECTED_BYTES} (T-07-01 tampering mitigation) — refusing to use it.`,
      );
    }
    writeFileSync(SRC_PATH, buf);
  }
  const size = statSync(SRC_PATH).size;
  if (size !== EXPECTED_BYTES) {
    throw new Error(
      `integrity gate FAILED: ${SRC_PATH} is ${size} bytes, expected ${EXPECTED_BYTES}. ` +
        `Delete it and re-run to re-download.`,
    );
  }
  const meta = await sharp(SRC_PATH).metadata();
  if (meta.width !== 4000 || meta.height !== 2000 || meta.space !== "srgb") {
    throw new Error(
      `metadata gate FAILED: got ${meta.width}x${meta.height} ${meta.space}, ` +
        `expected 4000x2000 srgb`,
    );
  }
  console.log(
    `source OK: ${EXPECTED_BYTES} bytes, ${meta.width}x${meta.height} ` +
      `${meta.bitsPerSample ?? 8}-bit ${meta.space}`,
  );
}

// ---------------------------------------------------------------------------
// 2. Frame geometry — solve the extract/rotate/crop chain analytically.
// Clockwise rotation in y-down image coords: R = [[c,-s],[s,c]] (verified
// against real sharp output — a dot right of center moves DOWN).
// ---------------------------------------------------------------------------
function frameLayout(cand) {
  const th = (cand.theta * Math.PI) / 180;
  const c = Math.cos(th);
  const s = Math.sin(th);
  // Auto-fit: largest frame height whose rotated, core-anchored placement
  // keeps every corner inside the distortion-safe strip. (A closed-form max
  // only holds for a strip-centered frame; anchoring the core off-center
  // shifts the frame, so shrink until it fits.)
  let fw = 0;
  let vx = 0;
  let vy = 0;
  let cornersSrc = null;
  let fh = Math.floor(SAFE_H / (ASPECT * s + c));
  for (; fh >= 300; fh -= 4) {
    fw = Math.round(fh * ASPECT);
    // Frame center relative to the core anchor, in final (rotated) space.
    vx = (0.5 - cand.coreAt[0]) * fw;
    vy = (0.5 - cand.coreAt[1]) * fh;
    // Full frame corners (for the extraction bbox) in final space, relative
    // to the core.
    const cornersFinal = [
      [vx - fw / 2, vy - fh / 2],
      [vx + fw / 2, vy - fh / 2],
      [vx + fw / 2, vy + fh / 2],
      [vx - fw / 2, vy + fh / 2],
    ];
    // Distortion-check corners: the bottom pair is evaluated at
    // SEAM_SAFE_FRACTION of the frame height (see constant) — pixels below
    // that line are hidden behind the near-solid seam ramp.
    const bottomY = vy + (SEAM_SAFE_FRACTION - 0.5) * fh;
    const checkFinal = [
      [vx - fw / 2, vy - fh / 2],
      [vx + fw / 2, vy - fh / 2],
      [vx + fw / 2, bottomY],
      [vx - fw / 2, bottomY],
    ];
    // Inverse-rotate (R^-1 = [[c,s],[-s,c]]) back into source space.
    const inv = ([x, y]) => [
      cand.core[0] + c * x + s * y,
      cand.core[1] - s * x + c * y,
    ];
    cornersSrc = cornersFinal.map(inv);
    const ok =
      checkFinal
        .map(inv)
        .every(([x, y]) => y >= SAFE_TOP && y <= SAFE_BOTTOM && x >= 0 && x <= 4000) &&
      cornersSrc.every(([x, y]) => y >= 0 && y <= 2000 && x >= 0 && x <= 4000);
    if (ok) break;
  }
  if (fh < 300) {
    throw new Error(
      `${cand.id}: no frame >= 300px tall fits the distortion-safe zone ` +
        `y=${SAFE_TOP}..${SAFE_BOTTOM} — adjust core/theta/coreAt`,
    );
  }
  const xs = cornersSrc.map((p) => p[0]);
  const ys = cornersSrc.map((p) => p[1]);
  const pad = 4;
  const L = Math.max(0, Math.floor(Math.min(...xs)) - pad);
  const T = Math.max(0, Math.floor(Math.min(...ys)) - pad);
  const R = Math.min(4000, Math.ceil(Math.max(...xs)) + pad);
  const B = Math.min(2000, Math.ceil(Math.max(...ys)) + pad);
  // Frame center in source space.
  const fcx = cand.core[0] + c * vx + s * vy;
  const fcy = cand.core[1] - s * vx + c * vy;
  return { fw, fh, c, s, L, T, W: R - L, H: B - T, fcx, fcy, cornersSrc };
}

// ---------------------------------------------------------------------------
// Region percentile measurement on a decoded buffer (for the black-point map)
// ---------------------------------------------------------------------------
async function regionPercentile(buf, region, pct) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const x0 = Math.floor(region.x0 * info.width);
  const x1 = Math.floor(region.x1 * info.width);
  const y0 = Math.floor(region.y0 * info.height);
  const y1 = Math.floor(region.y1 * info.height);
  const ch = [[], [], []];
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const i = (y * info.width + x) * info.channels;
      ch[0].push(data[i]);
      ch[1].push(data[i + 1]);
      ch[2].push(data[i + 2]);
    }
  }
  return ch.map((vals) => {
    vals.sort((a, b) => a - b);
    return vals[Math.floor(pct * (vals.length - 1))];
  });
}

// ---------------------------------------------------------------------------
// SVG overlays (rasterized by sharp's bundled librsvg — 07-RESEARCH.md 1.5)
// ---------------------------------------------------------------------------
const smoothstep = (t) => t * t * (3 - 2 * t);

function rampStops(fracFrom, fracTo, alphaFrom, alphaTo, color) {
  // 5-stop smoothstep approximation between two gradient positions.
  const stops = [];
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const off = fracFrom + t * (fracTo - fracFrom);
    const a = alphaFrom + smoothstep(t) * (alphaTo - alphaFrom);
    stops.push(
      `<stop offset='${(off * 100).toFixed(3)}%' stop-color='${color}' stop-opacity='${a.toFixed(4)}'/>`,
    );
  }
  return stops.join("");
}

function vignetteSvg(w, h) {
  const x0 = VIGNETTE_CENTER_FRAC - VIGNETTE_HALF_FRAC - VIGNETTE_RAMP_FRAC;
  const x1 = VIGNETTE_CENTER_FRAC - VIGNETTE_HALF_FRAC;
  const x2 = VIGNETTE_CENTER_FRAC + VIGNETTE_HALF_FRAC;
  const x3 = VIGNETTE_CENTER_FRAC + VIGNETTE_HALF_FRAC + VIGNETTE_RAMP_FRAC;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
  <defs><linearGradient id='v' x1='0' y1='0' x2='1' y2='0'>
    <stop offset='0%' stop-color='${ZENITH_HEX}' stop-opacity='0'/>
    ${rampStops(x0, x1, 0, VIGNETTE_ALPHA, ZENITH_HEX)}
    ${rampStops(x2, x3, VIGNETTE_ALPHA, 0, ZENITH_HEX)}
    <stop offset='100%' stop-color='${ZENITH_HEX}' stop-opacity='0'/>
  </linearGradient></defs>
  <rect width='100%' height='100%' fill='url(#v)'/>
</svg>`;
}

function seamSvg(w, h) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
  <defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0%' stop-color='${BG_HEX}' stop-opacity='0'/>
    ${rampStops(SEAM_START, SEAM_SOLID, 0, 1, BG_HEX)}
    <stop offset='100%' stop-color='${BG_HEX}' stop-opacity='1'/>
  </linearGradient></defs>
  <rect width='100%' height='100%' fill='url(#g)'/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Deterministic grain (mulberry32-seeded, +/-GRAIN_AMP per channel)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function withGrain(buf) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const rnd = mulberry32(info.width * 31 + info.height);
  for (let i = 0; i < data.length; i++) {
    const n = (rnd() * 2 - 1) * GRAIN_AMP;
    const v = data[i] + n;
    data[i] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  });
}

// ---------------------------------------------------------------------------
// 3-5. Compose one candidate: extract -> rotate -> frame -> grade ->
// vignette -> seam. Returns the graded master (PNG buffer) at native size.
// ---------------------------------------------------------------------------
async function composeCandidate(cand) {
  const g = frameLayout(cand);
  console.log(
    `${cand.id}: frame ${g.fw}x${g.fh}, extract [${g.L},${g.T} ${g.W}x${g.H}], theta=${cand.theta}`,
  );
  const bbox = await sharp(SRC_PATH)
    .extract({ left: g.L, top: g.T, width: g.W, height: g.H })
    .png()
    .toBuffer();
  const rot = await sharp(bbox).rotate(cand.theta, { background: BG_HEX }).png().toBuffer();
  const rotMeta = await sharp(rot).metadata();
  const bcx = g.L + g.W / 2;
  const bcy = g.T + g.H / 2;
  const rcx = rotMeta.width / 2 + (g.c * (g.fcx - bcx) - g.s * (g.fcy - bcy));
  const rcy = rotMeta.height / 2 + (g.s * (g.fcx - bcx) + g.c * (g.fcy - bcy));
  const frame = await sharp(rot)
    .extract({
      left: Math.round(rcx - g.fw / 2),
      top: Math.round(rcy - g.fh / 2),
      width: g.fw,
      height: g.fh,
    })
    .png()
    .toBuffer();

  // Grade stage 1: hue/saturation into the blue-slate family.
  const cooled = await sharp(frame)
    .modulate({ saturation: GRADE_SATURATION })
    .tint(GRADE_TINT)
    .png()
    .toBuffer();

  // Grade stage 2: per-channel linear black-point map -> --sky-zenith.
  const floor = await regionPercentile(cooled, DARK_REGION, DARK_PCT);
  const a = floor.map((f, i) => (GRADE_WHITE_OUT - ZENITH[i]) / (GRADE_WHITE_IN - f));
  const b = floor.map((f, i) => ZENITH[i] - a[i] * f);
  console.log(
    `${cand.id}: dark floor p02 [${floor.join(",")}] -> zenith map a=[${a
      .map((v) => v.toFixed(4))
      .join(",")}] b=[${b.map((v) => v.toFixed(2)).join(",")}]`,
  );
  // Grade stage 3: mid-tone pull-down anchored on the zenith floor.
  const k = MIDTONE_SCALE;
  const a2 = a.map((v) => v * k);
  const b2 = b.map((v, i) => v * k + (1 - k) * ZENITH[i]);
  const graded = await sharp(cooled).linear(a2, b2).png().toBuffer();

  // Column vignette + seam ramp (order matters: vignette under seam).
  return sharp(graded)
    .composite([
      { input: Buffer.from(vignetteSvg(g.fw, g.fh)), top: 0, left: 0 },
      { input: Buffer.from(seamSvg(g.fw, g.fh)), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
}

// ---------------------------------------------------------------------------
// Evidence previews: full master + the 1440x900 reference-tier cover window.
// ---------------------------------------------------------------------------
async function writePreviews(cand, masterBuf) {
  const meta = await sharp(masterBuf).metadata();
  await sharp(masterBuf)
    .resize({ width: 1200 })
    .jpeg({ quality: 88 })
    .toFile(join(EVIDENCE_DIR, `${cand.id}-master.jpg`));
  const winW = Math.round(WIN_WIDTH_FRAC * meta.width);
  const winL = Math.round(WIN_LEFT_FRAC * meta.width);
  await sharp(masterBuf)
    .extract({ left: winL, top: 0, width: winW, height: meta.height })
    .resize(1440, 900)
    .jpeg({ quality: 88 })
    .toFile(join(EVIDENCE_DIR, `${cand.id}-window-1440.jpg`));
}

// ---------------------------------------------------------------------------
// 6. Exports for the winner
// ---------------------------------------------------------------------------
async function exportMasters(masterBuf) {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const width of EXPORT_WIDTHS) {
    const resized = await sharp(masterBuf)
      .toColorspace("srgb")
      .resize({ width })
      .png()
      .toBuffer();
    const grained = await withGrain(resized);
    const avifPath = join(OUT_DIR, `milky-way-${width}.avif`);
    const webpPath = join(OUT_DIR, `milky-way-${width}.webp`);
    await grained.clone().avif(AVIF_OPTS).toFile(avifPath);
    await grained.clone().webp(WEBP_OPTS).toFile(webpPath);
    console.log(
      `wrote ${avifPath} (${statSync(avifPath).size} B), ${webpPath} (${statSync(webpPath).size} B)`,
    );
  }
  const lqip = await sharp(masterBuf)
    .toColorspace("srgb")
    .resize({ width: LQIP_WIDTH })
    .webp(LQIP_OPTS)
    .toBuffer();
  const dataUri = `data:image/webp;base64,${lqip.toString("base64")}`;
  writeFileSync(join(OUT_DIR, "milky-way-lqip.txt"), dataUri + "\n");
  console.log(`wrote milky-way-lqip.txt (${lqip.length} B raw, ${dataUri.length} chars)`);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
await ensureSource();
mkdirSync(EVIDENCE_DIR, { recursive: true });

let winnerBuf = null;
for (const cand of CANDIDATES) {
  const master = await composeCandidate(cand);
  await writePreviews(cand, master);
  if (cand.id === WINNER) winnerBuf = master;
}
if (!winnerBuf) throw new Error(`WINNER '${WINNER}' is not a candidate id`);
await exportMasters(winnerBuf);
console.log("build-sky complete.");
