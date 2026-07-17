// scripts/render-og.mjs — one-time/rerunnable sharp SVG -> PNG rasterizer
// (PLAT-06). Reads the hand-authored og-source.svg and writes the static
// 1200x630 OG image to public/og/og-default.png. NOT wired into `astro
// build` — matches the project's existing font-subsetting convention
// (STACK.md: one-time build step, commit the resulting artifact).
//
// Run with: node scripts/render-og.mjs

import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const svg = readFileSync(new URL("../og-source.svg", import.meta.url));

const outPath = fileURLToPath(
  new URL("../public/og/og-default.png", import.meta.url),
);

await sharp(svg, { density: 144 }).resize(1200, 630).png().toFile(outPath);

const { width, height } = await sharp(outPath).metadata();

console.log(`Wrote ${outPath} width=${width} height=${height}`);
