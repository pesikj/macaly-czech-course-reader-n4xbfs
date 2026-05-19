"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { Authenticated, Unauthenticated } from "convex/react"
import { api } from "@/convex/_generated/api"
import { LogOut, Pencil, Check, X } from "lucide-react"

function AdminNavButton() {
  const isAdmin = useQuery(api.users.isAdmin)
  if (!isAdmin) return null
  return (
    <Link
      href="/admin"
      className="rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      Admin
    </Link>
  )
}

function DisplayNameEditor() {
  const displayName = useQuery(api.users.getMyDisplayName)
  const setDisplayName = useMutation(api.users.setDisplayName)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("")
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    setValue(displayName ?? "")
    setEditing(true)
  }

  const save = async () => {
    if (!value.trim()) return
    setSaving(true)
    try {
      await setDisplayName({ displayName: value })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => setEditing(false)

  if (displayName === undefined) return null

  if (editing) {
    return (
      <div className="hidden sm:flex items-center gap-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void save(); if (e.key === "Escape") cancel() }}
          disabled={saving}
          className="rounded border border-border bg-background px-2 py-0.5 text-xs outline-none focus:border-current w-32"
          style={{ fontFamily: "var(--font-sans)" }}
        />
        <button onClick={() => void save()} disabled={saving || !value.trim()} className="text-muted-foreground hover:text-foreground transition-colors">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={cancel} disabled={saving} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={startEdit}
      className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
      style={{ fontFamily: "var(--font-sans)" }}
      title="Upravit zobrazované jméno"
    >
      {displayName}
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

function NavbarAuth() {
  const { signOut } = useAuthActions()

  return (
    <>
      <Authenticated>
        <DisplayNameEditor />
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
          <AdminNavButton />
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
