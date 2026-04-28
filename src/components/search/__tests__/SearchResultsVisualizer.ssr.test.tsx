import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  SearchResultsVisualizer,
  formatSearchResultDate,
} from '@/components/search/SearchResultsVisualizer';
import type { SearchResult } from '@/utils/searchUtils';

const sampleResults: SearchResult[] = [
  {
    id: 'r-1',
    type: 'course',
    title: 'SSR Stability',
    description: 'Hydration-safe rendering.',
    createdAt: '2024-01-02T03:04:05.000Z',
    relevanceScore: 0.9,
  },
];

describe('SearchResultsVisualizer SSR', () => {
  it('formats dates deterministically in UTC', () => {
    expect(formatSearchResultDate('2024-01-02T03:04:05.000Z')).toBe('01/02/2024');
  });

  it('returns empty string for invalid date values', () => {
    expect(formatSearchResultDate('not-a-date')).toBe('');
  });

  it('renders stable date content in server output', () => {
    const onSortChange = vi.fn();
    const html = renderToString(
      <SearchResultsVisualizer
        results={sampleResults}
        isSearching={false}
        sortBy="relevance"
        onSortChange={onSortChange}
      />,
    );

    expect(html).toContain('01/02/2024');
  });
});
