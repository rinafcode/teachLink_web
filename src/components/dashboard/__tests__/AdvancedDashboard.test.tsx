// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdvancedDashboard } from '../AdvancedDashboard';

// ─── Mocks ────────────────────────────────────────────────────────────────────

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock child components so we can assert presence without full rendering overhead
vi.mock('../DashboardFilters', () => ({
  DashboardFilters: ({ onFiltersChange }: { onFiltersChange: () => void }) => (
    <div data-testid="dashboard-filters" />
  ),
}));

vi.mock('../InteractiveCharts', () => ({
  InteractiveCharts: ({ title }: { title: string }) => (
    <div data-testid="interactive-charts">{title}</div>
  ),
}));

vi.mock('../RealTimeUpdater', () => ({
  RealTimeUpdater: ({ title }: { title?: string }) => (
    <div data-testid="realtime-updater">{title}</div>
  ),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock @dnd-kit to avoid pointer event / PointerSensor issues in jsdom
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useSensor: vi.fn(() => ({})),
    useSensors: vi.fn((...sensors) => sensors),
    PointerSensor: vi.fn(),
    KeyboardSensor: vi.fn(),
    closestCenter: vi.fn(),
  };
});

vi.mock('@dnd-kit/sortable', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/sortable')>();
  return {
    ...actual,
    SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
    rectSortingStrategy: vi.fn(),
    sortableKeyboardCoordinates: vi.fn(),
  };
});

// Mock clipboard
const writeTextMock = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: { writeText: writeTextMock },
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdvancedDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '', origin: 'http://localhost', pathname: '/dashboard' },
    });
  });

  it('renders without crashing', () => {
    render(<AdvancedDashboard />);
    expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
  });

  it('renders the DashboardFilters component', () => {
    render(<AdvancedDashboard />);
    expect(screen.getByTestId('dashboard-filters')).toBeInTheDocument();
  });

  it('renders all 3 InteractiveCharts panels', () => {
    render(<AdvancedDashboard />);
    const charts = screen.getAllByTestId('interactive-charts');
    expect(charts.length).toBe(3);
  });

  it('renders the RealTimeUpdater panel', () => {
    render(<AdvancedDashboard />);
    expect(screen.getByTestId('realtime-updater')).toBeInTheDocument();
  });

  it('renders the Share button', () => {
    render(<AdvancedDashboard />);
    expect(
      screen.getByRole('button', { name: /copy shareable dashboard link/i }),
    ).toBeInTheDocument();
  });

  it('renders the Export All button', () => {
    render(<AdvancedDashboard />);
    expect(screen.getByRole('button', { name: /export all panels as csv/i })).toBeInTheDocument();
  });

  it('calls clipboard.writeText when Share is clicked', async () => {
    render(<AdvancedDashboard />);
    const shareBtn = screen.getByRole('button', { name: /copy shareable dashboard link/i });
    fireEvent.click(shareBtn);
    // writeText is async; give it a tick
    await Promise.resolve();
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const url: string = writeTextMock.mock.calls[0][0];
    expect(url).toContain('timeRange');
  });

  it('renders panel titles in headings', () => {
    render(<AdvancedDashboard />);
    const headings = screen.getAllByRole('heading', { level: 2 });
    const headingTexts = headings.map((h) => h.textContent);
    expect(headingTexts).toContain('Course Enrollments');
    expect(headingTexts).toContain('Revenue');
    expect(headingTexts).toContain('Completions');
  });
});
