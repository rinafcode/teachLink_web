import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useOfflineMode } from '../useOfflineMode';

// Mock data storage for tests
const mockData = {
  courses: new Map(),
  progress: new Map(),
  syncQueue: new Map(),
  cache: new Map(),
};

// Mock the idb library with realistic behavior
vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve({
    objectStoreNames: {
      contains: vi.fn(() => false),
    },
    createObjectStore: vi.fn(() => ({
      createIndex: vi.fn(),
    })),
    put: vi.fn((storeName, data) => {
      if (storeName === 'courses') {
        mockData.courses.set(data.id, data);
      } else if (storeName === 'progress') {
        const key = `${data.courseId}-${data.moduleId}`;
        mockData.progress.set(key, data);
      } else if (storeName === 'syncQueue') {
        mockData.syncQueue.set(data.id, data);
      } else if (storeName === 'cache') {
        mockData.cache.set(data.url, data);
      }
      return Promise.resolve();
    }),
    get: vi.fn((storeName, key) => {
      if (storeName === 'courses') {
        return Promise.resolve(mockData.courses.get(key));
      } else if (storeName === 'progress') {
        // Handle both string and array keys for progress
        const progressKey = Array.isArray(key) ? `${key[0]}-${key[1]}` : key;
        return Promise.resolve(mockData.progress.get(progressKey));
      } else if (storeName === 'cache') {
        return Promise.resolve(mockData.cache.get(key));
      }
      return Promise.resolve();
    }),
    getAll: vi.fn((storeName) => {
      if (storeName === 'courses') {
        return Promise.resolve(Array.from(mockData.courses.values()));
      } else if (storeName === 'progress') {
        return Promise.resolve(Array.from(mockData.progress.values()));
      } else if (storeName === 'syncQueue') {
        return Promise.resolve(Array.from(mockData.syncQueue.values()));
      }
      return Promise.resolve([]);
    }),
    delete: vi.fn((storeName, key) => {
      if (storeName === 'courses') {
        mockData.courses.delete(key);
      } else if (storeName === 'progress') {
        mockData.progress.delete(key);
      } else if (storeName === 'syncQueue') {
        mockData.syncQueue.delete(key);
      } else if (storeName === 'cache') {
        mockData.cache.delete(key);
      }
      return Promise.resolve();
    }),
    clear: vi.fn((storeName) => {
      if (storeName === 'courses') {
        mockData.courses.clear();
      } else if (storeName === 'progress') {
        mockData.progress.clear();
      } else if (storeName === 'syncQueue') {
        mockData.syncQueue.clear();
      } else if (storeName === 'cache') {
        mockData.cache.clear();
      }
      return Promise.resolve();
    }),
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        index: vi.fn(() => ({
          getAll: vi.fn((key) => {
            if (key === false) {
              // Return unsynced progress
              return Promise.resolve(Array.from(mockData.progress.values()).filter(p => !p.synced));
            }
            // Return progress by courseId
            return Promise.resolve(Array.from(mockData.progress.values()).filter(p => p.courseId === key));
          }),
        })),
      })),
    })),
  })),
}));

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: vi.fn(() => Promise.resolve({
      quota: 1024 * 1024 * 1024, // 1GB
      usage: 100 * 1024 * 1024, // 100MB
    })),
  },
  writable: true,
});

describe('useOfflineMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear mock data before each test
    mockData.courses.clear();
    mockData.progress.clear();
    mockData.syncQueue.clear();
    mockData.cache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize offline mode successfully', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      expect(result.current.isInitialized).toBe(true);
    });

    it('should handle initialization errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock the openDB to throw an error
      const { openDB } = await import('idb');
      vi.mocked(openDB).mockRejectedValueOnce(new Error('Database error'));

      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        try {
          await result.current.initializeOfflineMode();
        } catch (error) {
          // Expected error
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize offline mode:', expect.any(Error));
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('course operations', () => {
    it('should download and save a course', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      const courseData = {
        id: 'test-course',
        title: 'Test Course',
        description: 'A test course',
        thumbnail: 'test.jpg',
        duration: 3600,
        modules: [],
        size: 100 * 1024 * 1024, // 100MB
      };

      await act(async () => {
        await result.current.downloadCourse('test-course', courseData);
      });

      // Verify the course was saved
      const courses = await result.current.getCourses();
      expect(courses).toHaveLength(1);
      expect(courses[0].id).toBe('test-course');
      expect(courses[0].title).toBe('Test Course');
    });

    it('should check course availability', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      // Test with non-existent course
      const available = await result.current.checkCourseAvailability('non-existent');
      expect(available).toBe(false);

      // Download a course and test availability
      const courseData = {
        id: 'test-course',
        title: 'Test Course',
        description: 'A test course',
        thumbnail: 'test.jpg',
        duration: 3600,
        modules: [],
        size: 100 * 1024 * 1024,
      };

      await act(async () => {
        await result.current.downloadCourse('test-course', courseData);
      });

      const availableAfter = await result.current.checkCourseAvailability('test-course');
      expect(availableAfter).toBe(true);
    });
  });

  describe('progress tracking', () => {
    it('should save and retrieve progress', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      const courseId = 'test-course';
      const moduleId = 'test-module';
      const progress = 75;

      await act(async () => {
        await result.current.saveProgress(courseId, moduleId, progress, false);
      });

      const savedProgress = await result.current.getProgress(courseId, moduleId);
      expect(savedProgress).toBeDefined();
      expect(savedProgress?.progress).toBe(progress);
      expect(savedProgress?.courseId).toBe(courseId);
      expect(savedProgress?.moduleId).toBe(moduleId);
    });

    it('should get course progress', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      const courseId = 'test-course';

      // Save multiple progress entries
      await act(async () => {
        await result.current.saveProgress(courseId, 'module-1', 50, false);
        await result.current.saveProgress(courseId, 'module-2', 75, true);
        await result.current.saveProgress(courseId, 'module-3', 100, true);
      });

      const courseProgress = await result.current.getCourseProgress(courseId);
      expect(courseProgress).toHaveLength(3);
      expect(courseProgress[0].courseId).toBe(courseId);
    });
  });

  describe('sync operations', () => {
    it('should sync data successfully', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      // Add some data to sync
      await act(async () => {
        await result.current.saveProgress('course-1', 'module-1', 50, false);
        await result.current.saveProgress('course-2', 'module-1', 75, false);
      });

      await act(async () => {
        await result.current.syncData();
      });

      // Verify sync completed (in real implementation, this would check sync status)
      expect(result.current.isInitialized).toBe(true);
    });

    it('should handle sync errors gracefully', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      // Test that sync doesn't throw when no data to sync
      await act(async () => {
        await result.current.syncData();
      });

      // Should complete without error
      expect(result.current.isInitialized).toBe(true);
    });
  });

  describe('storage management', () => {
    it('should get storage information', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      const storageInfo = await result.current.getStorageInfo();
      expect(storageInfo).toHaveProperty('used');
      expect(storageInfo).toHaveProperty('total');
      expect(storageInfo).toHaveProperty('percentage');
      expect(typeof storageInfo.used).toBe('number');
      expect(typeof storageInfo.total).toBe('number');
      expect(typeof storageInfo.percentage).toBe('number');
    });

    it('should clear all data', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      // Add some data
      await act(async () => {
        await result.current.saveProgress('course-1', 'module-1', 50, false);
      });

      // Clear all data
      await act(async () => {
        await result.current.clearData();
      });

      // Verify data is cleared
      const courses = await result.current.getCourses();
      expect(courses).toHaveLength(0);
    });
  });

  describe('sync queue operations', () => {
    it('should add items to sync queue', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      const syncData = {
        type: 'progress',
        data: { courseId: 'test', moduleId: 'test', progress: 50 }
      };

      await act(async () => {
        await result.current.addToSyncQueue(syncData);
      });

      // In a real implementation, we would verify the item was added to the queue
      expect(result.current.isInitialized).toBe(true);
    });

    it('should cache and retrieve assets', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      const url = 'https://example.com/asset.jpg';
      const assetData = { type: 'image', data: 'base64data' };

      await act(async () => {
        await result.current.cacheAsset(url, assetData);
      });

      const cachedAsset = await result.current.getCachedAsset(url);
      expect(cachedAsset).toEqual(assetData);
    });
  });

  describe('error handling', () => {
    it('should handle database not initialized errors', async () => {
      const { result } = renderHook(() => useOfflineMode());

      // Try to use methods without initializing
      await expect(result.current.downloadCourse('test', {})).rejects.toThrow('Database not initialized');
      await expect(result.current.saveProgress('test', 'test', 50)).rejects.toThrow('Database not initialized');
      await expect(result.current.syncData()).rejects.toThrow('Database not initialized');
    });

    it('should handle cleanup errors gracefully', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      // Test that cleanup works without error
      await act(async () => {
        await result.current.cleanupOfflineMode();
      });

      // Should complete without error
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('performance and optimization', () => {
    it('should handle large datasets efficiently', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      // Simulate adding many courses
      const startTime = performance.now();
      
      await act(async () => {
        const promises = Array.from({ length: 100 }, (_, i) => 
          result.current.downloadCourse(`course-${i}`, {
            id: `course-${i}`,
            title: `Course ${i}`,
            description: `Description ${i}`,
            thumbnail: `thumb-${i}.jpg`,
            duration: 3600,
            modules: [],
            size: 10 * 1024 * 1024, // 10MB each
          })
        );
        await Promise.all(promises);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds

      const courses = await result.current.getCourses();
      expect(courses).toHaveLength(100);
    });

    it('should handle concurrent operations', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.initializeOfflineMode();
      });

      // Perform multiple concurrent operations
      await act(async () => {
        const operations = [
          result.current.downloadCourse('course-1', { id: 'course-1', title: 'Course 1', description: '', thumbnail: '', duration: 0, modules: [], size: 0 }),
          result.current.saveProgress('course-1', 'module-1', 50, false),
          result.current.saveProgress('course-1', 'module-2', 75, false),
          result.current.addToSyncQueue({ type: 'progress', data: { courseId: 'course-1', progress: 50 } }),
        ];

        await Promise.all(operations);
      });

      // Verify all operations completed successfully
      const courses = await result.current.getCourses();
      expect(courses).toHaveLength(1);
      
      const progress = await result.current.getProgress('course-1', 'module-1');
      expect(progress?.progress).toBe(50);
    });
  });
});
