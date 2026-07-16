// Shared content-data interfaces for the editorial shell (Phase 1).
// Every metric-bearing entry carries a `source` field tracing it to the
// résumé (CONT-07 honesty gate) — verified by plan 01-06's verification pass.
// These are plain typed modules, NOT Astro content collections (those are
// Phase 3 scope, for case studies only).

/** One row in the "selected systems" list. */
export interface SystemEntry {
  /** Year the system shipped, e.g. "2023" */
  year: string;
  /** Mono artifact name, e.g. "dynamodb/cellularization" */
  name: string;
  /** Sans one-line description, ported verbatim from the approved prototype */
  description: string;
  /** Accent-colored metric text, e.g. "+30% rel · −20% p99" */
  metric: string;
  /** Honesty-gate traceability to the résumé — not rendered on page */
  source: string;
}

/** One row in the "experience" section. */
export interface ExperienceEntry {
  /** Company name, e.g. "Microsoft" */
  company: string;
  /** Role/title, e.g. "SDE 2" */
  role: string;
  /** Date range, e.g. "2024 — now" */
  dates: string;
  /** One or more scope/impact bullets */
  bullets: string[];
  /** Honesty-gate traceability to the résumé — not rendered on page */
  source: string;
}

/** A patent entry in the "patents & publications" section. */
export interface Patent {
  /** Patent title/description */
  title: string;
  /** Grade/classification or filing note, e.g. "Grade A1" */
  note: string;
  /** Filing/grant number, if applicable, e.g. "IN 201631007292" */
  number?: string;
  /** Year filed/granted */
  year: string;
  /** Honesty-gate traceability to the résumé — not rendered on page */
  source: string;
}

/** A publication entry in the "patents & publications" section. */
export interface Publication {
  /** Publication title/description */
  title: string;
  /** Impact/metric summary, e.g. "~30% faster dead-code detection" */
  metric: string;
  /** Honesty-gate traceability to the résumé — not rendered on page */
  source: string;
}

/** A grouped set of mono skill tags. */
export interface SkillGroup {
  /** Group label, e.g. "Cloud & Distributed" */
  label: string;
  /** Individual skill tags in this group */
  tags: string[];
}

/** A named external/internal link with honesty-gate provenance. */
export interface ProfileLink {
  /** URL or path */
  href: string;
  /** Honesty-gate traceability to the résumé/profile source — not rendered on page */
  source: string;
}
