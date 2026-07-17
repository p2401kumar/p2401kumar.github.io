// css-tokens.ts — the generic, engine-agnostic getComputedStyle/parseHex/
// rgba bridge shared by every canvas engine (Fig. 01, night-sky). Reads
// `getComputedStyle(document.documentElement)` and parses `#rrggbb`/`#rgb`
// custom-property values into RGB triples; callers build their own cached,
// engine-specific token set from this (05-CONTEXT.md Scene-architecture
// decision — extract once, both engines consume it, no engine hardcodes a
// hex literal, no engine re-reads the DOM per frame).
//
// This module owns NO token name list — that stays in each engine's own
// tokens.ts (e.g. fig01/tokens.ts's FigTokens), which is the only place
// that knows which custom properties it needs.

/** An RGB triple parsed from a `#rrggbb`/`#rgb` token value. */
export interface RgbTriple {
  r: number;
  g: number;
  b: number;
}

/** Parses a `#rrggbb` or `#rgb` hex string into an RGB triple. */
export function parseHex(hex: string): RgbTriple {
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

/** Reads a single custom property off an already-obtained computed style
 * declaration and parses it as a hex color. Callers should obtain `styles`
 * once via `getRootStyles()` and pass it to every `readToken` call, rather
 * than calling `getComputedStyle` per token (the caching contract both
 * engines rely on). */
export function readToken(styles: CSSStyleDeclaration, name: string): RgbTriple {
  return parseHex(styles.getPropertyValue(name));
}

/** Returns `getComputedStyle(document.documentElement)` — the single DOM
 * read each engine's token bridge should perform once per cached token set.
 * Split out as its own function so callers control exactly when that one
 * read happens (and can cache the resulting `FigTokens`/`SkyTokens`-shaped
 * object however they like). */
export function getRootStyles(): CSSStyleDeclaration {
  return getComputedStyle(document.documentElement);
}

/** Formats a parsed rgb triple + alpha as a `rgba(r, g, b, alpha)` string. */
export function rgba(triple: RgbTriple, alpha: number): string {
  return `rgba(${triple.r}, ${triple.g}, ${triple.b}, ${alpha})`;
}
