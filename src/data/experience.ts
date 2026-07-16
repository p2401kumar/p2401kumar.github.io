// The 4 "experience" entries, in reverse-chronological order per 01-CONTEXT.md
// Page structure item 5. Every scope/metric claim traces to the résumé
// (CONT-07 honesty gate).
import type { ExperienceEntry } from './types';

export const experience: ExperienceEntry[] = [
  {
    company: 'Microsoft',
    role: 'SDE 2',
    dates: '2024 — now',
    bullets: [
      "Azure's data platform: durable, idempotent pipelines reconciling legacy data.",
      'Information-theory health snapshots driving auto-healing container apps.',
    ],
    source: 'resume-4.5 §Microsoft — SDE 2, Azure data platform (2024–now)',
  },
  {
    company: 'AWS',
    role: 'SWE',
    dates: '2023 — 24',
    bullets: [
      "Cellularized DynamoDB's US-EAST-1 region into isolated failure domains; extended AWS SDK Java v1/v2 for the new topology (+30% reliability, −20% p99 latency).",
      'Built elb/auto-weight-away: load-balancer management that pre-allocates surge capacity and weighs out affected LBs with no human in the loop (−10% peak latency, 90% of capacity ops automated).',
    ],
    source: 'resume-4.5 §AWS — SWE, DynamoDB cellularization + ELB auto-weight-away (2023–24)',
  },
  {
    company: 'MathWorks',
    role: 'Software Engineering Intern',
    dates: '2022',
    bullets: [
      'Web-MATLAB performance on low-bandwidth connections.',
      'Cut the JS test suite runtime by 3 minutes.',
    ],
    source: 'resume-4.5 §MathWorks — internship, Web-MATLAB low-bandwidth + JS test suite (−3min) (2022)',
  },
  {
    company: 'Samsung',
    role: 'Senior SWE',
    dates: '2017 — 20',
    bullets: [
      'Built the SmartThings notifications platform.',
      'Shrank the app APK from 150MB to 90MB.',
      'Shipped a patented contextual widget on Galaxy S21.',
      'Built multi-client RTSP streaming.',
    ],
    source: 'resume-4.5 §Samsung — Senior SWE, SmartThings notifications, APK 150→90MB, contextual widget, multi-client RTSP (2017–20)',
  },
];
