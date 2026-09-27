// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningProgressList } from '../LearningProgressList';
import type { LearningProgressItem } from '@/types/api';

vi.mock('@/hooks/useLearningProgress', () => ({
  useLearningProgress: vi.fn(),
}));

vi.mock('@/hooks/useInternationalization', async () => {
  const translations = (await import('@/locales/en.json')).default;
  const read = (key: string) =>
    key.split('.').reduce<unknown>((value, part) => {
      if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
        return (value as Record<string, unknown>)[part];
      }
      return key;
    }, translations);

  const t = (key: string, params?: Record<string, string | number>) => {
    const value = read(key);
    if (typeof value !== 'string') {
      return key;
    }
    if (!params) {
      return value;
    }

    return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => String(params[paramKey] ?? ''));
  };

  return {
    useInternationalization: () => ({
      language: 'en',
      t,
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
        new Intl.NumberFormat('en-US', options).format(value),
      formatPercentage: (value: number, decimals = 0) =>
        new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value / 100),
    }),
  };
});

import { useLearningProgress } from '@/hooks/useLearningProgress';

const mockItems: LearningProgressItem[] = [
  {
    courseId: '1',
    title: 'Web3 UX Design Principles',
    progress: 68,
    timeRemaining: '12h',
    totalLessons: 12,
    category: 'Design',
  },
  {
    courseId: '2',
    title: 'Smart Contract Security Best Practices',
    progress: 45,
    timeRemaining: '18h',
    totalLessons: 18,
    category: 'Security',
  },
];

describe('LearningProgressList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the section heading', () => {
    vi.mocked(useLearningProgress).mockReturnValue({
      items: mockItems,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LearningProgressList />);
    expect(screen.getByText('Learning Progress')).toBeInTheDocument();
  });

  it('renders each course with its progress status', () => {
    vi.mocked(useLearningProgress).mockReturnValue({
      items: mockItems,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LearningProgressList />);

    expect(screen.getByText('Web3 UX Design Principles')).toBeInTheDocument();
    expect(screen.getByText('Smart Contract Security Best Practices')).toBeInTheDocument();
    expect(screen.getByText('68% complete • 12h remaining')).toBeInTheDocument();
    expect(screen.getByText('45% complete • 18h remaining')).toBeInTheDocument();
  });

  it('shows a loading skeleton while fetching', () => {
    vi.mocked(useLearningProgress).mockReturnValue({
      items: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<LearningProgressList />);
    expect(screen.getByRole('heading', { name: 'Learning Progress' })).toBeInTheDocument();
    expect(screen.queryByText('Web3 UX Design Principles')).not.toBeInTheDocument();
  });

  it('shows an error message with a retry button when the request fails', () => {
    vi.mocked(useLearningProgress).mockReturnValue({
      items: [],
      isLoading: false,
      error: new Error('Network error'),
      refetch: vi.fn(),
    });

    render(<LearningProgressList />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('calls refetch when the retry button is clicked', () => {
    const refetch = vi.fn();
    vi.mocked(useLearningProgress).mockReturnValue({
      items: [],
      isLoading: false,
      error: new Error('Network error'),
      refetch,
    });

    render(<LearningProgressList />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when there are no courses in progress', () => {
    vi.mocked(useLearningProgress).mockReturnValue({
      items: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LearningProgressList />);
    expect(
      screen.getByText('You have no courses in progress yet.'),
    ).toBeInTheDocument();
  });
});
