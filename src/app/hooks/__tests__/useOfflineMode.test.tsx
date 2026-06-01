import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOfflineMode } from '../useOfflineMode';
import { offlineApi } from '@/services/offlineApi';

const mockData = {
  courses: new Map<string, any>(),
  progress: new Map<string, any>(),
  syncQueue: new Map<string, any>(),
};

vi.mock('idb', () => ({
  openDB: vi.fn(async () => ({
    objectStoreNames: {
      contains: vi.fn(() => false),
    },
    createObjectStore: vi.fn(() => ({
      createIndex: vi.fn(),
    })),
    put: vi.fn(async (storeName: string, data: any) => {
      if (storeName === 'courses') {
        mockData.courses.set(data.id, data);
      } else if (storeName === 'progress') {
        mockData.progress.set(`${data.courseId}-${data.moduleId}`, data);
      } else if (storeName === 'syncQueue') {
        mockData.syncQueue.set(data.id, data);
      }
    }),
    get: vi.fn(async (storeName: string, key: any) => {
      if (storeName === 'courses') {
        return mockData.courses.get(key);
      }
      if (storeName === 'progress') {
        const progressKey = Array.isArray(key) ? `${key[0]}-${key[1]}` : key;
        return mockData.progress.get(progressKey);
      }
      return undefined;
    }),
    getAll: vi.fn(async (storeName: string) => {
      if (storeName === 'courses') {
        return Array.from(mockData.courses.values());
      }
      if (storeName === 'progress') {
        return Array.from(mockData.progress.values());
      }
      if (storeName === 'syncQueue') {
        return Array.from(mockData.syncQueue.values());
      }
      return [];
    }),
    delete: vi.fn(async (storeName: string, key: any) => {
      if (storeName === 'courses') {
        mockData.courses.delete(key);
      } else if (storeName === 'progress') {
        mockData.progress.delete(key);
      } else if (storeName === 'syncQueue') {
        mockData.syncQueue.delete(key);
      }
    }),
    clear: vi.fn(async (storeName: string) => {
      if (storeName === 'courses') mockData.courses.clear();
      if (storeName === 'progress') mockData.progress.clear();
      if (storeName === 'syncQueue') mockData.syncQueue.clear();
    }),
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        index: vi.fn(() => ({
          getAll: vi.fn(async (key: any) => {
            if (key === false) {
              return Array.from(mockData.progress.values()).filter((item) => !item.synced);
            }
            return Array.from(mockData.progress.values()).filter((item) => item.courseId === key);
          }),
        })),
      })),
      done: Promise.resolve(),
    })),
  })),
}));

vi.mock('@/services/offlineApi', () => ({
  offlineApi: {
    syncLessonProgress: vi.fn(async (payload: any) => ({
      success: true,
      message: 'Progress synced',
      data: {
        ...payload,
        lessonId: payload.moduleId,
      },
    })),
  },
}));

Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: vi.fn(async () => ({
      quota: 1024 * 1024 * 1024,
      usage: 100 * 1024 * 1024,
    })),
  },
  writable: true,
});

describe('useOfflineMode', () => {
  beforeEach(() => {
    mockData.courses.clear();
    mockData.progress.clear();
    mockData.syncQueue.clear();
    vi.clearAllMocks();
  });

  it('initializes offline mode', async () => {
    const { result } = renderHook(() => useOfflineMode());
    await act(async () => {
      await result.current.initializeOfflineMode();
    });

    expect(result.current.isInitialized).toBe(true);
  });

  it('saves progress and enqueues sync items', async () => {
    const { result } = renderHook(() => useOfflineMode());
    await act(async () => {
      await result.current.initializeOfflineMode();
    });

    await act(async () => {
      await result.current.saveProgress('course-1', 'module-1', 42, false);
    });

    expect(mockData.progress.size).toBe(1);
    expect(mockData.syncQueue.size).toBe(1);

    const savedProgress = await result.current.getProgress('course-1', 'module-1');
    expect(savedProgress).toBeDefined();
    expect(savedProgress?.progress).toBe(42);
    expect(savedProgress?.synced).toBe(false);
  });

  it('syncs offline progress through the remote lesson progress microservice', async () => {
    const { result } = renderHook(() => useOfflineMode());
    await act(async () => {
      await result.current.initializeOfflineMode();
    });

    await act(async () => {
      await result.current.saveProgress('course-1', 'module-1', 42, false);
    });

    await act(async () => {
      await result.current.syncData();
    });

    expect(offlineApi.syncLessonProgress).toHaveBeenCalledTimes(1);
    expect(mockData.syncQueue.size).toBe(0);

    const syncedProgress = await result.current.getProgress('course-1', 'module-1');
    expect(syncedProgress?.synced).toBe(true);
    expect(syncedProgress?.moduleId).toBe('module-1');
  });

  it('reports storage usage', async () => {
    const { result } = renderHook(() => useOfflineMode());
    await act(async () => {
      await result.current.initializeOfflineMode();
    });

    const usage = await result.current.getStorageInfo();
    expect(usage).toHaveProperty('used');
    expect(usage).toHaveProperty('total');
    expect(usage).toHaveProperty('percentage');
  });
});
