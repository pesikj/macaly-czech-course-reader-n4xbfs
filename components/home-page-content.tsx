"use client"

import Link from "next/link"
import Navbar from "@/components/navbar"
import { LECTURES, type Lecture } from "@/lib/lectures"

const PHASE_LABELS = ["Základ", "Technologie", "Praxe", "Nasazení", "Design", "Projekt"]

function JourneyStep({ lecture, index }: { lecture: Lecture; index: number }) {
  const isLast = index === LECTURES.length - 1
  const phase = PHASE_LABELS[index] ?? `Lekce ${lecture.order}`

  return (
    <div className="journey-step">
      {!isLast && <div className="journey-connector" aria-hidden />}

      <Link href={`/lekce/${lecture.slug}`} className="journey-card group block no-underline">
        <div className="journey-card-header">
          <span className="journey-number" aria-hidden>
            {String(lecture.order).padStart(2, "0")}
          </span>
          <span className="journey-phase">{phase}</span>
        </div>

        <h2 className="journey-title">{lecture.title}</h2>
        <p className="journey-kompetence">{lecture.kompetence}</p>

        <span className="journey-cta">
          Otevřít lekci
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </div>
  )
}

function HomeContent() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="gradient-czechitas relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-10" style={{ background: "white" }} aria-hidden />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full opacity-5" style={{ background: "white" }} aria-hidden />
        <div className="relative mx-auto max-w-4xl px-6 py-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/70" style={{ fontFamily: "var(--font-sans)" }}>
            Online kurz · Czechitas
          </p>
          <h1 className="mb-4 text-5xl font-black uppercase tracking-tight text-white sm:text-6xl" style={{ fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>
            Vibe coding
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/80" style={{ fontFamily: "var(--font-sans)" }}>
            Šest lekcí, které tě provedou od prvního řádku kódu až po vlastní fungující web dostupný online.
          </p>
        </div>
      </div>

      {/* Section intro */}
      <div className="mx-auto max-w-4xl px-6 pt-14 pb-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--czechitas-pink)", fontFamily: "var(--font-sans)" }}>
          Tvoje cesta
        </p>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-tight sm:text-3xl" style={{ color: "var(--czechitas-blue)", fontFamily: "var(--font-sans)" }}>
          Co se naučíš
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>
          Každá lekce přidá konkrétní dovednost. Popis níže ti říká, co budeš po jejím absolvování umět – ne co bude na programu.
        </p>
      </div>

      {/* Journey */}
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-8">
        <div className="journey-track">
          {LECTURES.map((lecture, i) => (
            <JourneyStep key={lecture.id} lecture={lecture} index={i} />
          ))}
        </div>
      </main>
    </div>
  )
}

export default function HomePageContent() {
  return <HomeContent />
}
