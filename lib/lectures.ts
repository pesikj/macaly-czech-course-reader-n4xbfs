// ─── Lecture data ───────────────────────────────────────────────
// To add a new lecture, add an entry to the LECTURES array below.
// id / slug must match the directory name in the GitHub content repo.

export type LectureStatus = 'available' | 'preparing' | 'locked';

export interface Lecture {
  id: string;
  order: number;
  title: string;
  slug: string;
  /** What the student will be able to do after this lecture */
  kompetence: string;
  /** Relative path to the local markdown fallback */
  markdownSource: string;
  status: LectureStatus;
}

export const LECTURES: Lecture[] = [
  {
    id: 'lekce-1-vibe-coding',
    order: 1,
    title: 'Vibe coding a AI jako builder',
    slug: 'lekce-1-vibe-coding',
    kompetence:
      'Porozumíš tomu, jak AI generuje kód a kde se plete. Naučíš se psát smysluplná zadání a vytvoříš svůj první funkční web pomocí Macaly.',
    markdownSource: 'content/lekce/lekce-1-vibe-coding.md',
    status: 'available',
  },
  {
    id: 'lekce-2-jak-funguje-web',
    order: 2,
    title: 'Jak funguje web a základy TypeScriptu',
    slug: 'lekce-2-jak-funguje-web',
    kompetence:
      'Pochopíš, co se děje za oponou každé webové stránky – od DNS přes HTTP až po prohlížeč. Naučíš se základní stavební kameny kódu: proměnné, podmínky a funkce.',
    markdownSource: 'content/lekce/lekce-2-jak-funguje-web.md',
    status: 'available',
  },
  {
    id: 'lekce-3-workshop-prvni-web',
    order: 3,
    title: 'Workshop: stavím první vlastní web',
    slug: 'lekce-3-workshop-prvni-web',
    kompetence:
      'Projdeš celý cyklus vývoje od zadání po fungující aplikaci. Naučíš se rozpoznávat různé druhy chyb v AI kódu a systematicky je opravovat.',
    markdownSource: 'content/lekce/lekce-3-workshop-prvni-web.md',
    status: 'available',
  },
  {
    id: 'lekce-4-git-deployment',
    order: 4,
    title: 'Git a nasazení webu online',
    slug: 'lekce-4-git-deployment',
    kompetence:
      'Budeš umět spravovat kód pomocí Gitu a GitHubu – ukládat změny, vracet se ke starším verzím a spolupracovat s ostatními. Svůj web nasadíš online pod vlastní doménou.',
    markdownSource: 'content/lekce/lekce-4-git-deployment.md',
    status: 'available',
  },
  {
    id: 'lekce-5-ui-ux',
    order: 5,
    title: 'UI a UX: web, který se používá snadno',
    slug: 'lekce-5-ui-ux',
    kompetence:
      'Naučíš se upravovat vzhled aplikace a přemýšlet o ní z pohledu uživatele nebo uživatelky. Výsledkem bude web, který je přehledný, srozumitelný a příjemný na používání.',
    markdownSource: 'content/lekce/lekce-5-ui-ux.md',
    status: 'available',
  },
  {
    id: 'lekce-6-hackathon',
    order: 6,
    title: 'Hackathon: vlastní web od nápadu po spuštění',
    slug: 'lekce-6-hackathon',
    kompetence:
      'Navrhuješ, stavíš a spouštíš vlastní webový projekt od nuly. Odejdeš s fungující aplikací dostupnou online a schopností ji samostatně upravovat, rozšiřovat a iterovat.',
    markdownSource: 'content/lekce/lekce-6-hackathon.md',
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
