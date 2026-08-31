import {
  EmailMessage,
  EmailProvider,
  EmailSendResult,
  QueueJob,
  QueueOptions,
} from '@/lib/email/types';

const DEFAULT_OPTIONS: QueueOptions = {
  maxRetries: 3,
  retryDelayMs: 1500,
  maxConcurrent: 2,
};

/**
 * Upper bound for exponential backoff between retries, so a stuck queue
 * doesn't stall with ever-growing delays.
 */
const DEFAULT_MAX_RETRY_DELAY_MS = 30_000;

/**
 * How long a completed send is remembered for dedupe purposes.
 *
 * Long enough to cover the retries and redeliveries that cause duplicates,
 * short enough that a genuinely new message reusing a key days later is not
 * swallowed.
 */
export const DEFAULT_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createJobId(): string {
  return `email_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** A queued job plus the promise waiting on it. */
interface PendingJob extends QueueJob {
  resolve: (result: EmailSendResult) => void;
}

interface IdempotencyEntry {
  /** Resolves with the result of the send this key already started. */
  promise: Promise<EmailSendResult>;
  recordedAt: number;
}

export class EmailQueue {
  private readonly provider: EmailProvider;
  private readonly options: QueueOptions;
  private readonly queue: PendingJob[] = [];
  private readonly idempotency = new Map<string, IdempotencyEntry>();
  private readonly idempotencyTtlMs: number;
  private processing = 0;

  constructor(
    provider: EmailProvider,
    options?: Partial<QueueOptions> & { idempotencyTtlMs?: number },
  ) {
    this.provider = provider;
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    this.idempotencyTtlMs = options?.idempotencyTtlMs ?? DEFAULT_IDEMPOTENCY_TTL_MS;
  }

  /**
   * Queues a message for delivery.
   *
   * When the message carries an `idempotencyKey`, a second enqueue under the
   * same key does not send again — it returns the first send's result. This is
   * what stops a retried API call, a double-clicked button or a redelivered
   * webhook from sending the same password reset twice. The key is registered
   * before the send starts, so concurrent duplicates dedupe as well as
   * sequential ones.
   */
  enqueue(message: EmailMessage, now: number = Date.now()): Promise<EmailSendResult> {
    const key = message.idempotencyKey;

    if (key) {
      const existing = this.idempotency.get(key);
      if (existing && now - existing.recordedAt <= this.idempotencyTtlMs) {
        return existing.promise;
      }
    }

    const promise = new Promise<EmailSendResult>((resolve) => {
      this.queue.push({ id: createJobId(), message, attempts: 0, resolve });
      this.process();
    });

    if (key) {
      this.idempotency.set(key, { promise, recordedAt: now });

      // A send that failed outright is not a delivery, so it must not block a
      // later retry of the same key.
      void promise
        .then((result) => {
          if (!result.success) this.idempotency.delete(key);
        })
        .catch(() => this.idempotency.delete(key));
    }

    return promise;
  }

  /** Number of keys currently held for dedupe. */
  get idempotencyCacheSize(): number {
    return this.idempotency.size;
  }

  /** Drops keys older than the TTL. */
  pruneIdempotencyCache(now: number = Date.now()): number {
    let removed = 0;
    for (const [key, entry] of this.idempotency) {
      if (now - entry.recordedAt > this.idempotencyTtlMs) {
        this.idempotency.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  /** Forgets every recorded key. */
  clearIdempotencyCache(): void {
    this.idempotency.clear();
  }

  private process(): void {
    while (this.processing < this.options.maxConcurrent && this.queue.length > 0) {
      const nextJob = this.queue.shift();
      if (!nextJob) {
        return;
      }

      this.processing += 1;
      // Each job resolves its *own* caller. Sharing one resolver across the
      // queue meant an enqueue could resolve with an unrelated message's
      // result whenever two were in flight at once.
      void this.runJob(nextJob)
        .then((result) => nextJob.resolve(result))
        .finally(() => {
          this.processing -= 1;
          this.process();
        });
    }
  }

  private async runJob(job: QueueJob): Promise<EmailSendResult> {
    let result: EmailSendResult = {
      success: false,
      provider: this.provider.type,
      error: 'No attempt made',
    };

    while (job.attempts < this.options.maxRetries) {
      job.attempts += 1;
      result = await this.provider.send(job.message);

      if (result.success) {
        return result;
      }

      if (job.attempts < this.options.maxRetries) {
        const backoff = Math.min(
          this.options.retryDelayMs * 2 ** (job.attempts - 1),
          DEFAULT_MAX_RETRY_DELAY_MS,
        );
        await delay(backoff);
      }
    }

    return {
      ...result,
      error: `Queue failed after ${job.attempts} attempts: ${result.error ?? 'Unknown error'}`,
    };
  }
}
