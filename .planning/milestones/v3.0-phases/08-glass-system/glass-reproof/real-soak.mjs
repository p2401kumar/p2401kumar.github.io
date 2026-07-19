#!/usr/bin/env node
// real-soak.mjs — 08-03 GLS-04: glass idle-CPU re-proof on the REAL page.
//
// Same Performance.getMetrics methodology that produced 05-06's 5.6%/60s
// baseline and 07-02's Spike-2 numbers (see spike-glass/soak.mjs, from which
// the launchChrome/Cdp/connectCdp/sampleTreeCpuMs pieces below are reused
// VERBATIM) — but against the BUILT PREVIEW PAGE, not a harness:
//
//   1. navigate the real page once, 15s unmeasured warm-up
//   2. BASELINE run — CDP Emulation.setEmulatedMedia emulates
//      prefers-reduced-transparency: reduce  -> glass collapses to solid
//      (zero backdrop-filter rules match; 08-02 verified this emulation
//      path works against the shipped additive @media gate)          60s
//   3. GLASS run — same page, emulated no-preference -> glass live   60s
//   MARGINAL = GLASS CPU% - BASELINE CPU%   <- vs Spike-2's +0.47pp
//
// Recorded per run (05-06 table shape): wall clock, TaskDuration delta ->
// CPU%, ScriptDuration delta, LayoutDuration delta (target 0.000s — blur is
// a compositor op, not layout), long-task count (target 0), realized fps
// (target 60.0), plus the whole-Chrome-process-tree CPU cross-check
// (supplementary; renderer TaskDuration is blind to compositor blur cost).
//
// Zero new dependency (T-08-SC): node built-ins only. Headless "new" mode =
// software rasterization — conservative vs real GPU (05-06 precedent).
// DPR1 at exactly 1440x900 via Emulation.setDeviceMetricsOverride.
//
// Usage: node .planning/phases/08-glass-system/glass-reproof/real-soak.mjs \
//          [--url http://localhost:4321/] [--soak-ms=60000]
//        (npm run preview must already be serving dist on the target URL)

import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const argValue = (name) => {
  const arg = process.argv.find((a) => a.startsWith(`${name}=`));
  return arg ? arg.split("=").slice(1).join("=") : null;
};
const URL_ARG = (() => {
  const i = process.argv.indexOf("--url");
  return i !== -1 ? process.argv[i + 1] : argValue("--url") || "http://localhost:4321/";
})();
const SOAK_MS = Math.max(1000, parseInt(argValue("--soak-ms") || "60000", 10) || 60000);
const SETTLE_MS = 3000;
const WARMUP_MS = 15000; // unmeasured — first-load transients (AVIF decode, SwiftShader cache warm-up)
const VIEW_W = 1440;
const VIEW_H = 900;

// ---------------------------------------------------------------------------
// CDP automation — reused VERBATIM from spike-glass/soak.mjs (itself lifted
// from scripts/verify-contrast.mjs, 05-06's proven zero-dep CDP pattern).
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
      /* keep looking */
    }
  }
  return "chrome";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchChrome(width, height) {
  const profile = mkdtempSync(join(tmpdir(), "glass-reproof-soak-"));
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
  const target = list.find((t) => t.type === "page");
  if (!target) throw new Error("no page target");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  return new Cdp(ws);
}

// ---------------------------------------------------------------------------
// Supplementary whole-browser CPU (Windows) — verbatim from soak.mjs.
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
// The soak itself — same measurement window as soak.mjs's runSoak, but the
// page is navigated ONCE; glass is toggled per run via emulated media
// (prefers-reduced-transparency reduce vs no-preference) so BOTH runs
// measure the identical real page.
// ---------------------------------------------------------------------------

function metricsMap(result) {
  const map = {};
  for (const { name, value } of result.metrics) map[name] = value;
  return map;
}

async function setReducedTransparency(cdp, value) {
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-transparency", value }],
  });
}

/** Visible-element census of live backdrop-filter surfaces + spot computed
 *  styles — run OUTSIDE the measurement window (full DOM walk is not free). */
async function glassCensus(cdp) {
  return cdp.evaluate(
    `(() => {
      const bfOf = (el) => {
        const s = getComputedStyle(el);
        const bf = s.backdropFilter && s.backdropFilter !== 'none' ? s.backdropFilter
          : (s.webkitBackdropFilter && s.webkitBackdropFilter !== 'none' ? s.webkitBackdropFilter : null);
        return bf;
      };
      const live = [...document.querySelectorAll('*')].filter(
        (el) => bfOf(el) && el.getClientRects().length > 0
      );
      const active = document.querySelector('.panel[data-state="active"]');
      const header = document.querySelector('header');
      return {
        reducedMatches: matchMedia('(prefers-reduced-transparency: reduce)').matches,
        liveGlassSurfaces: live.length,
        surfaces: live.map((el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''))),
        activePanelBF: active ? (bfOf(active) || 'none') : 'n/a',
        headerBF: header ? (bfOf(header) || 'none') : 'n/a',
      };
    })()`
  );
}

async function runSoak(cdp, label, chromePid) {
  process.stderr.write(`\n[soak] ${label}\n`);

  const census = await glassCensus(cdp);
  process.stderr.write(
    `[soak] reduced-transparency matches: ${census.reducedMatches} | live glass surfaces: ${census.liveGlassSurfaces}` +
      ` [${census.surfaces.join(", ")}] | active panel bf: ${census.activePanelBF} | header bf: ${census.headerBF}\n`
  );

  await sleep(SETTLE_MS); // let the style-recalc / repaint transient clear

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

  const wallS = m1.Timestamp - m0.Timestamp;
  const taskS = m1.TaskDuration - m0.TaskDuration;
  const scriptS = m1.ScriptDuration - m0.ScriptDuration;
  const layoutS = m1.LayoutDuration - m0.LayoutDuration;
  const run = {
    label,
    glassSurfaces: census.liveGlassSurfaces,
    reducedMatches: census.reducedMatches,
    wallS,
    taskS,
    cpuPct: (taskS / wallS) * 100,
    scriptS,
    layoutS,
    longTasks: counters.longTasks,
    fps: (f1 - f0) / wallS,
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
    ["run", "glass surfaces", "wall (s)", "TaskDur Δ (s)", "CPU %", "ScriptDur Δ (s)", "LayoutDur Δ (s)", "long tasks", "fps", "tree CPU %"],
    ...runs.map((r) => [
      r.label,
      String(r.glassSurfaces),
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
  console.log(
    `[soak] 08-03 GLS-04 real-page soak — ${SOAK_MS / 1000}s per run, ${VIEW_W}x${VIEW_H} DPR1, headless=new (software raster)\n[soak] url: ${URL_ARG}`
  );
  const { proc, port: cdpPort, profile } = await launchChrome(VIEW_W, VIEW_H);
  try {
    const cdp = await connectCdp(cdpPort);
    await cdp.send("Page.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: VIEW_W,
      height: VIEW_H,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Navigate the REAL page once; both runs measure this same document.
    await cdp.send("Page.navigate", { url: URL_ARG });

    // Wait for boot + Layer-0 adoption on the production page: deck-active
    // set and the visible canvas backing store sized to the viewport at DPR1
    // (until adoption it sits at the 300px default).
    let adopted = false;
    for (let i = 0; i < 240; i++) {
      await sleep(250);
      adopted = await cdp.evaluate(
        `(() => {
          const c = document.querySelector('#nightsky-canvas');
          return document.documentElement.classList.contains('deck-active') && !!c &&
            c.width === Math.round(window.innerWidth * window.devicePixelRatio) &&
            c.width !== 300;
        })()`
      );
      if (adopted) break;
    }
    if (!adopted) throw new Error("real page never adopted Layer 0 / deck-active");

    const env = await cdp.evaluate(
      `(() => ({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio }))()`
    );
    process.stderr.write(`[soak] viewport ${env.w}x${env.h} @dpr${env.dpr}\n`);

    process.stderr.write(`[soak] warm-up: ${WARMUP_MS / 1000}s unmeasured settle\n`);
    await sleep(WARMUP_MS);

    // BASELINE: glass off via emulated prefers-reduced-transparency: reduce.
    await setReducedTransparency(cdp, "reduce");
    const baseline = await runSoak(cdp, "baseline: real page, reduced-transparency (glass off)", proc.pid);

    // GLASS: glass live via emulated no-preference (the shipped default).
    await setReducedTransparency(cdp, "no-preference");
    const glass = await runSoak(cdp, "glass: real page, no-preference (glass live)", proc.pid);

    const runs = [baseline, glass];
    console.log("");
    printTable(runs);
    const marginal = glass.cpuPct - baseline.cpuPct;
    console.log("");
    console.log(`MARGINAL (glass - baseline): ${marginal >= 0 ? "+" : ""}${marginal.toFixed(2)} percentage points (Spike-2 projection: +0.47pp)`);
    console.log(`TOTAL with glass:            ${glass.cpuPct.toFixed(2)}% (floor: total < 10%)`);
    if (baseline.treeCpuPct !== null && glass.treeCpuPct !== null) {
      const treeMarginal = glass.treeCpuPct - baseline.treeCpuPct;
      console.log(
        `tree-CPU cross-check:        marginal ${treeMarginal >= 0 ? "+" : ""}${treeMarginal.toFixed(2)}p ` +
          `(whole Chrome process tree incl. compositor/viz: ${baseline.treeCpuPct.toFixed(2)}% -> ${glass.treeCpuPct.toFixed(2)}%)`
      );
    }
    console.log("");
    console.log(JSON.stringify({ runs, marginalPct: marginal }, null, 2));
  } finally {
    proc.kill();
    await sleep(300);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* profile dir may be briefly locked on Windows — best effort */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
