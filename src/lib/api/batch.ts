/**
 * Request Batching Utility (#496)
 *
 * Collects multiple requests within a tick window and sends them as a single
 * batched request, reducing network overhead for Help Documentation lookups.
 */

export interface BatchRequest {
  id: string;
  path: string;
}

export interface BatchResponse<T = unknown> {
  id: string;
  data?: T;
  error?: string;
}

type Resolver<T> = {
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

interface PendingItem<T> {
  request: BatchRequest;
  resolver: Resolver<T>;
}

export interface BatcherOptions {
  /** Max items per batch (default: 20) */
  maxBatchSize?: number;
  /** Delay in ms before flushing (default: 10) */
  debounceMs?: number;
  /** Function that executes the batch */
  executor: (requests: BatchRequest[]) => Promise<BatchResponse[]>;
}

/**
 * Creates a request batcher that collects individual requests and sends them
 * together in a single call.
 */
export function createBatcher<T = unknown>(options: BatcherOptions) {
  const { maxBatchSize = 20, debounceMs = 10, executor } = options;
  const pending: PendingItem<T>[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  function flush() {
    timer = null;
    if (pending.length === 0) return;

    const batch = pending.splice(0, maxBatchSize);
    const requests = batch.map((item) => item.request);

    executor(requests)
      .then((responses) => {
        const responseMap = new Map(responses.map((r) => [r.id, r]));
        for (const item of batch) {
          const res = responseMap.get(item.request.id);
          if (!res) {
            item.resolver.reject(new Error(`No response for request ${item.request.id}`));
          } else if (res.error) {
            item.resolver.reject(new Error(res.error));
          } else {
            item.resolver.resolve(res.data as T);
          }
        }
      })
      .catch((err) => {
        for (const item of batch) {
          item.resolver.reject(err);
        }
      });

    // If more items remain (exceeded maxBatchSize), schedule another flush
    if (pending.length > 0) {
      timer = setTimeout(flush, 0);
    }
  }

  function schedule() {
    if (timer === null) {
      timer = setTimeout(flush, debounceMs);
    }
  }

  /**
   * Queue a single request into the batch.
   * Returns a promise that resolves when the batch response arrives.
   */
  function queue(request: BatchRequest): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      pending.push({ request, resolver: { resolve, reject } });
      schedule();
    });
  }

  /** Immediately flush any pending requests (useful in tests). */
  function flushNow() {
    if (timer !== null) {
      clearTimeout(timer);
    }
    flush();
  }

  return { queue, flushNow };
}
