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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createJobId(): string {
  return `email_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export class EmailQueue {
  private readonly provider: EmailProvider;
  private readonly options: QueueOptions;
  private readonly queue: QueueJob[] = [];
  private processing = 0;

  constructor(provider: EmailProvider, options?: Partial<QueueOptions>) {
    this.provider = provider;
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  enqueue(message: EmailMessage): Promise<EmailSendResult> {
    return new Promise((resolve) => {
      this.queue.push({ id: createJobId(), message, attempts: 0 });
      this.process(resolve);
    });
  }

  private process(resolve: (result: EmailSendResult) => void): void {
    while (this.processing < this.options.maxConcurrent && this.queue.length > 0) {
      const nextJob = this.queue.shift();
      if (!nextJob) {
        return;
      }

      this.processing += 1;
      void this.runJob(nextJob)
        .then((result) => resolve(result))
        .finally(() => {
          this.processing -= 1;
          this.process(resolve);
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
        await delay(this.options.retryDelayMs * job.attempts);
      }
    }

    return {
      ...result,
      error: `Queue failed after ${job.attempts} attempts: ${result.error ?? 'Unknown error'}`,
    };
  }
}
