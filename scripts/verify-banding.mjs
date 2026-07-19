// scripts/verify-banding.mjs — histogram comb-spike banding detector for the
// Phase 7 sky masters (IMG-03). Zero-dep, sharp-only (sharp is already
// present via Astro). Part of the repo's gate battery — mirrors
// verify-contrast.mjs's --selftest doctrine: the detection formula is proven
// against known-good/known-bad fixtures before it is trusted on real files.
//
// Modes:
//
//   node scripts/verify-banding.mjs --selftest [--emit <dir>]
//     Builds the two synthetic controls from 07-RESEARCH.md section 2.2:
//       clean  — --sky-zenith(5,7,10) -> --sky-horizon(20,26,44) vertical
//                gradient + light pre-encode noise + 10-bit AVIF q60 effort 7
//       banded — the same gradient posterized to 24 levels, then a harsh
//                8-bit JPEG q35 re-encode, no grain
//     Asserts the clean control PASSES and the banded control FAILS.
//     Exits non-zero if either regresses. --emit writes both control images
//     (PNG) to <dir> for the human-eyeball record.
//
//   node scripts/verify-banding.mjs [file...]
//     Runs the detector against each file (defaults to the four committed
//     public/sky/ masters). For each file two genuinely-smooth dark
//     sub-regions are scanned (NOT the whole busy frame — 07-RESEARCH.md
//     section 2.3 methodology): the top dark sky and the seam-ramp blend
//     band. Exits non-zero if any region of any file fails.
//
//   node scripts/verify-banding.mjs --make-control <in> <out>
//     Writes a deliberately-banded re-encode of <in> (posterize 24 levels +
//     JPEG q35) for side-by-side human comparison.
//
// DETECTION SIGNAL (validated in 07-RESEARCH.md section 2.1-2.2): a smooth
// gradient's dark-range luminance histogram is one continuous run of
// populated bins; a banded/quantized one fractures into disconnected runs
// separated by zero-count gaps.
// FAIL threshold: runsAboveZero > 3 OR zeroGaps >= 2 within the darkest-
// quartile populated range.
//
// TOKEN PROVENANCE: RGB literals below mirror src/styles/tokens.css
// (--sky-zenith #05070a, --sky-horizon #141a2c) — build-time Node script,
// CSS zero-hex doctrine does not apply; update both if tokens change.

import sharp from "sharp";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const ZENITH = [5, 7, 10]; // --sky-zenith
const HORIZON = [20, 26, 44]; // --sky-horizon

// FAIL if runsAboveZero > MAX_RUNS or zeroGaps >= MAX_GAPS in the scanned range.
const MAX_RUNS = 3;
const MAX_GAPS = 2;
// Darkest-quartile ceiling — analysis never looks above this luminance bin.
const DARK_CEILING = 63;

// Smooth dark sub-regions of the sky masters (frame fractions).
// Region choice per 07-RESEARCH.md section 2.3: isolate genuinely smooth
// dark areas away from the bright galactic core (master x ~0.77-0.90).
const SCAN_REGIONS = [
  { name: "top-dark-sky", x0: 0.02, x1: 0.45, y0: 0.02, y1: 0.18 },
  { name: "seam-ramp", x0: 0.05, x1: 0.55, y0: 0.74, y1: 0.92 },
];

const DEFAULT_FILES = [
  "public/sky/milky-way-2560.avif",
  "public/sky/milky-way-1920.avif",
  "public/sky/milky-way-2560.webp",
  "public/sky/milky-way-1920.webp",
].map((p) => join(ROOT, ...p.split("/")));

// ---------------------------------------------------------------------------
// Core formulas (07-RESEARCH.md section 2.1 — lifted shape, verified there)
// ---------------------------------------------------------------------------
async function luminanceHistogram(input, extract) {
  let pipe = sharp(input);
  if (extract) pipe = pipe.extract(extract);
  const { data, info } = await pipe.raw().toBuffer({ resolveWithObject: true });
  const hist = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += info.channels) {
    const lum = Math.round(
      0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2],
    );
    hist[lum]++;
  }
  return hist;
}

/** Scans luminance range [lo,hi] for the comb-spike signature: disconnected
 * runs of populated histogram bins separated by zero-count gaps. */
function combSpikeScore(hist, lo, hi) {
  const slice = hist.slice(lo, hi + 1);
  let zeroGaps = 0;
  let runsAboveZero = 0;
  let inRun = false;
  for (let i = 0; i < slice.length; i++) {
    if (slice[i] === 0) {
      inRun = false;
    } else if (!inRun) {
      runsAboveZero++;
      inRun = true;
    }
  }
  for (let i = 1; i < slice.length - 1; i++) {
    if (slice[i] === 0 && slice[i - 1] > 0 && slice.slice(i + 1, i + 4).some((v) => v > 0))
      zeroGaps++;
  }
  return {
    zeroGaps,
    runsAboveZero,
    nonzeroBins: slice.filter((v) => v > 0).length,
    totalBins: slice.length,
  };
}

/** Evaluate a histogram within the darkest quartile, trimmed to the
 * populated bin range (leading/trailing empty bins are not evidence). */
function evaluate(hist) {
  let lo = -1;
  let hi = -1;
  for (let i = 0; i <= DARK_CEILING; i++) {
    if (hist[i] > 0) {
      if (lo < 0) lo = i;
      hi = i;
    }
  }
  if (lo < 0) return { pass: false, reason: "no pixels in darkest quartile" };
  const score = combSpikeScore(hist, lo, hi);
  const pass = score.runsAboveZero <= MAX_RUNS && score.zeroGaps < MAX_GAPS;
  return { pass, lo, hi, ...score };
}

// ---------------------------------------------------------------------------
// Synthetic controls (07-RESEARCH.md section 2.2)
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

const CTRL_W = 640;
const CTRL_H = 400;

function syntheticGradient({ noiseAmp, posterizeLevels }) {
  const data = Buffer.alloc(CTRL_W * CTRL_H * 3);
  const rnd = mulberry32(0x5eed);
  for (let y = 0; y < CTRL_H; y++) {
    const t = y / (CTRL_H - 1);
    for (let x = 0; x < CTRL_W; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let v = ZENITH[ch] + t * (HORIZON[ch] - ZENITH[ch]);
        if (noiseAmp) v += (rnd() * 2 - 1) * noiseAmp;
        if (posterizeLevels) {
          const step = 255 / (posterizeLevels - 1);
          v = Math.round(v / step) * step;
        }
        v = Math.round(v);
        data[(y * CTRL_W + x) * 3 + ch] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
  }
  return sharp(data, { raw: { width: CTRL_W, height: CTRL_H, channels: 3 } });
}

async function buildCleanControl() {
  // Clean pipeline: light pre-noise + 10-bit AVIF (the anti-banding recipe).
  const avif = await syntheticGradient({ noiseAmp: 1.5 })
    .avif({ quality: 60, bitdepth: 10, chromaSubsampling: "4:4:4", effort: 7 })
    .toBuffer();
  return avif;
}

async function buildBandedControl() {
  // Deliberately banded: posterize to 24 levels, harsh 8-bit JPEG, no grain.
  const jpeg = await syntheticGradient({ posterizeLevels: 24 })
    .jpeg({ quality: 35 })
    .toBuffer();
  return jpeg;
}

async function selftest(emitDir) {
  console.log("verify-banding --selftest (comb-spike detector fixtures)");
  const clean = await buildCleanControl();
  const banded = await buildBandedControl();

  const cleanRes = evaluate(await luminanceHistogram(clean));
  const bandedRes = evaluate(await luminanceHistogram(banded));

  console.log(
    `  clean  (10-bit AVIF q60 + pre-noise): runsAboveZero=${cleanRes.runsAboveZero} ` +
      `zeroGaps=${cleanRes.zeroGaps} bins=${cleanRes.nonzeroBins}/${cleanRes.totalBins} ` +
      `range=[${cleanRes.lo},${cleanRes.hi}] -> ${cleanRes.pass ? "PASS" : "FAIL"}`,
  );
  console.log(
    `  banded (posterized 24 + JPEG q35):    runsAboveZero=${bandedRes.runsAboveZero} ` +
      `zeroGaps=${bandedRes.zeroGaps} bins=${bandedRes.nonzeroBins}/${bandedRes.totalBins} ` +
      `range=[${bandedRes.lo},${bandedRes.hi}] -> ${bandedRes.pass ? "PASS" : "FAIL"}`,
  );

  if (emitDir) {
    mkdirSync(emitDir, { recursive: true });
    // Upscale 2x so 8-bit steps stay visible on any viewer's display.
    await sharp(clean).resize(CTRL_W * 2).png().toFile(join(emitDir, "selftest-clean.png"));
    await sharp(banded).resize(CTRL_W * 2).png().toFile(join(emitDir, "selftest-banded.png"));
    console.log(`  controls written to ${emitDir}`);
  }

  if (!cleanRes.pass) {
    console.error("SELFTEST FAILED: the clean control must PASS");
    process.exit(1);
  }
  if (bandedRes.pass) {
    console.error("SELFTEST FAILED: the deliberately-banded control must FAIL");
    process.exit(1);
  }
  console.log("selftest OK: clean passes, banded control fails.");
}

// ---------------------------------------------------------------------------
// Real-master scan
// ---------------------------------------------------------------------------
async function scanFile(file) {
  const meta = await sharp(file).metadata();
  let ok = true;
  console.log(`${file} (${meta.width}x${meta.height} ${meta.format})`);
  for (const r of SCAN_REGIONS) {
    const extract = {
      left: Math.floor(r.x0 * meta.width),
      top: Math.floor(r.y0 * meta.height),
      width: Math.floor((r.x1 - r.x0) * meta.width),
      height: Math.floor((r.y1 - r.y0) * meta.height),
    };
    const res = evaluate(await luminanceHistogram(file, extract));
    console.log(
      `  ${r.name.padEnd(14)} runsAboveZero=${res.runsAboveZero} zeroGaps=${res.zeroGaps} ` +
        `bins=${res.nonzeroBins}/${res.totalBins} range=[${res.lo},${res.hi}] -> ` +
        `${res.pass ? "PASS" : "FAIL"}`,
    );
    if (!res.pass) ok = false;
  }
  return ok;
}

async function makeControl(inFile, outFile) {
  const { data, info } = await sharp(inFile).raw().toBuffer({ resolveWithObject: true });
  const step = 255 / 23; // 24 levels
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.round(Math.round(data[i] / step) * step);
  }
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .jpeg({ quality: 35 })
    .toFile(outFile);
  console.log(`banded control written: ${outFile}`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
if (args.includes("--selftest")) {
  const emitIdx = args.indexOf("--emit");
  await selftest(emitIdx >= 0 ? args[emitIdx + 1] : null);
} else if (args.includes("--make-control")) {
  const i = args.indexOf("--make-control");
  await makeControl(args[i + 1], args[i + 2]);
} else {
  const files = args.length ? args : DEFAULT_FILES;
  let allOk = true;
  for (const f of files) {
    if (!(await scanFile(f))) allOk = false;
  }
  if (!allOk) {
    console.error("BANDING DETECTED — retune quality/effort/grain and re-encode.");
    process.exit(1);
  }
  console.log("all files pass the banding gate.");
}
