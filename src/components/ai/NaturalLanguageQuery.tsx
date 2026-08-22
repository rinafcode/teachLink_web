'use client';

import React, { useState, useCallback } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { useApiResource } from '@/hooks/useApiResource';

// POST /api/ai/search — { query: string } → ApiResponse<SearchResult[]>

interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
}

export default function NaturalLanguageQuery() {
  const [query, setQuery] = useState('');
  const { data, setData, loading, error, refetch } = useApiResource<{ results: SearchResult[] }>('/api/ai/search', { 
    method: 'POST', 
    manual: true 
  });
  
  const results = data ? data.results : null;

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q || loading) return;
    setData(null);
    await refetch({ body: { query: q } });
  }, [query, loading, refetch, setData]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    search();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <label htmlFor="search-query" className="sr-only">
              Search query
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="search-query"
              type="text"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, e.g. 'intro to machine learning'…"
              aria-label="Search query"
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            aria-label="Submit search"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <p className="text-sm text-center text-red-500" role="alert">
            Search failed. Please try again.
          </p>
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
