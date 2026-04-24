// src/services/offlineStorage.ts
import { Course, OfflineContent, Lesson } from '../types/mobile';

const DB_NAME = 'LearningAppDB';
const DB_VERSION = 3;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private isServer = typeof window === 'undefined';
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async init(): Promise<void> {
    if (this.isServer) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // Courses store
        if (!db.objectStoreNames.contains('courses')) {
          const store = db.createObjectStore('courses', { keyPath: 'id' });
          store.createIndex('downloaded', 'downloaded', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('difficulty', 'difficulty', { unique: false });
        } else if (oldVersion < 3) {
          const transaction = (event.target as IDBOpenDBRequest).transaction!;
          const store = transaction.objectStore('courses');
          if (!store.indexNames.contains('category')) {
            store.createIndex('category', 'category', { unique: false });
          }
          if (!store.indexNames.contains('difficulty')) {
            store.createIndex('difficulty', 'difficulty', { unique: false });
          }
        }

        // Lessons store
        if (!db.objectStoreNames.contains('lessons')) {
          const store = db.createObjectStore('lessons', { keyPath: 'id' });
          store.createIndex('courseId', 'courseId', { unique: false });
          store.createIndex('completed', 'completed', { unique: false });
          store.createIndex('order', 'order', { unique: false });
        } else if (oldVersion < 3) {
          const transaction = (event.target as IDBOpenDBRequest).transaction!;
          const store = transaction.objectStore('lessons');
          if (!store.indexNames.contains('order')) {
            store.createIndex('order', 'order', { unique: false });
          }
        }

        // Offline content store
        if (!db.objectStoreNames.contains('offlineContent')) {
          const store = db.createObjectStore('offlineContent', {
            keyPath: 'courseId',
          });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        } else if (oldVersion < 3) {
          const transaction = (event.target as IDBOpenDBRequest).transaction!;
          const store = transaction.objectStore('offlineContent');
          if (!store.indexNames.contains('size')) {
            store.createIndex('size', 'size', { unique: false });
          }
        }

        // User progress store
        if (!db.objectStoreNames.contains('userProgress')) {
          const store = db.createObjectStore('userProgress', { keyPath: 'userId' });
          store.createIndex('lastActive', 'lastActive', { unique: false });
        } else if (oldVersion < 3) {
          const transaction = (event.target as IDBOpenDBRequest).transaction!;
          const store = transaction.objectStore('userProgress');
          if (!store.indexNames.contains('lastActive')) {
            store.createIndex('lastActive', 'lastActive', { unique: false });
          }
        }
      };
    });
  }

  private async waitForDB(): Promise<void> {
    if (this.isServer) return;
    if (!this.db) await this.init();
  }

  // Caching utilities
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      // Also invalidate related collections
      for (const k of this.cache.keys()) {
        if (k.startsWith('list:')) this.cache.delete(k);
      }
    } else {
      this.cache.clear();
    }
  }

  // Optimized generic query utility
  private async queryByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey | IDBKeyRange,
  ): Promise<T[]> {
    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveCourse(course: Course): Promise<void> {
    if (this.isServer) return;
    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction(['courses'], 'readwrite');
      const store = transaction.objectStore('courses');
      const request = store.put(course);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.invalidateCache(`course:${course.id}`);
        resolve();
      };
    });
  }

  async getCourse(id: string): Promise<Course | null> {
    if (this.isServer) return null;
    const cacheKey = `course:${id}`;
    const cached = this.getFromCache<Course>(cacheKey);
    if (cached) return cached;

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction(['courses'], 'readonly');
      const store = transaction.objectStore('courses');
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result || null;
        if (result) this.setCache(cacheKey, result);
        resolve(result);
      };
    });
  }

  async getDownloadedCourses(): Promise<Course[]> {
    if (this.isServer) return [];
    const cacheKey = 'list:downloaded-courses';
    const cached = this.getFromCache<Course[]>(cacheKey);
    if (cached) return cached;

    const results = await this.queryByIndex<Course>('courses', 'downloaded', IDBKeyRange.only(true));
    this.setCache(cacheKey, results);
    return results;
  }

  async getCoursesByCategory(category: string): Promise<Course[]> {
    if (this.isServer) return [];
    const cacheKey = `list:courses-cat:${category}`;
    const cached = this.getFromCache<Course[]>(cacheKey);
    if (cached) return cached;

    const results = await this.queryByIndex<Course>('courses', 'category', category);
    this.setCache(cacheKey, results);
    return results;
  }

  async saveLessons(lessons: Lesson[]): Promise<void> {
    if (this.isServer) return;
    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction(['lessons'], 'readwrite');
      const store = transaction.objectStore('lessons');

      lessons.forEach((lesson) => {
        store.put(lesson);
      });

      transaction.oncomplete = () => {
        if (lessons.length > 0 && lessons[0]) {
          this.invalidateCache(`lessons-course:${lessons[0].courseId}`);
        }
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCourseLessons(courseId: string): Promise<Lesson[]> {
    if (this.isServer) return [];
    const cacheKey = `lessons-course:${courseId}`;
    const cached = this.getFromCache<Lesson[]>(cacheKey);
    if (cached) return cached;

    const results = await this.queryByIndex<Lesson>('lessons', 'courseId', courseId);
    // Sort by order using optimized in-memory sort or index if possible
    const sorted = results.sort((a, b) => (a.order || 0) - (b.order || 0));
    this.setCache(cacheKey, sorted);
    return sorted;
  }

  async saveOfflineContent(content: OfflineContent): Promise<void> {
    if (this.isServer) return;
    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction(['offlineContent'], 'readwrite');
      const store = transaction.objectStore('offlineContent');
      const request = store.put(content);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.invalidateCache(`offline:${content.courseId}`);
        resolve();
      };
    });
  }

  async getOfflineContent(courseId: string): Promise<OfflineContent | null> {
    if (this.isServer) return null;
    const cacheKey = `offline:${courseId}`;
    const cached = this.getFromCache<OfflineContent>(cacheKey);
    if (cached) return cached;

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction(['offlineContent'], 'readonly');
      const store = transaction.objectStore('offlineContent');
      const request = store.get(courseId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result || null;
        if (result) this.setCache(cacheKey, result);
        resolve(result);
      };
    });
  }

  async getAllOfflineContent(): Promise<OfflineContent[]> {
    if (this.isServer) return [];
    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction(['offlineContent'], 'readonly');
      const store = transaction.objectStore('offlineContent');
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteOfflineContent(courseId: string): Promise<void> {
    if (this.isServer) return;
    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction(['offlineContent', 'courses', 'lessons'], 'readwrite');
      const contentStore = transaction.objectStore('offlineContent');
      contentStore.delete(courseId);

      transaction.oncomplete = () => {
        this.invalidateCache(`offline:${courseId}`);
        this.invalidateCache(`course:${courseId}`);
        this.invalidateCache(`lessons-course:${courseId}`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveUserProgress(progress: any): Promise<void> {
    if (this.isServer) return;
    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction(['userProgress'], 'readwrite');
      const store = transaction.objectStore('userProgress');
      const request = store.put(progress);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.invalidateCache('user-progress');
        resolve();
      };
    });
  }

  async getUserProgress(): Promise<any> {
    if (this.isServer) return null;
    const cacheKey = 'user-progress';
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction(['userProgress'], 'readonly');
      const store = transaction.objectStore('userProgress');
      const request = store.get('current-user');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) this.setCache(cacheKey, result);
        resolve(result);
      };
    });
  }

  async getStorageUsage(): Promise<{ used: number; total: number; percentage: number }> {
    if (this.isServer) {
      return { used: 0, total: 5000 * 1024 * 1024, percentage: 0 };
    }

    if (!navigator.storage || !navigator.storage.estimate) {
      return { used: 0, total: 5000 * 1024 * 1024, percentage: 0 };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const total = estimate.quota || 5000 * 1024 * 1024;
      return {
        used,
        total,
        percentage: (used / total) * 100,
      };
    } catch (error) {
      console.error('Failed to get storage estimate:', error);
      return { used: 0, total: 5000 * 1024 * 1024, percentage: 0 };
    }
  }

  async clearAll(): Promise<void> {
    if (this.isServer) return;
    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const stores = Array.from(this.db.objectStoreNames);
      const transaction = this.db.transaction(stores, 'readwrite');
      stores.forEach((s) => transaction.objectStore(s).clear());
      transaction.oncomplete = () => {
        this.invalidateCache();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const offlineStorage = new OfflineStorageService();
