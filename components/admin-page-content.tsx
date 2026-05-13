"use client";

import { Authenticated, Unauthenticated, AuthLoading, useQuery, useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { RefreshCw, LogOut, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

// ── Sign-in form ─────────────────────────────────────────────────

function SignInForm() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      setEmail(formData.get("email") as string);
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
        {/* Logo strip */}
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
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
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
      {/* Top bar */}
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
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <LogOut className="h-3.5 w-3.5" /> Odhlásit
          </button>
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

          {/* Live result of the current sync attempt */}
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
