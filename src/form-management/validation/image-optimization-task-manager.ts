import { optimizeImage, ImageOptimizationOptions } from './image-optimizer.js';

export interface ImageOptimizationTask {
  id: string;
  file: File;
  options: ImageOptimizationOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0 to 100
  result?: File;
  error?: Error;
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ImageOptimizationTaskState {
  tasks: Map<string, ImageOptimizationTask>;
  activeCount: number;
  pendingCount: number;
  completedCount: number;
  failedCount: number;
  cancelledCount: number;
}

export interface TaskManagerOptions {
  maxConcurrentTasks?: number;
}

export type TaskChangeCallback = (
  task: ImageOptimizationTask,
  state: ImageOptimizationTaskState,
) => void;

export class ImageOptimizationTaskManager {
  private tasks: Map<string, ImageOptimizationTask> = new Map();
  private queue: string[] = []; // List of pending task IDs
  private activeTasks: Set<string> = new Set(); // Set of currently processing task IDs
  private maxConcurrentTasks: number = 3;
  private callbacks: Set<TaskChangeCallback> = new Set();

  // Maps task ID to its promise resolvers/rejecters
  private resolvers: Map<
    string,
    Array<{ resolve: (file: File) => void; reject: (err: Error) => void }>
  > = new Map();

  constructor(options?: TaskManagerOptions) {
    if (options?.maxConcurrentTasks !== undefined) {
      this.maxConcurrentTasks = options.maxConcurrentTasks;
    }
  }

  /**
   * Enqueues a new image file for optimization.
   * Returns the unique task ID.
   */
  enqueue(file: File, options: ImageOptimizationOptions = {}): string {
    const id = `task_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;

    const task: ImageOptimizationTask = {
      id,
      file,
      options,
      status: 'pending',
      progress: 0,
      queuedAt: new Date(),
    };

    this.tasks.set(id, task);
    this.queue.push(id);

    this.notify(task);

    // Process queue asynchronously
    setTimeout(() => this.processQueue(), 0);

    return id;
  }

  /**
   * Cancels a task if it is pending or processing.
   */
  cancel(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
      return false;
    }

    const previousStatus = task.status;
    task.status = 'cancelled';
    task.completedAt = new Date();
    task.progress = 100;

    if (previousStatus === 'pending') {
      this.queue = this.queue.filter((id) => id !== taskId);
    } else if (previousStatus === 'processing') {
      this.activeTasks.delete(taskId);
    }

    const error = new Error(`Task ${taskId} was cancelled`);
    this.rejectTaskPromises(taskId, error);

    this.notify(task);

    // Process next tasks in queue
    setTimeout(() => this.processQueue(), 0);

    return true;
  }

  /**
   * Cancels all pending and processing tasks.
   */
  cancelAll(): void {
    const activeAndPending = [...this.queue, ...Array.from(this.activeTasks)];
    activeAndPending.forEach((id) => this.cancel(id));
  }

  /**
   * Get validation/optimization statistics
   */
  getTaskState(): ImageOptimizationTaskState {
    const state: ImageOptimizationTaskState = {
      tasks: new Map(this.tasks),
      activeCount: this.activeTasks.size,
      pendingCount: this.queue.length,
      completedCount: 0,
      failedCount: 0,
      cancelledCount: 0,
    };

    this.tasks.forEach((task) => {
      if (task.status === 'completed') state.completedCount++;
      else if (task.status === 'failed') state.failedCount++;
      else if (task.status === 'cancelled') state.cancelledCount++;
    });

    return state;
  }

  /**
   * Gets a specific task by ID.
   */
  getTask(taskId: string): ImageOptimizationTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Gets all tasks.
   */
  getTasks(): ImageOptimizationTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Subscribe to task change notifications.
   * Returns an unsubscribe function.
   */
  subscribe(callback: TaskChangeCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Wait for a task to complete or fail/cancel.
   */
  waitForTask(taskId: string): Promise<File> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return Promise.reject(new Error(`Task ${taskId} not found`));
    }

    if (task.status === 'completed' && task.result) {
      return Promise.resolve(task.result);
    }
    if (task.status === 'failed') {
      return Promise.reject(task.error || new Error(`Task ${taskId} failed`));
    }
    if (task.status === 'cancelled') {
      return Promise.reject(new Error(`Task ${taskId} was cancelled`));
    }

    return new Promise<File>((resolve, reject) => {
      if (!this.resolvers.has(taskId)) {
        this.resolvers.set(taskId, []);
      }
      this.resolvers.get(taskId)!.push({ resolve, reject });
    });
  }

  /**
   * Wait for all current tasks in the queue to complete.
   */
  async waitForAll(): Promise<File[]> {
    const promises = Array.from(this.tasks.keys()).map((id) =>
      this.waitForTask(id).catch(() => null),
    );
    const results = await Promise.all(promises);
    return results.filter((res): res is File => res !== null);
  }

  /**
   * Clears completed, failed, or cancelled tasks from internal memory.
   */
  clearCompleted(): void {
    this.tasks.forEach((task, id) => {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.tasks.delete(id);
        this.resolvers.delete(id);
      }
    });
  }

  /**
   * Get the concurrency limit.
   */
  getMaxConcurrentTasks(): number {
    return this.maxConcurrentTasks;
  }

  /**
   * Update the concurrency limit.
   */
  setMaxConcurrentTasks(limit: number): void {
    this.maxConcurrentTasks = limit;
    // Process queue in case limit was increased
    setTimeout(() => this.processQueue(), 0);
  }

  /**
   * Processes the next task in the queue if capacity is available.
   */
  private async processQueue(): Promise<void> {
    if (this.activeTasks.size >= this.maxConcurrentTasks || this.queue.length === 0) {
      return;
    }

    const taskId = this.queue.shift()!;
    const task = this.tasks.get(taskId);

    // Check if task was cancelled while in queue
    if (!task || task.status === 'cancelled') {
      this.processQueue();
      return;
    }

    task.status = 'processing';
    task.startedAt = new Date();
    task.progress = 5;
    this.activeTasks.add(taskId);

    this.notify(task);

    try {
      const optimizedOptions: ImageOptimizationOptions = {
        ...task.options,
        onProgress: (p) => {
          // Verify task has not been cancelled in the meantime
          if (task.status === 'processing') {
            task.progress = Math.max(task.progress, p);
            this.notify(task);
          }
        },
      };

      const result = await optimizeImage(task.file, optimizedOptions);

      // Verify task hasn't been cancelled during execution
      if (task.status === 'processing') {
        task.status = 'completed';
        task.progress = 100;
        task.result = result;
        task.completedAt = new Date();
        this.activeTasks.delete(taskId);

        this.resolveTaskPromises(taskId, result);
        this.notify(task);
      }
    } catch (err) {
      if (task.status === 'processing') {
        const error = err instanceof Error ? err : new Error(String(err));
        task.status = 'failed';
        task.error = error;
        task.completedAt = new Date();
        this.activeTasks.delete(taskId);

        this.rejectTaskPromises(taskId, error);
        this.notify(task);
      }
    }

    // Process next task
    setTimeout(() => this.processQueue(), 0);
  }

  private notify(task: ImageOptimizationTask): void {
    const state = this.getTaskState();
    this.callbacks.forEach((cb) => {
      try {
        cb(task, state);
      } catch (err) {
        console.error('Error in task manager change callback:', err);
      }
    });
  }

  private resolveTaskPromises(taskId: string, file: File): void {
    const list = this.resolvers.get(taskId);
    if (list) {
      list.forEach(({ resolve }) => resolve(file));
      this.resolvers.delete(taskId);
    }
  }

  private rejectTaskPromises(taskId: string, err: Error): void {
    const list = this.resolvers.get(taskId);
    if (list) {
      list.forEach(({ reject }) => reject(err));
      this.resolvers.delete(taskId);
    }
  }
}
