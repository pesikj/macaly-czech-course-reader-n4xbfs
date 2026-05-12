'use client';

// ─────────────────────────────────────────────────────────────────────────────
// InteractiveItem — placeholder for future interactive course elements.
//
// Supported types (extend as needed):
//   'reflection'  → Otázka k zamyšlení
//   'quiz'        → Otázka s výběrem odpovědi
//   'checklist'   → Kontrolní seznam
//   'exercise'    → Cvičení / programátorský úkol
//   'hint'        → Rozbalovací nápověda
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { ChevronDown, HelpCircle, CheckSquare, Code2, Lightbulb } from 'lucide-react';

export type InteractiveItemType = 'reflection' | 'quiz' | 'checklist' | 'exercise' | 'hint';

interface Props {
  type?: InteractiveItemType;
  label?: string;
  children?: React.ReactNode;
}

const CONFIG: Record<
  InteractiveItemType,
  { icon: React.ReactNode; defaultLabel: string; accent: string }
> = {
  reflection: {
    icon: <HelpCircle className="h-4 w-4" />,
    defaultLabel: 'Otázka k zamyšlení',
    accent: 'var(--czechitas-blue)',
  },
  quiz: {
    icon: <HelpCircle className="h-4 w-4" />,
    defaultLabel: 'Interaktivní prvek',
    accent: 'var(--czechitas-blue)',
  },
  checklist: {
    icon: <CheckSquare className="h-4 w-4" />,
    defaultLabel: 'Kontrolní seznam',
    accent: 'var(--czechitas-blue)',
  },
  exercise: {
    icon: <Code2 className="h-4 w-4" />,
    defaultLabel: 'Cvičení',
    accent: 'var(--czechitas-pink)',
  },
  hint: {
    icon: <Lightbulb className="h-4 w-4" />,
    defaultLabel: 'Zobrazit nápovědu',
    accent: 'var(--czechitas-pink)',
  },
};

export default function InteractiveItem({
  type = 'reflection',
  label,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const config = CONFIG[type];
  const displayLabel = label ?? config.defaultLabel;
  const isExpandable = type === 'hint' || !!children;

  return (
    <div
      className="my-8 rounded-lg border bg-card overflow-hidden"
      style={{ borderColor: `${config.accent}33` }}
    >
      <button
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/40"
        style={{ color: config.accent }}
        onClick={() => isExpandable && setOpen((v) => !v)}
        disabled={!isExpandable}
        aria-expanded={isExpandable ? open : undefined}
      >
        {config.icon}
        <span
          className="flex-1 text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {displayLabel}
        </span>
        {isExpandable && (
          <ChevronDown
            className="h-4 w-4 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        )}
      </button>

      {isExpandable && open && (
        <div className="border-t px-5 py-4 text-sm text-muted-foreground" style={{ borderColor: `${config.accent}22`, fontFamily: 'var(--font-body)' }}>
          {children ?? (
            <p className="italic">Obsah tohoto prvku bude doplněn.</p>
          )}
        </div>
      )}
    </div>
  );
}
