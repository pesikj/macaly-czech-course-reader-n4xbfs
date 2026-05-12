import './globals.css';
import type { Metadata } from 'next';
import { ConvexClientProvider } from '@/components/convex-client-provider';

export const metadata: Metadata = {
  title: 'Vibe coding — Materiály k online kurzu',
  description: 'Přehled lekcí online kurzu Vibe coding.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body suppressHydrationWarning={true}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
