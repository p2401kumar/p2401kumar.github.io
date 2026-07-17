// tokens.ts — the ONLY bridge from tokens.css custom properties into the
// Fig. 01 canvas module. Reads getComputedStyle exactly once (cached), so
// render.ts/interactions.ts never hardcode a hex literal and never re-read
// the DOM per frame (02-RESEARCH.md Pattern 2).
//
// Custom-property names read here are string literals only — the actual
// color values live solely in src/styles/tokens.css.
//
// The generic getComputedStyle/parseHex/rgba mechanics live in
// src/lib/shared/css-tokens.ts (05-CONTEXT.md Scene-architecture decision —
// extracted so night-sky's own token bridge can reuse them without
// duplicating hex-parsing). This module keeps only the FigTokens shape and
// the fig01-specific token name list; behavior is unchanged.

import { getRootStyles, readToken, rgba, type RgbTriple } from '../shared/css-tokens';

export type { RgbTriple };
export { rgba };

/** Parsed Fig. 01 color tokens, sourced from src/styles/tokens.css. */
export interface FigTokens {
  accent: RgbTriple;
  good: RgbTriple;
  amber: RgbTriple;
  ink: RgbTriple;
  dim: RgbTriple;
  panel2: RgbTriple;
  faint: RgbTriple;
  hair: RgbTriple;
}

let cached: FigTokens | null = null;

/**
 * Lazily reads the computed root styles once, caches the parsed token set,
 * and returns the same cached object on every subsequent call
 * (identity-stable).
 */
export function getTokens(): FigTokens {
  if (cached) return cached;
  const styles = getRootStyles();
  cached = {
    accent: readToken(styles, '--accent'),
    good: readToken(styles, '--good'),
    amber: readToken(styles, '--amber'),
    ink: readToken(styles, '--ink'),
    dim: readToken(styles, '--dim'),
    panel2: readToken(styles, '--panel2'),
    faint: readToken(styles, '--faint'),
    hair: readToken(styles, '--hair'),
  };
  return cached;
}
