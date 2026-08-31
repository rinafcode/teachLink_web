import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdvancedSearchInterface } from '@/components/search/AdvancedSearchInterface';

export const metadata: Metadata = {
  title: 'Advanced Search | TeachLink',
  description: 'Powerful multi-dimensional search for the TeachLink ecosystem.',
  openGraph: {
    title: 'Advanced Search | TeachLink',
    description: 'Powerful multi-dimensional search for the TeachLink ecosystem.',
    type: 'website',
    siteName: 'TeachLink',
  },
  twitter: {
    card: 'summary',
    site: '@teachlink',
    title: 'Advanced Search | TeachLink',
    description: 'Powerful multi-dimensional search for the TeachLink ecosystem.',
  },
};

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-slate-50/50">
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-4 py-12 text-center text-slate-400">
            Loading search...
          </div>
        }
      >
        <AdvancedSearchInterface />
      </Suspense>
    </main>
  );
}
