"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { ArrowLeft, MessageCircle, User, EyeOff } from "lucide-react";

interface Props {
  questionDocId: string;
}

export default function DiscussionViewContent({ questionDocId }: Props) {
  const data = useQuery(api.reflections.getAnswersForQuestion, {
    questionDocId: questionDocId as Id<"reflectionQuestions">,
  });

  if (data === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          Načítám…
        </p>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          Otázka nenalezena nebo nemáte oprávnění.
        </p>
        <Link
          href="/admin"
          className="text-sm font-bold underline"
          style={{ color: "var(--czechitas-blue)", fontFamily: "var(--font-sans)" }}
        >
          Zpět do adminu
        </Link>
      </div>
    );
  }

  const { question, answers } = data;

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Top bar */}
      <div className="h-1.5 w-full" style={{ background: "var(--czechitas-pink)" }} />

      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Back link */}
        <Link
          href="/admin"
          className="mb-8 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zpět do adminu
        </Link>

        {/* Question header */}
        <header className="mb-10">
          <div
            className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"
          >
            Reflexe · {question.lectureId}
          </div>
          <div className="flex items-start gap-3">
            <MessageCircle
              className="mt-1 h-6 w-6 shrink-0"
              style={{ color: "var(--czechitas-pink)" }}
            />
            <h1
              className="text-2xl font-black uppercase tracking-tight sm:text-3xl leading-tight"
              style={{ color: "var(--czechitas-blue)" }}
            >
              {question.question}
            </h1>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold"
              style={{
                background: question.isOpen
                  ? "rgba(230,0,126,0.1)"
                  : "hsl(var(--muted))",
                color: question.isOpen ? "var(--czechitas-pink)" : "hsl(var(--muted-foreground))",
              }}
            >
              {question.isOpen ? "Otevřená" : "Zavřená"}
            </span>
            <span className="text-sm text-muted-foreground">
              {answers.length}{" "}
              {answers.length === 1
                ? "odpověď"
                : answers.length >= 2 && answers.length <= 4
                ? "odpovědi"
                : "odpovědí"}
            </span>
          </div>
        </header>

        {/* Answers */}
        {answers.length === 0 ? (
          <p className="italic text-muted-foreground text-sm">
            Zatím žádné odpovědi.
          </p>
        ) : (
          <ul className="space-y-4">
            {answers.map((a, i) => (
              <li
                key={a._id}
                className="flex gap-4 rounded-xl border border-border bg-card px-5 py-4"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--czechitas-blue)" }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed text-foreground break-words">
                    {a.answer}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {a.isAnonymous ? (
                      <>
                        <EyeOff className="h-3 w-3" /> Anonymně
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3" />{" "}
                        {a.displayName || "bez jména"}
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
