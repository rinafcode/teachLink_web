import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ImageOptimizationTaskManager,
  ImageOptimizationTask,
} from './image-optimization-task-manager.js';
import * as optimizerModule from './image-optimizer.js';

describe('ImageOptimizationTaskManager', () => {
  let manager: ImageOptimizationTaskManager;
  const originalImage = global.Image;
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;

  const createMockImageFile = (name = 'test.jpg', size = 1000, type = 'image/jpeg'): File => {
    const file = new File(['mock content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  beforeEach(() => {
    manager = new ImageOptimizationTaskManager({ maxConcurrentTasks: 2 });

    // Mock Image class to trigger onload automatically in jsdom
    class MockImage {
      onload: () => void = () => {};
      onerror: () => void = () => {};
      width = 500;
      height = 500;
      private _src = '';

      get src() {
        return this._src;
      }

      set src(val: string) {
        this._src = val;
        // Trigger onload asynchronously to simulate image load
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 10);
      }
    }
    global.Image = MockImage as any;

    // Mock HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (
      callback: (blob: Blob | null) => void,
      type?: string,
    ) {
      const file = new File(['mock content'], 'test.webp', { type: type || 'image/webp' });
      setTimeout(() => callback(file), 10);
    };
  });

  afterEach(() => {
    manager.cancelAll();
    global.Image = originalImage;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
    vi.restoreAllMocks();
  });

  it('should initialize with default options', () => {
    const defaultManager = new ImageOptimizationTaskManager();
    expect(defaultManager.getMaxConcurrentTasks()).toBe(3);
    expect(defaultManager.getTasks()).toHaveLength(0);
  });

  it('should initialize with custom concurrency limit', () => {
    expect(manager.getMaxConcurrentTasks()).toBe(2);
  });

  it('should update max concurrent tasks', () => {
    manager.setMaxConcurrentTasks(5);
    expect(manager.getMaxConcurrentTasks()).toBe(5);
  });

  it('should enqueue tasks and execute them asynchronously', async () => {
    const file1 = createMockImageFile('image1.jpg');
    const file2 = createMockImageFile('image2.jpg');

    const id1 = manager.enqueue(file1);
    const id2 = manager.enqueue(file2);

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);

    const task1 = manager.getTask(id1);
    const task2 = manager.getTask(id2);

    expect(task1).toBeDefined();
    expect(task1?.status).toBe('pending');
    expect(task2?.status).toBe('pending');

    // Wait for the tasks to process
    await manager.waitForAll();

    const updatedTask1 = manager.getTask(id1);
    const updatedTask2 = manager.getTask(id2);

    expect(updatedTask1?.status).toBe('completed');
    expect(updatedTask2?.status).toBe('completed');
    expect(updatedTask1?.result).toBeInstanceOf(File);
  });

  it('should respect maxConcurrentTasks limit', async () => {
    // Mock optimizeImage to take some time to process
    const originalOptimizeImage = optimizerModule.optimizeImage;
    const resolvers: any[] = [];

    vi.spyOn(optimizerModule, 'optimizeImage').mockImplementation(() => {
      return new Promise<File>((resolve) => {
        resolvers.push(resolve);
      });
    });

    const file1 = createMockImageFile('img1.jpg');
    const file2 = createMockImageFile('img2.jpg');
    const file3 = createMockImageFile('img3.jpg');

    const id1 = manager.enqueue(file1);
    const id2 = manager.enqueue(file2);
    const id3 = manager.enqueue(file3);

    // Let the event loop run to start processing
    await new Promise((resolve) => setTimeout(resolve, 10));

    const state = manager.getTaskState();
    expect(state.activeCount).toBe(2); // Only 2 tasks should be running
    expect(state.pendingCount).toBe(1); // 1 task should be queued
    expect(manager.getTask(id1)?.status).toBe('processing');
    expect(manager.getTask(id2)?.status).toBe('processing');
    expect(manager.getTask(id3)?.status).toBe('pending');

    // Clean up mock
    resolvers.forEach((resolve) => resolve(file1));
    vi.restoreAllMocks();
  });

  it('should cancel a pending task', async () => {
    // Concurrency limit = 1 to guarantee task 2 stays pending
    manager.setMaxConcurrentTasks(1);

    const originalOptimizeImage = optimizerModule.optimizeImage;
    vi.spyOn(optimizerModule, 'optimizeImage').mockImplementation(() => {
      return new Promise<File>(() => {
        // Never resolve to keep active task running
      });
    });

    const file1 = createMockImageFile('img1.jpg');
    const file2 = createMockImageFile('img2.jpg');

    const id1 = manager.enqueue(file1);
    const id2 = manager.enqueue(file2);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(manager.getTask(id1)?.status).toBe('processing');
    expect(manager.getTask(id2)?.status).toBe('pending');

    const cancelResult = manager.cancel(id2);
    expect(cancelResult).toBe(true);

    const task2 = manager.getTask(id2);
    expect(task2?.status).toBe('cancelled');
    expect(task2?.progress).toBe(100);
    expect(task2?.completedAt).toBeDefined();

    // Ensure waiting for a cancelled task rejects
    await expect(manager.waitForTask(id2)).rejects.toThrow('cancelled');

    vi.restoreAllMocks();
  });

  it('should cancel a processing task', async () => {
    const originalOptimizeImage = optimizerModule.optimizeImage;
    vi.spyOn(optimizerModule, 'optimizeImage').mockImplementation(() => {
      return new Promise<File>(() => {
        // Never resolve to keep processing
      });
    });

    const file1 = createMockImageFile('img1.jpg');
    const id = manager.enqueue(file1);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(manager.getTask(id)?.status).toBe('processing');

    const cancelResult = manager.cancel(id);
    expect(cancelResult).toBe(true);
    expect(manager.getTask(id)?.status).toBe('cancelled');

    vi.restoreAllMocks();
  });

  it('should track progress callbacks', async () => {
    const file = createMockImageFile('image.jpg');
    const callback = vi.fn();

    manager.subscribe(callback);
    const id = manager.enqueue(file);

    await manager.waitForTask(id);

    expect(callback).toHaveBeenCalled();
    // Verify last callback state says completed
    const lastCallArgs = callback.mock.calls[callback.mock.calls.length - 1];
    expect(lastCallArgs[0].status).toBe('completed');
    expect(lastCallArgs[0].progress).toBe(100);
    expect(lastCallArgs[1].completedCount).toBe(1);
  });

  it('should clear completed tasks', async () => {
    const file = createMockImageFile('img.jpg');
    const id = manager.enqueue(file);

    await manager.waitForTask(id);

    expect(manager.getTask(id)).toBeDefined();
    manager.clearCompleted();
    expect(manager.getTask(id)).toBeUndefined();
  });

  it('should handle failed task optimizations', async () => {
    vi.spyOn(optimizerModule, 'optimizeImage').mockRejectedValue(new Error('Optimization error'));

    const file = createMockImageFile('img.jpg');
    const id = manager.enqueue(file);

    await expect(manager.waitForTask(id)).rejects.toThrow('Optimization error');

    const task = manager.getTask(id);
    expect(task?.status).toBe('failed');
    expect(task?.error).toBeDefined();

    vi.restoreAllMocks();
  });
});
