// Content Layer collection for the case-studies. Lives at src/content.config.ts
// (sibling to src/content/, NOT src/content/config.ts — the legacy pre-Content-Layer
// path silently fails to register the collection under Astro 7).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: z.object({
    title: z.string(),
    // Must match a `name` value in src/data/systems.ts
    // (e.g. dynamodb/cellularization, elb/auto-weight-away).
    systemId: z.string(),
    dateRange: z.string(),
    standfirst: z.string(),
    metrics: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          // Honesty-gate provenance, per-metric — extends CONT-07 into the collection.
          source: z.string(),
        }),
      )
      .min(1),
    // Structural enforcement of the problem -> approach (with trade-offs) -> impact
    // shape (CASE-03): required, independently typed frontmatter fields, not
    // heading-text parsing of the Markdown body.
    problem: z.string().min(1),
    approach: z.string().min(1),
    tradeoffs: z.string().min(1),
    impact: z.string().min(1),
  }),
});

export const collections = { 'case-studies': caseStudies };
