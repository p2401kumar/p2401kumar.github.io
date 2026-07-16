// Grouped mono skill tags, per 01-CONTEXT.md Page structure item 7.
// No proficiency levels/percentages — skill bars and logo walls are explicit
// anti-patterns (PROJECT.md ## Out of Scope). These are capability tags, not
// claimed metrics, so no per-tag `source` is required; the group set itself
// carries a `source` for provenance consistency.
import type { SkillGroup } from './types';

export const skillsIntro =
  'Tools I reach for across distributed systems, cloud infrastructure, and mobile.';

export const skillGroups: SkillGroup[] = [
  {
    label: 'Languages',
    tags: ['Java', 'C#', 'Kotlin', 'Go', 'Python', 'JavaScript/TypeScript'],
  },
  {
    label: 'Cloud & Distributed',
    tags: [
      'AWS DynamoDB',
      'AWS EC2',
      'AWS ECS',
      'AWS EKS',
      'Azure',
      'Kubernetes',
      'Docker',
      'Load balancing',
      'Auto-scaling',
    ],
  },
  {
    label: 'Data',
    tags: ['DynamoDB', 'PostgreSQL', 'MySQL', 'Redis'],
  },
  {
    label: 'Mobile',
    tags: ['Android SDK', 'Jetpack', 'Kotlin', 'JNI'],
  },
];

export const skillsSource = 'resume-4.5 §Skills — grouped by category (Languages, Cloud & Distributed, Data, Mobile)';
