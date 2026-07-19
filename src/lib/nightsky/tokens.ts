// tokens.ts — the sky-specific bridge from tokens.css custom properties into
// the night-sky canvas engine. Mirrors fig01/tokens.ts's shape exactly:
// reads getComputedStyle exactly once (cached), so starfield.ts/scene.ts/
// constellations.ts never hardcode a hex literal and never re-read the DOM
// per frame (05-RESEARCH.md Pattern 2, mirroring fig01's proven pattern).
//
// Custom-property names read here are string literals only — the actual
// color values live solely in src/styles/tokens.css.
//
// The generic getComputedStyle/parseHex/rgba mechanics live in
// src/lib/shared/css-tokens.ts (extracted in 05-02 specifically so this
// module can reuse them without duplicating hex-parsing logic).

import { getRootStyles, readToken, rgba, type RgbTriple } from '../shared/css-tokens';

export type { RgbTriple };
export { rgba };

/** Parsed night-sky color tokens, sourced from src/styles/tokens.css. */
export interface SkyTokens {
  skyZenith: RgbTriple;
  skyHorizon: RgbTriple;
  milkyway: RgbTriple;
  star: RgbTriple;
  /** 09-02 (AMB-03): the one sanctioned added light source — the aurora
   * curtain fill. The sole new token this phase (09-UI-SPEC.md Token
   * Manifest); its hex lives in tokens.css only. */
  aurora: RgbTriple;
  /** Reused, not a 5th sky-specific token — camper glow + fireflies only. */
  accent: RgbTriple;
}

let cached: SkyTokens | null = null;

/**
 * Lazily reads the computed root styles once, caches the parsed token set,
 * and returns the same cached object on every subsequent call
 * (identity-stable).
 */
export function getSkyTokens(): SkyTokens {
  if (cached) return cached;
  const styles = getRootStyles();
  cached = {
    skyZenith: readToken(styles, '--sky-zenith'),
    skyHorizon: readToken(styles, '--sky-horizon'),
    milkyway: readToken(styles, '--milkyway'),
    star: readToken(styles, '--star'),
    aurora: readToken(styles, '--aurora'),
    accent: readToken(styles, '--accent'),
  };
  return cached;
}
