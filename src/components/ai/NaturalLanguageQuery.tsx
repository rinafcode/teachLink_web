'use client';

import { useState, useCallback } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { apiClient } from '@/lib/api';

// POST /api/ai/search — { query: string } → { results: SearchResult[] }

interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
}

export default function NaturalLanguageQuery() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(false);
    try {
      const { results: res } = await apiClient.post<{ results: SearchResult[] }>('/api/ai/search', {
        query: q,
      });
      setResults(res);
    } catch {
      setError(true);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, e.g. 'intro to machine learning'…"
              aria-label="Natural language search"
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            aria-label="Search"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? '…' : 'Search'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <p className="text-sm text-center text-red-500">Search failed. Please try again.</p>
        )}

        {results !== null && results.length === 0 && (
          <p className="text-sm text-center text-gray-400 py-4">No results found.</p>
        )}

        {results?.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {item.description}
            </p>
            <a
              href={item.url}
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
