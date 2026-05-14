"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { Authenticated, Unauthenticated } from "convex/react"
import { api } from "@/convex/_generated/api"
import { LogOut } from "lucide-react"

function NavbarAuth() {
  const { signOut } = useAuthActions()
  const user = useQuery(api.users.currentLoggedInUser)

  return (
    <>
      <Authenticated>
        <span
          className="hidden sm:inline text-xs text-muted-foreground"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {user?.email ?? ""}
        </span>
        <button
          onClick={() => void signOut()}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Odhlásit
        </button>
      </Authenticated>
      <Unauthenticated>
        <Link
          href="/prihlaseni"
          className="rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Přihlásit se
        </Link>
      </Unauthenticated>
    </>
  )
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
        {/* Brand / logo */}
        <Link
          href="/"
          className="flex items-center gap-3 no-underline"
          aria-label="Vibe coding – přehled lekcí"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-black leading-none"
            style={{ background: "var(--czechitas-pink)", fontFamily: "var(--font-sans)" }}
            aria-hidden="true"
          >
            VC
          </span>
          <span
            className="text-sm font-extrabold uppercase tracking-widest"
            style={{ color: "var(--czechitas-blue)", fontFamily: "var(--font-sans)" }}
          >
            Vibe coding
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <a
            href="https://www.czechitas.cz/kurzy/vibe-coding-v-praxi-vytvor-si-vlastni-web-s-ai-bez-programovani"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            O kurzu
          </a>
          <NavbarAuth />
        </nav>
      </div>
    </header>
  )
}
