import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ChartType,
  TimeRange,
  AggregationType,
  exportToCSV,
  exportToJSON,
} from '@/utils/visualizationUtils';
import {
  generateDashboardSampleData,
  generateShareableURL,
  parseDashboardURL,
  getDrillDownData,
  DashboardShareConfig,
} from '@/utils/chartUtils';
import type { ChartData } from '@/utils/visualizationUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardFiltersState {
  timeRange: TimeRange;
  categories: string[];
  metric: string;
  aggregation: AggregationType;
}

export interface DashboardPanel {
  id: string;
  title: string;
  chartType: ChartType;
  data: ChartData;
  drillDownIndex: number | null;
  position: number;
}

export interface UseDashboardDataReturn {
  panels: DashboardPanel[];
  filters: DashboardFiltersState;
  shareURL: string | null;
  isLoading: boolean;
  setFilters: (filters: Partial<DashboardFiltersState>) => void;
  resetFilters: () => void;
  setPanelChartType: (id: string, chartType: ChartType) => void;
  drillDown: (id: string, index: number) => void;
  clearDrillDown: (id: string) => void;
  reorderPanels: (fromIndex: number, toIndex: number) => void;
  generateShareURL: () => string;
  exportPanel: (id: string, format: 'csv' | 'json') => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: DashboardFiltersState = {
  timeRange: '30d',
  categories: [],
  metric: 'enrollments',
  aggregation: 'sum',
};

const buildDefaultPanels = (timeRange: TimeRange): DashboardPanel[] => [
  {
    id: 'enrollments',
    title: 'Course Enrollments',
    chartType: 'line',
    data: generateDashboardSampleData('enrollments', timeRange),
    drillDownIndex: null,
    position: 0,
  },
  {
    id: 'revenue',
    title: 'Revenue',
    chartType: 'bar',
    data: generateDashboardSampleData('revenue', timeRange),
    drillDownIndex: null,
    position: 1,
  },
  {
    id: 'completions',
    title: 'Completions',
    chartType: 'area',
    data: generateDashboardSampleData('completions', timeRange),
    drillDownIndex: null,
    position: 2,
  },
  {
    id: 'realtime',
    title: 'Live Activity',
    chartType: 'line',
    data: { labels: [], datasets: [] },
    drillDownIndex: null,
    position: 3,
  },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useDashboardData = (): UseDashboardDataReturn => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const [filters, setFiltersState] = useState<DashboardFiltersState>(() => {
    if (typeof window !== 'undefined') {
      const parsed = parseDashboardURL(window.location.search);
      return { ...DEFAULT_FILTERS, ...parsed };
    }
    return DEFAULT_FILTERS;
  });

  const [panels, setPanels] = useState<DashboardPanel[]>(() =>
    buildDefaultPanels(filters.timeRange),
  );

  const [shareURL, setShareURL] = useState<string | null>(null);

  const sortedPanels = useMemo(
    () => [...panels].sort((a, b) => a.position - b.position),
    [panels],
  );

  // Update filters and regenerate data for non-realtime panels
  const setFilters = useCallback((partial: Partial<DashboardFiltersState>) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...partial };
      if (partial.timeRange && partial.timeRange !== prev.timeRange) {
        setPanels((prevPanels) =>
          prevPanels.map((panel) =>
            panel.id === 'realtime'
              ? panel
              : {
                  ...panel,
                  data: generateDashboardSampleData(panel.id, next.timeRange),
                  drillDownIndex: null,
                },
          ),
        );
      }
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setPanels(buildDefaultPanels(DEFAULT_FILTERS.timeRange));
    setShareURL(null);
  }, []);

  const setPanelChartType = useCallback((id: string, chartType: ChartType) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, chartType } : p)));
  }, []);

  const drillDown = useCallback((id: string, index: number) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, drillDownIndex: index } : p)));
  }, []);

  const clearDrillDown = useCallback((id: string) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, drillDownIndex: null } : p)));
  }, []);

  const reorderPanels = useCallback((fromIndex: number, toIndex: number) => {
    setPanels((prev) => {
      const sorted = [...prev].sort((a, b) => a.position - b.position);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      return sorted.map((p, i) => ({ ...p, position: i }));
    });
  }, []);

  const generateShareURLFn = useCallback((): string => {
    const config: DashboardShareConfig = {
      timeRange: filters.timeRange,
      categories: filters.categories,
      metric: filters.metric,
      aggregation: filters.aggregation,
      panelOrder: sortedPanels.map((p) => p.id),
    };
    const url = generateShareableURL(config);
    setShareURL(url);
    return url;
  }, [sortedPanels, filters]);

  const exportPanel = useCallback(
    (id: string, format: 'csv' | 'json') => {
      const panel = panels.find((p) => p.id === id);
      if (!panel) return;
      const filename = `${panel.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
      if (format === 'csv') {
        exportToCSV(panel.data, filename);
      } else {
        exportToJSON(panel.data, filename);
      }
    },
    [panels],
  );

  return {
    panels: sortedPanels,
    filters,
    shareURL,
    isLoading,
    setFilters,
    resetFilters,
    setPanelChartType,
    drillDown,
    clearDrillDown,
    reorderPanels,
    generateShareURL: generateShareURLFn,
    exportPanel,
  };
};
