import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineSyncManager } from '../OfflineSyncManager';

describe('OfflineSyncManager (Microservices Architecture)', () => {
  let originalFetch: typeof global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      clear: vi.fn(() => {
        for (const key in store) delete store[key];
      }),
    });

    // Mock navigator online status
    vi.stubGlobal('navigator', { onLine: false });

    // Mock fetch
    originalFetch = global.fetch;
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('queues requests when offline', () => {
    const manager = new OfflineSyncManager();

    manager.enqueueRequest({
      targetService: 'groups',
      endpoint: '/api/groups/123/messages',
      method: 'POST',
      body: { text: 'Hello offline!' },
    });

    // Since it's offline, fetch should not have been called
    expect(fetchMock).not.toHaveBeenCalled();

    // Check if it saved to localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'teachlink_offline_queue_v1',
      expect.stringContaining('Hello offline!'),
    );
  });

  it('processes queue and routes to correct microservice when back online', async () => {
    const manager = new OfflineSyncManager({
      serviceUrls: {
        groups: 'https://groups.microservice.local',
        courses: 'https://courses.microservice.local',
        auth: '',
        users: '',
        certificates: '',
      },
    });

    // Enqueue while offline
    manager.enqueueRequest({
      targetService: 'groups',
      endpoint: '/messages',
      method: 'POST',
      body: { text: 'Group msg' },
    });

    manager.enqueueRequest({
      targetService: 'courses',
      endpoint: '/progress',
      method: 'PUT',
      body: { courseId: 'c1', progress: 50 },
    });

    // Simulate coming back online
    vi.stubGlobal('navigator', { onLine: true });
    window.dispatchEvent(new Event('online'));

    // Wait for async processing
    await new Promise(process.nextTick);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe('https://groups.microservice.local/messages');
    expect(fetchMock.mock.calls[1][0]).toBe('https://courses.microservice.local/progress');
  });
});
