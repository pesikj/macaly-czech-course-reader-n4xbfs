import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/navbar';

export const metadata: Metadata = {
  title: 'O kurzu — Vibe coding',
  description: 'Informace o online kurzu Vibe coding.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-1 w-full" style={{ background: 'var(--czechitas-pink)' }} />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground no-underline"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zpět na přehled
          </Link>
        </div>

        <header className="mb-10 pb-7" style={{ borderBottom: '2px solid var(--czechitas-pink)' }}>
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Online kurz
          </p>
          <h1
            className="text-3xl font-black uppercase tracking-tight sm:text-4xl"
            style={{ color: 'var(--czechitas-blue)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}
          >
            O kurzu
          </h1>
        </header>

        <p
          className="italic text-muted-foreground"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem' }}
        >
          Informace o kurzu budou doplněny později.
        </p>
      </main>
    </div>
  );
}
