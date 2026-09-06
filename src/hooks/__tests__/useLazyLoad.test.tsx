import { describe, expect, it, vi } from 'vitest';
import { preloadComponent, createLazyComponent, createLazy } from '../useLazyLoad';

describe('preloadComponent', () => {
  it('calls the import function once when called multiple times before resolution', async () => {
    const importFn = vi.fn().mockResolvedValueOnce({ default: 'Component' });
    const first = preloadComponent(importFn);
    const second = preloadComponent(importFn);

    expect(importFn).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);

    await expect(first).resolves.toEqual({ default: 'Component' });
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('does not call the import function again after it has resolved', async () => {
    const importFn = vi.fn().mockResolvedValue({ default: 'Component' });
    await preloadComponent(importFn);
    await preloadComponent(importFn);

    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('allows retrying after a failed import', async () => {
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({ default: 'Component' });

    await expect(preloadComponent(importFn)).rejects.toThrow('network error');
    await expect(preloadComponent(importFn)).resolves.toEqual({ default: 'Component' });

    expect(importFn).toHaveBeenCalledTimes(2);
  });
});

describe('createLazyComponent', () => {
  it('creates a component that wraps lazy and Suspense', () => {
    const mockImport = vi.fn().mockResolvedValue({ default: () => null });
    const LazyWrapper = createLazyComponent(mockImport);
    expect(typeof LazyWrapper).toBe('function');
  });
});

describe('createLazy', () => {
  it('creates a lazy component', () => {
    const lazyComp = createLazy(() => Promise.resolve({ default: () => null }));
    expect(lazyComp).toBeDefined();
  });
});
