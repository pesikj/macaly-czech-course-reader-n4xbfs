import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';

import Navbar from '@/components/navbar';
import LectureContentLoader from '@/components/lecture-content-loader';
import { getLectureBySlug, getPrevNextLectures, LECTURES } from '@/lib/lectures';

export async function generateStaticParams() {
  return LECTURES.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lecture = getLectureBySlug(slug);
  if (!lecture) return { title: 'Lekce nenalezena' };
  return {
    title: `${lecture.title} — Vibe coding`,
    description: lecture.description ?? 'Materiály k online kurzu Vibe coding',
  };
}

function readMarkdownContent(markdownSource: string): string | null {
  try {
    const fullPath = path.join(process.cwd(), markdownSource);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

export default async function LecturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lecture = getLectureBySlug(slug);

  if (!lecture) {
    notFound();
  }

  const { prev, next } = getPrevNextLectures(slug);
  const markdownContent = readMarkdownContent(lecture.markdownSource);

  const availablePrev = prev ?? null;
  const availableNext = next ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Thin pink top bar */}
      <div className="h-1 w-full" style={{ background: 'var(--czechitas-pink)' }} />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zpět na přehled
          </Link>
        </div>

        {/* Lecture header */}
        <header className="mb-10 pb-7" style={{ borderBottom: '2px solid var(--czechitas-pink)' }}>
          <div className="mb-3">
            <span
              className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Lekce {lecture.order}
            </span>
          </div>
          <h1
            className="text-3xl font-black uppercase tracking-tight sm:text-4xl"
            style={{
              fontFamily: 'var(--font-sans)',
              color: 'var(--czechitas-blue)',
              letterSpacing: '-0.01em',
            }}
          >
            {lecture.title}
          </h1>
        </header>

        {/* Markdown content — loads from Convex (GitHub sync), falls back to local file */}
        <article>
          <LectureContentLoader lectureId={lecture.id} fallbackContent={markdownContent} />
        </article>

        {/* Prev / Next */}
        <nav
          className="mt-14 flex items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid hsl(var(--border))' }}
          aria-label="Navigace mezi lekcemi"
        >
          {availablePrev ? (
            <Link
              href={`/lekce/${availablePrev.slug}`}
              className="group flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm no-underline transition-all hover:shadow-md"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <ChevronLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                style={{ color: 'var(--czechitas-blue)' }}
              />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Předchozí lekce
                </div>
                <div
                  className="font-bold text-sm uppercase tracking-wide"
                  style={{ color: 'var(--czechitas-blue)' }}
                >
                  {availablePrev.title}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {availableNext ? (
            <Link
              href={`/lekce/${availableNext.slug}`}
              className="group ml-auto flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm no-underline transition-all hover:shadow-md"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Další lekce
                </div>
                <div
                  className="font-bold text-sm uppercase tracking-wide"
                  style={{ color: 'var(--czechitas-blue)' }}
                >
                  {availableNext.title}
                </div>
              </div>
              <ChevronRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                style={{ color: 'var(--czechitas-blue)' }}
              />
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </main>
    </div>
  );
}
