// src/services/offlineStorage.ts
import { Course, OfflineContent, Lesson } from "../types/mobile";

const DB_NAME = "LearningAppDB";
const DB_VERSION = 2;

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private isServer = typeof window === "undefined";

  async init(): Promise<void> {
    if (this.isServer) {
      return; // Don't initialize on server
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

        // Courses store
        if (!db.objectStoreNames.contains("courses")) {
          const store = db.createObjectStore("courses", { keyPath: "id" });
          store.createIndex("downloaded", "downloaded", { unique: false });
          store.createIndex("lastAccessed", "lastAccessed", { unique: false });
        }

        // Lessons store
        if (!db.objectStoreNames.contains("lessons")) {
          const store = db.createObjectStore("lessons", { keyPath: "id" });
          store.createIndex("courseId", "courseId", { unique: false });
          store.createIndex("completed", "completed", { unique: false });
        }

        // Offline content store
        if (!db.objectStoreNames.contains("offlineContent")) {
          const store = db.createObjectStore("offlineContent", {
            keyPath: "courseId",
          });
          store.createIndex("downloadedAt", "downloadedAt", { unique: false });
        }

        // User progress store
        if (!db.objectStoreNames.contains("userProgress")) {
          db.createObjectStore("userProgress", { keyPath: "userId" });
        }
      };
    });
  }

  private async waitForDB(): Promise<void> {
    if (this.isServer) {
      return; // Don't wait for DB on server
    }

    if (!this.db) {
      await this.init();
    }
  }

  async saveCourse(course: Course): Promise<void> {
    if (this.isServer) return;

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["courses"], "readwrite");
      const store = transaction.objectStore("courses");
      const request = store.put(course);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCourse(id: string): Promise<Course | null> {
    if (this.isServer) return null;

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["courses"], "readonly");
      const store = transaction.objectStore("courses");
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getDownloadedCourses(): Promise<Course[]> {
    if (this.isServer) return [];

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["courses"], "readonly");
      const store = transaction.objectStore("courses");
      const index = store.index("downloaded");
      const request = index.getAll(IDBKeyRange.only(true));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveLessons(lessons: Lesson[]): Promise<void> {
    if (this.isServer) return;

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["lessons"], "readwrite");
      const store = transaction.objectStore("lessons");

      lessons.forEach((lesson) => {
        store.put(lesson);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCourseLessons(courseId: string): Promise<Lesson[]> {
    if (this.isServer) return [];

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["lessons"], "readonly");
      const store = transaction.objectStore("lessons");
      const index = store.index("courseId");
      const request = index.getAll(courseId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveOfflineContent(content: OfflineContent): Promise<void> {
    if (this.isServer) return;

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["offlineContent"], "readwrite");
      const store = transaction.objectStore("offlineContent");
      const request = store.put(content);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getOfflineContent(courseId: string): Promise<OfflineContent | null> {
    if (this.isServer) return null;

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["offlineContent"], "readonly");
      const store = transaction.objectStore("offlineContent");
      const request = store.get(courseId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async deleteOfflineContent(courseId: string): Promise<void> {
    if (this.isServer) return;

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["offlineContent"], "readwrite");
      const store = transaction.objectStore("offlineContent");
      const request = store.delete(courseId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async saveUserProgress(progress: any): Promise<void> {
    if (this.isServer) return;

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["userProgress"], "readwrite");
      const store = transaction.objectStore("userProgress");
      const request = store.put(progress);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getUserProgress(): Promise<any> {
    if (this.isServer) return null;

    await this.waitForDB();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["userProgress"], "readonly");
      const store = transaction.objectStore("userProgress");
      const request = store.get("current-user");

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getStorageUsage(): Promise<{ used: number; total: number }> {
    if (this.isServer) {
      return { used: 0, total: 5000 * 1024 * 1024 };
    }

    if (!navigator.storage || !navigator.storage.estimate) {
      return { used: 0, total: 5000 * 1024 * 1024 };
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        total: estimate.quota || 5000 * 1024 * 1024,
      };
    } catch (error) {
      console.error("Failed to get storage estimate:", error);
      return { used: 0, total: 5000 * 1024 * 1024 };
    }
  }
}

export const offlineStorage = new OfflineStorageService();
