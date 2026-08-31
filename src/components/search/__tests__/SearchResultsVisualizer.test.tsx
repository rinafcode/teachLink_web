import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchResultsVisualizer } from '../SearchResultsVisualizer';
import type { SearchResult } from '../../utils/searchUtils';

const mockResults: SearchResult[] = [
  {
    id: 'res-1',
    type: 'course',
    title: 'Starknet Cairo Essentials',
    description: 'Learn Cairo and Starknet development from scratch.',
    createdAt: '2024-05-10T12:00:00.000Z',
    relevanceScore: 0.95,
    author: 'Alice',
    rating: 4.8,
    price: 0,
    topic: 'Cairo',
    difficulty: 'beginner',
    reputation: 99,
  },
];

describe('SearchResultsVisualizer', () => {
  it('renders a distinct, accessible empty state when there are zero results and not searching', () => {
    const onSortChange = vi.fn();
    render(
      <SearchResultsVisualizer
        results={[]}
        isSearching={false}
        sortBy="relevance"
        onSortChange={onSortChange}
      />,
    );

    const emptyState = screen.getByTestId('search-empty-state');
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveAttribute('role', 'status');
    expect(emptyState).toHaveAttribute('aria-live', 'polite');

    expect(screen.getByRole('heading', { level: 3, name: /no results found/i })).toBeInTheDocument();
    expect(
      screen.getByText(/we couldn't find any matches for your search/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/try adjusting your query keywords or filters/i),
    ).toBeInTheDocument();
  });

  it('renders loading skeleton when isSearching is true', () => {
    const onSortChange = vi.fn();
    const { container } = render(
      <SearchResultsVisualizer
        results={[]}
        isSearching={true}
        sortBy="relevance"
        onSortChange={onSortChange}
      />,
    );

    expect(screen.queryByTestId('search-empty-state')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBe(3);
  });

  it('renders search results when results are provided', () => {
    const onSortChange = vi.fn();
    render(
      <SearchResultsVisualizer
        results={mockResults}
        isSearching={false}
        sortBy="relevance"
        onSortChange={onSortChange}
      />,
    );

    expect(screen.queryByTestId('search-empty-state')).not.toBeInTheDocument();
    expect(screen.getByText('1 results')).toBeInTheDocument();
    expect(screen.getByText('Starknet Cairo Essentials')).toBeInTheDocument();
    expect(screen.getByText('Learn Cairo and Starknet development from scratch.')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('calls onSortChange when user changes the sort option', () => {
    const onSortChange = vi.fn();
    render(
      <SearchResultsVisualizer
        results={mockResults}
        isSearching={false}
        sortBy="relevance"
        onSortChange={onSortChange}
      />,
    );

    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'newest' } });

    expect(onSortChange).toHaveBeenCalledWith('newest');
  });
});
