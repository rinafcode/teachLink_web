// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InteractiveCharts } from '../InteractiveCharts';
import type { ChartData } from '@/utils/visualizationUtils';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Recharts uses ResizeObserver; provide a minimal stub
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock InteractiveChartLibrary to avoid Recharts SVG rendering complexity in jsdom
vi.mock('@/components/visualization/InteractiveChartLibrary', () => ({
  InteractiveChartLibrary: ({
    title,
    onDataPointClick,
  }: {
    title?: string;
    onDataPointClick?: (data: unknown) => void;
  }) => (
    <div data-testid="mock-chart" aria-label={title ?? 'chart'}>
      <button
        data-testid="mock-data-point"
        onClick={() => onDataPointClick?.({ activeTooltipIndex: 2 })}
      >
        DataPoint
      </button>
    </div>
  ),
}));

// ─── Sample data ──────────────────────────────────────────────────────────────

const sampleData: ChartData = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [{ label: 'Enrollments', data: [10, 20, 30] }],
};

const baseProps = {
  panelId: 'enrollments',
  data: sampleData,
  chartType: 'line' as const,
  title: 'Course Enrollments',
  drillDownIndex: null,
  onChartTypeChange: vi.fn(),
  onDrillDown: vi.fn(),
  onClearDrillDown: vi.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('InteractiveCharts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<InteractiveCharts {...baseProps} />);
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
  });

  it('renders chart type switcher toolbar', () => {
    render(<InteractiveCharts {...baseProps} />);
    expect(screen.getByRole('toolbar', { name: /chart type selector/i })).toBeInTheDocument();
  });

  it('renders buttons for each chart type', () => {
    render(<InteractiveCharts {...baseProps} />);
    expect(screen.getByRole('button', { name: /line chart/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bar chart/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /area chart/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pie chart/i })).toBeInTheDocument();
  });

  it('marks the active chart type button as pressed', () => {
    render(<InteractiveCharts {...baseProps} chartType="bar" />);
    const barBtn = screen.getByRole('button', { name: /bar chart/i });
    expect(barBtn).toHaveAttribute('aria-pressed', 'true');
    const lineBtn = screen.getByRole('button', { name: /line chart/i });
    expect(lineBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChartTypeChange when a chart type button is clicked', () => {
    render(<InteractiveCharts {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /bar chart/i }));
    expect(baseProps.onChartTypeChange).toHaveBeenCalledWith('bar');
  });

  it('does not show drill-down panel when drillDownIndex is null', () => {
    render(<InteractiveCharts {...baseProps} />);
    expect(screen.queryByText(/all data/i)).not.toBeInTheDocument();
  });

  it('shows drill-down panel and breadcrumb when drillDownIndex is set', () => {
    render(<InteractiveCharts {...baseProps} drillDownIndex={1} />);
    expect(screen.getByText(/all data/i)).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument(); // label at index 1
  });

  it('calls onDrillDown when a data point is clicked', () => {
    render(<InteractiveCharts {...baseProps} />);
    fireEvent.click(screen.getByTestId('mock-data-point'));
    expect(baseProps.onDrillDown).toHaveBeenCalledWith(2);
  });

  it('calls onClearDrillDown when back button is clicked', () => {
    render(<InteractiveCharts {...baseProps} drillDownIndex={0} />);
    fireEvent.click(screen.getByRole('button', { name: /back to overview/i }));
    expect(baseProps.onClearDrillDown).toHaveBeenCalledTimes(1);
  });

  it('calls onClearDrillDown when breadcrumb "All Data" link is clicked', () => {
    render(<InteractiveCharts {...baseProps} drillDownIndex={0} />);
    fireEvent.click(screen.getByRole('button', { name: /back to all data/i }));
    expect(baseProps.onClearDrillDown).toHaveBeenCalledTimes(1);
  });
});
