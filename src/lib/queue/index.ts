/**
 * Lightweight Task Queue (#325)
 *
 * Runs async jobs in the background with configurable concurrency,
 * exponential-backoff retry, and a dead-letter queue for failed jobs.
 */

export type JobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface Job<T = unknown> {
  id: string;
  name: string;
  payload: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

export type JobHandler<T = unknown> = (job: Job<T>) => Promise<void>;

export interface QueueOptions {
  /** Max concurrent jobs (default: 3). */
  concurrency?: number;
  /** Max retry attempts per job (default: 3). */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff (default: 500). */
  retryDelay?: number;
}

let _idCounter = 0;
function nextId(): string {
  return `job-${Date.now()}-${++_idCounter}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TaskQueue {
  private queue: Job[] = [];
  private deadLetter: Job[] = [];
  private handlers = new Map<string, JobHandler<unknown>>();
  private running = 0;
  private opts: Required<QueueOptions>;

  constructor(options: QueueOptions = {}) {
    this.opts = {
      concurrency: options.concurrency ?? 3,
      maxAttempts: options.maxAttempts ?? 3,
      retryDelay: options.retryDelay ?? 500,
    };
  }

  /** Register a handler for a named job type. */
  register<T>(name: string, handler: JobHandler<T>): void {
    this.handlers.set(name, handler as JobHandler<unknown>);
  }

  /** Enqueue a new job and start processing. */
  enqueue<T>(name: string, payload: T, maxAttempts?: number): Job<T> {
    const job: Job<T> = {
      id: nextId(),
      name,
      payload,
      status: 'pending',
      attempts: 0,
      maxAttempts: maxAttempts ?? this.opts.maxAttempts,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.queue.push(job as Job<unknown>);
    this.tick();
    return job;
  }

  /** Jobs currently waiting or running. */
  get pending(): Job[] {
    return this.queue.filter((j) => j.status === 'pending' || j.status === 'running');
  }

  /** Jobs that exhausted all retry attempts. */
  get deadLetterQueue(): Job[] {
    return [...this.deadLetter];
  }

  /** Re-enqueue a dead-letter job for another attempt. */
  retry(jobId: string): boolean {
    const idx = this.deadLetter.findIndex((j) => j.id === jobId);
    if (idx === -1) return false;
    const [job] = this.deadLetter.splice(idx, 1);
    job.status = 'pending';
    job.attempts = 0;
    job.updatedAt = Date.now();
    this.queue.push(job);
    this.tick();
    return true;
  }

  private tick(): void {
    while (this.running < this.opts.concurrency) {
      const job = this.queue.find((j) => j.status === 'pending');
      if (!job) break;
      job.status = 'running';
      job.updatedAt = Date.now();
      this.running++;
      this.run(job).finally(() => {
        this.running--;
        this.tick();
      });
    }
  }

  private async run(job: Job): Promise<void> {
    const handler = this.handlers.get(job.name);
    if (!handler) {
      job.status = 'failed';
      job.lastError = `No handler registered for job type "${job.name}"`;
      job.updatedAt = Date.now();
      this.moveToDeadLetter(job);
      return;
    }

    for (let attempt = 1; attempt <= job.maxAttempts; attempt++) {
      job.attempts = attempt;
      job.updatedAt = Date.now();
      try {
        await handler(job);
        job.status = 'done';
        job.updatedAt = Date.now();
        this.removeFromQueue(job.id);
        return;
      } catch (err) {
        job.lastError = err instanceof Error ? err.message : String(err);
        if (attempt < job.maxAttempts) {
          const backoff = this.opts.retryDelay * Math.pow(2, attempt - 1);
          await delay(backoff);
        }
      }
    }

    job.status = 'failed';
    job.updatedAt = Date.now();
    this.moveToDeadLetter(job);
  }

  private removeFromQueue(id: string): void {
    const idx = this.queue.findIndex((j) => j.id === id);
    if (idx !== -1) this.queue.splice(idx, 1);
  }

  private moveToDeadLetter(job: Job): void {
    this.removeFromQueue(job.id);
    this.deadLetter.push(job);
  }
}

/** Shared application-level queue instance. */
export const taskQueue = new TaskQueue();
