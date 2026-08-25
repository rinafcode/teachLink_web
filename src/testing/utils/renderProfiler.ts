import type { ProfilerOnRenderCallback } from 'react';

export interface RenderStat {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
}

export interface ProfilerRecorder {
  stats: RenderStat[];
  onRender: ProfilerOnRenderCallback;
  /** Total number of commits recorded for this Profiler id. */
  renderCount: () => number;
  /** Sum of React's self-reported `actualDuration` (ms) across all recorded commits. */
  totalDuration: () => number;
  reset: () => void;
}

/**
 * Minimal `React.Profiler`-backed recorder used by `*.bench.test.tsx` files to
 * capture render-count/duration numbers without pulling in a browser
 * profiling dependency. Wrap the tree under test in
 * `<Profiler id="..." onRender={recorder.onRender}>` and inspect
 * `recorder.stats` / `recorder.renderCount()` after interacting with it.
 */
export function makeProfilerRecorder(): ProfilerRecorder {
  const stats: RenderStat[] = [];

  const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
    stats.push({ id, phase, actualDuration });
  };

  return {
    stats,
    onRender,
    renderCount: () => stats.length,
    totalDuration: () => stats.reduce((sum, s) => sum + s.actualDuration, 0),
    reset: () => {
      stats.length = 0;
    },
  };
}
