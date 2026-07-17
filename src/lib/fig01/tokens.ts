// tokens.ts — the ONLY bridge from tokens.css custom properties into the
// Fig. 01 canvas module. Reads getComputedStyle exactly once (cached), so
// render.ts/interactions.ts never hardcode a hex literal and never re-read
// the DOM per frame (02-RESEARCH.md Pattern 2).
//
// Custom-property names read here are string literals only — the actual
// color values live solely in src/styles/tokens.css.

/** An RGB triple parsed from a `#rrggbb` token value. */
export interface RgbTriple {
  r: number;
  g: number;
  b: number;
}

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

function parseHex(hex: string): RgbTriple {
  const value = hex.trim().replace(/^#/, '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return { r, g, b };
}

function readToken(styles: CSSStyleDeclaration, name: string): RgbTriple {
  return parseHex(styles.getPropertyValue(name));
}

/**
 * Lazily reads the computed root styles once, caches the parsed token set,
 * and returns the same cached object on every subsequent call
 * (identity-stable).
 */
export function getTokens(): FigTokens {
  if (cached) return cached;
  const styles = getComputedStyle(document.documentElement);
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

/** Formats a parsed rgb triple + alpha as a `rgba(r, g, b, alpha)` string. */
export function rgba(triple: RgbTriple, alpha: number): string {
  return `rgba(${triple.r}, ${triple.g}, ${triple.b}, ${alpha})`;
}
