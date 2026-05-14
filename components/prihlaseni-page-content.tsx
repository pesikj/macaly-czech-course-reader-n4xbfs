"use client"

import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { api } from "@/convex/_generated/api"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle } from "lucide-react"

function SignInForm() {
  const { signIn } = useAuthActions()
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const checkAllowed = useQuery(
    api.allowedUsers.checkEmailAllowed,
    step === "email" && email.trim().length > 3 ? { email } : "skip"
  )

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const enteredEmail = (formData.get("email") as string).trim().toLowerCase()

      // Check whitelist before sending OTP
      const allowed = await new Promise<boolean>((resolve) => {
        // Re-use checkEmailAllowed result if available, otherwise fetch inline
        resolve(checkAllowed ?? true) // if query hasn't loaded yet, let Convex decide
      })
      if (!allowed) {
        setError("Tento e-mail není registrován. Obraťte se na správce kurzu.")
        setIsLoading(false)
        return
      }

      setEmail(enteredEmail)
      formData.set("email", enteredEmail)
      await signIn("resend-otp", formData)
      setStep("code")
    } catch {
      setError("Nepodařilo se odeslat kód. Zkuste to prosím znovu.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await signIn("resend-otp", formData)
    } catch {
      setError("Nesprávný kód. Zkuste to prosím znovu.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div
          className="mb-8 h-1.5 w-16 rounded-full"
          style={{ background: "var(--czechitas-pink)" }}
        />
        <p
          className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Online kurz
        </p>
        <h1
          className="mb-1 text-2xl font-black uppercase tracking-tight"
          style={{ fontFamily: "var(--font-sans)", color: "var(--czechitas-blue)" }}
        >
          Vibe coding
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
              onClick={() => { setStep("email"); setError(null) }}
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
  )
}

function RedirectIfLoggedIn() {
  const router = useRouter()
  const searchParams = useSearchParams()
  useEffect(() => {
    const from = searchParams.get("from")
    router.replace(from && from.startsWith("/") ? from : "/")
  }, [router, searchParams])
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Přesměrovávám…</p>
    </div>
  )
}

export default function PrihlaseniPageContent() {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">Načítám…</p>
        </div>
      </AuthLoading>
      <Authenticated>
        <RedirectIfLoggedIn />
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </>
  )
}
