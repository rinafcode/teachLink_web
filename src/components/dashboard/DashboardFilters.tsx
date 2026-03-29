/**
 * DashboardFilters Component
 * Collapsible filter panel for the Advanced Data Visualization Dashboard.
 * Supports time range, categories, metric, and aggregation type selectors.
 */

'use client';

import React, { useState } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { TimeRange, AggregationType, CHART_COLOR_PALETTE } from '@/utils/visualizationUtils';
import type { DashboardFiltersState } from '@/hooks/useDashboardData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardFiltersProps {
  filters: DashboardFiltersState;
  onFiltersChange: (partial: Partial<DashboardFiltersState>) => void;
  onReset: () => void;
  categories?: string[];
  metrics?: string[];
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
];

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
];

const DEFAULT_CATEGORIES = ['Web Dev', 'Data Science', 'Design', 'Marketing', 'Mobile'];
const DEFAULT_METRICS = ['enrollments', 'revenue', 'completions', 'views'];

// ─── Component ────────────────────────────────────────────────────────────────

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  categories = DEFAULT_CATEGORIES,
  metrics = DEFAULT_METRICS,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCategory = (cat: string) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onFiltersChange({ categories: next });
  };

  const removeCategory = (cat: string) => {
    onFiltersChange({ categories: filters.categories.filter((c) => c !== cat) });
  };

  const activeFilterCount =
    (filters.timeRange !== '30d' ? 1 : 0) +
    filters.categories.length +
    (filters.metric !== 'enrollments' ? 1 : 0) +
    (filters.aggregation !== 'sum' ? 1 : 0);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
            aria-controls="dashboard-filter-panel"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Filter className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">{isOpen ? 'Hide Filters' : 'Show Filters'}</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Active filter badges */}
          <div className="flex flex-wrap gap-2" role="list" aria-label="Active filters">
            {filters.timeRange !== '30d' && (
              <span
                role="listitem"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {TIME_RANGE_OPTIONS.find((o) => o.value === filters.timeRange)?.label}
                <button
                  onClick={() => onFiltersChange({ timeRange: '30d' })}
                  aria-label="Remove time range filter"
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.categories.map((cat, i) => (
              <span
                key={cat}
                role="listitem"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full text-white"
                style={{ backgroundColor: CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length] }}
              >
                {cat}
                <button
                  onClick={() => removeCategory(cat)}
                  aria-label={`Remove ${cat} filter`}
                  className="hover:opacity-75 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            aria-label="Reset all filters"
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset All
          </button>
        )}
      </div>

      {/* Expandable panel */}
      {isOpen && (
        <div
          id="dashboard-filter-panel"
          className="border-t border-gray-100 dark:border-gray-700 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Time Range */}
          <div>
            <label
              htmlFor="filter-time-range"
              className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2"
            >
              Time Range
            </label>
            <select
              id="filter-time-range"
              value={filters.timeRange}
              onChange={(e) => onFiltersChange({ timeRange: e.target.value as TimeRange })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {TIME_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation */}
          <div>
            <label
              htmlFor="filter-aggregation"
              className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2"
            >
              Aggregation
            </label>
            <select
              id="filter-aggregation"
              value={filters.aggregation}
              onChange={(e) => onFiltersChange({ aggregation: e.target.value as AggregationType })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {AGGREGATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Metric */}
          <fieldset>
            <legend className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Metric
            </legend>
            <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Metric">
              {metrics.map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dashboard-metric"
                    value={m}
                    checked={filters.metric === m}
                    onChange={() => onFiltersChange({ metric: m })}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{m}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Categories */}
          <div>
            <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Categories
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Category filters">
              {categories.map((cat, i) => {
                const isActive = filters.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    aria-pressed={isActive}
                    className="px-2.5 py-1 text-xs rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={
                      isActive
                        ? {
                            backgroundColor: CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length],
                            borderColor: CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length],
                            color: 'white',
                          }
                        : { borderColor: '#d1d5db', color: '#374151' }
                    }
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
