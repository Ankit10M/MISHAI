export const sections = [
  { id: 'creator', label: 'Creator' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills & Technology' },
  { id: 'experience', label: 'Work Experience' },
  { id: 'contact', label: 'Contact' },
] as const;

export type SectionId = (typeof sections)[number]['id'];
