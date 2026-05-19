"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, BookOpen, MessageCircle, ClipboardList } from "lucide-react";

interface Props {
  lectureId: string;
  slug: string;
  current: "text" | "reflexe" | "ukoly";
}

export default function LectureActivityNav({ lectureId, slug, current }: Props) {
  const questions = useQuery(api.reflections.getOpenQuestionsForLecture, { lectureId });
  const tasks = useQuery(api.tasks.getOpenTasksForLecture, { lectureId });

  const linkClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
      active
        ? "border-transparent text-white"
        : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
    }`;

  return (
    <nav className="flex flex-wrap gap-2 mb-8" style={{ fontFamily: "var(--font-sans)" }}>
      <Link href="/" className={linkClass(false)}>
        <ArrowLeft className="h-3.5 w-3.5" />
        Zpět na přehled
      </Link>

      <Link
        href={`/lekce/${slug}`}
        className={linkClass(current === "text")}
        style={current === "text" ? { background: "var(--czechitas-blue)" } : undefined}
      >
        <BookOpen className="h-3.5 w-3.5" />
        Obsah lekce
      </Link>

      {questions && questions.length > 0 && (
        <Link
          href={`/lekce/${slug}/reflexe`}
          className={linkClass(current === "reflexe")}
          style={current === "reflexe" ? { background: "var(--czechitas-pink)" } : undefined}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Reflexe ({questions.length})
        </Link>
      )}

      {tasks && tasks.length > 0 && (
        <Link
          href={`/lekce/${slug}/ukoly`}
          className={linkClass(current === "ukoly")}
          style={current === "ukoly" ? { background: "var(--czechitas-blue)" } : undefined}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Úkoly ({tasks.length})
        </Link>
      )}
    </nav>
  );
}
