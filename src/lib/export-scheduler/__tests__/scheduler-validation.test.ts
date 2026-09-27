import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/queue', () => ({
  taskQueue: { register: vi.fn(), enqueue: vi.fn(() => ({ id: 'job-1' })) },
}));

vi.mock('../storage', () => ({
  getSchedule: vi.fn(),
  getDueSchedules: vi.fn(async () => []),
  updateScheduleNextRun: vi.fn(async () => undefined),
  getTemplate: vi.fn(),
  addHistory: vi.fn(),
}));

vi.mock('../exporter', () => ({
  exportData: vi.fn(),
  fetchDataForTemplate: vi.fn(),
}));

vi.mock('../notification-service', () => ({
  notificationService: { notifyExportComplete: vi.fn(), notifyExportFailed: vi.fn() },
}));

import { ExportSchedulerService } from '../scheduler-service';
import type { ExportSchedule } from '../types';

const schedule = (overrides: Partial<ExportSchedule> = {}): ExportSchedule =>
  ({
    id: 'schedule-1',
    userId: 'user-1',
    templateId: 'template-1',
    frequency: 'daily',
    emailDelivery: false,
    ...overrides,
  }) as ExportSchedule;

let service: ExportSchedulerService;

beforeEach(() => {
  service = new ExportSchedulerService();
});

describe('validateSchedule', () => {
  it('accepts a valid cron expression', () => {
    const result = service.validateSchedule(schedule({ cronExpression: '0 9 * * 1-5' }));

    expect(result.valid).toBe(true);
    expect(result.cronExpression).toBe('0 9 * * 1-5');
    expect(result.errors).toEqual([]);
  });

  // An invalid expression was accepted silently and the job simply never ran,
  // with nothing to tell the user why.
  it('rejects an invalid expression and names the field', () => {
    const result = service.validateSchedule(schedule({ cronExpression: '0 0 * * 9' }));

    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('dayOfWeek');
  });

  it('falls back to the frequency when no expression is set', () => {
    const result = service.validateSchedule(schedule({ frequency: 'weekly' }));

    expect(result.valid).toBe(true);
    expect(result.cronExpression).toBe('0 0 * * 0');
  });

  it('reports the derived expression it validated', () => {
    expect(service.validateSchedule(schedule({ frequency: 'monthly' })).cronExpression).toBe(
      '0 0 1 * *',
    );
  });

  it('rejects an expression with the wrong field count', () => {
    const result = service.validateSchedule(schedule({ cronExpression: '0 0 *' }));

    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('expression');
  });
});
