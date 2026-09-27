import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterSidebar } from '../FilterSidebar';
import { FilterState } from '../../../hooks/useSearchFilters';

const defaultFilters: FilterState = {
  difficulty: [],
  topics: [],
  duration: 100,
  priceRange: 200,
  sort: 'relevance',
  instructor: '',
  searchTerm: '',
  learningFormat: [],
};

describe('FilterSidebar Component - Learning Format', () => {
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

    // Click on Video option - use getByLabelText to find it
    const videoLabel = screen.getByText('Video');
    const videoCheckbox = videoLabel.closest('label')?.querySelector('input[type="checkbox"]');
    if (videoCheckbox) fireEvent.click(videoCheckbox);

    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith({ learningFormat: ['video'] });
  });

  it('allows multiple learning formats to be selected', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();
    const filtersWithVideo = {
      ...defaultFilters,
      learningFormat: ['video'],
    };

    render(
      <FilterSidebar
        filters={filtersWithVideo}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />,
    );

    // Click on Interactive - find it by its label text
    const interactiveLabel = screen.getByText('Interactive');
    const interactiveCheckbox = interactiveLabel.closest('label')?.querySelector('input[type="checkbox"]');
    if (interactiveCheckbox) fireEvent.click(interactiveCheckbox);

    expect(onFilterChange).toHaveBeenCalledWith({ learningFormat: ['video', 'interactive'] });
  });
});
