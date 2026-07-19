#!/usr/bin/env node
// soak.mjs — 07-02 Spike 2: glass-over-animating-canvas CPU soak driver.
//
// Two-run protocol (07-RESEARCH.md §3.2, same Performance.getMetrics
// methodology that produced 05-06's 5.6%/60s baseline):
//   1. BASELINE  harness.html?glass=0  (real sky master + real scene engine,
//                4 glass divs display:none)                     60s soak
//   2. GLASS     harness.html?glass=1  (same page, 4 backdrop-filter
//                blur(12px) saturate(150%) surfaces visible)    60s soak
//   MARGINAL = GLASS CPU% - BASELINE CPU%   <- the re-scope gate number
// Optional third run: --blur16 adds harness.html?glass=1&blur=16 (radius-
// sensitivity probe for Phase 8; cost scales ~radius^2 per GLASS.md §1.2).
//
// Recorded per run (05-06 frame-cost-audit table shape): wall-clock,
// TaskDuration delta -> CPU%, ScriptDuration delta, LayoutDuration delta
// (target 0.000s — blur is a compositor op, not layout), long-task count
// (target 0), realized fps (target 60.0).
//
// Zero new dependency (T-07-SC): node 22 built-ins + the esbuild already
// present transitively under node_modules (vite/astro dependency — used
// only to bundle the REAL src/lib/nightsky/scene.ts into an importable
// ESM file in a temp dir; nothing is installed, package.json untouched).
// The findChrome/launchChrome/Cdp/connectCdp pieces below are reused
// VERBATIM from scripts/verify-contrast.mjs (05-06's proven zero-dep CDP
// pattern), including the finally-block proc.kill() + tmp-profile cleanup
// (T-07-03 mitigation).
//
// Headless "new" mode = software rasterization — conservative vs real GPU,
// so a passing number is a safe lower bound (05-06 precedent). DPR1 at
// 1440x900 via Emulation.setDeviceMetricsOverride (exact viewport; the
// known Windows DSF-2 screenshot hang is irrelevant — no screenshots here).
//
// Usage:  node .planning/phases/07-real-sky-foundation/spike-glass/soak.mjs [--blur16] [--soak-ms=60000]

import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// spike-glass -> 07-real-sky-foundation -> phases -> .planning -> project root
const projectRoot = resolve(__dirname, "../../../..");

const SOAK_MS = (() => {
  const arg = process.argv.find((a) => a.startsWith("--soak-ms="));
  return arg ? Math.max(1000, parseInt(arg.split("=")[1], 10) || 60000) : 60000;
})();
const SETTLE_MS = 3000;
/** Unmeasured warm-up on the baseline URL before ANY measured run: first-load
 * transients (AVIF decode, SwiftShader shader/raster cache warm-up, font/
 * style first-paint work) otherwise contaminate whichever run goes first —
 * observed directly in this spike's shakedown (first-run whole-tree CPU read
 * ~2x the steady state). */
const WARMUP_MS = 15000;
const VIEW_W = 1440;
const VIEW_H = 900;

// ---------------------------------------------------------------------------
// Bundle the REAL engine (src/lib/nightsky/scene.ts) to a temp ESM file.
// esbuild only strips types/bundles the module graph — the measured code is
// the live engine, not a re-implementation.
// ---------------------------------------------------------------------------

function bundleScene() {
  const req = createRequire(join(projectRoot, "package.json"));
  const esbuild = req("esbuild");
  const dir = mkdtempSync(join(tmpdir(), "spike-glass-bundle-"));
  const outfile = join(dir, "scene-bundle.mjs");
  esbuild.buildSync({
    entryPoints: [join(projectRoot, "src", "lib", "nightsky", "scene.ts")],
    bundle: true,
    format: "esm",
    target: "es2022",
    outfile,
  });
  return { dir, outfile };
}

// ---------------------------------------------------------------------------
// Tiny static server: harness.html + the scene bundle + /sky/ masters.
// ---------------------------------------------------------------------------

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".avif": "image/avif",
  ".webp": "image/webp",
};

function startServer(bundlePath) {
  const server = createServer((reqst, res) => {
    const url = new URL(reqst.url, "http://127.0.0.1");
    let file = null;
    if (url.pathname === "/" || url.pathname === "/harness.html") {
      file = join(__dirname, "harness.html");
    } else if (url.pathname === "/scene-bundle.mjs") {
      file = bundlePath;
    } else if (url.pathname.startsWith("/sky/")) {
      const name = basename(url.pathname);
      if (/^[\w.-]+$/.test(name)) file = join(projectRoot, "public", "sky", name);
    }
    if (!file) {
      res.writeHead(404).end("not found");
      return;
    }
    try {
      const body = readFileSync(file);
      const ext = file.slice(file.lastIndexOf("."));
      res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  return new Promise((resolveP) => {
    server.listen(0, "127.0.0.1", () => resolveP({ server, port: server.address().port }));
  });
}

// ---------------------------------------------------------------------------
// CDP automation — reused VERBATIM from scripts/verify-contrast.mjs
// (zero-dep: node 22 built-in WebSocket + headless Chrome).
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
  const profile = mkdtempSync(join(tmpdir(), "spike-glass-soak-"));
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
// Supplementary whole-browser CPU (Windows): cumulative kernel+user CPU time
// (ms) summed over the ENTIRE Chrome process tree rooted at the spawned pid.
//
// WHY (methodology honesty note): Performance.getMetrics TaskDuration is the
// RENDERER MAIN THREAD only — but backdrop-filter blur executes in the
// compositor (viz, hosted in the GPU process). The 05-06 marginal keys the
// verdict (same-methodology comparability), but without this cross-check a
// near-zero main-thread marginal could silently hide the real blur cost in
// another process. Sampled once before and once after each soak (best-effort;
// returns null off-Windows or on failure — never fails the soak).
// ---------------------------------------------------------------------------

function sampleTreeCpuMs(rootPid) {
  if (process.platform !== "win32") return null;
  const ps = `
$procs = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Select-Object ProcessId,ParentProcessId,KernelModeTime,UserModeTime
$children = @{}
$byId = @{}
foreach ($p in $procs) {
  $byId[[uint32]$p.ProcessId] = $p
  $ppid = [uint32]$p.ParentProcessId
  if (-not $children.ContainsKey($ppid)) { $children[$ppid] = @() }
  $children[$ppid] += [uint32]$p.ProcessId
}
$total = [double]0
$queue = New-Object System.Collections.Queue
$queue.Enqueue([uint32]${rootPid})
while ($queue.Count -gt 0) {
  $id = $queue.Dequeue()
  if ($byId.ContainsKey($id)) { $total += ($byId[$id].KernelModeTime + $byId[$id].UserModeTime) }
  if ($children.ContainsKey($id)) { foreach ($c in $children[$id]) { $queue.Enqueue($c) } }
}
[Console]::Out.Write(($total / 10000).ToString([System.Globalization.CultureInfo]::InvariantCulture))
`;
  // spawnSync blocks node's event loop for the PS call's ~1-2s — that is why
  // callers must NOT let this window leak into any per-second normalization
  // (fps is snapshotted at the getMetrics moments; the tree wall clock uses
  // the midpoint of each PS call).
  try {
    const start = performance.now();
    const res = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], {
      encoding: "utf8",
      timeout: 30000,
    });
    const end = performance.now();
    const v = Number.parseFloat(res.stdout);
    return Number.isFinite(v) ? { cpuMs: v, atMs: (start + end) / 2 } : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// The soak itself.
// ---------------------------------------------------------------------------

function metricsMap(result) {
  const map = {};
  for (const { name, value } of result.metrics) map[name] = value;
  return map;
}

async function runSoak(cdp, url, label, chromePid) {
  process.stderr.write(`\n[soak] ${label}\n[soak] navigate ${url}\n`);
  await cdp.send("Page.navigate", { url });

  // Wait for boot + Layer-0 adoption: sizeVisibleCanvas() sets the visible
  // canvas backing store to viewport width at DPR1 only once the engine has
  // adopted a generated Layer 0 (until then it sits at the 300px default).
  let adopted = false;
  for (let i = 0; i < 240; i++) {
    await sleep(250);
    adopted = await cdp.evaluate(
      `(() => {
        const c = document.querySelector('#nightsky-canvas');
        return !!window.__harnessBooted && !!c &&
          c.width === Math.round(window.innerWidth * window.devicePixelRatio) &&
          c.width !== 300;
      })()`
    );
    if (adopted) break;
  }
  if (!adopted) throw new Error(`[${label}] scene never adopted Layer 0`);

  const env = await cdp.evaluate(
    `(() => ({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio,
       glassVisible: [...document.querySelectorAll('.glass')].filter(g => getComputedStyle(g).display !== 'none').length,
       filter: document.querySelector('.glass') ? (document.querySelector('.glass').style.backdropFilter || getComputedStyle(document.querySelector('.glass')).backdropFilter) : 'n/a' }))()`
  );
  process.stderr.write(
    `[soak] viewport ${env.w}x${env.h} @dpr${env.dpr} | glass surfaces painted: ${env.glassVisible} | filter: ${env.filter}\n`
  );

  await sleep(SETTLE_MS); // let init transients (idle-chunked Layer-0 gen) fully clear

  await cdp.send("Performance.enable");
  await cdp.evaluate(
    `(() => {
      window.__soak = { frames: 0, longTasks: 0 };
      const loop = () => { window.__soak.frames++; window.__soak.rafId = requestAnimationFrame(loop); };
      window.__soak.rafId = requestAnimationFrame(loop);
      window.__soak.obs = new PerformanceObserver((list) => {
        window.__soak.longTasks += list.getEntries().length;
      });
      window.__soak.obs.observe({ entryTypes: ['longtask'] });
      return 'installed';
    })()`
  );

  const tree0 = sampleTreeCpuMs(chromePid);
  const m0 = metricsMap(await cdp.send("Performance.getMetrics"));
  // Snapshot the frame counter AT the soak-window edges (the PS tree samples
  // block node for seconds while the page keeps animating — frames counted
  // outside m0..m1 must not leak into fps).
  const f0 = await cdp.evaluate(`window.__soak.frames`);
  await sleep(SOAK_MS);
  const m1 = metricsMap(await cdp.send("Performance.getMetrics"));
  const f1 = await cdp.evaluate(`window.__soak.frames`);
  const tree1 = sampleTreeCpuMs(chromePid);
  const counters = await cdp.evaluate(
    `(() => {
      cancelAnimationFrame(window.__soak.rafId);
      window.__soak.obs.disconnect();
      return { longTasks: window.__soak.longTasks };
    })()`
  );

  // Wall clock from the renderer's own monotonic Timestamp metric (seconds).
  const wallS = m1.Timestamp - m0.Timestamp;
  const taskS = m1.TaskDuration - m0.TaskDuration;
  const scriptS = m1.ScriptDuration - m0.ScriptDuration;
  const layoutS = m1.LayoutDuration - m0.LayoutDuration;
  const run = {
    label,
    url,
    viewport: `${env.w}x${env.h}@dpr${env.dpr}`,
    glassSurfaces: env.glassVisible,
    wallS,
    taskS,
    cpuPct: (taskS / wallS) * 100,
    scriptS,
    layoutS,
    longTasks: counters.longTasks,
    fps: (f1 - f0) / wallS,
    // Supplementary whole-process-tree CPU% (renderer + GPU/viz + browser +
    // utility). null if sampling was unavailable.
    treeCpuPct:
      tree0 !== null && tree1 !== null
        ? ((tree1.cpuMs - tree0.cpuMs) / (tree1.atMs - tree0.atMs)) * 100
        : null,
  };
  process.stderr.write(
    `[soak] done: CPU ${run.cpuPct.toFixed(2)}% | task ${taskS.toFixed(3)}s / wall ${wallS.toFixed(1)}s | ` +
      `script ${scriptS.toFixed(3)}s | layout ${layoutS.toFixed(3)}s | longtasks ${run.longTasks} | fps ${run.fps.toFixed(1)}` +
      (run.treeCpuPct !== null ? ` | tree CPU ${run.treeCpuPct.toFixed(2)}%` : "") +
      `\n`
  );
  return run;
}

function printTable(runs) {
  const rows = [
    ["run", "viewport", "wall (s)", "TaskDur Δ (s)", "CPU %", "ScriptDur Δ (s)", "LayoutDur Δ (s)", "long tasks", "fps", "tree CPU %"],
    ...runs.map((r) => [
      r.label,
      r.viewport,
      r.wallS.toFixed(1),
      r.taskS.toFixed(3),
      r.cpuPct.toFixed(2),
      r.scriptS.toFixed(3),
      r.layoutS.toFixed(3),
      String(r.longTasks),
      r.fps.toFixed(1),
      r.treeCpuPct !== null ? r.treeCpuPct.toFixed(2) : "n/a",
    ]),
  ];
  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)));
  for (const row of rows) {
    console.log("| " + row.map((c, i) => c.padEnd(widths[i])).join(" | ") + " |");
  }
}

async function main() {
  const wantBlur16 = process.argv.includes("--blur16");
  console.log(`[soak] Spike 2 CPU soak — ${SOAK_MS / 1000}s per run, ${VIEW_W}x${VIEW_H} DPR1, headless=new (software raster)`);

  const { dir: bundleDir, outfile: bundlePath } = bundleScene();
  console.log(`[soak] real engine bundled: src/lib/nightsky/scene.ts -> ${bundlePath}`);
  const { server, port: srvPort } = await startServer(bundlePath);
  const { proc, port: cdpPort, profile } = await launchChrome(VIEW_W, VIEW_H);
  try {
    const cdp = await connectCdp(cdpPort);
    await cdp.send("Page.enable");
    // Exact DPR1 1440x900 viewport (headless --window-size includes browser
    // chrome height; the override removes that ambiguity — 05-06 noted it).
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: VIEW_W,
      height: VIEW_H,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const base = `http://127.0.0.1:${srvPort}/harness.html`;
    process.stderr.write(`\n[soak] warm-up: ${WARMUP_MS / 1000}s unmeasured settle on the baseline page\n`);
    await cdp.send("Page.navigate", { url: `${base}?glass=0` });
    await sleep(WARMUP_MS);

    const baseline = await runSoak(cdp, `${base}?glass=0`, "baseline: scene alone", proc.pid);
    const glass = await runSoak(cdp, `${base}?glass=1`, "glass: scene + 4x blur(12px)", proc.pid);
    const runs = [baseline, glass];
    if (wantBlur16) {
      runs.push(await runSoak(cdp, `${base}?glass=1&blur=16`, "sensitivity: 4x blur(16px)", proc.pid));
    }

    console.log("");
    printTable(runs);
    const marginal = glass.cpuPct - baseline.cpuPct;
    console.log("");
    console.log(`MARGINAL (glass - baseline): ${marginal >= 0 ? "+" : ""}${marginal.toFixed(2)} percentage points`);
    console.log(`TOTAL with glass:            ${glass.cpuPct.toFixed(2)}% (floor: total < 10%, marginal <= 2-3%p)`);
    if (baseline.treeCpuPct !== null && glass.treeCpuPct !== null) {
      const treeMarginal = glass.treeCpuPct - baseline.treeCpuPct;
      console.log(
        `tree-CPU cross-check:        marginal ${treeMarginal >= 0 ? "+" : ""}${treeMarginal.toFixed(2)}p ` +
          `(whole Chrome process tree incl. compositor/viz: ${baseline.treeCpuPct.toFixed(2)}% -> ${glass.treeCpuPct.toFixed(2)}%)`
      );
    }
    if (wantBlur16) {
      const b16 = runs[2].cpuPct - baseline.cpuPct;
      console.log(`blur(16px) marginal:         ${b16 >= 0 ? "+" : ""}${b16.toFixed(2)} percentage points (radius sensitivity vs 12px: ${(b16 - marginal).toFixed(2)}p)`);
    }
    console.log("");
    console.log(JSON.stringify({ runs, marginalPct: marginal }, null, 2));
  } finally {
    // T-07-03 mitigation: never leave a headless Chrome or its tmp profile.
    proc.kill();
    server.close();
    await sleep(300);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* profile dir may be briefly locked on Windows — best effort */
    }
    try {
      rmSync(bundleDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
