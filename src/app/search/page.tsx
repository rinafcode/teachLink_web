import type { Metadata } from 'next';
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
      <AdvancedSearchInterface />
    </main>
  );
}
