// Patents & publications, per 01-CONTEXT.md Page structure item 6.
// Every claim traces to the résumé (CONT-07 honesty gate).
import type { Patent, Publication } from './types';

export const patents: Patent[] = [
  {
    title: 'IoT room identification via device-type watermarks',
    note: 'Grade A1',
    year: '2020',
    source: 'resume-4.5 §Patents — IoT room identification via device-type watermarks, Grade A1 (2020)',
  },
  {
    title: 'Automated position & latch locking control via mobile',
    note: 'Patent',
    number: 'IN 201631007292',
    year: '2016',
    source: 'resume-4.5 §Patents — automated position & latch locking control via mobile, IN 201631007292 (2016)',
  },
];

export const publications: Publication[] = [
  {
    title: 'Android Lint tool optimization',
    metric: '~30% faster dead-code/unused-resource detection',
    source: 'resume-4.5 §Publications — Android Lint tool optimization (~30% faster dead-code/unused-resource detection)',
  },
];
