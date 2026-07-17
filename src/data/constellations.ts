// The 4 career-chapter constellations (CONST-01), per 05-CONTEXT.md's
// Constellations decision and 05-UI-SPEC.md's "Constellation data — honesty
// gate" + "Constellation placement" tables. A typed, build-time data module
// (compiled into the static bundle, same pattern as panels.ts) — normalized
// star coordinates, a sparse link graph, a data-only display label, and the
// honesty-gate `source` annotation.
//
// Honesty gate (CONST-01, 05-CONTEXT.md): every `source` string below is a
// verbatim reuse of a `source` string already validated in
// src/data/experience.ts / src/data/systems.ts / src/data/patents.ts —
// nothing invented. `label` is data-only (never rendered as canvas text
// this phase — see 05-UI-SPEC.md Typography/Copywriting Contract).
import { experience } from './experience';
import { patents } from './patents';

/** The 4 career-chapter constellation ids (locked, 05-CONTEXT.md). */
export type ConstellationId = 'aws' | 'microsoft' | 'samsung' | 'education-patents';

/**
 * Per-star brightness band. Reuses the same "mid"/"bright" vocabulary as
 * 05-UI-SPEC.md's ambient star density bands (Faintest/Dim/Mid/Bright) for a
 * shared naming convention — constellation stars always render larger/
 * brighter than the ambient field regardless of band (radius 2.5–4px vs the
 * field's 2px cap, 05-UI-SPEC.md "Constellation star radius"), so only the
 * two brightest bands are meaningful here: `bright` marks a cluster's anchor
 * stars, `mid` marks its connecting stars.
 */
export type StarMagnitude = 'mid' | 'bright';

/** One star in a constellation's sparse graph. */
export interface ConstellationStar {
  /** Normalized viewport x fraction (0–1), within the cluster's UI-SPEC bounds. */
  x: number;
  /** Normalized viewport y fraction (0–1), within the cluster's UI-SPEC bounds. */
  y: number;
  /** Brightness band — see StarMagnitude. */
  magnitude: StarMagnitude;
}

/** One link segment, referencing star indices within the same constellation. */
export interface ConstellationLink {
  from: number;
  to: number;
}

/** A single career-chapter constellation. */
export interface Constellation {
  id: ConstellationId;
  /** Data-only display label — never rendered as visible canvas text this phase. */
  label: string;
  /** Honesty-gate traceability — verbatim reuse of an experience.ts/systems.ts/patents.ts `source` string. */
  source: string;
  /** Panel ids this constellation brightens for (04-UI-SPEC.md panel ids). At most one constellation maps to any panel. */
  panelIds: string[];
  /** Sparse star graph — 5–8 stars (recommend 6), never a fully-connected mesh. */
  stars: ConstellationStar[];
  /** 4–6 link segments: a path plus 1–2 cross-links. */
  links: ConstellationLink[];
}

const awsExperienceSource = experience.find((e) => e.company === 'AWS')?.source;
const microsoftExperienceSource = experience.find((e) => e.company === 'Microsoft')?.source;
const samsungExperienceSource = experience.find((e) => e.company === 'Samsung')?.source;
if (!awsExperienceSource || !microsoftExperienceSource || !samsungExperienceSource) {
  throw new Error('constellations.ts: expected experience.ts entries missing (honesty-gate source lookup failed)');
}
if (patents.length < 2) {
  throw new Error('constellations.ts: expected patents.ts entries missing (honesty-gate source lookup failed)');
}

/**
 * The 4 career-chapter constellations, in no particular render order.
 * Placement (05-UI-SPEC.md "Constellation placement"):
 *  - microsoft: left margin, upper  — x:0.06–0.20, y:0.10–0.35
 *  - samsung:   left margin, mid    — x:0.06–0.20, y:0.40–0.65
 *  - aws:       right margin, upper — x:0.80–0.95, y:0.15–0.45 (near Milky Way's inner edge)
 *  - education-patents: right margin, lower — x:0.80–0.95, y:0.50–0.75
 * All coordinates sit strictly inside the outer margins, clear of the
 * content-safe column (x: 0.20–0.80).
 */
export const constellations: Constellation[] = [
  {
    id: 'microsoft',
    label: 'Microsoft',
    source: microsoftExperienceSource,
    panelIds: ['experience'],
    stars: [
      { x: 0.08, y: 0.12, magnitude: 'bright' },
      { x: 0.13, y: 0.11, magnitude: 'mid' },
      { x: 0.18, y: 0.15, magnitude: 'mid' },
      { x: 0.16, y: 0.22, magnitude: 'mid' },
      { x: 0.1, y: 0.25, magnitude: 'bright' },
      { x: 0.14, y: 0.32, magnitude: 'mid' },
    ],
    links: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 1, to: 4 },
    ],
  },
  {
    id: 'samsung',
    label: 'Samsung',
    source: samsungExperienceSource,
    panelIds: ['skills'],
    stars: [
      { x: 0.09, y: 0.42, magnitude: 'bright' },
      { x: 0.15, y: 0.44, magnitude: 'mid' },
      { x: 0.19, y: 0.5, magnitude: 'mid' },
      { x: 0.14, y: 0.55, magnitude: 'mid' },
      { x: 0.08, y: 0.58, magnitude: 'bright' },
      { x: 0.12, y: 0.63, magnitude: 'mid' },
    ],
    links: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 1, to: 4 },
    ],
  },
  {
    id: 'aws',
    label: 'AWS',
    source: awsExperienceSource,
    panelIds: ['fig-01', 'systems'],
    stars: [
      { x: 0.83, y: 0.17, magnitude: 'bright' },
      { x: 0.89, y: 0.19, magnitude: 'mid' },
      { x: 0.94, y: 0.24, magnitude: 'mid' },
      { x: 0.91, y: 0.32, magnitude: 'mid' },
      { x: 0.85, y: 0.36, magnitude: 'bright' },
      { x: 0.88, y: 0.43, magnitude: 'mid' },
    ],
    links: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 1, to: 4 },
    ],
  },
  {
    id: 'education-patents',
    label: 'Education & Patents',
    // Both patents.ts entries, verbatim, joined — the two patent sources are
    // the only honesty-gate-permitted facts for this cluster (experience.ts/
    // systems.ts/patents.ts do not carry a separate education-institution
    // `source` string, so none is asserted here).
    source: `${patents[0].source}; ${patents[1].source}`,
    panelIds: ['patents'],
    stars: [
      { x: 0.82, y: 0.52, magnitude: 'bright' },
      { x: 0.88, y: 0.54, magnitude: 'mid' },
      { x: 0.93, y: 0.59, magnitude: 'mid' },
      { x: 0.9, y: 0.66, magnitude: 'mid' },
      { x: 0.84, y: 0.7, magnitude: 'bright' },
      { x: 0.87, y: 0.74, magnitude: 'mid' },
    ],
    links: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 1, to: 4 },
    ],
  },
];

/**
 * Panel id → constellation id resolution. THE single source of truth for
 * panel-reactive brightening (05-05's render reads this; it never
 * re-derives the mapping from `constellations[].panelIds`). `hero` and
 * `contact` are intentionally absent — they map to no constellation, per
 * 05-CONTEXT.md.
 */
export const panelToConstellation: Partial<Record<string, ConstellationId>> = {};
for (const constellation of constellations) {
  for (const panelId of constellation.panelIds) {
    panelToConstellation[panelId] = constellation.id;
  }
}

/** Resolves a panel id to its constellation id, or `null` if none maps (hero/contact). */
export function getConstellationForPanel(panelId: string): ConstellationId | null {
  return panelToConstellation[panelId] ?? null;
}
