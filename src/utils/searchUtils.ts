/**
 * Search Utilities for Advanced Search Interface
 */

export type SearchContentType = 'all' | 'post' | 'profile' | 'topic' | 'course' | 'tutorial';

export interface SearchResult {
  id: string;
  type: SearchContentType;
  title: string;
  description: string;
  author?: string;
  topic?: string;
  tags?: string[];
  createdAt: string;
  reputation?: number;
  relevanceScore: number;
  rating?: number;
  price?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface SearchFilters {
  types: SearchContentType[];
  topics: string[];
  difficulty: string[];
  priceRange: [number, number];
  dateRange: [string, string] | null;
  rating: number | null;
}

export interface SearchQuery {
  text: string;
  filters: SearchFilters;
  sortBy: 'relevance' | 'newest' | 'rating' | 'popularity';
  page: number;
  limit: number;
}

export interface SearchAnalytics {
  query: string;
  timestamp: number;
  resultsCount: number;
  filtersApplied: string[];
  clickThroughId?: string;
}

/**
 * Parse a complex search query string into parts
 * e.g. "Next.js author:admin type:tutorial"
 */
export const parseAdvancedQuery = (query: string) => {
  const parts = query.split(/\s+/);
  const result = {
    text: [] as string[],
    author: null as string | null,
    type: null as string | null,
    topic: null as string | null,
    tags: [] as string[],
  };

  parts.forEach((part) => {
    if (part.includes(':')) {
      const [key, value] = part.split(':');
      switch (key.toLowerCase()) {
        case 'author':
          result.author = value;
          break;
        case 'type':
          result.type = value;
          break;
        case 'topic':
          result.topic = value;
          break;
        case 'tag':
          result.tags.push(value);
          break;
        default:
          result.text.push(part);
      }
    } else {
      result.text.push(part);
    }
  });

  return {
    ...result,
    text: result.text.join(' '),
  };
};

/**
 * Highlighting utility for search results
 */
export const highlightMatch = (text: string, query: string) => {
  if (!query) return [text];
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.split(regex);
};

/**
 * Track search analytics
 */
export const trackSearch = (analytics: SearchAnalytics) => {
  if (typeof window === 'undefined') return;

  const history = JSON.parse(localStorage.getItem('search_analytics') || '[]') as SearchAnalytics[];
  history.unshift(analytics);
  // Keep last 100 entries for analysis
  localStorage.setItem('search_analytics', JSON.stringify(history.slice(0, 100)));
};

/**
 * Identify popular queries from history
 */
export const getPopularQueries = (): { query: string; count: number }[] => {
  if (typeof window === 'undefined') return [];
  const history = JSON.parse(localStorage.getItem('search_analytics') || '[]') as SearchAnalytics[];
  const counts: Record<string, number> = {};

  history.forEach((entry: SearchAnalytics) => {
    if (!entry.query) return;
    counts[entry.query] = (counts[entry.query] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

/**
 * Identify "Gaps" (queries with no results)
 */
export const getSearchGaps = (): string[] => {
  if (typeof window === 'undefined') return [];
  const history = JSON.parse(localStorage.getItem('search_analytics') || '[]') as SearchAnalytics[];

  return Array.from(
    new Set(
      history
        .filter((entry: SearchAnalytics) => entry.resultsCount === 0)
        .map((entry: SearchAnalytics) => entry.query),
    ),
  ).slice(0, 10);
};

/**
 * Mock search suggestions based on common queries and context
 */
export const getSearchSuggestions = (input: string): string[] => {
  const common = [
    'How to build on Starknet',
    'Cairo programming tutorial',
    'Next.js blockchain integration',
    'Tailwind CSS best practices',
    'Web3 security guide',
    'Decentralized finance explained',
    'Smart contract audit checklist',
    'Rust for Starknet developers',
  ];

  if (!input) return common.slice(0, 5);

  const matchedSuggestions = common.filter((s) => s.toLowerCase().includes(input.toLowerCase()));

  // Add contextual syntax suggestions
  if (input.length > 1) {
    matchedSuggestions.push(`author:${input}`);
    matchedSuggestions.push(`topic:${input}`);
    matchedSuggestions.push(`type:post ${input}`);
  }

  return matchedSuggestions.slice(0, 8);
};
