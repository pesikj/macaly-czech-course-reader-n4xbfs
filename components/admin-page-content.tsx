"use client";

import Link from "next/link";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
  useAction,
  useMutation,
} from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef } from "react";
import {
  RefreshCw,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  UserPlus,
  Trash2,
  Upload,
  Users,
  MessageSquare,
  ExternalLink,
  Unlock,
  Lock,
  ClipboardList,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

// ── Sign-in form ─────────────────────────────────────────────────

function SignInForm() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-check if email is allowed (debounce via query skip)
  const checkAllowed = useQuery(
    api.allowedUsers.checkEmailAllowed,
    pendingEmail.length > 3 ? { email: pendingEmail } : "skip"
  );

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const enteredEmail = (formData.get("email") as string).trim().toLowerCase();

      // Re-query whitelist synchronously using the value we already have
      // checkAllowed may be undefined if query is loading — treat as allowed to avoid blocking
      if (checkAllowed === false) {
        setError("Tento e-mail není v seznamu oprávněných uživatelů.");
        setIsLoading(false);
        return;
      }

      setEmail(enteredEmail);
      formData.set("email", enteredEmail);
      await signIn("resend-otp", formData);
      setStep("code");
    } catch {
      setError("Nepodařilo se odeslat kód. Zkuste to prosím znovu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await signIn("resend-otp", formData);
    } catch {
      setError("Nesprávný kód. Zkuste to prosím znovu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div
          className="mb-8 h-1.5 w-16 rounded-full"
          style={{ background: "var(--czechitas-pink)" }}
        />
        <h1
          className="mb-1 text-2xl font-black uppercase tracking-tight"
          style={{ fontFamily: "var(--font-sans)", color: "var(--czechitas-blue)" }}
        >
          Admin
        </h1>
        <p className="mb-8 text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          {step === "email"
            ? "Přihlaste se pomocí e-mailu."
            : `Zadejte 6místný kód, který jsme odeslali na ${email}.`}
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              name="email"
              type="email"
              placeholder="vas@email.cz"
              required
              disabled={isLoading}
              onChange={(e) => setPendingEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-current"
              style={{ fontFamily: "var(--font-sans)" }}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg py-2.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50"
              style={{
                fontFamily: "var(--font-sans)",
                background: isLoading ? "var(--czechitas-blue)" : "var(--czechitas-pink)",
              }}
            >
              {isLoading ? "Odesílám…" : "Odeslat kód"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <input type="hidden" name="email" value={email} />
            <input
              name="code"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              placeholder="123456"
              required
              disabled={isLoading}
              autoFocus
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-center text-lg font-bold tracking-[0.4em] outline-none focus:border-current"
              style={{ fontFamily: "var(--font-sans)" }}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg py-2.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50"
              style={{
                fontFamily: "var(--font-sans)",
                background: isLoading ? "var(--czechitas-blue)" : "var(--czechitas-pink)",
              }}
            >
              {isLoading ? "Ověřuji…" : "Ověřit kód"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setError(null); }}
              disabled={isLoading}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Použít jiný e-mail
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Sync status badge ─────────────────────────────────────────────

function StatusBadge({ status }: { status: "running" | "success" | "error" }) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-700">
        <Clock className="h-3 w-3 animate-pulse" /> Probíhá…
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-0.5 text-xs font-bold text-green-700">
        <CheckCircle className="h-3 w-3" /> Úspěch
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-0.5 text-xs font-bold text-red-700">
      <XCircle className="h-3 w-3" /> Chyba
    </span>
  );
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── User management section ───────────────────────────────────────

function UserManagement() {
  const users = useQuery(api.allowedUsers.list);
  const addUser = useMutation(api.allowedUsers.add);
  const addBulk = useMutation(api.allowedUsers.addBulk);
  const removeUser = useMutation(api.allowedUsers.remove);

  const [newEmail, setNewEmail] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [csvResult, setCsvResult] = useState<{ added: number; skipped: number } | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isCsvLoading, setIsCsvLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    if (!newEmail.trim()) return;
    setIsAdding(true);
    try {
      const result = await addUser({ email: newEmail.trim(), isAdmin: newIsAdmin });
      if (result === null) {
        setAddError("Tento e-mail je již v seznamu.");
      } else {
        setAddSuccess(`Uživatel ${newEmail.trim().toLowerCase()} byl přidán.`);
        setNewEmail("");
        setNewIsAdmin(false);
      }
    } catch (err) {
      setAddError(String(err));
    } finally {
      setIsAdding(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    setCsvResult(null);
    setIsCsvLoading(true);
    try {
      const text = await file.text();
      // Support CSV with or without header, one email per line or comma-separated
      const lines = text.split(/[\r\n,;]+/).map((l) => l.trim()).filter(Boolean);
      // Filter out obvious header lines like "email", "e-mail", etc.
      const emails = lines.filter(
        (l) => l.includes("@") && !l.toLowerCase().startsWith("email")
      );
      if (emails.length === 0) {
        setCsvError("V souboru nebyly nalezeny žádné platné e-mailové adresy.");
        return;
      }
      const result = await addBulk({ emails, isAdmin: false });
      setCsvResult(result);
      console.log("CSV import result:", result);
    } catch (err) {
      setCsvError(String(err));
    } finally {
      setIsCsvLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (id: Id<"allowedUsers">) => {
    if (!confirm("Opravdu chcete odstranit tohoto uživatele?")) return;
    try {
      await removeUser({ id });
    } catch (err) {
      alert(String(err));
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Users className="h-5 w-5" style={{ color: "var(--czechitas-blue)" }} />
        <h2
          className="text-lg font-black uppercase tracking-tight"
          style={{ fontFamily: "var(--font-sans)", color: "var(--czechitas-blue)" }}
        >
          Správa uživatelů
        </h2>
      </div>

      {/* Add single user */}
      <form onSubmit={handleAddUser} className="mb-5 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label
            className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            E-mail
          </label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="student@email.cz"
            required
            disabled={isAdding}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-current disabled:opacity-50"
            style={{ fontFamily: "var(--font-sans)" }}
          />
        </div>
        <label className="flex items-center gap-2 mb-2 cursor-pointer select-none text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          <input
            type="checkbox"
            checked={newIsAdmin}
            onChange={(e) => setNewIsAdmin(e.target.checked)}
            disabled={isAdding}
            className="h-4 w-4 rounded"
          />
          Admin
        </label>
        <button
          type="submit"
          disabled={isAdding || !newEmail.trim()}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50"
          style={{ fontFamily: "var(--font-sans)", background: "var(--czechitas-pink)" }}
        >
          <UserPlus className="h-4 w-4" />
          {isAdding ? "Přidávám…" : "Přidat"}
        </button>
      </form>

      {addError && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {addError}
        </div>
      )}
      {addSuccess && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" /> {addSuccess}
        </div>
      )}

      {/* CSV import */}
      <div className="mb-5 border-t border-border pt-5">
        <p
          className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Hromadný import z CSV
        </p>
        <p className="mb-3 text-xs text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          Nahrajte CSV soubor s e-mailovými adresami (jeden na řádek nebo oddělené čárkou).
        </p>
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary ${isCsvLoading ? "opacity-50 pointer-events-none" : ""}`}
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <Upload className="h-4 w-4" />
          {isCsvLoading ? "Importuji…" : "Nahrát CSV"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleCsvUpload}
            disabled={isCsvLoading}
          />
        </label>

        {csvError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {csvError}
          </div>
        )}
        {csvResult && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700" style={{ fontFamily: "var(--font-sans)" }}>
            Import dokončen: <strong>{csvResult.added}</strong> přidáno, <strong>{csvResult.skipped}</strong> přeskočeno (již existuje).
          </div>
        )}
      </div>

      {/* User list */}
      <div className="border-t border-border pt-5">
        <p
          className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Registrovaní uživatelé ({users?.length ?? "…"})
        </p>

        {users === undefined ? (
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
            Načítám…
          </p>
        ) : users.length === 0 ? (
          <p className="text-sm italic text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
            Zatím žádní uživatelé.
          </p>
        ) : (
          <ul className="space-y-2">
            {users.map((u) => (
              <li
                key={u._id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="truncate text-sm font-medium"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {u.email}
                  </span>
                  {u.isAdmin && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-white"
                      style={{ background: "var(--czechitas-blue)", fontFamily: "var(--font-sans)" }}
                    >
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(u._id)}
                  className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
                  title="Odstranit uživatele"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Reflection management ─────────────────────────────────────────

function ReflectionManagement() {
  const questions = useQuery(api.reflections.listAllQuestions);
  const toggleQuestion = useMutation(api.reflections.toggleQuestion);
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (id: Id<"reflectionQuestions">) => {
    setToggling(id);
    try {
      await toggleQuestion({ id });
    } catch (err) {
      alert(String(err));
    } finally {
      setToggling(null);
    }
  };

  // Group questions by lectureId
  const grouped: Record<string, NonNullable<typeof questions>> = {};
  if (questions) {
    for (const q of questions) {
      if (!grouped[q.lectureId]) grouped[q.lectureId] = [];
      grouped[q.lectureId].push(q);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" style={{ color: "var(--czechitas-blue)" }} />
        <h2
          className="text-lg font-black uppercase tracking-tight"
          style={{ fontFamily: "var(--font-sans)", color: "var(--czechitas-blue)" }}
        >
          Reflexe
        </h2>
      </div>

      <p className="mb-5 text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
        Otázky se synchronizují z&nbsp;GitHub repozitáře (soubor{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">activities.json</code>
        {" "}v adresáři každé lekce). Pomocí tlačítek otevřete nebo zavřete sběr odpovědí.
      </p>

      {questions === undefined && (
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          Načítám…
        </p>
      )}

      {questions !== null && questions !== undefined && questions.length === 0 && (
        <p className="text-sm italic text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          Zatím žádné otázky. Proveďte synchronizaci z&nbsp;GitHubu.
        </p>
      )}

      {questions === null && (
        <p className="text-sm text-red-600" style={{ fontFamily: "var(--font-sans)" }}>
          Nemáte oprávnění zobrazit reflexe.
        </p>
      )}

      {questions && questions.length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([lectureId, qs]) => (
            <div key={lectureId}>
              <p
                className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {lectureId}
              </p>
              <ul className="space-y-2">
                {qs.map((q) => (
                  <li
                    key={q._id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium leading-snug text-foreground"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        {q.question}
                      </p>
                      <p
                        className="mt-0.5 text-xs text-muted-foreground"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        {q.answerCount} {q.answerCount === 1 ? "odpověď" : q.answerCount >= 2 && q.answerCount <= 4 ? "odpovědi" : "odpovědí"}
                        {" · "}
                        <span
                          style={{ color: q.isOpen ? "var(--czechitas-pink)" : undefined }}
                          className={q.isOpen ? "font-bold" : ""}
                        >
                          {q.isOpen ? "Otevřená" : "Zavřená"}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {q.answerCount > 0 && (
                        <Link
                          href={`/admin/reflexe/${q._id}`}
                          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                          style={{ fontFamily: "var(--font-sans)" }}
                          title="Otevřít diskuzní pohled"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Diskuze
                        </Link>
                      )}
                      <button
                        onClick={() => handleToggle(q._id as Id<"reflectionQuestions">)}
                        disabled={toggling === q._id}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50 transition-opacity"
                        style={{
                          fontFamily: "var(--font-sans)",
                          background: q.isOpen ? "var(--czechitas-blue)" : "var(--czechitas-pink)",
                        }}
                        title={q.isOpen ? "Zavřít sběr odpovědí" : "Otevřít sběr odpovědí"}
                      >
                        {q.isOpen ? (
                          <><Lock className="h-3.5 w-3.5" /> Zavřít</>
                        ) : (
                          <><Unlock className="h-3.5 w-3.5" /> Otevřít</>
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Task management ───────────────────────────────────────────────

function TaskManagement() {
  const tasks = useQuery(api.tasks.listAllTasks);
  const toggleTask = useMutation(api.tasks.toggleTask);
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (id: Id<"tasks">) => {
    setToggling(id);
    try {
      await toggleTask({ id });
    } catch (err) {
      alert(String(err));
    } finally {
      setToggling(null);
    }
  };

  // Group tasks by lectureId
  const grouped: Record<string, NonNullable<typeof tasks>> = {};
  if (tasks) {
    for (const t of tasks) {
      if (!grouped[t.lectureId]) grouped[t.lectureId] = [];
      grouped[t.lectureId].push(t);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <ClipboardList className="h-5 w-5" style={{ color: "var(--czechitas-blue)" }} />
        <h2
          className="text-lg font-black uppercase tracking-tight"
          style={{ fontFamily: "var(--font-sans)", color: "var(--czechitas-blue)" }}
        >
          Úkoly
        </h2>
      </div>

      <p className="mb-5 text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
        Úkoly se synchronizují z&nbsp;GitHub repozitáře (soubor{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">activities.json</code>
        {" "}v adresáři každé lekce). Pomocí tlačítek otevřete nebo zavřete odevzdávání.
      </p>

      {tasks === undefined && (
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          Načítám…
        </p>
      )}

      {tasks !== null && tasks !== undefined && tasks.length === 0 && (
        <p className="text-sm italic text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          Zatím žádné úkoly. Proveďte synchronizaci z&nbsp;GitHubu.
        </p>
      )}

      {tasks === null && (
        <p className="text-sm text-red-600" style={{ fontFamily: "var(--font-sans)" }}>
          Nemáte oprávnění zobrazit úkoly.
        </p>
      )}

      {tasks && tasks.length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([lectureId, ts]) => (
            <div key={lectureId}>
              <p
                className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {lectureId}
              </p>
              <ul className="space-y-2">
                {ts.map((t) => (
                  <li
                    key={t._id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium leading-snug text-foreground"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        {t.title}
                      </p>
                      <p
                        className="mt-0.5 text-xs text-muted-foreground"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        {t.submissionCount}{" "}
                        {t.submissionCount === 1
                          ? "odevzdání"
                          : t.submissionCount >= 2 && t.submissionCount <= 4
                          ? "odevzdání"
                          : "odevzdání"}
                        {" · "}
                        <span
                          style={{ color: t.isOpen ? "var(--czechitas-pink)" : undefined }}
                          className={t.isOpen ? "font-bold" : ""}
                        >
                          {t.isOpen ? "Otevřený" : "Zavřený"}
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleToggle(t._id as Id<"tasks">)}
                        disabled={toggling === t._id}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50 transition-opacity"
                        style={{
                          fontFamily: "var(--font-sans)",
                          background: t.isOpen ? "var(--czechitas-blue)" : "var(--czechitas-pink)",
                        }}
                        title={t.isOpen ? "Zavřít odevzdávání" : "Otevřít odevzdávání"}
                      >
                        {t.isOpen ? (
                          <><Lock className="h-3.5 w-3.5" /> Zavřít</>
                        ) : (
                          <><Unlock className="h-3.5 w-3.5" /> Otevřít</>
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Admin dashboard ───────────────────────────────────────────────

function AdminDashboard() {
  const { signOut } = useAuthActions();
  const isAdmin = useQuery(api.users.isAdmin);
  const syncLog = useQuery(api.lectures.getLatestSyncLog);
  const syncAction = useAction(api.github.syncFromGithub);
  const [syncing, setSyncing] = useState(false);
  const [branch, setBranch] = useState("main");
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAction({ branch: branch.trim() || "main" });
      setSyncResult(result);
      console.log("Sync result:", result);
    } catch (err) {
      setSyncResult({ success: false, message: String(err) });
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  if (isAdmin === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Načítám…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <XCircle className="h-12 w-12 text-red-400" />
        <p
          className="text-center text-sm text-muted-foreground"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Nemáte oprávnění přistupovat k admin sekci.
        </p>
        <button
          onClick={() => void signOut()}
          className="text-sm font-bold text-muted-foreground underline hover:text-foreground"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Odhlásit se
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 w-full" style={{ background: "var(--czechitas-pink)" }} />

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <div
              className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Vibe coding
            </div>
            <h1
              className="text-3xl font-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-sans)", color: "var(--czechitas-blue)" }}
            >
              Admin
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Zpět na obsah
            </Link>
            <button
              onClick={() => void signOut()}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <LogOut className="h-3.5 w-3.5" /> Odhlásit
            </button>
          </div>
        </div>

        {/* Sync card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2
            className="mb-1 text-lg font-black uppercase tracking-tight"
            style={{ fontFamily: "var(--font-sans)", color: "var(--czechitas-blue)" }}
          >
            Synchronizace obsahu
          </h2>
          <p className="mb-4 text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
            Stáhne obsah lekcí z&nbsp;GitHub repozitáře a uloží do databáze.
          </p>

          <div className="mb-4 flex items-center gap-3">
            <label
              htmlFor="branch-input"
              className="shrink-0 text-sm font-bold text-muted-foreground"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Větev
            </label>
            <input
              id="branch-input"
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={syncing}
              placeholder="main"
              className="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-sm outline-none focus:border-current disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-60"
            style={{
              fontFamily: "var(--font-sans)",
              background: "var(--czechitas-pink)",
            }}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Synchronizuji…" : "Synchronizovat z GitHubu"}
          </button>

          {syncResult && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                syncResult.success
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {syncResult.message}
            </div>
          )}
        </div>

        {/* Last sync log */}
        {syncLog !== undefined && (
          <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2
              className="mb-4 text-base font-black uppercase tracking-tight"
              style={{ fontFamily: "var(--font-sans)", color: "var(--czechitas-blue)" }}
            >
              Poslední synchronizace
            </h2>

            {syncLog === null ? (
              <p className="text-sm italic text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
                Zatím žádná synchronizace neproběhla.
              </p>
            ) : (
              <div className="space-y-3 text-sm" style={{ fontFamily: "var(--font-sans)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stav</span>
                  <StatusBadge status={syncLog.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Zahájeno</span>
                  <span className="font-medium">{formatDate(syncLog.startedAt)}</span>
                </div>
                {syncLog.finishedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dokončeno</span>
                    <span className="font-medium">{formatDate(syncLog.finishedAt)}</span>
                  </div>
                )}
                {syncLog.lecturesSynced !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Synchronizováno lekcí</span>
                    <span className="font-bold" style={{ color: "var(--czechitas-blue)" }}>
                      {syncLog.lecturesSynced}
                    </span>
                  </div>
                )}
                {syncLog.message && (
                  <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {syncLog.message}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* User management */}
        <UserManagement />

        {/* Reflection management */}
        <ReflectionManagement />

        {/* Task management */}
        <TaskManagement />
      </div>
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────

export default function AdminPageContent() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">Načítám…</p>
        </div>
      </AuthLoading>
      <Authenticated>
        <AdminDashboard />
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </>
  );
}
