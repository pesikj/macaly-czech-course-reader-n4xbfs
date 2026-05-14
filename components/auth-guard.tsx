"use client"

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

function RedirectToLogin() {
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => {
    const target = pathname && pathname !== "/prihlaseni" ? pathname : ""
    const url = target ? `/prihlaseni?from=${encodeURIComponent(target)}` : "/prihlaseni"
    router.replace(url)
  }, [router, pathname])
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
        Přesměrovávám na přihlášení…
      </p>
    </div>
  )
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
            Načítám…
          </p>
        </div>
      </AuthLoading>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated>
        <RedirectToLogin />
      </Unauthenticated>
    </>
  )
}
