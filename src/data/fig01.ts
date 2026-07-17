// Fig. 01 node facts — hover tooltip + keyboard-proxy accessible-name copy,
// ported verbatim from the approved prototype
// (.planning/reference/prototype-shell-and-fig01.html lines 150-161) and
// .planning/phases/02-fig01-signature-figure/02-UI-SPEC.md's Copywriting
// Contract. Every metric here must trace to the résumé (CONT-07 honesty
// gate, extended to Fig. 01 per FIG-04).
import type { Fig01Fact } from './types';

const CLIENT_TIP = 'smartthings clients · galaxy s21';
const CLIENT_SOURCE =
  'resume-4.5 §Samsung — SmartThings contextual widget, Galaxy S21, patent';

export const fig01Facts: Fig01Fact[] = [
  {
    nodeId: 'c0',
    label: '',
    tooltipHtml: CLIENT_TIP,
    accessibleName: `clients — ${CLIENT_TIP}`,
    source: CLIENT_SOURCE,
  },
  {
    nodeId: 'c1',
    label: 'clients',
    tooltipHtml: CLIENT_TIP,
    accessibleName: `clients — ${CLIENT_TIP}`,
    source: CLIENT_SOURCE,
  },
  {
    nodeId: 'c2',
    label: '',
    tooltipHtml: CLIENT_TIP,
    accessibleName: `clients — ${CLIENT_TIP}`,
    source: CLIENT_SOURCE,
  },
  {
    nodeId: 'lb',
    label: 'elb/weight-away',
    tooltipHtml: 'auto-weight-away · <span class="m">90% capacity ops automated</span>',
    accessibleName: 'elb/weight-away — auto-weight-away · 90% capacity ops automated',
    source: 'resume-4.5 §AWS — ELB auto-weight-away (90% capacity ops automated)',
  },
  {
    nodeId: 'cell0',
    label: 'cell-0',
    tooltipHtml: 'isolated failure domain · compute/storage split',
    accessibleName: 'cell-0 — isolated failure domain · compute/storage split',
    source: 'resume-4.5 §AWS — DynamoDB cellularization (+30% reliability, −20% p99 latency)',
  },
  {
    nodeId: 'cell1',
    label: 'cell-1',
    tooltipHtml: 'isolated failure domain · compute/storage split',
    accessibleName: 'cell-1 — isolated failure domain · compute/storage split',
    source: 'resume-4.5 §AWS — DynamoDB cellularization (+30% reliability, −20% p99 latency)',
  },
  {
    nodeId: 'cell2',
    label: 'cell-2',
    tooltipHtml: 'isolated failure domain · compute/storage split',
    accessibleName: 'cell-2 — isolated failure domain · compute/storage split',
    source: 'resume-4.5 §AWS — DynamoDB cellularization (+30% reliability, −20% p99 latency)',
  },
  {
    nodeId: 'cell3',
    label: 'cell-3',
    tooltipHtml: 'isolated failure domain · compute/storage split',
    accessibleName: 'cell-3 — isolated failure domain · compute/storage split',
    source: 'resume-4.5 §AWS — DynamoDB cellularization (+30% reliability, −20% p99 latency)',
  },
  {
    nodeId: 'dp',
    label: 'data-pipelines',
    tooltipHtml: 'durable · idempotent · <span class="m">reconciles legacy data</span>',
    accessibleName: 'data-pipelines — durable · idempotent · reconciles legacy data',
    source:
      'resume-4.5 §AWS — DynamoDB cellularization, durable idempotent data-pipeline reconciliation',
  },
  {
    nodeId: 'ml',
    label: 'ml/snapshots',
    tooltipHtml: 'information-theory health snapshots · <span class="m">azure</span>',
    accessibleName: 'ml/snapshots — information-theory health snapshots · azure',
    source: 'resume-4.5 §Microsoft — Azure data platform, info-theory health snapshots',
  },
];
