import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { PerformanceDashboard } from '../PerformanceDashboard';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

// Mock the hook and utilities
vi.mock('@/hooks/usePerformanceMonitoring', () => ({
  usePerformanceMonitoring: vi.fn(),
}));

vi.mock('@/utils/performanceUtils', () => ({
  clearTrendHistory: vi.fn(),
  loadTrendHistory: vi.fn(() => []),
  appendTrendPoint: vi.fn(),
}));

describe('PerformanceDashboard Zoom Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a notice when there are not enough samples for charts', () => {
    (usePerformanceMonitoring as any).mockReturnValue({
      metrics: {},
      alerts: [],
      suggestions: [],
      trend: [],
      clearAlerts: vi.fn(),
      refreshTrendFromStorage: vi.fn(),
    });

    render(<PerformanceDashboard />);

    expect(screen.getAllByText(/Not enough samples yet/i)).toHaveLength(5);
  });

  it('renders charts and preset filters when sufficient trend data is available', async () => {
    // 5 trend points for LCP
    const mockTrend = [
      { t: Date.now() - 4000, name: 'LCP', value: 1200, rating: 'good' },
      { t: Date.now() - 3000, name: 'LCP', value: 1500, rating: 'good' },
      { t: Date.now() - 2000, name: 'LCP', value: 1800, rating: 'needs-improvement' },
      { t: Date.now() - 1000, name: 'LCP', value: 2200, rating: 'poor' },
      { t: Date.now(), name: 'LCP', value: 2500, rating: 'poor' },
    ];

    (usePerformanceMonitoring as any).mockReturnValue({
      metrics: {
        LCP: { name: 'LCP', value: 2500, rating: 'poor' },
      },
      alerts: [],
      suggestions: [],
      trend: mockTrend,
      clearAlerts: vi.fn(),
      refreshTrendFromStorage: vi.fn(),
    });

    render(<PerformanceDashboard />);

    // LCP should have enough samples, others should say not enough
    expect(screen.queryByText('LCP')).toBeInTheDocument();
    expect(screen.getAllByText(/Not enough samples yet/i)).toHaveLength(4);

    // Preset buttons for LCP should render
    const allBtn = screen.getByRole('button', { name: /show all samples/i });
    const l10Btn = screen.getByRole('button', { name: /show L10 samples/i });
    expect(allBtn).toBeInTheDocument();
    expect(l10Btn).toBeInTheDocument();
  });

  it('handles preset duration switching correctly', async () => {
    // 12 trend points for LCP to enable testing presets
    const mockTrend = Array.from({ length: 12 }, (_, index) => ({
      t: Date.now() - (12 - index) * 1000,
      name: 'LCP',
      value: 1000 + index * 100,
      rating: 'good',
    }));

    (usePerformanceMonitoring as any).mockReturnValue({
      metrics: {
        LCP: { name: 'LCP', value: 2200, rating: 'good' },
      },
      alerts: [],
      suggestions: [],
      trend: mockTrend,
      clearAlerts: vi.fn(),
      refreshTrendFromStorage: vi.fn(),
    });

    render(<PerformanceDashboard />);

    // LCP presets
    const l10Btn = screen.getByRole('button', { name: /show L10 samples/i });

    // Switch to L10 preset
    fireEvent.click(l10Btn);

    // Active L10 styling should be set
    expect(l10Btn).toHaveClass('text-indigo-600');
  });
});
