import React, { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, TrendingUp, Shield } from 'lucide-react';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'All';

export interface InvestmentItem {
  id: string;
  name: string;
  symbol: string;
  apy: number;
  tvl: number;
  riskLevel: Exclude<RiskLevel, 'All'>;
}

interface InvestmentSearchBarProps {
  items: InvestmentItem[];
  onResultsChange: (results: InvestmentItem[]) => void;
  placeholder?: string;
}

export const InvestmentSearchBar: React.FC<InvestmentSearchBarProps> = ({
  items,
  onResultsChange,
  placeholder = 'Search tokens, protocols, or pools...',
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [riskFilter, setRiskFilter] = useState<RiskLevel>('All');
  const [minApy, setMinApy] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'tvl' | 'apy'>('tvl');

  // Apply search, filters, and sorting
  const filteredAndSortedItems = useMemo(() => {
    let result = items;

    // 1. Text Search
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.symbol.toLowerCase().includes(lowerQuery),
      );
    }

    // 2. Risk Filter
    if (riskFilter !== 'All') {
      result = result.filter((item) => item.riskLevel === riskFilter);
    }

    // 3. Minimum APY Filter
    if (minApy > 0) {
      result = result.filter((item) => item.apy >= minApy);
    }

    // 4. Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'apy') return b.apy - a.apy;
      return b.tvl - a.tvl; // Default to TVL
    });

    return result;
  }, [items, query, riskFilter, minApy, sortBy]);

  // Notify parent of result changes
  useEffect(() => {
    onResultsChange(filteredAndSortedItems);
  }, [filteredAndSortedItems, onResultsChange]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative flex items-center w-full">
        <div className="absolute left-3 text-gray-500 dark:text-gray-400">
          <Search className="w-5 h-5" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
          aria-label="Search investments"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-3 p-1.5 rounded-md transition-colors ${
            showFilters
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-label="Toggle investment filters"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Expandable Investment Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
          {/* Risk Level Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Risk Level
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as RiskLevel)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
              aria-label="Filter by risk level"
            >
              <option value="All">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>

          {/* Minimum APY Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Min APY (%)
            </label>
            <input
              type="number"
              min="0"
              value={minApy || ''}
              onChange={(e) => setMinApy(Number(e.target.value))}
              placeholder="0.00"
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by minimum APY"
            />
          </div>

          {/* Sorting */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort By</label>
            <div className="flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => setSortBy('tvl')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-md border outline-none ${
                  sortBy === 'tvl'
                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-400'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                TVL
              </button>
              <button
                onClick={() => setSortBy('apy')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-md border-y border-r outline-none ${
                  sortBy === 'apy'
                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-400'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                Highest APY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
