// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardFilters } from '../DashboardFilters';
import type { DashboardFiltersState } from '@/hooks/useDashboardData';

// ─── Default props ────────────────────────────────────────────────────────────

const defaultFilters: DashboardFiltersState = {
  timeRange: '30d',
  categories: [],
  metric: 'enrollments',
  aggregation: 'sum',
};

const defaultProps = {
  filters: defaultFilters,
  onFiltersChange: vi.fn(),
  onReset: vi.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the filter toggle button', () => {
    render(<DashboardFilters {...defaultProps} />);
    expect(screen.getByRole('button', { name: /show filters/i })).toBeInTheDocument();
  });

  it('does not show the filter panel by default', () => {
    render(<DashboardFilters {...defaultProps} />);
    expect(screen.queryByLabelText(/time range/i)).not.toBeInTheDocument();
  });

  it('shows the filter panel when toggle is clicked', () => {
    render(<DashboardFilters {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    expect(screen.getByLabelText(/time range/i)).toBeInTheDocument();
  });

  it('hides the filter panel on second toggle click', () => {
    render(<DashboardFilters {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /show filters/i });
    fireEvent.click(btn);
    expect(screen.getByLabelText(/time range/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /hide filters/i }));
    expect(screen.queryByLabelText(/time range/i)).not.toBeInTheDocument();
  });

  it('calls onFiltersChange with updated timeRange when select changes', () => {
    render(<DashboardFilters {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    const select = screen.getByLabelText(/time range/i);
    fireEvent.change(select, { target: { value: '7d' } });
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({ timeRange: '7d' });
  });

  it('calls onFiltersChange when a category chip is toggled', () => {
    render(<DashboardFilters {...defaultProps} categories={['Web Dev', 'Design']} />);
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    fireEvent.click(screen.getByRole('button', { name: /web dev/i }));
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      categories: ['Web Dev'],
    });
  });

  it('calls onFiltersChange removing a category when chip toggled off', () => {
    const filters = { ...defaultFilters, categories: ['Web Dev'] };
    render(
      <DashboardFilters {...defaultProps} filters={filters} categories={['Web Dev', 'Design']} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    // The chip inside the filter panel is in the group labelled "Category filters"
    const group = screen.getByRole('group', { name: /category filters/i });
    const chipBtn = group.querySelector('button[aria-pressed="true"]') as HTMLElement;
    fireEvent.click(chipBtn);
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({ categories: [] });
  });

  it('shows active filter badge for non-default time range', () => {
    render(<DashboardFilters {...defaultProps} filters={{ ...defaultFilters, timeRange: '7d' }} />);
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
  });

  it('shows Reset All button when there are active filters', () => {
    render(<DashboardFilters {...defaultProps} filters={{ ...defaultFilters, timeRange: '7d' }} />);
    expect(screen.getByRole('button', { name: /reset all filters/i })).toBeInTheDocument();
  });

  it('calls onReset when Reset All is clicked', () => {
    render(<DashboardFilters {...defaultProps} filters={{ ...defaultFilters, timeRange: '1y' }} />);
    fireEvent.click(screen.getByRole('button', { name: /reset all filters/i }));
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
  });

  it('does not show Reset All button when no active filters', () => {
    render(<DashboardFilters {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /reset all/i })).not.toBeInTheDocument();
  });
});
