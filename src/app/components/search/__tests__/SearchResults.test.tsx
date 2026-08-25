import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchResults, CourseResult } from '../SearchResults';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeCourse(n: number): CourseResult {
  return {
    id: `course-${n}`,
    title: `Course ${n}`,
    instructor: `Instructor ${n}`,
    duration: '2h',
    rating: 4.5,
    price: 29.99,
    originalPrice: null,
    category: 'Engineering',
    level: 'beginner',
    image: `/img/${n}.jpg`,
    tag: null,
    color: '#000',
  };
}

function makeCourses(count: number): CourseResult[] {
  return Array.from({ length: count }, (_, i) => makeCourse(i + 1));
}

// ─── Mocks ──────────────────────────────────────────────────────────────────

// next/link renders as a plain <a> in tests
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// EmptyState just renders its title
vi.mock('@/components', () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div>
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('SearchResults', () => {
  describe('loading state', () => {
    it('renders 6 skeleton placeholders when isLoading is true', () => {
      const { container } = render(<SearchResults results={[]} isLoading />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(6);
    });

    it('does not render pagination when loading', () => {
      render(<SearchResults results={makeCourses(20)} isLoading />);
      expect(screen.queryByRole('navigation', { name: /pagination/i })).toBeNull();
    });
  });

  describe('empty state', () => {
    it('renders the empty state when results is an empty array', () => {
      render(<SearchResults results={[]} />);
      expect(screen.getByText('No courses found')).toBeInTheDocument();
    });

    it('does not render pagination for an empty list', () => {
      render(<SearchResults results={[]} />);
      expect(screen.queryByRole('navigation', { name: /pagination/i })).toBeNull();
    });
  });

  describe('single-page results (no pagination controls)', () => {
    it('renders all results when count is less than pageSize', () => {
      const courses = makeCourses(5);
      render(<SearchResults results={courses} pageSize={12} />);
      courses.forEach((c) => expect(screen.getByText(c.title)).toBeInTheDocument());
    });

    it('does not render pagination nav when results fit on one page', () => {
      render(<SearchResults results={makeCourses(12)} pageSize={12} />);
      expect(screen.queryByRole('navigation', { name: /pagination/i })).toBeNull();
    });

    it('shows "Showing 1–N of N results" for a single page', () => {
      render(<SearchResults results={makeCourses(7)} pageSize={12} />);
      expect(screen.getByText(/Showing/i)).toBeInTheDocument();
      expect(screen.getByText('1–7')).toBeInTheDocument();
    });
  });

  describe('multi-page results', () => {
    const PAGE_SIZE = 12;
    const TOTAL = 30; // 3 pages: 12 | 12 | 6

    it('renders only the first pageSize items on the initial page', () => {
      const courses = makeCourses(TOTAL);
      render(<SearchResults results={courses} pageSize={PAGE_SIZE} />);
      expect(screen.getByText('Course 1')).toBeInTheDocument();
      expect(screen.getByText('Course 12')).toBeInTheDocument();
      expect(screen.queryByText('Course 13')).toBeNull();
    });

    it('shows correct "Showing" count on page 1', () => {
      render(<SearchResults results={makeCourses(TOTAL)} pageSize={PAGE_SIZE} />);
      expect(screen.getByText('1–12')).toBeInTheDocument();
      expect(screen.getByText(String(TOTAL))).toBeInTheDocument();
    });

    it('renders the pagination nav with Previous and Next buttons', () => {
      render(<SearchResults results={makeCourses(TOTAL)} pageSize={PAGE_SIZE} />);
      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    });

    it('disables the Previous button on page 1', () => {
      render(<SearchResults results={makeCourses(TOTAL)} pageSize={PAGE_SIZE} />);
      expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    });

    it('enables the Next button on page 1', () => {
      render(<SearchResults results={makeCourses(TOTAL)} pageSize={PAGE_SIZE} />);
      expect(screen.getByRole('button', { name: /next page/i })).toBeEnabled();
    });

    it('advances to page 2 when Next is clicked', () => {
      render(<SearchResults results={makeCourses(TOTAL)} pageSize={PAGE_SIZE} />);
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));

      expect(screen.getByText('Course 13')).toBeInTheDocument();
      expect(screen.getByText('Course 24')).toBeInTheDocument();
      expect(screen.queryByText('Course 1')).toBeNull();
    });

    it('shows correct "Showing" count on page 2', () => {
      render(<SearchResults results={makeCourses(TOTAL)} pageSize={PAGE_SIZE} />);
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      expect(screen.getByText('13–24')).toBeInTheDocument();
    });

    it('shows page indicator "Page 2 of 3" after one Next click', () => {
      render(<SearchResults results={makeCourses(TOTAL)} pageSize={PAGE_SIZE} />);
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      const nav = screen.getByRole('navigation', { name: /pagination/i });
      expect(within(nav).getByText('2')).toBeInTheDocument();
      expect(within(nav).getByText('3')).toBeInTheDocument();
    });

    it('enables the Previous button on page 2', () => {
      render(<SearchResults results={makeCourses(TOTAL)} pageSize={PAGE_SIZE} />);
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      expect(screen.getByRole('button', { name: /previous page/i })).toBeEnabled();
    });

    it('returns to page 1 when Previous is clicked from page 2', () => {
      render(<SearchResults results={makeCourses(TOTAL)} pageSize={PAGE_SIZE} />);
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      fireEvent.click(screen.getByRole('button', { name: /previous page/i }));
      expect(screen.getByText('Course 1')).toBeInTheDocument();
    });

    it('navigates to the last page and shows correct partial slice', () => {
      render(<SearchResults results={makeCourses(TOTAL)} pageSize={PAGE_SIZE} />);
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      // Page 3: courses 25–30
      expect(screen.getByText('Course 25')).toBeInTheDocument();
      expect(screen.getByText('Course 30')).toBeInTheDocument();
      expect(screen.queryByText('Course 24')).toBeNull();
    });

    it('shows correct "Showing" count on the last page', () => {
      render(<SearchResults results={makeCourses(TOTAL)} pageSize={PAGE_SIZE} />);
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      expect(screen.getByText('25–30')).toBeInTheDocument();
    });

    it('disables the Next button on the last page', () => {
      render(<SearchResults results={makeCourses(TOTAL)} pageSize={PAGE_SIZE} />);
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    });
  });

  describe('page reset on results change', () => {
    it('resets to page 1 when the results prop changes', () => {
      const firstSet = makeCourses(30);
      const { rerender } = render(
        <SearchResults results={firstSet} pageSize={12} />,
      );

      // Advance to page 2
      fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      expect(screen.getByText('Course 13')).toBeInTheDocument();

      // Simulate a new search result set
      const newSet = makeCourses(25).map((c, i) => ({ ...c, id: `new-${i}`, title: `New Course ${i + 1}` }));
      rerender(<SearchResults results={newSet} pageSize={12} />);

      expect(screen.getByText('New Course 1')).toBeInTheDocument();
      expect(screen.queryByText('Course 13')).toBeNull();

      // Pagination indicator shows page 1
      const nav = screen.getByRole('navigation', { name: /pagination/i });
      expect(within(nav).getByText('1')).toBeInTheDocument();
    });
  });

  describe('price display', () => {
    it('renders a discount badge when originalPrice is provided', () => {
      const course = { ...makeCourse(1), price: 15, originalPrice: 30 };
      render(<SearchResults results={[course]} pageSize={12} />);
      expect(screen.getByText('50% OFF')).toBeInTheDocument();
      expect(screen.getByText('$15.00')).toBeInTheDocument();
      expect(screen.getByText('$30.00')).toBeInTheDocument();
    });

    it('renders a plain price when no originalPrice', () => {
      const course = { ...makeCourse(1), price: 29.99, originalPrice: null };
      render(<SearchResults results={[course]} pageSize={12} />);
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.queryByText(/% OFF/)).toBeNull();
    });
  });

  describe('sort controls', () => {
    it('renders the sort select when onSortChange is provided', () => {
      render(
        <SearchResults
          results={makeCourses(5)}
          sortBy="relevance"
          onSortChange={vi.fn()}
        />,
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('calls onSortChange with the selected value', () => {
      const onSortChange = vi.fn();
      render(
        <SearchResults
          results={makeCourses(5)}
          sortBy="relevance"
          onSortChange={onSortChange}
        />,
      );
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'rating' } });
      expect(onSortChange).toHaveBeenCalledWith('rating');
    });

    it('does not render the sort select when onSortChange is absent', () => {
      render(<SearchResults results={makeCourses(5)} />);
      expect(screen.queryByRole('combobox')).toBeNull();
    });
  });
});
