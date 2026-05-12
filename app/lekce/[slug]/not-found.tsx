import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/navbar';

export default function LectureNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-1 w-full" style={{ background: 'var(--czechitas-pink)' }} />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-24 text-center">
        <p
          className="mb-3 text-6xl font-black"
          style={{ color: 'var(--czechitas-pink)', fontFamily: 'var(--font-sans)', opacity: 0.2 }}
        >
          404
        </p>
        <h1
          className="mb-4 text-2xl font-black uppercase tracking-wide"
          style={{ color: 'var(--czechitas-blue)', fontFamily: 'var(--font-sans)' }}
        >
          Lekce nebyla nalezena.
        </h1>
        <p className="mb-10 text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>
          Požadovaná lekce neexistuje nebo ještě není dostupná.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white no-underline transition-opacity hover:opacity-85"
          style={{ background: 'var(--czechitas-blue)', fontFamily: 'var(--font-sans)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na přehled lekcí
        </Link>
      </main>
    </div>
  );
}
