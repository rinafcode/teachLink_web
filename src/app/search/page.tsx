import { AdvancedSearchInterface } from '@/components/search/AdvancedSearchInterface';

export const metadata = {
  title: 'Advanced Search | TeachLink',
  description: 'Powerful multi-dimensional search for the TeachLink ecosystem.',
};

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-slate-50/50">
      <AdvancedSearchInterface />
    </main>
  );
}
