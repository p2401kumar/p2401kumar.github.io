// Identity, bio, and external link data for the editorial shell hero/header/footer.
// Copy is locked verbatim from the approved prototype (01-CONTEXT.md ## Decisions)
// — treat as content, not paraphrasable.
import type { ProfileLink } from './types';

export interface Profile {
  name: string;
  location: string;
  /** Eyebrow line rendered as: "distributed systems · cloud · " + accent(accentEyebrow) */
  eyebrowPrefix: string;
  accentEyebrow: string;
  /** Hero thesis, serif display, locked verbatim */
  thesis: string;
  /** One-line bio naming Microsoft/AWS/Samsung, locked verbatim */
  bio: string;
  links: {
    resume: ProfileLink;
    linkedin: ProfileLink;
    github: ProfileLink;
    email: ProfileLink;
  };
}

export const profile: Profile = {
  name: 'prateek kumar',
  location: 'seattle',
  eyebrowPrefix: 'distributed systems · cloud · ',
  accentEyebrow: 'applied ai',
  thesis: 'I build the infrastructure that intelligence runs on.',
  bio: "SDE 2 at Microsoft, on Azure's data platform. Previously cellularized DynamoDB's US-EAST-1 region at AWS and built the SmartThings notifications platform at Samsung. Two patents. M.S. CS, USC.",
  links: {
    resume: {
      href: '/prateek-kumar-resume.pdf',
      source: 'resume-4.5 — résumé PDF asset (public/prateek-kumar-resume.pdf, plan 01-01)',
    },
    linkedin: {
      href: 'https://www.linkedin.com/in/prateek-kumar-7b11321b3',
      source: 'resume-4.5 §Contact — LinkedIn profile URL',
    },
    github: {
      href: 'https://github.com/p2401kumar',
      source: 'resume-4.5 §Contact — GitHub profile URL',
    },
    email: {
      href: 'mailto:p2401kumar@gmail.com',
      source: 'resume-4.5 §Contact — email address',
    },
  },
};
