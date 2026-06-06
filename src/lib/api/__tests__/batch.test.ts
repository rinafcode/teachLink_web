/**
 * Tests for:
 *  - src/lib/api/batch.ts  (createBatcher)
 *  - src/hooks/useHelpDocumentation.ts  (useHelpDocumentation)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createBatcher } from '@/lib/api/batch';
import { useHelpDocumentation } from '@/hooks/useHelpDocumentation';
import type { BatchRequest, BatchResponse } from '@/lib/api/batch';
import type { HelpArticle } from '@/hooks/useHelpDocumentation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeArticle(id: string): HelpArticle {
  return { id, title: `Title ${id}`, content: `Content ${id}`, category: 'Test', tags: [id] };
}

// ─── createBatcher ────────────────────────────────────────────────────────────

describe('createBatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('batches multiple queued requests into a single executor call', async () => {
    const executor = vi.fn(
      async (reqs: BatchRequest[]): Promise<BatchResponse[]> =>
        reqs.map((r) => ({ id: r.id, data: `result-${r.path}` })),
    );

    const batcher = createBatcher({ executor, debounceMs: 10 });

    const p1 = batcher.queue({ id: 'a', path: 'article-a' });
    const p2 = batcher.queue({ id: 'b', path: 'article-b' });

    // Flush the debounce timer
    await act(async () => {
      vi.runAllTimers();
    });

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(executor).toHaveBeenCalledTimes(1);
    expect(executor.mock.calls[0][0]).toHaveLength(2);
    expect(r1).toBe('result-article-a');
    expect(r2).toBe('result-article-b');
  });

  it('resolves each promise with its matching response', async () => {
    const executor = vi.fn(
      async (reqs: BatchRequest[]): Promise<BatchResponse[]> =>
        reqs.map((r) => ({ id: r.id, data: r.path.toUpperCase() })),
    );

    const batcher = createBatcher({ executor, debounceMs: 0 });

    const p = batcher.queue({ id: 'x', path: 'hello' });

    await act(async () => {
      vi.runAllTimers();
    });

    expect(await p).toBe('HELLO');
  });

  it('rejects a promise when the response contains an error', async () => {
    const executor = vi.fn(
      async (reqs: BatchRequest[]): Promise<BatchResponse[]> =>
        reqs.map((r) => ({ id: r.id, error: 'not found' })),
    );

    const batcher = createBatcher({ executor, debounceMs: 0 });
    const p = batcher.queue({ id: 'bad', path: 'missing' });
    // Attach rejection handler before flushing to avoid unhandled rejection warning
    const assertion = expect(p).rejects.toThrow('not found');

    await act(async () => {
      vi.runAllTimers();
    });

    await assertion;
  });

  it('rejects all promises when the executor throws', async () => {
    const executor = vi.fn(async (): Promise<BatchResponse[]> => {
      throw new Error('network failure');
    });

    const batcher = createBatcher({ executor, debounceMs: 0 });
    const p1 = batcher.queue({ id: '1', path: 'a' });
    const p2 = batcher.queue({ id: '2', path: 'b' });
    // Attach rejection handlers before flushing
    const a1 = expect(p1).rejects.toThrow('network failure');
    const a2 = expect(p2).rejects.toThrow('network failure');

    await act(async () => {
      vi.runAllTimers();
    });

    await a1;
    await a2;
  });

  it('respects maxBatchSize and sends overflow in a second batch', async () => {
    const executor = vi.fn(
      async (reqs: BatchRequest[]): Promise<BatchResponse[]> =>
        reqs.map((r) => ({ id: r.id, data: r.path })),
    );

    const batcher = createBatcher({ executor, debounceMs: 0, maxBatchSize: 2 });

    const promises = [
      batcher.queue({ id: '1', path: 'a' }),
      batcher.queue({ id: '2', path: 'b' }),
      batcher.queue({ id: '3', path: 'c' }),
    ];

    await act(async () => {
      vi.runAllTimers();
    });

    await Promise.all(promises);

    // First batch: 2 items, second batch: 1 item
    expect(executor).toHaveBeenCalledTimes(2);
  });

  it('flushNow sends pending requests immediately', async () => {
    const executor = vi.fn(
      async (reqs: BatchRequest[]): Promise<BatchResponse[]> =>
        reqs.map((r) => ({ id: r.id, data: r.path })),
    );

    const batcher = createBatcher({ executor, debounceMs: 5000 });
    const p = batcher.queue({ id: 'z', path: 'immediate' });

    // Don't advance timers – use flushNow instead
    batcher.flushNow();

    expect(await p).toBe('immediate');
    expect(executor).toHaveBeenCalledTimes(1);
  });
});

// ─── useHelpDocumentation ─────────────────────────────────────────────────────

describe('useHelpDocumentation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetch(articles: HelpArticle[]) {
    const responses: BatchResponse<HelpArticle>[] = articles.map((a) => ({ id: a.id, data: a }));
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ responses }),
    });
  }

  it('starts with empty articles and loading=false', () => {
    const { result } = renderHook(() => useHelpDocumentation([]));
    expect(result.current.articles).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches articles on mount when ids are provided', async () => {
    const article = makeArticle('getting-started');
    mockFetch([article]);

    const { result } = renderHook(() => useHelpDocumentation(['getting-started']));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.articles).toHaveLength(1);
    expect(result.current.articles[0].id).toBe('getting-started');
  });

  it('calls the versioned help endpoint', async () => {
    const article = makeArticle('reputation');
    mockFetch([article]);

    const { result } = renderHook(() => useHelpDocumentation(['reputation']));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/help',
      expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } }),
    );
    expect(result.current.articles[0].id).toBe('reputation');
  });

  it('sets error when fetch fails', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useHelpDocumentation(['bad-id']));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeTruthy();
  });

  it('deduplicates articles already in state', async () => {
    const article = makeArticle('courses');
    mockFetch([article]);

    const { result } = renderHook(() => useHelpDocumentation(['courses']));

    await waitFor(() => expect(result.current.articles).toHaveLength(1));

    // Fetch the same id again
    mockFetch([article]);
    act(() => {
      result.current.fetchArticles(['courses']);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Still only one article
    expect(result.current.articles).toHaveLength(1);
  });

  it('fetchArticles adds new articles on demand', async () => {
    const a1 = makeArticle('tipping');
    const a2 = makeArticle('reputation');
    mockFetch([a1]);

    const { result } = renderHook(() => useHelpDocumentation(['tipping']));
    await waitFor(() => expect(result.current.articles).toHaveLength(1));

    mockFetch([a2]);
    act(() => {
      result.current.fetchArticles(['reputation']);
    });

    await waitFor(() => expect(result.current.articles).toHaveLength(2));
    expect(result.current.articles.map((a) => a.id)).toContain('reputation');
  });
});
