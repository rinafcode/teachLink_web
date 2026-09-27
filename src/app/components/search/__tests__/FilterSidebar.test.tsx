import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterSidebar } from '../FilterSidebar';
import { FilterState } from '../../../hooks/useSearchFilters';

const defaultFilters: FilterState = {
  difficulty: [],
  topics: [],
  duration: 100,
  priceRange: 500,
  sort: 'relevance',
  instructor: '',
  searchTerm: '',
  learningFormat: [],
};

describe('FilterSidebar (App) Component - Learning Format', () => {
  it('renders all Learning Format options', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <FilterSidebar filters={defaultFilters} onFilterChange={onFilterChange} onReset={onReset} />,
    );

    expect(screen.getByText('Learning Format')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Interactive')).toBeInTheDocument();
    expect(screen.getByText('Text-Based')).toBeInTheDocument();
    expect(screen.getByText('Mixed')).toBeInTheDocument();
  });

  it('triggers onFilterChange callback when a learning format is selected', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <FilterSidebar filters={defaultFilters} onFilterChange={onFilterChange} onReset={onReset} />,
    );

    // Click on Interactive option
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith({ learningFormat: ['interactive'] });
  });
});
