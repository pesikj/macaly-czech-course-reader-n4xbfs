// ─── Lecture data ───────────────────────────────────────────────
// To add a new lecture, add an entry to the LECTURES array below.
// markdownSource currently references a local file path under /content/lekce/.
// In the future it can point to an external URL or a CMS entry.

export type LectureStatus = 'available' | 'preparing' | 'locked';

export interface Lecture {
  id: string;
  order: number;
  title: string;
  slug: string;
  /** Relative path under /content/lekce/ or an external URL */
  markdownSource: string;
  /** Optional short description shown in the lecture list */
  description?: string;
  status: LectureStatus;
}

export const LECTURES: Lecture[] = [
  {
    id: 'lekce-1',
    order: 1,
    title: 'Lekce 1',
    slug: 'lekce-1',
    markdownSource: 'content/lekce/lekce-1.md',
    description: 'Popis lekce bude doplněn.',
    status: 'available',
  },
  {
    id: 'lekce-2',
    order: 2,
    title: 'Lekce 2',
    slug: 'lekce-2',
    markdownSource: 'content/lekce/lekce-2.md',
    description: 'Popis lekce bude doplněn.',
    status: 'available',
  },
  {
    id: 'lekce-3',
    order: 3,
    title: 'Lekce 3',
    slug: 'lekce-3',
    markdownSource: 'content/lekce/lekce-3.md',
    description: 'Popis lekce bude doplněn.',
    status: 'available',
  },
  {
    id: 'lekce-4',
    order: 4,
    title: 'Lekce 4',
    slug: 'lekce-4',
    markdownSource: 'content/lekce/lekce-4.md',
    description: 'Popis lekce bude doplněn.',
    status: 'available',
  },
  {
    id: 'lekce-5',
    order: 5,
    title: 'Lekce 5',
    slug: 'lekce-5',
    markdownSource: 'content/lekce/lekce-5.md',
    description: 'Popis lekce bude doplněn.',
    status: 'available',
  },
];

// ─── Helpers ────────────────────────────────────────────────────

export function getLectureBySlug(slug: string): Lecture | undefined {
  return LECTURES.find((l) => l.slug === slug);
}

export function getPrevNextLectures(slug: string): {
  prev: Lecture | null;
  next: Lecture | null;
} {
  const index = LECTURES.findIndex((l) => l.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? LECTURES[index - 1] : null,
    next: index < LECTURES.length - 1 ? LECTURES[index + 1] : null,
  };
}

export const STATUS_LABELS: Record<LectureStatus, string> = {
  available: 'Dostupné',
  preparing: 'Připravuje se',
  locked: 'Zamčeno',
};
