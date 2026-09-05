import { describe, expect, it, vi } from 'vitest';

import { ExportNotificationService } from '../notification-service';

describe('ExportNotificationService', () => {
  it('queues a failed export notification with the failed status', async () => {
    const enqueue = vi.fn().mockResolvedValue({ success: true, provider: 'mock' as const });
    const service = new ExportNotificationService({ enqueue } as any);

    await service.notifyExportFailed({
      jobId: 'job-123',
      userId: 'user-1',
      email: 'ops@example.com',
      fileName: 'monthly-report.csv',
      error: 'Export generation crashed',
    });

    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        to: { email: 'ops@example.com' },
        subject: 'Export Failed: monthly-report.csv',
        tags: ['export-scheduler', 'failed'],
        idempotencyKey: 'export-notification:job-123:failed',
      }),
    );
  });

  it('does not throw if the queue reports a failed delivery', async () => {
    const enqueue = vi.fn().mockResolvedValue({
      success: false,
      provider: 'mock' as const,
      error: 'SMTP unavailable',
    });
    const service = new ExportNotificationService({ enqueue } as any);

    await expect(
      service.notifyExportFailed({
        jobId: 'job-456',
        userId: 'user-2',
        email: 'ops@example.com',
        error: 'SMTP unavailable',
      }),
    ).resolves.toBeUndefined();
  });
});
