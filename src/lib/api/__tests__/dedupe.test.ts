import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dedupe, cancelDedupe, clearDedupeCache, buildDedupeKey } from '@/lib/api/dedupe';

function deferred<T = unknown>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe('dedupe (basic behavior)', () => {
  afterEach(() => {
    clearDedupeCache();
  });

  it('deduplicates concurrent requests with the same key', async () => {
    const d = deferred<string>();
    const fn = vi.fn().mockReturnValue(d.promise);

    const p1 = dedupe('k', fn);
    const p2 = dedupe('k', fn);

    d.resolve('ok');
    await expect(p1).resolves.toBe('ok');
    await expect(p2).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows different keys to proceed independently', async () => {
    const d1 = deferred<string>();
    const d2 = deferred<string>();
    const fn = vi.fn()
      .mockReturnValueOnce(d1.promise)
      .mockReturnValueOnce(d2.promise);

    const p1 = dedupe('a', fn);
    const p2 = dedupe('b', fn);

    d1.resolve('a-res');
    d2.resolve('b-res');

    await expect(p1).resolves.toBe('a-res');
    await expect(p2).resolves.toBe('b-res');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('rejects all callers when the factory throws', async () => {
    const d = deferred<string>();
    const fn = vi.fn().mockReturnValue(d.promise);

    const p1 = dedupe('err', fn);
    const p2 = dedupe('err', fn);

    d.reject(new Error('nope'));
    await expect(p1).rejects.toThrow('nope');
    await expect(p2).rejects.toThrow('nope');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows a subsequent request after the first completes', async () => {
    const d1 = deferred<string>();
    const d2 = deferred<string>();
    const fn = vi.fn()
      .mockReturnValueOnce(d1.promise)
      .mockReturnValueOnce(d2.promise);

    const r1 = dedupe('k', fn);
    d1.resolve('first');
    await expect(r1).resolves.toBe('first');

    const r2 = dedupe('k', fn);
    d2.resolve('second');
    await expect(r2).resolves.toBe('second');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('buildDedupeKey produces stable keys', () => {
    expect(buildDedupeKey('GET', '/api/test')).toBe('GET:/api/test');
    expect(buildDedupeKey('get', '/api/test')).toBe('GET:/api/test');
    expect(buildDedupeKey('POST', '/api/test', { a: 1 })).toBe('POST:/api/test:{"a":1}');
  });

  it('cancelDedupe removes an in-flight entry', async () => {
    const neverSettle = () => new Promise(() => {});
    dedupe('cancel-me', neverSettle);
    cancelDedupe('cancel-me');

    const fn = vi.fn().mockResolvedValue('fresh');
    await expect(dedupe('cancel-me', fn)).resolves.toBe('fresh');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('dedupe (MAX_INFLIGHT limit)', () => {
  afterEach(() => {
    clearDedupeCache();
  });

  it('rejects new entries when the cache is full', async () => {
    const neverSettle = () => new Promise(() => {});

    for (let i = 0; i < 200; i++) {
      dedupe(`key-${i}`, neverSettle);
    }

    await expect(dedupe('overflow', () => Promise.resolve('ok')))
      .rejects.toThrow('Deduplication cache full');
  });

  it('accepts a new entry when a slot frees up', async () => {
    for (let i = 0; i < 199; i++) {
      dedupe(`pending-${i}`, () => new Promise(() => {}));
    }

    const fn = vi.fn().mockResolvedValue('done');
    await expect(dedupe('slot-frees', fn)).resolves.toBe('done');

    await expect(dedupe('last', () => Promise.resolve('ok'))).resolves.toBe('ok');
  });
});

describe('dedupe (TTL eviction)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearDedupeCache();
  });

  it('evicts entries after the TTL and rejects the promise', async () => {
    const neverSettle = () => new Promise(() => {});
    const promise = dedupe('ttl-key', neverSettle);

    vi.advanceTimersByTime(30_000);

    await expect(promise).rejects.toThrow('timed out');
  });

  it('allows a new request after TTL eviction', async () => {
    const neverSettle = () => new Promise(() => {});
    const evicted = dedupe('ttl-key', neverSettle);
    const evictDone = expect(evicted).rejects.toThrow('timed out');

    vi.advanceTimersByTime(30_000);

    await evictDone;

    const fn = vi.fn().mockResolvedValue('fresh');
    await expect(dedupe('ttl-key', fn)).resolves.toBe('fresh');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('clears the timer when the request completes before TTL', async () => {
    let resolveFn!: (v: string) => void;
    const fn = vi.fn().mockImplementation(
      () => new Promise<string>(resolve => { resolveFn = resolve; }),
    );

    const promise = dedupe('fast-key', fn);
    resolveFn('fast');

    await Promise.resolve();

    await expect(promise).resolves.toBe('fast');

    vi.advanceTimersByTime(30_000);

    const fn2 = vi.fn().mockResolvedValue('after');
    await expect(dedupe('fast-key', fn2)).resolves.toBe('after');
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('evicts multiple entries at their respective TTLs', async () => {
    const neverSettle = () => new Promise(() => {});
    const pA = dedupe('a', neverSettle);
    const pB = dedupe('b', neverSettle);

    vi.advanceTimersByTime(30_000);

    await expect(pA).rejects.toThrow('timed out');
    await expect(pB).rejects.toThrow('timed out');
  });
});
