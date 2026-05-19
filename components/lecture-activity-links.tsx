"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MessageCircle } from "lucide-react";

interface Props {
  lectureId: string;
  slug: string;
}

export default function LectureActivityLinks({ lectureId, slug }: Props) {
  const questions = useQuery(api.reflections.getOpenQuestionsForLecture, { lectureId });

  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Link
        href={`/lekce/${slug}/reflexe`}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <MessageCircle className="h-3.5 w-3.5" style={{ color: "var(--czechitas-pink)" }} />
        Reflexe ({questions.length})
      </Link>
    </div>
  );
}
