"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckCircle, MessageCircle, Send, Edit2, Users } from "lucide-react";

interface Props {
  lectureId: string;
}

type Answer = {
  _id: string;
  answer: string;
  isAnonymous: boolean;
  displayName?: string;
  isOwn: boolean;
};

function QuestionCard({
  q,
  lectureId,
  myDisplayName,
}: {
  q: {
    _id: string;
    questionId: string;
    question: string;
    myAnswer: { answer: string; isAnonymous: boolean; displayName?: string } | null;
    answers: Answer[];
  };
  lectureId: string;
  myDisplayName: string;
}) {
  const submitAnswer = useMutation(api.reflections.submitAnswer);

  const [answer, setAnswer] = useState(q.myAnswer?.answer ?? "");
  const [isAnonymous, setIsAnonymous] = useState(q.myAnswer?.isAnonymous ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!q.myAnswer);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showForm = !submitted || editing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await submitAnswer({
        questionId: q.questionId,
        lectureId,
        answer,
        isAnonymous,
        displayName: isAnonymous ? undefined : myDisplayName || undefined,
      });
      console.log("Reflection answer submitted for", q.questionId);
      setSubmitted(true);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-xl border border-border bg-card p-5"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="mb-3 flex items-start gap-2">
        <MessageCircle
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color: "var(--czechitas-pink)" }}
        />
        <p className="text-sm font-medium leading-relaxed text-foreground">
          {q.question}
        </p>
      </div>

      {submitted && !editing ? (
        <div className="mt-2">
          <div className="flex items-start gap-2 rounded-lg bg-muted px-4 py-3">
            <CheckCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground break-words">{q.myAnswer?.answer ?? answer}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isAnonymous
                  ? "Zobrazuje se anonymně"
                  : `Zobrazuje se jako: ${myDisplayName || "bez jména"}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 className="h-3 w-3" /> Upravit odpověď
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Napište svou odpověď…"
            rows={3}
            disabled={submitting}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-current disabled:opacity-50"
            style={{ fontFamily: "var(--font-sans)" }}
          />

          <div className="flex flex-wrap items-end gap-4">
            {/* Anonymity toggle */}
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
                <input
                  type="radio"
                  name={`anon-${q.questionId}`}
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(true)}
                  disabled={submitting}
                  className="h-3.5 w-3.5"
                />
                Anonymně
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
                <input
                  type="radio"
                  name={`anon-${q.questionId}`}
                  checked={!isAnonymous}
                  onChange={() => setIsAnonymous(false)}
                  disabled={submitting}
                  className="h-3.5 w-3.5"
                />
                Zobrazit jméno
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !answer.trim()}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
              style={{ background: "var(--czechitas-pink)", fontFamily: "var(--font-sans)" }}
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? "Odesílám…" : editing ? "Uložit" : "Odeslat"}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {editing && (
            <button
              type="button"
              onClick={() => { setEditing(false); setAnswer(q.myAnswer?.answer ?? ""); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Zrušit úpravy
            </button>
          )}
        </form>
      )}

      {/* Other students' answers */}
      {q.answers.filter((a) => !a.isOwn).length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Odpovědi ostatních ({q.answers.filter((a) => !a.isOwn).length})
          </div>
          <div className="space-y-2">
            {q.answers.filter((a) => !a.isOwn).map((a) => (
              <div key={a._id} className="rounded-lg bg-muted px-4 py-3">
                <p className="text-sm text-foreground break-words">{a.answer}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.isAnonymous ? "Anonymně" : (a.displayName || "bez jména")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReflectionBoard({ lectureId }: Props) {
  const questions = useQuery(api.reflections.getOpenQuestionsForLecture, { lectureId });
  const myDisplayName = useQuery(api.users.getMyDisplayName) ?? "";

  // Don't render anything while loading or if no open questions
  if (questions === undefined) return null;
  if (questions.length === 0) return null;

  return (
    <section id="reflexe" className="mt-14 border-t border-border pt-10" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="mb-6">
        <div
          className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"
        >
          Reflexe
        </div>
        <h2
          className="text-xl font-black uppercase tracking-tight"
          style={{ color: "var(--czechitas-blue)" }}
        >
          Zamyšlení k lekci
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Žádné správné ani špatné odpovědi — sdílíte, co vás napadlo.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q) => (
          <QuestionCard key={q._id} q={q as Parameters<typeof QuestionCard>[0]["q"]} lectureId={lectureId} myDisplayName={myDisplayName} />
        ))}
      </div>
    </section>
  );
}
