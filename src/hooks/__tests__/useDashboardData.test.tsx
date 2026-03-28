// @vitest-environment jsdom
import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useDashboardData } from '../useDashboardData';
import type { UseDashboardDataReturn } from '../useDashboardData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TestHarness: React.FC<{ onReady: (api: UseDashboardDataReturn) => void }> = ({ onReady }) => {
  const api = useDashboardData();
  useEffect(() => {
    onReady(api);
  });
  return null;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useDashboardData', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    // Stub window.location.search to empty for deterministic URL parsing
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '', origin: 'http://localhost', pathname: '/dashboard' },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('initializes with 4 default panels', async () => {
    let api: UseDashboardDataReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });
    expect(api!.panels.length).toBe(4);
    expect(api!.panels.map((p) => p.id)).toContain('enrollments');
    expect(api!.panels.map((p) => p.id)).toContain('revenue');
    expect(api!.panels.map((p) => p.id)).toContain('completions');
    expect(api!.panels.map((p) => p.id)).toContain('realtime');
  });

  it('initializes with default filters', async () => {
    let api: UseDashboardDataReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });
    expect(api!.filters.timeRange).toBe('30d');
    expect(api!.filters.metric).toBe('enrollments');
    expect(api!.filters.aggregation).toBe('sum');
    expect(api!.filters.categories).toEqual([]);
  });

  it('setFilters updates filter state', async () => {
    let api: UseDashboardDataReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });
    await act(async () => {
      api!.setFilters({ timeRange: '7d', metric: 'revenue' });
    });
    expect(api!.filters.timeRange).toBe('7d');
    expect(api!.filters.metric).toBe('revenue');
  });

  it('resetFilters restores defaults and clears shareURL', async () => {
    let api: UseDashboardDataReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });
    await act(async () => {
      api!.setFilters({ timeRange: '1y', metric: 'views' });
    });
    await act(async () => {
      api!.resetFilters();
    });
    expect(api!.filters.timeRange).toBe('30d');
    expect(api!.filters.metric).toBe('enrollments');
    expect(api!.shareURL).toBeNull();
  });

  it('setPanelChartType updates the correct panel', async () => {
    let api: UseDashboardDataReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });
    await act(async () => {
      api!.setPanelChartType('enrollments', 'bar');
    });
    const panel = api!.panels.find((p) => p.id === 'enrollments');
    expect(panel?.chartType).toBe('bar');
  });

  it('drillDown sets drillDownIndex on the correct panel', async () => {
    let api: UseDashboardDataReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });
    await act(async () => {
      api!.drillDown('revenue', 3);
    });
    const panel = api!.panels.find((p) => p.id === 'revenue');
    expect(panel?.drillDownIndex).toBe(3);
  });

  it('clearDrillDown resets drillDownIndex to null', async () => {
    let api: UseDashboardDataReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });
    await act(async () => {
      api!.drillDown('completions', 5);
    });
    await act(async () => {
      api!.clearDrillDown('completions');
    });
    const panel = api!.panels.find((p) => p.id === 'completions');
    expect(panel?.drillDownIndex).toBeNull();
  });

  it('reorderPanels swaps panel positions', async () => {
    let api: UseDashboardDataReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });
    const firstId = api!.panels[0].id;
    const secondId = api!.panels[1].id;
    await act(async () => {
      api!.reorderPanels(0, 1);
    });
    expect(api!.panels[0].id).toBe(secondId);
    expect(api!.panels[1].id).toBe(firstId);
  });

  it('generateShareURL returns a URL string', async () => {
    let api: UseDashboardDataReturn | undefined;
    await act(async () => {
      root.render(
        <TestHarness
          onReady={(a) => {
            api = a;
          }}
        />,
      );
    });
    let url = '';
    await act(async () => {
      url = api!.generateShareURL();
    });
    expect(typeof url).toBe('string');
    expect(url).toContain('timeRange');
    expect(url).toContain('metric');
  });
});
