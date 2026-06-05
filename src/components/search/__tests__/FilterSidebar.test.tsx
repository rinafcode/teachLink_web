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
  nodeAffinity: 'auto',
};

describe('FilterSidebar Component - Node Affinity', () => {
  it('renders all Node Affinity options', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <FilterSidebar filters={defaultFilters} onFilterChange={onFilterChange} onReset={onReset} />,
    );

    expect(screen.getByText('Node Affinity')).toBeInTheDocument();
    expect(screen.getByText('Auto (Optimized)')).toBeInTheDocument();
    expect(screen.getByText('Primary Cluster')).toBeInTheDocument();
    expect(screen.getByText('Replica Node')).toBeInTheDocument();
    expect(screen.getByText('Edge Cache')).toBeInTheDocument();
  });

  it('triggers onFilterChange callback when a new node affinity is selected', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <FilterSidebar filters={defaultFilters} onFilterChange={onFilterChange} onReset={onReset} />,
    );

    // Click on Primary Cluster option
    const primaryOption = screen.getByText('Primary Cluster');
    fireEvent.click(primaryOption);

    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith({ nodeAffinity: 'primary' });
  });
});
