import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../useSearch';
import type { CategorizedResults } from '../useSearch';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const MOCK_API_RESPONSE: CategorizedResults = {
  courses: [
    {
      id: 'FI-101',
      title: 'Investment Fundamentals for Creators',
      category: 'course',
      instructor: 'Dr. Sarah Connor',
      rating: 4.8,
      price: 59.99,
      image:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    },
  ],
  instructors: [],
  topics: [],
  investments: [
    {
      id: 'INV-101',
      title: 'Investment Fundamentals for Creators',
      category: 'investment',
      description: 'Understand capital allocation, growth opportunities, and risk management.',
    },
    {
      id: 'INV-102',
      title: 'Investment Planning for Startups',
      category: 'investment',
      description: 'Learn how to build investor-ready business plans and pitch decks.',
    },
    {
      id: 'INV-103',
      title: 'Strategic Capital Deployment',
      category: 'investment',
      description: 'Align project goals with effective investment and sourcing strategies.',
    },
  ],
};

describe('useSearch investment feature support', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();

    // Create fetch mock — assign directly (avoids spyOn issues in jsdom)
    globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      const queryParam = new URL(urlStr, 'http://localhost').searchParams.get('q') || '';

      if (queryParam.toLowerCase().includes('investment')) {
        return new Response(JSON.stringify(MOCK_API_RESPONSE), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (queryParam.toLowerCase().includes('creators')) {
        return new Response(
          JSON.stringify({
            courses: [],
            instructors: [],
            topics: [],
            investments: MOCK_API_RESPONSE.investments.filter((i) =>
              i.title.toLowerCase().includes('creators'),
            ),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ courses: [], instructors: [], topics: [], investments: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns investment results when the query matches investment content', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.search('investment');
    });

    // Advance past the debounce window
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Drain the microtask queue from the async fetch handler
    await act(async () => {});

    expect(result.current.results.investments).toHaveLength(3);
    expect(result.current.results.investments[0].title).toContain('Investment');
    expect(result.current.isLoading).toBe(false);
  });

  it('returns only relevant investment search results for a specific investment query', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.search('creators');
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Drain the microtask queue
    await act(async () => {});

    expect(result.current.results.investments).toHaveLength(1);
    expect(result.current.results.investments[0].title).toContain('Creators');
    expect(result.current.results.courses).toEqual([]);
    expect(result.current.results.topics).toEqual([]);
  });
});
