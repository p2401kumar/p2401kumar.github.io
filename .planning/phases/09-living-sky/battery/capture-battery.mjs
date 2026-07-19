#!/usr/bin/env node
// capture-battery.mjs — 09-03 AMB-05 closing-battery CDP capture driver.
// Zero new deps (node built-ins + the repo's transitive sharp for crops);
// CDP scaffolding follows the verify-contrast.mjs / real-soak.mjs pattern.
//
// Produces, under .planning/phases/09-living-sky/battery/:
//   reduced-motion-still-1440x900.png   — the marquee "beautiful still"
//   banding-crop-cloud-band-1440.png    — left-margin cloud band crop (RM still)
//   banding-crop-aurora-band-1440.png   — left-margin aurora band crop (RM still)
//   shed-ladder-375w.png                — tier-3 mobile evidence still
//   capture-report.json                 — every assertion + measured value
//
// Assertions (exit non-zero on any failure):
//   1. REDUCED-MOTION STILL: two full screenshots ~2s apart are BYTE-
//      IDENTICAL; the still carries clouds in BOTH the margins and the
//      content-column band (the 09-02 carried-note fix) plus the aurora.
//   2. PAUSE MACHINE: hidden-tab and fig01-active each freeze the nightsky
//      canvas (canvas dataURL hash pairs ~2s apart identical). (Full-page
//      screenshot pairs are the RM instrument; hidden/fig01 use the canvas
//      hash because the camper-glow CSS pulse legitimately keeps animating
//      outside reduced motion — the pause machine's contract is the canvas.)
//   3. CANVAS NEVER TRANSFORMED: #nightsky-canvas and .nightsky-host
//      computed transform === 'none' at rest AND mid-parallax-nudge
//      (sampled inside the 420ms window while .camper carries a matrix),
//      at BOTH reference viewports.
//   4. SHED LADDER (T-09-08): measured under emulated reduced-motion so
//      the aurora is DETERMINISTIC (fixed mid-breath) and twinkles are
//      absent — the far-only cloud strip (y:0.645-0.685H, full width) is
//      compared by HAZE COVERAGE (fraction of pixels with alpha >= 4;
//      point stars contribute < ~1%, so a >= 2pp coverage drop is far-
//      layer signal, never star noise). deviceMemory 4 at 1440 (tier 1)
//      and 2 (tier 3) must both drop the far coverage vs the tier-0 run;
//      at 375x812 (width-only tier 3, no dm override survives the
//      navigation) near clouds remain legible, parallax still fires
//      (camper matrix mid-window), canvas transform stays 'none'. (At
//      375w the far layer's own pixel signal is sub-quantization —
//      margins are ~18px and the column attenuates to 0.15x — so the far
//      shed there rides the same tier variable proven at 1440.)

import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const OUT = dirname(fileURLToPath(import.meta.url));
const ROOT = join(OUT, "..", "..", "..", "..");
const sharp = createRequire(join(ROOT, "package.json"))("sharp");

const URL_ARG = (() => {
  const i = process.argv.indexOf("--url");
  return i !== -1 ? process.argv[i + 1] : "http://localhost:4321/";
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
      /* keep looking */
    }
  }
  return "chrome";
}

async function launchChrome() {
  const profile = mkdtempSync(join(tmpdir(), "ambient-battery-"));
  const proc = spawn(
    findChrome(),
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      "--window-size=1440,900",
      "about:blank",
    ],
    { stdio: "ignore" }
  );
  let port = null;
  for (let i = 0; i < 100; i++) {
    await sleep(150);
    try {
      port = parseInt(readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0], 10);
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
        "page exception: " + (res.exceptionDetails.exception?.description || res.exceptionDetails.text)
      );
    }
    return res.result.value;
  }
}

async function connectCdp(port) {
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = list.find((t) => t.type === "page");
  if (!target) throw new Error("no page target");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  return new Cdp(ws);
}

// --- page-side helpers -------------------------------------------------

/** Alpha stats inside a fractional rect of the visible canvas: max, mean,
 *  and haze-coverage fractions (alpha >= 2 / >= 4). Point features (stars)
 *  dominate max but contribute < ~1% coverage; broad haze (clouds/aurora)
 *  moves mean + coverage. */
const PROBE_FN = `
  const probe = (x0f, x1f, y0f, y1f) => {
    const c = document.querySelector('#nightsky-canvas');
    if (!c) return null;
    const ctx = c.getContext('2d');
    const d = Math.min(2, window.devicePixelRatio);
    const x = Math.round(x0f * window.innerWidth * d);
    const w = Math.max(1, Math.round((x1f - x0f) * window.innerWidth * d));
    const y = Math.round(y0f * window.innerHeight * d);
    const h = Math.max(1, Math.round((y1f - y0f) * window.innerHeight * d));
    const img = ctx.getImageData(x, y, w, h).data;
    let maxA = 0, sum = 0, c2 = 0, c4 = 0, n = 0;
    for (let i = 3; i < img.length; i += 4) {
      const a = img[i];
      if (a > maxA) maxA = a;
      sum += a; n++;
      if (a >= 2) c2++;
      if (a >= 4) c4++;
    }
    return { max: maxA, mean: +(sum / n).toFixed(2), cover2: +(c2 / n).toFixed(4), cover4: +(c4 / n).toFixed(4) };
  };
`;

async function waitAdopted(cdp) {
  for (let i = 0; i < 240; i++) {
    const ok = await cdp.evaluate(
      `(() => {
        const c = document.querySelector('#nightsky-canvas');
        return document.documentElement.classList.contains('deck-active') && !!c &&
          c.width === Math.round(window.innerWidth * Math.min(2, window.devicePixelRatio)) && c.width !== 300;
      })()`
    );
    if (ok) return;
    await sleep(250);
  }
  throw new Error("page never adopted Layer 0 / deck-active");
}

async function waitAmbient(cdp, { aurora = true } = {}) {
  for (let i = 0; i < 120; i++) {
    const v = await cdp.evaluate(
      `(() => { ${PROBE_FN}
        return { aurora: probe(0.02, 0.13, 0.50, 0.60), cloud: probe(0.02, 0.13, 0.72, 0.84) };
      })()`
    );
    if ((v.cloud?.cover2 ?? 0) > 0.02 && (!aurora || (v.aurora?.mean ?? 0) > 2)) return v;
    await sleep(250);
  }
  throw new Error("ambient probes never went live");
}

async function screenshotB64(cdp) {
  const res = await cdp.send("Page.captureScreenshot", { format: "png" });
  return res.data;
}

async function canvasHash(cdp) {
  return cdp.evaluate(
    `(() => {
      const c = document.querySelector('#nightsky-canvas');
      const s = c.toDataURL('image/png');
      let h = 5381;
      for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
      return { len: s.length, hash: h };
    })()`
  );
}

async function transforms(cdp) {
  return cdp.evaluate(
    `(() => ({
      canvas: getComputedStyle(document.querySelector('#nightsky-canvas')).transform,
      host: getComputedStyle(document.querySelector('.nightsky-host')).transform,
      camper: document.querySelector('.camper') ? getComputedStyle(document.querySelector('.camper')).transform : 'absent',
    }))()`
  );
}

async function setRM(cdp, value) {
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value }],
  });
}

// --- main ---------------------------------------------------------------

const report = { url: URL_ARG, sections: {}, failures: [] };
const check = (name, ok, detail) => {
  report.sections[name] = { pass: !!ok, ...detail };
  const line = `${ok ? "PASS" : "FAIL"}  ${name}  ${JSON.stringify(detail)}`;
  console.log(line);
  if (!ok) report.failures.push(name);
};

async function main() {
  const { proc, port, profile } = await launchChrome();
  try {
    const cdp = await connectCdp(port);
    await cdp.send("Page.enable");

    // ==================== SECTION A — 1440x900 DPR1 ====================
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
    });
    await cdp.send("Page.navigate", { url: URL_ARG });
    await waitAdopted(cdp);
    await waitAmbient(cdp);
    await sleep(1500);
    const dmReal = await cdp.evaluate(`navigator.deviceMemory ?? null`);

    // A1 — canvas transform at rest.
    const rest1440 = await transforms(cdp);
    check("transform-rest-1440", rest1440.canvas === "none" && rest1440.host === "none", rest1440);

    // A2 — REDUCED-MOTION STILL (the marquee) + carried-note probes.
    await setRM(cdp, "reduce");
    await sleep(2000); // static repaint + idle drain-repaint settle
    const rmProbes = await cdp.evaluate(
      `(() => { ${PROBE_FN}
        return {
          rmMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
          auroraMargin: probe(0.02, 0.13, 0.50, 0.60),
          cloudMargin: probe(0.02, 0.13, 0.72, 0.84),
          cloudColumn: probe(0.25, 0.75, 0.72, 0.84),
        };
      })()`
    );
    const rmShot1 = await screenshotB64(cdp);
    await sleep(2000);
    const rmShot2 = await screenshotB64(cdp);
    const rmIdentical = rmShot1 === rmShot2;
    writeFileSync(join(OUT, "reduced-motion-still-1440x900.png"), Buffer.from(rmShot1, "base64"));
    // cloudColumn.max >= 1: the 09-02 carried note was max alpha == 0
    // (clouds entirely ABSENT from the column band in the RM still). With
    // the drain-repaint fix the attenuated (0.15x) column carries cloud
    // alpha at its 1-5/255 quantization floor — the exact value depends on
    // the random cluster layout; presence (nonzero) is the fixed contract,
    // with the strong un-attenuated signal asserted on the margin band.
    check(
      "reduced-motion-still",
      rmIdentical && rmProbes.rmMatches && rmProbes.auroraMargin.mean >= 3 &&
        rmProbes.cloudMargin.cover4 >= 0.08 && rmProbes.cloudColumn.max >= 1,
      { rmIdentical, bytes: Buffer.from(rmShot1, "base64").length, ...rmProbes }
    );

    // A3 — banding crops from the RM still (clouds at PEAK alpha = worst case).
    const still = Buffer.from(rmShot1, "base64");
    await sharp(still).extract({ left: 0, top: 576, width: 280, height: 189 })
      .png().toFile(join(OUT, "banding-crop-cloud-band-1440.png"));
    await sharp(still).extract({ left: 0, top: 441, width: 280, height: 324 })
      .png().toFile(join(OUT, "banding-crop-aurora-band-1440.png"));
    check("banding-crops-written", true, { crops: ["cloud-band", "aurora-band"] });
    await setRM(cdp, "no-preference");
    await sleep(1000);

    // A4 — hidden-tab pause pair (canvas hash).
    await cdp.evaluate(
      `(() => {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        return document.hidden;
      })()`
    );
    await sleep(800);
    const hid1 = await canvasHash(cdp);
    await sleep(2000);
    const hid2 = await canvasHash(cdp);
    check("pause-hidden", hid1.hash === hid2.hash && hid1.len === hid2.len, { hid1, hid2 });
    await cdp.evaluate(
      `(() => {
        delete document.hidden; delete document.visibilityState;
        document.dispatchEvent(new Event('visibilitychange'));
        return document.hidden;
      })()`
    );
    await sleep(500);

    // A5 — fig01-active pause pair (canvas hash).
    await cdp.evaluate(`location.hash = '#fig-01'`);
    let figActive = false;
    for (let i = 0; i < 40; i++) {
      await sleep(150);
      figActive = await cdp.evaluate(
        `document.querySelector('.panel[data-state="active"]')?.getAttribute('data-panel-id') === 'fig-01'`
      );
      if (figActive) break;
    }
    await sleep(1500); // panel transition + cloud-nudge window fully settled
    const fig1 = await canvasHash(cdp);
    await sleep(2000);
    const fig2 = await canvasHash(cdp);
    check("pause-fig01", figActive && fig1.hash === fig2.hash && fig1.len === fig2.len, { figActive, fig1, fig2 });

    // A6 — mid-nudge transform sample (fig-01 -> systems, 420ms window).
    await cdp.evaluate(`location.hash = '#systems'`);
    await sleep(160);
    const nudge1440 = await transforms(cdp);
    check(
      "transform-mid-nudge-1440",
      nudge1440.canvas === "none" && nudge1440.host === "none" && nudge1440.camper !== "none",
      nudge1440
    );

    // ==================== SECTION B — 1280x800 DPR1 ====================
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280, height: 800, deviceScaleFactor: 1, mobile: false,
    });
    await cdp.send("Page.navigate", { url: URL_ARG.split("#")[0] });
    await waitAdopted(cdp);
    await waitAmbient(cdp);
    await sleep(1000);
    const rest1280 = await transforms(cdp);
    check("transform-rest-1280", rest1280.canvas === "none" && rest1280.host === "none", rest1280);
    await cdp.evaluate(`location.hash = '#systems'`);
    await sleep(160);
    const nudge1280 = await transforms(cdp);
    check(
      "transform-mid-nudge-1280",
      nudge1280.canvas === "none" && nudge1280.host === "none" && nudge1280.camper !== "none",
      nudge1280
    );

    // ============= SECTION C — shed ladder via deviceMemory =============
    // Back to 1440 under EMULATED REDUCED MOTION: the static frame is
    // deterministic modulo the random star scatter + sprite layouts —
    // aurora is fixed mid-breath, twinkles/fireflies absent. The far
    // layer's presence is measured as haze COVERAGE (cover4) of the
    // far-only strip y:0.645-0.685H; stars contribute < ~1%, aurora's
    // strip footprint is IDENTICAL across dm states (same width, fixed
    // phase), so a >= 2pp coverage drop is the far layer being shed.
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
    });
    await cdp.send("Page.navigate", { url: URL_ARG.split("#")[0] });
    await waitAdopted(cdp);
    await waitAmbient(cdp);
    await setRM(cdp, "reduce");
    await sleep(2000);
    // Far probe strip: RIGHT margin, far-only altitude. Contents by
    // construction: far clouds at full stencil strength + sparse stars —
    // the aurora is left-margin-only, the moon is left-margin ~0.68H, the
    // Milky Way is the PHOTO (never canvas alpha), near banks start
    // 0.71H. Sparse stars/constellation lines keep cover2 < ~2%.
    const FAR_STRIP = `probe(0.82, 0.98, 0.645, 0.685)`;
    const readFar = async () => cdp.evaluate(`(() => { ${PROBE_FN} return ${FAR_STRIP}; })()`);
    /** Dispatch a synthetic resize (debounce 250ms -> chunked regen ->
     *  re-adoption -> drain-repaint static frame) and poll the strip until
     *  `until` is satisfied or ~10s passes. */
    const rerollUntil = async (until) => {
      await cdp.evaluate(`window.dispatchEvent(new Event('resize'))`);
      let v = null;
      for (let i = 0; i < 20; i++) {
        await sleep(500);
        v = await readFar();
        if (until(v)) break;
      }
      return v;
    };
    // Tier 0 (real deviceMemory, width 1440): far layer live. Re-roll the
    // random sprite layout if it leaves the probe strip nearly empty.
    let s0 = await readFar();
    for (let attempt = 0; attempt < 6 && s0.cover2 < 0.08; attempt++) {
      s0 = await rerollUntil((v) => v.cover2 >= 0.08);
    }
    check("shed-far-present-tier0", s0.cover2 >= 0.08, { s0, deviceMemory: dmReal });

    // dm=4 -> tier 1 (far shed). computeAmbientTier reads navigator.
    // deviceMemory on every adopt; the synthetic resize forces re-adoption.
    await cdp.evaluate(
      `(() => {
        window.__dm = 4;
        Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => window.__dm, configurable: true });
        return navigator.deviceMemory;
      })()`
    );
    const far1 = await rerollUntil((v) => v.cover2 <= 0.03);
    const tier1 = await cdp.evaluate(
      `(() => { ${PROBE_FN}
        return { near: probe(0.02, 0.13, 0.72, 0.84), aurora: probe(0.02, 0.13, 0.50, 0.60), dm: navigator.deviceMemory };
      })()`
    );
    check(
      "shed-tier1-dm4",
      far1.cover2 <= 0.03 && s0.cover2 - far1.cover2 >= 0.05 &&
        tier1.near.cover4 >= 0.05 && tier1.aurora.mean >= 3 && tier1.dm === 4,
      { tier0FarCover2: s0.cover2, far: far1, ...tier1 }
    );

    // dm=2 -> tier 3 (far shed + aurora shape throttle 9 + chromatic
    // drop; the latter two are wired in scene.ts's adoptLayer0 — grep-
    // verified — and have no static-screenshot signature by design).
    await cdp.evaluate(`window.__dm = 2`);
    const far3 = await rerollUntil((v) => v.cover2 <= 0.03);
    const tier3 = await cdp.evaluate(
      `(() => { ${PROBE_FN}
        return { near: probe(0.02, 0.13, 0.72, 0.84), dm: navigator.deviceMemory };
      })()`
    );
    check(
      "shed-tier3-dm2",
      far3.cover2 <= 0.03 && tier3.near.cover4 >= 0.05 && tier3.dm === 2,
      { tier0FarCover2: s0.cover2, far: far3, ...tier3 }
    );
    await setRM(cdp, "no-preference");

    // ================= SECTION D — 375x812 mobile still =================
    // The navigation drops the deviceMemory override, so this run proves
    // the WIDTH-ONLY path: 375 < 390 -> tier 3 regardless of dm. The far
    // layer's own pixel signal is sub-quantization at this width (margins
    // ~18px, column attenuation 0.15 -> far <= 3/255), so the far shed
    // rides the tier variable proven in Section C; asserted here: near
    // clouds legible, aurora gracefully absent (margin < 48px), canvas
    // never transformed, parallax intact.
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 375, height: 812, deviceScaleFactor: 2, mobile: true,
    });
    await cdp.send("Page.navigate", { url: URL_ARG.split("#")[0] });
    await waitAdopted(cdp);
    // Aurora will NOT render (left margin < 48px — graceful empty); wait on clouds only.
    await waitAmbient(cdp, { aurora: false });
    await sleep(1500);
    const mob = await cdp.evaluate(
      `(() => { ${PROBE_FN}
        return {
          dm: navigator.deviceMemory ?? null,
          near: probe(0.0, 1.0, 0.72, 0.84),
          auroraStrip: probe(0.0, 0.045, 0.50, 0.60),
          canvas: getComputedStyle(document.querySelector('#nightsky-canvas')).transform,
          host: getComputedStyle(document.querySelector('.nightsky-host')).transform,
        };
      })()`
    );
    const mobShot = await screenshotB64(cdp);
    writeFileSync(join(OUT, "shed-ladder-375w.png"), Buffer.from(mobShot, "base64"));
    check(
      "shed-mobile-375w",
      mob.near.cover4 >= 0.03 && mob.auroraStrip.mean < 6 && mob.canvas === "none" && mob.host === "none",
      mob
    );

    // Parallax intact at tier 3 (NEVER sheds): camper matrix mid-window.
    await cdp.evaluate(`location.hash = '#systems'`);
    await sleep(160);
    const mobNudge = await transforms(cdp);
    check(
      "parallax-intact-375w",
      mobNudge.camper !== "none" && mobNudge.camper !== "absent" && mobNudge.canvas === "none",
      mobNudge
    );

    writeFileSync(join(OUT, "capture-report.json"), JSON.stringify(report, null, 2));
    if (report.failures.length) {
      console.error(`\nFAILURES: ${report.failures.join(", ")}`);
      process.exit(1);
    }
    console.log("\nALL CAPTURE-BATTERY CHECKS PASS");
  } finally {
    proc.kill();
    await sleep(300);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
