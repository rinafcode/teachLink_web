/**
 * Wallet Connection Queue Management
 *
 * Serialises concurrent wallet connection requests so that only one
 * connection attempt runs at a time. Subsequent callers receive the
 * same Promise as the in-flight attempt, and the queue drains FIFO.
 *
 * Prevents the race condition where rapid successive `connect()` calls
 * would fire multiple wallet pop-ups and produce conflicting state updates.
 */

export type QueuedOperation<T> = () => Promise<T>;

export interface QueueEntry<T> {
  operation: QueuedOperation<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

export interface WalletQueueStats {
  queueLength: number;
  isProcessing: boolean;
  totalProcessed: number;
  totalFailed: number;
}

export class WalletConnectionQueue<T = unknown> {
  private queue: QueueEntry<T>[] = [];
  private isProcessing = false;
  private totalProcessed = 0;
  private totalFailed = 0;

  /**
   * Enqueue an operation. Returns a Promise that resolves / rejects when
   * the operation eventually runs and settles.
   */
  enqueue(operation: QueuedOperation<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ operation, resolve, reject });
      this.drain();
    });
  }

  /** Number of operations waiting (excluding any currently running). */
  get length(): number {
    return this.queue.length;
  }

  /** True while an operation is actively running. */
  get processing(): boolean {
    return this.isProcessing;
  }

  /** Returns a snapshot of runtime statistics. */
  getStats(): WalletQueueStats {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      totalProcessed: this.totalProcessed,
      totalFailed: this.totalFailed,
    };
  }

  /**
   * Discard all pending (not yet started) operations, rejecting their
   * Promises with the supplied reason.
   */
  clear(reason: string = 'Queue cleared'): void {
    const pending = this.queue.splice(0);
    for (const entry of pending) {
      entry.reject(new Error(reason));
    }
  }

  private drain(): void {
    if (this.isProcessing || this.queue.length === 0) return;

    const entry = this.queue.shift();
    if (!entry) return;

    this.isProcessing = true;

    entry.operation().then(
      (value) => {
        this.totalProcessed++;
        entry.resolve(value);
        this.isProcessing = false;
        this.drain();
      },
      (error: unknown) => {
        this.totalFailed++;
        entry.reject(error);
        this.isProcessing = false;
        this.drain();
      },
    );
  }
}

/**
 * Shared singleton queue for all wallet connection operations.
 * Using a singleton ensures that even if multiple hook instances are
 * mounted concurrently they all share the same serialisation lock.
 */
export const walletConnectionQueue = new WalletConnectionQueue();
