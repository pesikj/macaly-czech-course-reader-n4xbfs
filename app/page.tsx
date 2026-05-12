import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/navbar';
import { LECTURES, type Lecture } from '@/lib/lectures';
import type { Metadata } from 'next';
import siteMetadata from '@/app/metadata.json';

export const metadata: Metadata = siteMetadata['/'];

function LectureCard({ lecture }: { lecture: Lecture }) {
  const inner = (
    <div className="group relative flex items-start gap-5 rounded-xl border bg-card p-5 transition-all duration-200 cursor-pointer hover:shadow-lg">
      {/* Hover: left accent bar */}
      <span
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: 'var(--czechitas-pink)' }}
      />

      {/* Lecture number badge */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors"
        style={{
          fontFamily: 'var(--font-sans)',
          background: 'rgba(var(--czechitas-pink-rgb), 0.1)',
          color: 'var(--czechitas-pink)',
        }}
      >
        {lecture.order}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h2
          className="text-sm font-extrabold uppercase tracking-wide mb-1"
          style={{ fontFamily: 'var(--font-sans)', color: 'var(--czechitas-blue)' }}
        >
          {lecture.title}
        </h2>

        {lecture.description && (
          <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-sans)' }}>
            {lecture.description}
          </p>
        )}
      </div>

      {/* Right icon */}
      <div className="shrink-0 self-center">
        <ChevronRight
          className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: 'var(--czechitas-pink)' }}
        />
      </div>
    </div>
  );

  return (
    <Link href={`/lekce/${lecture.slug}`} className="block no-underline">
      {inner}
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero strip */}
      <div className="gradient-czechitas py-14 px-6">
        <div className="mx-auto max-w-4xl">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/75"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Online kurz
          </p>
          <h1
            className="mb-2 text-4xl font-black uppercase tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}
          >
            Vibe coding
          </h1>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-10">
        {/* Section heading */}
        <div className="mb-5">
          <h2
            className="text-xs font-extrabold uppercase tracking-[0.15em] text-muted-foreground"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Přehled lekcí
          </h2>
        </div>

        {/* Lecture list */}
        <div className="flex flex-col gap-3">
          {LECTURES.map((lecture) => (
            <LectureCard key={lecture.id} lecture={lecture} />
          ))}
        </div>
      </main>
    </div>
  );
}

