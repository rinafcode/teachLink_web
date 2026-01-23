'use client';

import React from 'react';
import { FilterSidebar } from './FilterSidebar';
import { FilterState } from '../../hooks/useSearchFilters';

interface SearchFiltersProps {
    filters: FilterState;
    setFilters: (filters: Partial<FilterState>) => void;
    resetFilters: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, setFilters, resetFilters }) => {
    return (
        <FilterSidebar 
            filters={filters}
            onFilterChange={setFilters}
            onReset={resetFilters}
        />
    );
};
