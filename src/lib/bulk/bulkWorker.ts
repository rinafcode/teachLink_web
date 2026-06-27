import { EventEmitter } from 'events';

export type WorkerStatus = 'idle' | 'running' | 'paused' | 'cancelled' | 'completed' | 'error';

export interface WorkerProgressEvent {
  type:
    | 'progress'
    | 'item-complete'
    | 'item-error'
    | 'batch-complete'
    | 'complete'
    | 'error'
    | 'cancelled';
  payload: {
    completed: number;
    total: number;
    percentage: number;
    currentItem?: unknown;
    error?: Error;
    successfulCount?: number;
    failedCount?: number;
    batchIndex?: number;
  };
}

export interface BulkWorkerOptions<T> {
  items: T[];
  operation: (item: T, signal?: AbortSignal) => Promise<unknown>;
  batchSize?: number;
  concurrency?: number;
  onItemSuccess?: (item: T, result: unknown) => void;
  onItemError?: (item: T, error: Error) => void;
  onBatchComplete?: (
    batchIndex: number,
    batchResults: Array<{ item: T; success: boolean; result?: unknown; error?: Error }>,
  ) => void;
}

interface WorkerResult<T> {
  item: T;
  success: boolean;
  result?: unknown;
  error?: Error;
}

/**
 * BulkWorker - Background processor for bulk operations with progress tracking.
 *
 * Uses an async queue pattern to process items in batches with configurable concurrency.
 * Emits progress events throughout the operation lifecycle.
 */
export class BulkWorker<T> extends EventEmitter {
  private options: Required<
    Omit<BulkWorkerOptions<T>, 'onItemSuccess' | 'onItemError' | 'onBatchComplete'>
  >;
  private status: WorkerStatus = 'idle';
  private abortController: AbortController | null = null;
  private results: WorkerResult<T>[] = [];
  private batchSize: number;
  private concurrency: number;

  constructor(options: BulkWorkerOptions<T>) {
    super();
    this.options = {
      items: options.items,
      operation: options.operation,
      batchSize: options.batchSize || 50,
      concurrency: options.concurrency || 3,
    };
    this.batchSize = this.options.batchSize;
    this.concurrency = this.options.concurrency;

    if (options.onItemSuccess) this.onItemSuccess = options.onItemSuccess;
    if (options.onItemError) this.onItemError = options.onItemError;
    if (options.onBatchComplete) this.onBatchComplete = options.onBatchComplete;
  }

  private onItemSuccess: ((item: T, result: unknown) => void) | undefined;
  private onItemError: ((item: T, error: Error) => void) | undefined;
  private onBatchComplete:
    ((batchIndex: number, batchResults: WorkerResult<T>[]) => void) | undefined;

  /**
   * Start processing.
   */
  async start(): Promise<void> {
    if (this.status === 'running') return;

    this.abortController = new AbortController();
    this.status = 'running';
    this.results = [];

    try {
      await this.processItems(this.abortController.signal);
      this.status = 'completed';
      this.emit('complete', { status: this.status, results: this.results });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.status = 'cancelled';
        this.emit('cancelled', { status: this.status, results: this.results });
      } else {
        this.status = 'error';
        this.emit('error', {
          error: error instanceof Error ? error : new Error(String(error)),
          results: this.results,
        });
      }
    }
  }

  /**
   * Pause processing.
   */
  pause(): void {
    if (this.status === 'running') {
      this.status = 'paused';
    }
  }

  /**
   * Resume processing after pause.
   */
  resume(): void {
    if (this.status === 'paused') {
      this.status = 'running';
    }
  }

  /**
   * Cancel processing.
   */
  cancel(): void {
    if (this.status === 'running' || this.status === 'paused') {
      this.abortController?.abort();
      this.status = 'cancelled';
    }
  }

  /**
   * Get current status.
   */
  getStatus(): WorkerStatus {
    return this.status;
  }

  /**
   * Get results collected so far.
   */
  getResults(): WorkerResult<T>[] {
    return [...this.results];
  }

  /**
   * Get progress stats.
   */
  getProgress(): { completed: number; total: number; percentage: number } {
    const total = this.options.items.length;
    const completed = this.results.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  }

  /**
   * Process items in batches with concurrency control.
   */
  private async processItems(signal: AbortSignal): Promise<void> {
    const { items, operation } = this.options;
    const total = items.length;
    let batchIndex = 0;

    for (let i = 0; i < total; i += this.batchSize) {
      if (signal.aborted) {
        throw new DOMException('Operation was aborted', 'AbortError');
      }

      const batch = items.slice(i, i + this.batchSize);
      const batchPromises = batch.map(async (item) => {
        if (signal.aborted) {
          return {
            item,
            success: false,
            error: new Error('Operation cancelled'),
          } as WorkerResult<T>;
        }

        try {
          const result = await operation(item, signal);
          return { item, success: true, result } as WorkerResult<T>;
        } catch (error) {
          return {
            item,
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
          } as WorkerResult<T>;
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      this.results.push(...batchResults);

      // Emit item-level events
      batchResults.forEach((result) => {
        if (result.success) {
          this.onItemSuccess?.(result.item, result.result);
          this.emit('item-success', { item: result.item, result: result.result });
        } else {
          this.onItemError?.(result.item, result.error!);
          this.emit('item-error', { item: result.item, error: result.error });
        }
      });

      this.onBatchComplete?.(batchIndex, batchResults);
      this.emit('batch-complete', { batchIndex, batchResults });

      // Emit overall progress
      const progress = this.getProgress();
      this.emit('progress', {
        type: 'progress',
        payload: {
          ...progress,
          successfulCount: this.results.filter((r) => r.success).length,
          failedCount: this.results.filter((r) => !r.success).length,
          batchIndex,
        },
      });

      batchIndex++;
    }
  }

  /**
   * Destroy the worker and clean up.
   */
  destroy(): void {
    this.removeAllListeners();
    this.abortController?.abort();
    this.results = [];
    this.status = 'idle';
  }
}

/**
 * Create a bulk worker instance.
 */
export function createBulkWorker<T>(options: BulkWorkerOptions<T>): BulkWorker<T> {
  return new BulkWorker(options);
}
