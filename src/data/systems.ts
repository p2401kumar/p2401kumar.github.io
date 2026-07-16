// The 4 "selected systems" rows, ported verbatim from the approved prototype
// (.planning/reference/prototype-shell-and-fig01.html, .work section).
// Every metric here must trace to the résumé (CONT-07 honesty gate).
import type { SystemEntry } from './types';

export const systems: SystemEntry[] = [
  {
    year: '2025',
    name: 'azure/health-snapshots',
    description:
      'Health pipelines rarely carry enough signal to act on — rebuilt the snapshot with information theory on auto-healing container apps.',
    metric: 'info-theory',
    source: 'resume-4.5 §Microsoft — Azure data platform, info-theory health snapshots',
  },
  {
    year: '2023',
    name: 'dynamodb/cellularization',
    description:
      'Compute/storage segregation into isolated failure domains across US-EAST-1; extended AWS SDK Java v1/v2 for the new topology.',
    metric: '+30% rel · −20% p99',
    source: 'resume-4.5 §AWS — DynamoDB cellularization (+30% reliability, −20% p99 latency)',
  },
  {
    year: '2023',
    name: 'elb/auto-weight-away',
    description:
      'Load-balancer management that pre-allocates surge capacity and weighs out affected LBs — no human in the loop.',
    metric: '90% ops automated',
    source: 'resume-4.5 §AWS — ELB auto-weight-away (90% capacity ops automated)',
  },
  {
    year: '2019',
    name: 'iot/contextual-widget',
    description:
      'Context-aware IoT controls surfaced on demand; shipped on Galaxy S21, patented by Samsung.',
    metric: 'patented',
    source: 'resume-4.5 §Samsung — SmartThings contextual widget, Galaxy S21, patent',
  },
];
