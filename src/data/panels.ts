// Panel manifest — THE single source of truth for the 7 deck panels.
//
// PanelDeck/Panel/DeckIndex and the (plan 04-02) deck.ts controller all
// derive their panel list, order, ids, and copy from this module. No other
// file may hardcode the panel count or id list (04-01-PLAN.md Task 1).
//
// `id`/`hash` are identical (the panel wrapper id doubles as the in-page
// anchor / location.hash target). `title` is Title Case for the aria-live
// announcement ("Panel {N} of {M} — {title}"); `label` is the lowercase-mono
// jump-list copy locked in 04-UI-SPEC.md's Copywriting Contract.
export interface PanelSpec {
  id: string;
  hash: string;
  title: string;
  label: string;
}

export const panels: PanelSpec[] = [
  { id: 'hero', hash: 'hero', title: 'Prateek Kumar', label: 'hero' },
  { id: 'fig-01', hash: 'fig-01', title: 'Fig. 01', label: 'fig. 01' },
  { id: 'systems', hash: 'systems', title: 'Selected Systems', label: 'selected systems' },
  { id: 'experience', hash: 'experience', title: 'Experience', label: 'experience' },
  {
    id: 'patents',
    hash: 'patents',
    title: 'Patents & Publications',
    label: 'patents & publications',
  },
  { id: 'skills', hash: 'skills', title: 'Skills', label: 'skills' },
  { id: 'contact', hash: 'contact', title: 'Contact', label: 'contact' },
];

export const PANEL_COUNT = panels.length;
