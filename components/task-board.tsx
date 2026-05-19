"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ClipboardList,
  Send,
  Edit2,
  Heart,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";
import MarkdownRenderer from "@/components/markdown-renderer";

interface Props {
  lectureId: string;
  slug: string;
}

// ── Types inferred from query return ─────────────────────────────

type SolutionField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
};

type Comment = {
  _id: Id<"taskComments">;
  userId: Id<"users">;
  displayName: string;
  text: string;
  createdAt: number;
  isOwn: boolean;
};

type Submission = {
  _id: Id<"taskSubmissions">;
  taskId: string;
  lectureId: string;
  userId: Id<"users">;
  displayName: string;
  fields: Array<{ fieldId: string; value: string }>;
  submittedAt: number;
  heartCount: number;
  hasHearted: boolean;
  isOwn: boolean;
  comments: Comment[];
};

type TaskData = {
  _id: Id<"tasks">;
  taskId: string;
  lectureId: string;
  title: string;
  markdown: string;
  isOpen: boolean;
  shareSolution: boolean;
  solutionFields: SolutionField[];
  mySubmission: Submission | null;
  submissions: Submission[];
};

// ── Comment section ───────────────────────────────────────────────

function CommentSection({
  submissionId,
  comments,
  defaultDisplayName,
}: {
  submissionId: Id<"taskSubmissions">;
  comments: Comment[];
  defaultDisplayName: string;
}) {
  const addComment = useMutation(api.tasks.addComment);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await addComment({ submissionId, displayName, text });
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Komentáře ({comments.length})
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {comments.length > 0 && (
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c._id} className="rounded-lg bg-muted px-3 py-2">
                  <p className="text-xs font-bold text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                    {c.displayName}
                  </p>
                  <p className="mt-0.5 text-sm text-foreground break-words" style={{ fontFamily: "var(--font-sans)" }}>
                    {c.text}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Vaše jméno"
              required
              disabled={submitting}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-current disabled:opacity-50"
              style={{ fontFamily: "var(--font-sans)" }}
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Napište komentář…"
                disabled={submitting}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-current disabled:opacity-50"
                style={{ fontFamily: "var(--font-sans)" }}
              />
              <button
                type="submit"
                disabled={submitting || !text.trim() || !displayName.trim()}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
                style={{ background: "var(--czechitas-blue)", fontFamily: "var(--font-sans)" }}
              >
                <Send className="h-3 w-3" />
                {submitting ? "…" : "Odeslat"}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-sans)" }}>{error}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

// ── Solution card ─────────────────────────────────────────────────

function SolutionCard({
  submission,
  solutionFields,
  defaultDisplayName,
}: {
  submission: Submission;
  solutionFields: SolutionField[];
  defaultDisplayName: string;
}) {
  const toggleHeart = useMutation(api.tasks.toggleHeart);
  const [hearting, setHearting] = useState(false);

  const handleHeart = async () => {
    if (submission.isOwn) return;
    setHearting(true);
    try {
      await toggleHeart({ submissionId: submission._id });
    } catch {
      // ignore
    } finally {
      setHearting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-foreground">{submission.displayName}</p>
        <button
          onClick={handleHeart}
          disabled={hearting || submission.isOwn}
          title={submission.isOwn ? "Nemůžete dát srdce vlastnímu řešení" : submission.hasHearted ? "Odebrat srdce" : "Dát srdce"}
          className={`inline-flex items-center gap-1 text-xs font-bold transition-colors disabled:cursor-not-allowed ${
            submission.isOwn
              ? "text-muted-foreground/40"
              : submission.hasHearted
              ? "text-red-500 hover:text-red-400"
              : "text-muted-foreground hover:text-red-500"
          }`}
        >
          <Heart className={`h-4 w-4 ${submission.hasHearted ? "fill-current" : ""}`} />
          {submission.heartCount}
        </button>
      </div>

      <div className="space-y-3">
        {solutionFields.map((field) => {
          const fieldValue = submission.fields.find((f) => f.fieldId === field.id)?.value ?? "";
          if (!fieldValue) return null;
          return (
            <div key={field.id}>
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {field.label}
              </p>
              {field.type === "text_box" ? (
                <p className="text-sm text-foreground break-words whitespace-pre-wrap rounded-lg bg-muted px-3 py-2">
                  {fieldValue}
                </p>
              ) : (
                <a
                  href={fieldValue}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm break-all"
                  style={{ color: "var(--czechitas-blue)" }}
                >
                  {fieldValue}
                </a>
              )}
            </div>
          );
        })}
      </div>

      <CommentSection
        submissionId={submission._id}
        comments={submission.comments}
        defaultDisplayName={defaultDisplayName}
      />
    </div>
  );
}

// ── Submission form ───────────────────────────────────────────────

function SubmissionForm({
  task,
  existingSubmission,
  defaultDisplayName,
  onCancel,
}: {
  task: TaskData;
  existingSubmission: Submission | null;
  defaultDisplayName: string;
  onCancel?: () => void;
}) {
  const submitSolution = useMutation(api.tasks.submitSolution);

  const initialFields: Record<string, string> = {};
  for (const field of task.solutionFields) {
    initialFields[field.id] =
      existingSubmission?.fields.find((f) => f.fieldId === field.id)?.value ?? "";
  }

  const [displayName, setDisplayName] = useState(
    existingSubmission?.displayName ?? defaultDisplayName
  );
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(initialFields);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    for (const field of task.solutionFields) {
      if (field.required && !fieldValues[field.id]?.trim()) {
        setError(`Pole „${field.label}" je povinné.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await submitSolution({
        taskId: task.taskId,
        lectureId: task.lectureId,
        displayName,
        fields: task.solutionFields.map((f) => ({
          fieldId: f.id,
          value: fieldValues[f.id] ?? "",
        })),
      });
      onCancel?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Vaše jméno <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Jak se zobrazíte ostatním"
          required
          disabled={submitting}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-current disabled:opacity-50"
          style={{ fontFamily: "var(--font-sans)" }}
        />
      </div>

      {task.solutionFields.map((field) => (
        <div key={field.id}>
          <label
            className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          {field.type === "text_box" ? (
            <textarea
              value={fieldValues[field.id] ?? ""}
              onChange={(e) =>
                setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))
              }
              placeholder={`Zadejte ${field.label.toLowerCase()}…`}
              rows={4}
              disabled={submitting}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-current disabled:opacity-50"
              style={{ fontFamily: "var(--font-sans)" }}
            />
          ) : (
            <input
              type="text"
              value={fieldValues[field.id] ?? ""}
              onChange={(e) =>
                setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))
              }
              placeholder={`Zadejte ${field.label.toLowerCase()}…`}
              disabled={submitting}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-current disabled:opacity-50"
              style={{ fontFamily: "var(--font-sans)" }}
            />
          )}
        </div>
      ))}

      {error && (
        <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-sans)" }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || !displayName.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          style={{ background: "var(--czechitas-blue)", fontFamily: "var(--font-sans)" }}
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? "Odesílám…" : existingSubmission ? "Uložit změny" : "Odeslat řešení"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Zrušit
          </button>
        )}
      </div>
    </form>
  );
}

// ── Single task card ──────────────────────────────────────────────

function TaskCard({
  task,
  defaultDisplayName,
}: {
  task: TaskData;
  defaultDisplayName: string;
}) {
  const [editing, setEditing] = useState(false);

  const otherSubmissions = task.submissions.filter((s) => !s.isOwn);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-6" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Task header */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 shrink-0" style={{ color: "var(--czechitas-blue)" }} />
          <h2 className="text-lg font-black uppercase tracking-tight" style={{ color: "var(--czechitas-blue)" }}>
            {task.title}
          </h2>
        </div>
        {task.markdown && (
          <div className="text-sm text-foreground">
            <MarkdownRenderer content={task.markdown} />
          </div>
        )}
      </div>

      {/* Submission area */}
      {task.isOpen && (
        <div className="border-t border-border pt-5">
          {task.mySubmission && !editing ? (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Moje řešení
              </div>
              <div className="space-y-3 rounded-lg border border-border bg-background px-4 py-3">
                {task.solutionFields.map((field) => {
                  const val = task.mySubmission!.fields.find((f) => f.fieldId === field.id)?.value ?? "";
                  if (!val) return null;
                  return (
                    <div key={field.id}>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {field.label}
                      </p>
                      {field.type === "text_box" ? (
                        <p className="text-sm text-foreground break-words whitespace-pre-wrap">{val}</p>
                      ) : (
                        <a
                          href={val}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm break-all"
                          style={{ color: "var(--czechitas-blue)" }}
                        >
                          {val}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit2 className="h-3 w-3" /> Upravit řešení
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {task.mySubmission ? "Upravit řešení" : "Odevzdat řešení"}
              </div>
              <SubmissionForm
                task={task}
                existingSubmission={task.mySubmission}
                defaultDisplayName={defaultDisplayName}
                onCancel={task.mySubmission ? () => setEditing(false) : undefined}
              />
            </div>
          )}
        </div>
      )}

      {!task.isOpen && !task.mySubmission && (
        <div className="border-t border-border pt-4">
          <p className="text-sm italic text-muted-foreground">Tento úkol již není otevřen pro odevzdání.</p>
        </div>
      )}

      {/* Other students' solutions */}
      {task.shareSolution && otherSubmissions.length > 0 && (
        <div className="border-t border-border pt-5">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Řešení ostatních ({otherSubmissions.length})
          </div>
          <div className="space-y-4">
            {otherSubmissions.map((s) => (
              <SolutionCard
                key={s._id}
                submission={s}
                solutionFields={task.solutionFields}
                defaultDisplayName={defaultDisplayName}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TaskBoardInner (per task) ─────────────────────────────────────

function TaskBoardItem({
  taskId,
  lectureId,
  defaultDisplayName,
}: {
  taskId: string;
  lectureId: string;
  defaultDisplayName: string;
}) {
  const taskData = useQuery(api.tasks.getTaskWithSubmissions, { taskId, lectureId });

  if (taskData === undefined) return null;
  if (!taskData) return null;

  return (
    <TaskCard
      task={taskData as TaskData}
      defaultDisplayName={defaultDisplayName}
    />
  );
}

// ── Root export ───────────────────────────────────────────────────

export default function TaskBoard({ lectureId }: { lectureId: string; slug: string }) {
  const openTasks = useQuery(api.tasks.getOpenTasksForLecture, { lectureId });

  // Derive a default display name from user info (use email username part)
  // We don't have the user email here, so we default to empty string — the user fills it in
  const defaultDisplayName = "";

  if (openTasks === undefined) return null;
  if (openTasks.length === 0) {
    return (
      <section
        className="mt-8 border-t border-border pt-10"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <div className="mb-6">
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Úkoly
          </div>
          <h2
            className="text-xl font-black uppercase tracking-tight"
            style={{ color: "var(--czechitas-blue)" }}
          >
            Úkoly k lekci
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Zatím nejsou žádné otevřené úkoly.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="mt-8 border-t border-border pt-10"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="mb-6">
        <div className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Úkoly
        </div>
        <h2
          className="text-xl font-black uppercase tracking-tight"
          style={{ color: "var(--czechitas-blue)" }}
        >
          Úkoly k lekci
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Odevzdejte svá řešení a prohlédněte si, jak to řešili ostatní.
        </p>
      </div>

      <div className="space-y-6">
        {openTasks.map((t) => (
          <TaskBoardItem
            key={t._id}
            taskId={t.taskId}
            lectureId={lectureId}
            defaultDisplayName={defaultDisplayName}
          />
        ))}
      </div>
    </section>
  );
}
