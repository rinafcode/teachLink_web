import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientImpl, getRetryDelay } from '../api';
import { API_CACHE_MAX_ENTRIES_DEFAULT } from '@/constants/app.constants';

describe('getRetryDelay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses full jitter across the exponential backoff window', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(getRetryDelay(1, 100)).toBe(50);
    expect(getRetryDelay(2, 100)).toBe(100);
    expect(getRetryDelay(3, 100)).toBe(200);
  });

  it('can produce the minimum delay', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(getRetryDelay(3, 100)).toBe(0);
  });

  it('can produce the maximum backoff window', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);

    expect(getRetryDelay(3, 100)).toBe(400);
  });
});

describe('ApiClient LRU Response Cache', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('caches GET responses when useCache is true', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'hello' }),
    });
    global.fetch = fetchMock as any;

    const client = new ApiClientImpl({ baseURL: 'https://api.example.com' });

    const res1 = await client.get('/test', { useCache: true, dedupe: false });
    const res2 = await client.get('/test', { useCache: true, dedupe: false });

    expect(res1).toEqual({ message: 'hello' });
    expect(res2).toEqual({ message: 'hello' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(client.getCacheSize()).toBe(1);
  });

  it('evicts the least recently used entry when maxCacheSize is exceeded', async () => {
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: async () => ({ url, count: callCount }),
      });
    });
    global.fetch = fetchMock as any;

    const client = new ApiClientImpl({
      baseURL: 'https://api.example.com',
      maxCacheSize: 3,
    });

    // Populate cache up to cap (entries: 1, 2, 3)
    await client.get('/item1', { useCache: true, dedupe: false });
    await client.get('/item2', { useCache: true, dedupe: false });
    await client.get('/item3', { useCache: true, dedupe: false });
    expect(client.getCacheSize()).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Access item4: should evict item1 (oldest / LRU)
    await client.get('/item4', { useCache: true, dedupe: false });
    expect(client.getCacheSize()).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(4);

    // item2, item3, item4 should still be cached
    await client.get('/item2', { useCache: true, dedupe: false });
    await client.get('/item3', { useCache: true, dedupe: false });
    await client.get('/item4', { useCache: true, dedupe: false });
    expect(fetchMock).toHaveBeenCalledTimes(4); // No additional network requests

    // item1 was evicted, so accessing it should trigger a fetch
    await client.get('/item1', { useCache: true, dedupe: false });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('promotes an accessed item to MRU so older unaccessed items are evicted first', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        json: async () => ({ url }),
      }),
    );
    global.fetch = fetchMock as any;

    const client = new ApiClientImpl({
      baseURL: 'https://api.example.com',
      maxCacheSize: 2,
    });

    // Add item1 and item2 (Order: item1 [oldest], item2 [newest])
    await client.get('/item1', { useCache: true, dedupe: false });
    await client.get('/item2', { useCache: true, dedupe: false });

    // Read item1 from cache -> refreshes item1 to MRU (Order: item2 [oldest], item1 [newest])
    await client.get('/item1', { useCache: true, dedupe: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Insert item3 -> should evict item2, NOT item1
    await client.get('/item3', { useCache: true, dedupe: false });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // item1 should still be cached
    await client.get('/item1', { useCache: true, dedupe: false });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // item2 was evicted -> triggers a fetch
    await client.get('/item2', { useCache: true, dedupe: false });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('supports maxCacheEntries alias in configuration', () => {
    const client = new ApiClientImpl({
      maxCacheEntries: 50,
    });
    expect(client['config'].maxCacheSize).toBe(50);
  });

  it('defaults to API_CACHE_MAX_ENTRIES_DEFAULT when not configured', () => {
    const client = new ApiClientImpl({});
    expect(client['config'].maxCacheSize).toBe(API_CACHE_MAX_ENTRIES_DEFAULT);
  });

  it('does not cache when maxCacheSize is 0', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ value: 123 }),
    });
    global.fetch = fetchMock as any;

    const client = new ApiClientImpl({
      baseURL: 'https://api.example.com',
      maxCacheSize: 0,
    });

    await client.get('/test', { useCache: true, dedupe: false });
    await client.get('/test', { useCache: true, dedupe: false });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(client.getCacheSize()).toBe(0);
  });

  it('invalidates cache properly', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'ok' }),
    });
    global.fetch = fetchMock as any;

    const client = new ApiClientImpl({ baseURL: 'https://api.example.com' });

    await client.get('/resource', { useCache: true, dedupe: false });
    expect(client.getCacheSize()).toBe(1);

    client.invalidateCache();
    expect(client.getCacheSize()).toBe(0);
  });
});
