import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/lib/api';
import { clearDedupeCache } from '@/lib/api/dedupe';

describe('apiClient duplicate in-flight GET request coalescing', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    clearDedupeCache();
    apiClient.invalidateCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearDedupeCache();
    apiClient.invalidateCache();
  });

  it('coalesces concurrent identical GET requests onto a single network call and fans out results', async () => {
    let resolveFetch!: (value: any) => void;
    const fetchPromise = new Promise((res) => {
      resolveFetch = res;
    });

    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(fetchPromise);

    const p1 = apiClient.get('/api/v1/users/profile');
    const p2 = apiClient.get('/api/v1/users/profile');
    const p3 = apiClient.get('/api/v1/users/profile');

    // Yield to the microtask queue so the async requestWithRetry reaches fetch
    await Promise.resolve();

    expect(fetch).toHaveBeenCalledTimes(1);

    resolveFetch({
      ok: true,
      json: async () => ({ id: 'u1', name: 'Alice' }),
    });

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1).toEqual({ id: 'u1', name: 'Alice' });
    expect(r2).toEqual({ id: 'u1', name: 'Alice' });
    expect(r3).toEqual({ id: 'u1', name: 'Alice' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('fans out errors to all concurrent callers if the in-flight GET request fails', async () => {
    let rejectFetch!: (reason?: unknown) => void;
    const fetchPromise = new Promise((_, rej) => {
      rejectFetch = rej;
    });

    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(fetchPromise);

    const p1 = apiClient.get('/api/v1/failing-resource');
    const p2 = apiClient.get('/api/v1/failing-resource');

    await Promise.resolve();

    expect(fetch).toHaveBeenCalledTimes(1);

    rejectFetch(new Error('Network disconnected'));

    await expect(p1).rejects.toThrow();
    await expect(p2).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('does not coalesce requests with different URLs', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      return {
        ok: true,
        json: async () => ({ endpoint: url }),
      };
    });

    const p1 = apiClient.get('/api/v1/resource-a');
    const p2 = apiClient.get('/api/v1/resource-b');

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toEqual({ endpoint: '/api/v1/resource-a' });
    expect(r2).toEqual({ endpoint: '/api/v1/resource-b' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('allows subsequent GET requests after in-flight completes', async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ call: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ call: 2 }),
      });

    const r1 = await apiClient.get('/api/v1/sequential');
    expect(r1).toEqual({ call: 1 });

    const r2 = await apiClient.get('/api/v1/sequential');
    expect(r2).toEqual({ call: 2 });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('allows opting out of deduplication when dedupe: false is provided', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockImplementation(async () => ({
      ok: true,
      json: async () => ({ time: Date.now() }),
    }));

    const p1 = apiClient.get('/api/v1/no-dedupe', { dedupe: false });
    const p2 = apiClient.get('/api/v1/no-dedupe', { dedupe: false });

    await Promise.all([p1, p2]);

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
