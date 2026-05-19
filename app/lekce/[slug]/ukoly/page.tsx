import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import Navbar from '@/components/navbar';
import AuthGuard from '@/components/auth-guard';
import TaskBoard from '@/components/task-board';
import LectureActivityNav from '@/components/lecture-activity-nav';
import { getLectureBySlug, LECTURES } from '@/lib/lectures';

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
  return { title: `Úkoly – ${lecture.title} — Vibe coding` };
}

export default async function UkolyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lecture = getLectureBySlug(slug);
  if (!lecture) notFound();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-1 w-full" style={{ background: 'var(--czechitas-blue)' }} />

        <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
          <LectureActivityNav lectureId={lecture.id} slug={slug} current="ukoly" />

          <header className="mb-10 pb-7" style={{ borderBottom: '2px solid var(--czechitas-blue)' }}>
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
              style={{ fontFamily: 'var(--font-sans)', color: 'var(--czechitas-blue)', letterSpacing: '-0.01em' }}
            >
              {lecture.title}
            </h1>
          </header>

          <TaskBoard lectureId={lecture.id} slug={slug} />
        </main>
      </div>
    </AuthGuard>
  );
}
