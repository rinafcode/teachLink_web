'use client';

/**
 * NaturalLanguageQuery – natural language search over courses/resources
 *
 * API (placeholder – implement backend to match):
 *   POST /api/ai/search  { query: string }
 *   → ApiResponse<SearchResult[]>
 */

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

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
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await apiClient.post<ApiResponse<SearchResult[]>>('/api/ai/search', {
        query: q,
      });
      setResults(res.data);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm p-5"
      aria-label="Natural Language Search"
    >
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-[#0066FF] dark:text-[#00C2FF]" aria-hidden="true" />
        <h2 className="font-semibold text-[#0F172A] dark:text-white">Search Courses</h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4" role="search">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. beginner Python for data science"
          aria-label="Search query"
          disabled={loading}
          className="flex-1 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          aria-label="Submit search"
          className="px-4 py-2 rounded-lg bg-[#0066FF] dark:bg-[#00C2FF] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {results !== null && results.length === 0 && (
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">No results found.</p>
      )}

      {results !== null && results.length > 0 && (
        <ul className="space-y-3">
          {results.map((r) => (
            <li key={r.id} className="rounded-lg bg-[#F1F5F9] dark:bg-[#0F172A] px-3 py-2">
              <a
                href={r.url}
                className="font-medium text-[#0066FF] dark:text-[#00C2FF] hover:underline text-sm"
              >
                {r.title}
              </a>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{r.description}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
