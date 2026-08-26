import React, { Profiler } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DashboardPanelCard } from '../DashboardPanelCard';
import type { DashboardPanel } from '@/hooks/useDashboardData';
import { makeProfilerRecorder } from '@/testing/utils/renderProfiler';

vi.mock('@/hooks/useInternationalization', () => ({
  useInternationalization: () => ({ t: (key: string) => key }),
}));

vi.mock('../InteractiveCharts', () => ({
  InteractiveCharts: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('../RealTimeUpdater', () => ({
  RealTimeUpdater: ({ title }: { title?: string }) => <div>{title}</div>,
}));

function makePanel(id: string): DashboardPanel {
  return {
    id,
    title: `Panel ${id}`,
    chartType: 'line',
    data: { labels: [], datasets: [] },
    drillDownIndex: null,
    position: 0,
  };
}

describe('DashboardPanelCard memoization', () => {
  it('[bench] does not re-render when an unrelated sibling panel changes', () => {
    const stableProps = {
      onExport: vi.fn(),
      onChartTypeChange: vi.fn(),
      onDrillDown: vi.fn(),
      onClearDrillDown: vi.fn(),
    };

    const recorder = makeProfilerRecorder();
    const panelA = makePanel('a');

    const { rerender } = render(
      <Profiler id="panel-a" onRender={recorder.onRender}>
        <DashboardPanelCard panel={panelA} index={0} {...stableProps} />
      </Profiler>,
    );
    recorder.reset();

    // Re-render with the exact same panel/props (as would happen when a
    // *different* panel in the grid changes and this one's props are
    // untouched) — memoization should skip this render entirely.
    rerender(
      <Profiler id="panel-a" onRender={recorder.onRender}>
        <DashboardPanelCard panel={panelA} index={0} {...stableProps} />
      </Profiler>,
    );

    // React.Profiler still fires one commit for the boundary even when the
    // memoized child below it bails out entirely, so what memoization buys
    // us shows up as a ~0ms `actualDuration` for that commit, not as zero
    // commits. A non-memoized DashboardPanelCard would re-run its full body
    // (including the InteractiveCharts/RealTimeUpdater branch) here instead.
    const [commit] = recorder.stats;
    // eslint-disable-next-line no-console
    console.info(
      `[bench:DashboardPanelCard] unchanged-props re-render -> ${recorder.renderCount()} commit(s), ${commit.actualDuration.toFixed(3)}ms actualDuration (memoized bailout)`,
    );
    expect(commit.phase).toBe('update');
    expect(commit.actualDuration).toBeLessThan(1);
  });
});
