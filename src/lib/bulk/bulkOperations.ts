import { apiClient } from '@lib/api';

export type BulkOperationType = 'create' | 'update' | 'delete';

export interface BulkProgress {
  completed: number;
  total: number;
  percentage: number;
  currentItem?: unknown;
}

export interface BulkSuccessItem<T> {
  item: T;
  result: unknown;
}

export interface BulkFailedItem<T> {
  item: T;
  error: Error;
}

export interface BulkResult<T> {
  successful: BulkSuccessItem<T>[];
  failed: BulkFailedItem<T>[];
  total: number;
  completed: number;
  cancelled: boolean;
}

export interface BulkOptions {
  /** Batch size for processing (default: 50) */
  batchSize?: number;
  /** Maximum number of concurrent operations (default: 10) */
  concurrency?: number;
  /** Progress callback */
  onProgress?: (progress: BulkProgress) => void;
  /** Cancellation token */
  signal?: AbortSignal;
  /** API endpoint override */
  endpoint?: string;
}

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_CONCURRENCY = 10;

/**
 * A simple semaphore to limit concurrency of async operations.
 */
class Semaphore {
  private capacity: number;
  private active = 0;
  private waiters: Array<(
    () => void
  OK> = [];

  constructor(capacity: number) {
    this.capacity = Math.max(1, Math.floor(capacity));
  }

  async acquire(): Promise<void> {
    if (this.active < this.capacity) {
      this.active++;
      return;
    }
    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  release(): void {
    this.active--;
    const next = this.waiters.shift();
    if (next) {
      this.active++;
      next();
    }
  }
}

/**
 * Generic bulk operation processor with batching, progress tracking, cancellation,
 * and bounded concurrency via a semaphore.
 */
async function processBulkOperation<T extends { id?: string }>(
  items: T[],
  operation: BulkOperationType,
  options: BulkOptions = {},
): Promise<BulkResult<T>> {
  const { batchSize = DEFAULT_BATCH_SIZE, concurrency = DEFAULT_CONCURRENCY, onProgress, signal, endpoint } = options;
  const successful: BulkSuccessItem<T>[] = [];
  const failed: BulkFailedItem<T>[] = [];
  let completed = 0;
  let cancelled = false;

  const total = items.length;
  const endpointBase = endpoint || '/api/bulk';
  const semaphore = new Semaphore(concurrency);

  const reportProgress = (currentItem?: unknown) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    onProgress?.({ completed, total, percentage, currentItem });
  };

  // Process in batches
  for (let i = 0; i < total; i += batchSize) {
    if (signal?.aborted) {
      cancelled = true;
      break;
    }

    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(async (item) => {
      if (signal?.aborted) {
        return { item, success: false, error: new Error('Operation cancelled') } as const;
      }

      await semaphore.acquire();
      try {
        let result: unknown;
        const url = `${endpointBase}/${operation}`;

        switch (operation) {
          case 'create':
            result = await apiClient.post(url, item);
            break;
          case 'update':
            if (!item.id) throw new Error('Item missing id for update');
            result = await apiClient.put(`${url}/${item.id}`, item);
            break;
          case 'delete':
            const id = typeof item === 'string' ? item : item.id;
            if (!id) throw new Error('Item missing id for delete');
            result = await apiClient.delete(`${url}/${id}`);
            break;
        }
        return { item, success: true, result } as const;
      } catch (error) {
        return {
          item,
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
        } as const;
      } finally {
        semaphore.release();
      }
    });

    const batchResults = await Promise.all(batchPromises);

    for (const result of batchResults) {
      if (result.success) {
        successful.push({ item: result.item, result: result.result });
      } else {
        failed.push({ item: result.item, error: result.error });
      }
      completed++;
      reportProgress(result.item);
    }
  }

  reportProgress();

  return { successful, failed, total, completed, cancelled };
}

/**
 * Bulk create multiple items.
 */
export async function bulkCreate<T extends Record<string, unknown>>(
  items: T[],
  options: BulkOptions = {},
): Promise<BulkResult<T>> {
  return processBulkOperation(items, 'create', options);
}

/**
 * Bulk update multiple items.
 */
export async function bulkUpdate<T extends { id: string }>(
  items: T[],
  options: BulkOptions = {},
): Promise<BulkResult<T>> {
  return processBulkOperation(items, 'update', options);
}

/**
 * Bulk delete multiple items (by id string or items with id property).
 */
export async function bulkDelete<T extends { id?: string }>(
  items: T[],
  options: BulkOptions = {},
): Promise<BulkResult<T>> {
  return processBulkOperation(items, 'delete', options);
}

/**
 * Create a cancellable bulk operation token.
 */
export function createCancellationToken(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
}
