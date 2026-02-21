/**
 * PerformanceTester.test.tsx
 *
 * Performance and load-validation tests.
 * Covers: render budgets, large-list rendering, expensive computations,
 * memory usage estimation, and repeated-operation benchmarks.
 */

import React, { FC, memo, useMemo } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  measureExecutionTime,
  expectWithinBudget,
} from '../utils/testUtils';

//  Budget constants (ms) 

const BUDGETS = {
  COMPONENT_RENDER: 50,
  LARGE_LIST_RENDER: 300,
  SEARCH_FILTER: 30,
  SORT_1000: 50,
  COMPUTATION: 100,
  RERENDER_CYCLE: 100,
};

// Stub components 

interface ListItem { id: number; label: string; value: number; }

const generateItems = (count: number): ListItem[] =>
  Array.from({ length: count }, (_, i) => ({ id: i, label: `Item ${i}`, value: Math.random() }));

const VirtualList: FC<{ items: ListItem[] }> = memo(({ items }) => (
  <ul data-testid="list">
    {items.map(item => (
      <li key={item.id} data-testid="list-item">{item.label}</li>
    ))}
  </ul>
));
VirtualList.displayName = 'VirtualList';

const ExpensiveComponent: FC<{ data: number[] }> = ({ data }) => {
  const result = useMemo(() => {
    return data.reduce((sum, n) => sum + Math.sqrt(n), 0).toFixed(4);
  }, [data]);
  return <div data-testid="result">{result}</div>;
};

// Helper: run fn N times and return avg duration

async function benchmark(
  fn: () => void | Promise<void>,
  iterations = 10
): Promise<{ avg: number; max: number; min: number }> {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    times.push(await measureExecutionTime(fn));
  }
  times.sort((a, b) => a - b);
  return {
    avg: times.reduce((s, t) => s + t, 0) / times.length,
    min: times[0],
    max: times[times.length - 1],
  };
}

// Tests 

describe('PerformanceTester – Render budgets', () => {
  it('renders a simple component within budget', async () => {
    await expectWithinBudget(
      () => { render(<ExpensiveComponent data={[1, 2, 3]} />); },
      BUDGETS.COMPONENT_RENDER
    );
  });

  it('renders a 500-item list within budget', async () => {
    const items = generateItems(500);
    await expectWithinBudget(
      () => { render(<VirtualList items={items} />); },
      BUDGETS.LARGE_LIST_RENDER
    );
    expect(screen.getAllByTestId('list-item')).toHaveLength(500);
  });

  it('renders a 1000-item list within extended budget', async () => {
    const items = generateItems(1000);
    await expectWithinBudget(
      () => { render(<VirtualList items={items} />); },
      BUDGETS.LARGE_LIST_RENDER * 2
    );
  });

  it('memoized component does not re-render on identical props', () => {
    const renderSpy = vi.fn();
    const Tracked: FC<{ value: number }> = memo(({ value }) => {
      renderSpy();
      return <span>{value}</span>;
    });
    Tracked.displayName = 'Tracked';

    const { rerender } = render(<Tracked value={42} />);
    rerender(<Tracked value={42} />);
    // renderSpy called once for mount, memo prevents second call
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
});


describe('PerformanceTester – Computation benchmarks', () => {
  it('computes sqrt-sum of 10 000 numbers within budget', async () => {
    const data = Array.from({ length: 10_000 }, (_, i) => i + 1);
    await expectWithinBudget(() => {
      data.reduce((sum, n) => sum + Math.sqrt(n), 0);
    }, BUDGETS.COMPUTATION);
  });

  it('sorts 1000 items within budget', async () => {
    const arr = Array.from({ length: 1000 }, () => Math.random());
    await expectWithinBudget(() => { [...arr].sort((a, b) => a - b); }, BUDGETS.SORT_1000);
  });

  it('filters 10 000 items within search budget', async () => {
    const items = generateItems(10_000);
    await expectWithinBudget(
      () => { items.filter(i => i.label.includes('5')); },
      BUDGETS.SEARCH_FILTER
    );
  });

  it('JSON serialises 1000 objects under 50ms', async () => {
    const data = generateItems(1000);
    await expectWithinBudget(() => { JSON.stringify(data); }, 50);
  });

  it('JSON parses a 1000-item payload under 50ms', async () => {
    const json = JSON.stringify(generateItems(1000));
    await expectWithinBudget(() => { JSON.parse(json); }, 50);
  });
});


describe('PerformanceTester – Re-render cycles', () => {
  it('re-renders 50 times within budget', async () => {
    const items = generateItems(10);
    const { rerender } = render(<VirtualList items={items} />);
    await expectWithinBudget(async () => {
      for (let i = 0; i < 50; i++) {
        rerender(<VirtualList items={generateItems(10)} />);
      }
    }, BUDGETS.RERENDER_CYCLE);
  });

  it('average rerender time stays below 5ms per cycle', async () => {
    const { rerender } = render(<ExpensiveComponent data={[1]} />);
    const { avg } = await benchmark(
      () => rerender(<ExpensiveComponent data={[Math.random()]} />),
      20
    );
    expect(avg).toBeLessThan(5);
  });
});


describe('PerformanceTester – Storage estimates', () => {
  it('reads navigator.storage.estimate without error', async () => {
    const estimate = await navigator.storage.estimate();
    expect(estimate.quota).toBe(1024 * 1024 * 1024);
    expect(estimate.usage).toBe(100 * 1024 * 1024);
  });

  it('calculates storage utilisation percentage correctly', async () => {
    const { quota, usage } = await navigator.storage.estimate();
    const pct = ((usage! / quota!) * 100).toFixed(1);
    expect(Number(pct)).toBeCloseTo(9.77, 1);
  });
});


describe('PerformanceTester – Async operation benchmarks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('resolves 100 sequential microtasks under 200ms', async () => {
    await expectWithinBudget(async () => {
      for (let i = 0; i < 100; i++) await Promise.resolve(i);
    }, 200);
  });

  it('resolves 100 parallel microtasks under 100ms', async () => {
    await expectWithinBudget(async () => {
      await Promise.all(Array.from({ length: 100 }, (_, i) => Promise.resolve(i)));
    }, 100);
  });

  it('mocks 50 fetch calls and resolves them under 200ms', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);

    await expectWithinBudget(async () => {
      await Promise.all(Array.from({ length: 50 }, () => fetch('/api/ping').then(r => r.json())));
    }, 200);
  });
});


describe('PerformanceTester – Benchmark utility', () => {
  it('returns avg, min, max for a synchronous operation', async () => {
    const metrics = await benchmark(() => {
      let x = 0;
      for (let i = 0; i < 1000; i++) x += i;
    }, 5);

    expect(metrics.avg).toBeGreaterThanOrEqual(0);
    expect(metrics.min).toBeLessThanOrEqual(metrics.avg);
    expect(metrics.max).toBeGreaterThanOrEqual(metrics.avg);
  });

  it('runs exactly the requested number of iterations', async () => {
    let count = 0;
    await benchmark(() => { count++; }, 7);
    expect(count).toBe(7);
  });
});